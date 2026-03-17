import { ethers } from 'ethers';

const RPC_URL = 'https://mainnet.base.org';
const WRAPPER_ADDRESS = '0x18042545890dd72c4023EE8eb22B14bAbb034666';
const TOKEN_ADDRESS = '0x65e75d0fc656a2e81ef17e9a2a8da58d82390422';

const ABI = [
  "function isTokenSupported(address) view returns (bool)",
  "function supportedTokens(address) view returns (uint256)"
];

async function checkSupport() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(WRAPPER_ADDRESS, ABI, provider);

  try {
    const isSupported = await contract.isTokenSupported(TOKEN_ADDRESS);
    console.log(`Is usdSOVR (${TOKEN_ADDRESS}) supported? ${isSupported}`);
    
    if (isSupported) {
        const rate = await contract.supportedTokens(TOKEN_ADDRESS);
        console.log(`Exchange Rate: ${rate.toString()}`);
    }
  } catch (error) {
    console.error("Error checking support:", error);
  }
}

checkSupport();
