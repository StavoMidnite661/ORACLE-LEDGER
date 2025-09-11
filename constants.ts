import type { Account, JournalEntry, PurchaseOrder, Invoice, Employee, Vendor } from './types';
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

export const mockJournalEntries: JournalEntry[] = [
  {
    id: 'JE-001',
    date: '2025-09-10',
    description: 'Initial capital contribution to LLC',
    source: 'CHAIN',
    status: 'Posted',
    lines: [
      { accountId: 1000, type: 'DEBIT', amount: 500000 }, // Cash-ODFI-LLC
      { accountId: 3000, type: 'CREDIT', amount: 500000 }, // LLC-Equity
    ],
  },
  {
    id: 'JE-002',
    date: '2025-09-09',
    description: 'SOVRCVLT token mint for operations',
    source: 'CHAIN',
    status: 'Posted',
    lines: [
      { accountId: 1010, type: 'DEBIT', amount: 250000 }, // Cash-Vault-USDC
      { accountId: 4000, type: 'CREDIT', amount: 250000 }, // Token-Realization-Gain/Loss
    ],
  },
  {
    id: 'JE-003',
    date: '2025-09-08',
    description: 'Office equipment purchase',
    source: 'PURCHASE',
    status: 'Posted',
    lines: [
      { accountId: 6200, type: 'DEBIT', amount: 15000 }, // Purchase-Expense
      { accountId: 1000, type: 'CREDIT', amount: 15000 }, // Cash-ODFI-LLC
    ],
  },
  {
    id: 'JE-004',
    date: '2025-09-07',
    description: 'Monthly payroll accrual August 2025',
    source: 'PAYROLL',
    status: 'Posted',
    lines: [
      { accountId: 6000, type: 'DEBIT', amount: 45000 }, // Payroll-Expense
      { accountId: 2400, type: 'CREDIT', amount: 45000 }, // Payroll-Liability
    ],
  },
  {
    id: 'JE-005',
    date: '2025-09-06',
    description: 'Software subscription payment',
    source: 'AP',
    status: 'Posted',
    lines: [
      { accountId: 6100, type: 'DEBIT', amount: 3500 }, // Ops-Expense
      { accountId: 2300, type: 'CREDIT', amount: 3500 }, // AP
    ],
  },
];

export const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: 'PO-001',
    vendor: 'Dell Technologies',
    date: '2025-09-11',
    items: [
      { description: 'Dell Latitude 7420 Laptops (5x)', amount: 12000 },
      { description: 'Dell UltraSharp Monitors (5x)', amount: 3000 },
    ],
    totalAmount: 15000,
    status: 'Approved',
  },
  {
    id: 'PO-002',
    vendor: 'Microsoft Corporation',
    date: '2025-09-10',
    items: [
      { description: 'Office 365 Business Premium (12 months)', amount: 2400 },
      { description: 'Azure Cloud Services Credit', amount: 5000 },
    ],
    totalAmount: 7400,
    status: 'Draft',
  },
  {
    id: 'PO-003',
    vendor: 'WeWork Companies Inc',
    date: '2025-09-09',
    items: [
      { description: 'Office Space Rental Q4 2025', amount: 18000 },
    ],
    totalAmount: 18000,
    status: 'Fulfilled',
  },
];

export const mockInvoices: Invoice[] = [
  // Accounts Receivable
  {
    id: 'INV-AR-001',
    type: 'AR',
    counterparty: 'Acme Corporation',
    issueDate: '2025-09-01',
    dueDate: '2025-10-01',
    amount: 75000,
    status: 'Issued',
  },
  {
    id: 'INV-AR-002',
    type: 'AR',
    counterparty: 'TechStart LLC',
    issueDate: '2025-08-15',
    dueDate: '2025-09-15',
    amount: 45000,
    status: 'Overdue',
  },
  {
    id: 'INV-AR-003',
    type: 'AR',
    counterparty: 'Global Enterprises',
    issueDate: '2025-09-05',
    dueDate: '2025-10-05',
    amount: 32000,
    status: 'Paid',
  },
  // Accounts Payable
  {
    id: 'INV-AP-001',
    type: 'AP',
    counterparty: 'Amazon Web Services',
    issueDate: '2025-09-01',
    dueDate: '2025-09-30',
    amount: 8500,
    status: 'Issued',
  },
  {
    id: 'INV-AP-002',
    type: 'AP',
    counterparty: 'Salesforce Inc',
    issueDate: '2025-08-28',
    dueDate: '2025-09-28',
    amount: 12000,
    status: 'Issued',
  },
  {
    id: 'INV-AP-003',
    type: 'AP',
    counterparty: 'Legal Services Group',
    issueDate: '2025-08-20',
    dueDate: '2025-09-20',
    amount: 25000,
    status: 'Overdue',
  },
  {
    id: 'INV-AP-004',
    type: 'AP',
    counterparty: 'Office Depot',
    issueDate: '2025-09-03',
    dueDate: '2025-10-03',
    amount: 1200,
    status: 'Paid',
  },
];

