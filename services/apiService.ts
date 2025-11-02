import type { 
  Employee, 
  JournalEntry, 
  Vendor, 
  CompanyCard, 
  CardTransaction, 
  PurchaseOrder, 
  Invoice, 
  ConsulCreditsTransaction,
  ConsulCreditsConfig
} from '../types';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? `${window.location.protocol}//${window.location.hostname}:3001/api`
  : `${window.location.protocol}//${window.location.hostname}:3001/api`;

class ApiService {
  private async fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    return response.json();
  }

  // Employees
  async getEmployees(): Promise<Employee[]> {
    return this.fetchApi<Employee[]>('/employees');
  }

  async addEmployee(employee: Omit<Employee, 'id'>): Promise<Employee> {
    return this.fetchApi<Employee>('/employees', {
      method: 'POST',
      body: JSON.stringify(employee),
    });
  }

  async updateEmployee(employee: Employee): Promise<Employee> {
    return this.fetchApi<Employee>(`/employees/${employee.id}`, {
      method: 'PUT',
      body: JSON.stringify(employee),
    });
  }

  // Journal Entries
  async getJournalEntries(): Promise<JournalEntry[]> {
    return this.fetchApi<JournalEntry[]>('/journal-entries');
  }

  async addJournalEntry(entry: Omit<JournalEntry, 'id' | 'date'>): Promise<JournalEntry> {
    return this.fetchApi<JournalEntry>('/journal-entries', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  }

  // Vendors
  async getVendors(): Promise<Vendor[]> {
    return this.fetchApi<Vendor[]>('/vendors');
  }

  async addVendor(vendor: Omit<Vendor, 'id' | 'createdDate'>): Promise<Vendor> {
    return this.fetchApi<Vendor>('/vendors', {
      method: 'POST',
      body: JSON.stringify(vendor),
    });
  }

  // Company Cards
  async getCompanyCards(): Promise<CompanyCard[]> {
    return this.fetchApi<CompanyCard[]>('/company-cards');
  }

  async addCompanyCard(card: Omit<CompanyCard, 'id'>): Promise<CompanyCard> {
    return this.fetchApi<CompanyCard>('/company-cards', {
      method: 'POST',
      body: JSON.stringify(card),
    });
  }

  async updateCompanyCard(card: CompanyCard): Promise<CompanyCard> {
    return this.fetchApi<CompanyCard>(`/company-cards/${card.id}`, {
      method: 'PUT',
      body: JSON.stringify(card),
    });
  }

  // Card Transactions
  async getCardTransactions(): Promise<CardTransaction[]> {
    return this.fetchApi<CardTransaction[]>('/card-transactions');
  }

  async addCardTransaction(transaction: Omit<CardTransaction, 'id'>): Promise<CardTransaction> {
    return this.fetchApi<CardTransaction>('/card-transactions', {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  }

  // Purchase Orders
  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    return this.fetchApi<PurchaseOrder[]>('/purchase-orders');
  }

  async addPurchaseOrder(order: Omit<PurchaseOrder, 'id' | 'date'>): Promise<PurchaseOrder> {
    return this.fetchApi<PurchaseOrder>('/purchase-orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  }

  // Invoices
  async getInvoices(): Promise<Invoice[]> {
    return this.fetchApi<Invoice[]>('/invoices');
  }

  async addInvoice(invoice: Omit<Invoice, 'id' | 'issueDate'>): Promise<Invoice> {
    return this.fetchApi<Invoice>('/invoices', {
      method: 'POST',
      body: JSON.stringify(invoice),
    });
  }

  async updateInvoiceStatus(invoiceId: string, status: Invoice['status']): Promise<Invoice> {
    return this.fetchApi<Invoice>(`/invoices/${invoiceId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }
  
  // Consul Credits
  async getConsulCreditsConfig(): Promise<ConsulCreditsConfig> {
    return this.fetchApi<ConsulCreditsConfig>('/consul-credits/config');
  }

  // ConsulCredits Transactions
  async getConsulCreditsTransactions(): Promise<ConsulCreditsTransaction[]> {
    return this.fetchApi<ConsulCreditsTransaction[]>('/consul-credits-transactions');
  }

  async addConsulCreditsTransaction(transaction: Omit<ConsulCreditsTransaction, 'id'>): Promise<ConsulCreditsTransaction> {
    return this.fetchApi<ConsulCreditsTransaction>('/consul-credits-transactions', {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.fetchApi<{ status: string; timestamp: string }>('/health');
  }

  // Stripe Journal Entry Services
  async createACHPaymentEntry(paymentData: {
    achTransactionId: string;
    amount: number;
    currency: string;
    customerId?: string;
    description?: string;
    created: number;
    status: string;
    returnCode?: string;
    returnDescription?: string;
    bankAccountLast4?: string;
  }): Promise<{ success: boolean; journalEntry?: any; error?: string }> {
    return this.fetchApi('/stripe/journal/ach-payment', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  async createStripeFeeEntry(paymentData: {
    stripeTransactionId: string;
    amount: number;
    currency: string;
    description?: string;
    created: number;
    sourceType: string;
    status: string;
    feeAmount?: number;
    netAmount?: number;
  }): Promise<{ success: boolean; journalEntry?: any; error?: string }> {
    return this.fetchApi('/stripe/journal/fee', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  async createPayrollEntry(payrollData: {
    employeeId: string;
    employeeName: string;
    grossAmount: number;
    netAmount: number;
    taxAmount: number;
    bankRoutingNumber: string;
    bankAccountLast4: string;
    payPeriod: string;
    payrollDate: string;
  }): Promise<{ success: boolean; journalEntry?: any; error?: string }> {
    return this.fetchApi('/stripe/journal/payroll', {
      method: 'POST',
      body: JSON.stringify(payrollData),
    });
  }

  async createACHReturnEntry(paymentData: {
    achTransactionId: string;
    amount: number;
    currency: string;
    customerId?: string;
    description?: string;
    created: number;
    status: string;
    returnCode?: string;
    returnDescription?: string;
    bankAccountLast4?: string;
  }): Promise<{ success: boolean; journalEntry?: any; error?: string }> {
    return this.fetchApi('/stripe/journal/ach-return', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  async createCustomerPaymentApplication(paymentApplication: {
    customerId: string;
    invoiceIds: string[];
    paymentAmount: number;
    discountAmount?: number;
    stripeTransactionId: string;
    paymentDate: string;
  }): Promise<{ success: boolean; journalEntry?: any; error?: string }> {
    return this.fetchApi('/stripe/journal/customer-payment', {
      method: 'POST',
      body: JSON.stringify(paymentApplication),
    });
  }

  async createVendorPaymentEntry(vendorPayment: {
    vendorId: string;
    vendorName: string;
    invoiceNumber?: string;
    amount: number;
    paymentMethod: string;
    bankAccountLast4?: string;
    description?: string;
  }): Promise<{ success: boolean; journalEntry?: any; error?: string }> {
    return this.fetchApi('/stripe/journal/vendor-payment', {
      method: 'POST',
      body: JSON.stringify(vendorPayment),
    });
  }

  async processBatchEntries(entries: Array<{
    type: string;
    data: any;
    metadata?: Record<string, any>;
  }>): Promise<{ success: boolean; journalEntries?: any[]; errors?: string[]; error?: string }> {
    return this.fetchApi('/stripe/journal/batch', {
      method: 'POST',
      body: JSON.stringify({ entries }),
    });
  }

  async getStripeAccountMappings(): Promise<{
    success: boolean;
    mappings?: Record<string, number>;
    error?: string;
  }> {
    return this.fetchApi('/stripe/journal/account-mappings');
  }

  async generateFeeReport(startDate: string, endDate: string): Promise<{
    success: boolean;
    report?: {
      totalFees: number;
      feeBreakdown: Record<string, number>;
      transactionCount: number;
    };
    error?: string;
  }> {
    return this.fetchApi(`/stripe/journal/fee-report?startDate=${startDate}&endDate=${endDate}`);
  }

  // Reconciliation Services
  async performAutomatedReconciliation(startDate: string, endDate: string): Promise<{
    success: boolean;
    matches?: Array<{
      stripeTransactionId: string;
      journalEntryId?: string;
      amount: number;
      date: string;
      confidence: number;
      matchType: string;
      differences?: any;
    }>;
    exceptions?: Array<{
      id: string;
      type: string;
      severity: string;
      stripeTransactionId: string;
      journalEntryId?: string;
      amount: number;
      date: string;
      description: string;
      suggestedAction?: string;
      resolved: boolean;
    }>;
    report?: {
      period: string;
      totalTransactions: number;
      matchedTransactions: number;
      unmatchedTransactions: number;
      totalAmount: number;
      matchedAmount: number;
      unmatchedAmount: number;
      exceptions: any[];
      reconciliationRate: number;
      generatedAt: string;
    };
    error?: string;
  }> {
    return this.fetchApi('/stripe/reconciliation/automated', {
      method: 'POST',
      body: JSON.stringify({ startDate, endDate }),
    });
  }

  async processACHRturns(returns: Array<{
    id: string;
    amount: number;
    currency: string;
    created: number;
    status: string;
    failure_code?: string;
    failure_message?: string;
    description?: string;
    customer?: string;
    source: string;
  }>): Promise<{
    success: boolean;
    createdEntries?: any[];
    exceptions?: any[];
    error?: string;
  }> {
    return this.fetchApi('/stripe/reconciliation/ach-returns', {
      method: 'POST',
      body: JSON.stringify({ returns }),
    });
  }

  async reconcileDirectDeposits(deposits: Array<{
    id: string;
    amount: number;
    currency: string;
    created: number;
    status: string;
    description: string;
    employee: {
      id: string;
      name: string;
    };
  }>): Promise<{
    success: boolean;
    matches?: any[];
    exceptions?: any[];
    error?: string;
  }> {
    return this.fetchApi('/stripe/reconciliation/direct-deposits', {
      method: 'POST',
      body: JSON.stringify({ deposits }),
    });
  }

  async performManualReconciliation(
    stripeTransactionId: string, 
    journalEntryId: string, 
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.fetchApi('/stripe/reconciliation/manual', {
      method: 'POST',
      body: JSON.stringify({ stripeTransactionId, journalEntryId, notes }),
    });
  }

  async getReconciliationExceptions(severity?: string): Promise<{
    success: boolean;
    exceptions?: Array<{
      id: string;
      type: string;
      severity: string;
      stripeTransactionId?: string;
      journalEntryId?: string;
      amount: number;
      date: string;
      description: string;
      suggestedAction?: string;
      resolved: boolean;
      resolvedBy?: string;
      resolvedAt?: string;
      createdAt: string;
    }>;
    error?: string;
  }> {
    const url = severity ? `/stripe/reconciliation/exceptions?severity=${severity}` : '/stripe/reconciliation/exceptions';
    return this.fetchApi(url);
  }

  async resolveException(
    exceptionId: string, 
    resolution: string, 
    notes: string, 
    resolvedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.fetchApi('/stripe/reconciliation/exceptions/resolve', {
      method: 'POST',
      body: JSON.stringify({ exceptionId, resolution, notes, resolvedBy }),
    });
  }

  async generateReconciliationReport(startDate: string, endDate: string): Promise<{
    success: boolean;
    report?: {
      period: string;
      totalTransactions: number;
      matchedTransactions: number;
      unmatchedTransactions: number;
      totalAmount: number;
      matchedAmount: number;
      unmatchedAmount: number;
      exceptions: any[];
      reconciliationRate: number;
      generatedAt: string;
    };
    error?: string;
  }> {
    return this.fetchApi(`/stripe/reconciliation/report?startDate=${startDate}&endDate=${endDate}`);
  }

  async getReconciliationStatistics(days: number = 30): Promise<{
    success: boolean;
    statistics?: {
      totalMatches: number;
      averageConfidence: number;
      exceptionRate: number;
      manualReconciliationRate: number;
    };
    error?: string;
  }> {
    return this.fetchApi(`/stripe/reconciliation/statistics?days=${days}`);
  }

  async getUnreconciledTransactions(): Promise<{
    success: boolean;
    transactions?: Array<{
      id: string;
      type: string;
      amount: number;
      date: string;
      status: string;
    }>;
    error?: string;
  }> {
    return this.fetchApi('/stripe/reconciliation/unreconciled');
  }

  // Stripe Transaction Management
  async addStripeTransaction(stripeTransaction: {
    stripeId: string;
    type: string;
    amount: number;
    currency: string;
    description?: string;
    status: string;
    feeAmount?: number;
    netAmount?: number;
    createdAt: string;
    journalEntryId?: string;
  }): Promise<{ success: boolean; error?: string }> {
    return this.fetchApi('/stripe/transactions', {
      method: 'POST',
      body: JSON.stringify(stripeTransaction),
    });
  }

  async getStripeTransactions(startDate?: string, endDate?: string): Promise<{
    success: boolean;
    transactions?: Array<{
      stripeId: string;
      type: string;
      amount: number;
      currency: string;
      description?: string;
      status: string;
      feeAmount?: number;
      netAmount?: number;
      createdAt: string;
      journalEntryId?: string;
    }>;
    error?: string;
  }> {
    const url = startDate && endDate 
      ? `/stripe/transactions?startDate=${startDate}&endDate=${endDate}`
      : '/stripe/transactions';
    return this.fetchApi(url);
  }
}

export const apiService = new ApiService();