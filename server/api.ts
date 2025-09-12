import express from 'express';
import cors from 'cors';
import { db } from './db';
import * as schema from '../shared/schema';
import { eq, desc } from 'drizzle-orm';
import type { 
  Employee, 
  JournalEntry, 
  Vendor, 
  CompanyCard, 
  CardTransaction, 
  PurchaseOrder, 
  Invoice, 
  ConsulCreditsTransaction,
  Entity 
} from '../types';
import { SpendCategory } from '../types';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Type conversion utilities for PostgreSQL numeric fields
function parseNumeric(value: string | number): number {
  return typeof value === 'string' ? parseFloat(value) : value;
}

function formatDateToISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Map database spend category enum to TypeScript SpendCategory
function mapSpendCategory(dbCategory: string): SpendCategory {
  const categoryMap: Record<string, SpendCategory> = {
    'Fuel': SpendCategory.Fuel,
    'Office': SpendCategory.Office,
    'Travel': SpendCategory.Travel,
    'Software': SpendCategory.Software,
    'Hardware': SpendCategory.Equipment,
    'Other': SpendCategory.Other
  };
  return categoryMap[dbCategory] || SpendCategory.Other;
}

// Map TypeScript SpendCategory to database enum
function mapSpendCategoryToDb(category: SpendCategory): string {
  const categoryMap: Record<SpendCategory, string> = {
    [SpendCategory.Fuel]: 'Fuel',
    [SpendCategory.Office]: 'Office',
    [SpendCategory.Travel]: 'Travel',
    [SpendCategory.Software]: 'Software',
    [SpendCategory.Equipment]: 'Hardware',
    [SpendCategory.Marketing]: 'Other',
    [SpendCategory.Meals]: 'Other',
    [SpendCategory.Maintenance]: 'Other',
    [SpendCategory.Professional]: 'Other',
    [SpendCategory.Utilities]: 'Other',
    [SpendCategory.Training]: 'Other',
    [SpendCategory.Insurance]: 'Other',
    [SpendCategory.Other]: 'Other'
  };
  return categoryMap[category] || 'Other';
}

// Convert database employee to TypeScript Employee
function convertDbEmployee(dbEmployee: any): Employee {
  return {
    id: dbEmployee.id,
    name: dbEmployee.name,
    annualSalary: parseNumeric(dbEmployee.annualSalary),
    bankRoutingNumber: dbEmployee.bankRoutingNumber,
    bankAccountNumber: dbEmployee.bankAccountNumber,
    paymentMethod: dbEmployee.paymentMethod,
    taxId: dbEmployee.taxId
  };
}

// Convert database journal line to TypeScript JournalEntryLine
function convertDbJournalLine(dbLine: any): any {
  return {
    accountId: dbLine.accountId,
    type: dbLine.type,
    amount: parseNumeric(dbLine.amount)
  };
}

// Convert database journal entry to TypeScript JournalEntry
function convertDbJournalEntry(dbEntry: any, dbLines: any[]): JournalEntry {
  return {
    id: dbEntry.id,
    date: dbEntry.date,
    description: dbEntry.description,
    source: dbEntry.source as any,
    status: dbEntry.status as any,
    lines: dbLines.map(convertDbJournalLine)
  };
}

// Convert database vendor to TypeScript Vendor
function convertDbVendor(dbVendor: any): Vendor {
  return {
    id: dbVendor.id,
    name: dbVendor.name,
    contactPerson: dbVendor.contactPerson,
    email: dbVendor.email,
    phone: dbVendor.phone,
    address: dbVendor.address,
    paymentTerms: dbVendor.paymentTerms,
    bankAccountNumber: dbVendor.bankAccountNumber,
    bankRoutingNumber: dbVendor.bankRoutingNumber,
    taxId: dbVendor.taxId,
    status: dbVendor.status,
    category: dbVendor.category,
    notes: dbVendor.notes,
    createdDate: formatDateToISO(dbVendor.createdAt)
  };
}

