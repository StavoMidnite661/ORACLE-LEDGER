
import React, { useState, useMemo } from 'react';
import type { Invoice, StripeCustomer, AchPayment } from '../types.js';
import { Modal } from '../components/shared/Modal.js';
import { 
  ModalButton, 
  ModalInput, 
  ModalLabel, 
  ModalSection, 
  ModalSelect 
} from '../components/shared/ModalElements.js';
import { invoiceSchema } from '../shared/schemas.js';
import { z } from 'zod';

const FormError: React.FC<{ message?: string }> = ({ message }) => 
  message ? <p className="text-sov-red text-[10px] mt-1 font-medium uppercase tracking-wider">{message}</p> : null;

interface AccountsReceivableViewProps {
  invoices: Invoice[];
  addInvoice: (invoice: Omit<Invoice, 'id' | 'issueDate' | 'type'>) => void;
  stripeCustomers?: StripeCustomer[];
  achPayments?: AchPayment[];
  onCreateStripeCustomer?: (customerData: Partial<StripeCustomer>) => void;
  onCollectViaACH?: (invoice: Invoice) => void;
}

type SortableKeys = keyof Invoice;
type SortConfig = { key: SortableKeys; direction: 'ascending' | 'descending' };

const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
        case 'Paid': return 'bg-sov-green/20 text-sov-green';
        case 'Issued': return 'bg-blue-500/20 text-blue-400';
        case 'Overdue': return 'bg-sov-red/20 text-sov-red';
        default: return 'bg-gray-500/20 text-gray-400';
    }
};

