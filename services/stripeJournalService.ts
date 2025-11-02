/**
 * Stripe Journal Service Interface
 */

export interface StripePaymentData {
  id: string;
  amount: number;
  currency: string;
  customerId: string;
  description: string;
  applicationFee?: number;
  destination?: string;
  transferData?: {
    amount: number;
    destination: string;
  };
  metadata?: Record<string, string>;
  createdAt: Date;
}

export interface ACHPaymentData {
  id: string;
  amount: number;
  currency: string;
  customerId: string;
  bankAccountId: string;
  verificationStatus: 'pending' | 'verified' | 'failed';
  description: string;
  createdAt: Date;
}

export interface DirectDepositData {
  id: string;
  amount: number;
  currency: string;
  customerId: string;
  bankAccountId: string;
  reference: string;
  description: string;
  createdAt: Date;
}

export interface CustomerPaymentApplication {
  customerId: string;
  applicationId: string;
  amountApplied: number;
  applicationType: 'payment' | 'refund' | 'chargeback';
  appliedAt: Date;
}

export interface JournalEntry {
  id: string;
  transactionId: string;
  entryNumber: string;
  accountId: string;
  accountName: string;
  debit: number;
  credit: number;
  description: string;
  entryType: 'DEBIT' | 'CREDIT';
  currency: string;
  createdAt: Date;
  reversed: boolean;
  reversalEntryId?: string;
}

export interface DoubleEntryValidation {
  isValid: boolean;
  totalDebits: number;
  totalCredits: number;
  difference: number;
  errors: string[];
}

export class StripeJournalService {
  private journalEntries: JournalEntry[] = [];
  private chartOfAccounts: Map<string, { name: string; type: string; normalBalance: 'DEBIT' | 'CREDIT' }> = new Map();

  constructor() {
    this.initializeChartOfAccounts();
  }

  private initializeChartOfAccounts() {
    // Initialize chart of accounts
    this.chartOfAccounts.set('1000', { name: 'Cash', type: 'ASSET', normalBalance: 'DEBIT' });
    this.chartOfAccounts.set('1100', { name: 'Stripe Clearing Account', type: 'ASSET', normalBalance: 'DEBIT' });
    this.chartOfAccounts.set('2000', { name: 'Accounts Payable', type: 'LIABILITY', normalBalance: 'CREDIT' });
    this.chartOfAccounts.set('4000', { name: 'Payment Processing Revenue', type: 'REVENUE', normalBalance: 'CREDIT' });
    this.chartOfAccounts.set('5000', { name: 'Stripe Fees Expense', type: 'EXPENSE', normalBalance: 'DEBIT' });
  }

  async createJournalEntriesFromStripePayment(payment: StripePaymentData): Promise<JournalEntry[]> {
    const entries: JournalEntry[] = [];
    const transactionId = payment.id;

    // Calculate application fees
    const applicationFee = payment.applicationFee || 0;
    const netAmount = payment.amount - applicationFee;
    const totalDebits = payment.amount;
    const totalCredits = netAmount + applicationFee;

    // Debit: Stripe Clearing Account (for charge amount)
    entries.push({
      id: `je_${Date.now()}_1`,
      transactionId,
      entryNumber: `${transactionId}-001`,
      accountId: '1100',
      accountName: 'Stripe Clearing Account',
      debit: payment.amount,
      credit: 0,
      description: `Charge for payment ${payment.id}`,
      entryType: 'DEBIT',
      currency: payment.currency,
      createdAt: new Date(),
      reversed: false
    });

    // Credit: Payment Processing Revenue (for charge amount)
    entries.push({
      id: `je_${Date.now()}_2`,
      transactionId,
      entryNumber: `${transactionId}-002`,
      accountId: '4000',
      accountName: 'Payment Processing Revenue',
      debit: 0,
      credit: payment.amount,
      description: `Revenue from payment ${payment.id}`,
      entryType: 'CREDIT',
      currency: payment.currency,
      createdAt: new Date(),
      reversed: false
    });

    // If there's an application fee, create additional entries
    if (applicationFee > 0) {
      // Debit: Stripe Fees Expense
      entries.push({
        id: `je_${Date.now()}_3`,
        transactionId,
        entryNumber: `${transactionId}-003`,
        accountId: '5000',
        accountName: 'Stripe Fees Expense',
        debit: applicationFee,
        credit: 0,
        description: `Application fee for payment ${payment.id}`,
        entryType: 'DEBIT',
        currency: payment.currency,
        createdAt: new Date(),
        reversed: false
      });

      // Credit: Stripe Clearing Account
      entries.push({
        id: `je_${Date.now()}_4`,
        transactionId,
        entryNumber: `${transactionId}-004`,
        accountId: '1100',
        accountName: 'Stripe Clearing Account',
        debit: 0,
        credit: applicationFee,
        description: `Application fee applied to payment ${payment.id}`,
        entryType: 'CREDIT',
        currency: payment.currency,
        createdAt: new Date(),
        reversed: false
      });
    }

    // Validate double-entry bookkeeping
    const validation = this.validateDoubleEntry(entries);
    if (!validation.isValid) {
      throw new Error(`Invalid journal entries: ${validation.errors.join(', ')}`);
    }

    // Save entries
    this.journalEntries.push(...entries);

    return entries;
  }

