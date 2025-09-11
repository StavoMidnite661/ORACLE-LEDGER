
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

export interface CompanyCard {
  id: string;
  cardNumber: string; // Last 4 digits only for display
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
  Payroll = 'PAYROLL',
  Settings = 'SETTINGS',
}