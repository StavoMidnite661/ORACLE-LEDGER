
import React, { useState, useMemo } from 'react';
import { KpiCard } from '../components/shared/KpiCard.js';
import { analyzeFinancials } from '../services/geminiService.js';
import type { JournalEntry, PurchaseOrder, Invoice, StripeCustomer, AchPayment, DirectDepositPayout, Vendor, ConsulCreditsStats } from '../types.js';
import { CHART_OF_ACCOUNTS } from '../constants.js';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Modal } from '../components/shared/Modal.js';
import { ModalButton, ModalSection } from '../components/shared/ModalElements.js';

import { 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  CreditCard, 
  Split,
  Flame,
  PlusCircle,
  ShieldCheck,
  History,
  ExternalLink,
  Coins
} from 'lucide-react';

const CashIcon = () => <DollarSign />;
const ARIcon = () => <ArrowUpRight />;
const APIcon = () => <ArrowDownRight />;
const IntercompanyIcon = () => <Split />;
const StripeIcon = () => <CreditCard />;
const BurnIcon = () => <Flame />;
const MintIcon = () => <PlusCircle />;
const ReconciliationIcon = () => <ShieldCheck />;
const ReturnIcon = () => <History />;
const PayoutIcon = () => <ExternalLink />;
const CoinsIcon = () => <Coins />;

