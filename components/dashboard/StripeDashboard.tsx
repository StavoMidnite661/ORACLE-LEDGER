import React, { useState, useMemo } from 'react';
import { KpiCard } from '../shared/KpiCard';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts';
import type { 
  AchPayment, 
  StripeCustomer, 
  DirectDepositRecipient,
  PaymentReconciliationEntry,
  AchReturn 
} from '../../types';

// Mock data - In production, this would come from your API
const mockStripeData = {
  totalPayments: 1247893.45,
  successRate: 97.8,
  feesPaid: 8734.21,
  totalCustomers: 2847,
  achPayments: {
    total: 523400.25,
    successRate: 95.2,
    pending: 12800.50
  },
  cardPayments: {
    total: 724493.20,
    successRate: 98.9,
    pending: 3200.75
  },
  recentActivity: [
    {
      id: '1',
      customerName: 'Acme Corp',
      amount: 15000,
      type: 'ACH',
      status: 'succeeded',
      date: '2024-11-02T14:30:00Z',
      description: 'Invoice #1234 Payment'
    },
    {
      id: '2',
      customerName: 'Tech Solutions Inc',
      amount: 8750,
      type: 'Card',
      status: 'succeeded',
      date: '2024-11-02T13:45:00Z',
      description: 'Monthly subscription'
    },
    {
      id: '3',
      customerName: 'Global Ventures',
      amount: 25000,
      type: 'ACH',
      status: 'pending',
      date: '2024-11-02T12:15:00Z',
      description: 'Quarterly payment'
    },
    {
      id: '4',
      customerName: 'StartupXYZ',
      amount: 3200,
      type: 'Card',
      status: 'failed',
      date: '2024-11-02T11:00:00Z',
      description: 'Product purchase'
    }
  ],
  directDepositRecipients: {
    total: 156,
    verified: 142,
    pending: 8,
    failed: 6
  },
  paymentMethodBreakdown: [
    { name: 'ACH Debit', value: 52.3, color: '#2dd4bf' },
    { name: 'Credit Card', value: 31.8, color: '#6366f1' },
    { name: 'ACH Credit', value: 11.2, color: '#8b5cf6' },
    { name: 'Debit Card', value: 4.7, color: '#f59e0b' }
  ],
  dailyVolume: [
    { date: '10-27', ach: 12500, card: 8750 },
    { date: '10-28', ach: 18200, card: 9200 },
    { date: '10-29', ach: 15300, card: 7800 },
    { date: '10-30', ach: 19800, card: 11200 },
    { date: '10-31', ach: 22100, card: 13800 },
    { date: '11-01', ach: 18750, card: 9500 },
    { date: '11-02', ach: 21400, card: 12100 }
  ]
};

interface StripeDashboardProps {
  className?: string;
}

