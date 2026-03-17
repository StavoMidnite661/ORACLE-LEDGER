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
  systemLogs
} from '../shared/schema.js';
import {
  eq,
  like
} from 'drizzle-orm';
import path from 'path';

const MOCK_RECIPIENT_ID = 'TEST-ISO-COMPLIANCE-001';
const MOCK_BANK_ID = 'TEST-BANK-ISO-001';
const PORT = 3005;

async function startService() {
  console.log('--- Starting Payment Service ---');
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['tsx', 'microservices/payment-gateway/index.ts'], {
      env: { ...process.env, PAYMENT_GATEWAY_PORT: PORT.toString() },
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true
    });

    child.stdout.on('data', (data) => {
      const msg = data.toString();
      if (msg.includes(`Payment Gateway Service running on port ${PORT}`)) {
        resolve(child);
      }
    });
    child.on('error', (err) => reject(err));
  });
}

async function runTest() {
  // Setup Data
  await db.insert(directDepositRecipients).values({
    id: MOCK_RECIPIENT_ID,
    stripeAccountId: `acct_iso_${Date.now()}`,
    firstName: 'ISO',
    lastName: 'Tester',
    email: 'iso@test.com',
    verificationStatus: 'verified'
  }).onConflictDoNothing();

  await db.insert(directDepositBankAccounts).values({
    id: MOCK_BANK_ID,
    recipientId: MOCK_RECIPIENT_ID,
    stripeBankAccountId: `ba_iso_${Date.now()}`,
    accountHolderName: 'ISO Tester',
    bankName: 'ISO Bank',
    routingNumber: '123456789',
    accountNumberLast4: '0000',
    accountType: 'checking',
    status: 'verified'
  }).onConflictDoNothing();

  let serviceProcess;
  try {
    serviceProcess = await startService();
    console.log('Service started.');

    const payload = {
      recipients: [{ recipientId: MOCK_RECIPIENT_ID, bankAccountId: MOCK_BANK_ID, amount: 123.45 }],
      scheduledPayoutDate: '2026-04-01'
    };

    const response = await fetch(`http://localhost:${PORT}/api/direct-deposit/payouts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    const data = await response.json();
    const payoutId = data.payouts[0].id;

    console.log(`Verifying compliance for Payout: ${payoutId}`);
    
    // Wait for async logs
    await new Promise(r => setTimeout(r, 1000));

    const audit = await db.select().from(auditTrails).where(eq(auditTrails.entityId, payoutId));
    
    if (audit.length === 0) throw new Error('No audit log found');
    
    const log = audit[0];
    console.log(`[Audit Standard]: ${log.regulatoryStandard}`);
    console.log(`[Audit Metadata]: ${log.metadata}`);

    if (log.regulatoryStandard === 'ISO20022_NACHA' && log.metadata?.includes('endToEndId')) {
      console.log('\n✅ COMPLIANCE VERIFIED: ISO 20022 Standard & End-to-End ID present.');
    } else {
      throw new Error('Compliance check failed');
    }

  } catch (err) {
    console.error('Test Failed:', err);
    process.exit(1);
  } finally {
    if (serviceProcess) serviceProcess.kill();
    // Cleanup
    await db.delete(directDepositPayouts).where(eq(directDepositPayouts.recipientId, MOCK_RECIPIENT_ID));
    await db.delete(directDepositBankAccounts).where(eq(directDepositBankAccounts.id, MOCK_BANK_ID));
    await db.delete(directDepositRecipients).where(eq(directDepositRecipients.id, MOCK_RECIPIENT_ID));
    process.exit(0);
  }
}

runTest();
