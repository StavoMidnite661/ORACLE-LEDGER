
import { db } from '../server/db.js';
import * as schema from '../shared/schema.js';
import { eq } from 'drizzle-orm';

async function main() {
  const NEW_ADDRESS = '0x65e75d0fc656a2e81ef17e9a2a8da58d82390422'; // usdSOVR on Base
  const RPC_URL = '/api/rpc'; // Use local proxy to avoid CORS

  console.log(`Updating Consul Credits Config in Database...`);
  console.log(`New Address: ${NEW_ADDRESS}`);

  try {
    const existingConfigs = await db.select().from(schema.consulCreditsConfig).limit(1);

    if (existingConfigs.length > 0) {
      console.log(`Found existing config (ID: ${existingConfigs[0].id}). Updating...`);
      await db.update(schema.consulCreditsConfig)
        .set({
          contractAddress: NEW_ADDRESS,
          rpcUrl: RPC_URL,
          networkName: 'Base Mainnet',
          chainId: 8453,
          confirmationsRequired: 1,
          isEnabled: true,
          oracleIntegratorAddress: '0x3d48e2Ea68bdadaF3Dd02fD8dcbB0a01c39c4133'
        })
        .where(eq(schema.consulCreditsConfig.id, existingConfigs[0].id));
      console.log('Update successful.');
    } else {
      console.log('No existing config found. Inserting new config...');
      await db.insert(schema.consulCreditsConfig).values({
        id: 'default',
        contractAddress: NEW_ADDRESS,
        rpcUrl: RPC_URL,
        networkName: 'Base Mainnet',
        chainId: 8453,
        confirmationsRequired: 1,
        isEnabled: true,
        oracleIntegratorAddress: '0x3d48e2Ea68bdadaF3Dd02fD8dcbB0a01c39c4133'
      });
      console.log('Insert successful.');
    }
  } catch (error) {
    console.error('Failed to update database:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
