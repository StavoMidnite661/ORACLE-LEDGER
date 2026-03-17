
import { db } from '../server/db.js';
import * as schema from '../shared/schema.js';
import { eq } from 'drizzle-orm';

async function main() {
  // switching to official Base RPC or another reliable public one
  const NEW_RPC_URL = 'https://mainnet.base.org'; 
  
  console.log(`Updating RPC Provider in Database...`);
  console.log(`New RPC URL: ${NEW_RPC_URL}`);

  try {
    const existingConfigs = await db.select().from(schema.consulCreditsConfig).limit(1);

    if (existingConfigs.length > 0) {
      console.log(`Found existing config (ID: ${existingConfigs[0].id}). Updating RPC...`);
      await db.update(schema.consulCreditsConfig)
        .set({
          rpcUrl: NEW_RPC_URL,
        })
        .where(eq(schema.consulCreditsConfig.id, existingConfigs[0].id));
      console.log('Update successful.');
    } else {
      console.log('No existing config found. Skipping.');
    }
  } catch (error) {
    console.error('Failed to update database:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
