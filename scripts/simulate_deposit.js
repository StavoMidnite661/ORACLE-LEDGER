
import { ethers } from 'ethers';

const RPC_URL = 'https://mainnet.base.org';
const USER_ADDRESS = '0x3d48e2Ea68bdadaF3Dd02fD8dcbB0a01c39c4133';
const WRAPPER_ADDRESS = '0x18042545890dd72c4023EE8eb22B14bAbb034666';
const TOKEN_ADDRESS = '0x65e75d0fc656a2e81ef17e9a2a8da58d82390422';

const WRAPPER_ABI = [
  "function depositToken(address token, uint256 tokenAmount, string memory ledgerReference) external",
  "function paused() view returns (bool)"
];

const ERC20_ABI = [
  "function allowance(address, address) view returns (uint256)"
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wrapper = new ethers.Contract(WRAPPER_ADDRESS, WRAPPER_ABI, provider);
  const token = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, provider);

  // 1. Check Paused
  const isPaused = await wrapper.paused();
  console.log(`Is Contract Paused? ${isPaused}`);

  // 2. Simulate Deposit
  const amountToDeposit = ethers.parseUnits("5.0", 18); // Try the EXACT amount (5.0)
  
  // Check allowance for this specific amount
  const allowance = await token.allowance(USER_ADDRESS, WRAPPER_ADDRESS);
  console.log(`Allowance: ${ethers.formatUnits(allowance, 18)}`);
  
  if (allowance < amountToDeposit) {
    console.log("Skipping simulation: Allowance is less than amount to deposit.");
    return;
  }

  console.log(`Simulating deposit of 1.0 usdSOVR...`);
  
  try {
    // We use callStatic to simulate the transaction from the user's address
    await wrapper.depositToken.staticCall(
      TOKEN_ADDRESS, 
      amountToDeposit, 
      "SIMULATION-001", 
      { from: USER_ADDRESS }
    );
    console.log("✅ Simulation Successful! Transaction should succeed.");
  } catch (error) {
    console.error("❌ Simulation Failed:", error.reason || error.message || error);
    if (error.data) {
        // Try to decode generic revert
        console.error("Revert Data:", error.data);
    }
  }
}

main();
