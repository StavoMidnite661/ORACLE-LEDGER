import { db } from '../server/db';
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

// Convert database company card to TypeScript CompanyCard (partial mapping for missing properties)
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
    assignedEntity: 'SOVR Development Holdings LLC' as Entity, // Default assignment
    status: dbCard.status === 'Active' ? 'Active' : dbCard.status === 'Suspended' ? 'Suspended' : 'Cancelled',
    monthlyLimit: parseNumeric(dbCard.spendingLimitMonthly || 0),
    dailyLimit: parseNumeric(dbCard.spendingLimitDaily || 0),
    transactionLimit: parseNumeric(dbCard.spendingLimitTransaction || 0),
    spentThisMonth: 0, // Default, would need separate calculation
    spentThisQuarter: 0, // Default, would need separate calculation
    spentThisYear: 0, // Default, would need separate calculation
    allowedCategories: [], // Default empty array
    blockedCategories: [], // Default empty array
    expirationDate: dbCard.expiryDate,
    issueDate: dbCard.issueDate,
    lastActivity: undefined, // Optional field
    billingAddress: '', // Default empty, not in DB schema
    notes: undefined // Optional field
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
    receiptUrl: undefined, // Optional field not in DB schema
    location: dbTransaction.location,
    accountingCode: dbTransaction.accountingCode,
    journalEntryId: undefined, // Optional field not in DB schema
    approvedBy: undefined, // Optional field not in DB schema
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

export class DatabaseService {
  // Employees
  async getEmployees(): Promise<Employee[]> {
    const dbEmployees = await db.select().from(schema.employees).orderBy(desc(schema.employees.createdAt));
    return dbEmployees.map(convertDbEmployee);
  }

  async addEmployee(employee: Omit<Employee, 'id'>): Promise<Employee> {
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
    return convertDbEmployee(newEmployee);
  }

  async updateEmployee(employee: Employee): Promise<Employee> {
    const [updatedEmployee] = await db.update(schema.employees)
      .set({
        name: employee.name,
        annualSalary: employee.annualSalary.toString(),
        bankRoutingNumber: employee.bankRoutingNumber,
        bankAccountNumber: employee.bankAccountNumber,
        paymentMethod: employee.paymentMethod,
        taxId: employee.taxId
      })
      .where(eq(schema.employees.id, employee.id))
      .returning();
    return convertDbEmployee(updatedEmployee);
  }

  // Journal Entries
  async getJournalEntries(): Promise<JournalEntry[]> {
    const entries = await db.select().from(schema.journalEntries)
      .orderBy(desc(schema.journalEntries.createdAt));
    
    const entriesWithLines = await Promise.all(
      entries.map(async (entry) => {
        const lines = await db.select().from(schema.journalLines)
          .where(eq(schema.journalLines.journalEntryId, entry.id));
        return convertDbJournalEntry(entry, lines);
      })
    );

    return entriesWithLines;
  }

  async addJournalEntry(entry: Omit<JournalEntry, 'id' | 'date'>): Promise<JournalEntry> {
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

    return convertDbJournalEntry(newEntry, lines.flat());
  }

  // Vendors
  async getVendors(): Promise<Vendor[]> {
    const dbVendors = await db.select().from(schema.vendors).orderBy(desc(schema.vendors.createdAt));
    return dbVendors.map(convertDbVendor);
  }

  async addVendor(vendor: Omit<Vendor, 'id' | 'createdDate'>): Promise<Vendor> {
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
    return convertDbVendor(newVendor);
  }

  // Company Cards
  async getCompanyCards(): Promise<CompanyCard[]> {
    const dbCards = await db.select().from(schema.companyCards).orderBy(desc(schema.companyCards.createdAt));
    return dbCards.map(convertDbCompanyCard);
  }

  async addCompanyCard(card: Omit<CompanyCard, 'id'>): Promise<CompanyCard> {
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
    return convertDbCompanyCard(newCard);
  }

  async updateCompanyCard(card: CompanyCard): Promise<CompanyCard> {
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
      .where(eq(schema.companyCards.id, card.id))
      .returning();
    return convertDbCompanyCard(updatedCard);
  }

  // Card Transactions
  async getCardTransactions(): Promise<CardTransaction[]> {
    const dbTransactions = await db.select().from(schema.cardTransactions).orderBy(desc(schema.cardTransactions.createdAt));
    return dbTransactions.map(convertDbCardTransaction);
  }

