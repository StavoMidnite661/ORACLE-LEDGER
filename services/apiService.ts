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
}

export const apiService = new ApiService();