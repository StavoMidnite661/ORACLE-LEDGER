import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import type { PaymentReconciliationEntry, AchPayment, StripeWebhookEvent } from '../../types';

// Mock reconciliation data - In production, this would come from your reconciliation API
const mockReconciliationData = {
  unreconciledPayments: [
    {
      id: 'rec-001',
      stripePaymentId: 'ch_3Nx4aK2...',
      amount: 15000.00,
      type: 'ACH',
      date: '2024-11-02T14:30:00Z',
      customer: 'Acme Corporation',
      description: 'Invoice #1234 Payment',
      status: 'pending',
      daysOutstanding: 1,
      journalEntryId: null
    },
    {
      id: 'rec-002',
      stripePaymentId: 'ch_3Ny8bL3...',
      amount: 8750.50,
      type: 'Card',
      date: '2024-11-02T13:45:00Z',
      customer: 'Tech Solutions Inc',
      description: 'Monthly subscription payment',
      status: 'matched',
      daysOutstanding: 0,
      journalEntryId: 'JE-1245'
    },
    {
      id: 'rec-003',
      stripePaymentId: 'ch_3Nz2cM4...',
      amount: 25000.00,
      type: 'ACH',
      date: '2024-11-01T16:20:00Z',
      customer: 'Global Ventures LLC',
      description: 'Quarterly retainer payment',
      status: 'pending',
      daysOutstanding: 1,
      journalEntryId: null
    },
    {
      id: 'rec-004',
      stripePaymentId: 'ch_3N04dN5...',
      amount: 3200.75,
      type: 'Card',
      date: '2024-11-01T11:00:00Z',
      customer: 'StartupXYZ',
      description: 'Product purchase',
      status: 'discrepancy',
      daysOutstanding: 1,
      journalEntryId: 'JE-1247'
    },
    {
      id: 'rec-005',
      stripePaymentId: 'ch_3N15eO6...',
      amount: 18750.00,
      type: 'ACH',
      date: '2024-10-31T09:15:00Z',
      customer: 'Enterprise Corp',
      description: 'Annual subscription renewal',
      status: 'pending',
      daysOutstanding: 2,
      journalEntryId: null
    }
  ],
  autoReconciliationStatus: {
    totalTransactions: 2847,
    autoReconciled: 2634,
    requiresReview: 156,
    failedReconciliation: 57,
    autoReconciliationRate: 92.5
  },
  reconciliationTrends: [
    { date: '2024-10-27', auto: 420, manual: 89, failed: 12 },
    { date: '2024-10-28', auto: 387, manual: 103, failed: 8 },
    { date: '2024-10-29', auto: 445, manual: 76, failed: 15 },
    { date: '2024-10-30', auto: 398, manual: 92, failed: 11 },
    { date: '2024-10-31', auto: 456, manual: 84, failed: 7 },
    { date: '2024-11-01', auto: 412, manual: 98, failed: 9 },
    { date: '2024-11-02', auto: 378, manual: 87, failed: 13 }
  ],
  balanceTransactionMatching: [
    {
      id: 'btm-001',
      stripeBalanceTransactionId: 'txn_3Nx4aK2...',
      stripePaymentId: 'ch_3Nx4aK2...',
      stripeAmount: 15000.00,
      stripeFee: 127.50,
      stripeNet: 14872.50,
      ledgerAmount: 15000.00,
      ledgerFee: 125.00,
      ledgerNet: 14875.00,
      difference: -2.50,
      status: 'requires_review'
    },
    {
      id: 'btm-002',
      stripeBalanceTransactionId: 'txn_3Ny8bL3...',
      stripePaymentId: 'ch_3Ny8bL3...',
      stripeAmount: 8750.50,
      stripeFee: 253.77,
      stripeNet: 8496.73,
      ledgerAmount: 8750.50,
      ledgerFee: 253.77,
      ledgerNet: 8496.73,
      difference: 0,
      status: 'matched'
    },
    {
      id: 'btm-003',
      stripeBalanceTransactionId: 'txn_3Nz2cM4...',
      stripePaymentId: 'ch_3Nz2cM4...',
      stripeAmount: 25000.00,
      stripeFee: 212.50,
      stripeNet: 24787.50,
      ledgerAmount: 25000.00,
      ledgerFee: 212.50,
      ledgerNet: 24787.50,
      difference: 0,
      status: 'matched'
    }
  ],
  exceptions: [
    {
      id: 'exc-001',
      type: 'Amount Mismatch',
      description: 'Payment amount differs from invoice amount',
      stripeAmount: 15000.00,
      ledgerAmount: 14875.00,
      difference: -125.00,
      paymentId: 'ch_3Nx4aK2...',
      status: 'pending_review',
      assignedTo: 'Sarah Johnson',
      createdAt: '2024-11-02T14:30:00Z'
    },
    {
      id: 'exc-002',
      type: 'Missing Journal Entry',
      description: 'No corresponding journal entry found for payment',
      stripeAmount: 25000.00,
      ledgerAmount: 0,
      difference: -25000.00,
      paymentId: 'ch_3Nz2cM4...',
      status: 'needs_action',
      assignedTo: 'Mike Chen',
      createdAt: '2024-11-01T16:20:00Z'
    },
    {
      id: 'exc-003',
      type: 'Fee Calculation Error',
      description: 'Processing fee calculation differs from expected',
      stripeAmount: 3200.75,
      ledgerAmount: 3200.75,
      difference: -2.50,
      paymentId: 'ch_3N04dN5...',
      status: 'in_progress',
      assignedTo: 'David Rodriguez',
      createdAt: '2024-11-01T11:00:00Z'
    }
  ],
  reconciliationReports: [
    {
      id: 'rpt-001',
      name: 'Daily Reconciliation Summary',
      type: 'Daily',
      status: 'completed',
      transactionsProcessed: 1247,
      dateRange: '2024-11-02',
      generatedAt: '2024-11-02T23:59:00Z',
      fileUrl: '/reports/daily-rec-2024-11-02.pdf'
    },
    {
      id: 'rpt-002',
      name: 'Monthly ACH Reconciliation',
      type: 'Monthly',
      status: 'completed',
      transactionsProcessed: 3847,
      dateRange: '2024-10',
      generatedAt: '2024-11-01T02:00:00Z',
      fileUrl: '/reports/monthly-ach-2024-10.pdf'
    },
    {
      id: 'rpt-003',
      name: 'Exception Report',
      type: 'Exception',
      status: 'in_progress',
      transactionsProcessed: 45,
      dateRange: '2024-11-01 to 2024-11-02',
      generatedAt: null,
      fileUrl: null
    }
  ]
};

