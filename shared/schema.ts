import { pgTable, serial, text, numeric, integer, timestamp, boolean, varchar, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const entityEnum = pgEnum('entity', ['LLC', 'Trust']);
export const accountTypeEnum = pgEnum('account_type', ['Asset', 'Liability', 'Equity', 'Income', 'Expense']);
export const lineTypeEnum = pgEnum('line_type', ['DEBIT', 'CREDIT']);
export const paymentMethodEnum = pgEnum('payment_method', ['ACH', 'Wire', 'Crypto']);
export const cardTypeEnum = pgEnum('card_type', ['Virtual', 'Physical', 'Fleet', 'Gas']);
export const cardProviderEnum = pgEnum('card_provider', ['Visa', 'Mastercard', 'Amex', 'Discover']);
export const spendCategoryEnum = pgEnum('spend_category', ['Fuel', 'Office', 'Travel', 'Software', 'Hardware', 'Other']);
export const vendorCategoryEnum = pgEnum('vendor_category', ['Software', 'Hardware', 'Services', 'Supplies', 'Professional', 'Other']);
export const statusEnum = pgEnum('status', ['Active', 'Inactive', 'Pending', 'Posted', 'Draft', 'Approved', 'Fulfilled', 'Paid', 'Issued', 'Overdue']);

// Chart of Accounts
export const accounts = pgTable('accounts', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  type: accountTypeEnum('type').notNull(),
  entity: entityEnum('entity').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Journal Entries
export const journalEntries = pgTable('journal_entries', {
  id: varchar('id', { length: 50 }).primaryKey(),
  date: varchar('date', { length: 10 }).notNull(),
  description: text('description').notNull(),
  source: varchar('source', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('Posted'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const journalLines = pgTable('journal_lines', {
  id: serial('id').primaryKey(),
  journalEntryId: varchar('journal_entry_id', { length: 50 }).notNull(),
  accountId: integer('account_id').notNull(),
  type: lineTypeEnum('type').notNull(),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Employees
export const employees = pgTable('employees', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  annualSalary: numeric('annual_salary', { precision: 15, scale: 2 }).notNull(),
  bankRoutingNumber: varchar('bank_routing_number', { length: 9 }),
  bankAccountNumber: varchar('bank_account_number', { length: 20 }),
  paymentMethod: paymentMethodEnum('payment_method').default('ACH'),
  taxId: varchar('tax_id', { length: 11 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// Vendors
export const vendors = pgTable('vendors', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  contactPerson: varchar('contact_person', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  address: text('address').notNull(),
  paymentTerms: varchar('payment_terms', { length: 100 }).notNull(),
  bankAccountNumber: varchar('bank_account_number', { length: 20 }),
  bankRoutingNumber: varchar('bank_routing_number', { length: 9 }),
  taxId: varchar('tax_id', { length: 20 }).notNull(),
  status: statusEnum('status').notNull().default('Active'),
  category: vendorCategoryEnum('category').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Company Cards
export const companyCards = pgTable('company_cards', {
  id: varchar('id', { length: 50 }).primaryKey(),
  last4: varchar('last4', { length: 4 }).notNull(),
  providerTokenId: varchar('provider_token_id', { length: 255 }),
  cardType: cardTypeEnum('card_type').notNull(),
  cardProvider: cardProviderEnum('card_provider').notNull(),
  assignedTo: varchar('assigned_to', { length: 255 }),
  spendingLimitDaily: numeric('spending_limit_daily', { precision: 15, scale: 2 }),
  spendingLimitMonthly: numeric('spending_limit_monthly', { precision: 15, scale: 2 }),
  spendingLimitTransaction: numeric('spending_limit_transaction', { precision: 15, scale: 2 }),
  status: varchar('status', { length: 20 }).notNull().default('Active'),
  issueDate: varchar('issue_date', { length: 10 }).notNull(),
  expiryDate: varchar('expiry_date', { length: 10 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Card Transactions
export const cardTransactions = pgTable('card_transactions', {
  id: varchar('id', { length: 50 }).primaryKey(),
  cardId: varchar('card_id', { length: 50 }).notNull(),
  merchantName: varchar('merchant_name', { length: 255 }).notNull(),
  merchantCategory: spendCategoryEnum('merchant_category').notNull(),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  transactionDate: varchar('transaction_date', { length: 10 }).notNull(),
  postingDate: varchar('posting_date', { length: 10 }).notNull(),
  description: text('description').notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  location: varchar('location', { length: 255 }),
  accountingCode: varchar('accounting_code', { length: 20 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Purchase Orders
export const purchaseOrders = pgTable('purchase_orders', {
  id: varchar('id', { length: 50 }).primaryKey(),
  vendor: varchar('vendor', { length: 255 }).notNull(),
  date: varchar('date', { length: 10 }).notNull(),
  totalAmount: numeric('total_amount', { precision: 15, scale: 2 }).notNull(),
  status: statusEnum('status').notNull().default('Draft'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const purchaseOrderItems = pgTable('purchase_order_items', {
  id: serial('id').primaryKey(),
  purchaseOrderId: varchar('purchase_order_id', { length: 50 }).notNull(),
  description: text('description').notNull(),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Invoices
export const invoices = pgTable('invoices', {
  id: varchar('id', { length: 50 }).primaryKey(),
  type: varchar('type', { length: 2 }).notNull(), // 'AR' or 'AP'
  counterparty: varchar('counterparty', { length: 255 }).notNull(),
  issueDate: varchar('issue_date', { length: 10 }).notNull(),
  dueDate: varchar('due_date', { length: 10 }).notNull(),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  status: statusEnum('status').notNull().default('Issued'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Consul Credits
export const consulCreditsTransactions = pgTable('consul_credits_transactions', {
  id: varchar('id', { length: 50 }).primaryKey(),
  txHash: varchar('tx_hash', { length: 66 }).notNull(),
  blockNumber: integer('block_number').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  eventType: varchar('event_type', { length: 20 }).notNull(),
  userAddress: varchar('user_address', { length: 42 }).notNull(),
  tokenAddress: varchar('token_address', { length: 42 }).notNull(),
  tokenSymbol: varchar('token_symbol', { length: 10 }).notNull(),
  tokenAmount: varchar('token_amount', { length: 50 }).notNull(),
  consulCreditsAmount: varchar('consul_credits_amount', { length: 50 }).notNull(),
  exchangeRate: varchar('exchange_rate', { length: 50 }).notNull(),
  ledgerReference: varchar('ledger_reference', { length: 50 }),
  journalEntryId: varchar('journal_entry_id', { length: 50 }),
  confirmations: integer('confirmations').notNull().default(0),
  status: varchar('status', { length: 20 }).notNull().default('PENDING'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Card Reveal Audit
export const cardRevealAudit = pgTable('card_reveal_audit', {
  id: serial('id').primaryKey(),
  cardId: varchar('card_id', { length: 50 }).notNull(),
  revealedBy: varchar('revealed_by', { length: 255 }).notNull(),
  reason: text('reason').notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  timestamp: timestamp('timestamp').defaultNow(),
});

// Relations
export const journalEntriesRelations = relations(journalEntries, ({ many }) => ({
  lines: many(journalLines),
}));

export const journalLinesRelations = relations(journalLines, ({ one }) => ({
  journalEntry: one(journalEntries, {
    fields: [journalLines.journalEntryId],
    references: [journalEntries.id],
  }),
  account: one(accounts, {
    fields: [journalLines.accountId],
    references: [accounts.id],
  }),
}));

export const companyCardsRelations = relations(companyCards, ({ many }) => ({
  transactions: many(cardTransactions),
  revealAudits: many(cardRevealAudit),
}));

export const cardTransactionsRelations = relations(cardTransactions, ({ one }) => ({
  card: one(companyCards, {
    fields: [cardTransactions.cardId],
    references: [companyCards.id],
  }),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ many }) => ({
  items: many(purchaseOrderItems),
}));

export const purchaseOrderItemsRelations = relations(purchaseOrderItems, ({ one }) => ({
  purchaseOrder: one(purchaseOrders, {
    fields: [purchaseOrderItems.purchaseOrderId],
    references: [purchaseOrders.id],
  }),
}));

export const cardRevealAuditRelations = relations(cardRevealAudit, ({ one }) => ({
  card: one(companyCards, {
    fields: [cardRevealAudit.cardId],
    references: [companyCards.id],
  }),
}));

// Types
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

export type JournalEntry = typeof journalEntries.$inferSelect;
export type NewJournalEntry = typeof journalEntries.$inferInsert;

export type JournalLine = typeof journalLines.$inferSelect;
export type NewJournalLine = typeof journalLines.$inferInsert;

export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;

export type Vendor = typeof vendors.$inferSelect;
export type NewVendor = typeof vendors.$inferInsert;

export type CompanyCard = typeof companyCards.$inferSelect;
export type NewCompanyCard = typeof companyCards.$inferInsert;

export type CardTransaction = typeof cardTransactions.$inferSelect;
export type NewCardTransaction = typeof cardTransactions.$inferInsert;

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type NewPurchaseOrder = typeof purchaseOrders.$inferInsert;

export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type NewPurchaseOrderItem = typeof purchaseOrderItems.$inferInsert;

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;

export type ConsulCreditsTransaction = typeof consulCreditsTransactions.$inferSelect;
export type NewConsulCreditsTransaction = typeof consulCreditsTransactions.$inferInsert;

export type CardRevealAudit = typeof cardRevealAudit.$inferSelect;
export type NewCardRevealAudit = typeof cardRevealAudit.$inferInsert;