interface DashboardViewProps {
    journalEntries: JournalEntry[];
    purchaseOrders: PurchaseOrder[];
    arInvoices: Invoice[];
    apInvoices: Invoice[];
    addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'date'>) => void;
    intercompanyPayableBalance: number;
    stripeCustomers?: StripeCustomer[];
    achPayments?: AchPayment[];
    directDepositPayouts?: DirectDepositPayout[];
    vendors?: Vendor[];
    consulCreditsStats?: ConsulCreditsStats | null;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
    journalEntries, 
    purchaseOrders, 
    arInvoices, 
    apInvoices, 
    addJournalEntry, 
    intercompanyPayableBalance,
    stripeCustomers = [],
    achPayments = [],
    directDepositPayouts = [],
    vendors = [],
    consulCreditsStats = null
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [vendorFilter, setVendorFilter] = useState('');

  // 📊 Metrics Calculation: Reality Sync
  const financialMetrics = useMemo(() => {
    const totalCash = journalEntries.reduce((sum, entry) => {
      return sum + entry.lines.reduce((lSum, line) => {
        if ([1000, 1010, 1050, 1060].includes(line.accountId)) {
          return lSum + (line.type === 'DEBIT' ? line.amount : -line.amount);
        }
        return lSum;
      }, 0);
    }, 0);

    const totalAR = arInvoices
      .filter(inv => inv.status !== 'Paid')
      .reduce((sum, inv) => sum + inv.amount, 0);

    const totalAP = apInvoices
      .filter(inv => inv.status !== 'Paid')
      .reduce((sum, inv) => sum + inv.amount, 0);

    return { totalCash, totalAR, totalAP };
  }, [journalEntries, arInvoices, apInvoices]);

  // 📈 Chart Data: Multi-Account Liquidity (Monthly Aggregation)
  const chartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const aggregatedData = months.map(name => ({ name, cash: 0, expenses: 0 }));

    journalEntries.forEach(entry => {
      const date = new Date(entry.date);
      // Ensure we only process entries for the current fiscal year (if applicable) or all entries grouped by month index
      const monthIndex = date.getMonth();
      
      if (monthIndex >= 0 && monthIndex < 12) {
        entry.lines.forEach(line => {
          if ([1000, 1010, 1050, 1060].includes(line.accountId)) {
            aggregatedData[monthIndex].cash += (line.type === 'DEBIT' ? line.amount : -line.amount);
          } else if (line.accountId >= 6000 && line.accountId < 7000 && line.type === 'DEBIT') {
            aggregatedData[monthIndex].expenses += line.amount;
          }
        });
      }
    });

    let runningCash = 0;
    return aggregatedData.map(data => {
      runningCash += data.cash;
      return {
        ...data,
        cash: runningCash,
        // If we want to hide future months where both cash and expenses are zero (and no previous cash), 
        // we could filter, but user asked for "months of the year" specifically.
      };
    });
  }, [journalEntries]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysisResult('');
    setIsAnalysisModalOpen(true);
    const result = await analyzeFinancials(journalEntries);
    setAnalysisResult(result);
    setIsAnalyzing(false);
  };
  
  const getAccountName = (id: number) => CHART_OF_ACCOUNTS.find(acc => acc.id === id)?.name || 'Unknown Account';

  const tokenTransactions = useMemo(() => {
    return journalEntries
      .filter(entry => entry.lines.some(line => line.accountId === 1010))
      .map(entry => {
        const tokenLine = entry.lines.find(line => line.accountId === 1010)!;
        return {
          id: entry.id,
          date: entry.date,
          description: entry.description,
          amount: tokenLine.amount,
          type: tokenLine.type === 'CREDIT' ? 'Burn' : 'Mint',
        };
      })
      .slice(0, 5);
  }, [journalEntries]);

  const handleSettle = () => {
      if (intercompanyPayableBalance <= 0) return;
      addJournalEntry({
          description: 'Netting of Intercompany Balances',
          source: 'INTERCOMPANY',
          status: 'Posted',
          lines: [
              { accountId: 2200, type: 'DEBIT', amount: intercompanyPayableBalance },
              { accountId: 1200, type: 'CREDIT', amount: intercompanyPayableBalance },
          ]
      });
      setIsSettleModalOpen(false);
  }
  
  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      alert("No data available to download.");
      return;
    }

    let processedData = [...data]; // Create a mutable copy

    // Apply vendor filtering if applicable
    if (vendorFilter.trim()) {
        const filterLower = vendorFilter.toLowerCase();
        processedData = processedData.filter(item => {
            // Check descriptions OR linked vendor name in journal entries
            if (filename.includes('journal-entries')) {
                const vendorMatch = item.vendorId ? vendors.find(v => v.id === item.vendorId)?.name.toLowerCase().includes(filterLower) : false;
                return item.description.toLowerCase().includes(filterLower) || vendorMatch;
            }
            // Check vendor name in POs
            if (filename.includes('purchase-orders')) {
                return (item.vendor || '').toLowerCase().includes(filterLower);
            }
            // Check counterparty in invoices
            if (filename.includes('invoices')) {
                return (item.counterparty || '').toLowerCase().includes(filterLower);
            }
            return true;
        });
    }

    if (filename.includes('journal-entries')) {
        processedData = processedData.map((entry: JournalEntry) => {
            const debit = entry.lines.find(l => l.type === 'DEBIT');
            const credit = entry.lines.find(l => l.type === 'CREDIT');
            const vendor = entry.vendorId ? vendors.find(v => v.id === entry.vendorId) : null;
            return {
                id: entry.id,
                date: entry.date,
                description: entry.description,
                source: entry.source,
                status: entry.status,
                vendor_name: vendor ? vendor.name : 'N/A',
                debit_account: `${debit?.accountId} - ${getAccountName(debit?.accountId || 0)}`,
                debit_amount: debit?.amount,
                credit_account: `${credit?.accountId} - ${getAccountName(credit?.accountId || 0)}`,
                credit_amount: credit?.amount
            };
        });
    } else if (filename.includes('purchase-orders')) {
        processedData = processedData.map((po: PurchaseOrder) => ({
            id: po.id,
            vendor: po.vendor,
            date: po.date,
            total_amount: po.totalAmount,
            status: po.status,
            items: po.items.map(i => `${i.description} ($${i.amount})`).join(' | ')
        }));
    } else if (filename.includes('invoices')) {
        processedData = processedData.map((inv: Invoice) => ({
            id: inv.id,
            type: inv.type,
            counterparty: inv.counterparty,
            issue_date: inv.issueDate,
            due_date: inv.dueDate,
            amount: inv.amount,
            status: inv.status
        }));
    }

    if (processedData.length === 0) {
        alert("No data to process for the report.");
        return;
    }

    const headers = Object.keys(processedData[0]);
    const csvContent = [
        headers.join(','),
        ...processedData.map(row => 
            headers.map(header => {
                let cell = (row as any)[header];
                if (cell === null || cell === undefined) {
                    cell = '';
                }
                const strCell = String(cell).replace(/"/g, '""');
                return `"${strCell}"`;
            }).join(',')
        )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate Stripe metrics and banking reconciliation data
  const stripeMetrics = useMemo(() => {
    const totalAchVolume = achPayments
      .filter(payment => payment.status === 'succeeded')
      .reduce((sum, payment) => sum + payment.amountCents / 100, 0);

    const totalDirectDepositVolume = directDepositPayouts
      .filter(payout => payout.status === 'paid')
      .reduce((sum, payout) => sum + payout.amountCents / 100, 0);

    const activeCustomers = stripeCustomers.filter(customer => customer.active).length;

    // Banking reconciliation metrics
    const unreconciledPayments = achPayments.filter(payment => 
      payment.status === 'succeeded' && !payment.journalEntryId
    ).length;

    const achReturns = achPayments.filter(payment => 
      payment.status === 'failed' && payment.returnCode
    ).length;

    const pendingPayouts = directDepositPayouts.filter(payout => 
      payout.status === 'pending' || payout.status === 'in_transit'
    ).length;

    const matchedTransactions = journalEntries.filter(entry => 
      entry.source === 'PAYMENT' || entry.source === 'NACHA'
    ).length;

    return {
      totalAchVolume,
      totalDirectDepositVolume,
      activeCustomers,
      unreconciledPayments,
      achReturns,
      pendingPayouts,
      matchedTransactions,
    };
  }, [stripeCustomers, achPayments, directDepositPayouts, journalEntries]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6">
        <KpiCard title="Total Cash" value={`$${financialMetrics.totalCash.toLocaleString()}`} change="12.5%" changeType="increase" icon={<CashIcon />} />
        <KpiCard title="Accounts Receivable" value={`$${financialMetrics.totalAR.toLocaleString()}`} change="0.0%" icon={<ARIcon />} />
        <KpiCard title="Accounts Payable" value={`$${financialMetrics.totalAP.toLocaleString()}`} change="5.2%" changeType="decrease" icon={<APIcon />} />
        <KpiCard title="Consul Credits Issued" value={consulCreditsStats ? `$${Number(consulCreditsStats.totalSupply).toLocaleString()}` : '$0'} change={consulCreditsStats ? "Live" : "Inactive"} changeType={consulCreditsStats ? "increase" : "neutral"} icon={<CoinsIcon />} />
        <div className="relative">
             <KpiCard title="Intercompany Payable" value={`$${intercompanyPayableBalance.toLocaleString()}`} change="Stable" icon={<IntercompanyIcon />} />
             {intercompanyPayableBalance > 0 && (
                <button 
                    onClick={() => setIsSettleModalOpen(true)}
                    className="absolute top-4 right-4 bg-sov-gold text-sov-dark font-bold text-xs py-1 px-3 rounded-full hover:bg-yellow-400 transition-colors"
                >
                    Settle
                </button>
             )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
        <div className="lg:col-span-3 p-4 sm:p-6 rounded-2xl glass-panel relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-sov-accent/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
          <div className="flex justify-between items-center mb-6 relative z-10">
            <div>
              <h3 className="text-xl font-black tracking-tighter text-sov-light uppercase">Cash Flow vs Expenses</h3>
              <p className="text-[10px] text-sov-light-alt font-black tracking-widest uppercase opacity-60">Real-time Liquidity Analysis</p>
            </div>
          </div>
          
           {journalEntries.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-sov-light-alt bg-black/20 rounded-xl border border-dashed border-white/10">
                    <p className="text-xs font-mono uppercase tracking-widest">Post journal entries to initialize analysis</p>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={window.innerWidth < 640 ? 200 : 300}>
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f87171" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 700 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 700 }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-sov-dark/90 border border-white/10 p-4 rounded-xl shadow-2xl backdrop-blur-md">
                              <p className="text-[10px] font-black text-sov-light-alt uppercase tracking-widest mb-3 border-b border-white/5 pb-2">{label}</p>
                              <div className="space-y-2">
                                {payload.map((entry: any, index: number) => (
                                  <div key={index} className="flex items-center justify-between gap-8">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                      <span className="text-[10px] font-bold text-sov-light uppercase">{entry.name}</span>
                                    </div>
                                    <span className="text-[11px] font-black text-sov-light">${entry.value.toLocaleString()}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend 
                      verticalAlign="top" 
                      align="right" 
                      iconType="circle"
                      content={({ payload }) => (
                        <div className="flex justify-end gap-4 mb-4">
                          {payload?.map((entry: any, index: number) => (
                            <div key={index} className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                              <span className="text-[9px] font-black text-sov-light-alt uppercase tracking-widest">{entry.value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="cash" 
                      name="Liquidity" 
                      stroke="#2dd4bf" 
                      fill="url(#colorCash)"
                      strokeWidth={3}
                      activeDot={{ r: 6, stroke: '#2dd4bf', strokeWidth: 2, fill: '#0B0F1A' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="expenses" 
                      name="Expenses" 
                      stroke="#f87171" 
                      fill="url(#colorExpenses)"
                      strokeWidth={3}
                      activeDot={{ r: 6, stroke: '#f87171', strokeWidth: 2, fill: '#0B0F1A' }}
                    />
                    </AreaChart>
                </ResponsiveContainer>
            )}
        </div>
        <div className="lg:col-span-2 p-4 sm:p-6 rounded-2xl glass-panel relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-sov-primary/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>
           <div className="flex justify-between items-center mb-4 relative z-10">
             <h3 className="text-xl font-bold font-mono tracking-tighter text-sov-light flex items-center gap-2">
                <span className="text-sov-accent">AI</span> Analysis
             </h3>
             <button
               onClick={handleAnalyze}
               disabled={isAnalyzing}
               className="bg-sov-accent/10 border border-sov-accent/20 text-sov-accent font-bold text-xs py-2 px-4 rounded-lg hover:bg-sov-accent/20 transition-all uppercase tracking-widest disabled:opacity-50"
             >
               {isAnalyzing ? 'Thinking...' : 'Analyze'}
             </button>
           </div>
           
           <div className="mt-4 p-4 bg-black/30 rounded-lg h-48 overflow-y-auto border border-white/5 custom-scrollbar relative z-10">
             <p className="text-sm text-sov-light-alt whitespace-pre-wrap leading-relaxed">{analysisResult || "Initialize neural link to generate financial insights..."}</p>
           </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 rounded-2xl glass-panel relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-sov-purple/5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>
        <h3 className="text-lg sm:text-xl font-black tracking-tighter mb-4 text-sov-light uppercase flex items-center gap-2 relative z-10">
            SOVRCVLT Token Activity
            <span className="text-[10px] font-mono text-sov-light-alt opacity-50 font-normal">LIVE FEED</span>
        </h3>
        {tokenTransactions.length > 0 ? (
          <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar relative z-10">
            <ul className="space-y-3">
              {tokenTransactions.map(tx => (
                <li key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg mr-4 ${tx.type === 'Burn' ? 'bg-sov-red/10 text-sov-red' : 'bg-sov-green/10 text-sov-green'}`}>
                      {tx.type === 'Burn' ? <BurnIcon size={18} /> : <MintIcon size={18} />}
                    </div>
                    <div>
                      <p className="font-bold text-sov-light text-sm">{tx.description}</p>
                      <p className="text-xs text-sov-light-alt opacity-70">{tx.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                      <p className={`font-mono font-bold ${tx.type === 'Burn' ? 'text-sov-red' : 'text-sov-green'}`}>
                          {tx.type === 'Burn' ? '-' : '+'}${tx.amount.toLocaleString()}
                      </p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-sov-light-alt opacity-50">{tx.type}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sov-light-alt text-center py-8 opacity-50 relative z-10">No recent token activity found.</p>
        )}
      </div>

      {/* Banking Reconciliation Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="p-4 sm:p-6 rounded-2xl glass-panel border border-white/5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-sov-light-alt">Stripe Reconciliation</h3>
            <ReconciliationIcon className="text-sov-light-alt opacity-50" size={18} />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
              <span className="text-sm text-sov-light font-medium">Matched</span>
              <span className="text-sov-green font-bold font-mono">{stripeMetrics.matchedTransactions}</span>
            </div>
            <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
              <span className="text-sm text-sov-light font-medium">Unreconciled</span>
              <span className={`font-bold font-mono ${stripeMetrics.unreconciledPayments > 0 ? 'text-sov-red' : 'text-sov-green'}`}>
                {stripeMetrics.unreconciledPayments}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 rounded-2xl glass-panel border border-white/5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-sov-light-alt">ACH Returns</h3>
            <ReturnIcon className="text-sov-light-alt opacity-50" size={18} />
          </div>
          <div className="space-y-4">
             <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
              <span className="text-sm text-sov-light font-medium">Total Returns</span>
              <span className={`font-bold font-mono ${stripeMetrics.achReturns > 0 ? 'text-sov-red' : 'text-sov-green'}`}>
                {stripeMetrics.achReturns}
              </span>
            </div>
            <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
              <span className="text-sm text-sov-light font-medium">Status</span>
              <span className={`text-xs font-black uppercase tracking-widest ${stripeMetrics.achReturns === 0 ? 'text-sov-green' : 'text-sov-gold'}`}>
                 {stripeMetrics.achReturns === 0 ? 'Healthy' : 'Check'}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 rounded-2xl glass-panel border border-white/5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-sov-light-alt">Direct Deposit</h3>
            <PayoutIcon className="text-sov-light-alt opacity-50" size={18} />
          </div>
           <div className="space-y-4">
             <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
              <span className="text-sm text-sov-light font-medium">Pending</span>
              <span className={`font-bold font-mono ${stripeMetrics.pendingPayouts > 0 ? 'text-sov-gold' : 'text-sov-green'}`}>
                {stripeMetrics.pendingPayouts}
              </span>
            </div>
            <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
              <span className="text-sm text-sov-light font-medium">Total Vol</span>
               <span className="text-sov-accent font-bold font-mono">${stripeMetrics.totalDirectDepositVolume.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4 sm:p-6 rounded-2xl glass-panel relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h3 className="text-lg sm:text-xl font-black tracking-tighter text-sov-light uppercase">Financial Reports</h3>
            <div className="relative w-full md:w-64">
                <input 
                    type="text" 
                    placeholder="Filter by Vendor..." 
                    value={vendorFilter}
                    onChange={(e) => setVendorFilter(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-sm text-sov-light focus:outline-none focus:ring-1 focus:ring-sov-accent transition-all placeholder-white/20"
                />
                {vendorFilter && (
                    <button 
                        onClick={() => setVendorFilter('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-sov-light-alt hover:text-sov-light text-xs"
                    >
                        ✕
                    </button>
                )}
            </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button onClick={() => downloadCSV(journalEntries, 'journal-entries.csv')} className="bg-white/5 border border-white/5 text-sov-light-alt text-sm font-bold py-3 px-4 rounded-xl hover:bg-white/10 hover:text-sov-light hover:border-sov-accent/30 transition-all w-full flex items-center justify-center gap-2">Journal Entries</button>
            <button onClick={() => downloadCSV(purchaseOrders, 'purchase-orders.csv')} className="bg-white/5 border border-white/5 text-sov-light-alt text-sm font-bold py-3 px-4 rounded-xl hover:bg-white/10 hover:text-sov-light hover:border-sov-accent/30 transition-all w-full flex items-center justify-center gap-2">Purchase Orders</button>
            <button onClick={() => downloadCSV(arInvoices, 'ar-invoices.csv')} className="bg-white/5 border border-white/5 text-sov-light-alt text-sm font-bold py-3 px-4 rounded-xl hover:bg-white/10 hover:text-sov-light hover:border-sov-accent/30 transition-all w-full flex items-center justify-center gap-2">AR Invoices</button>
            <button onClick={() => downloadCSV(apInvoices, 'ap-invoices.csv')} className="bg-white/5 border border-white/5 text-sov-light-alt text-sm font-bold py-3 px-4 rounded-xl hover:bg-white/10 hover:text-sov-light hover:border-sov-accent/30 transition-all w-full flex items-center justify-center gap-2">AP Invoices</button>
        </div>
      </div>

      <div className="p-4 sm:p-6 rounded-2xl glass-panel relative overflow-hidden">
        <h3 className="text-lg sm:text-xl font-black tracking-tighter mb-4 text-sov-light uppercase">Recent Journal Entries</h3>
        <div className="max-h-[400px] overflow-y-auto overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="p-3 text-xs font-black uppercase tracking-widest text-sov-light-alt opacity-60">Date</th>
                <th className="p-3 text-xs font-black uppercase tracking-widest text-sov-light-alt opacity-60">Description</th>
                <th className="p-3 text-right text-xs font-black uppercase tracking-widest text-sov-light-alt opacity-60">Debit</th>
                <th className="p-3 text-right text-xs font-black uppercase tracking-widest text-sov-light-alt opacity-60">Credit</th>
              </tr>
            </thead>
            <tbody>
              {journalEntries.map(entry => {
                const debit = entry.lines.find(l => l.type === 'DEBIT');
                const credit = entry.lines.find(l => l.type === 'CREDIT');
                return (
                  <tr key={entry.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-3 text-sm font-mono text-sov-light-alt">{entry.date}</td>
                    <td className="p-3 text-sm font-medium text-sov-light">{entry.description}</td>
                    <td className="p-3 text-right">
                        <div className="text-xs text-sov-light-alt opacity-70 mb-0.5">{debit ? getAccountName(debit.accountId) : '-'}</div>
                        <div className="text-sm font-mono text-sov-green">{debit ? `$${debit.amount.toLocaleString()}` : '-'}</div>
                    </td>
                    <td className="p-3 text-right">
                        <div className="text-xs text-sov-light-alt opacity-70 mb-0.5">{credit ? getAccountName(credit.accountId) : '-'}</div>
                        <div className="text-sm font-mono text-sov-red">{credit ? `$${credit.amount.toLocaleString()}` : '-'}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isAnalysisModalOpen} onClose={() => setIsAnalysisModalOpen(false)} title="AI Financial Analysis">
          <ModalSection>
            {isAnalyzing && (
                <div className="text-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sov-accent mx-auto mb-4"></div>
                  <p className="text-sov-light-alt">ORACLE-LEDGER is processing financial data...</p>
                </div>
            )}
            {!isAnalyzing && analysisResult && (
                <div className="p-4 bg-sov-dark rounded-lg max-h-96 overflow-y-auto border border-gray-700">
                    <pre className="text-sm text-sov-light whitespace-pre-wrap font-mono leading-relaxed">{analysisResult}</pre>
                </div>
            )}
          </ModalSection>
      </Modal>

      <Modal isOpen={isSettleModalOpen} onClose={() => setIsSettleModalOpen(false)} title="Settle Intercompany Balance">
        <ModalSection>
            <div className="text-sov-light space-y-4">
                <p>You are about to settle the intercompany payable balance of <strong className="text-sov-gold">${intercompanyPayableBalance.toLocaleString()}</strong>.</p>
                <div className="bg-sov-dark p-4 rounded-lg border border-gray-600">
                    <p className="text-sm text-sov-light-alt">This will create a journal entry to:</p>
                    <ul className="list-disc list-inside text-sm text-sov-light mt-2 space-y-1">
                      <li>Debit <span className="font-mono text-sov-accent">2200-Intercompany-Payable-LLC</span></li>
                      <li>Credit <span className="font-mono text-sov-accent">1200-Intercompany-Receivable-Trust</span></li>
                    </ul>
                    <p className="text-sm text-sov-light-alt mt-2">This nets the balances to zero.</p>
                </div>
            </div>
        </ModalSection>
        <div className="flex justify-end pt-4 space-x-2">
                <ModalButton 
                    type="button" 
                    variant="secondary"
                    onClick={() => setIsSettleModalOpen(false)} 
                >
                    Cancel
                </ModalButton>
                <ModalButton 
                    variant="primary"
                    onClick={handleSettle} 
                >
                    Confirm Settlement
                </ModalButton>
        </div>
      </Modal>

    </div>
  );
};

