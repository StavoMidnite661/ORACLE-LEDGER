
import React, { useState, useMemo } from 'react';
import { KpiCard } from '../components/shared/KpiCard';
import { analyzeFinancials } from '../services/geminiService';
import type { JournalEntry, PurchaseOrder, Invoice, StripeCustomer, AchPayment, DirectDepositPayout } from '../types';
import { CHART_OF_ACCOUNTS } from '../constants';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Modal } from '../components/shared/Modal';

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
    directDepositPayouts = []
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);

  const financialMetrics = useMemo(() => {
    let totalCash = 0;
    let totalAR = 0;
    let totalAP = 0;

    journalEntries.forEach(entry => {
        entry.lines.forEach(line => {
            switch(line.accountId) {
                case 1000: // Cash-ODFI-LLC
                    totalCash += (line.type === 'DEBIT' ? line.amount : -line.amount);
                    break;
                case 1300: // AR
                    totalAR += (line.type === 'DEBIT' ? line.amount : -line.amount);
                    break;
                case 2300: // AP
                    totalAP += (line.type === 'CREDIT' ? line.amount : -line.amount);
                    break;
                default:
                    break;
            }
        });
    });

    return { totalCash, totalAR, totalAP };
  }, [journalEntries]);

  const chartData = useMemo(() => {
    if (journalEntries.length === 0) return [];

    const aggregatedData: { [date: string]: { cash: number; expenses: number } } = {};

    journalEntries.forEach(entry => {
        const date = entry.date;
        if (!aggregatedData[date]) {
            aggregatedData[date] = { cash: 0, expenses: 0 };
        }

        entry.lines.forEach(line => {
            if (line.accountId === 1000) { // Cash
                aggregatedData[date].cash += (line.type === 'DEBIT' ? line.amount : -line.amount);
            }
            // Expense accounts are in the 6000s
            if (line.accountId >= 6000 && line.accountId < 7000 && line.type === 'DEBIT') {
                aggregatedData[date].expenses += line.amount;
            }
        });
    });
    
    // Convert to array and sort by date
    return Object.keys( aggregatedData)
        .map(date => ({
            name: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            cash: aggregatedData[date].cash,
            expenses: aggregatedData[date].expenses,
        }))
        .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());

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
      .filter(entry => entry.lines.some(line => line.accountId === 1010)) // 1010: Cash-Vault-USDC
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
      .slice(0, 5); // show latest 5
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

    if (filename.includes('journal-entries')) {
        processedData = data.map((entry: JournalEntry) => {
            const debit = entry.lines.find(l => l.type === 'DEBIT');
            const credit = entry.lines.find(l => l.type === 'CREDIT');
            return {
                id: entry.id,
                date: entry.date,
                description: entry.description,
                source: entry.source,
                status: entry.status,
                debit_account_id: debit?.accountId,
                debit_amount: debit?.amount,
                credit_account_id: credit?.accountId,
                credit_amount: credit?.amount
            };
        });
    } else if (filename.includes('purchase-orders')) {
        processedData = data.map((po: PurchaseOrder) => ({
            ...po,
            items: JSON.stringify(po.items),
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <KpiCard title="Total Cash" value={`$${financialMetrics.totalCash.toLocaleString()}`} icon={<CashIcon />} />
        <KpiCard title="Accounts Receivable" value={`$${financialMetrics.totalAR.toLocaleString()}`} icon={<ARIcon />} />
        <KpiCard title="Accounts Payable" value={`$${financialMetrics.totalAP.toLocaleString()}`} icon={<APIcon />} />
        <KpiCard title="Stripe ACH Volume" value={`$${stripeMetrics.totalAchVolume.toLocaleString()}`} icon={<StripeIcon />} />
        <div className="relative">
             <KpiCard title="Intercompany Payable" value={`$${intercompanyPayableBalance.toLocaleString()}`} icon={<IntercompanyIcon />} />
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

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
          <h3 className="text-xl font-semibold mb-4 text-sov-light">Cash Flow vs Expenses</h3>
           {journalEntries.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-sov-light-alt">
                    Post journal entries to see a cash flow analysis.
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }} />
                    <Legend />
                    <Line type="monotone" dataKey="cash" name="Cash Movement" stroke="#2dd4bf" activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#f87171" />
                    </LineChart>
                </ResponsiveContainer>
            )}
        </div>
        <div className="lg:col-span-2 bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
           <div className="flex justify-between items-center mb-4">
             <h3 className="text-xl font-semibold text-sov-light">AI Financial Analysis</h3>
             <button
               onClick={handleAnalyze}
               disabled={isAnalyzing}
               className="bg-sov-accent text-sov-dark font-bold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors disabled:bg-gray-500"
             >
               {isAnalyzing ? 'Analyzing...' : 'Analyze'}
             </button>
           </div>
           <p className="text-sov-light-alt">
             Leverage ORACLE-LEDGER's AI capabilities to get real-time insights and strategic recommendations based on your latest financial data.
           </p>
           <div className="mt-4 p-4 bg-sov-dark rounded-lg h-48 overflow-y-auto">
             <p className="text-sm text-sov-light whitespace-pre-wrap">{analysisResult || "Click 'Analyze' to generate a financial summary."}</p>
           </div>
        </div>
      </div>

      <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
        <h3 className="text-xl font-semibold mb-4 text-sov-light">SOVRCVLT Token Activity</h3>
        {tokenTransactions.length > 0 ? (
          <ul className="space-y-4">
            {tokenTransactions.map(tx => (
              <li key={tx.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-sov-dark transition-colors">
                <div className="flex items-center">
                  <div className={`p-2 rounded-full mr-4 ${tx.type === 'Burn' ? 'bg-sov-red/20 text-sov-red' : 'bg-sov-green/20 text-sov-green'}`}>
                    {tx.type === 'Burn' ? <BurnIcon /> : <MintIcon />}
                  </div>
                  <div>
                    <p className="font-semibold text-sov-light">{tx.description}</p>
                    <p className="text-sm text-sov-light-alt">{tx.date}</p>
                  </div>
                </div>
                <div className="text-right">
                    <p className={`font-mono font-semibold ${tx.type === 'Burn' ? 'text-sov-red' : 'text-sov-green'}`}>
                        {tx.type === 'Burn' ? '-' : '+'}${tx.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-sov-light-alt">{tx.type}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sov-light-alt text-center py-4">No SOVRCVLT token transactions found in recent journal entries.</p>
        )}
      </div>

      {/* Banking Reconciliation Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-sov-light">Stripe Reconciliation</h3>
            <ReconciliationIcon />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sov-light-alt">Matched Transactions</span>
              <span className="text-sov-green font-semibold">{stripeMetrics.matchedTransactions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sov-light-alt">Unreconciled Payments</span>
              <span className={`font-semibold ${stripeMetrics.unreconciledPayments > 0 ? 'text-sov-red' : 'text-sov-green'}`}>
                {stripeMetrics.unreconciledPayments}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sov-light-alt">Active Stripe Customers</span>
              <span className="text-sov-accent font-semibold">{stripeMetrics.activeCustomers}</span>
            </div>
          </div>
        </div>

        <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-sov-light">ACH Returns</h3>
            <ReturnIcon />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sov-light-alt">Total Returns</span>
              <span className={`font-semibold ${stripeMetrics.achReturns > 0 ? 'text-sov-red' : 'text-sov-green'}`}>
                {stripeMetrics.achReturns}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sov-light-alt">ACH Volume (Succeeded)</span>
              <span className="text-sov-green font-semibold">${stripeMetrics.totalAchVolume.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sov-light-alt">Processing Status</span>
              <span className="text-sov-gold font-semibold">
                {stripeMetrics.achReturns === 0 ? 'Healthy' : 'Attention Required'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-sov-light">Direct Deposit Payouts</h3>
            <PayoutIcon />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sov-light-alt">Pending Payouts</span>
              <span className={`font-semibold ${stripeMetrics.pendingPayouts > 0 ? 'text-sov-gold' : 'text-sov-green'}`}>
                {stripeMetrics.pendingPayouts}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sov-light-alt">Total Volume (Paid)</span>
              <span className="text-sov-accent font-semibold">${stripeMetrics.totalDirectDepositVolume.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sov-light-alt">Payout Status</span>
              <span className="text-sov-green font-semibold">
                {stripeMetrics.pendingPayouts === 0 ? 'All Clear' : 'Processing'}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
        <h3 className="text-xl font-semibold mb-4 text-sov-light">Financial Reports</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button onClick={() => downloadCSV(journalEntries, 'journal-entries.csv')} className="bg-sov-accent/10 text-sov-accent font-bold py-3 px-4 rounded-lg hover:bg-sov-accent/20 transition-colors w-full">Download Journal Entries</button>
            <button onClick={() => downloadCSV(purchaseOrders, 'purchase-orders.csv')} className="bg-sov-accent/10 text-sov-accent font-bold py-3 px-4 rounded-lg hover:bg-sov-accent/20 transition-colors w-full">Download Purchase Orders</button>
            <button onClick={() => downloadCSV(arInvoices, 'ar-invoices.csv')} className="bg-sov-accent/10 text-sov-accent font-bold py-3 px-4 rounded-lg hover:bg-sov-accent/20 transition-colors w-full">Download AR Invoices</button>
            <button onClick={() => downloadCSV(apInvoices, 'ap-invoices.csv')} className="bg-sov-accent/10 text-sov-accent font-bold py-3 px-4 rounded-lg hover:bg-sov-accent/20 transition-colors w-full">Download AP Invoices</button>
        </div>
      </div>

      <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
        <h3 className="text-xl font-semibold mb-4 text-sov-light">Recent Journal Entries</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="p-3">Date</th>
                <th className="p-3">Description</th>
                <th className="p-3 text-right">Debit</th>
                <th className="p-3 text-right">Credit</th>
              </tr>
            </thead>
            <tbody>
              {journalEntries.slice(0, 5).map(entry => {
                const debit = entry.lines.find(l => l.type === 'DEBIT');
                const credit = entry.lines.find(l => l.type === 'CREDIT');
                return (
                  <tr key={entry.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-3">{entry.date}</td>
                    <td className="p-3">{entry.description}</td>
                    <td className="p-3 text-right">
                        <div>{getAccountName(debit!.accountId)}</div>
                        <div className="text-sm text-sov-green">${debit!.amount.toLocaleString()}</div>
                    </td>
                    <td className="p-3 text-right">
                        <div>{getAccountName(credit!.accountId)}</div>
                        <div className="text-sm text-sov-red">${credit!.amount.toLocaleString()}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isAnalysisModalOpen} onClose={() => setIsAnalysisModalOpen(false)} title="AI Financial Analysis">
          {isAnalyzing && <div className="text-center p-8"><p>ORACLE-LEDGER is processing financial data...</p></div>}
          {!isAnalyzing && analysisResult && (
              <div className="p-4 bg-sov-dark rounded-lg max-h-96 overflow-y-auto">
                  <pre className="text-sm text-sov-light whitespace-pre-wrap font-mono">{analysisResult}</pre>
              </div>
          )}
      </Modal>

      <Modal isOpen={isSettleModalOpen} onClose={() => setIsSettleModalOpen(false)} title="Settle Intercompany Balance">
        <div className="text-sov-light space-y-4">
            <p>You are about to settle the intercompany payable balance of <strong className="text-sov-gold">${intercompanyPayableBalance.toLocaleString()}</strong>.</p>
            <p>This will create a journal entry to debit <strong className="text-sov-light-alt">2200-Intercompany-Payable-LLC</strong> and credit <strong className="text-sov-light-alt">1200-Intercompany-Receivable-Trust</strong>, netting the balances to zero.</p>
            <div className="flex justify-end pt-4 space-x-2">
                <button type="button" onClick={() => setIsSettleModalOpen(false)} className="bg-sov-dark-alt border border-gray-600 text-sov-light font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors">Cancel</button>
                <button onClick={handleSettle} className="bg-sov-accent text-sov-dark font-bold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors">Confirm Settlement</button>
            </div>
        </div>
      </Modal>

    </div>
  );
};

const CashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>;
const ARIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const APIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l-4-4 4-4m6 8l4-4-4-4" /></svg>;
const IntercompanyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h.01M12 7h.01M16 7h.01M9 17h6M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const StripeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
const BurnIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7.014A8.003 8.003 0 0122 12c0 3.771-2.502 7-6 7-1.238 0-2.403-.388-3.343-1.343z" /></svg>;
const MintIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ReconciliationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-sov-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ReturnIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-sov-red" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const PayoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-sov-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>;
