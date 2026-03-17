
import { db } from '../server/db.js';
import * as schema from '../shared/schema.js';
import { eq } from 'drizzle-orm';

async function updateConfig() {
  try {
    console.log('Fetching current config...');
    const configs = await db.select().from(schema.consulCreditsConfig).limit(1);

    if (configs.length === 0) {
      console.log('No existing config found. Default fallback in code will be used (which is already updated).');
    } else {
      console.log('Current Config:', configs[0]);
      console.log('Updating RPC URL to /api/rpc...');
      
      const updated = await db.update(schema.consulCreditsConfig)
        .set({ rpcUrl: '/api/rpc' })
        .where(eq(schema.consulCreditsConfig.id, configs[0].id))
        .returning();
        
      console.log('Updated Config:', updated[0]);
    }
  } catch (error) {
    console.error('Failed to update config:', error);
  } finally {
    process.exit(0);
  }
}

updateConfig();
