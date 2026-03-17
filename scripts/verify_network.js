
import { ethers } from 'ethers';

const RPC_URLS = [
    'https://mainnet.base.org',
    'https://base.publicnode.com',
    'https://1rpc.io/base',
    'https://base.llamarpc.com'
];

const CONTRACT_ADDRESS = '0x65e75d0fc656a2e81ef17e9a2a8da58d82390422';

async function main() {
    console.log(`🔍 Verifying contract: ${CONTRACT_ADDRESS}`);

    for (const rpc of RPC_URLS) {
        console.log(`\nTesting connection to: ${rpc}`);
        try {
            const provider = new ethers.JsonRpcProvider(rpc);
            
            // 1. Check Network
            const network = await provider.getNetwork();
            console.log(`   ✅ Connected! Chain ID: ${network.chainId} (${network.name})`);
            
            if (network.chainId.toString() === '8453') {
                console.log('   ℹ️  Confirmed: This is BASE Mainnet.');
            } else if (network.chainId.toString() === '1') {
                console.log('   ⚠️  Warning: This is ETHEREUM Mainnet.');
            } else {
                console.log(`   ⚠️  Warning: Unknown Chain ID.`);
            }

            // 2. Check Contract Code
            const code = await provider.getCode(CONTRACT_ADDRESS);
            if (code === '0x' || code === '0x0') {
                console.log('   ❌ Result: NO CODE found at this address.');
            } else {
                console.log(`   ✅ Result: CONTRACT FOUND! (Bytecode size: ${code.length} bytes)`);
                return; // Success, exit
            }

        } catch (err) {
            console.log(`   ❌ Connection failed: ${err.message.split('(')[0]}`);
        }
    }
}

main().catch(console.error);
