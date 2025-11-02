import React, { useState, useMemo, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, ComposedChart
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, Target, Zap } from 'lucide-react';
import type { 
  MonthlyFeeReport, 
  FeeOptimizationRecommendation, 
  FeeVarianceAlert,
  FeeDisputeRecord 
} from '../../services/feeTrackingService';

// Mock data - In production, this would come from the API
const mockFeeData: MonthlyFeeReport[] = [
  {
    month: '6',
    year: 2024,
    totalVolume: 120000000, // $1,200,000
    totalFees: 840000, // $8,400
    feesByType: {
      achDebit: 420000, // $4,200
      achCredit: 120000, // $1,200
      cardProcessing: 240000, // $2,400
      directDeposit: 60000, // $600
      verification: 0
    },
    feesByCategory: {
      processing: 504000, // $5,040
      bank: 168000, // $1,680
      stripe: 134400, // $1,344
      compliance: 33600 // $336
    },
    optimizationMetrics: {
      costPerTransaction: 168, // $1.68
      effectiveRate: 0.7, // 0.7%
      volumeDiscounts: 0,
      potentialSavings: 50400 // $504
    }
  },
  {
    month: '7',
    year: 2024,
    totalVolume: 135000000, // $1,350,000
    totalFees: 945000, // $9,450
    feesByType: {
      achDebit: 480000, // $4,800
      achCredit: 135000, // $1,350
      cardProcessing: 270000, // $2,700
      directDeposit: 60000, // $600
      verification: 0
    },
    feesByCategory: {
      processing: 567000, // $5,670
      bank: 189000, // $1,890
      stripe: 151200, // $1,512
      compliance: 37800 // $378
    },
    optimizationMetrics: {
      costPerTransaction: 175, // $1.75
      effectiveRate: 0.7, // 0.7%
      volumeDiscounts: 0,
      potentialSavings: 56700 // $567
    }
  },
  {
    month: '8',
    year: 2024,
    totalVolume: 142000000, // $1,420,000
    totalFees: 994000, // $9,940
    feesByType: {
      achDebit: 512000, // $5,120
      achCredit: 142000, // $1,420
      cardProcessing: 284000, // $2,840
      directDeposit: 56000, // $560
      verification: 0
    },
    feesByCategory: {
      processing: 596400, // $5,964
      bank: 198800, // $1,988
      stripe: 159040, // $1,590
      compliance: 39760 // $398
    },
    optimizationMetrics: {
      costPerTransaction: 175, // $1.75
      effectiveRate: 0.7, // 0.7%
      volumeDiscounts: 0,
      potentialSavings: 59640 // $596
    }
  },
  {
    month: '9',
    year: 2024,
    totalVolume: 158000000, // $1,580,000
    totalFees: 1106000, // $11,060
    feesByType: {
      achDebit: 568000, // $5,680
      achCredit: 158000, // $1,580
      cardProcessing: 316000, // $3,160
      directDeposit: 62000, // $620
      verification: 2000 // $20 for new verifications
    },
    feesByCategory: {
      processing: 663600, // $6,636
      bank: 221200, // $2,212
      stripe: 176960, // $1,770
      compliance: 44240 // $442
    },
    optimizationMetrics: {
      costPerTransaction: 175, // $1.75
      effectiveRate: 0.7, // 0.7%
      volumeDiscounts: 0,
      potentialSavings: 66360 // $664
    }
  },
  {
    month: '10',
    year: 2024,
    totalVolume: 175000000, // $1,750,000
    totalFees: 1225000, // $12,250
    feesByType: {
      achDebit: 630000, // $6,300
      achCredit: 175000, // $1,750
      cardProcessing: 350000, // $3,500
      directDeposit: 70000, // $700
      verification: 0
    },
    feesByCategory: {
      processing: 735000, // $7,350
      bank: 245000, // $2,450
      stripe: 196000, // $1,960
      compliance: 49000 // $490
    },
    optimizationMetrics: {
      costPerTransaction: 175, // $1.75
      effectiveRate: 0.7, // 0.7%
      volumeDiscounts: 0,
      potentialSavings: 73500 // $735
    }
  },
  {
    month: '11',
    year: 2024,
    totalVolume: 195000000, // $1,950,000
    totalFees: 1365000, // $13,650
    feesByType: {
      achDebit: 702000, // $7,020
      achCredit: 195000, // $1,950
      cardProcessing: 390000, // $3,900
      directDeposit: 78000, // $780
      verification: 0
    },
    feesByCategory: {
      processing: 819000, // $8,190
      bank: 273000, // $2,730
      stripe: 218400, // $2,184
      compliance: 54600 // $546
    },
    optimizationMetrics: {
      costPerTransaction: 175, // $1.75
      effectiveRate: 0.7, // 0.7%
      volumeDiscounts: 0,
      potentialSavings: 81900 // $819
    }
  }
];

