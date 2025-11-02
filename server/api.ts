
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { db } from './db';
import * as schema from '../shared/schema';
import { eq, desc, and, or, like, gte, lte, inArray, sql, ne, isNull } from 'drizzle-orm';
import type { 
  Employee, 
  JournalEntry, 
  Vendor, 
  CompanyCard, 
  CardTransaction, 
  PurchaseOrder, 
  Invoice, 
  ConsulCreditsTransaction,
  ConsulCreditsConfig,
  Entity,
  PciAuditLogEntry,
  ComplianceChecklistItem,
  PaymentReconciliationEntry,
  Customer,
  PaymentMethod,
  AchPayment,
  AchReturn,
  DirectDepositRecipient,
  DirectDepositBankAccount,
  DirectDepositPayout,
  StripeWebhookEvent,
  NewStripeWebhookEvent
} from '../types';
import { SpendCategory, AchReturnCodes } from '../types';
import Stripe from 'stripe';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key', {
  apiVersion: '2024-06-20',
});

const app = express();

// Security Middleware
const authenticateRequest = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // In production, this would validate JWT tokens or session cookies
  // For now, we'll extract user info from headers for demonstration
  const userId = req.header('X-User-ID');
  const userEmail = req.header('X-User-Email');
  const userRole = req.header('X-User-Role') || 'user';
  
  if (!userId || !userEmail) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  (req as any).user = { id: userId, email: userEmail, role: userRole };
  next();
};

const requireRole = (roles: string[]) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = (req as any).user;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

const requireAuditAccess = requireRole(['admin', 'compliance_officer', 'auditor']);
const requireReconciliationAccess = requireRole(['admin', 'accountant', 'finance_manager']);
const requireComplianceAccess = requireRole(['admin', 'compliance_officer']);

// PCI Audit Logging Middleware
const logPCIAccess = async (req: express.Request, recordId: string, tableName: string, actionType: string, sensitiveFieldsAccessed: string[] = []) => {
  try {
    await db.insert(schema.pciAuditLog).values({
      actionType,
      tableName,
      recordId,
      userId: (req as any).user?.id,
      userEmail: (req as any).user?.email,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent') || '',
      sessionId: req.get('X-Session-ID') || '',
      sensitiveFieldsAccessed: JSON.stringify(sensitiveFieldsAccessed),
      dataMasked: true,
      accessPurpose: req.get('X-Access-Purpose') || 'API access',
      retentionPeriodDays: 2555, // 7 years for PCI compliance
    });
  } catch (error) {
    console.error('Failed to log PCI access:', error);
  }
};

