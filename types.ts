
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
  Payroll = 'PAYROLL',
  Settings = 'SETTINGS',
}