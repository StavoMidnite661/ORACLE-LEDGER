
import { ethers } from 'ethers';

const RPC_URL = 'https://mainnet.base.org';
const USER_ADDRESS = '0x3d48e2Ea68bdadaF3Dd02fD8dcbB0a01c39c4133';
const WRAPPER_ADDRESS = '0x18042545890dd72c4023EE8eb22B14bAbb034666';

const WRAPPER_ABI = [
  "event TokenDeposited(address indexed user, address indexed token, uint256 tokenAmount, uint256 consulCreditsIssued, uint256 exchangeRate, string ledgerReference)",
  "event TokenWithdrawn(address indexed user, address indexed token, uint256 consulCreditsBurned, uint256 tokenAmount, uint256 exchangeRate, string ledgerReference)"
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(WRAPPER_ADDRESS, WRAPPER_ABI, provider);

  console.log(`Querying events for user: ${USER_ADDRESS}`);
  console.log(`Contract: ${WRAPPER_ADDRESS}`);
  
  try {
    // Filter for the user
    const filter = contract.filters.TokenDeposited(USER_ADDRESS);
    
    // Query last 10000 blocks
    const events = await contract.queryFilter(filter, -10000);
    console.log(`Found ${events.length} 'TokenDeposited' events.`);
    
    events.forEach((event, i) => {
        console.log(`\n--- Event ${i + 1} ---`);
        console.log(`Tx Hash: ${event.transactionHash}`);
        console.log(`Block: ${event.blockNumber}`);
        if ('args' in event) {
            console.log(`User: ${event.args[0]}`);
            console.log(`Token: ${event.args[1]}`);
            console.log(`Amount: ${ethers.formatUnits(event.args[2], 18)}`); // Assuming 18 decimals for now
            console.log(`CC Issued: ${ethers.formatUnits(event.args[3], 18)}`);
            console.log(`Ref: ${event.args[5]}`);
        }
    });

  } catch (error) {
    console.error("Error querying events:", error);
  }
}

main();