interface ReconciliationDashboardProps {
  className?: string;
}

export const ReconciliationDashboard: React.FC<ReconciliationDashboardProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'unreconciled' | 'auto' | 'manual' | 'reports'>('overview');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const formatCurrency = (amount: number) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'matched': return 'text-sov-green';
      case 'pending': return 'text-sov-gold';
      case 'discrepancy': return 'text-sov-red';
      case 'requires_review': return 'text-sov-gold';
      case 'needs_action': return 'text-sov-red';
      case 'in_progress': return 'text-sov-accent';
      default: return 'text-sov-light-alt';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'matched':
        return <CheckIcon className="h-4 w-4 text-sov-green" />;
      case 'pending':
        return <ClockIcon className="h-4 w-4 text-sov-gold" />;
      case 'discrepancy':
      case 'needs_action':
        return <AlertIcon className="h-4 w-4 text-sov-red" />;
      case 'requires_review':
        return <EyeIcon className="h-4 w-4 text-sov-gold" />;
      case 'in_progress':
        return <PlayIcon className="h-4 w-4 text-sov-accent" />;
      default:
        return null;
    }
  };

  const handleAutoReconcile = () => {
    console.log('Running auto-reconciliation...');
    // Implementation would trigger the auto-reconciliation process
  };

  const handleManualReconcile = (paymentId: string) => {
    console.log(`Manually reconciling payment ${paymentId}...`);
    // Implementation would open manual reconciliation interface
  };

  const exportReport = (reportId: string) => {
    console.log(`Exporting report ${reportId}...`);
    // Implementation would handle report export
  };

  const unreconciledTotal = mockReconciliationData.unreconciledPayments
    .filter(payment => payment.status === 'pending')
    .reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-sov-light">Reconciliation Dashboard</h1>
          <p className="text-sov-light-alt">Monitor and manage payment reconciliation processes</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleAutoReconcile}
            className="bg-sov-accent text-sov-dark font-bold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors"
          >
            Run Auto-Reconcile
          </button>
          <button 
            onClick={() => exportReport('full-reconciliation')}
            className="bg-sov-dark-alt border border-gray-600 text-sov-light font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Export Report
          </button>
        </div>
      </div>

      {/* Auto-Reconciliation Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-sov-light">Total Transactions</h3>
            <DatabaseIcon className="h-6 w-6 text-sov-accent" />
          </div>
          <p className="text-3xl font-bold text-sov-light">
            {mockReconciliationData.autoReconciliationStatus.totalTransactions.toLocaleString()}
          </p>
          <p className="text-sm text-sov-light-alt mt-1">Last 30 days</p>
        </div>

        <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-sov-light">Auto-Reconciled</h3>
            <CheckCircleIcon className="h-6 w-6 text-sov-green" />
          </div>
          <p className="text-3xl font-bold text-sov-green">
            {mockReconciliationData.autoReconciliationStatus.autoReconciled.toLocaleString()}
          </p>
          <p className="text-sm text-sov-light-alt mt-1">
            {mockReconciliationData.autoReconciliationStatus.autoReconciliationRate.toFixed(1)}% success rate
          </p>
        </div>

        <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-sov-light">Requires Review</h3>
            <EyeIcon className="h-6 w-6 text-sov-gold" />
          </div>
          <p className="text-3xl font-bold text-sov-gold">
            {mockReconciliationData.autoReconciliationStatus.requiresReview.toLocaleString()}
          </p>
          <p className="text-sm text-sov-light-alt mt-1">Needs manual attention</p>
        </div>

        <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-sov-light">Unreconciled Total</h3>
            <ExclamationIcon className="h-6 w-6 text-sov-red" />
          </div>
          <p className="text-3xl font-bold text-sov-red">
            {formatCurrency(unreconciledTotal)}
          </p>
          <p className="text-sm text-sov-light-alt mt-1">Pending reconciliation</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-sov-dark-alt rounded-lg shadow-lg border border-gray-700">
        <div className="flex flex-wrap border-b border-gray-700">
          {[
            { key: 'overview', label: 'Overview', count: mockReconciliationData.autoReconciliationStatus.totalTransactions },
            { key: 'unreconciled', label: 'Unreconciled', count: mockReconciliationData.unreconciledPayments.length },
            { key: 'auto', label: 'Auto Reconciliation', count: mockReconciliationData.autoReconciliationStatus.autoReconciled },
            { key: 'manual', label: 'Manual Review', count: mockReconciliationData.autoReconciliationStatus.requiresReview },
            { key: 'reports', label: 'Reports', count: mockReconciliationData.reconciliationReports.length }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center space-x-2 px-6 py-4 font-semibold transition-colors ${
                activeTab === tab.key
                  ? 'text-sov-accent border-b-2 border-sov-accent bg-sov-dark/50'
                  : 'text-sov-light-alt hover:text-sov-light hover:bg-sov-dark/25'
              }`}
            >
              <span>{tab.label}</span>
              <span className="bg-gray-700 text-sov-light text-xs px-2 py-1 rounded-full">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-sov-light">Reconciliation Trends</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={mockReconciliationData.reconciliationTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                      <XAxis dataKey="date" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="auto" 
                        name="Auto-Reconciled" 
                        stackId="1" 
                        stroke="#10b981" 
                        fill="#10b981" 
                        fillOpacity={0.6} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="manual" 
                        name="Manual Review" 
                        stackId="1" 
                        stroke="#f59e0b" 
                        fill="#f59e0b" 
                        fillOpacity={0.6} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="failed" 
                        name="Failed" 
                        stackId="1" 
                        stroke="#ef4444" 
                        fill="#ef4444" 
                        fillOpacity={0.6} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4 text-sov-light">Recent Exceptions</h3>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {mockReconciliationData.exceptions.map((exception) => (
                      <div key={exception.id} className="p-4 bg-sov-dark rounded-lg border border-gray-700">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(exception.status)}
                            <h4 className="font-semibold text-sov-light">{exception.type}</h4>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            exception.status === 'needs_action' ? 'bg-sov-red/20 text-sov-red' :
                            exception.status === 'in_progress' ? 'bg-sov-accent/20 text-sov-accent' :
                            'bg-sov-gold/20 text-sov-gold'
                          }`}>
                            {exception.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-sov-light-alt mb-2">{exception.description}</p>
                        <div className="flex justify-between text-sm">
                          <span className="text-sov-light-alt">
                            Assigned to: {exception.assignedTo}
                          </span>
                          <span className="text-sov-red font-semibold">
                            Difference: {formatCurrency(Math.abs(exception.difference))}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Unreconciled Payments Tab */}
          {activeTab === 'unreconciled' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-sov-light">Unreconciled Payments</h3>
                <select 
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-sov-dark border border-gray-600 text-sov-light px-3 py-2 rounded-lg"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="discrepancy">Discrepancy</option>
                  <option value="matched">Matched</option>
                </select>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="p-3">Payment</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Days Outstanding</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockReconciliationData.unreconciledPayments
                      .filter(payment => selectedStatus === 'all' || payment.status === selectedStatus)
                      .map((payment) => (
                      <tr key={payment.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                        <td className="p-3">
                          <div>
                            <p className="font-semibold text-sov-light">{payment.stripePaymentId}</p>
                            <p className="text-sm text-sov-light-alt">{payment.description}</p>
                          </div>
                        </td>
                        <td className="p-3 text-sov-light">{payment.customer}</td>
                        <td className="p-3 font-semibold text-sov-light">{formatCurrency(payment.amount)}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            payment.type === 'ACH' ? 'bg-sov-accent/20 text-sov-accent' : 'bg-purple-500/20 text-purple-400'
                          }`}>
                            {payment.type}
                          </span>
                        </td>
                        <td className="p-3 text-sov-light-alt">
                          {new Date(payment.date).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-sov-light-alt">{payment.daysOutstanding}</td>
                        <td className="p-3">
                          <div className={`flex items-center space-x-1 ${getStatusColor(payment.status)}`}>
                            {getStatusIcon(payment.status)}
                            <span className="text-sm capitalize">{payment.status}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <button 
                            onClick={() => handleManualReconcile(payment.id)}
                            className="text-sov-accent hover:text-sov-accent-hover text-sm font-semibold"
                          >
                            Reconcile
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Auto Reconciliation Tab */}
          {activeTab === 'auto' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <h3 className="text-xl font-semibold mb-4 text-sov-light">Auto-Reconciliation Performance</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={mockReconciliationData.reconciliationTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                      <XAxis dataKey="date" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="auto" 
                        name="Auto-Reconciled" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="manual" 
                        name="Manual Review" 
                        stroke="#f59e0b" 
                        strokeWidth={2}
                        dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="failed" 
                        name="Failed" 
                        stroke="#ef4444" 
                        strokeWidth={2}
                        dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4 text-sov-light">Reconciliation Rules</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-sov-dark rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-sov-light">Exact Match</span>
                        <span className="text-sov-green">Active</span>
                      </div>
                      <p className="text-sm text-sov-light-alt">Matches payments with identical amounts and dates</p>
                    </div>
                    <div className="p-3 bg-sov-dark rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-sov-light">Tolerance Check</span>
                        <span className="text-sov-green">Active</span>
                      </div>
                      <p className="text-sm text-sov-light-alt">Allow $0.01 - $5.00 variance in amounts</p>
                    </div>
                    <div className="p-3 bg-sov-dark rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-sov-light">Customer Matching</span>
                        <span className="text-sov-gold">Review</span>
                      </div>
                      <p className="text-sm text-sov-light-alt">Match payments by customer name/ID</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Manual Review Tab */}
          {activeTab === 'manual' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-sov-light">Balance Transaction Matching</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="p-3">Balance Transaction</th>
                      <th className="p-3">Stripe Amount</th>
                      <th className="p-3">Stripe Net</th>
                      <th className="p-3">Ledger Amount</th>
                      <th className="p-3">Ledger Net</th>
                      <th className="p-3">Difference</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockReconciliationData.balanceTransactionMatching.map((match) => (
                      <tr key={match.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                        <td className="p-3">
                          <p className="font-semibold text-sov-light">{match.stripeBalanceTransactionId}</p>
                          <p className="text-sm text-sov-light-alt">{match.stripePaymentId}</p>
                        </td>
                        <td className="p-3">{formatCurrency(match.stripeAmount)}</td>
                        <td className="p-3 font-semibold text-sov-light">{formatCurrency(match.stripeNet)}</td>
                        <td className="p-3">{formatCurrency(match.ledgerAmount)}</td>
                        <td className="p-3 font-semibold text-sov-light">{formatCurrency(match.ledgerNet)}</td>
                        <td className={`p-3 font-semibold ${Math.abs(match.difference) > 0.01 ? 'text-sov-red' : 'text-sov-green'}`}>
                          {formatCurrency(match.difference)}
                        </td>
                        <td className="p-3">
                          <div className={`flex items-center space-x-1 ${getStatusColor(match.status)}`}>
                            {getStatusIcon(match.status)}
                            <span className="text-sm capitalize">{match.status.replace('_', ' ')}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <button className="text-sov-accent hover:text-sov-accent-hover text-sm font-semibold">
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-sov-light">Reconciliation Reports</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {mockReconciliationData.reconciliationReports.map((report) => (
                  <div key={report.id} className="p-6 bg-sov-dark rounded-lg border border-gray-700">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-semibold text-sov-light">{report.name}</h4>
                        <p className="text-sm text-sov-light-alt">{report.dateRange}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        report.status === 'completed' ? 'bg-sov-green/20 text-sov-green' :
                        report.status === 'in_progress' ? 'bg-sov-accent/20 text-sov-accent' :
                        'bg-sov-gold/20 text-sov-gold'
                      }`}>
                        {report.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-sov-light-alt">Transactions Processed:</span>
                        <span className="text-sov-light font-semibold">{report.transactionsProcessed.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-sov-light-alt">Report Type:</span>
                        <span className="text-sov-light font-semibold">{report.type}</span>
                      </div>
                      {report.generatedAt && (
                        <div className="flex justify-between text-sm">
                          <span className="text-sov-light-alt">Generated:</span>
                          <span className="text-sov-light font-semibold">
                            {new Date(report.generatedAt).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => exportReport(report.id)}
                        disabled={!report.fileUrl}
                        className="flex-1 bg-sov-accent/10 text-sov-accent font-semibold py-2 px-4 rounded-lg hover:bg-sov-accent/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Download
                      </button>
                      <button className="bg-sov-dark-alt border border-gray-600 text-sov-light font-semibold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors">
                        Schedule
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Icon components
const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
  </svg>
);

const AlertIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

const EyeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
  </svg>
);

const PlayIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
  </svg>
);

const DatabaseIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
  </svg>
);

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const ExclamationIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);