export const StripeDashboard: React.FC<StripeDashboardProps> = ({ className = '' }) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [showDetails, setShowDetails] = useState(false);

  const formatCurrency = (amount: number) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded': return 'text-sov-green';
      case 'pending': return 'text-sov-gold';
      case 'failed': return 'text-sov-red';
      default: return 'text-sov-light-alt';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>;
      case 'pending':
        return <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>;
      case 'failed':
        return <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>;
      default:
        return null;
    }
  };

  const downloadReport = (reportType: string) => {
    // Implementation would generate and download the specific report
    console.log(`Downloading ${reportType} report...`);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-sov-light">Stripe Dashboard</h1>
          <p className="text-sov-light-alt">Monitor payment processing and customer activity</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => downloadReport('payments')}
            className="bg-sov-accent text-sov-dark font-bold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors"
          >
            Export Payments
          </button>
          <button 
            onClick={() => setShowDetails(!showDetails)}
            className="bg-sov-dark-alt border border-gray-600 text-sov-light font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Total Payments"
          value={formatCurrency(mockStripeData.totalPayments)}
          change="+12.5%"
          changeType="increase"
          icon={<DollarIcon />}
        />
        <KpiCard
          title="Success Rate"
          value={`${mockStripeData.successRate}%`}
          change="+2.1%"
          changeType="increase"
          icon={<TrendingUpIcon />}
        />
        <KpiCard
          title="Total Fees Paid"
          value={formatCurrency(mockStripeData.feesPaid)}
          change="+8.7%"
          changeType="increase"
          icon={<CreditCardIcon />}
        />
        <KpiCard
          title="Active Customers"
          value={mockStripeData.totalCustomers.toLocaleString()}
          change="+156"
          changeType="increase"
          icon={<UsersIcon />}
        />
      </div>

      {/* ACH vs Card Payment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
          <h3 className="text-xl font-semibold mb-4 text-sov-light">Payment Volume Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockStripeData.dailyVolume}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="ach" 
                name="ACH Payments" 
                stroke="#2dd4bf" 
                strokeWidth={3}
                dot={{ fill: '#2dd4bf', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="card" 
                name="Card Payments" 
                stroke="#6366f1" 
                strokeWidth={3}
                dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
          <h3 className="text-xl font-semibold mb-4 text-sov-light">Payment Methods</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={mockStripeData.paymentMethodBreakdown}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}%`}
                labelLine={false}
                fontSize={12}
              >
                {mockStripeData.paymentMethodBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }}
                formatter={(value: number) => [`${value}%`, 'Percentage']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Direct Deposit Status & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
          <h3 className="text-xl font-semibold mb-4 text-sov-light">Direct Deposit Recipients</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-sov-dark rounded-lg">
              <div>
                <p className="text-sov-light font-semibold">Verified Recipients</p>
                <p className="text-sov-light-alt text-sm">Ready for payments</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-sov-green">
                  {mockStripeData.directDepositRecipients.verified}
                </p>
                <p className="text-sm text-sov-light-alt">
                  of {mockStripeData.directDepositRecipients.total}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-sov-dark rounded-lg text-center">
                <p className="text-sov-gold font-semibold">
                  {mockStripeData.directDepositRecipients.pending}
                </p>
                <p className="text-xs text-sov-light-alt">Pending</p>
              </div>
              <div className="p-3 bg-sov-dark rounded-lg text-center">
                <p className="text-sov-red font-semibold">
                  {mockStripeData.directDepositRecipients.failed}
                </p>
                <p className="text-xs text-sov-light-alt">Failed</p>
              </div>
            </div>

            <button className="w-full bg-sov-accent/10 text-sov-accent font-bold py-3 px-4 rounded-lg hover:bg-sov-accent/20 transition-colors">
              Manage Recipients
            </button>
          </div>
        </div>

        <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-sov-light">Recent Payment Activity</h3>
            <button className="text-sov-accent text-sm hover:underline">
              View All
            </button>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {mockStripeData.recentActivity.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-sov-dark transition-colors">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${
                    payment.type === 'ACH' ? 'bg-sov-accent/20 text-sov-accent' : 'bg-purple-500/20 text-purple-400'
                  }`}>
                    {payment.type === 'ACH' ? <BankIcon /> : <CreditCardIcon />}
                  </div>
                  <div>
                    <p className="font-semibold text-sov-light">{payment.customerName}</p>
                    <p className="text-sm text-sov-light-alt">{payment.description}</p>
                    <p className="text-xs text-sov-light-alt">{formatDate(payment.date)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sov-light">{formatCurrency(payment.amount)}</p>
                  <div className={`flex items-center space-x-1 ${getStatusColor(payment.status)}`}>
                    {getStatusIcon(payment.status)}
                    <span className="text-xs capitalize">{payment.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Compliance Status Indicators */}
      <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
        <h3 className="text-xl font-semibold mb-4 text-sov-light">Compliance Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-4 bg-sov-dark rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-sov-green/20 text-sov-green rounded-full">
                <ShieldIcon />
              </div>
              <div>
                <p className="font-semibold text-sov-light">PCI DSS</p>
                <p className="text-sm text-sov-light-alt">Level 1 Compliant</p>
              </div>
            </div>
            <div className="text-sov-green">
              <CheckIcon />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-sov-dark rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-sov-green/20 text-sov-green rounded-full">
                <DocumentIcon />
              </div>
              <div>
                <p className="font-semibold text-sov-light">NACHA Rules</p>
                <p className="text-sm text-sov-light-alt">All requirements met</p>
              </div>
            </div>
            <div className="text-sov-green">
              <CheckIcon />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-sov-dark rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-sov-gold/20 text-sov-gold rounded-full">
                <AlertIcon />
              </div>
              <div>
                <p className="font-semibold text-sov-light">Audit Trail</p>
                <p className="text-sm text-sov-light-alt">Last review: 2 days ago</p>
              </div>
            </div>
            <div className="text-sov-gold">
              <AlertIcon />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button className="bg-sov-accent/10 text-sov-accent font-bold py-4 px-6 rounded-lg hover:bg-sov-accent/20 transition-colors border border-sov-accent/30">
          <div className="flex flex-col items-center space-y-2">
            <PlusIcon />
            <span>New Payment</span>
          </div>
        </button>
        <button className="bg-sov-accent/10 text-sov-accent font-bold py-4 px-6 rounded-lg hover:bg-sov-accent/20 transition-colors border border-sov-accent/30">
          <div className="flex flex-col items-center space-y-2">
            <UsersIcon />
            <span>Add Customer</span>
          </div>
        </button>
        <button className="bg-sov-accent/10 text-sov-accent font-bold py-4 px-6 rounded-lg hover:bg-sov-accent/20 transition-colors border border-sov-accent/30">
          <div className="flex flex-col items-center space-y-2">
            <BankIcon />
            <span>Process ACH</span>
          </div>
        </button>
        <button className="bg-sov-accent/10 text-sov-accent font-bold py-4 px-6 rounded-lg hover:bg-sov-accent/20 transition-colors border border-sov-accent/30">
          <div className="flex flex-col items-center space-y-2">
            <DocumentIcon />
            <span>Generate Report</span>
          </div>
        </button>
      </div>
    </div>
  );
};

// Icon components (simplified for this example)
const DollarIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" />
  </svg>
);

const TrendingUpIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const CreditCardIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
  </svg>
);

const BankIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M19 10v8a2 2 0 01-2 2H7a2 2 0 01-2-2v-8m4-4V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const DocumentIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const AlertIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const PlusIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);