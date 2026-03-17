
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
const RPC_URL = process.env.ETHEREUM_RPC_URL || 'https://mainnet.base.org';
const PRIVATE_KEY = process.env.PRIVATE_KEY; 
const WRAPPER_ADDRESS = '0x18042545890dd72c4023EE8eb22B14bAbb034666';
const USDSOVR_ADDRESS = '0x65e75d0fc656a2e81ef17e9a2a8da58d82390422';

// 1 usdSOVR (6 decimals) = 1,000,000 units
// 1 ConsulCredit (18 decimals) = 1,000,000,000,000,000,000 units
// Target: 1 usdSOVR -> 1 ConsulCredit
// Wrapper Formula: credits = (amount * rate) / 1e18
// 1e18 = (1e6 * rate) / 1e18
// rate = 1e30
const EXCHANGE_RATE = '1000000000000000000000000000000'; // 1e30

const ABI = [
  "function setSupportedToken(address token, uint256 consulCreditsPerToken) external",
  "function isTokenSupported(address) view returns (bool)",
  "function supportedTokens(address) view returns (uint256)"
];

async function main() {
  if (!PRIVATE_KEY) {
    console.error("❌ PRIVATE_KEY is missing in .env or arguments.");
    console.log("Usage: PRIVATE_KEY=0x... node scripts/whitelist_usdsovr.js");
    process.exit(1);
  }

  console.log(`Connecting to ${RPC_URL}...`);
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  console.log(`Signer: ${wallet.address}`);

  const contract = new ethers.Contract(WRAPPER_ADDRESS, ABI, wallet);

  // Check current status
  const isSupported = await contract.isTokenSupported(USDSOVR_ADDRESS);
  if (isSupported) {
    const currentRate = await contract.supportedTokens(USDSOVR_ADDRESS);
    console.log(`⚠️ usdSOVR is ALREADY supported with rate: ${currentRate.toString()}`);
    if (currentRate.toString() === EXCHANGE_RATE) {
        console.log("✅ Rate is correct. No action needed.");
        return;
    }
    console.log(`Updating rate to ${EXCHANGE_RATE}...`);
  } else {
    console.log(`🚀 Whitelisting usdSOVR (${USDSOVR_ADDRESS}) with rate 1e30...`);
  }

  try {
    const tx = await contract.setSupportedToken(USDSOVR_ADDRESS, EXCHANGE_RATE);
    console.log(`Transaction sent! Hash: ${tx.hash}`);
    console.log("Waiting for confirmation...");
    await tx.wait();
    console.log("✅ Success! usdSOVR is now supported.");
  } catch (error) {
    console.error("❌ Transaction failed:", error);
  }
}

main();
