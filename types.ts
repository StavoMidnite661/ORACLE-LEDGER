
export enum AccountType {
  Asset = 'Asset',
  Liability = 'Liability',
  Equity = 'Equity',
  Income = 'Income',
  Expense = 'Expense',
}

export enum Entity {
  LLC = 'SOVR Development Holdings LLC',
  Trust = 'GM Family Trust',
}

export interface Account {
  id: number;
  name: string;
  type: AccountType;
  entity: Entity;
}

export interface JournalEntryLine {
  accountId: number;
  type: 'DEBIT' | 'CREDIT';
  amount: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  description: string;
  lines: JournalEntryLine[];
  source: 'CHAIN' | 'NACHA' | 'PO' | 'AR' | 'AP' | 'PURCHASE' | 'PAYROLL' | 'INTERCOMPANY' | 'PAYMENT';
  status: 'Posted' | 'Pending';
  txHash?: string; // Blockchain transaction hash if from chain
  blockNumber?: number; // Block number if from chain
  chainConfirmations?: number; // Number of confirmations
}

export interface PurchaseOrder {
  id: string;
  vendor: string;
  date: string;
  items: { description: string; amount: number }[];
  totalAmount: number;
  status: 'Draft' | 'Approved' | 'Fulfilled' | 'Paid';
}

export interface Invoice {
  id: string;
  type: 'AR' | 'AP';
  counterparty: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  status: 'Issued' | 'Paid' | 'Overdue';
}

export interface Employee {
    id: string;
    name: string;
    annualSalary: number;
    bankRoutingNumber?: string;
    bankAccountNumber?: string;
    paymentMethod?: 'ACH' | 'Wire' | 'Crypto';
    taxId?: string;
}

export interface PayrollRun {
    id: string;
    date: string;
    totalGross: number;
    totalNet: number;
    employeeCount: number;
}

export interface Vendor {
    id: string;
    name: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
    paymentTerms: string;
    bankAccountNumber?: string;
    bankRoutingNumber?: string;
    taxId: string;
    status: 'Active' | 'Inactive';
    category: 'Software' | 'Hardware' | 'Services' | 'Supplies' | 'Professional' | 'Other';
    notes?: string;
    createdDate: string;
}

export interface CardNumber {
  last4: string; // Last 4 digits for display
  providerTokenId?: string; // Token reference for secure retrieval
}

export interface CompanyCard {
  id: string;
  cardNumber: CardNumber; // Secure card number storage
  cardType: 'Virtual' | 'Physical' | 'Fleet' | 'Gas';
  cardProvider: 'Visa' | 'Mastercard' | 'Amex' | 'Discover';
  assignedTo?: string; // Employee ID or name
  assignedEntity: Entity;
  status: 'Active' | 'Suspended' | 'Expired' | 'Cancelled';
  monthlyLimit: number;
  dailyLimit: number;
  transactionLimit: number;
  spentThisMonth: number;
  spentThisQuarter: number;
  spentThisYear: number;
  allowedCategories: SpendCategory[];
  blockedCategories: SpendCategory[];
  expirationDate: string;
  issueDate: string;
  lastActivity?: string;
  billingAddress: string;
  notes?: string;
}

export interface CardTransaction {
  id: string;
  cardId: string;
  merchantName: string;
  merchantCategory: SpendCategory;
  amount: number;
  currency: 'USD';
  transactionDate: string;
  postingDate: string;
  description: string;
  status: 'Posted' | 'Pending' | 'Declined';
  receiptUrl?: string;
  location?: string;
  accountingCode?: string;
  journalEntryId?: string;
  approvedBy?: string;
  notes?: string;
}

export interface SpendingRule {
  id: string;
  cardId: string;
  ruleType: 'Daily Limit' | 'Monthly Limit' | 'Category Block' | 'Merchant Block' | 'Geographic Restriction';
  value: string | number;
  isActive: boolean;
  createdDate: string;
  createdBy: string;
}

export enum SpendCategory {
  Office = 'Office Supplies',
  Travel = 'Travel & Lodging',
  Meals = 'Meals & Entertainment',
  Software = 'Software & Subscriptions',
  Marketing = 'Marketing & Advertising',
  Fuel = 'Fuel & Fleet',
  Maintenance = 'Maintenance & Repairs',
  Professional = 'Professional Services',
  Equipment = 'Equipment & Hardware',
  Utilities = 'Utilities',
  Training = 'Training & Education',
  Insurance = 'Insurance',
  Other = 'Other Expenses',
}