  async createJournalEntriesFromACHPayment(achPayment: ACHPaymentData): Promise<JournalEntry[]> {
    const entries: JournalEntry[] = [];
    const transactionId = achPayment.id;

    // ACH payments are handled differently - they don't go through Stripe clearing
    // Debit: Cash (for net amount after any fees)
    entries.push({
      id: `ach_je_${Date.now()}_1`,
      transactionId,
      entryNumber: `${transactionId}-001`,
      accountId: '1000',
      accountName: 'Cash',
      debit: achPayment.amount,
      credit: 0,
      description: `ACH payment received ${achPayment.id}`,
      entryType: 'DEBIT',
      currency: achPayment.currency,
      createdAt: new Date(),
      reversed: false
    });

    // Credit: Payment Processing Revenue
    entries.push({
      id: `ach_je_${Date.now()}_2`,
      transactionId,
      entryNumber: `${transactionId}-002`,
      accountId: '4000',
      accountName: 'Payment Processing Revenue',
      debit: 0,
      credit: achPayment.amount,
      description: `ACH revenue from ${achPayment.id}`,
      entryType: 'CREDIT',
      currency: achPayment.currency,
      createdAt: new Date(),
      reversed: false
    });

    // Validate double-entry bookkeeping
    const validation = this.validateDoubleEntry(entries);
    if (!validation.isValid) {
      throw new Error(`Invalid journal entries: ${validation.errors.join(', ')}`);
    }

    // Save entries
    this.journalEntries.push(...entries);

    return entries;
  }

  private validateDoubleEntry(entries: JournalEntry[]): DoubleEntryValidation {
    const totalDebits = entries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredits = entries.reduce((sum, entry) => sum + entry.credit, 0);
    const difference = Math.abs(totalDebits - totalCredits);

    return {
      isValid: difference < 0.01, // Allow for floating point precision
      totalDebits,
      totalCredits,
      difference,
      errors: difference >= 0.01 ? [`Debits (${totalDebits}) do not equal Credits (${totalCredits})`] : []
    };
  }

  async getJournalEntries(transactionId?: string): Promise<JournalEntry[]> {
    if (transactionId) {
      return this.journalEntries.filter(entry => entry.transactionId === transactionId);
    }
    return this.journalEntries;
  }

  async getAccountBalances(accountId?: string): Promise<Record<string, number>> {
    const balances: Record<string, number> = {};

    for (const [id, account] of this.chartOfAccounts.entries()) {
      const entries = this.journalEntries.filter(entry => entry.accountId === id);
      const balance = entries.reduce((sum, entry) => {
        return account.normalBalance === 'DEBIT' 
          ? sum + entry.debit - entry.credit
          : sum + entry.credit - entry.debit;
      }, 0);
      
      balances[id] = balance;
    }

    return accountId ? { [accountId]: balances[accountId] } : balances;
  }

  async reconcileTransactions(startDate: Date, endDate: Date): Promise<any> {
    const periodEntries = this.journalEntries.filter(entry => 
      entry.createdAt >= startDate && entry.createdAt <= endDate
    );

    return {
      period: { startDate, endDate },
      totalEntries: periodEntries.length,
      totalDebits: periodEntries.reduce((sum, entry) => sum + entry.debit, 0),
      totalCredits: periodEntries.reduce((sum, entry) => sum + entry.credit, 0),
      balanced: this.validateDoubleEntry(periodEntries).isValid,
      accounts: await this.getAccountBalances()
    };
  }

  async batchProcessPayments(payments: (StripePaymentData | ACHPaymentData | DirectDepositData)[]): Promise<{
    processed: number;
    failed: number;
    entriesCreated: number;
    errors: string[];
  }> {
    const result = {
      processed: 0,
      failed: 0,
      entriesCreated: 0,
      errors: [] as string[]
    };

    for (const payment of payments) {
      try {
        if ('stripeId' in payment || 'applicationFee' in payment) {
          const entries = await this.createJournalEntriesFromStripePayment(payment as StripePaymentData);
          result.entriesCreated += entries.length;
        } else if ('bankAccountId' in payment && 'verificationStatus' in payment) {
          const entries = await this.createJournalEntriesFromACHPayment(payment as ACHPaymentData);
          result.entriesCreated += entries.length;
        }
        result.processed++;
      } catch (error) {
        result.failed++;
        result.errors.push(`${payment.id}: ${error.message}`);
      }
    }

    return result;
  }
}

export const stripeJournalService = new StripeJournalService();