  async addCardTransaction(transaction: Omit<CardTransaction, 'id'>): Promise<CardTransaction> {
    const id = `TXN-${Date.now()}`;
    const [newTransaction] = await db.insert(schema.cardTransactions)
      .values({ 
        id,
        cardId: transaction.cardId,
        merchantName: transaction.merchantName,
        merchantCategory: transaction.merchantCategory as any,
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
    return convertDbCardTransaction(newTransaction);
  }

  // Purchase Orders
  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    const orders = await db.select().from(schema.purchaseOrders)
      .orderBy(desc(schema.purchaseOrders.createdAt));
    
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await db.select().from(schema.purchaseOrderItems)
          .where(eq(schema.purchaseOrderItems.purchaseOrderId, order.id));
        return convertDbPurchaseOrder(order, items);
      })
    );

    return ordersWithItems;
  }

  async addPurchaseOrder(order: Omit<PurchaseOrder, 'id' | 'date'>): Promise<PurchaseOrder> {
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

    return convertDbPurchaseOrder(newOrder, items.flat());
  }

  // Invoices
  async getInvoices(): Promise<Invoice[]> {
    const dbInvoices = await db.select().from(schema.invoices).orderBy(desc(schema.invoices.createdAt));
    return dbInvoices.map(convertDbInvoice);
  }

  async addInvoice(invoice: Omit<Invoice, 'id'>): Promise<Invoice> {
    const id = `INV-${Date.now()}`;
    const [newInvoice] = await db.insert(schema.invoices)
      .values({ 
        id, 
        type: invoice.type,
        counterparty: invoice.counterparty,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        amount: invoice.amount.toString(),
        status: invoice.status
      })
      .returning();
    return convertDbInvoice(newInvoice);
  }

  // Consul Credits Transactions
  async getConsulCreditsTransactions(): Promise<ConsulCreditsTransaction[]> {
    const dbTransactions = await db.select().from(schema.consulCreditsTransactions)
      .orderBy(desc(schema.consulCreditsTransactions.createdAt));
    return dbTransactions.map(dbTx => ({
      ...dbTx,
      timestamp: formatDateToISO(dbTx.timestamp),
      eventType: dbTx.eventType as any,
      status: dbTx.status as any
    }));
  }

  async addConsulCreditsTransaction(transaction: Omit<ConsulCreditsTransaction, 'id'>): Promise<ConsulCreditsTransaction> {
    const id = `CCT-${Date.now()}`;
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
        tokenAmount: transaction.tokenAmount,
        consulCreditsAmount: transaction.consulCreditsAmount,
        exchangeRate: transaction.exchangeRate,
        ledgerReference: transaction.ledgerReference,
        journalEntryId: transaction.journalEntryId,
        confirmations: transaction.confirmations,
        status: transaction.status
      })
      .returning();
    return {
      ...newTransaction,
      timestamp: formatDateToISO(newTransaction.timestamp),
      eventType: newTransaction.eventType as any,
      status: newTransaction.status as any
    };
  }

  // Card Reveal Audit
  async addCardRevealAudit(audit: {
    cardId: string;
    revealedBy: string;
    reason: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await db.insert(schema.cardRevealAudit)
      .values(audit);
  }

  // Initialize with mock data
  async initializeWithMockData(): Promise<void> {
    try {
      // Check if data already exists
      const existingEmployees = await this.getEmployees();
      if (existingEmployees.length > 0) {
        console.log('Database already has data, skipping initialization');
        return;
      }

      console.log('Initializing database with mock data...');
      
      // Import and insert mock data
      const constants = await import('../constants');
      const { mockEmployees, mockVendors } = constants;
      
      // Insert employees
      for (const employee of mockEmployees) {
        await db.insert(schema.employees)
          .values({
            id: employee.id,
            name: employee.name,
            annualSalary: employee.annualSalary.toString(),
            bankRoutingNumber: employee.bankRoutingNumber,
            bankAccountNumber: employee.bankAccountNumber,
            paymentMethod: employee.paymentMethod,
            taxId: employee.taxId,
            createdAt: new Date()
          })
          .onConflictDoNothing();
      }

      // Insert vendors
      for (const vendor of mockVendors) {
        await db.insert(schema.vendors)
          .values({ ...vendor, createdAt: new Date() })
          .onConflictDoNothing();
      }

      console.log('Mock data initialization complete');
    } catch (error) {
      console.error('Error initializing mock data:', error);
    }
  }
}

export const databaseService = new DatabaseService();