const mockOptimizationRecommendations: FeeOptimizationRecommendation[] = [
  {
    id: 'ach-routing-1',
    type: 'ACH_ROUTING',
    title: 'Optimize Payment Method Routing',
    description: 'Route high-value transactions through ACH instead of cards to reduce processing costs',
    potentialSavings: 35000, // $350/month
    implementationCost: 5000,
    roi: 8.5,
    priority: 'high',
    timeframe: '2-4 weeks',
    requirements: ['Customer consent for ACH routing', 'Updated payment forms', 'Process changes']
  },
  {
    id: 'volume-discount-1',
    type: 'VOLUME_DISCOUNT',
    title: 'Negotiate Volume-Based Discounts',
    description: 'Based on current volume ($1.95M/month), negotiate enterprise pricing tiers',
    potentialSavings: 81900, // $819/month
    implementationCost: 0,
    roi: Infinity,
    priority: 'critical',
    timeframe: '1-2 weeks',
    requirements: ['Contract renegotiation', 'Account manager engagement']
  },
  {
    id: 'dd-optimization-1',
    type: 'PROCESSING_OPTIMIZATION',
    title: 'Optimize Direct Deposit Processing',
    description: 'Bundle direct deposits to reduce per-transaction fees',
    potentialSavings: 23400, // $234/month
    implementationCost: 2500,
    roi: 4.2,
    priority: 'medium',
    timeframe: '3-6 weeks',
    requirements: ['Payroll system updates', 'Employee notification', 'Schedule changes']
  }
];

const mockVarianceAlerts: FeeVarianceAlert[] = [
  {
    id: 'alert-1',
    type: 'unusual_pattern',
    severity: 'medium',
    message: 'Card processing fees increased by 25% compared to last month',
    currentValue: 390000, // $3,900
    expectedValue: 312000, // $3,120
    variance: 78000, // $780
    timestamp: new Date(),
    resolved: false
  },
  {
    id: 'alert-2',
    type: 'cost_increase',
    severity: 'high',
    message: 'Effective fee rate exceeded threshold (0.8% > 0.7%)',
    currentValue: 0.8,
    expectedValue: 0.7,
    variance: 0.1,
    timestamp: new Date(),
    resolved: false
  }
];

