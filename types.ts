
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
}

export interface PayrollRun {
    id: string;
    date: string;
    totalGross: number;
    totalNet: number;
    employeeCount: number;
}

export enum View {
  Dashboard = 'DASHBOARD',
  Journal = 'JOURNAL',
  ChartOfAccounts = 'CHART_OF_ACCOUNTS',
  PurchaseOrders = 'PURCHASE_ORDERS',
  AccountsReceivable = 'ACCOUNTS_RECEIVABLE',
  AccountsPayable = 'ACCOUNTS_PAYABLE',
  VendorPayments = 'VENDOR_PAYMENTS',
  Payroll = 'PAYROLL',
  Settings = 'SETTINGS',
}