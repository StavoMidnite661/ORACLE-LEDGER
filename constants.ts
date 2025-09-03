import type { Account, JournalEntry, PurchaseOrder, Invoice, Employee } from './types';
import { AccountType, Entity } from './types';

export const CHART_OF_ACCOUNTS: Account[] = [
  // Assets
  { id: 1000, name: 'Cash-ODFI-LLC', type: AccountType.Asset, entity: Entity.LLC },
  { id: 1010, name: 'Cash-Vault-USDC', type: AccountType.Asset, entity: Entity.Trust },
  { id: 1200, name: 'Intercompany-Receivable-Trust', type: AccountType.Asset, entity: Entity.Trust },
  { id: 1300, name: 'AR', type: AccountType.Asset, entity: Entity.LLC },
  { id: 1400, name: 'Inventory', type: AccountType.Asset, entity: Entity.LLC },
  // Liabilities
  { id: 2100, name: 'ACH-Clearing-LLC', type: AccountType.Liability, entity: Entity.LLC },
  { id: 2200, name: 'Intercompany-Payable-LLC', type: AccountType.Liability, entity: Entity.LLC },
  { id: 2300, name: 'AP', type: AccountType.Liability, entity: Entity.LLC },
  { id: 2400, name: 'Payroll-Liability', type: AccountType.Liability, entity: Entity.LLC },
  // Equity
  { id: 3000, name: 'LLC-Equity', type: AccountType.Equity, entity: Entity.LLC },
  { id: 3100, name: 'Trust-Capital', type: AccountType.Equity, entity: Entity.Trust },
  // Income/Expense
  { id: 4000, name: 'Token-Realization-Gain/Loss', type: AccountType.Income, entity: Entity.LLC },
  { id: 6000, name: 'Payroll-Expense', type: AccountType.Expense, entity: Entity.LLC },
  { id: 6100, name: 'Ops-Expense', type: AccountType.Expense, entity: Entity.LLC },
  { id: 6200, name: 'Purchase-Expense', type: AccountType.Expense, entity: Entity.LLC },
];

export const mockJournalEntries: JournalEntry[] = [];

export const mockPurchaseOrders: PurchaseOrder[] = [];

export const mockInvoices: Invoice[] = [];

export const mockEmployees: Employee[] = [];
