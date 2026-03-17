
import { ethers } from 'ethers';

async function main() {
    // Configuration from ConsulCreditsService default
    const rpcUrl = 'https://base.llamarpc.com'; // Default in service
    const contractAddress = '0x65e75d0fc656a2e81ef17e9a2a8da58d82390422';

    console.log(`Connecting to RPC: ${rpcUrl}`);
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    try {
        const network = await provider.getNetwork();
        console.log(`Network Name: ${network.name}`);
        console.log(`Chain ID: ${network.chainId}`);

        if (network.chainId === BigInt(8453)) {
            console.log('✅ Connected to BASE Mainnet (Chain ID 8453)');
        } else if (network.chainId === BigInt(1)) {
            console.log('⚠️ Connected to ETHEREUM Mainnet (Chain ID 1)');
        } else {
            console.log(`⚠️ Connected to Chain ID ${network.chainId}`);
        }

        console.log(`Checking code at address: ${contractAddress}`);
        const code = await provider.getCode(contractAddress);

        if (code === '0x' || code === '0x0') {
            console.error('❌ NO CONTRACT found at this address on this network!');
        } else {
            console.log('✅ CONTRACT FOUND. Bytecode length:', code.length);
        }

    } catch (error) {
        console.error('Error connecting or verifying:', error);
    }
}

main();
