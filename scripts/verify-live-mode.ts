
// @ts-nocheck
import { ethers } from 'ethers';

const SERVICES = [
    { name: 'Legacy Monolith', url: 'http://localhost:3001/api/health', expectedRole: 'Ledger Core & Auth' },
    { name: 'API Gateway', url: 'http://localhost:3002/health', expectedRole: 'Gateway' },
    { name: 'Risk & Compliance', url: 'http://localhost:3003/health', expectedRole: 'Risk & Compliance' },
    { name: 'Blockchain Bridge', url: 'http://localhost:3004/health', expectedRole: 'Blockchain Bridge' },
    { name: 'Payment Gateway', url: 'http://localhost:3005/health', expectedRole: 'Payment Gateway' }
];

const colors = {
    red: (msg: string) => `\x1b[31m${msg}\x1b[0m`,
    green: (msg: string) => `\x1b[32m${msg}\x1b[0m`,
    blue: (msg: string) => `\x1b[34m${msg}\x1b[0m`,
    yellow: (msg: string) => `\x1b[33m${msg}\x1b[0m`,
    bold: (msg: string) => `\x1b[1m${msg}\x1b[0m`
};

async function checkService(service: { name: string, url: string, expectedRole?: string }) {
    try {
        const response = await fetch(service.url, {
            headers: { 
                'X-User-ID': 'admin',
                'X-User-Email': 'admin@sovr.test',
                'X-User-Role': 'admin'
            }
        });
        if (!response.ok) {
            console.log(colors.red(`❌ ${service.name}: Failed (Status ${response.status})`));
            return false;
        }
        const data = await response.json();
        console.log(colors.green(`✅ ${service.name}: OK`));
        return true;
    } catch (error) {
        console.log(colors.red(`❌ ${service.name}: connection refused or timeout`));
        return false;
    }
}

async function verifyConsulCreditsConfig() {
    console.log(colors.blue('\n--- Verifying Consul Credits Config ---'));
    try {
        const response = await fetch('http://localhost:3004/api/consul-credits/config', {
            headers: { 
                'X-User-ID': 'admin',
                'X-User-Email': 'admin@sovr.test'
            }
        });
        
        if (!response.ok) {
             console.log(colors.red(`❌ Config Fetch Failed: ${response.status}`));
             return;
        }

        const config = await response.json();
        console.log(colors.green(`✅ Config Fetched!`));
        console.log(`   Contract: ${config.contractAddress}`);
        console.log(`   Network: ${config.networkName}`);
        
        // Verify Blockchain Connection
        if (config.rpcUrl && config.contractAddress) {
             console.log(colors.blue('\n--- Verifying Blockchain Connection ---'));
             try {
                 const provider = new ethers.JsonRpcProvider(config.rpcUrl);
                 const network = await provider.getNetwork();
                 console.log(colors.green(`✅ Connected to RPC: ${network.name} (Chain ID: ${network.chainId})`));
                 
                 const code = await provider.getCode(config.contractAddress);
                 if (code === '0x' || code === '0x0') {
                     console.warn(colors.yellow(`⚠️  Contract Address ${config.contractAddress} has no bytecode`));
                 } else {
                     console.log(colors.green(`✅ Contract Bytecode Found at ${config.contractAddress}`));
                 }
             } catch (err) {
                 console.error(colors.red(`❌ Blockchain Connection Failed: ${err.message}`));
             }
        }

    } catch (error) {
        console.log(colors.red(`❌ Failed to fetch config: ${error.message}`));
    }
}

async function main() {
    console.log(colors.bold('\n🚀 ORACLE LEDGER: Live Mode Verification\n'));
    
    console.log(colors.blue('--- Checking Microservices ---'));
    let allPassed = true;
    for (const service of SERVICES) {
        const passed = await checkService(service);
        if (!passed) allPassed = false;
    }

    if (allPassed) {
        console.log(colors.green('\n✅ All Microservices are ONLINE'));
        await verifyConsulCreditsConfig();
    } else {
        // console.log(colors.red('\n❌ Some services failed to respond. Please start them with ./start-microservices.sh'));
        console.log(colors.red('\n❌ Some services failed to respond.'));
    }
}

main().catch(console.error);