const mockDisputes: FeeDisputeRecord[] = [
  {
    id: 'dispute-1',
    feeTransactionId: 'fee-123',
    disputeType: 'duplicate_charge',
    status: 'open',
    amount: 3000, // $30
    reason: 'Card processing fee charged twice for transaction TXN-12345',
    evidence: ['transaction-screenshot.png', 'billing-statement.pdf'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'dispute-2',
    feeTransactionId: 'fee-456',
    disputeType: 'incorrect_calculation',
    status: 'under_review',
    amount: 1500, // $15
    reason: 'ACH fee calculation exceeds the $5.00 cap',
    evidence: ['fee-calculation.xlsx'],
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
    updatedAt: new Date()
  }
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

interface FeeAnalyticsProps {
  className?: string;
}

export const FeeAnalytics: React.FC<FeeAnalyticsProps> = ({ className = '' }) => {
  const [timeRange, setTimeRange] = useState<'6m' | '12m' | '24m'>('12m');
  const [selectedView, setSelectedView] = useState<'overview' | 'trends' | 'optimization' | 'compliance'>('overview');
  const [selectedMonth, setSelectedMonth] = useState<number>(11); // November
  const [alerts, setAlerts] = useState<FeeVarianceAlert[]>(mockVarianceAlerts);
  const [disputes, setDisputes] = useState<FeeDisputeRecord[]>(mockDisputes);

  const currentData = mockFeeData.filter(d => d.year === 2024 && d.month === selectedMonth.toString())[0];
  const trendData = mockFeeData.slice(-6); // Last 6 months

  const formatCurrency = (amount: number) => `$${(amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  const formatPercent = (value: number) => `${(value * 100).toFixed(2)}%`;

  const kpiCards = useMemo(() => [
    {
      title: 'Total Monthly Fees',
      value: formatCurrency(currentData?.totalFees || 0),
      change: '+5.2%',
      changeType: 'increase' as const,
      icon: DollarSign,
      color: 'text-sov-accent'
    },
    {
      title: 'Effective Fee Rate',
      value: formatPercent(currentData?.optimizationMetrics.effectiveRate || 0),
      change: '-0.1%',
      changeType: 'decrease' as const,
      icon: TrendingDown,
      color: 'text-sov-green'
    },
    {
      title: 'Cost Per Transaction',
      value: formatCurrency(currentData?.optimizationMetrics.costPerTransaction || 0),
      change: '+2.3%',
      changeType: 'increase' as const,
      icon: TrendingUp,
      color: 'text-orange-400'
    },
    {
      title: 'Potential Savings',
      value: formatCurrency(currentData?.optimizationMetrics.potentialSavings || 0),
      change: '+12.5%',
      changeType: 'increase' as const,
      icon: Target,
      color: 'text-sov-green'
    }
  ], [currentData]);

  const handleResolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, resolved: true, resolvedAt: new Date() }
        : alert
    ));
  };

  const handleUpdateDispute = (disputeId: string, status: FeeDisputeRecord['status']) => {
    setDisputes(prev => prev.map(dispute => 
      dispute.id === disputeId 
        ? { ...dispute, status, updatedAt: new Date() }
        : dispute
    ));
  };

  const exportFeeReport = (format: 'csv' | 'pdf' | 'excel') => {
    console.log(`Exporting fee report in ${format} format...`);
    // Implementation would handle the actual export
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-sov-light">Fee Analytics & Optimization</h1>
          <p className="text-sov-light-alt">Comprehensive fee tracking and cost optimization insights</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-sov-dark-alt border border-gray-600 text-sov-light px-3 py-2 rounded-lg"
          >
            <option value={6}>June 2024</option>
            <option value={7}>July 2024</option>
            <option value={8}>August 2024</option>
            <option value={9}>September 2024</option>
            <option value={10}>October 2024</option>
            <option value={11}>November 2024</option>
          </select>
          <button 
            onClick={() => exportFeeReport('pdf')}
            className="bg-sov-accent text-sov-dark font-bold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors"
          >
            Export Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div key={index} className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sov-light-alt text-sm font-medium">{kpi.title}</p>
                  <p className="text-2xl font-bold text-sov-light mt-2">{kpi.value}</p>
                  <div className="flex items-center mt-2">
                    {kpi.changeType === 'increase' ? (
                      <TrendingUp className="h-4 w-4 text-red-400 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-green-400 mr-1" />
                    )}
                    <span className={`text-sm ${kpi.changeType === 'increase' ? 'text-red-400' : 'text-green-400'}`}>
                      {kpi.change}
                    </span>
                  </div>
                </div>
                <Icon className={`h-8 w-8 ${kpi.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-sov-dark-alt p-1 rounded-lg">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'trends', label: 'Fee Trends' },
          { key: 'optimization', label: 'Optimization' },
          { key: 'compliance', label: 'Compliance' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedView(tab.key as any)}
            className={`flex-1 py-2 px-4 text-sm font-semibold rounded-lg transition-colors ${
              selectedView === tab.key
                ? 'bg-sov-accent text-sov-dark'
                : 'text-sov-light-alt hover:text-sov-light hover:bg-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {selectedView === 'overview' && (
        <div className="space-y-6">
          {/* Fee Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
              <h3 className="text-xl font-semibold mb-4 text-sov-light">Fee Distribution by Type</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'ACH Debit', value: currentData?.feesByType.achDebit || 0 },
                      { name: 'ACH Credit', value: currentData?.feesByType.achCredit || 0 },
                      { name: 'Card Processing', value: currentData?.feesByType.cardProcessing || 0 },
                      { name: 'Direct Deposit', value: currentData?.feesByType.directDeposit || 0 },
                      { name: 'Verification', value: currentData?.feesByType.verification || 0 }
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {[
                      { name: 'ACH Debit', value: currentData?.feesByType.achDebit || 0 },
                      { name: 'ACH Credit', value: currentData?.feesByType.achCredit || 0 },
                      { name: 'Card Processing', value: currentData?.feesByType.cardProcessing || 0 },
                      { name: 'Direct Deposit', value: currentData?.feesByType.directDeposit || 0 },
                      { name: 'Verification', value: currentData?.feesByType.verification || 0 }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [formatCurrency(value), 'Fees']} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
              <h3 className="text-xl font-semibold mb-4 text-sov-light">Fee Categories</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { 
                    category: 'Processing', 
                    fees: currentData?.feesByCategory.processing || 0 
                  },
                  { 
                    category: 'Bank', 
                    fees: currentData?.feesByCategory.bank || 0 
                  },
                  { 
                    category: 'Stripe', 
                    fees: currentData?.feesByCategory.stripe || 0 
                  },
                  { 
                    category: 'Compliance', 
                    fees: currentData?.feesByCategory.compliance || 0 
                  }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                  <XAxis dataKey="category" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip formatter={(value: number) => [formatCurrency(value), 'Fees']} />
                  <Bar dataKey="fees" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Fee Trends Tab */}
      {selectedView === 'trends' && (
        <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
          <h3 className="text-xl font-semibold mb-4 text-sov-light">Fee Trends Analysis</h3>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis yAxisId="left" stroke="#9ca3af" />
              <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }}
                formatter={(value: number, name: string) => {
                  if (name.includes('Volume') || name.includes('Fees')) {
                    return [formatCurrency(value), name];
                  }
                  return [value, name];
                }}
              />
              <Legend />
              
              <Bar yAxisId="left" dataKey="totalFees" name="Total Fees" fill="#ef4444" opacity={0.8} />
              <Bar yAxisId="left" dataKey="totalVolume" name="Total Volume" fill="#10b981" opacity={0.6} />
              
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="optimizationMetrics.effectiveRate" 
                name="Effective Rate %" 
                stroke="#f59e0b" 
                strokeWidth={3}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Optimization Tab */}
      {selectedView === 'optimization' && (
        <div className="space-y-6">
          <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
            <h3 className="text-xl font-semibold mb-4 text-sov-light">Cost Optimization Recommendations</h3>
            <div className="space-y-4">
              {mockOptimizationRecommendations.map((rec) => (
                <div key={rec.id} className="p-4 bg-sov-dark rounded-lg border border-gray-700">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-sov-light">{rec.title}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          rec.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
                          rec.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                          rec.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {rec.priority.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sov-light-alt text-sm mb-3">{rec.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <span className="text-sov-green">
                          <strong>Potential Savings:</strong> {formatCurrency(rec.potentialSavings)}
                        </span>
                        <span className="text-sov-light">
                          <strong>Implementation Cost:</strong> {formatCurrency(rec.implementationCost)}
                        </span>
                        <span className="text-sov-accent">
                          <strong>ROI:</strong> {rec.roi === Infinity ? '∞' : `${rec.roi.toFixed(1)}x`}
                        </span>
                        <span className="text-sov-light">
                          <strong>Timeframe:</strong> {rec.timeframe}
                        </span>
                      </div>
                    </div>
                    <button className="ml-4 bg-sov-accent text-sov-dark font-bold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors">
                      Implement
                    </button>
                  </div>
                  <div>
                    <h5 className="text-sov-light font-semibold mb-2">Requirements:</h5>
                    <div className="flex flex-wrap gap-2">
                      {rec.requirements.map((req, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-700 text-sov-light-alt text-xs rounded">
                          {req}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Compliance Tab */}
      {selectedView === 'compliance' && (
        <div className="space-y-6">
          {/* Variance Alerts */}
          <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-sov-light">Fee Variance Alerts</h3>
              <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm">
                {alerts.filter(a => !a.resolved).length} Active
              </span>
            </div>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className={`p-4 rounded-lg border ${
                  alert.resolved ? 'bg-gray-800 border-gray-700' : 
                  alert.severity === 'critical' ? 'bg-red-900/20 border-red-500/50' :
                  alert.severity === 'high' ? 'bg-orange-900/20 border-orange-500/50' :
                  'bg-yellow-900/20 border-yellow-500/50'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                        alert.severity === 'critical' ? 'text-red-400' :
                        alert.severity === 'high' ? 'text-orange-400' :
                        'text-yellow-400'
                      }`} />
                      <div>
                        <p className="text-sov-light font-medium">{alert.message}</p>
                        <p className="text-sov-light-alt text-sm mt-1">
                          Current: {alert.currentValue.toFixed ? alert.currentValue.toFixed(2) : alert.currentValue} | 
                          Expected: {alert.expectedValue.toFixed ? alert.expectedValue.toFixed(2) : alert.expectedValue} |
                          Variance: {alert.varianceAmount.toFixed ? alert.varianceAmount.toFixed(2) : alert.varianceAmount}
                        </p>
                        <p className="text-sov-light-alt text-xs mt-1">
                          {alert.timestamp.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {!alert.resolved && (
                      <button 
                        onClick={() => handleResolveAlert(alert.id)}
                        className="bg-sov-accent/20 text-sov-accent px-3 py-1 rounded text-sm hover:bg-sov-accent/30 transition-colors"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fee Disputes */}
          <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-sov-light">Fee Disputes & Adjustments</h3>
              <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-sm">
                {disputes.filter(d => d.status === 'open' || d.status === 'under_review').length} Active
              </span>
            </div>
            <div className="space-y-3">
              {disputes.map((dispute) => (
                <div key={dispute.id} className="p-4 bg-sov-dark rounded-lg border border-gray-700">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-sov-light">Dispute #{dispute.id}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          dispute.status === 'open' ? 'bg-red-500/20 text-red-400' :
                          dispute.status === 'under_review' ? 'bg-yellow-500/20 text-yellow-400' :
                          dispute.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                          'bg-orange-500/20 text-orange-400'
                        }`}>
                          {dispute.status.toUpperCase().replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sov-light-alt text-sm mb-2">{dispute.reason}</p>
                      <div className="flex gap-4 text-sm">
                        <span className="text-sov-light">
                          <strong>Amount:</strong> {formatCurrency(dispute.amount)}
                        </span>
                        <span className="text-sov-light">
                          <strong>Type:</strong> {dispute.disputeType.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {dispute.status === 'open' && (
                        <button 
                          onClick={() => handleUpdateDispute(dispute.id, 'under_review')}
                          className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded text-sm hover:bg-yellow-500/30 transition-colors"
                        >
                          Review
                        </button>
                      )}
                      {dispute.status === 'under_review' && (
                        <button 
                          onClick={() => handleUpdateDispute(dispute.id, 'resolved')}
                          className="bg-green-500/20 text-green-400 px-3 py-1 rounded text-sm hover:bg-green-500/30 transition-colors"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Export Options */}
      <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
        <h3 className="text-xl font-semibold mb-4 text-sov-light">Export Fee Analytics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            onClick={() => exportFeeReport('csv')}
            className="bg-sov-accent/10 text-sov-accent font-bold py-3 px-4 rounded-lg hover:bg-sov-accent/20 transition-colors border border-sov-accent/30"
          >
            Fee Summary CSV
          </button>
          <button 
            onClick={() => exportFeeReport('pdf')}
            className="bg-sov-accent/10 text-sov-accent font-bold py-3 px-4 rounded-lg hover:bg-sov-accent/20 transition-colors border border-sov-accent/30"
          >
            Detailed PDF Report
          </button>
          <button 
            onClick={() => exportFeeReport('excel')}
            className="bg-sov-accent/10 text-sov-accent font-bold py-3 px-4 rounded-lg hover:bg-sov-accent/20 transition-colors border border-sov-accent/30"
          >
            Excel Workbook
          </button>
          <button 
            className="bg-sov-accent/10 text-sov-accent font-bold py-3 px-4 rounded-lg hover:bg-sov-accent/20 transition-colors border border-sov-accent/30"
          >
            Compliance Report
          </button>
        </div>
      </div>
    </div>
  );
};