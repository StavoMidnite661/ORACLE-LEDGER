
import React, { useState, useMemo } from 'react';
import type { Invoice, JournalEntry } from '../types';
import { Modal } from '../components/shared/Modal';

interface VendorPaymentsViewProps {
  invoices: Invoice[];
  updateInvoiceStatus: (invoiceId: string, status: Invoice['status']) => void;
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'date'>) => void;
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

export const VendorPaymentsView: React.FC<VendorPaymentsViewProps> = ({ invoices, updateInvoiceStatus, addJournalEntry }) => {
  const [invoiceToPay, setInvoiceToPay] = useState<Invoice | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'issueDate', direction: 'descending' });
  const [paymentAccountId, setPaymentAccountId] = useState<number>(1000); // Default to Cash-ODFI-LLC

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

  const handleRecordPayment = () => {
    if (!invoiceToPay) return;

    // 1. Update invoice status
    updateInvoiceStatus(invoiceToPay.id, 'Paid');

    // 2. Create journal entry
    addJournalEntry({
      description: `Payment for Invoice ${invoiceToPay.id} to ${invoiceToPay.counterparty}`,
      source: 'PAYMENT',
      status: 'Posted',
      lines: [
        { accountId: 2300, type: 'DEBIT', amount: invoiceToPay.amount }, // Debit AP
        { accountId: paymentAccountId, type: 'CREDIT', amount: invoiceToPay.amount }, // Credit Cash/USDC
      ],
    });

    setInvoiceToPay(null);
  };

  return (
    <>
      <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-sov-light">Vendor Payments</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-gray-700">
              <tr>
                <th className="p-3 cursor-pointer" onClick={() => requestSort('id')}><div className="flex items-center">Invoice ID <SortIndicator direction={getSortDirection('id')} /></div></th>
                <th className="p-3 cursor-pointer" onClick={() => requestSort('counterparty')}><div className="flex items-center">Vendor <SortIndicator direction={getSortDirection('counterparty')} /></div></th>
                <th className="p-3 cursor-pointer" onClick={() => requestSort('dueDate')}><div className="flex items-center">Due Date <SortIndicator direction={getSortDirection('dueDate')} /></div></th>
                <th className="p-3 cursor-pointer" onClick={() => requestSort('status')}><div className="flex items-center">Status <SortIndicator direction={getSortDirection('status')} /></div></th>
                <th className="p-3 text-right cursor-pointer" onClick={() => requestSort('amount')}><div className="flex items-center justify-end">Amount <SortIndicator direction={getSortDirection('amount')} /></div></th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedInvoices.map(inv => (
                <tr key={inv.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="p-3 font-mono text-sm">{inv.id}</td>
                  <td className="p-3">{inv.counterparty}</td>
                  <td className="p-3">{inv.dueDate}</td>
                  <td className="p-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(inv.status)}`}>
                          {inv.status}
                      </span>
                  </td>
                  <td className="p-3 text-right font-mono">${inv.amount.toLocaleString()}</td>
                  <td className="p-3 text-center">
                    {inv.status !== 'Paid' ? (
                      <button 
                        onClick={() => setInvoiceToPay(inv)}
                        className="bg-sov-accent text-sov-dark font-bold text-xs py-1 px-3 rounded-lg hover:bg-sov-accent-hover transition-colors">
                        Record Payment
                      </button>
                    ) : (
                      <span className="text-xs text-sov-light-alt">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <Modal isOpen={!!invoiceToPay} onClose={() => setInvoiceToPay(null)} title={`Record Payment for Invoice ${invoiceToPay?.id}`}>
        {invoiceToPay && (
            <div className="text-sov-light space-y-4">
                <p>You are about to record a payment of <strong className="text-sov-gold">${invoiceToPay.amount.toLocaleString()}</strong> to <strong className="text-sov-light-alt">{invoiceToPay.counterparty}</strong>.</p>
                <div>
                  <label htmlFor="paymentAccount" className="block text-sm font-medium text-sov-light-alt">Payment Account</label>
                  <select 
                    id="paymentAccount" 
                    value={paymentAccountId} 
                    onChange={e => setPaymentAccountId(Number(e.target.value))} 
                    className="mt-1 block w-full bg-sov-dark border border-gray-600 rounded-md shadow-sm py-2 px-3 text-sov-light focus:outline-none focus:ring-sov-accent focus:border-sov-accent"
                  >
                    <option value={1000}>1000 - Cash-ODFI-LLC (Fiat)</option>
                    <option value={1010}>1010 - Cash-Vault-USDC (Token)</option>
                  </select>
                </div>
                <p className="text-sm text-sov-light-alt">This will update the invoice status to 'Paid' and create a corresponding journal entry.</p>
                <div className="flex justify-end pt-4 space-x-2">
                    <button type="button" onClick={() => setInvoiceToPay(null)} className="bg-sov-dark-alt border border-gray-600 text-sov-light font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors">Cancel</button>
                    <button onClick={handleRecordPayment} className="bg-sov-accent text-sov-dark font-bold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors">Confirm Payment</button>
                </div>
            </div>
        )}
      </Modal>
    </>
  );
};