// Convert database company card to TypeScript CompanyCard
function convertDbCompanyCard(dbCard: any): CompanyCard {
  return {
    id: dbCard.id,
    cardNumber: {
      last4: dbCard.last4,
      providerTokenId: dbCard.providerTokenId
    },
    cardType: dbCard.cardType,
    cardProvider: dbCard.cardProvider,
    assignedTo: dbCard.assignedTo,
    assignedEntity: 'SOVR Development Holdings LLC' as Entity,
    status: dbCard.status === 'Active' ? 'Active' : dbCard.status === 'Suspended' ? 'Suspended' : 'Cancelled',
    monthlyLimit: parseNumeric(dbCard.spendingLimitMonthly || 0),
    dailyLimit: parseNumeric(dbCard.spendingLimitDaily || 0),
    transactionLimit: parseNumeric(dbCard.spendingLimitTransaction || 0),
    spentThisMonth: 0,
    spentThisQuarter: 0,
    spentThisYear: 0,
    allowedCategories: [],
    blockedCategories: [],
    expirationDate: dbCard.expiryDate,
    issueDate: dbCard.issueDate,
    lastActivity: undefined,
    billingAddress: '',
    notes: undefined
  };
}

// Convert database card transaction to TypeScript CardTransaction
function convertDbCardTransaction(dbTransaction: any): CardTransaction {
  return {
    id: dbTransaction.id,
    cardId: dbTransaction.cardId,
    merchantName: dbTransaction.merchantName,
    merchantCategory: mapSpendCategory(dbTransaction.merchantCategory),
    amount: parseNumeric(dbTransaction.amount),
    currency: dbTransaction.currency,
    transactionDate: dbTransaction.transactionDate,
    postingDate: dbTransaction.postingDate,
    description: dbTransaction.description,
    status: dbTransaction.status,
    receiptUrl: undefined,
    location: dbTransaction.location,
    accountingCode: dbTransaction.accountingCode,
    journalEntryId: undefined,
    approvedBy: undefined,
    notes: dbTransaction.notes
  };
}

// Convert database purchase order item to TypeScript format
function convertDbPurchaseOrderItem(dbItem: any): { description: string; amount: number } {
  return {
    description: dbItem.description,
    amount: parseNumeric(dbItem.amount)
  };
}

// Convert database purchase order to TypeScript PurchaseOrder
function convertDbPurchaseOrder(dbOrder: any, dbItems: any[]): PurchaseOrder {
  return {
    id: dbOrder.id,
    vendor: dbOrder.vendor,
    date: dbOrder.date,
    items: dbItems.map(convertDbPurchaseOrderItem),
    totalAmount: parseNumeric(dbOrder.totalAmount),
    status: dbOrder.status
  };
}

// Convert database invoice to TypeScript Invoice
function convertDbInvoice(dbInvoice: any): Invoice {
  return {
    id: dbInvoice.id,
    type: dbInvoice.type,
    counterparty: dbInvoice.counterparty,
    issueDate: dbInvoice.issueDate,
    dueDate: dbInvoice.dueDate,
    amount: parseNumeric(dbInvoice.amount),
    status: dbInvoice.status
  };
}

// API Routes

