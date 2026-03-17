import { ethers } from 'ethers';

async function check() {
    const rpc = 'https://mainnet.base.org';
const address = '0x65e75d0fc656a2e81ef17e9a2a8da58d82390422';
    const provider = new ethers.JsonRpcProvider(rpc);
    
    try {
        const code = await provider.getCode(address);
        console.log(`Code at ${address} on Base: ${code}`);
        if (code === '0x') {
            console.log("CONFIRMED: Address is an EOA or empty on this network.");
        } else {
            console.log("Contract exists. Attempting call...");
            const contract = new ethers.Contract(address, ["function totalSupply() view returns (uint256)"], provider);
            const ts = await contract.totalSupply();
            console.log(`Total Supply: ${ts}`);
        }
    } catch (e) {
        console.error("Error during check:", e);
    }
}

check();