const SortIndicator: React.FC<{ direction?: 'ascending' | 'descending' }> = ({ direction }) => (
  <span className="inline-flex flex-col text-xs ml-2 opacity-50">
    <svg className={`h-2 w-2 ${direction === 'ascending' ? 'text-sov-light opacity-100' : 'text-sov-light-alt'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M10 3l-5 5h10l-5-5z"/></svg>
    <svg className={`h-2 w-2 ${direction === 'descending' ? 'text-sov-light opacity-100' : 'text-sov-light-alt'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M10 17l5-5H5l5 5z"/></svg>
  </span>
);

export const AccountsReceivableView: React.FC<AccountsReceivableViewProps> = ({ 
  invoices, 
  addInvoice,
  stripeCustomers = [],
  achPayments = [],
  onCreateStripeCustomer,
  onCollectViaACH
}) => {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);
  const [isStripeCustomerModalOpen, setIsStripeCustomerModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'issueDate', direction: 'descending' });
  
  const [counterparty, setCounterparty] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [enableStripe, setEnableStripe] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const sortedInvoices = useMemo(() => {
    let sortableItems = [...invoices];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [invoices, sortConfig]);

  const requestSort = (key: SortableKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortDirection = (key: SortableKeys) => {
    if (!sortConfig || sortConfig.key !== key) return undefined;
    return sortConfig.direction;
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const validated = invoiceSchema.parse({
        invoiceNumber,
        amount: +amount,
        dueDate,
        description,
        status: 'PENDING'
      });

      addInvoice({
        counterparty,
        dueDate: validated.dueDate,
        amount: validated.amount,
        status: 'Issued',
      });

      // Create Stripe customer if enabled
      if (enableStripe && onCreateStripeCustomer && customerEmail) {
        onCreateStripeCustomer({
          firstName: counterparty.split(' ')[0] || counterparty,
          lastName: counterparty.split(' ').slice(1).join(' ') || '',
          email: customerEmail,
          phone: customerPhone,
          active: true,
        });
      }

      setIsNewInvoiceModalOpen(false);
      resetForm();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach(e => {
          if (e.path[0]) fieldErrors[e.path[0].toString()] = e.message;
        });
        setErrors(fieldErrors);
      }
    }
  };

  const resetForm = () => {
    setCounterparty('');
    setCustomerEmail('');
    setCustomerPhone('');
    setDueDate('');
    setAmount('');
    setDescription('');
    setInvoiceNumber('');
    setEnableStripe(false);
    setErrors({});
  };

  const handleCreateStripeCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if(!counterparty || !customerEmail) return;

    if (onCreateStripeCustomer) {
      onCreateStripeCustomer({
        firstName: counterparty.split(' ')[0] || counterparty,
        lastName: counterparty.split(' ').slice(1).join(' ') || '',
        email: customerEmail,
        phone: customerPhone,
        active: true,
      });
    }

    setIsStripeCustomerModalOpen(false);
    setCounterparty('');
    setCustomerEmail('');
    setCustomerPhone('');
  };

  const getACHStatus = (invoiceId: string) => {
    const achPayment = achPayments.find(payment => payment.invoiceId === invoiceId);
    return achPayment?.status || null;
  };

  const getCustomerPaymentHistory = (customerName: string) => {
    const customer = stripeCustomers.find(c => 
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(customerName.toLowerCase()) ||
      customerName.toLowerCase().includes(`${c.firstName} ${c.lastName}`.toLowerCase())
    );
    
    if (!customer) return [];

    return achPayments.filter(payment => payment.customerId === customer.id);
  };

  return (
    <>
      <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700 max-h-[600px] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-sov-light">Accounts Receivable</h3>
          <div className="flex space-x-2">
            <button 
              onClick={() => setIsStripeCustomerModalOpen(true)}
              className="bg-sov-gold/20 text-sov-gold font-bold py-2 px-4 rounded-lg hover:bg-sov-gold/30 transition-colors">
              Add Stripe Customer
            </button>
            <button 
              onClick={() => setIsNewInvoiceModalOpen(true)}
              className="bg-sov-accent text-sov-dark font-bold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors">
              Issue New Invoice
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-gray-700">
              <tr>
                <th className="p-3 cursor-pointer" onClick={() => requestSort('id')}><div className="flex items-center">Invoice ID <SortIndicator direction={getSortDirection('id')} /></div></th>
                <th className="p-3 cursor-pointer" onClick={() => requestSort('counterparty')}><div className="flex items-center">Customer <SortIndicator direction={getSortDirection('counterparty')} /></div></th>
                <th className="p-3 cursor-pointer" onClick={() => requestSort('issueDate')}><div className="flex items-center">Issue Date <SortIndicator direction={getSortDirection('issueDate')} /></div></th>
                <th className="p-3 cursor-pointer" onClick={() => requestSort('dueDate')}><div className="flex items-center">Due Date <SortIndicator direction={getSortDirection('dueDate')} /></div></th>
                <th className="p-3 cursor-pointer" onClick={() => requestSort('status')}><div className="flex items-center">Status <SortIndicator direction={getSortDirection('status')} /></div></th>
                <th className="p-3 text-center">ACH Payment</th>
                <th className="p-3 text-right cursor-pointer" onClick={() => requestSort('amount')}><div className="flex items-center justify-end">Amount <SortIndicator direction={getSortDirection('amount')} /></div></th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedInvoices.map(inv => {
                const achStatus = getACHStatus(inv.id);
                const paymentHistory = getCustomerPaymentHistory(inv.counterparty);
                
                return (
                  <tr key={inv.id} onClick={() => setSelectedInvoice(inv)} className="border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer">
                    <td className="p-3 font-mono text-sm">{inv.id}</td>
                    <td className="p-3">
                      <div>
                        <div>{inv.counterparty}</div>
                        {paymentHistory.length > 0 && (
                          <div className="text-xs text-sov-light-alt">
                            {paymentHistory.length} payment{paymentHistory.length !== 1 ? 's' : ''} via Stripe
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3">{inv.issueDate}</td>
                    <td className="p-3">{inv.dueDate}</td>
                    <td className="p-3">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(inv.status)}`}>
                            {inv.status}
                        </span>
                    </td>
                    <td className="p-3 text-center">
                      {achStatus ? (
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          achStatus === 'succeeded' ? 'bg-sov-green/20 text-sov-green' :
                          achStatus === 'pending' ? 'bg-sov-gold/20 text-sov-gold' :
                          'bg-sov-red/20 text-sov-red'
                        }`}>
                          {achStatus}
                        </span>
                      ) : (
                        <span className="text-sov-light-alt text-xs">Not collected</span>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono">${inv.amount.toLocaleString()}</td>
                    <td className="p-3 text-center space-x-1">
                      {onCollectViaACH && inv.status === 'Issued' && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onCollectViaACH(inv);
                          }}
                          className="bg-sov-accent/20 text-sov-accent text-xs font-bold py-1 px-2 rounded hover:bg-sov-accent/30 transition-colors"
                        >
                          Collect via ACH
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={!!selectedInvoice} onClose={() => setSelectedInvoice(null)} title={`Details for Invoice #${selectedInvoice?.id}`}>
        {selectedInvoice && (
            <ModalSection>
              <div className="space-y-3 text-sov-light">
                <div className="flex justify-between border-b border-gray-700 pb-2">
                  <span className="text-sov-light-alt">Customer</span>
                  <span className="text-sov-light font-medium">{selectedInvoice.counterparty}</span>
                </div>
                <div className="flex justify-between border-b border-gray-700 pb-2">
                  <span className="text-sov-light-alt">Issued</span>
                  <span className="text-sov-light font-mono">{selectedInvoice.issueDate}</span>
                </div>
                <div className="flex justify-between border-b border-gray-700 pb-2">
                  <span className="text-sov-light-alt">Due</span>
                  <span className="text-sov-light font-mono">{selectedInvoice.dueDate}</span>
                </div>
                <div className="flex justify-between border-b border-gray-700 pb-2">
                  <span className="text-sov-light-alt">Status</span>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(selectedInvoice.status)}`}>{selectedInvoice.status}</span>
                </div>
                <div className="flex justify-between pt-2">
                   <span className="text-sov-light-alt text-lg">Amount</span>
                   <span className="text-sov-accent text-lg font-bold font-mono">${selectedInvoice.amount.toLocaleString()}</span>
                </div>
              </div>
            </ModalSection>
        )}
        <div className="flex justify-end pt-4">
             <ModalButton variant="secondary" onClick={() => setSelectedInvoice(null)}>Close</ModalButton>
        </div>
      </Modal>

      <Modal isOpen={isNewInvoiceModalOpen} onClose={() => setIsNewInvoiceModalOpen(false)} title="Issue New AR Invoice">
         <form onSubmit={handleCreateInvoice} className="space-y-4">
            <ModalSection>
              <div>
              <ModalLabel htmlFor="ar-counterparty">Customer Name</ModalLabel>
              <ModalInput type="text" id="ar-counterparty" value={counterparty} onChange={e => setCounterparty(e.target.value)} required />
            </div>
            <div className="bg-sov-dark p-4 rounded-lg border border-gray-600">
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  id="enableStripe"
                  checked={enableStripe}
                  onChange={(e) => setEnableStripe(e.target.checked)}
                  className="h-4 w-4 text-sov-accent focus:ring-sov-accent border-gray-600 rounded bg-sov-dark"
                />
                <label htmlFor="enableStripe" className="ml-2 block text-sm font-medium text-sov-light">
                  Enable Stripe Integration
                </label>
              </div>
              {enableStripe && (
                <div className="space-y-3">
                  <div>
                    <ModalLabel htmlFor="customerEmail">Customer Email</ModalLabel>
                    <ModalInput type="email" id="customerEmail" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} />
                  </div>
                  <div>
                    <ModalLabel htmlFor="customerPhone">Customer Phone (Optional)</ModalLabel>
                    <ModalInput type="tel" id="customerPhone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
                  </div>
                </div>
              )}
            </div>
            <div>
              <ModalLabel htmlFor="ar-dueDate">Due Date</ModalLabel>
              <ModalInput type="date" id="ar-dueDate" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
            </div>
            <div>
              <ModalLabel htmlFor="ar-amount">Amount</ModalLabel>
              <ModalInput type="number" id="ar-amount" value={amount} onChange={e => setAmount(e.target.valueAsNumber || '')} min="0.01" step="0.01" required />
            </div>
            </ModalSection>
            <div className="flex justify-end pt-4 space-x-2">
              <ModalButton type="button" variant="secondary" onClick={() => setIsNewInvoiceModalOpen(false)}>Cancel</ModalButton>
              <ModalButton type="submit" variant="primary">Issue Invoice</ModalButton>
            </div>
        </form>
      </Modal>

      <Modal isOpen={isStripeCustomerModalOpen} onClose={() => setIsStripeCustomerModalOpen(false)} title="Create New Stripe Customer">
         <form onSubmit={handleCreateStripeCustomer} className="space-y-4">
            <ModalSection>
              <div>
              <ModalLabel htmlFor="stripe-customer-name">Customer Name</ModalLabel>
              <ModalInput type="text" id="stripe-customer-name" value={counterparty} onChange={e => setCounterparty(e.target.value)} required />
            </div>
            <div>
              <ModalLabel htmlFor="stripe-customer-email">Customer Email</ModalLabel>
              <ModalInput type="email" id="stripe-customer-email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} required />
            </div>
            <div>
              <ModalLabel htmlFor="stripe-customer-phone">Customer Phone (Optional)</ModalLabel>
              <ModalInput type="tel" id="stripe-customer-phone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
            </div>
            <div className="bg-sov-dark p-4 rounded-lg border border-gray-600">
              <p className="text-sm text-sov-light-alt">
                Creating a Stripe customer enables ACH payments, payment method setup, and automatic payment collection for future invoices.
              </p>
            </div>
            </ModalSection>
            <div className="flex justify-end pt-4 space-x-2">
              <ModalButton type="button" variant="secondary" onClick={() => setIsStripeCustomerModalOpen(false)}>Cancel</ModalButton>
              <ModalButton type="submit" variant="primary">Create Customer</ModalButton>
            </div>
        </form>
      </Modal>
    </>
  );
};