// Employees
app.get('/api/employees', async (req, res) => {
  try {
    const dbEmployees = await db.select().from(schema.employees).orderBy(desc(schema.employees.createdAt));
    const employees = dbEmployees.map(convertDbEmployee);
    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

app.post('/api/employees', async (req, res) => {
  try {
    const employee = req.body as Omit<Employee, 'id'>;
    const id = `EMP-${Date.now()}`;
    const [newEmployee] = await db.insert(schema.employees)
      .values({ 
        id, 
        name: employee.name,
        annualSalary: employee.annualSalary.toString(),
        bankRoutingNumber: employee.bankRoutingNumber,
        bankAccountNumber: employee.bankAccountNumber,
        paymentMethod: employee.paymentMethod,
        taxId: employee.taxId
      })
      .returning();
    res.json(convertDbEmployee(newEmployee));
  } catch (error) {
    console.error('Error adding employee:', error);
    res.status(500).json({ error: 'Failed to add employee' });
  }
});

app.put('/api/employees/:id', async (req, res) => {
  try {
    const employeeId = req.params.id;
    const employee = req.body as Employee;
    const [updatedEmployee] = await db.update(schema.employees)
      .set({
        name: employee.name,
        annualSalary: employee.annualSalary.toString(),
        bankRoutingNumber: employee.bankRoutingNumber,
        bankAccountNumber: employee.bankAccountNumber,
        paymentMethod: employee.paymentMethod,
        taxId: employee.taxId
      })
      .where(eq(schema.employees.id, employeeId))
      .returning();
    res.json(convertDbEmployee(updatedEmployee));
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

// Journal Entries
app.get('/api/journal-entries', async (req, res) => {
  try {
    const entries = await db.select().from(schema.journalEntries)
      .orderBy(desc(schema.journalEntries.createdAt));
    
    const entriesWithLines = await Promise.all(
      entries.map(async (entry) => {
        const lines = await db.select().from(schema.journalLines)
          .where(eq(schema.journalLines.journalEntryId, entry.id));
        return convertDbJournalEntry(entry, lines);
      })
    );

    res.json(entriesWithLines);
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    res.status(500).json({ error: 'Failed to fetch journal entries' });
  }
});

app.post('/api/journal-entries', async (req, res) => {
  try {
    const entry = req.body as Omit<JournalEntry, 'id' | 'date'>;
    const id = `JE-${String(Date.now()).slice(-6).padStart(3, '0')}`;
    const date = new Date().toISOString().split('T')[0];
    
    const [newEntry] = await db.insert(schema.journalEntries)
      .values({ 
        id, 
        date, 
        description: entry.description,
        source: entry.source,
        status: entry.status
      })
      .returning();

    // Insert journal lines
    const lines = await Promise.all(
      entry.lines.map(line => 
        db.insert(schema.journalLines)
          .values({ 
            journalEntryId: id, 
            accountId: line.accountId,
            type: line.type,
            amount: line.amount.toString()
          })
          .returning()
      )
    );

    res.json(convertDbJournalEntry(newEntry, lines.flat()));
  } catch (error) {
    console.error('Error adding journal entry:', error);
    res.status(500).json({ error: 'Failed to add journal entry' });
  }
});

// Vendors
app.get('/api/vendors', async (req, res) => {
  try {
    const dbVendors = await db.select().from(schema.vendors).orderBy(desc(schema.vendors.createdAt));
    const vendors = dbVendors.map(convertDbVendor);
    res.json(vendors);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

app.post('/api/vendors', async (req, res) => {
  try {
    const vendor = req.body as Omit<Vendor, 'id' | 'createdDate'>;
    const id = `VEN-${Date.now()}`;
    const [newVendor] = await db.insert(schema.vendors)
      .values({ 
        id, 
        name: vendor.name,
        contactPerson: vendor.contactPerson,
        email: vendor.email,
        phone: vendor.phone,
        address: vendor.address,
        paymentTerms: vendor.paymentTerms,
        bankAccountNumber: vendor.bankAccountNumber,
        bankRoutingNumber: vendor.bankRoutingNumber,
        taxId: vendor.taxId,
        status: vendor.status,
        category: vendor.category,
        notes: vendor.notes,
        createdAt: new Date()
      })
      .returning();
    res.json(convertDbVendor(newVendor));
  } catch (error) {
    console.error('Error adding vendor:', error);
    res.status(500).json({ error: 'Failed to add vendor' });
  }
});

// Company Cards
app.get('/api/company-cards', async (req, res) => {
  try {
    const dbCards = await db.select().from(schema.companyCards).orderBy(desc(schema.companyCards.createdAt));
    const cards = dbCards.map(convertDbCompanyCard);
    res.json(cards);
  } catch (error) {
    console.error('Error fetching company cards:', error);
    res.status(500).json({ error: 'Failed to fetch company cards' });
  }
});

app.post('/api/company-cards', async (req, res) => {
  try {
    const card = req.body as Omit<CompanyCard, 'id'>;
    const id = `CARD-${Date.now()}`;
    const [newCard] = await db.insert(schema.companyCards)
      .values({ 
        id,
        last4: card.cardNumber.last4,
        providerTokenId: card.cardNumber.providerTokenId,
        cardType: card.cardType,
        cardProvider: card.cardProvider,
        assignedTo: card.assignedTo,
        spendingLimitDaily: card.dailyLimit.toString(),
        spendingLimitMonthly: card.monthlyLimit.toString(),
        spendingLimitTransaction: card.transactionLimit.toString(),
        status: card.status,
        issueDate: card.issueDate,
        expiryDate: card.expirationDate
      })
      .returning();
    res.json(convertDbCompanyCard(newCard));
  } catch (error) {
    console.error('Error adding company card:', error);
    res.status(500).json({ error: 'Failed to add company card' });
  }
});

app.put('/api/company-cards/:id', async (req, res) => {
  try {
    const cardId = req.params.id;
    const card = req.body as CompanyCard;
    const [updatedCard] = await db.update(schema.companyCards)
      .set({
        last4: card.cardNumber.last4,
        providerTokenId: card.cardNumber.providerTokenId,
        cardType: card.cardType,
        cardProvider: card.cardProvider,
        assignedTo: card.assignedTo,
        spendingLimitDaily: card.dailyLimit.toString(),
        spendingLimitMonthly: card.monthlyLimit.toString(),
        spendingLimitTransaction: card.transactionLimit.toString(),
        status: card.status,
        issueDate: card.issueDate,
        expiryDate: card.expirationDate
      })
      .where(eq(schema.companyCards.id, cardId))
      .returning();
    res.json(convertDbCompanyCard(updatedCard));
  } catch (error) {
    console.error('Error updating company card:', error);
    res.status(500).json({ error: 'Failed to update company card' });
  }
});

// Card Transactions
app.get('/api/card-transactions', async (req, res) => {
  try {
    const dbTransactions = await db.select().from(schema.cardTransactions).orderBy(desc(schema.cardTransactions.createdAt));
    const transactions = dbTransactions.map(convertDbCardTransaction);
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching card transactions:', error);
    res.status(500).json({ error: 'Failed to fetch card transactions' });
  }
});

app.post('/api/card-transactions', async (req, res) => {
  try {
    const transaction = req.body as Omit<CardTransaction, 'id'>;
    const id = `TXN-${Date.now()}`;
    const [newTransaction] = await db.insert(schema.cardTransactions)
      .values({ 
        id,
        cardId: transaction.cardId,
        merchantName: transaction.merchantName,
        merchantCategory: mapSpendCategoryToDb(transaction.merchantCategory),
        amount: transaction.amount.toString(),
        currency: transaction.currency,
        transactionDate: transaction.transactionDate,
        postingDate: transaction.postingDate,
        description: transaction.description,
        status: transaction.status,
        location: transaction.location,
        accountingCode: transaction.accountingCode,
        notes: transaction.notes
      })
      .returning();
    res.json(convertDbCardTransaction(newTransaction));
  } catch (error) {
    console.error('Error adding card transaction:', error);
    res.status(500).json({ error: 'Failed to add card transaction' });
  }
});

// Purchase Orders
app.get('/api/purchase-orders', async (req, res) => {
  try {
    const orders = await db.select().from(schema.purchaseOrders)
      .orderBy(desc(schema.purchaseOrders.createdAt));
    
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await db.select().from(schema.purchaseOrderItems)
          .where(eq(schema.purchaseOrderItems.purchaseOrderId, order.id));
        return convertDbPurchaseOrder(order, items);
      })
    );

    res.json(ordersWithItems);
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
});

app.post('/api/purchase-orders', async (req, res) => {
  try {
    const order = req.body as Omit<PurchaseOrder, 'id' | 'date'>;
    const id = `PO-${Date.now()}`;
    const date = new Date().toISOString().split('T')[0];
    
    const [newOrder] = await db.insert(schema.purchaseOrders)
      .values({ 
        id, 
        date, 
        vendor: order.vendor,
        totalAmount: order.totalAmount.toString(),
        status: order.status
      })
      .returning();

    // Insert purchase order items
    const items = await Promise.all(
      order.items.map(item => 
        db.insert(schema.purchaseOrderItems)
          .values({ 
            purchaseOrderId: id, 
            description: item.description,
            amount: item.amount.toString()
          })
          .returning()
      )
    );

    res.json(convertDbPurchaseOrder(newOrder, items.flat()));
  } catch (error) {
    console.error('Error adding purchase order:', error);
    res.status(500).json({ error: 'Failed to add purchase order' });
  }
});

// Invoices
app.get('/api/invoices', async (req, res) => {
  try {
    const dbInvoices = await db.select().from(schema.invoices).orderBy(desc(schema.invoices.createdAt));
    const invoices = dbInvoices.map(convertDbInvoice);
    res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

app.post('/api/invoices', async (req, res) => {
  try {
    const invoice = req.body as Omit<Invoice, 'id' | 'issueDate'>;
    const id = `INV-${invoice.type}-${Date.now()}`;
    const issueDate = new Date().toISOString().split('T')[0];
    
    const [newInvoice] = await db.insert(schema.invoices)
      .values({ 
        id,
        type: invoice.type,
        counterparty: invoice.counterparty,
        issueDate,
        dueDate: invoice.dueDate,
        amount: invoice.amount.toString(),
        status: invoice.status
      })
      .returning();
    
    res.json(convertDbInvoice(newInvoice));
  } catch (error) {
    console.error('Error adding invoice:', error);
    res.status(500).json({ error: 'Failed to add invoice' });
  }
});

app.put('/api/invoices/:id', async (req, res) => {
  try {
    const invoiceId = req.params.id;
    const updates = req.body;
    const [updatedInvoice] = await db.update(schema.invoices)
      .set(updates)
      .where(eq(schema.invoices.id, invoiceId))
      .returning();
    res.json(convertDbInvoice(updatedInvoice));
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});

// ConsulCredits Transactions
app.get('/api/consul-credits-transactions', async (req, res) => {
  try {
    const dbTransactions = await db.select().from(schema.consulCreditsTransactions).orderBy(desc(schema.consulCreditsTransactions.createdAt));
    res.json(dbTransactions);
  } catch (error) {
    console.error('Error fetching consul credits transactions:', error);
    res.status(500).json({ error: 'Failed to fetch consul credits transactions' });
  }
});

app.post('/api/consul-credits-transactions', async (req, res) => {
  try {
    const transaction = req.body as Omit<ConsulCreditsTransaction, 'id'>;
    const id = `CC-${Date.now()}`;
    const [newTransaction] = await db.insert(schema.consulCreditsTransactions)
      .values({ 
        id, 
        txHash: transaction.txHash,
        blockNumber: transaction.blockNumber,
        timestamp: new Date(transaction.timestamp),
        eventType: transaction.eventType,
        userAddress: transaction.userAddress,
        tokenAddress: transaction.tokenAddress,
        tokenSymbol: transaction.tokenSymbol,
        tokenAmount: transaction.tokenAmount.toString(),
        consulCreditsAmount: transaction.consulCreditsAmount.toString(),
        exchangeRate: transaction.exchangeRate?.toString(),
        ledgerReference: transaction.ledgerReference,
        journalEntryId: transaction.journalEntryId,
        confirmations: transaction.confirmations,
        status: transaction.status
      })
      .returning();
    res.json(newTransaction);
  } catch (error) {
    console.error('Error adding consul credits transaction:', error);
    res.status(500).json({ error: 'Failed to add consul credits transaction' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.API_PORT || 3001;

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});

export { app };