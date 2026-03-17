
import { ethers } from 'ethers';

const RPC_URL = 'https://mainnet.base.org';
const USER_ADDRESS = '0x3d48e2Ea68bdadaF3Dd02fD8dcbB0a01c39c4133';
const WRAPPER_ADDRESS = '0x18042545890dd72c4023EE8eb22B14bAbb034666';
const TOKEN_ADDRESS = '0x65e75d0fc656a2e81ef17e9a2a8da58d82390422';

const WRAPPER_ABI = [
  "function isTokenSupported(address) view returns (bool)",
  "function supportedTokens(address) view returns (uint256)"
];

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wrapper = new ethers.Contract(WRAPPER_ADDRESS, WRAPPER_ABI, provider);
  const token = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, provider);

  console.log("--- DIAGONISTIC REPORT ---");

  // 1. Check Support
  const isSupported = await wrapper.isTokenSupported(TOKEN_ADDRESS);
  console.log(`1. Is Token Supported? ${isSupported}`);
  if (isSupported) {
    const rate = await wrapper.supportedTokens(TOKEN_ADDRESS);
    console.log(`   Exchange Rate: ${rate.toString()}`);
  }

  // 2. Check Balance
  const balance = await token.balanceOf(USER_ADDRESS);
  console.log(`2. User Balance: ${ethers.formatEther(balance)} usdSOVR`);

  // 3. Check Allowance
  const allowance = await token.allowance(USER_ADDRESS, WRAPPER_ADDRESS);
  console.log(`3. Allowance for Wrapper: ${ethers.formatEther(allowance)} usdSOVR`);
}

main();
