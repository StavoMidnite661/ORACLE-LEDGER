
import { ethers } from 'ethers';

const RPC_URL = 'https://mainnet.base.org';
const TOKEN_ADDRESS = '0x65e75d0fc656a2e81ef17e9a2a8da58d82390422';

const ABI = [
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(TOKEN_ADDRESS, ABI, provider);

  try {
    const symbol = await contract.symbol();
    const decimals = await contract.decimals();
    console.log(`Token: ${symbol}`);
    console.log(`Decimals: ${decimals}`);
  } catch (error) {
    console.error("Error fetching decimals:", error);
  }
}

main();
