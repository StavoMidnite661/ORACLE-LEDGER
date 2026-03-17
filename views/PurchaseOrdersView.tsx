
import React, { useState, useMemo } from 'react';
import type { PurchaseOrder } from '../types.js';
import { Modal } from '../components/shared/Modal.js';
import { 
  ModalInput, 
  ModalButton, 
  ModalLabel, 
  ModalSection, 
  ModalField 
} from '../components/shared/ModalElements.js';

interface PurchaseOrdersViewProps {
  purchaseOrders: PurchaseOrder[];
  addPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'date'>) => void;
}

type SortableKeys = keyof PurchaseOrder;
type SortConfig = { key: SortableKeys; direction: 'ascending' | 'descending' };

const getStatusColor = (status: PurchaseOrder['status']) => {
    switch (status) {
        case 'Paid': return 'bg-sov-green/20 text-sov-green';
        case 'Approved': return 'bg-blue-500/20 text-blue-400';
        case 'Fulfilled': return 'bg-purple-500/20 text-purple-400';
        case 'Draft': return 'bg-gray-500/20 text-gray-400';
        default: return 'bg-gray-500/20 text-gray-400';
    }
};

const SortIndicator: React.FC<{ direction?: 'ascending' | 'descending' }> = ({ direction }) => (
  <span className="inline-flex flex-col text-xs ml-2 opacity-50">
    <svg className={`h-2 w-2 ${direction === 'ascending' ? 'text-sov-light opacity-100' : 'text-sov-light-alt'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M10 3l-5 5h10l-5-5z"/></svg>
    <svg className={`h-2 w-2 ${direction === 'descending' ? 'text-sov-light opacity-100' : 'text-sov-light-alt'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M10 17l5-5H5l5 5z"/></svg>
  </span>
);


export const PurchaseOrdersView: React.FC<PurchaseOrdersViewProps> = ({ purchaseOrders, addPurchaseOrder }) => {
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'date', direction: 'descending' });
  
  // New PO Form state
  const [vendor, setVendor] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [amount, setAmount] = useState<number | ''>('');

  const sortedPurchaseOrders = useMemo(() => {
    let sortableItems = [...purchaseOrders];
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
  }, [purchaseOrders, sortConfig]);

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

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    if(!vendor || !itemDesc || !amount || amount <= 0) return;

    const newPO: Omit<PurchaseOrder, 'id' | 'date'> = {
      vendor,
      items: [{ description: itemDesc, amount: +amount }],
      totalAmount: +amount,
      status: 'Draft',
    };
    addPurchaseOrder(newPO);
    setIsNewOrderModalOpen(false);
    // reset form
    setVendor('');
    setItemDesc('');
    setAmount('');
  };

  return (
    <>
      <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-sov-light">Purchase Orders</h3>
          <button 
            onClick={() => setIsNewOrderModalOpen(true)}
            className="bg-sov-accent text-sov-dark font-bold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors">
            Issue New PO
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-gray-700">
              <tr>
                <th className="p-3 cursor-pointer" onClick={() => requestSort('id')}><div className="flex items-center">PO ID <SortIndicator direction={getSortDirection('id')} /></div></th>
                <th className="p-3 cursor-pointer" onClick={() => requestSort('vendor')}><div className="flex items-center">Vendor <SortIndicator direction={getSortDirection('vendor')} /></div></th>
                <th className="p-3 cursor-pointer" onClick={() => requestSort('date')}><div className="flex items-center">Date <SortIndicator direction={getSortDirection('date')} /></div></th>
                <th className="p-3 cursor-pointer" onClick={() => requestSort('status')}><div className="flex items-center">Status <SortIndicator direction={getSortDirection('status')} /></div></th>
                <th className="p-3 text-right cursor-pointer" onClick={() => requestSort('totalAmount')}><div className="flex items-center justify-end">Total Amount <SortIndicator direction={getSortDirection('totalAmount')} /></div></th>
              </tr>
            </thead>
            <tbody>
              {sortedPurchaseOrders.map(po => (
                <tr key={po.id} onClick={() => setSelectedOrder(po)} className="border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer">
                  <td className="p-3 font-mono text-sm">{po.id}</td>
                  <td className="p-3">{po.vendor}</td>
                  <td className="p-3">{po.date}</td>
                  <td className="p-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(po.status)}`}>
                          {po.status}
                      </span>
                  </td>
                  <td className="p-3 text-right font-mono">${po.totalAmount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={!!selectedOrder} 
        onClose={() => setSelectedOrder(null)} 
        title={`Details for PO #${selectedOrder?.id}`}
        gradient="from-blue-500/20 to-blue-500/5"
      >
        {selectedOrder && (
          <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
            <div className="grid grid-cols-2 gap-6">
              <ModalSection>
                <ModalField label="Vendor" value={selectedOrder.vendor} className="mb-0" />
              </ModalSection>
              <ModalSection className="text-right">
                <ModalField label="Date" value={<span className="font-mono">{selectedOrder.date}</span>} className="mb-0" />
              </ModalSection>
            </div>
            
            <div className="grid grid-cols-2 gap-6 items-center">
               <ModalSection>
                <div className="text-[10px] uppercase tracking-wider text-sov-light-alt block mb-2">Status</div>
                <span className={`px-3 py-1.5 text-xs font-black uppercase tracking-widest rounded-lg border ${
                  selectedOrder.status === 'Paid' ? 'bg-sov-green/20 text-sov-green border-sov-green/30' :
                  selectedOrder.status === 'Approved' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                  selectedOrder.status === 'Fulfilled' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                  'bg-gray-500/20 text-gray-400 border-gray-500/30'
                }`}>
                  {selectedOrder.status}
                </span>
              </ModalSection>
              <ModalSection className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-sov-light-alt block mb-1">Total Amount</div>
                <p className="font-mono text-2xl font-bold text-sov-accent">${selectedOrder.totalAmount.toLocaleString()}</p>
              </ModalSection>
            </div>

            <div className="border-t border-white/5 pt-6">
              <h4 className="text-sm font-bold text-sov-light-alt uppercase tracking-wider mb-4 px-2">Line Items</h4>
              <div className="bg-sov-dark-alt/50 rounded-2xl border border-white/5 overflow-hidden">
                <ul className="divide-y divide-white/5">
                  {selectedOrder.items.map((item, index) => (
                    <li key={index} className="flex justify-between items-center p-4 hover:bg-white/5 transition-colors">
                      <span className="text-sov-light font-medium">{item.description}</span>
                      <span className="font-mono font-bold text-sov-light">${item.amount.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </Modal>
 
      <Modal 
        isOpen={isNewOrderModalOpen} 
        onClose={() => setIsNewOrderModalOpen(false)} 
        title="Issue New Purchase Order"
        gradient="from-blue-500/20 to-blue-500/5"
      >
         <form onSubmit={handleCreatePO} className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
         <ModalSection>
            <div className="space-y-4">
            <div className="space-y-2">
              <ModalLabel htmlFor="vendor">Vendor</ModalLabel>
              <ModalInput 
                type="text" 
                id="vendor" 
                value={vendor} 
                onChange={e => setVendor(e.target.value)} 
                required 
                placeholder="Vendor Name"
              />
            </div>
            
            <div className="space-y-2">
              <ModalLabel htmlFor="itemDesc">Item Description</ModalLabel>
              <ModalInput 
                type="text" 
                id="itemDesc" 
                value={itemDesc} 
                onChange={e => setItemDesc(e.target.value)} 
                required 
                placeholder="Product or Service Details"
              />
            </div>
            
            <div className="space-y-2">
              <ModalLabel htmlFor="amount">Amount</ModalLabel>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">$</span>
                <ModalInput 
                  type="number" 
                  id="amount" 
                  value={amount} 
                  onChange={e => setAmount(e.target.valueAsNumber || '')} 
                  min="0.01" 
                  step="0.01" 
                  required 
                  className="pl-8"
                  placeholder="0.00"
                />
              </div>
            </div>
            </div>
          </ModalSection>

            <div className="flex justify-end pt-4 space-x-4">
              <ModalButton 
                type="button" 
                variant="secondary"
                onClick={() => setIsNewOrderModalOpen(false)} 
              >
                Cancel
              </ModalButton>
              <ModalButton 
                type="submit" 
                variant="primary"
              >
                Issue PO
              </ModalButton>
            </div>
        </form>
      </Modal>

    </>
  );
};
