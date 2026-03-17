import { db } from '../server/db.js';
import * as schema from '../shared/schema.js';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('--- Seeding Direct Deposit Test Data ---');
  
  // 1. Create a test recipient if none exists
  const existingRecipients = await db.select().from(schema.directDepositRecipients);
  let recipientId;
  
  if (existingRecipients.length === 0) {
    console.log('Creating test recipient...');
    const [newRecipient] = await db.insert(schema.directDepositRecipients).values({
      stripeAccountId: 'acct_test_123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      verificationStatus: 'verified',
      accountStatus: 'active',
      payoutsEnabled: true
    }).returning();
    recipientId = newRecipient.id;
    console.log(`Created recipient: ${recipientId}`);
  } else {
    recipientId = existingRecipients[0].id;
    console.log(`Using existing recipient: ${recipientId}`);
    
    // Ensure it's verified for the test
    await db.update(schema.directDepositRecipients)
      .set({ verificationStatus: 'verified', payoutsEnabled: true })
      .where(eq(schema.directDepositRecipients.id, recipientId));
  }
  
  // 2. Create a test bank account if none exists
  const existingAccounts = await db.select()
    .from(schema.directDepositBankAccounts)
    .where(eq(schema.directDepositBankAccounts.recipientId, recipientId));
    
  if (existingAccounts.length === 0) {
    console.log('Creating test bank account...');
    await db.insert(schema.directDepositBankAccounts).values({
      recipientId: recipientId,
      stripeBankAccountId: 'ba_test_123',
      accountHolderName: 'John Doe',
      bankName: 'SOVR Bank',
      routingNumber: '110000000',
      accountNumberLast4: '1234',
      accountType: 'checking',
      status: 'verified',
      isVerified: true,
      isDefault: true
    });
    console.log('Created bank account.');
  } else {
    console.log('Bank account already exists.');
    // Ensure it's verified
    await db.update(schema.directDepositBankAccounts)
      .set({ isVerified: true, status: 'verified' })
      .where(eq(schema.directDepositBankAccounts.recipientId, recipientId));
  }
  
  console.log('--- Seeding Complete ---');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