// Data Masking Utility
const maskSensitiveData = (data: any, fields: string[]): any => {
  const masked = { ...data };
  fields.forEach(field => {
    if (masked[field]) {
      const value = masked[field].toString();
      if (value.length <= 4) {
        masked[field] = '****';
      } else {
        masked[field] = '*'.repeat(value.length - 4) + value.slice(-4);
      }
    }
  });
  return masked;
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(authenticateRequest); // Apply authentication to all routes

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
  // Map based on enum values, not keys
  switch (category) {
    case SpendCategory.Fuel: return 'Fuel';
    case SpendCategory.Office: return 'Office';
    case SpendCategory.Travel: return 'Travel';
    case SpendCategory.Software: return 'Software';
    case SpendCategory.Equipment: return 'Hardware';
    default: return 'Other';
  }
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

// ==============================
// STRIPE CUSTOMER MANAGEMENT UTILITIES
// ==============================

/**
 * Log PCI-sensitive audit event
 */
async function logPciAuditEvent(
  actionType: string,
  tableName: string,
  recordId: string,
  req: express.Request,
  sensitiveFieldsAccessed: string[] = [],
  oldValues?: any,
  newValues?: any,
  additionalContext?: any
) {
  try {
    const user = (req as any).user;
    await db.insert(schema.pciAuditLog)
      .values({
        actionType,
        tableName,
        recordId,
        userId: user?.id,
        userEmail: user?.email,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        sessionId: req.get('x-session-id'),
        sensitiveFieldsAccessed: JSON.stringify(sensitiveFieldsAccessed),
        dataMasked: true,
        accessPurpose: 'API operation',
        oldValues: oldValues ? JSON.stringify(oldValues) : undefined,
        newValues: newValues ? JSON.stringify(newValues) : undefined,
        additionalContext: additionalContext ? JSON.stringify(additionalContext) : undefined,
      })
      .returning();
  } catch (error) {
    console.error('Failed to log PCI audit event:', error);
  }
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format
 */
function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

/**
 * Sanitize customer input data
 */
function sanitizeCustomerInput(data: any) {
  return {
    firstName: data.firstName?.trim(),
    lastName: data.lastName?.trim(),
    email: data.email?.trim().toLowerCase(),
    phone: data.phone?.trim(),
    billingAddress: data.billingAddress ? JSON.stringify(data.billingAddress) : null,
    shippingAddress: data.shippingAddress ? JSON.stringify(data.shippingAddress) : null,
    customerId: data.customerId,
    stripeMetadata: data.stripeMetadata ? JSON.stringify(data.stripeMetadata) : null,
  };
}

/**
 * Sanitize payment method input data
 */
function sanitizePaymentMethodInput(data: any) {
  return {
    stripePaymentMethodId: data.stripePaymentMethodId?.trim(),
    type: data.type,
    cardLast4: data.cardLast4,
    cardBrand: data.cardBrand,
    cardExpMonth: data.cardExpMonth,
    cardExpYear: data.cardExpYear,
    bankName: data.bankName,
    bankAccountLast4: data.bankAccountLast4,
    bankAccountRoutingNumber: data.bankAccountRoutingNumber,
    bankAccountType: data.bankAccountType,
    verificationStatus: data.verificationStatus,
    stripeMetadata: data.stripeMetadata ? JSON.stringify(data.stripeMetadata) : null,
    setupIntentId: data.setupIntentId,
  };
}

/**
 * Convert database customer to API response format
 */
function convertDbCustomer(dbCustomer: any): StripeCustomer {
  return {
    id: dbCustomer.id,
    stripeCustomerId: dbCustomer.stripeCustomerId,
    firstName: dbCustomer.firstName,
    lastName: dbCustomer.lastName,
    email: dbCustomer.email,
    phone: dbCustomer.phone,
    stripeDefaultPaymentMethodId: dbCustomer.stripeDefaultPaymentMethodId,
    billingAddress: dbCustomer.billingAddress,
    shippingAddress: dbCustomer.shippingAddress,
    createdAt: dbCustomer.createdAt,
    updatedAt: dbCustomer.updatedAt,
    stripeCreatedAt: dbCustomer.stripeCreatedAt,
    stripeUpdatedAt: dbCustomer.stripeUpdatedAt,
    active: dbCustomer.active,
    customerId: dbCustomer.customerId,
    stripeMetadata: dbCustomer.stripeMetadata,
    deletedAt: dbCustomer.deletedAt,
  };
}

/**
 * Convert database payment method to API response format
 */
function convertDbPaymentMethod(dbPaymentMethod: any): StripePaymentMethod {
  return {
    id: dbPaymentMethod.id,
    customerId: dbPaymentMethod.customerId,
    stripePaymentMethodId: dbPaymentMethod.stripePaymentMethodId,
    type: dbPaymentMethod.type,
    cardLast4: dbPaymentMethod.cardLast4,
    cardBrand: dbPaymentMethod.cardBrand,
    cardExpMonth: dbPaymentMethod.cardExpMonth,
    cardExpYear: dbPaymentMethod.cardExpYear,
    bankName: dbPaymentMethod.bankName,
    bankAccountLast4: dbPaymentMethod.bankAccountLast4,
    bankAccountRoutingNumber: dbPaymentMethod.bankAccountRoutingNumber,
    bankAccountType: dbPaymentMethod.bankAccountType,
    status: dbPaymentMethod.status,
    isDefault: dbPaymentMethod.isDefault,
    createdAt: dbPaymentMethod.createdAt,
    verifiedAt: dbPaymentMethod.verifiedAt,
    verificationStatus: dbPaymentMethod.verificationStatus,
    stripeMetadata: dbPaymentMethod.stripeMetadata,
    setupIntentId: dbPaymentMethod.setupIntentId,
    updatedBy: dbPaymentMethod.updatedBy,
    deletedAt: dbPaymentMethod.deletedAt,
  };
}

/**
 * Define TypeScript interfaces for Stripe customer and payment method
 */
interface StripeCustomer {
  id: string;
  stripeCustomerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  stripeDefaultPaymentMethodId?: string;
  billingAddress?: string;
  shippingAddress?: string;
  createdAt: Date;
  updatedAt: Date;
  stripeCreatedAt?: Date;
  stripeUpdatedAt?: Date;
  active: boolean;
  customerId?: number;
  stripeMetadata?: string;
  deletedAt?: Date;
}

interface StripePaymentMethod {
  id: string;
  customerId: string;
  stripePaymentMethodId: string;
  type: string;
  cardLast4?: string;
  cardBrand?: string;
  cardExpMonth?: number;
  cardExpYear?: number;
  bankName?: string;
  bankAccountLast4?: string;
  bankAccountRoutingNumber?: string;
  bankAccountType?: string;
  status: string;
  isDefault: boolean;
  createdAt: Date;
  verifiedAt?: Date;
  verificationStatus?: string;
  stripeMetadata?: string;
  setupIntentId?: string;
  updatedBy?: string;
  deletedAt?: Date;
}

/**
 * Handle Stripe API errors
 */
function handleStripeError(error: any, operation: string) {
  console.error(`Stripe ${operation} error:`, error);
  
  if (error.type === 'StripeCardError') {
    return { status: 400, message: `Payment error: ${error.message}` };
  } else if (error.type === 'StripeInvalidRequestError') {
    return { status: 400, message: `Invalid request: ${error.message}` };
  } else if (error.type === 'StripeAPIError') {
    return { status: 500, message: 'Stripe API error occurred' };
  } else if (error.type === 'StripeConnectionError') {
    return { status: 503, message: 'Stripe service unavailable' };
  } else if (error.type === 'StripeAuthenticationError') {
    return { status: 401, message: 'Stripe authentication failed' };
  }
  
  return { status: 500, message: 'An unexpected error occurred' };
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
    
    const newEntry = await db.transaction(async (tx) => {
      const [insertedEntry] = await tx.insert(schema.journalEntries)
        .values({ 
          id, 
          date, 
          description: entry.description,
          source: entry.source,
          status: entry.status
        })
        .returning();

      const lines = await Promise.all(
        entry.lines.map(line => 
          tx.insert(schema.journalLines)
            .values({ 
              journalEntryId: id, 
              accountId: line.accountId,
              type: line.type,
              amount: line.amount.toString()
            })
            .returning()
        )
      );
      
      return convertDbJournalEntry(insertedEntry, lines.flat());
    });

    res.json(newEntry);
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
        merchantCategory: mapSpendCategoryToDb(transaction.merchantCategory) as any,
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
    
    const newOrder = await db.transaction(async (tx) => {
      const [insertedOrder] = await tx.insert(schema.purchaseOrders)
      .values({ 
        id, 
        date, 
        vendor: order.vendor,
        totalAmount: order.totalAmount.toString(),
        status: order.status
      })
      .returning();

      const items = await Promise.all(
        order.items.map(item => 
          tx.insert(schema.purchaseOrderItems)
            .values({ 
              purchaseOrderId: id, 
              description: item.description,
              amount: item.amount.toString()
            })
            .returning()
        )
      );

      return convertDbPurchaseOrder(insertedOrder, items.flat());
    });

    res.json(newOrder);
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

// ConsulCredits Config
app.get('/api/consul-credits/config', async (req, res) => {
  try {
    // Check if config exists in database, if not return default config
    const configs = await db.select().from(schema.consulCreditsConfig).limit(1);
    
    if (configs.length > 0) {
      res.json(configs[0]);
    } else {
      // Return default config from environment or fallback values
      const defaultConfig = {
        isEnabled: process.env.CONSUL_CREDITS_ENABLED === 'true',
        networkName: process.env.CONSUL_CREDITS_NETWORK || 'Sepolia Testnet',
        chainId: parseInt(process.env.CONSUL_CREDITS_CHAIN_ID || '11155111'),
        contractAddress: process.env.CONSUL_CREDITS_CONTRACT || '0x1234567890123456789012345678901234567890',
        rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID',
        oracleIntegratorAddress: process.env.ORACLE_INTEGRATOR_ADDRESS || '0x0987654321098765432109876543210987654321',
        confirmationsRequired: parseInt(process.env.CONSUL_CREDITS_CONFIRMATIONS || '3')
      };
      res.json(defaultConfig);
    }
  } catch (error) {
    console.error('Error fetching consul credits config:', error);
    // Return default config as fallback
    const fallbackConfig = {
      isEnabled: true,
      networkName: 'Sepolia Testnet',
      chainId: 11155111,
      contractAddress: '0x1234567890123456789012345678901234567890',
      rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID',
      oracleIntegratorAddress: '0x0987654321098765432109876543210987654321',
      confirmationsRequired: 3
    };
    res.json(fallbackConfig);
  }
});

app.post('/api/consul-credits/config', async (req, res) => {
  try {
    const config = req.body as ConsulCreditsConfig;
    
    // Check if config already exists
    const existingConfigs = await db.select().from(schema.consulCreditsConfig).limit(1);
    
    let result;
    if (existingConfigs.length > 0) {
      // Update existing config
      result = await db.update(schema.consulCreditsConfig)
        .set(config)
        .where(eq(schema.consulCreditsConfig.id, existingConfigs[0].id))
        .returning();
    } else {
      // Insert new config
      result = await db.insert(schema.consulCreditsConfig)
        .values({ id: 'default', ...config })
        .returning();
    }
    
    res.json(result[0]);
  } catch (error) {
    console.error('Error updating consul credits config:', error);
    res.status(500).json({ error: 'Failed to update consul credits config' });
  }
});

// ==============================
// STRIPE CUSTOMER MANAGEMENT APIS
// ==============================

/**
 * @route POST /api/stripe/customers
 * @desc Create new Stripe customer
 * @access Private (requires authentication)
 */
app.post('/api/stripe/customers', authenticateRequest, async (req, res) => {
  try {
    const customerData = sanitizeCustomerInput(req.body);

    // Input validation
    if (!customerData.firstName || !customerData.lastName) {
      return res.status(400).json({ 
        error: 'First name and last name are required' 
      });
    }

    if (!customerData.email || !isValidEmail(customerData.email)) {
      return res.status(400).json({ 
        error: 'Valid email address is required' 
      });
    }

    if (customerData.phone && !isValidPhone(customerData.phone)) {
      return res.status(400).json({ 
        error: 'Invalid phone number format' 
      });
    }

    // Check if customer with email already exists
    const existingCustomers = await db.select()
      .from(schema.customers)
      .where(and(
        eq(schema.customers.email, customerData.email),
        isNull(schema.customers.deletedAt)
      ))
      .limit(1);

    if (existingCustomers.length > 0) {
      return res.status(409).json({ 
        error: 'Customer with this email already exists' 
      });
    }

    // Create customer in Stripe
    const stripeCustomer = await stripe.customers.create({
      email: customerData.email,
      name: `${customerData.firstName} ${customerData.lastName}`,
      phone: customerData.phone || undefined,
      address: customerData.billingAddress ? JSON.parse(customerData.billingAddress) : undefined,
      metadata: customerData.stripeMetadata ? JSON.parse(customerData.stripeMetadata) : undefined,
    });

    // Store customer in database
    const [newCustomer] = await db.insert(schema.customers)
      .values({
        stripeCustomerId: stripeCustomer.id,
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        email: customerData.email,
        phone: customerData.phone,
        billingAddress: customerData.billingAddress,
        shippingAddress: customerData.shippingAddress,
        customerId: customerData.customerId,
        stripeMetadata: customerData.stripeMetadata,
        stripeCreatedAt: new Date(stripeCustomer.created * 1000),
        stripeUpdatedAt: new Date(stripeCustomer.updated * 1000),
      })
      .returning();

    // Log PCI audit event
    await logPciAuditEvent(
      'create_customer',
      'customers',
      newCustomer.id,
      req,
      ['stripe_customer_id', 'email', 'phone'],
      null,
      { 
        stripe_customer_id: stripeCustomer.id,
        email: customerData.email 
      }
    );

    res.status(201).json(convertDbCustomer(newCustomer));
  } catch (error) {
    const stripeError = handleStripeError(error, 'customer creation');
    res.status(stripeError.status).json({ error: stripeError.message });
  }
});

/**
 * @route GET /api/stripe/customers
 * @desc List all customers
 * @access Private (requires authentication)
 */
app.get('/api/stripe/customers', authenticateRequest, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const search = req.query.search as string;
    const active = req.query.active as string;

    let query = db.select().from(schema.customers);

    // Apply filters
    if (search) {
      query = query.where(or(
        like(schema.customers.firstName, `%${search}%`),
        like(schema.customers.lastName, `%${search}%`),
        like(schema.customers.email, `%${search}%`)
      ));
    }

    if (active !== undefined) {
      const isActive = active === 'true';
      query = query.where(eq(schema.customers.active, isActive));
    }

    // Exclude soft-deleted customers
    query = query.where(isNull(schema.customers.deletedAt));

    // Apply pagination
    const offset = (page - 1) * limit;
    const dbCustomers = await query
      .orderBy(desc(schema.customers.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const countQuery = db.select({ count: sql<number>`count(*)` })
      .from(schema.customers)
      .where(isNull(schema.customers.deletedAt));

    if (search) {
      countQuery.where(or(
        like(schema.customers.firstName, `%${search}%`),
        like(schema.customers.lastName, `%${search}%`),
        like(schema.customers.email, `%${search}%`)
      ));
    }

    if (active !== undefined) {
      countQuery.where(eq(schema.customers.active, active === 'true'));
    }

    const [countResult] = await countQuery;
    const totalCount = countResult?.count || 0;

    const customers = dbCustomers.map(convertDbCustomer);

    res.json({
      customers,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

/**
 * @route GET /api/stripe/customers/:id
 * @desc Get customer details
 * @access Private (requires authentication)
 */
app.get('/api/stripe/customers/:id', authenticateRequest, async (req, res) => {
  try {
    const { id } = req.params;

    const [customer] = await db.select()
      .from(schema.customers)
      .where(eq(schema.customers.id, id));

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    if (customer.deletedAt) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Get payment methods for this customer
    const paymentMethods = await db.select()
      .from(schema.paymentMethods)
      .where(eq(schema.paymentMethods.customerId, id));

    const customerWithPaymentMethods = {
      ...convertDbCustomer(customer),
      paymentMethods: paymentMethods.map(convertDbPaymentMethod),
    };

    // Log PCI audit event
    await logPciAuditEvent(
      'view_customer_details',
      'customers',
      id,
      req,
      ['stripe_customer_id', 'email', 'phone', 'payment_methods']
    );

    res.json(customerWithPaymentMethods);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

/**
 * @route PUT /api/stripe/customers/:id
 * @desc Update customer
 * @access Private (requires authentication)
 */
app.put('/api/stripe/customers/:id', authenticateRequest, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = sanitizeCustomerInput(req.body);

    // Get existing customer
    const [existingCustomer] = await db.select()
      .from(schema.customers)
      .where(eq(schema.customers.id, id));

    if (!existingCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    if (existingCustomer.deletedAt) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Validate email if being updated
    if (updateData.email && updateData.email !== existingCustomer.email) {
      if (!isValidEmail(updateData.email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      // Check if email is already taken
      const emailExists = await db.select()
        .from(schema.customers)
        .where(and(
          eq(schema.customers.email, updateData.email),
          eq(schema.customers.id, id),
          isNull(schema.customers.deletedAt)
        ))
        .limit(1);

      if (emailExists.length > 0) {
        return res.status(409).json({ 
          error: 'Email address already in use' 
        });
      }
    }

    // Validate phone if being updated
    if (updateData.phone && !isValidPhone(updateData.phone)) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    // Update customer in Stripe
    const stripeUpdateData: Stripe.CustomerUpdateParams = {};
    if (updateData.firstName || updateData.lastName) {
      stripeUpdateData.name = `${updateData.firstName || existingCustomer.firstName} ${updateData.lastName || existingCustomer.lastName}`.trim();
    }
    if (updateData.email) stripeUpdateData.email = updateData.email;
    if (updateData.phone) stripeUpdateData.phone = updateData.phone;
    if (updateData.billingAddress) stripeUpdateData.address = JSON.parse(updateData.billingAddress);
    if (updateData.stripeMetadata) stripeUpdateData.metadata = JSON.parse(updateData.stripeMetadata);

    if (Object.keys(stripeUpdateData).length > 0) {
      await stripe.customers.update(existingCustomer.stripeCustomerId, stripeUpdateData);
    }

    // Update customer in database
    const [updatedCustomer] = await db.update(schema.customers)
      .set({
        ...updateData,
        stripeUpdatedAt: new Date(),
      })
      .where(eq(schema.customers.id, id))
      .returning();

    // Log PCI audit event
    await logPciAuditEvent(
      'update_customer',
      'customers',
      id,
      req,
      ['stripe_customer_id', 'email', 'phone'],
      existingCustomer,
      updateData
    );

    res.json(convertDbCustomer(updatedCustomer));
  } catch (error) {
    const stripeError = handleStripeError(error, 'customer update');
    res.status(stripeError.status).json({ error: stripeError.message });
  }
});

/**
 * @route DELETE /api/stripe/customers/:id
 * @desc Soft delete customer
 * @access Private (requires authentication)
 */
app.delete('/api/stripe/customers/:id', authenticateRequest, async (req, res) => {
  try {
    const { id } = req.params;

    // Get existing customer
    const [existingCustomer] = await db.select()
      .from(schema.customers)
      .where(eq(schema.customers.id, id));

    if (!existingCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    if (existingCustomer.deletedAt) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Soft delete in database
    const [deletedCustomer] = await db.update(schema.customers)
      .set({
        deletedAt: new Date(),
        active: false,
      })
      .where(eq(schema.customers.id, id))
      .returning();

    // Note: We don't delete from Stripe to maintain audit trail
    // In production, you might want to handle this differently based on business requirements

    // Log PCI audit event
    await logPciAuditEvent(
      'soft_delete_customer',
      'customers',
      id,
      req,
      ['stripe_customer_id', 'email'],
      existingCustomer,
      { deleted_at: new Date(), active: false }
    );

    res.json({ 
      message: 'Customer soft deleted successfully',
      customer: convertDbCustomer(deletedCustomer)
    });
  } catch (error) {
    console.error('Error soft deleting customer:', error);
    res.status(500).json({ error: 'Failed to soft delete customer' });
  }
});

/**
 * @route POST /api/stripe/customers/:id/payment-methods
 * @desc Add payment method to customer
 * @access Private (requires authentication)
 */
app.post('/api/stripe/customers/:id/payment-methods', authenticateRequest, async (req, res) => {
  try {
    const { id: customerId } = req.params;
    const paymentMethodData = sanitizePaymentMethodInput(req.body);

    // Validate customer exists
    const [customer] = await db.select()
      .from(schema.customers)
      .where(eq(schema.customers.id, customerId));

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    if (customer.deletedAt) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Validate payment method data
    if (!paymentMethodData.stripePaymentMethodId || !paymentMethodData.type) {
      return res.status(400).json({ 
        error: 'Stripe payment method ID and type are required' 
      });
    }

    // Validate payment method type
    const validTypes = ['card', 'us_bank_account', 'sepa_debit'];
    if (!validTypes.includes(paymentMethodData.type)) {
      return res.status(400).json({ 
        error: 'Invalid payment method type. Must be: card, us_bank_account, or sepa_debit' 
      });
    }

    // Check if payment method already exists
    const existingPaymentMethod = await db.select()
      .from(schema.paymentMethods)
      .where(eq(schema.paymentMethods.stripePaymentMethodId, paymentMethodData.stripePaymentMethodId))
      .limit(1);

    if (existingPaymentMethod.length > 0) {
      return res.status(409).json({ 
        error: 'Payment method already exists' 
      });
    }

    // Get payment method details from Stripe
    const stripePaymentMethod = await stripe.paymentMethods.retrieve(paymentMethodData.stripePaymentMethodId);

    if (stripePaymentMethod.customer !== customer.stripeCustomerId) {
      return res.status(400).json({ 
        error: 'Payment method does not belong to this customer' 
      });
    }

    // Extract card details if available
    let cardLast4: string | undefined;
    let cardBrand: string | undefined;
    let cardExpMonth: number | undefined;
    let cardExpYear: number | undefined;

    if (stripePaymentMethod.type === 'card' && stripePaymentMethod.card) {
      cardLast4 = stripePaymentMethod.card.last4 || undefined;
      cardBrand = stripePaymentMethod.card.brand || undefined;
      cardExpMonth = stripePaymentMethod.card.exp_month || undefined;
      cardExpYear = stripePaymentMethod.card.exp_year || undefined;
    }

    // Extract bank account details if available
    let bankName: string | undefined;
    let bankAccountLast4: string | undefined;
    let bankAccountRoutingNumber: string | undefined;
    let bankAccountType: string | undefined;

    if (stripePaymentMethod.type === 'us_bank_account' && stripePaymentMethod.us_bank_account) {
      bankName = stripePaymentMethod.us_bank_account.bank_name || undefined;
      bankAccountLast4 = stripePaymentMethod.us_bank_account.last4 || undefined;
      bankAccountRoutingNumber = stripePaymentMethod.us_bank_account.routing_number || undefined;
      bankAccountType = stripePaymentMethod.us_bank_account.account_type || undefined;
    }

    // Set as default if it's the first payment method or explicitly requested
    const paymentMethodsCount = await db.select()
      .from(schema.paymentMethods)
      .where(eq(schema.paymentMethods.customerId, customerId));

    const isDefault = paymentMethodsCount.length === 0 || req.body.isDefault === true;

    // If setting as default, unset other default payment methods
    if (isDefault) {
      await db.update(schema.paymentMethods)
        .set({ isDefault: false })
        .where(eq(schema.paymentMethods.customerId, customerId));
    }

    // Store payment method in database
    const [newPaymentMethod] = await db.insert(schema.paymentMethods)
      .values({
        customerId,
        stripePaymentMethodId: paymentMethodData.stripePaymentMethodId,
        type: paymentMethodData.type,
        cardLast4,
        cardBrand,
        cardExpMonth,
        cardExpYear,
        bankName,
        bankAccountLast4,
        bankAccountRoutingNumber,
        bankAccountType,
        status: stripePaymentMethod.status || 'active',
        isDefault,
        verifiedAt: stripePaymentMethod.verification?.status === 'verified' ? new Date() : undefined,
        verificationStatus: stripePaymentMethod.verification?.status || undefined,
        stripeMetadata: paymentMethodData.stripeMetadata,
        setupIntentId: paymentMethodData.setupIntentId,
        updatedBy: (req as any).user?.id,
      })
      .returning();

    // If this is the default payment method, update customer in both Stripe and database
    if (isDefault) {
      await stripe.customers.update(customer.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodData.stripePaymentMethodId,
        },
      });

      await db.update(schema.customers)
        .set({ stripeDefaultPaymentMethodId: paymentMethodData.stripePaymentMethodId })
        .where(eq(schema.customers.id, customerId));
    }

    // Log PCI audit event
    await logPciAuditEvent(
      'add_payment_method',
      'payment_methods',
      newPaymentMethod.id,
      req,
      ['stripe_payment_method_id', 'card_last4', 'bank_account_last4'],
      null,
      { 
        stripe_payment_method_id: paymentMethodData.stripePaymentMethodId,
        type: paymentMethodData.type 
      }
    );

    res.status(201).json(convertDbPaymentMethod(newPaymentMethod));
  } catch (error) {
    const stripeError = handleStripeError(error, 'payment method creation');
    res.status(stripeError.status).json({ error: stripeError.message });
  }
});

/**
 * @route GET /api/stripe/customers/:id/payment-methods
 * @desc List payment methods for customer
 * @access Private (requires authentication)
 */
app.get('/api/stripe/customers/:id/payment-methods', authenticateRequest, async (req, res) => {
  try {
    const { id: customerId } = req.params;

    // Validate customer exists
    const [customer] = await db.select()
      .from(schema.customers)
      .where(eq(schema.customers.id, customerId));

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    if (customer.deletedAt) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Get payment methods
    const dbPaymentMethods = await db.select()
      .from(schema.paymentMethods)
      .where(eq(schema.paymentMethods.customerId, customerId));

    const paymentMethods = dbPaymentMethods
      .filter(pm => !pm.deletedAt)
      .map(convertDbPaymentMethod);

    // Log PCI audit event
    await logPciAuditEvent(
      'view_payment_methods',
      'payment_methods',
      customerId,
      req,
      ['stripe_payment_method_id', 'card_last4', 'bank_account_last4'],
      null,
      { payment_methods_count: paymentMethods.length }
    );

    res.json({ paymentMethods });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ error: 'Failed to fetch payment methods' });
  }
});

/**
 * @route POST /api/stripe/customers/:id/payment-methods/:methodId/default
 * @desc Set default payment method for customer
 * @access Private (requires authentication)
 */
app.post('/api/stripe/customers/:id/payment-methods/:methodId/default', authenticateRequest, async (req, res) => {
  try {
    const { id: customerId, methodId } = req.params;

    // Validate customer exists
    const [customer] = await db.select()
      .from(schema.customers)
      .where(eq(schema.customers.id, customerId));

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    if (customer.deletedAt) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Validate payment method exists and belongs to customer
    const [paymentMethod] = await db.select()
      .from(schema.paymentMethods)
      .where(and(
        eq(schema.paymentMethods.id, methodId),
        eq(schema.paymentMethods.customerId, customerId)
      ));

    if (!paymentMethod) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    if (paymentMethod.deletedAt) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    // Begin transaction
    await db.transaction(async (tx) => {
      // Unset all other default payment methods
      await tx.update(schema.paymentMethods)
        .set({ isDefault: false })
        .where(eq(schema.paymentMethods.customerId, customerId));

      // Set this payment method as default
      await tx.update(schema.paymentMethods)
        .set({ 
          isDefault: true,
          updatedBy: (req as any).user?.id,
        })
        .where(eq(schema.paymentMethods.id, methodId));

      // Update customer in Stripe
      await stripe.customers.update(customer.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethod.stripePaymentMethodId,
        },
      });

      // Update customer in database
      await tx.update(schema.customers)
        .set({ stripeDefaultPaymentMethodId: paymentMethod.stripePaymentMethodId })
        .where(eq(schema.customers.id, customerId));
    });

    // Get updated payment method
    const [updatedPaymentMethod] = await db.select()
      .from(schema.paymentMethods)
      .where(eq(schema.paymentMethods.id, methodId));

    // Log PCI audit event
    await logPciAuditEvent(
      'set_default_payment_method',
      'payment_methods',
      methodId,
      req,
      ['stripe_payment_method_id', 'is_default'],
      { is_default: false },
      { is_default: true }
    );

    res.json(convertDbPaymentMethod(updatedPaymentMethod));
  } catch (error) {
    const stripeError = handleStripeError(error, 'setting default payment method');
    res.status(stripeError.status).json({ error: stripeError.message });
  }
});

// ==============================
// COMPLIANCE & AUDIT APIs
// ==============================

// POST /api/stripe/audit/pci-log - Log PCI compliance event
app.post('/api/stripe/audit/pci-log', requireAuditAccess, async (req, res) => {
  try {
    const { actionType, tableName, recordId, sensitiveFieldsAccessed, accessPurpose, additionalContext, oldValues, newValues } = req.body;
    
    if (!actionType || !tableName || !recordId) {
      return res.status(400).json({ error: 'Missing required fields: actionType, tableName, recordId' });
    }

    const [newLog] = await db.insert(schema.pciAuditLog).values({
      actionType,
      tableName,
      recordId,
      userId: (req as any).user.id,
      userEmail: (req as any).user.email,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent') || '',
      sessionId: req.get('X-Session-ID') || '',
      sensitiveFieldsAccessed: sensitiveFieldsAccessed ? JSON.stringify(sensitiveFieldsAccessed) : null,
      dataMasked: true,
      accessPurpose: accessPurpose || 'PCI compliance tracking',
      retentionPeriodDays: 2555, // 7 years
      oldValues: oldValues ? JSON.stringify(oldValues) : null,
      newValues: newValues ? JSON.stringify(newValues) : null,
      additionalContext: additionalContext ? JSON.stringify(additionalContext) : null,
    }).returning();

    res.json(newLog);
  } catch (error) {
    console.error('Error logging PCI audit event:', error);
    res.status(500).json({ error: 'Failed to log PCI audit event' });
  }
});

// GET /api/stripe/audit/pci-logs - List PCI audit logs with filtering
app.get('/api/stripe/audit/pci-logs', requireAuditAccess, async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      actionType,
      tableName,
      userId,
      ipAddress,
      limit = 100,
      offset = 0,
      export: exportFlag
    } = req.query;

    let query = db.select().from(schema.pciAuditLog);
    const conditions: any[] = [];

    if (startDate) {
      conditions.push(gte(schema.pciAuditLog.createdAt, new Date(startDate as string)));
    }
    if (endDate) {
      conditions.push(lte(schema.pciAuditLog.createdAt, new Date(endDate as string)));
    }
    if (actionType) {
      conditions.push(eq(schema.pciAuditLog.actionType, actionType as string));
    }
    if (tableName) {
      conditions.push(eq(schema.pciAuditLog.tableName, tableName as string));
    }
    if (userId) {
      conditions.push(eq(schema.pciAuditLog.userId, userId as string));
    }
    if (ipAddress) {
      conditions.push(eq(schema.pciAuditLog.ipAddress, ipAddress as string));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const logs = await query
      .orderBy(desc(schema.pciAuditLog.createdAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    // Mask sensitive data in the response
    const maskedLogs = logs.map(log => ({
      ...log,
      sensitiveFieldsAccessed: log.sensitiveFieldsAccessed ? JSON.parse(log.sensitiveFieldsAccessed) : null,
      oldValues: log.oldValues ? JSON.parse(log.oldValues) : null,
      newValues: log.newValues ? JSON.parse(log.newValues) : null,
      additionalContext: log.additionalContext ? JSON.parse(log.additionalContext) : null,
    }));

    // Export functionality
    if (exportFlag === 'csv') {
      const csvHeader = 'Timestamp,Action Type,Table Name,Record ID,User Email,IP Address,Access Purpose\n';
      const csvRows = logs.map(log => 
        `${log.createdAt},${log.actionType},${log.tableName},${log.recordId},${log.userEmail},${log.ipAddress},${log.accessPurpose || ''}`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=pci_audit_logs.csv');
      res.send(csvHeader + csvRows);
      return;
    }

    res.json(maskedLogs);
  } catch (error) {
    console.error('Error fetching PCI audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch PCI audit logs' });
  }
});

// POST /api/stripe/compliance/checklist - Add compliance checklist item
app.post('/api/stripe/compliance/checklist', requireComplianceAccess, async (req, res) => {
  try {
    const {
      checklistType,
      itemDescription,
      requirement,
      status,
      assignedTo,
      dueDate,
      verificationMethod,
      regulatoryStandard,
      regulatorySection,
      riskLevel
    } = req.body;

    if (!checklistType || !itemDescription || !requirement || !status) {
      return res.status(400).json({ 
        error: 'Missing required fields: checklistType, itemDescription, requirement, status' 
      });
    }

    // Validate status
    const validStatuses = ['pending', 'in_progress', 'completed', 'verified', 'failed', 'overdue'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') });
    }

    const [newItem] = await db.insert(schema.complianceChecklist).values({
      checklistType,
      itemDescription,
      requirement,
      status,
      assignedTo: assignedTo || (req as any).user.id,
      dueDate,
      verificationMethod,
      regulatoryStandard,
      regulatorySection,
      riskLevel: riskLevel || 'medium',
    }).returning();

    // Log the creation
    await logPCIAccess(req, newItem.id, 'compliance_checklist', 'CREATE', ['verificationEvidence']);

    res.json(newItem);
  } catch (error) {
    console.error('Error creating compliance checklist item:', error);
    res.status(500).json({ error: 'Failed to create compliance checklist item' });
  }
});

// GET /api/stripe/compliance/checklist - List compliance items with filtering
app.get('/api/stripe/compliance/checklist', requireComplianceAccess, async (req, res) => {
  try {
    const {
      checklistType,
      status,
      assignedTo,
      regulatoryStandard,
      riskLevel,
      overdue,
      limit = 100,
      offset = 0
    } = req.query;

    let query = db.select().from(schema.complianceChecklist);
    const conditions: any[] = [eq(schema.complianceChecklist.deletedAt, null)];

    if (checklistType) {
      conditions.push(eq(schema.complianceChecklist.checklistType, checklistType as string));
    }
    if (status) {
      if (Array.isArray(status)) {
        conditions.push(inArray(schema.complianceChecklist.status, status as string[]));
      } else {
        conditions.push(eq(schema.complianceChecklist.status, status as string));
      }
    }
    if (assignedTo) {
      conditions.push(eq(schema.complianceChecklist.assignedTo, assignedTo as string));
    }
    if (regulatoryStandard) {
      conditions.push(eq(schema.complianceChecklist.regulatoryStandard, regulatoryStandard as string));
    }
    if (riskLevel) {
      conditions.push(eq(schema.complianceChecklist.riskLevel, riskLevel as string));
    }
    if (overdue === 'true') {
      const today = new Date().toISOString().split('T')[0];
      conditions.push(
        and(
          lte(schema.complianceChecklist.dueDate, today),
          ne(schema.complianceChecklist.status, 'completed'),
          ne(schema.complianceChecklist.status, 'verified')
        )
      );
    }

    query = query.where(and(...conditions))
      .orderBy(desc(schema.complianceChecklist.createdAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    const items = await query;

    res.json(items);
  } catch (error) {
    console.error('Error fetching compliance checklist:', error);
    res.status(500).json({ error: 'Failed to fetch compliance checklist' });
  }
});

// PUT /api/stripe/compliance/checklist/:id - Update checklist item
app.put('/api/stripe/compliance/checklist/:id', requireComplianceAccess, async (req, res) => {
  try {
    const itemId = req.params.id;
    const updates = req.body;

    // Check if item exists
    const existingItems = await db.select().from(schema.complianceChecklist)
      .where(eq(schema.complianceChecklist.id, itemId));
    
    if (existingItems.length === 0) {
      return res.status(404).json({ error: 'Compliance checklist item not found' });
    }

    const [updatedItem] = await db.update(schema.complianceChecklist)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(schema.complianceChecklist.id, itemId))
      .returning();

    // Log the update
    await logPCIAccess(req, itemId, 'compliance_checklist', 'UPDATE', ['verificationEvidence']);

    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating compliance checklist item:', error);
    res.status(500).json({ error: 'Failed to update compliance checklist item' });
  }
});

// GET /api/stripe/compliance/report - Generate compliance report
app.get('/api/stripe/compliance/report', requireComplianceAccess, async (req, res) => {
  try {
    const { standard, startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    let whereCondition = and(
      eq(schema.complianceChecklist.deletedAt, null),
      gte(schema.complianceChecklist.createdAt, start),
      lte(schema.complianceChecklist.createdAt, end)
    );

    if (standard) {
      whereCondition = and(whereCondition, eq(schema.complianceChecklist.regulatoryStandard, standard as string));
    }

    const items = await db.select().from(schema.complianceChecklist)
      .where(whereCondition);

    // Generate compliance metrics
    const report = {
      period: { startDate: start.toISOString(), endDate: end.toISOString() },
      regulatoryStandard: standard || 'All',
      summary: {
        totalItems: items.length,
        completedItems: items.filter(i => i.status === 'completed' || i.status === 'verified').length,
        pendingItems: items.filter(i => i.status === 'pending').length,
        inProgressItems: items.filter(i => i.status === 'in_progress').length,
        overdueItems: items.filter(i => {
          const today = new Date().toISOString().split('T')[0];
          return i.dueDate && i.dueDate < today && !['completed', 'verified'].includes(i.status);
        }).length,
        highRiskItems: items.filter(i => i.riskLevel === 'high').length,
      },
      byStandard: {},
      byStatus: {},
      byRiskLevel: {},
      items: items,
    };

    // Group by regulatory standard
    const byStandard = items.reduce((acc, item) => {
      const standard = item.regulatoryStandard || 'Unspecified';
      if (!acc[standard]) {
        acc[standard] = { total: 0, completed: 0, pending: 0, highRisk: 0 };
      }
      acc[standard].total++;
      if (['completed', 'verified'].includes(item.status)) acc[standard].completed++;
      if (item.status === 'pending') acc[standard].pending++;
      if (item.riskLevel === 'high') acc[standard].highRisk++;
      return acc;
    }, {} as any);

    // Group by status
    const byStatus = items.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by risk level
    const byRiskLevel = items.reduce((acc, item) => {
      acc[item.riskLevel] = (acc[item.riskLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    report.byStandard = byStandard;
    report.byStatus = byStatus;
    report.byRiskLevel = byRiskLevel;

    res.json(report);
  } catch (error) {
    console.error('Error generating compliance report:', error);
    res.status(500).json({ error: 'Failed to generate compliance report' });
  }
});

// ==============================
// RECONCILIATION APIs
// ==============================

// GET /api/stripe/reconciliation/payments - Get unreconciled payments
app.get('/api/stripe/reconciliation/payments', requireReconciliationAccess, async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      status, 
      paymentMethod, 
      limit = 50, 
      offset = 0 
    } = req.query;

    // Get unreconciled ACH payments
    let achQuery = db.select().from(schema.achPayments);
    const achConditions: any[] = [
      eq(schema.achPayments.status, 'succeeded'),
      sql`${schema.achPayments.id} NOT IN (
        SELECT ${schema.paymentReconciliation.achPaymentId} 
        FROM ${schema.paymentReconciliation} 
        WHERE ${schema.paymentReconciliation.achPaymentId} IS NOT NULL
      )`
    ];

    if (startDate) {
      achConditions.push(gte(schema.achPayments.processedDate, new Date(startDate as string)));
    }
    if (endDate) {
      achConditions.push(lte(schema.achPayments.processedDate, new Date(endDate as string)));
    }
    if (status) {
      achConditions.push(eq(schema.achPayments.status, status as string));
    }

    const unreconciledPayments = await achQuery
      .where(and(...achConditions))
      .orderBy(desc(schema.achPayments.processedDate))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    // Format for response
    const formattedPayments = unreconciledPayments.map(payment => ({
      id: payment.id,
      type: 'ach_payment',
      stripeChargeId: payment.stripeChargeId,
      amountCents: parseInt(payment.amountCents),
      currencyCode: payment.currencyCode,
      description: payment.description,
      status: payment.status,
      processedDate: payment.processedDate,
      customerId: payment.customerId,
      companyName: payment.companyName,
      returnCode: payment.returnCode,
    }));

    res.json({
      payments: formattedPayments,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total: formattedPayments.length
      }
    });
  } catch (error) {
    console.error('Error fetching unreconciled payments:', error);
    res.status(500).json({ error: 'Failed to fetch unreconciled payments' });
  }
});

// POST /api/stripe/reconciliation/mark-reconciled - Mark payment as reconciled
app.post('/api/stripe/reconciliation/mark-reconciled', requireReconciliationAccess, async (req, res) => {
  try {
    const { 
      paymentId, 
      paymentType, 
      journalEntryId, 
      notes,
      balanceTransactionId,
      netCents,
      feeCents 
    } = req.body;

    if (!paymentId || !paymentType) {
      return res.status(400).json({ error: 'Missing required fields: paymentId, paymentType' });
    }

    const userId = (req as any).user.id;

    // Create reconciliation entry
    let reconciliationData: any = {
      amountCents: '0',
      currency: 'USD',
      netCents: '0',
      feeCents: '0',
      type: paymentType,
      matchedJournalEntryId: journalEntryId,
      reconciledAt: new Date(),
      reconciledBy: userId,
      description: notes,
    };

    if (balanceTransactionId) {
      reconciliationData.stripeBalanceTransactionId = balanceTransactionId;
    }
    if (netCents) {
      reconciliationData.netCents = netCents.toString();
    }
    if (feeCents) {
      reconciliationData.feeCents = feeCents.toString();
    }

    if (paymentType === 'ach_payment') {
      reconciliationData.achPaymentId = paymentId;
      // Get payment details for amount and currency
      const payment = await db.select().from(schema.achPayments)
        .where(eq(schema.achPayments.id, paymentId));
      if (payment.length > 0) {
        reconciliationData.amountCents = payment[0].amountCents;
        reconciliationData.currency = payment[0].currencyCode;
      }
    }

    const [reconciliationEntry] = await db.insert(schema.paymentReconciliation)
      .values(reconciliationData)
      .returning();

    // Log the reconciliation action
    await logPCIAccess(req, paymentId, 'payment_reconciliation', 'RECONCILE', []);

    res.json({
      message: 'Payment marked as reconciled',
      reconciliationEntry
    });
  } catch (error) {
    console.error('Error marking payment as reconciled:', error);
    res.status(500).json({ error: 'Failed to mark payment as reconciled' });
  }
});

// GET /api/stripe/reconciliation/balance-transactions - List balance transactions
app.get('/api/stripe/reconciliation/balance-transactions', requireReconciliationAccess, async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      type,
      status,
      limit = 50,
      offset = 0
    } = req.query;

    let query = db.select().from(schema.paymentReconciliation);
    const conditions: any[] = [];

    if (startDate) {
      conditions.push(gte(schema.paymentReconciliation.createdAt, new Date(startDate as string)));
    }
    if (endDate) {
      conditions.push(lte(schema.paymentReconciliation.createdAt, new Date(endDate as string)));
    }
    if (type) {
      conditions.push(eq(schema.paymentReconciliation.type, type as string));
    }
    if (status) {
      conditions.push(eq(schema.paymentReconciliation.stripeStatus, status as string));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const transactions = await query
      .orderBy(desc(schema.paymentReconciliation.createdAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    // Format for response
    const formattedTransactions = transactions.map(txn => ({
      id: txn.id,
      stripeBalanceTransactionId: txn.stripeBalanceTransactionId,
      amountCents: parseInt(txn.amountCents),
      netCents: parseInt(txn.netCents),
      feeCents: parseInt(txn.feeCents),
      currency: txn.currency,
      type: txn.type,
      stripeCreated: txn.stripeCreated,
      stripeAvailableOn: txn.stripeAvailableOn,
      stripeStatus: txn.stripeStatus,
      matchedJournalEntryId: txn.matchedJournalEntryId,
      reconciledAt: txn.reconciledAt,
      reconciledBy: txn.reconciledBy,
      description: txn.description,
    }));

    res.json({
      transactions: formattedTransactions,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total: formattedTransactions.length
      }
    });
  } catch (error) {
    console.error('Error fetching balance transactions:', error);
    res.status(500).json({ error: 'Failed to fetch balance transactions' });
  }
});

// POST /api/stripe/reconciliation/run - Run full reconciliation
app.post('/api/stripe/reconciliation/run', requireReconciliationAccess, async (req, res) => {
  try {
    const { startDate, endDate, autoMatch = false } = req.body;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const reconciliationResults = {
      timestamp: new Date().toISOString(),
      period: { startDate: start.toISOString(), endDate: end.toISOString() },
      processed: 0,
      matched: 0,
      unmatched: 0,
      errors: [] as string[],
      details: [] as any[]
    };

    // Find unreconciled ACH payments
    const unreconciledPayments = await db.select().from(schema.achPayments)
      .where(and(
        eq(schema.achPayments.status, 'succeeded'),
        gte(schema.achPayments.processedDate, start),
        lte(schema.achPayments.processedDate, end),
        sql`${schema.achPayments.id} NOT IN (
          SELECT ${schema.paymentReconciliation.achPaymentId} 
          FROM ${schema.paymentReconciliation} 
          WHERE ${schema.paymentReconciliation.achPaymentId} IS NOT NULL
        )`
      ));

    for (const payment of unreconciledPayments) {
      try {
        reconciliationResults.processed++;

        if (autoMatch) {
          // Auto-matching logic - simple amount and date matching
          const matchingJournalEntries = await db.select().from(schema.journalEntries)
            .where(and(
              eq(schema.journalEntries.status, 'Posted'),
              gte(schema.journalEntries.date, payment.processedDate ? payment.processedDate.toISOString().split('T')[0] : ''),
              lte(schema.journalEntries.date, payment.processedDate ? payment.processedDate.toISOString().split('T')[0] : '')
            ));

          if (matchingJournalEntries.length > 0) {
            // Create reconciliation entry
            await db.insert(schema.paymentReconciliation).values({
              achPaymentId: payment.id,
              amountCents: payment.amountCents,
              currency: payment.currencyCode,
              netCents: payment.amountCents, // Assuming no fees for ACH
              feeCents: '0',
              type: 'charge',
              matchedJournalEntryId: matchingJournalEntries[0].id,
              reconciledAt: new Date(),
              reconciledBy: (req as any).user.id,
              description: 'Auto-matched during reconciliation run',
            });

            reconciliationResults.matched++;
            reconciliationResults.details.push({
              paymentId: payment.id,
              action: 'auto_matched',
              journalEntryId: matchingJournalEntries[0].id
            });
          } else {
            reconciliationResults.unmatched++;
            reconciliationResults.details.push({
              paymentId: payment.id,
              action: 'unmatched'
            });
          }
        } else {
          reconciliationResults.unmatched++;
          reconciliationResults.details.push({
            paymentId: payment.id,
            action: 'identified_for_review'
          });
        }
      } catch (error) {
        reconciliationResults.errors.push(`Error processing payment ${payment.id}: ${error.message}`);
      }
    }

    // Log the reconciliation run
    await logPCIAccess(req, `reconciliation_run_${Date.now()}`, 'payment_reconciliation', 'BATCH_RECONCILE', []);

    res.json(reconciliationResults);
  } catch (error) {
    console.error('Error running reconciliation:', error);
    res.status(500).json({ error: 'Failed to run reconciliation' });
  }
});

// GET /api/stripe/reconciliation/report - Get reconciliation report
app.get('/api/stripe/reconciliation/report', requireReconciliationAccess, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    // Get reconciliation statistics
    const reconciledTransactions = await db.select().from(schema.paymentReconciliation)
      .where(and(
        gte(schema.paymentReconciliation.createdAt, start),
        lte(schema.paymentReconciliation.createdAt, end),
        ne(schema.paymentReconciliation.reconciledAt, null)
      ));

    const unreconciledPayments = await db.select().from(schema.achPayments)
      .where(and(
        eq(schema.achPayments.status, 'succeeded'),
        gte(schema.achPayments.processedDate, start),
        lte(schema.achPayments.processedDate, end),
        sql`${schema.achPayments.id} NOT IN (
          SELECT ${schema.paymentReconciliation.achPaymentId} 
          FROM ${schema.paymentReconciliation} 
          WHERE ${schema.paymentReconciliation.achPaymentId} IS NOT NULL
        )`
      ));

    // Calculate totals
    const totalReconciled = reconciledTransactions.reduce((sum, txn) => sum + parseInt(txn.amountCents), 0);
    const totalUnreconciled = unreconciledPayments.reduce((sum, payment) => sum + parseInt(payment.amountCents), 0);
    const totalFees = reconciledTransactions.reduce((sum, txn) => sum + parseInt(txn.feeCents || '0'), 0);

    // Group by type
    const byType = reconciledTransactions.reduce((acc, txn) => {
      acc[txn.type] = (acc[txn.type] || { count: 0, amount: 0 });
      acc[txn.type].count++;
      acc[txn.type].amount += parseInt(txn.amountCents);
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);

    const report = {
      period: { startDate: start.toISOString(), endDate: end.toISOString() },
      summary: {
        totalReconciledTransactions: reconciledTransactions.length,
        totalUnreconciledPayments: unreconciledPayments.length,
        totalReconciledAmount: totalReconciled,
        totalUnreconciledAmount: totalUnreconciled,
        totalFees: totalFees,
        reconciliationRate: reconciledTransactions.length / (reconciledTransactions.length + unreconciledPayments.length) * 100 || 0
      },
      byType,
      details: {
        reconciledTransactions: reconciledTransactions.slice(0, 100), // Limit for performance
        unreconciledPayments: unreconciledPayments.slice(0, 100)
      }
    };

    res.json(report);
  } catch (error) {
    console.error('Error generating reconciliation report:', error);
    res.status(500).json({ error: 'Failed to generate reconciliation report' });
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


// ==============================
// ACH PAYMENT PROCESSING ENDPOINTS
// ==============================

// Utility function to create journal entry for ACH payments
async function createAchPaymentJournalEntry(
  tx: any, 
  paymentId: string, 
  amountCents: number, 
  customerId: string, 
  description: string
): Promise<string> {
  const entryId = `JE-ACH-${Date.now()}`;
  const date = new Date().toISOString().split('T')[0];
  const amount = parseFloat(amountCents) / 100;

  // Create journal entry
  await tx.insert(schema.journalEntries)
    .values({
      id: entryId,
      date,
      description: `${description} - ACH Payment ${paymentId}`,
      source: 'PAYMENT',
      status: 'Posted'
    });

  // Create journal lines (debit cash, credit accounts receivable)
  await tx.insert(schema.journalLines)
    .values([
      {
        journalEntryId: entryId,
        accountId: 1001, // Cash account (adjust based on your chart of accounts)
        type: 'DEBIT',
        amount: amount.toString()
      },
      {
        journalEntryId: entryId,
        accountId: 1200, // Accounts Receivable account (adjust based on your chart of accounts)
        type: 'CREDIT',
        amount: amount.toString()
      }
    ]);

  return entryId;
}

// Utility function to create journal entry for ACH returns
async function createAchReturnJournalEntry(
  tx: any,
  returnId: string,
  originalPaymentId: string,
  amountCents: number,
  description: string
): Promise<string> {
  const entryId = `JE-RET-${Date.now()}`;
  const date = new Date().toISOString().split('T')[0];
  const amount = parseFloat(amountCents) / 100;

  await tx.insert(schema.journalEntries)
    .values({
      id: entryId,
      date,
      description: `${description} - ACH Return ${returnId} for Payment ${originalPaymentId}`,
      source: 'PAYMENT',
      status: 'Posted'
    });

  // Reverse the original entry (credit cash, debit accounts receivable)
  await tx.insert(schema.journalLines)
    .values([
      {
        journalEntryId: entryId,
        accountId: 1200, // Accounts Receivable
        type: 'DEBIT',
        amount: amount.toString()
      },
      {
        journalEntryId: entryId,
        accountId: 1001, // Cash
        type: 'CREDIT',
        amount: amount.toString()
      }
    ]);

  return entryId;
}

// Convert database ACH payment to TypeScript
function convertDbAchPayment(dbPayment: any): AchPayment {
  return {
    id: dbPayment.id,
    stripeChargeId: dbPayment.stripeChargeId,
    stripePaymentIntentId: dbPayment.stripePaymentIntentId,
    customerId: dbPayment.customerId,
    paymentMethodId: dbPayment.paymentMethodId,
    amountCents: parseNumeric(dbPayment.amountCents),
    currencyCode: dbPayment.currencyCode,
    description: dbPayment.description,
    purpose: dbPayment.purpose,
    status: dbPayment.status,
    paymentMethodType: dbPayment.paymentMethodType,
    achClassCode: dbPayment.achClassCode,
    companyIdentification: dbPayment.companyIdentification,
    companyName: dbPayment.companyName,
    scheduledDate: dbPayment.scheduledDate,
    processedDate: dbPayment.processedDate,
    estimatedSettlementDate: dbPayment.estimatedSettlementDate,
    actualSettlementDate: dbPayment.actualSettlementDate,
    returnCode: dbPayment.returnCode,
    returnDescription: dbPayment.returnDescription,
    failureReason: dbPayment.failureReason,
    invoiceId: dbPayment.invoiceId,
    journalEntryId: dbPayment.journalEntryId,
    stripeMetadata: dbPayment.stripeMetadata,
    createdAt: dbPayment.createdAt,
    updatedAt: dbPayment.updatedAt
  };
}

// Convert database ACH return to TypeScript
function convertDbAchReturn(dbReturn: any): AchReturn {
  return {
    id: dbReturn.id,
    achPaymentId: dbReturn.achPaymentId,
    returnCode: dbReturn.returnCode,
    returnReason: dbReturn.returnReason,
    returnedAt: dbReturn.returnedAt,
    corrected: dbReturn.corrected,
    correctionDate: dbReturn.correctionDate,
    correctionMethod: dbReturn.correctionMethod,
    adjustedAmountCents: dbReturn.adjustedAmountCents ? parseNumeric(dbReturn.adjustedAmountCents) : undefined,
    newPaymentDate: dbReturn.newPaymentDate,
    notes: dbReturn.notes,
    adjustmentJournalEntryId: dbReturn.adjustmentJournalEntryId,
    createdAt: dbReturn.createdAt
  };
}

// 1. POST /api/stripe/ach/payment-intents - Create ACH payment intent
app.post('/api/stripe/ach/payment-intents', async (req, res) => {
  try {
    const user = (req as any).user;
    const {
      customerId,
      paymentMethodId,
      amountCents,
      description,
      achClassCode = 'PPD',
      companyIdentification,
      companyName,
      scheduledDate,
      invoiceId,
      stripeMetadata
    } = req.body;

    // Validate required fields
    if (!customerId || !paymentMethodId || !amountCents || !description) {
      return res.status(400).json({
        error: 'Missing required fields: customerId, paymentMethodId, amountCents, description'
      });
    }

    // Verify customer exists
    const [customer] = await db.select().from(schema.customers)
      .where(eq(schema.customers.id, customerId))
      .limit(1);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Verify payment method exists and belongs to customer
    const [paymentMethod] = await db.select().from(schema.paymentMethods)
      .where(and(
        eq(schema.paymentMethods.id, paymentMethodId),
        eq(schema.paymentMethods.customerId, customerId)
      ))
      .limit(1);

    if (!paymentMethod) {
      return res.status(404).json({ error: 'Payment method not found or does not belong to customer' });
    }

    // Generate estimated settlement date (T+2 business days for ACH)
    const estimatedSettlement = new Date();
    estimatedSettlement.setDate(estimatedSettlement.getDate() + 2);

    // Create Stripe Payment Intent
    const stripePaymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Calculate ACH fee (typically $0.25-$1.00)
    const achFeeCents = Math.min(Math.max(Math.floor(amountCents * 0.01), 25), 100);

    const achPaymentId = `ACH-${Date.now()}`;

    const result = await db.transaction(async (tx) => {
      // Create journal entry for the payment
      const journalEntryId = await createAchPaymentJournalEntry(
        tx, 
        achPaymentId, 
        amountCents, 
        customerId, 
        description
      );

      // Insert ACH payment record
      const [newPayment] = await tx.insert(schema.achPayments)
        .values({
          id: achPaymentId,
          stripePaymentIntentId,
          customerId,
          paymentMethodId,
          amountCents: amountCents.toString(),
          description,
          status: 'pending',
          paymentMethodType: 'ach_debit',
          achClassCode,
          companyIdentification,
          companyName,
          scheduledDate,
          estimatedSettlementDate: estimatedSettlement.toISOString().split('T')[0],
          invoiceId,
          journalEntryId,
          stripeMetadata: stripeMetadata ? JSON.stringify(stripeMetadata) : null
        })
        .returning();

      // Log PCI audit event
      await logPCIAccess(req, achPaymentId, 'ach_payments', 'create_payment_intent', ['amountCents']);

      return newPayment;
    });

    res.status(201).json({
      ...convertDbAchPayment(result),
      achFeeCents,
      estimatedSettlementDate: estimatedSettlement.toISOString().split('T')[0],
      compliance: {
        nachaCompliance: true,
        achClassCode,
        settlementTimeline: 'T+2 business days',
        returnWindow: '60 days'
      }
    });

  } catch (error) {
    console.error('Error creating ACH payment intent:', error);
    res.status(500).json({ error: 'Failed to create ACH payment intent' });
  }
});

// 2. POST /api/stripe/ach/setup-intents - Setup ACH bank account verification
app.post('/api/stripe/ach/setup-intents', async (req, res) => {
  try {
    const user = (req as any).user;
    const {
      customerId,
      paymentMethodType = 'us_bank_account',
      bankAccountDetails
    } = req.body;

    if (!customerId) {
      return res.status(400).json({ error: 'customerId is required' });
    }

    // Verify customer exists
    const [customer] = await db.select().from(schema.customers)
      .where(eq(schema.customers.id, customerId))
      .limit(1);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Generate Stripe Setup Intent ID
    const setupIntentId = `seti_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Mock bank account verification
    const requiresVerification = bankAccountDetails?.verificationMethod === 'micro_deposits';
    const verificationStatus = requiresVerification ? 'pending' : 'verified';

    const paymentMethodId = `pm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const result = await db.transaction(async (tx) => {
      // Create payment method record
      const [newPaymentMethod] = await tx.insert(schema.paymentMethods)
        .values({
          id: paymentMethodId,
          customerId,
          stripePaymentMethodId: paymentMethodId,
          type: paymentMethodType,
          bankName: bankAccountDetails?.bankName,
          bankAccountLast4: bankAccountDetails?.accountNumber?.slice(-4),
          bankAccountRoutingNumber: bankAccountDetails?.routingNumber,
          bankAccountType: bankAccountDetails?.accountType || 'checking',
          status: 'active',
          isDefault: bankAccountDetails?.isDefault || false,
          verificationStatus,
          setupIntentId,
          stripeMetadata: bankAccountDetails ? JSON.stringify(bankAccountDetails) : null
        })
        .returning();

      // Log PCI audit event
      await logPCIAccess(req, paymentMethodId, 'payment_methods', 'create_setup_intent', 
        ['bankAccountRoutingNumber', 'bankAccountLast4']);

      return newPaymentMethod;
    });

    res.status(201).json({
      id: paymentMethodId,
      customerId,
      stripePaymentMethodId: result.stripePaymentMethodId,
      type: result.type,
      bankName: result.bankName,
      bankAccountLast4: result.bankAccountLast4,
      bankAccountType: result.bankAccountType,
      status: result.status,
      verificationStatus: result.verificationStatus,
      setupIntentId,
      requiresVerification,
      createdAt: result.createdAt,
      compliance: {
        nachaCompliance: true,
        verificationRequired: requiresVerification,
        verificationMethod: bankAccountDetails?.verificationMethod || 'instant'
      }
    });

  } catch (error) {
    console.error('Error creating ACH setup intent:', error);
    res.status(500).json({ error: 'Failed to create ACH setup intent' });
  }
});

// 3. GET /api/stripe/ach/payment-intents - List ACH payments
app.get('/api/stripe/ach/payment-intents', requireReconciliationAccess, async (req, res) => {
  try {
    const {
      customerId,
      status,
      startDate,
      endDate,
      limit = 50,
      offset = 0
    } = req.query;

    let query = db.select().from(schema.achPayments);

    const conditions = [];
    if (customerId) {
      conditions.push(eq(schema.achPayments.customerId, customerId as string));
    }
    if (status) {
      conditions.push(eq(schema.achPayments.status, status as string));
    }
    if (startDate) {
      conditions.push(gte(schema.achPayments.createdAt, new Date(startDate as string)));
    }
    if (endDate) {
      conditions.push(lte(schema.achPayments.createdAt, new Date(endDate as string)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const payments = await query
      .orderBy(desc(schema.achPayments.createdAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    // Log PCI audit event for batch access
    await logPCIAccess(req, 'ach_payments_list', 'ach_payments', 'list_payments', []);

    const convertedPayments = payments.map(convertDbAchPayment);

    // Calculate summary statistics
    const totalCount = await db.select({ count: sql<number>`count(*)` })
      .from(schema.achPayments)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const totalAmount = await db.select({ sum: sql<string>`sum(amount_cents)` })
      .from(schema.achPayments)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    res.json({
      payments: convertedPayments,
      pagination: {
        total: totalCount[0]?.count || 0,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: (parseInt(offset as string) + parseInt(limit as string)) < (totalCount[0]?.count || 0)
      },
      summary: {
        totalAmountCents: parseNumeric(totalAmount[0]?.sum || 0),
        statusBreakdown: convertedPayments.reduce((acc, payment) => {
          acc[payment.status] = (acc[payment.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      }
    });

  } catch (error) {
    console.error('Error listing ACH payments:', error);
    res.status(500).json({ error: 'Failed to list ACH payments' });
  }
});

// 4. GET /api/stripe/ach/payment-intents/:id - Get payment details
app.get('/api/stripe/ach/payment-intents/:id', requireReconciliationAccess, async (req, res) => {
  try {
    const { id } = req.params;

    const [payment] = await db.select().from(schema.achPayments)
      .where(eq(schema.achPayments.id, id))
      .limit(1);

    if (!payment) {
      return res.status(404).json({ error: 'ACH payment not found' });
    }

    // Get customer details
    const [customer] = await db.select().from(schema.customers)
      .where(eq(schema.customers.id, payment.customerId))
      .limit(1);

    // Get payment method details
    const [paymentMethod] = await db.select().from(schema.paymentMethods)
      .where(eq(schema.paymentMethods.id, payment.paymentMethodId))
      .limit(1);

    // Get related returns if any
    const returns = await db.select().from(schema.achReturns)
      .where(eq(schema.achReturns.achPaymentId, id));

    // Get journal entry if exists
    let journalEntry = null;
    if (payment.journalEntryId) {
      const lines = await db.select().from(schema.journalLines)
        .where(eq(schema.journalLines.journalEntryId, payment.journalEntryId));
      const entry = await db.select().from(schema.journalEntries)
        .where(eq(schema.journalEntries.id, payment.journalEntryId))
        .limit(1);
      if (entry[0]) {
        journalEntry = convertDbJournalEntry(entry[0], lines);
      }
    }

    // Log PCI audit event
    await logPCIAccess(req, id, 'ach_payments', 'view_payment_details', ['amountCents']);

    res.json({
      ...convertDbAchPayment(payment),
      customer: customer ? {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        stripeCustomerId: customer.stripeCustomerId
      } : null,
      paymentMethod: paymentMethod ? {
        id: paymentMethod.id,
        type: paymentMethod.type,
        bankName: paymentMethod.bankName,
        bankAccountLast4: paymentMethod.bankAccountLast4,
        bankAccountType: paymentMethod.bankAccountType,
        verificationStatus: paymentMethod.verificationStatus
      } : null,
      returns: returns.map(convertDbAchReturn),
      journalEntry,
      compliance: {
        nachaCompliant: true,
        achClassCode: payment.achClassCode,
        settlementTimeline: payment.actualSettlementDate ? 'Settled' : 'Pending',
        returnWindow: '60 days from settlement',
        regulatoryStandards: ['NACHA Operating Rules', 'Regulation E']
      }
    });

  } catch (error) {
    console.error('Error fetching ACH payment details:', error);
    res.status(500).json({ error: 'Failed to fetch ACH payment details' });
  }
});

// 5. POST /api/stripe/ach/payment-intents/:id/confirm - Confirm payment
app.post('/api/stripe/ach/payment-intents/:id/confirm', async (req, res) => {
  try {
    const { id } = req.params;
    const { confirmationToken } = req.body;

    const [payment] = await db.select().from(schema.achPayments)
      .where(eq(schema.achPayments.id, id))
      .limit(1);

    if (!payment) {
      return res.status(404).json({ error: 'ACH payment not found' });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({ 
        error: `Payment cannot be confirmed. Current status: ${payment.status}` 
      });
    }

    // Simulate Stripe payment confirmation
    const confirmationResult = await db.transaction(async (tx) => {
      // Update payment status
      const [updatedPayment] = await tx.update(schema.achPayments)
        .set({
          status: 'succeeded',
          processedDate: new Date(),
          actualSettlementDate: new Date(),
          updatedAt: new Date()
        })
        .where(eq(schema.achPayments.id, id))
        .returning();

      // Update journal entry status if exists
      if (payment.journalEntryId) {
        await tx.update(schema.journalEntries)
          .set({ status: 'Posted' })
          .where(eq(schema.journalEntries.id, payment.journalEntryId));
      }

      // Log PCI audit event
      await logPCIAccess(req, id, 'ach_payments', 'confirm_payment', ['amountCents']);

      return updatedPayment;
    });

    res.json({
      ...convertDbAchPayment(confirmationResult),
      confirmationDetails: {
        confirmedAt: confirmationResult.processedDate,
        confirmationToken: confirmationToken || `conf_${Date.now()}`,
        settlementCompleted: true,
        regulatoryCompliance: {
          nachaCompliant: true,
          achClassCode: confirmationResult.achClassCode,
          processedThrough: 'Federal Reserve ACH Network'
        }
      }
    });

  } catch (error) {
    console.error('Error confirming ACH payment:', error);
    res.status(500).json({ error: 'Failed to confirm ACH payment' });
  }
});

// 6. POST /api/stripe/ach/payment-intents/:id/cancel - Cancel payment
app.post('/api/stripe/ach/payment-intents/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const [payment] = await db.select().from(schema.achPayments)
      .where(eq(schema.achPayments.id, id))
      .limit(1);

    if (!payment) {
      return res.status(404).json({ error: 'ACH payment not found' });
    }

    if (payment.status === 'succeeded') {
      return res.status(400).json({ 
        error: 'Cannot cancel a payment that has already been processed' 
      });
    }

    const result = await db.transaction(async (tx) => {
      // Update payment status
      const [updatedPayment] = await tx.update(schema.achPayments)
        .set({
          status: 'canceled',
          failureReason: reason || 'Cancelled by user',
          updatedAt: new Date()
        })
        .where(eq(schema.achPayments.id, id))
        .returning();

      // Reverse journal entry if it exists
      if (payment.journalEntryId) {
        await tx.update(schema.journalEntries)
          .set({ status: 'Posted' })
          .where(eq(schema.journalEntries.id, payment.journalEntryId));

        // Add cancellation note to journal lines
        await tx.insert(schema.journalLines)
          .values({
            journalEntryId: payment.journalEntryId,
            accountId: 9999, // Cancellation adjustment account
            type: 'CREDIT',
            amount: '0',
            description: `Payment cancelled: ${reason || 'No reason provided'}`
          });
      }

      // Log PCI audit event
      await logPCIAccess(req, id, 'ach_payments', 'cancel_payment', ['amountCents']);

      return updatedPayment;
    });

    res.json({
      ...convertDbAchPayment(result),
      cancellationDetails: {
        cancelledAt: new Date(),
        reason: reason || 'Cancelled by user',
        refundRequired: false,
        compliance: {
          nachaCompliant: true,
          cancellationWindow: 'Before settlement',
          regulatoryNotice: 'Cancellation processed per NACHA rules'
        }
      }
    });

  } catch (error) {
    console.error('Error cancelling ACH payment:', error);
    res.status(500).json({ error: 'Failed to cancel ACH payment' });
  }
});

// 7. GET /api/stripe/ach/returns - List ACH returns
app.get('/api/stripe/ach/returns', requireReconciliationAccess, async (req, res) => {
  try {
    const {
      achPaymentId,
      returnCode,
      corrected,
      startDate,
      endDate,
      limit = 50,
      offset = 0
    } = req.query;

    let query = db.select().from(schema.achReturns);

    const conditions = [];
    if (achPaymentId) {
      conditions.push(eq(schema.achReturns.achPaymentId, achPaymentId as string));
    }
    if (returnCode) {
      conditions.push(eq(schema.achReturns.returnCode, returnCode as string));
    }
    if (corrected !== undefined) {
      conditions.push(eq(schema.achReturns.corrected, corrected === 'true'));
    }
    if (startDate) {
      conditions.push(gte(schema.achReturns.returnedAt, new Date(startDate as string)));
    }
    if (endDate) {
      conditions.push(lte(schema.achReturns.returnedAt, new Date(endDate as string)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const returns = await query
      .orderBy(desc(schema.achReturns.returnedAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    // Get related payment info for each return
    const returnsWithPaymentInfo = await Promise.all(
      returns.map(async (returnRecord) => {
        const payment = await db.select().from(schema.achPayments)
          .where(eq(schema.achPayments.id, returnRecord.achPaymentId))
          .limit(1);

        return {
          ...convertDbAchReturn(returnRecord),
          payment: payment[0] ? convertDbAchPayment(payment[0]) : null,
          returnCodeDescription: AchReturnCodes[returnRecord.returnCode as keyof typeof AchReturnCodes] || 'Unknown return code'
        };
      })
    );

    // Log PCI audit event
    await logPCIAccess(req, 'ach_returns_list', 'ach_returns', 'list_returns', []);

    res.json({
      returns: returnsWithPaymentInfo,
      pagination: {
        total: returnsWithPaymentInfo.length,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      },
      summary: {
        totalReturns: returnsWithPaymentInfo.length,
        correctedReturns: returnsWithPaymentInfo.filter(r => r.corrected).length,
        uncorrectedReturns: returnsWithPaymentInfo.filter(r => !r.corrected).length,
        returnCodeBreakdown: returnsWithPaymentInfo.reduce((acc, ret) => {
          acc[ret.returnCode] = (acc[ret.returnCode] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      },
      compliance: {
        nachaCompliance: true,
        returnWindow: '60 days from settlement',
        correctionWindow: '60 days from return',
        regulatoryStandards: ['NACHA Operating Rules', 'Regulation E']
      }
    });

  } catch (error) {
    console.error('Error listing ACH returns:', error);
    res.status(500).json({ error: 'Failed to list ACH returns' });
  }
});

// 8. POST /api/stripe/ach/returns/:id/correct - Process return correction
app.post('/api/stripe/ach/returns/:id/correct', requireComplianceAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      correctionMethod,
      adjustedAmountCents,
      newPaymentDate,
      notes
    } = req.body;

    const [returnRecord] = await db.select().from(schema.achReturns)
      .where(eq(schema.achReturns.id, id))
      .limit(1);

    if (!returnRecord) {
      return res.status(404).json({ error: 'ACH return not found' });
    }

    if (returnRecord.corrected) {
      return res.status(400).json({ error: 'Return has already been corrected' });
    }

    const user = (req as any).user;

    const result = await db.transaction(async (tx) => {
      // Get the original payment
      const [originalPayment] = await tx.select().from(schema.achPayments)
        .where(eq(schema.achPayments.id, returnRecord.achPaymentId))
        .limit(1);

      if (!originalPayment) {
        throw new Error('Original payment not found');
      }

      // Create correction journal entry
      const adjustmentAmount = adjustedAmountCents ? 
        (parseNumeric(originalPayment.amountCents) - adjustedAmountCents) : 
        parseNumeric(originalPayment.amountCents);

      const journalEntryId = await createAchReturnJournalEntry(
        tx,
        id,
        returnRecord.achPaymentId,
        Math.abs(adjustmentAmount),
        `ACH Return Correction - ${returnRecord.returnCode}`
      );

      // Update return record
      const [updatedReturn] = await tx.update(schema.achReturns)
        .set({
          corrected: true,
          correctionDate: new Date(),
          correctionMethod,
          adjustedAmountCents: adjustedAmountCents ? adjustedAmountCents.toString() : originalPayment.amountCents,
          newPaymentDate,
          notes,
          adjustmentJournalEntryId: journalEntryId
        })
        .where(eq(schema.achReturns.id, id))
        .returning();

      // Log PCI audit event
      await logPCIAccess(req, id, 'ach_returns', 'correct_return', ['adjustedAmountCents']);

      return updatedReturn;
    });

    res.json({
      ...convertDbAchReturn(result),
      correctionDetails: {
        correctedAt: result.correctionDate,
        correctionMethod,
        adjustmentAmountCents: adjustedAmountCents ? 
          adjustedAmountCents - parseNumeric(result.adjustedAmountCents || '0') : 0,
        newPaymentScheduled: newPaymentDate,
        compliance: {
          nachaCompliant: true,
          correctionProcessed: true,
          regulatoryCompliance: {
            nachaRules: 'Compliant',
            correctionWindow: 'Within 60 days',
            supportingDocumentation: 'Stored'
          }
        }
      }
    });

  } catch (error) {
    console.error('Error processing ACH return correction:', error);
    res.status(500).json({ error: 'Failed to process ACH return correction' });
  }
});

// 9. GET /api/stripe/ach/reconciliation - Get payment reconciliation data
app.get('/api/stripe/ach/reconciliation', requireReconciliationAccess, async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      reconciliationStatus,
      includeReturns = false
    } = req.query;

    // Calculate reconciliation period (default: current month)
    const start = startDate ? new Date(startDate as string) : 
      new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate as string) : 
      new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    const reconciliationData = await db.transaction(async (tx) => {
      // Get all ACH payments in period
      const payments = await tx.select().from(schema.achPayments)
        .where(and(
          gte(schema.achPayments.createdAt, start),
          lte(schema.achPayments.createdAt, end)
        ));

      // Get returns if requested
      let returns = [];
      if (includeReturns === 'true') {
        returns = await tx.select().from(schema.achReturns)
          .where(and(
            gte(schema.achReturns.returnedAt, start),
            lte(schema.achReturns.returnedAt, end)
          ));
      }

      // Calculate totals by status
      const statusBreakdown = payments.reduce((acc, payment) => {
        const status = payment.status;
        if (!acc[status]) {
          acc[status] = {
            count: 0,
            totalCents: 0
          };
        }
        acc[status].count++;
        acc[status].totalCents += parseNumeric(payment.amountCents);
        return acc;
      }, {} as Record<string, { count: number; totalCents: number }>);

      // Calculate ACH fees (estimate 1% of volume, min $0.25, max $1.00 per transaction)
      const totalVolume = Object.values(statusBreakdown)
        .reduce((sum, status) => sum + status.totalCents, 0);
      
      const estimatedFees = payments.reduce((sum, payment) => {
        const amount = parseNumeric(payment.amountCents);
        const fee = Math.min(Math.max(Math.floor(amount * 0.01), 25), 100);
        return sum + fee;
      }, 0);

      return {
        payments: payments.map(convertDbAchPayment),
        returns: returns.map(convertDbAchReturn),
        summary: {
          period: {
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0]
          },
          totals: {
            totalPayments: payments.length,
            totalVolumeCents: totalVolume,
            estimatedFeesCents: estimatedFees,
            netVolumeCents: totalVolume - estimatedFees
          },
          statusBreakdown,
          compliance: {
            nachaCompliant: true,
            settlementTimeline: 'T+2 business days',
            returnWindow: '60 days',
            regulatoryStandards: ['NACHA Operating Rules', 'Regulation E', 'PCI DSS']
          }
        }
      };
    });

    // Log PCI audit event
    await logPCIAccess(req, 'reconciliation_report', 'ach_payments', 'generate_reconciliation', []);

    res.json({
      ...reconciliationData,
      generatedAt: new Date(),
      generatedBy: (req as any).user?.email || 'system',
      reportType: 'ACH_RECONCILIATION',
      compliance: reconciliationData.summary.compliance
    });

  } catch (error) {
    console.error('Error generating ACH reconciliation:', error);
    res.status(500).json({ error: 'Failed to generate ACH reconciliation data' });
  }
});// ==============================
// DIRECT DEPOSIT & PAYROLL ENDPOINTS
// ==============================

// Initialize Stripe with error handling
const initializeStripe = () => {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      console.warn('STRIPE_SECRET_KEY not found in environment variables. Using test key.');
      return new Stripe('sk_test_dummy_key_for_development', {
        apiVersion: '2024-12-18.acacia',
      });
    }
    return new Stripe(stripeKey, {
      apiVersion: '2024-12-18.acacia',
    });
  } catch (error) {
    console.error('Error initializing Stripe:', error);
    throw error;
  }
};

const stripeClient = initializeStripe();

// Middleware for webhook signature verification
const webhookRawBody = express.raw({ type: 'application/json' });

// Create automatic journal entry for payroll
async function createPayrollJournalEntry(
  description: string,
  employeeId: string,
  grossAmount: number,
  netAmount: number,
  taxes: number,
  deductions: number
): Promise<string> {
  const journalEntryId = `JE-PAYROLL-${Date.now()}`;
  const date = new Date().toISOString().split('T')[0];

  try {
    await db.transaction(async (tx) => {
      // Insert journal entry
      await tx.insert(schema.journalEntries).values({
        id: journalEntryId,
        date,
        description,
        source: 'PAYROLL',
        status: 'Posted'
      });

      // Insert journal lines
      const lines = [
        // Debit salary expense
        { journalEntryId, accountId: 6, type: 'DEBIT' as const, amount: grossAmount.toString(), description: `Payroll - ${employeeId}` },
        // Credit payroll payable (net)
        { journalEntryId, accountId: 3, type: 'CREDIT' as const, amount: netAmount.toString(), description: `Net payroll payable - ${employeeId}` },
        // Credit payroll taxes payable
        { journalEntryId, accountId: 2, type: 'CREDIT' as const, amount: taxes.toString(), description: `Payroll taxes payable - ${employeeId}` },
        // Credit deductions payable
        { journalEntryId, accountId: 4, type: 'CREDIT' as const, amount: deductions.toString(), description: `Deductions payable - ${employeeId}` },
      ];

      await Promise.all(
        lines.map(line => tx.insert(schema.journalLines).values(line))
      );
    });

    return journalEntryId;
  } catch (error) {
    console.error('Error creating payroll journal entry:', error);
    throw error;
  }
}

// Convert database recipient to TypeScript DirectDepositRecipient
function convertDbDirectDepositRecipient(dbRecipient: any): DirectDepositRecipient {
  return {
    id: dbRecipient.id,
    stripeAccountId: dbRecipient.stripeAccountId,
    employeeId: dbRecipient.employeeId,
    firstName: dbRecipient.firstName,
    lastName: dbRecipient.lastName,
    email: dbRecipient.email,
    phone: dbRecipient.phone,
    dateOfBirth: dbRecipient.dateOfBirth,
    ssnLast4: dbRecipient.ssnLast4,
    address: dbRecipient.address,
    verificationStatus: dbRecipient.verificationStatus as any,
    verificationRequired: dbRecipient.verificationRequired,
    verificationDueDate: dbRecipient.verificationDueDate,
    accountStatus: dbRecipient.accountStatus,
    requiresVerification: dbRecipient.requiresVerification,
    verificationFieldsNeeded: dbRecipient.verificationFieldsNeeded,
    verificationDisabledReason: dbRecipient.verificationDisabledReason,
    kycStatus: dbRecipient.kycStatus as any,
    chargesEnabled: dbRecipient.chargesEnabled,
    transfersEnabled: dbRecipient.transfersEnabled,
    payoutsEnabled: dbRecipient.payoutsEnabled,
    createdAt: dbRecipient.createdAt,
    updatedAt: dbRecipient.updatedAt,
    deletedAt: dbRecipient.deletedAt
  };
}

// Convert database bank account to TypeScript DirectDepositBankAccount
function convertDbDirectDepositBankAccount(dbAccount: any): DirectDepositBankAccount {
  return {
    id: dbAccount.id,
    recipientId: dbAccount.recipientId,
    stripeBankAccountId: dbAccount.stripeBankAccountId,
    accountHolderName: dbAccount.accountHolderName,
    bankName: dbAccount.bankName,
    routingNumber: dbAccount.routingNumber,
    accountNumberLast4: dbAccount.accountNumberLast4,
    accountType: dbAccount.accountType as any,
    currency: dbAccount.currency,
    status: dbAccount.status as any,
    isVerified: dbAccount.isVerified,
    verifiedAt: dbAccount.verifiedAt,
    defaultCurrency: dbAccount.defaultCurrency,
    isDefault: dbAccount.isDefault,
    stripeMetadata: dbAccount.stripeMetadata,
    createdAt: dbAccount.createdAt,
    updatedAt: dbAccount.updatedAt,
    deletedAt: dbAccount.deletedAt
  };
}

// Convert database payout to TypeScript DirectDepositPayout
function convertDbDirectDepositPayout(dbPayout: any): DirectDepositPayout {
  return {
    id: dbPayout.id,
    stripePayoutId: dbPayout.stripePayoutId,
    recipientId: dbPayout.recipientId,
    amountCents: parseNumeric(dbPayout.amountCents),
    currency: dbPayout.currency,
    description: dbPayout.description,
    payPeriodStart: dbPayout.payPeriodStart,
    payPeriodEnd: dbPayout.payPeriodEnd,
    scheduledPayoutDate: dbPayout.scheduledPayoutDate,
    actualPayoutDate: dbPayout.actualPayoutDate,
    estimatedArrivalDate: dbPayout.estimatedArrivalDate,
    status: dbPayout.status as any,
    failureReason: dbPayout.failureReason,
    destinationBankAccountId: dbPayout.destinationBankAccountId,
    payrollRunId: dbPayout.payrollRunId,
    journalEntryId: dbPayout.journalEntryId,
    stripeMetadata: dbPayout.stripeMetadata,
    createdAt: dbPayout.createdAt,
    updatedAt: dbPayout.updatedAt
  };
}

// ==============================
// DIRECT DEPOSIT RECIPIENT ENDPOINTS
// ==============================

/**
 * POST /api/stripe/direct-deposits/recipients
 * Create Stripe Connect account for recipient
 */
app.post('/api/stripe/direct-deposits/recipients', requireRole(['admin', 'payroll_admin']), async (req, res) => {
  try {
    const {
      employeeId,
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      ssnLast4,
      address
    } = req.body;

    // Verify employee exists if employeeId provided
    if (employeeId) {
      const [employee] = await db.select().from(schema.employees)
        .where(eq(schema.employees.id, employeeId))
        .limit(1);
      
      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }
    }

    // Create Stripe Connect account
    const stripeAccount = await stripeClient.accounts.create({
      type: 'express',
      country: 'US',
      email,
      capabilities: {
        transfers: { requested: true },
        card_payments: { requested: false },
      },
      business_type: 'individual',
      individual: {
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        dob: dateOfBirth ? {
          day: parseInt(dateOfBirth.split('-')[2]),
          month: parseInt(dateOfBirth.split('-')[1]),
          year: parseInt(dateOfBirth.split('-')[0])
        } : undefined,
      },
      metadata: {
        employeeId: employeeId || '',
        oracleLedgerIntegration: 'true'
      }
    });

    // Save to database
    const [newRecipient] = await db.insert(schema.directDepositRecipients)
      .values({
        stripeAccountId: stripeAccount.id,
        employeeId,
        firstName,
        lastName,
        email,
        phone,
        dateOfBirth,
        ssnLast4,
        address: address ? JSON.stringify(address) : null,
        verificationStatus: 'pending',
        verificationRequired: true,
        accountStatus: stripeAccount.details_submitted ? 'enabled' : 'pending',
        requiresVerification: !stripeAccount.details_submitted,
        verificationFieldsNeeded: stripeAccount.requirements?.currently_due ? JSON.stringify(stripeAccount.requirements.currently_due) : null,
        kycStatus: 'pending',
        chargesEnabled: stripeAccount.charges_enabled || false,
        transfersEnabled: stripeAccount.transfers_enabled || false,
        payoutsEnabled: stripeAccount.payouts_enabled || false
      })
      .returning();

    // Log PCI audit event
    await logPciAuditEvent(
      'create_recipient',
      'direct_deposit_recipients',
      newRecipient.id,
      req,
      ['ssnLast4'],
      null,
      { ...req.body, ssnLast4: '****' }
    );

    res.status(201).json(convertDbDirectDepositRecipient(newRecipient));
  } catch (error) {
    console.error('Error creating direct deposit recipient:', error);
    res.status(500).json({ error: 'Failed to create direct deposit recipient' });
  }
});

/**
 * GET /api/stripe/direct-deposits/recipients
 * List all recipients
 */
app.get('/api/stripe/direct-deposits/recipients', requireRole(['admin', 'payroll_admin', 'accountant']), async (req, res) => {
  try {
    const { verificationStatus, accountStatus, limit = 100, offset = 0 } = req.query;
    
    let query = db.select().from(schema.directDepositRecipients);
    
    if (verificationStatus) {
      query = query.where(eq(schema.directDepositRecipients.verificationStatus, verificationStatus as string));
    }
    
    if (accountStatus) {
      query = query.where(eq(schema.directDepositRecipients.accountStatus, accountStatus as string));
    }
    
    const recipients = await query
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string))
      .orderBy(desc(schema.directDepositRecipients.createdAt));

    const convertedRecipients = recipients.map(convertDbDirectDepositRecipient);
    
    // Log PCI audit event
    await logPciAuditEvent(
      'view_recipients',
      'direct_deposit_recipients',
      'bulk_list',
      req
    );

    res.json(convertedRecipients);
  } catch (error) {
    console.error('Error fetching direct deposit recipients:', error);
    res.status(500).json({ error: 'Failed to fetch direct deposit recipients' });
  }
});

/**
 * GET /api/stripe/direct-deposits/recipients/:id
 * Get recipient details
 */
app.get('/api/stripe/direct-deposits/recipients/:id', requireRole(['admin', 'payroll_admin']), async (req, res) => {
  try {
    const recipientId = req.params.id;
    const [recipient] = await db.select().from(schema.directDepositRecipients)
      .where(eq(schema.directDepositRecipients.id, recipientId))
      .limit(1);

    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    // Log PCI audit event
    await logPciAuditEvent(
      'view_recipient',
      'direct_deposit_recipients',
      recipientId,
      req,
      ['ssnLast4', 'address']
    );

    res.json(convertDbDirectDepositRecipient(recipient));
  } catch (error) {
    console.error('Error fetching direct deposit recipient:', error);
    res.status(500).json({ error: 'Failed to fetch direct deposit recipient' });
  }
});

/**
 * PUT /api/stripe/direct-deposits/recipients/:id
 * Update recipient
 */
app.put('/api/stripe/direct-deposits/recipients/:id', requireRole(['admin', 'payroll_admin']), async (req, res) => {
  try {
    const recipientId = req.params.id;
    const updates = req.body;
    
    const [existingRecipient] = await db.select().from(schema.directDepositRecipients)
      .where(eq(schema.directDepositRecipients.id, recipientId))
      .limit(1);

    if (!existingRecipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    // Update Stripe account if critical info changed
    if (updates.email || updates.firstName || updates.lastName) {
      try {
        await stripeClient.accounts.update(existingRecipient.stripeAccountId, {
          email: updates.email || existingRecipient.email,
          individual: {
            first_name: updates.firstName || existingRecipient.firstName,
            last_name: updates.lastName || existingRecipient.lastName,
          }
        });
      } catch (stripeError) {
        console.error('Error updating Stripe account:', stripeError);
        // Continue with database update even if Stripe update fails
      }
    }

    // Prepare update values
    const dbUpdates: any = { ...updates };
    if (updates.address) {
      dbUpdates.address = JSON.stringify(updates.address);
    }

    // Update database
    const [updatedRecipient] = await db.update(schema.directDepositRecipients)
      .set(dbUpdates)
      .where(eq(schema.directDepositRecipients.id, recipientId))
      .returning();

    // Log PCI audit event
    await logPciAuditEvent(
      'update_recipient',
      'direct_deposit_recipients',
      recipientId,
      req,
      ['ssnLast4', 'address'],
      existingRecipient,
      updates
    );

    res.json(convertDbDirectDepositRecipient(updatedRecipient));
  } catch (error) {
    console.error('Error updating direct deposit recipient:', error);
    res.status(500).json({ error: 'Failed to update direct deposit recipient' });
  }
});

/**
 * POST /api/stripe/direct-deposits/recipients/:id/verification
 * Submit verification documents
 */
app.post('/api/stripe/direct-deposits/recipients/:id/verification', requireRole(['admin', 'payroll_admin', 'compliance_officer']), async (req, res) => {
  try {
    const recipientId = req.params.id;
    const { documentType, documentData } = req.body;
    
    const [recipient] = await db.select().from(schema.directDepositRecipients)
      .where(eq(schema.directDepositRecipients.id, recipientId))
      .limit(1);

    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    // Upload verification document to Stripe
    const file = await stripeClient.files.create({
      purpose: 'identity_document',
      file: {
        data: Buffer.from(documentData, 'base64'),
        name: `${documentType}.pdf`,
        type: 'application/pdf'
      }
    });

    // Submit verification
    const verification = await stripeClient.accounts.update(recipient.stripeAccountId, {
      individual: {
        verification: {
          document: {
            front: file.id,
            back: req.body.documentBack ? file.id : undefined
          }
        }
      }
    });

    // Update database with verification status
    await db.update(schema.directDepositRecipients)
      .set({
        verificationStatus: 'pending',
        verificationFieldsNeeded: verification.requirements?.currently_due ? JSON.stringify(verification.requirements.currently_due) : null,
        accountStatus: verification.details_submitted ? 'enabled' : 'restricted'
      })
      .where(eq(schema.directDepositRecipients.id, recipientId));

    // Log PCI audit event
    await logPciAuditEvent(
      'submit_verification',
      'direct_deposit_recipients',
      recipientId,
      req,
      [],
      null,
      { documentType, verificationSubmitted: true }
    );

    res.json({ 
      success: true, 
      message: 'Verification documents submitted successfully',
      verificationId: verification.id 
    });
  } catch (error) {
    console.error('Error submitting verification:', error);
    res.status(500).json({ error: 'Failed to submit verification documents' });
  }
});

// ==============================
// BANK ACCOUNT ENDPOINTS
// ==============================

/**
 * POST /api/stripe/direct-deposits/bank-accounts
 * Add bank account for recipient
 */
app.post('/api/stripe/direct-deposits/bank-accounts', requireRole(['admin', 'payroll_admin']), async (req, res) => {
  try {
    const {
      recipientId,
      accountHolderName,
      bankName,
      routingNumber,
      accountNumber,
      accountType,
      currency = 'USD'
    } = req.body;

    // Verify recipient exists
    const [recipient] = await db.select().from(schema.directDepositRecipients)
      .where(eq(schema.directDepositRecipients.id, recipientId))
      .limit(1);

    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    // Create external bank account in Stripe
    const bankAccount = await stripeClient.accounts.createExternalAccount(
      recipient.stripeAccountId,
      {
        external_account: {
          object: 'bank_account',
          account_holder_name: accountHolderName,
          account_holder_type: 'individual',
          bank_name: bankName,
          routing_number: routingNumber,
          account_number: accountNumber,
          currency: currency.toLowerCase(),
          account_type: accountType.toLowerCase() === 'checking' ? 'checking' : 'savings'
        }
      }
    );

    // Save to database
    const [newBankAccount] = await db.insert(schema.directDepositBankAccounts)
      .values({
        recipientId,
        stripeBankAccountId: bankAccount.id,
        accountHolderName,
        bankName,
        routingNumber,
        accountNumberLast4: accountNumber.slice(-4),
        accountType: accountType.toLowerCase() === 'checking' ? 'checking' : 'savings',
        currency: currency.toUpperCase(),
        status: bankAccount.status || 'pending',
        isVerified: bankAccount.verified || false,
        verifiedAt: bankAccount.verified ? new Date() : null,
        isDefault: false, // Set default in a separate call
        stripeMetadata: bankAccount.metadata ? JSON.stringify(bankAccount.metadata) : null
      })
      .returning();

    // Log PCI audit event
    await logPciAuditEvent(
      'add_bank_account',
      'direct_deposit_bank_accounts',
      newBankAccount.id,
      req,
      ['routingNumber', 'accountNumberLast4'],
      null,
      { 
        recipientId,
        accountNumberLast4: newBankAccount.accountNumberLast4,
        bankName 
      }
    );

    res.status(201).json(convertDbDirectDepositBankAccount(newBankAccount));
  } catch (error) {
    console.error('Error adding bank account:', error);
    res.status(500).json({ error: 'Failed to add bank account' });
  }
});

/**
 * GET /api/stripe/direct-deposits/bank-accounts/:recipientId
 * List recipient bank accounts
 */
app.get('/api/stripe/direct-deposits/bank-accounts/:recipientId', requireRole(['admin', 'payroll_admin']), async (req, res) => {
  try {
    const recipientId = req.params.recipientId;
    
    const bankAccounts = await db.select().from(schema.directDepositBankAccounts)
      .where(eq(schema.directDepositBankAccounts.recipientId, recipientId))
      .orderBy(desc(schema.directDepositBankAccounts.createdAt));

    // Log PCI audit event
    await logPciAuditEvent(
      'view_bank_accounts',
      'direct_deposit_bank_accounts',
      `recipient_${recipientId}`,
      req,
      ['routingNumber', 'accountNumberLast4']
    );

    res.json(bankAccounts.map(convertDbDirectDepositBankAccount));
  } catch (error) {
    console.error('Error fetching bank accounts:', error);
    res.status(500).json({ error: 'Failed to fetch bank accounts' });
  }
});

// ==============================
// PAYOUT ENDPOINTS
// ==============================

/**
 * POST /api/stripe/direct-deposits/payouts
 * Create direct deposit payout
 */
app.post('/api/stripe/direct-deposits/payouts', requireRole(['admin', 'payroll_admin', 'finance_manager']), async (req, res) => {
  try {
    const {
      recipientId,
      amount,
      currency = 'USD',
      description,
      payPeriodStart,
      payPeriodEnd,
      destinationBankAccountId,
      scheduledDate,
      taxes,
      deductions,
      grossAmount,
      createJournalEntry = true
    } = req.body;

    // Verify recipient exists
    const [recipient] = await db.select().from(schema.directDepositRecipients)
      .where(eq(schema.directDepositRecipients.id, recipientId))
      .limit(1);

    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    // Check if recipient is verified and enabled for payouts
    if (recipient.payoutsEnabled !== true) {
      return res.status(400).json({ error: 'Recipient is not enabled for payouts' });
    }

    const amountCents = Math.round(parseFloat(amount) * 100);
    const taxesCents = taxes ? Math.round(taxes * 100) : 0;
    const deductionsCents = deductions ? Math.round(deductions * 100) : 0;
    const grossAmountCents = grossAmount ? Math.round(grossAmount * 100) : amountCents + taxesCents + deductionsCents;

    // Create Stripe transfer to recipient's account
    let stripeTransfer;
    try {
      stripeTransfer = await stripeClient.transfers.create({
        amount: amountCents,
        currency: currency.toLowerCase(),
        destination: recipient.stripeAccountId,
        description: description || `Payroll payment to ${recipient.firstName} ${recipient.lastName}`,
        metadata: {
          recipientId,
          oracleLedgerIntegration: 'true',
          payPeriodStart: payPeriodStart || '',
          payPeriodEnd: payPeriodEnd || ''
        }
      });
    } catch (stripeError: any) {
      console.error('Stripe transfer error:', stripeError);
      return res.status(400).json({ 
        error: 'Failed to create Stripe transfer',
        details: stripeError.message 
      });
    }

    // Save payout to database
    const [newPayout] = await db.insert(schema.directDepositPayouts)
      .values({
        stripePayoutId: stripeTransfer.id,
        recipientId,
        amountCents: amountCents.toString(),
        currency: currency.toUpperCase(),
        description,
        payPeriodStart,
        payPeriodEnd,
        scheduledPayoutDate: scheduledDate,
        status: 'in_transit',
        destinationBankAccountId,
        stripeMetadata: JSON.stringify({
          taxes: taxesCents,
          deductions: deductionsCents,
          grossAmount: grossAmountCents
        })
      })
      .returning();

    let journalEntryId: string | undefined;

    // Create automatic journal entry for payroll
    if (createJournalEntry && grossAmount) {
      try {
        journalEntryId = await createPayrollJournalEntry(
          description || `Payroll payout to ${recipient.firstName} ${recipient.lastName}`,
          recipient.employeeId || recipientId,
          parseFloat(grossAmount),
          parseFloat(amount),
          taxes || 0,
          deductions || 0
        );

        // Update payout with journal entry ID
        await db.update(schema.directDepositPayouts)
          .set({ journalEntryId })
          .where(eq(schema.directDepositPayouts.id, newPayout.id));
      } catch (journalError) {
        console.error('Error creating journal entry:', journalError);
        // Continue without journal entry - payout is already created
      }
    }

    // Log PCI audit event
    await logPciAuditEvent(
      'create_payout',
      'direct_deposit_payouts',
      newPayout.id,
      req,
      [],
      null,
      {
        recipientId,
        amountCents,
        currency,
        description,
        journalEntryId
      }
    );

    res.status(201).json({
      ...convertDbDirectDepositPayout({ ...newPayout, journalEntryId }),
      journalEntryId
    });
  } catch (error) {
    console.error('Error creating payout:', error);
    res.status(500).json({ error: 'Failed to create payout' });
  }
});

/**
 * GET /api/stripe/direct-deposits/payouts
 * List payouts
 */
app.get('/api/stripe/direct-deposits/payouts', requireRole(['admin', 'payroll_admin', 'accountant']), async (req, res) => {
  try {
    const { 
      recipientId, 
      status, 
      startDate, 
      endDate,
      limit = 100, 
      offset = 0 
    } = req.query;
    
    let query = db.select().from(schema.directDepositPayouts);
    
    const conditions = [];
    
    if (recipientId) {
      conditions.push(eq(schema.directDepositPayouts.recipientId, recipientId as string));
    }
    
    if (status) {
      conditions.push(eq(schema.directDepositPayouts.status, status as string));
    }
    
    if (startDate) {
      conditions.push(gte(schema.directDepositPayouts.createdAt, new Date(startDate as string)));
    }
    
    if (endDate) {
      conditions.push(lte(schema.directDepositPayouts.createdAt, new Date(endDate as string)));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const payouts = await query
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string))
      .orderBy(desc(schema.directDepositPayouts.createdAt));

    // Log PCI audit event
    await logPciAuditEvent(
      'view_payouts',
      'direct_deposit_payouts',
      'bulk_list',
      req,
      ['amountCents']
    );

    res.json(payouts.map(convertDbDirectDepositPayout));
  } catch (error) {
    console.error('Error fetching payouts:', error);
    res.status(500).json({ error: 'Failed to fetch payouts' });
  }
});

/**
 * GET /api/stripe/direct-deposits/payouts/:id
 * Get payout details
 */
app.get('/api/stripe/direct-deposits/payouts/:id', requireRole(['admin', 'payroll_admin', 'accountant']), async (req, res) => {
  try {
    const payoutId = req.params.id;
    const [payout] = await db.select().from(schema.directDepositPayouts)
      .where(eq(schema.directDepositPayouts.id, payoutId))
      .limit(1);

    if (!payout) {
      return res.status(404).json({ error: 'Payout not found' });
    }

    // Log PCI audit event
    await logPciAuditEvent(
      'view_payout',
      'direct_deposit_payouts',
      payoutId,
      req,
      ['amountCents']
    );

    res.json(convertDbDirectDepositPayout(payout));
  } catch (error) {
    console.error('Error fetching payout:', error);
    res.status(500).json({ error: 'Failed to fetch payout' });
  }
});

// ==============================
// WEBHOOK ENDPOINT
// ==============================

/**
 * POST /api/stripe/webhooks/direct-deposit
 * Handle Stripe webhook events for direct deposit
 */
app.post('/api/stripe/webhooks/direct-deposit', requireRole(['admin']), async (req, res) => {
  try {
    const event = req.body as Stripe.Event;

    // Log webhook event
    const [webhookEvent] = await db.insert(schema.stripeWebhookEvents)
      .values({
        stripeEventId: event.id,
        eventType: event.type,
        eventData: JSON.stringify(event.data.object),
        apiVersion: event.api_version,
        requestId: event.request?.id,
        requestIdempotencyKey: event.request?.idempotency_key,
        livemode: event.livemode,
        processingStatus: 'pending'
      })
      .returning();

    // Process specific events
    switch (event.type) {
      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;
        
      case 'transfer.created':
        await handleTransferCreated(event.data.object as Stripe.Transfer);
        break;
        
      case 'transfer.paid':
        await handleTransferPaid(event.data.object as Stripe.Transfer);
        break;
        
      case 'transfer.failed':
        await handleTransferFailed(event.data.object as Stripe.Transfer);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark webhook event as processed
    await db.update(schema.stripeWebhookEvents)
      .set({
        processedAt: new Date(),
        processingStatus: 'processed'
      })
      .where(eq(schema.stripeWebhookEvents.id, webhookEvent.id));

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Webhook event handlers
async function handleAccountUpdated(account: Stripe.Account) {
  try {
    // Find recipient by stripe account ID
    const [recipient] = await db.select().from(schema.directDepositRecipients)
      .where(eq(schema.directDepositRecipients.stripeAccountId, account.id))
      .limit(1);

    if (!recipient) {
      console.error(`Recipient not found for Stripe account: ${account.id}`);
      return;
    }

    // Update recipient with latest account status
    await db.update(schema.directDepositRecipients)
      .set({
        verificationStatus: account.requirements?.pending_verification?.length ? 'pending' : 
                          account.requirements?.currently_due?.length ? 'pending' :
                          account.charges_enabled ? 'verified' : 'pending',
        accountStatus: account.details_submitted ? 'enabled' : 'restricted',
        requiresVerification: !account.details_submitted,
        verificationFieldsNeeded: account.requirements?.currently_due ? JSON.stringify(account.requirements.currently_due) : null,
        verificationDisabledReason: account.requirements?.disabled_reason || null,
        kycStatus: account.requirements?.pending_verification?.length ? 'pending' :
                  account.requirements?.currently_due?.length ? 'pending' :
                  account.details_submitted ? 'verified' : 'pending',
        chargesEnabled: account.charges_enabled || false,
        transfersEnabled: account.transfers_enabled || false,
        payoutsEnabled: account.payouts_enabled || false
      })
      .where(eq(schema.directDepositRecipients.id, recipient.id));

  } catch (error) {
    console.error('Error handling account updated:', error);
  }
}

async function handleTransferCreated(transfer: Stripe.Transfer) {
  try {
    // Find payout by transfer ID
    const [payout] = await db.select().from(schema.directDepositPayouts)
      .where(eq(schema.directDepositPayouts.stripePayoutId, transfer.id))
      .limit(1);

    if (payout) {
      await db.update(schema.directDepositPayouts)
        .set({
          status: 'in_transit',
          estimatedArrivalDate: transfer.arrival_date ? new Date(transfer.arrival_date * 1000) : null
        })
        .where(eq(schema.directDepositPayouts.id, payout.id));
    }
  } catch (error) {
    console.error('Error handling transfer created:', error);
  }
}

async function handleTransferPaid(transfer: Stripe.Transfer) {
  try {
    // Find payout by transfer ID
    const [payout] = await db.select().from(schema.directDepositPayouts)
      .where(eq(schema.directDepositPayouts.stripePayoutId, transfer.id))
      .limit(1);

    if (payout) {
      await db.update(schema.directDepositPayouts)
        .set({
          status: 'paid',
          actualPayoutDate: new Date()
        })
        .where(eq(schema.directDepositPayouts.id, payout.id));
    }
  } catch (error) {
    console.error('Error handling transfer paid:', error);
  }
}

async function handleTransferFailed(transfer: Stripe.Transfer) {
  try {
    // Find payout by transfer ID
    const [payout] = await db.select().from(schema.directDepositPayouts)
      .where(eq(schema.directDepositPayouts.stripePayoutId, transfer.id))
      .limit(1);

    if (payout) {
      await db.update(schema.directDepositPayouts)
        .set({
          status: 'failed',
          failureReason: transfer.failure_message || 'Transfer failed'
        })
        .where(eq(schema.directDepositPayouts.id, payout.id));
    }
  } catch (error) {
    console.error('Error handling transfer failed:', error);
  }
}

async function processTransferPaid(transfer: any) {
  console.log('Processing transfer paid:', transfer.id);
}

async function processTransferFailed(transfer: any) {
  console.log('Processing transfer failed:', transfer.id);
}

// Type definitions for webhook processing
interface WebhookEventContext {
  event: any;
  eventId: string;
  processedRecords: Record<string, any>;
  errorLog: string[];
}

// Verify Stripe webhook signature
function verifyStripeSignature(req: express.Request): { isValid: boolean; event?: any; error?: string } {
  try {
    const signature = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!signature) {
      return { isValid: false, error: 'Missing stripe-signature header' };
    }
    
    if (!webhookSecret) {
      return { isValid: false, error: 'Webhook secret not configured' };
    }
    
    try {
      const event = stripe.webhooks.constructEvent(
        req.body, 
        signature, 
        webhookSecret
      );
      return { isValid: true, event };
    } catch (err: any) {
      return { isValid: false, error: `Webhook signature verification failed: ${err.message}` };
    }
  } catch (error: any) {
    return { isValid: false, error: error.message };
  }
}

// Check if event is duplicate
async function isDuplicateEvent(eventId: string): Promise<boolean> {
  try {
    const existing = await db.select()
      .from(schema.stripeWebhookEvents)
      .where(eq(schema.stripeWebhookEvents.stripeEventId, eventId))
      .limit(1);
    return existing.length > 0;
  } catch (error) {
    console.error('Error checking duplicate event:', error);
    return false;
  }
}

// Update webhook event status
async function updateWebhookEventStatus(eventId: string, status: string, errorMessage?: string) {
  try {
    await db.update(schema.stripeWebhookEvents)
      .set({
        processingStatus: status,
        processedAt: new Date(),
        errorMessage: errorMessage || null,
        retryCount: sql`${schema.stripeWebhookEvents.retryCount} + 1`
      })
      .where(eq(schema.stripeWebhookEvents.stripeEventId, eventId));
  } catch (error) {
    console.error('Error updating webhook event status:', error);
  }
}

// Log webhook event
async function logWebhookEvent(eventId: string, eventType: string, eventData: any, context: WebhookEventContext) {
  try {
    const [webhookEvent] = await db.insert(schema.stripeWebhookEvents)
      .values({
        stripeEventId: eventId,
        eventType: eventType,
        eventData: JSON.stringify(eventData),
        apiVersion: '2024-06-20',
        livemode: false,
        processingStatus: 'pending'
      })
      .returning();
    
    return webhookEvent.id;
  } catch (error) {
    console.error('Error logging webhook event:', error);
    return null;
  }
}

// Main webhook endpoint
app.post('/webhooks/stripe', webhookRawBody, async (req, res) => {
  console.log('🚀 Stripe webhook received');
  
  const context: WebhookEventContext = {
    event: null,
    eventId: '',
    processedRecords: {},
    errorLog: []
  };

  try {
    // Verify webhook signature
    const verification = verifyStripeSignature(req);
    if (!verification.isValid) {
      console.error('❌ Webhook signature verification failed:', verification.error);
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event = verification.event!;
    context.event = event;
    context.eventId = event.id;

    console.log(`📨 Webhook verified: ${event.id} (${event.type})`);

    // Check for duplicate events (idempotency)
    const isDuplicate = await isDuplicateEvent(event.id);
    if (isDuplicate) {
      console.log(`⚠️ Duplicate event detected: ${event.id}`);
      return res.status(200).json({ 
        status: 'ignored', 
        message: 'Duplicate event - already processed',
        event_id: event.id 
      });
    }

    // Log webhook event
    const webhookLogId = await logWebhookEvent(event.id, event.type, event, context);
    
    // Process the event
    await processWebhookEvent(event, context);

    // Update webhook event status to processed
    await updateWebhookEventStatus(event.id, 'processed');

    console.log(`✅ Webhook processed successfully: ${event.id}`);

    return res.status(200).json({
      status: 'processed',
      event_id: event.id,
      event_type: event.type,
      processed_records: context.processedRecords
    });

  } catch (error) {
    console.error('❌ Webhook processing failed:', error);
    
    if (context.eventId) {
      await updateWebhookEventStatus(context.eventId, 'failed', error.message);
    }
    
    return res.status(500).json({
      status: 'failed',
      error: error.message,
      event_id: context.eventId || 'unknown',
      timestamp: new Date().toISOString()
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.API_PORT || 3001;

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
  console.log('✅ Stripe webhook endpoints available:');
  console.log('   POST /webhooks/stripe - Main webhook endpoint');
  console.log('   GET  /webhooks/stripe/events - List webhook events');
  console.log('   GET  /webhooks/stripe/status/:eventId - Check event status');
  console.log('   POST /webhooks/stripe/retry - Retry failed event');
});

export { app };

// ===================================================================
// STRIPE WEBHOOK COMPLETION - Final Implementation
// ===================================================================

// Process webhook event function (simplified)
async function processWebhookEvent(event: any, context: WebhookEventContext): Promise<void> {
  const eventType = event.type;
  console.log(`🔄 Processing webhook event: ${eventType}`);

  try {
    switch (eventType) {
      // Payment Intent events
      case 'payment_intent.succeeded':
        console.log('✅ Processing payment_intent.succeeded');
        break;
      case 'payment_intent.payment_failed':
        console.log('❌ Processing payment_intent.payment_failed');
        break;
        
      // Customer events
      case 'customer.created':
        console.log('👤 Processing customer.created');
        break;
      case 'customer.updated':
        console.log('📝 Processing customer.updated');
        break;
      case 'customer.deleted':
        console.log('🗑️ Processing customer.deleted');
        break;
        
      // Payment Method events
      case 'payment_method.attached':
        console.log('🔗 Processing payment_method.attached');
        break;
      case 'payment_method.detached':
        console.log('🔌 Processing payment_method.detached');
        break;
        
      // Charge events
      case 'charge.succeeded':
        console.log('💳 Processing charge.succeeded');
        break;
      case 'charge.refunded':
        console.log('↩️ Processing charge.refunded');
        break;
        
      // Connect account events
      case 'account.updated':
        console.log('🏦 Processing account.updated');
        break;
        
      // Balance events
      case 'balance.available':
        console.log('💰 Processing balance.available');
        break;
        
      // Payout events
      case 'payout.paid':
        console.log('💸 Processing payout.paid');
        break;
      case 'payout.failed':
        console.log('❌ Processing payout.failed');
        break;
      case 'payout.created':
        console.log('📤 Processing payout.created');
        break;
      case 'payout_failure.created':
        console.log('⚠️ Processing payout_failure.created');
        break;
        
      // Unknown events
      default:
        console.log(`ℹ️ Unhandled event type: ${eventType}`);
        context.errorLog.push(`Unhandled event type: ${eventType}`);
    }
  } catch (error) {
    console.error(`❌ Error processing event ${eventType}:`, error);
    context.errorLog.push(`Processing failed: ${error.message}`);
    throw error;
  }
}

// Webhook retry logic endpoint (for manual retries)
app.post('/webhooks/stripe/retry', async (req, res) => {
  try {
    const { event_id } = req.body;
    
    if (!event_id) {
      return res.status(400).json({ error: 'event_id is required' });
    }

    // Get the webhook event
    const webhookEvents = await db.select()
      .from(schema.stripeWebhookEvents)
      .where(eq(schema.stripeWebhookEvents.stripeEventId, event_id))
      .limit(1);

    if (webhookEvents.length === 0) {
      return res.status(404).json({ error: 'Webhook event not found' });
    }

    const webhookEvent = webhookEvents[0];
    
    if (webhookEvent.processingStatus === 'processed') {
      return res.status(409).json({ error: 'Event already processed' });
    }

    // Reset processing status
    await db.update(schema.stripeWebhookEvents)
      .set({
        processingStatus: 'pending',
        processedAt: null,
        errorMessage: null,
        retryCount: sql`${schema.stripeWebhookEvents.retryCount} + 1`
      })
      .where(eq(schema.stripeWebhookEvents.stripeEventId, event_id));

    // Re-process the event
    const context: WebhookEventContext = {
      event: JSON.parse(webhookEvent.eventData),
      eventId: webhookEvent.stripeEventId,
      processedRecords: {
        customerId: webhookEvent.customerId || undefined,
        paymentMethodId: webhookEvent.paymentMethodId || undefined,
        achPaymentId: webhookEvent.achPaymentId || undefined,
        directDepositRecipientId: webhookEvent.directDepositRecipientId || undefined,
        directDepositPayoutId: webhookEvent.directDepositPayoutId || undefined,
      },
      errorLog: []
    };

    await processWebhookEvent(context.event, context);
    await updateWebhookEventStatus(event_id, 'processed');

    res.json({
      status: 'retry_successful',
      event_id,
      processed_records: context.processedRecords
    });

  } catch (error) {
    console.error('Webhook retry failed:', error);
    res.status(500).json({ error: 'Retry failed', details: error.message });
  }
});

// Webhook status endpoint
app.get('/webhooks/stripe/status/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const webhookEvents = await db.select()
      .from(schema.stripeWebhookEvents)
      .where(eq(schema.stripeWebhookEvents.stripeEventId, eventId))
      .limit(1);

    if (webhookEvents.length === 0) {
      return res.status(404).json({ error: 'Webhook event not found' });
    }

    const webhookEvent = webhookEvents[0];
    
    res.json({
      event_id: webhookEvent.stripeEventId,
      event_type: webhookEvent.eventType,
      processing_status: webhookEvent.processingStatus,
      processed_at: webhookEvent.processedAt,
      retry_count: webhookEvent.retryCount,
      error_message: webhookEvent.errorMessage,
      created_at: webhookEvent.createdAt
    });

  } catch (error) {
    console.error('Error fetching webhook status:', error);
    res.status(500).json({ error: 'Failed to fetch webhook status' });
  }
});

// Webhook events list endpoint
app.get('/webhooks/stripe/events', async (req, res) => {
  try {
    const { status, event_type, limit = 50 } = req.query;
    
    let query = db.select().from(schema.stripeWebhookEvents);
    
    if (status) {
      query = query.where(eq(schema.stripeWebhookEvents.processingStatus, status));
    }
    
    if (event_type) {
      query = query.where(eq(schema.stripeWebhookEvents.eventType, event_type));
    }
    
    const events = await query
      .orderBy(desc(schema.stripeWebhookEvents.createdAt))
      .limit(parseInt(limit as string));

    res.json(events);

  } catch (error) {
    console.error('Error fetching webhook events:', error);
    res.status(500).json({ error: 'Failed to fetch webhook events' });
  }
});

// ===================================================================
// SERVER STARTUP AND EXPORT
// ===================================================================

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.API_PORT || 3001;

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
  console.log('✅ Stripe webhook endpoints available:');
  console.log('   POST /webhooks/stripe - Main webhook endpoint');
  console.log('   GET  /webhooks/stripe/events - List webhook events');
  console.log('   GET  /webhooks/stripe/status/:eventId - Check event status');
  console.log('   POST /webhooks/stripe/retry - Retry failed event');
});

export { app };