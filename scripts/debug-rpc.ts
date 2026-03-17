import { ethers } from 'ethers';

const CONTRACT_ADDRESS = '0x742d35cc6bf4e79c3e5f6d4e3d0a8dd6b6e6a5a4'; // Lowercase
const RPC_URLS = [
    'https://mainnet.base.org',
    'https://base.publicnode.com',
    'https://1rpc.io/base',
    'https://base.meowrpc.com',
    'https://base-mainnet.public.blastapi.io'
];

async function checkRpc(url: string) {
    try {
        console.log(`Checking ${url}...`);
        const provider = new ethers.JsonRpcProvider(url);
        
        // 1. Check Network
        const network = await provider.getNetwork();
        console.log(`  - Chain ID: ${network.chainId}`);
        
        if (Number(network.chainId) !== 8453) {
            console.log(`  ❌ Wrong Chain ID!`);
            return;
        }

        // 2. Check Code
        const code = await provider.getCode(CONTRACT_ADDRESS);
        if (code === '0x') {
            console.log(`  ⚠️  No Bytecode found.`);
        } else {
            console.log(`  ✅ Bytecode found! Length: ${code.length}`);
        }
    } catch (error: any) {
        console.log(`  ❌ Error: ${error.message}`);
    }
}

async function main() {
    console.log(`🔍 Debugging Contract Visibility for ${CONTRACT_ADDRESS}`);
    
    for (const url of RPC_URLS) {
        await checkRpc(url);
        console.log('---');
    }
}

main().catch(console.error);
