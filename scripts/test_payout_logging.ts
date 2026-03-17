import {
  spawn
} from 'child_process';
import {
  db
} from '../server/db.js';
import {
  directDepositRecipients,
  directDepositBankAccounts,
  directDepositPayouts,
  auditTrails,
  systemLogs,
  customers
} from '../shared/schema.js';
import {
  eq,
  desc,
  like
} from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

const MOCK_RECIPIENT_ID = 'TEST-RECIPIENT-FIX-VERIFY';
const MOCK_BANK_ID = 'TEST-BANK-FIX-VERIFY';
const PORT = 3005;

async function setupData() {
  console.log('--- Setting up Test Data ---');
  
  // Cleanup existing (just in case)
  await cleanupData();

  // Create Recipient
  await db.insert(directDepositRecipients).values({
    id: MOCK_RECIPIENT_ID,
    stripeAccountId: `acct_test_${Date.now()}`,
    firstName: 'Test',
    lastName: 'VerifyFix',
    email: 'verify@fix.test',
    verificationStatus: 'verified',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // Create Bank Account
  await db.insert(directDepositBankAccounts).values({
    id: MOCK_BANK_ID,
    recipientId: MOCK_RECIPIENT_ID,
    stripeBankAccountId: `ba_test_${Date.now()}`,
    accountHolderName: 'Test VerifyFix',
    bankName: 'Test Bank',
    routingNumber: '123456789',
    accountNumberLast4: '4321',
    accountType: 'checking',
    status: 'verified',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  console.log('Test data created.');
}

async function cleanupData() {
  // Delete Payouts for this recipient
  const payouts = await db.select().from(directDepositPayouts).where(eq(directDepositPayouts.recipientId, MOCK_RECIPIENT_ID));
  for (const p of payouts) {
      await db.delete(auditTrails).where(eq(auditTrails.entityId, p.id));
      // Log deletion is messy due to loose matching, skipping for now
      await db.delete(directDepositPayouts).where(eq(directDepositPayouts.id, p.id));
  }

  await db.delete(directDepositBankAccounts).where(eq(directDepositBankAccounts.recipientId, MOCK_RECIPIENT_ID));
  await db.delete(directDepositRecipients).where(eq(directDepositRecipients.id, MOCK_RECIPIENT_ID));
}

async function startService() {
  console.log('--- Starting Payment Service ---');
  
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['tsx', 'microservices/payment-gateway/index.ts'], {
      env: { ...process.env, PAYMENT_GATEWAY_PORT: PORT.toString() },
      stdio: ['ignore', 'pipe', 'pipe'], // capture stdout/stderr
      shell: true
    });

    child.stdout.on('data', (data) => {
      const msg = data.toString();
      // console.log(`[Service] ${msg}`);
      if (msg.includes(`Payment Gateway Service running on port ${PORT}`)) {
        resolve(child);
      }
    });

    child.stderr.on('data', (data) => {
        // console.error(`[Service Error] ${data}`);
    });
    
    child.on('error', (err) => reject(err));
  });
}

async function runTest() {
  await setupData();
  
  let serviceProcess;
  try {
    serviceProcess = await startService();
    console.log('Service started successfully.');

    console.log('--- Sending Request ---');
    const payload = {
      recipients: [{ recipientId: MOCK_RECIPIENT_ID, bankAccountId: MOCK_BANK_ID, amount: 75.50 }],
      scheduledPayoutDate: '2026-03-01'
    };

    const response = await fetch(`http://localhost:${PORT}/api/direct-deposit/payouts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`HTTP Error: ${response.status} ${await response.text()}`);
    
    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));

    if (!data.success || !data.payouts || data.payouts.length === 0) throw new Error('No payout created');
    
    const payoutId = data.payouts[0].id;
    console.log(`--- Verifying Logs for Payout: ${payoutId} ---`);
    
    // Wait for async logs
    await new Promise(r => setTimeout(r, 1000));

    const sLogs = await db.select().from(systemLogs).where(like(systemLogs.message, `%${payoutId}%`));
    const aLogs = await db.select().from(auditTrails).where(eq(auditTrails.entityId, payoutId));

    console.log(`System Logs Found: ${sLogs.length}`);
    sLogs.forEach(l => console.log(` [System] ${l.level}: ${l.message}`));

    console.log(`Audit Logs Found: ${aLogs.length}`);
    aLogs.forEach(l => console.log(` [Audit] ${l.action}: ${l.description}`));

    if (sLogs.length > 0 && aLogs.length > 0) {
      console.log('\n✅ VERIFICATION SUCCESS: All logs present.');
    } else {
      console.error('\n❌ VERIFICATION FAILED: Logs missing.');
      process.exit(1);
    }

  } catch (error) {
    console.error('Test Failed:', error);
    process.exit(1);
  } finally {
    if (serviceProcess) {
      console.log('Stopping service...');
      serviceProcess.kill();
    }
    await cleanupData(); // Optional: keep data for manual inspection if needed
    console.log('Cleanup complete.');
    process.exit(0);
  }
}

runTest();
