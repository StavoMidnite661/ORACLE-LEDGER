
import React, { useState, useMemo } from 'react';
import type { JournalEntry } from '../types';
import { CHART_OF_ACCOUNTS } from '../constants';
import { Modal } from '../components/shared/Modal';

interface JournalViewProps {
  journalEntries: JournalEntry[];
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'date'>) => void;
}

type SortableKeys = keyof JournalEntry | 'amount';
type SortConfig = { key: SortableKeys; direction: 'ascending' | 'descending' };

const getAccountName = (id: number) => CHART_OF_ACCOUNTS.find(acc => acc.id === id)?.name || 'Unknown Account';

const SortIndicator: React.FC<{ direction?: 'ascending' | 'descending' }> = ({ direction }) => (
  <span className="inline-flex flex-col text-xs ml-2 opacity-50">
    <svg className={`h-2 w-2 ${direction === 'ascending' ? 'text-sov-light opacity-100' : 'text-sov-light-alt'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M10 3l-5 5h10l-5-5z"/></svg>
    <svg className={`h-2 w-2 ${direction === 'descending' ? 'text-sov-light opacity-100' : 'text-sov-light-alt'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M10 17l5-5H5l5 5z"/></svg>
  </span>
);

export const JournalView: React.FC<JournalViewProps> = ({ journalEntries, addJournalEntry }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [debitAccountId, setDebitAccountId] = useState<number | ''>('');
  const [creditAccountId, setCreditAccountId] = useState<number | ''>('');
  const [amount, setAmount] = useState<number | ''>('');
  const [source, setSource] = useState<JournalEntry['source']>('PURCHASE');
  const [error, setError] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'date', direction: 'descending' });

  const sortedJournalEntries = useMemo(() => {
    let sortableItems = [...journalEntries];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const key = sortConfig.key;
        let aValue: any;
        let bValue: any;

        if (key === 'amount') {
          aValue = a.lines[0].amount;
          bValue = b.lines[0].amount;
        } else {
          aValue = a[key as keyof JournalEntry];
          bValue = b[key as keyof JournalEntry];
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [journalEntries, sortConfig]);

  const requestSort = (key: SortableKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };


  const resetForm = () => {
    setDescription('');
    setDebitAccountId('');
    setCreditAccountId('');
    setAmount('');
    setSource('PURCHASE');
    setError('');
  };

  const handlePostEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !debitAccountId || !creditAccountId || !amount || amount <= 0) {
      setError('All fields are required and amount must be positive.');
      return;
    }
    if (debitAccountId === creditAccountId) {
      setError('Debit and Credit accounts must be different.');
      return;
    }
    setError('');
    addJournalEntry({
      description,
      source,
      status: 'Posted',
      lines: [
        { accountId: debitAccountId, type: 'DEBIT', amount: +amount },
        { accountId: creditAccountId, type: 'CREDIT', amount: +amount },
      ]
    });
    setIsModalOpen(false);
    resetForm();
  };
  
  const getSortDirection = (key: SortableKeys) => {
    if (!sortConfig || sortConfig.key !== key) return undefined;
    return sortConfig.direction;
  };

  return (
    <>
      <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-sov-light">General Journal</h3>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-sov-accent text-sov-dark font-bold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors">
            Post New Entry
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-gray-700">
              <tr>
                <th className="p-3 cursor-pointer" onClick={() => requestSort('id')}>
                    <div className="flex items-center">ID <SortIndicator direction={getSortDirection('id')} /></div>
                </th>
                <th className="p-3 cursor-pointer" onClick={() => requestSort('date')}>
                    <div className="flex items-center">Date <SortIndicator direction={getSortDirection('date')} /></div>
                </th>
                <th className="p-3 cursor-pointer" onClick={() => requestSort('description')}>
                    <div className="flex items-center">Description <SortIndicator direction={getSortDirection('description')} /></div>
                </th>
                <th className="p-3 cursor-pointer" onClick={() => requestSort('source')}>
                    <div className="flex items-center">Source <SortIndicator direction={getSortDirection('source')} /></div>
                </th>
                <th className="p-3 cursor-pointer" onClick={() => requestSort('status')}>
                    <div className="flex items-center">Status <SortIndicator direction={getSortDirection('status')} /></div>
                </th>
                <th className="p-3 text-right cursor-pointer" onClick={() => requestSort('amount')}>
                    <div className="flex items-center justify-end">Amount <SortIndicator direction={getSortDirection('amount')} /></div>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedJournalEntries.map(entry => (
                <tr key={entry.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="p-3 font-mono text-sm">{entry.id}</td>
                  <td className="p-3">{entry.date}</td>
                  <td className="p-3">{entry.description}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full bg-sov-accent/20 text-sov-accent`}>
                      {entry.source}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      entry.status === 'Posted' ? 'bg-sov-green/20 text-sov-green' : 'bg-sov-gold/20 text-sov-gold'
                    }`}>
                      {entry.status}
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono">${entry.lines[0].amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Post New Journal Entry">
        <form onSubmit={handlePostEntry} className="space-y-4">
          {error && <div className="bg-sov-red/20 text-sov-red p-3 rounded-lg">{error}</div>}
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-sov-light-alt">Description</label>
            <input type="text" id="description" value={description} onChange={e => setDescription(e.target.value)} required className="mt-1 block w-full bg-sov-dark border border-gray-600 rounded-md shadow-sm py-2 px-3 text-sov-light focus:outline-none focus:ring-sov-accent focus:border-sov-accent" />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
              <label htmlFor="amount" className="block text-sm font-medium text-sov-light-alt">Amount</label>
              <input type="number" id="amount" value={amount} onChange={e => setAmount(e.target.valueAsNumber || '')} min="0.01" step="0.01" required className="mt-1 block w-full bg-sov-dark border border-gray-600 rounded-md shadow-sm py-2 px-3 text-sov-light focus:outline-none focus:ring-sov-accent focus:border-sov-accent" />
            </div>
            <div>
              <label htmlFor="source" className="block text-sm font-medium text-sov-light-alt">Source</label>
              <select id="source" value={source} onChange={e => setSource(e.target.value as JournalEntry['source'])} required className="mt-1 block w-full bg-sov-dark border border-gray-600 rounded-md shadow-sm py-2 px-3 text-sov-light focus:outline-none focus:ring-sov-accent focus:border-sov-accent">
                <option>CHAIN</option><option>NACHA</option><option>PO</option><option>AR</option><option>AP</option><option>PURCHASE</option><option>PAYROLL</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="debitAccount" className="block text-sm font-medium text-sov-light-alt">Debit Account</label>
              <select id="debitAccount" value={debitAccountId} onChange={e => setDebitAccountId(Number(e.target.value))} required className="mt-1 block w-full bg-sov-dark border border-gray-600 rounded-md shadow-sm py-2 px-3 text-sov-light focus:outline-none focus:ring-sov-accent focus:border-sov-accent">
                <option value="" disabled>Select Account</option>
                {CHART_OF_ACCOUNTS.map(acc => <option key={acc.id} value={acc.id}>{acc.id} - {acc.name}</option>)}
              </select>
            </div>
             <div>
              <label htmlFor="creditAccount" className="block text-sm font-medium text-sov-light-alt">Credit Account</label>
              <select id="creditAccount" value={creditAccountId} onChange={e => setCreditAccountId(Number(e.target.value))} required className="mt-1 block w-full bg-sov-dark border border-gray-600 rounded-md shadow-sm py-2 px-3 text-sov-light focus:outline-none focus:ring-sov-accent focus:border-sov-accent">
                <option value="" disabled>Select Account</option>
                {CHART_OF_ACCOUNTS.map(acc => <option key={acc.id} value={acc.id}>{acc.id} - {acc.name}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-4 space-x-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="bg-sov-dark-alt border border-gray-600 text-sov-light font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors">Cancel</button>
            <button type="submit" className="bg-sov-accent text-sov-dark font-bold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors">Post Entry</button>
          </div>
        </form>
      </Modal>
    </>
  );
};
