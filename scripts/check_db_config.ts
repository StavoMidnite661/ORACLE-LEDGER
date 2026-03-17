import { db } from '../server/db.js';
import * as schema from '../shared/schema.js';

async function checkConfig() {
  console.log('Checking consul_credits_config table...');
  try {
    const configs = await db.select().from(schema.consulCreditsConfig);
    console.log('Current Configs in DB:', JSON.stringify(configs, null, 2));
  } catch (error) {
    console.error('Error querying DB:', error);
  }
  process.exit(0);
}

checkConfig();