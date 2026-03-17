
import fetch from 'node-fetch';

const BLOCKCHAIN_SERVICE = 'http://localhost:3004/api/rpc';
const GATEWAY_SERVICE = 'http://localhost:3002/api/rpc';

// usdSOVR on Base Mainnet
const CONTRACT_ADDRESS = '0x65e75d0fc656a2e81ef17e9a2a8da58d82390422';
const TOTAL_SUPPLY_SELECTOR = '0x18160ddd'; // totalSupply()

const payload = {
  jsonrpc: '2.0',
  method: 'eth_call',
  params: [
    {
      to: CONTRACT_ADDRESS,
      data: TOTAL_SUPPLY_SELECTOR
    },
    'latest'
  ],
  id: 1
};

async function testEndpoint(name: string, url: string) {
  console.log(`\n--- Testing ${name} (${url}) ---`);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    
    const text = await response.text();
    try {
      const json = JSON.parse(text);
      console.log('Response:', JSON.stringify(json, null, 2));
      
      if (json.error) {
        console.error('❌ RPC Error:', json.error);
      } else if (json.result) {
        console.log('✅ Success! Result:', json.result);
        const supply = BigInt(json.result).toString();
        console.log('Decoded Total Supply:', supply);
      }
    } catch (e) {
      console.error('❌ Invalid JSON response:', text.substring(0, 200));
    }
  } catch (error: any) {
    console.error(`❌ Connection Failed:`, error.message);
  }
}

async function run() {
  console.log('🔍 Starting RPC Proxy Debugger...');
  
  // 1. Test Blockchain Bridge Direct
  await testEndpoint('Blockchain Bridge Service', BLOCKCHAIN_SERVICE);

  // 2. Test Gateway Proxy
  await testEndpoint('API Gateway', GATEWAY_SERVICE);
}

run();
