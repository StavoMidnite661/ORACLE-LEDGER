
import { db } from '../server/db.js';
import * as schema from '../shared/schema.js';
import { eq } from 'drizzle-orm';

async function forceMigrate() {
  console.log('🚀 Forcing Database Migration to Base Mainnet...');
  try {
    const existing = await db.select().from(schema.consulCreditsConfig).limit(1);
    
    const baseConfig = {
      networkName: 'Base Mainnet',
      chainId: 8453,
      contractAddress: '0x65e75d0fc656a2e81ef17e9a2a8da58d82390422',
      rpcUrl: '/api/rpc',
      oracleIntegratorAddress: '0x3d48e2Ea68bdadaF3Dd02fD8dcbB0a01c39c4133',
      confirmationsRequired: 3,
      isEnabled: true,
      updatedAt: new Date()
    };

    if (existing.length > 0) {
      await db.update(schema.consulCreditsConfig)
        .set(baseConfig)
        .where(eq(schema.consulCreditsConfig.id, existing[0].id));
      console.log('✅ Updated existing configuration in DB.');
    } else {
      await db.insert(schema.consulCreditsConfig)
        .values({ id: 'default', ...baseConfig });
      console.log('✅ Inserted new Base Mainnet configuration into DB.');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
  process.exit(0);
}

forceMigrate();
