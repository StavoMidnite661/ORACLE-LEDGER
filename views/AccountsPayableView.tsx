
import React, { useState, useMemo } from 'react';
import type { Invoice, Vendor, AchPayment } from '../types';
import { Modal } from '../components/shared/Modal';

interface AccountsPayableViewProps {
  invoices: Invoice[];
  addInvoice: (invoice: Omit<Invoice, 'id' | 'issueDate' | 'type'>) => void;
  vendors?: Vendor[];
  achPayments?: AchPayment[];
  onPayViaACH?: (invoice: Invoice) => void;
  onSetupDirectDeposit?: (vendor: Vendor) => void;
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

export const AccountsPayableView: React.FC<AccountsPayableViewProps> = ({ 
  invoices, 
  addInvoice,
  vendors = [],
  achPayments = [],
  onPayViaACH,
  onSetupDirectDeposit
}) => {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'issueDate', direction: 'descending' });
  
  const [counterparty, setCounterparty] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<'ACH' | 'Wire' | 'Check'>('ACH');
  const [scheduledPaymentDate, setScheduledPaymentDate] = useState('');
  
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
    if(!counterparty || !dueDate || !amount || amount <= 0) return;

    addInvoice({
      counterparty,
      dueDate,
      amount: +amount,
      status: 'Issued',
    });
    setIsNewInvoiceModalOpen(false);
    setCounterparty('');
    setDueDate('');
    setAmount('');
    setPaymentMethod('ACH');
    setScheduledPaymentDate('');
  };

  const handlePayViaACH = (invoice: Invoice) => {
    if (onPayViaACH) {
      onPayViaACH(invoice);
    }
  };

  const getVendorACHStatus = (vendorName: string) => {
    const vendor = vendors.find(v => v.name.toLowerCase().includes(vendorName.toLowerCase()) || 
      vendorName.toLowerCase().includes(v.name.toLowerCase()));
    
    if (!vendor) return null;
    
    return vendor.bankAccountNumber && vendor.bankRoutingNumber ? 'Setup Complete' : 'Not Setup';
  };

  const getVendorPaymentHistory = (vendorName: string) => {
    const vendor = vendors.find(v => v.name.toLowerCase().includes(vendorName.toLowerCase()) || 
      vendorName.toLowerCase().includes(v.name.toLowerCase()));
    
    if (!vendor) return [];
    
    return achPayments.filter(payment => 
      payment.description?.toLowerCase().includes(vendor.name.toLowerCase()) ||
      payment.invoiceId
    );
  };

  const hasACHCapability = (vendorName: string) => {
    const vendor = vendors.find(v => v.name.toLowerCase().includes(vendorName.toLowerCase()) || 
      vendorName.toLowerCase().includes(v.name.toLowerCase()));
    
    return vendor && vendor.bankAccountNumber && vendor.bankRoutingNumber;
  };

  return (
    <>
      <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-sov-light">Accounts Payable</h3>
          <div className="flex space-x-2">
            <button 
              onClick={() => setIsVendorModalOpen(true)}
              className="bg-sov-gold/20 text-sov-gold font-bold py-2 px-4 rounded-lg hover:bg-sov-gold/30 transition-colors">
              Manage Vendors
            </button>
            <button 
              onClick={() => setIsNewInvoiceModalOpen(true)}
              className="bg-sov-accent text-sov-dark font-bold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors">
              Enter New Bill
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-gray-700">
              <tr>
                <th className="p-3 cursor-pointer" onClick={() => requestSort('id')}><div className="flex items-center">Invoice ID <SortIndicator direction={getSortDirection('id')} /></div></th>
                <th className="p-3 cursor-pointer" onClick={() => requestSort('counterparty')}><div className="flex items-center">Vendor <SortIndicator direction={getSortDirection('counterparty')} /></div></th>
                <th className="p-3 cursor-pointer" onClick={() => requestSort('issueDate')}><div className="flex items-center">Issue Date <SortIndicator direction={getSortDirection('issueDate')} /></div></th>
                <th className="p-3 cursor-pointer" onClick={() => requestSort('dueDate')}><div className="flex items-center">Due Date <SortIndicator direction={getSortDirection('dueDate')} /></div></th>
                <th className="p-3 cursor-pointer" onClick={() => requestSort('status')}><div className="flex items-center">Status <SortIndicator direction={getSortDirection('status')} /></div></th>
                <th className="p-3 text-center">ACH Capability</th>
                <th className="p-3 text-right cursor-pointer" onClick={() => requestSort('amount')}><div className="flex items-center justify-end">Amount <SortIndicator direction={getSortDirection('amount')} /></div></th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedInvoices.map(inv => {
                const achStatus = getVendorACHStatus(inv.counterparty);
                const paymentHistory = getVendorPaymentHistory(inv.counterparty);
                const hasACH = hasACHCapability(inv.counterparty);
                
                return (
                  <tr key={inv.id} onClick={() => setSelectedInvoice(inv)} className="border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer">
                    <td className="p-3 font-mono text-sm">{inv.id}</td>
                    <td className="p-3">
                      <div>
                        <div>{inv.counterparty}</div>
                        {paymentHistory.length > 0 && (
                          <div className="text-xs text-sov-light-alt">
                            {paymentHistory.length} ACH payment{paymentHistory.length !== 1 ? 's' : ''} made
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
                          achStatus === 'Setup Complete' ? 'bg-sov-green/20 text-sov-green' : 'bg-sov-red/20 text-sov-red'
                        }`}>
                          {achStatus}
                        </span>
                      ) : (
                        <span className="text-sov-light-alt text-xs">Unknown</span>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono">${inv.amount.toLocaleString()}</td>
                    <td className="p-3 text-center space-x-1">
                      {onPayViaACH && hasACH && inv.status === 'Issued' && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePayViaACH(inv);
                          }}
                          className="bg-sov-accent/20 text-sov-accent text-xs font-bold py-1 px-2 rounded hover:bg-sov-accent/30 transition-colors"
                        >
                          Pay via ACH
                        </button>
                      )}
                      {!hasACH && inv.status === 'Issued' && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsVendorModalOpen(true);
                          }}
                          className="bg-sov-gold/20 text-sov-gold text-xs font-bold py-1 px-2 rounded hover:bg-sov-gold/30 transition-colors"
                        >
                          Setup ACH
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
      
      <Modal isOpen={!!selectedInvoice} onClose={() => setSelectedInvoice(null)} title={`Details for Bill #${selectedInvoice?.id}`}>
        {selectedInvoice && (
            <div className="space-y-3 text-sov-light">
              <p><strong className="text-sov-light-alt w-24 inline-block">Vendor:</strong> {selectedInvoice.counterparty}</p>
              <p><strong className="text-sov-light-alt w-24 inline-block">Issued:</strong> {selectedInvoice.issueDate}</p>
              <p><strong className="text-sov-light-alt w-24 inline-block">Due:</strong> {selectedInvoice.dueDate}</p>
              <p><strong className="text-sov-light-alt w-24 inline-block">Status:</strong> {selectedInvoice.status}</p>
              <p><strong className="text-sov-light-alt w-24 inline-block">Amount:</strong> ${selectedInvoice.amount.toLocaleString()}</p>
            </div>
        )}
      </Modal>

      <Modal isOpen={isNewInvoiceModalOpen} onClose={() => setIsNewInvoiceModalOpen(false)} title="Enter New Bill">
         <form onSubmit={handleCreateInvoice} className="space-y-4">
            <div>
              <label htmlFor="ap-counterparty" className="block text-sm font-medium text-sov-light-alt">Vendor</label>
              <input type="text" id="ap-counterparty" value={counterparty} onChange={e => setCounterparty(e.target.value)} required className="mt-1 block w-full bg-sov-dark border border-gray-600 rounded-md shadow-sm py-2 px-3 text-sov-light focus:outline-none focus:ring-sov-accent focus:border-sov-accent" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="paymentMethod" className="block text-sm font-medium text-sov-light-alt">Payment Method</label>
                <select id="paymentMethod" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as 'ACH' | 'Wire' | 'Check')} className="mt-1 block w-full bg-sov-dark border border-gray-600 rounded-md shadow-sm py-2 px-3 text-sov-light focus:outline-none focus:ring-sov-accent focus:border-sov-accent">
                  <option value="ACH">ACH Direct Deposit</option>
                  <option value="Wire">Wire Transfer</option>
                  <option value="Check">Check</option>
                </select>
              </div>
              <div>
                <label htmlFor="scheduledPaymentDate" className="block text-sm font-medium text-sov-light-alt">Scheduled Payment Date (Optional)</label>
                <input type="date" id="scheduledPaymentDate" value={scheduledPaymentDate} onChange={e => setScheduledPaymentDate(e.target.value)} className="mt-1 block w-full bg-sov-dark border border-gray-600 rounded-md shadow-sm py-2 px-3 text-sov-light focus:outline-none focus:ring-sov-accent focus:border-sov-accent" />
              </div>
            </div>
            <div>
              <label htmlFor="ap-dueDate" className="block text-sm font-medium text-sov-light-alt">Due Date</label>
              <input type="date" id="ap-dueDate" value={dueDate} onChange={e => setDueDate(e.target.value)} required className="mt-1 block w-full bg-sov-dark border border-gray-600 rounded-md shadow-sm py-2 px-3 text-sov-light focus:outline-none focus:ring-sov-accent focus:border-sov-accent" />
            </div>
            <div>
              <label htmlFor="ap-amount" className="block text-sm font-medium text-sov-light-alt">Amount</label>
              <input type="number" id="ap-amount" value={amount} onChange={e => setAmount(e.target.valueAsNumber || '')} min="0.01" step="0.01" required className="mt-1 block w-full bg-sov-dark border border-gray-600 rounded-md shadow-sm py-2 px-3 text-sov-light focus:outline-none focus:ring-sov-accent focus:border-sov-accent" />
            </div>
            <div className="bg-sov-dark p-4 rounded-lg border border-gray-600">
              <p className="text-sm text-sov-light-alt">
                {paymentMethod === 'ACH' ? 
                  'ACH payments require vendor bank account setup. Payments are processed within 1-3 business days.' :
                  paymentMethod === 'Wire' ?
                  'Wire transfers are processed same-day but incur higher fees.' :
                  'Check payments are processed manually and may take 5-7 business days.'
                }
              </p>
            </div>
            <div className="flex justify-end pt-4 space-x-2">
              <button type="button" onClick={() => setIsNewInvoiceModalOpen(false)} className="bg-sov-dark-alt border border-gray-600 text-sov-light font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors">Cancel</button>
              <button type="submit" className="bg-sov-accent text-sov-dark font-bold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors">Enter Bill</button>
            </div>
        </form>
      </Modal>

      <Modal isOpen={isVendorModalOpen} onClose={() => setIsVendorModalOpen(false)} title="Vendor Management">
        <div className="space-y-4">
          <div className="bg-sov-dark p-4 rounded-lg border border-gray-600">
            <h4 className="text-lg font-semibold text-sov-light mb-3">Vendor ACH Setup</h4>
            <p className="text-sm text-sov-light-alt mb-3">
              Add or update vendor bank account information to enable ACH payments.
            </p>
            {vendors.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {vendors.map(vendor => (
                  <div key={vendor.id} className="flex items-center justify-between p-3 bg-sov-dark-alt rounded-lg border border-gray-600">
                    <div>
                      <p className="font-semibold text-sov-light">{vendor.name}</p>
                      <p className="text-sm text-sov-light-alt">{vendor.email}</p>
                      <p className="text-xs text-sov-light-alt">
                        {vendor.bankAccountNumber && vendor.bankRoutingNumber ? 
                          `ACH Enabled - ****${vendor.bankAccountNumber.slice(-4)}` :
                          'ACH Not Setup'
                        }
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      {!vendor.bankAccountNumber && !vendor.bankRoutingNumber && (
                        <button 
                          onClick={() => onSetupDirectDeposit?.(vendor)}
                          className="bg-sov-accent/20 text-sov-accent text-xs font-bold py-1 px-3 rounded hover:bg-sov-accent/30 transition-colors"
                        >
                          Setup ACH
                        </button>
                      )}
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        vendor.status === 'Active' ? 'bg-sov-green/20 text-sov-green' : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {vendor.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sov-light-alt text-center py-4">No vendors found. Create bills with vendors to see them here.</p>
            )}
          </div>
          <div className="bg-sov-dark p-4 rounded-lg border border-gray-600">
            <h4 className="text-lg font-semibold text-sov-light mb-3">ACH Payment Benefits</h4>
            <ul className="text-sm text-sov-light-alt space-y-2">
              <li className="flex items-center">
                <span className="text-sov-accent mr-2">✓</span>
                Lower transaction fees compared to wire transfers
              </li>
              <li className="flex items-center">
                <span className="text-sov-accent mr-2">✓</span>
                Automatic payment scheduling and processing
              </li>
              <li className="flex items-center">
                <span className="text-sov-accent mr-2">✓</span>
                Electronic payment confirmation and tracking
              </li>
              <li className="flex items-center">
                <span className="text-sov-accent mr-2">✓</span>
                Reduced administrative overhead
              </li>
            </ul>
          </div>
          <div className="flex justify-end">
            <button 
              onClick={() => setIsVendorModalOpen(false)}
              className="bg-sov-dark-alt border border-gray-600 text-sov-light font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

    </>
  );
};
