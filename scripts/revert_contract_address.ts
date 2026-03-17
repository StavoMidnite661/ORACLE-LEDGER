
import { db } from '../server/db.js';
import * as schema from '../shared/schema.js';
import { eq } from 'drizzle-orm';

async function main() {
  const ORIGINAL_SYSTEM_ADDRESS = '0x18042545890dd72c4023ee8eb22b14babb034666'; // fallback/original
  
  console.log(`Reverting Consul Credits Config in Database...`);
  console.log(`Restoring System Address: ${ORIGINAL_SYSTEM_ADDRESS}`);

  try {
    const existingConfigs = await db.select().from(schema.consulCreditsConfig).limit(1);

    if (existingConfigs.length > 0) {
      console.log(`Found existing config (ID: ${existingConfigs[0].id}). Updating...`);
      await db.update(schema.consulCreditsConfig)
        .set({
          contractAddress: ORIGINAL_SYSTEM_ADDRESS,
          // Keep the RPC URL update as that was valid/necessary
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
