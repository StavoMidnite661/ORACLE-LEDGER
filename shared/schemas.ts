import { z } from 'zod';

export const journalEntrySchema = z.object({
  description: z.string().min(3, "Description must be at least 3 characters"),
  reference: z.string().optional(),
  vendorId: z.string().optional(),
  lines: z.array(z.object({
    accountId: z.number().int().positive(),
    type: z.enum(['DEBIT', 'CREDIT']),
    amount: z.number().positive("Amount must be greater than zero"),
  })).min(2, "At least two lines are required (double-entry)")
  .refine(lines => {
    const totalDebit = lines.filter(l => l.type === 'DEBIT').reduce((s, l) => s + l.amount, 0);
    const totalCredit = lines.filter(l => l.type === 'CREDIT').reduce((s, l) => s + l.amount, 0);
    return Math.abs(totalDebit - totalCredit) < 0.001;
  }, "Debits and credits must balance")
});

export const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  customerId: z.string().optional(),
  vendorId: z.string().optional(),
  amount: z.number().positive("Amount must be greater than zero"),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  description: z.string().min(3, "Description must be at least 3 characters"),
  status: z.enum(['DRAFT', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED']).default('PENDING')
});

export const vendorSchema = z.object({
  name: z.string().min(2, "Vendor name is required"),
  category: z.string().min(1, "Category is required"),
  contactPerson: z.string().min(1, "Contact person is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE')
});

export const purchaseOrderSchema = z.object({
  vendorId: z.string().min(1, "Vendor is required"),
  amount: z.number().positive("Amount must be greater than zero"),
  expectedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  description: z.string().min(3, "Description must be at least 3 characters"),
  status: z.enum(['DRAFT', 'PENDING', 'APPROVED', 'RECEIVED', 'CANCELLED']).default('PENDING')
});