export const mockEmployees: Employee[] = [
  {
    id: 'EMP-001',
    name: 'Sarah Johnson',
    annualSalary: 120000,
    bankRoutingNumber: '021000021',
    bankAccountNumber: '****1234',
    paymentMethod: 'ACH',
    taxId: '***-**-4321',
  },
  {
    id: 'EMP-002',
    name: 'Michael Chen',
    annualSalary: 95000,
    bankRoutingNumber: '121000248',
    bankAccountNumber: '****5678',
    paymentMethod: 'ACH',
    taxId: '***-**-8765',
  },
  {
    id: 'EMP-003',
    name: 'Emily Rodriguez',
    annualSalary: 110000,
    bankRoutingNumber: '021000021',
    bankAccountNumber: '****9012',
    paymentMethod: 'ACH',
    taxId: '***-**-3456',
  },
  {
    id: 'EMP-004',
    name: 'David Kim',
    annualSalary: 85000,
    bankRoutingNumber: '111000025',
    bankAccountNumber: '****3456',
    paymentMethod: 'ACH',
    taxId: '***-**-7890',
  },
  {
    id: 'EMP-005',
    name: 'Lisa Thompson',
    annualSalary: 130000,
    bankRoutingNumber: '121000248',
    bankAccountNumber: '****7890',
    paymentMethod: 'ACH',
    taxId: '***-**-2345',
  },
];

export const mockVendors: Vendor[] = [
  {
    id: 'VEN-001',
    name: 'Amazon Web Services',
    contactPerson: 'AWS Business Support',
    email: 'billing@aws.amazon.com',
    phone: '1-800-367-4000',
    address: '410 Terry Ave N, Seattle, WA 98109',
    paymentTerms: 'Net 30',
    taxId: '91-1646860',
    status: 'Active',
    category: 'Software',
    notes: 'Cloud infrastructure and services provider',
    createdDate: '2025-01-15',
  },
  {
    id: 'VEN-002',
    name: 'Dell Technologies',
    contactPerson: 'John Smith',
    email: 'corporate.sales@dell.com',
    phone: '1-800-915-3355',
    address: 'One Dell Way, Round Rock, TX 78682',
    paymentTerms: 'Net 30',
    bankAccountNumber: '****2468',
    bankRoutingNumber: '111000025',
    taxId: '74-2487834',
    status: 'Active',
    category: 'Hardware',
    notes: 'Hardware supplier for computers and servers',
    createdDate: '2025-02-01',
  },
  {
    id: 'VEN-003',
    name: 'Salesforce Inc',
    contactPerson: 'Enterprise Support',
    email: 'enterprise@salesforce.com',
    phone: '1-800-667-6389',
    address: '415 Mission St, San Francisco, CA 94105',
    paymentTerms: 'Due on Receipt',
    taxId: '94-3320693',
    status: 'Active',
    category: 'Software',
    notes: 'CRM and business automation platform',
    createdDate: '2025-01-20',
  },
  {
    id: 'VEN-004',
    name: 'Legal Services Group',
    contactPerson: 'Maria Rodriguez',
    email: 'billing@legalservicesgroup.com',
    phone: '(555) 123-4567',
    address: '123 Law Street, New York, NY 10001',
    paymentTerms: 'Net 15',
    bankAccountNumber: '****1357',
    bankRoutingNumber: '021000021',
    taxId: '12-3456789',
    status: 'Active',
    category: 'Professional',
    notes: 'Corporate legal services and compliance',
    createdDate: '2025-01-10',
  },
  {
    id: 'VEN-005',
    name: 'Office Depot',
    contactPerson: 'Business Solutions',
    email: 'business@officedepot.com',
    phone: '1-800-463-3768',
    address: '6600 N Military Trail, Boca Raton, FL 33496',
    paymentTerms: 'Net 30',
    taxId: '59-1627751',
    status: 'Active',
    category: 'Supplies',
    notes: 'Office supplies and equipment',
    createdDate: '2025-02-05',
  },
  {
    id: 'VEN-006',
    name: 'Microsoft Corporation',
    contactPerson: 'Enterprise Sales',
    email: 'enterprise@microsoft.com',
    phone: '1-800-642-7676',
    address: 'One Microsoft Way, Redmond, WA 98052',
    paymentTerms: 'Net 30',
    taxId: '91-1144442',
    status: 'Active',
    category: 'Software',
    notes: 'Software licensing and cloud services',
    createdDate: '2025-01-25',
  },
  {
    id: 'VEN-007',
    name: 'WeWork Companies Inc',
    contactPerson: 'Corporate Accounts',
    email: 'corporate@wework.com',
    phone: '1-844-639-3675',
    address: '115 W 18th St, New York, NY 10011',
    paymentTerms: 'Due on Receipt',
    taxId: '47-4685755',
    status: 'Active',
    category: 'Services',
    notes: 'Flexible office space solutions',
    createdDate: '2025-02-10',
  },
];