export interface BankAccount {
    id: string;
    bankName: string;
    accountNumber: string;
    routingNumber: string;
    accountType: 'Checking' | 'Savings';
    isActive: boolean;
}

export enum View {
  Dashboard = 'DASHBOARD',
  Journal = 'JOURNAL',
  ChartOfAccounts = 'CHART_OF_ACCOUNTS',
  PurchaseOrders = 'PURCHASE_ORDERS',
  AccountsReceivable = 'ACCOUNTS_RECEIVABLE',
  AccountsPayable = 'ACCOUNTS_PAYABLE',
  VendorPayments = 'VENDOR_PAYMENTS',
  VendorManagement = 'VENDOR_MANAGEMENT',
  CardManagement = 'CARD_MANAGEMENT',
  ConsulCredits = 'CONSUL_CREDITS',
  Payroll = 'PAYROLL',
  Settings = 'SETTINGS',
}

// Security and Audit Types
export enum UserRole {
  Admin = 'Admin',
  Finance = 'Finance',
  Auditor = 'Auditor',
  Viewer = 'Viewer',
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string; // User ID or name
  action: 'CARD_NUMBER_REVEALED' | 'CARD_CREATED' | 'CARD_SUSPENDED' | 'CARD_ACTIVATED' | 'SETTINGS_CHANGED' | 'BLOCKCHAIN_EVENT';
  targetId: string; // Card ID, Transaction ID, etc.
  reason?: string;
  result: 'SUCCESS' | 'FAILED' | 'UNAUTHORIZED';
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface CardRevealRequest {
  cardId: string;
  reason: string;
  authCode?: string; // MFA code
}

export interface CardRevealResponse {
  fullNumber: string;
  expiresAt: string; // ISO timestamp when reveal expires
  auditId: string;
}

// Blockchain and Smart Contract Types
export interface ChainSettings {
  rpcUrl: string;
  contractAddress: string;
  chainId: number;
  confirmations: number;
  lastProcessedBlock: number;
  isEnabled: boolean;
}

export interface BlockchainEvent {
  id: string;
  txHash: string;
  blockNumber: number;
  logIndex: number;
  eventType: 'LEDGER_POSTED' | 'TOKEN_TRANSFER' | 'TOKEN_MINT' | 'TOKEN_BURN' | 'TOKEN_DEPOSITED' | 'TOKEN_WITHDRAWN';
  contractAddress: string;
  chainId: number;
  confirmations: number;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  eventData: Record<string, any>;
  journalEntryId?: string;
  processedAt?: string;
  createdAt: string;
}

export interface SmartContractMapping {
  eventType: string;
  accountMapping: Record<string, number>; // Map event params to account IDs
  description: string;
  enabled: boolean;
}

// Consul Credits Wrapper Contract Types
export type ConsulCreditsTab = 'overview' | 'tokens' | 'transactions' | 'settings';

export interface ConsulCreditsConfig {
  contractAddress: string;
  networkName: string;
  chainId: number;
  rpcUrl: string;
  oracleIntegratorAddress: string;
  confirmationsRequired: number;
  isEnabled: boolean;
}

export interface SupportedToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  exchangeRate: string; // Consul credits per token (as string to preserve precision)
  isActive: boolean;
  totalDeposited: string;
  totalWithdrawn: string;
}

export interface ConsulCreditsTransaction {
  id: string;
  txHash: string;
  blockNumber: number;
  timestamp: string;
  eventType: 'DEPOSIT' | 'WITHDRAW' | 'ORACLE_MINT' | 'ORACLE_BURN';
  userAddress: string;
  tokenAddress: string;
  tokenSymbol: string;
  tokenAmount: string;
  consulCreditsAmount: string;
  exchangeRate: string;
  ledgerReference: string;
  journalEntryId?: string;
  confirmations: number;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
}

export interface ConsulCreditsBalance {
  userAddress: string;
  totalConsulCredits: string;
  tokenBalances: Array<{
    tokenAddress: string;
    tokenSymbol: string;
    deposited: string;
    withdrawn: string;
    netBalance: string;
  }>;
  lastUpdated: string;
}

export interface ConsulCreditsStats {
  totalSupply: string;
  totalUniqueHolders: number;
  totalTransactions: number;
  supportedTokensCount: number;
  contractReserves: Array<{
    tokenAddress: string;
    tokenSymbol: string;
    balance: string;
    value: string; // In consul credits
  }>;
}
