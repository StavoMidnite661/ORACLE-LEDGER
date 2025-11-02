import React, { useState, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, ComposedChart
} from 'recharts';
import type { AchPayment, StripeCustomer, AchReturn } from '../../types';

// Mock analytics data - In production, this would come from your analytics API
const mockAnalyticsData = {
  volumeTrends: {
    daily: [
      { date: '2024-10-26', total: 45000, ach: 28000, card: 17000, success: 44250, failed: 750 },
      { date: '2024-10-27', total: 52000, ach: 32000, card: 20000, success: 50800, failed: 1200 },
      { date: '2024-10-28', total: 38000, ach: 24000, card: 14000, success: 37100, failed: 900 },
      { date: '2024-10-29', total: 61000, ach: 38000, card: 23000, success: 59800, failed: 1200 },
      { date: '2024-10-30', total: 55000, ach: 34000, card: 21000, success: 53900, failed: 1100 },
      { date: '2024-10-31', total: 67000, ach: 42000, card: 25000, success: 65800, failed: 1200 },
      { date: '2024-11-01', total: 49000, ach: 30000, card: 19000, success: 48000, failed: 1000 },
      { date: '2024-11-02', total: 58000, ach: 36000, card: 22000, success: 57000, failed: 1000 }
    ],
    weekly: [
      { week: 'W40', total: 287000, ach: 178000, card: 109000, success: 281300, failed: 5700 },
      { week: 'W41', total: 312000, ach: 195000, card: 117000, success: 305760, failed: 6240 },
      { week: 'W42', total: 298000, ach: 186000, card: 112000, success: 292040, failed: 5960 },
      { week: 'W43', total: 335000, ach: 209000, card: 126000, success: 328300, failed: 6700 },
      { week: 'W44', total: 359000, ach: 224000, card: 135000, success: 352070, failed: 6930 }
    ],
    monthly: [
      { month: 'Jun', total: 1250000, ach: 780000, card: 470000, success: 1225000, failed: 25000 },
      { month: 'Jul', total: 1380000, ach: 862000, card: 518000, success: 1352400, failed: 27600 },
      { month: 'Aug', total: 1420000, ach: 887000, card: 533000, success: 1391600, failed: 28400 },
      { month: 'Sep', total: 1560000, ach: 975000, card: 585000, success: 1528800, failed: 31200 },
      { month: 'Oct', total: 1680000, ach: 1049000, card: 631000, success: 1646400, failed: 33600 },
      { month: 'Nov', total: 850000, ach: 530000, card: 320000, success: 833000, failed: 17000 }
    ]
  },
  successRates: {
    byMethod: [
      { method: 'ACH Debit', success: 95.2, failed: 4.8, total: 523400 },
      { method: 'Credit Card', success: 98.9, failed: 1.1, total: 412300 },
      { method: 'ACH Credit', success: 97.8, failed: 2.2, total: 156200 },
      { method: 'Debit Card', success: 99.1, failed: 0.9, total: 89200 }
    ],
    byDayOfWeek: [
      { day: 'Monday', ach: 94.5, card: 98.2, total: 185000 },
      { day: 'Tuesday', ach: 95.8, card: 99.1, total: 195000 },
      { day: 'Wednesday', ach: 96.1, card: 98.8, total: 210000 },
      { day: 'Thursday', ach: 95.3, card: 98.9, total: 225000 },
      { day: 'Friday', ach: 94.8, card: 98.7, total: 240000 },
      { day: 'Saturday', ach: 93.9, card: 97.8, total: 165000 },
      { day: 'Sunday', ach: 94.2, card: 98.1, total: 140000 }
    ]
  },
  returnAnalysis: {
    byMonth: [
      { month: 'Jun', returns: 156, returnRate: 2.1, total: 7450 },
      { month: 'Jul', returns: 189, returnRate: 2.3, total: 8220 },
      { month: 'Aug', returns: 167, returnRate: 2.0, total: 8350 },
      { month: 'Sep', returns: 203, returnRate: 2.4, total: 8460 },
      { month: 'Oct', returns: 221, returnRate: 2.5, total: 8840 },
      { month: 'Nov', returns: 98, returnRate: 2.3, total: 4260 }
    ],
    byReason: [
      { code: 'R01', reason: 'Insufficient Funds', count: 45, amount: 125000 },
      { code: 'R02', reason: 'Account Closed', count: 32, amount: 98000 },
      { code: 'R03', reason: 'No Account/Unable to Locate', count: 28, amount: 87000 },
      { code: 'R04', reason: 'Invalid Account Number', count: 21, amount: 67000 },
      { code: 'R05', reason: 'Unauthorized Debit', count: 18, amount: 54000 },
      { code: 'R09', reason: 'Uncollected Funds', count: 15, amount: 42000 }
    ]
  },
  feeAnalysis: {
    byMonth: [
      { month: 'Jun', processingFees: 8750, achFees: 3200, cardFees: 5550, totalVolume: 1250000 },
      { month: 'Jul', processingFees: 9660, achFees: 3600, cardFees: 6060, totalVolume: 1380000 },
      { month: 'Aug', processingFees: 9940, achFees: 3700, cardFees: 6240, totalVolume: 1420000 },
      { month: 'Sep', processingFees: 10920, achFees: 4100, cardFees: 6820, totalVolume: 1560000 },
      { month: 'Oct', processingFees: 11760, achFees: 4500, cardFees: 7260, totalVolume: 1680000 },
      { month: 'Nov', processingFees: 5950, achFees: 2200, cardFees: 3750, totalVolume: 850000 }
    ],
    optimizationOpportunities: [
      { type: 'ACH Routing', currentFee: 0.008, potentialSavings: 1250, description: 'Switch to ACH routing for certain amounts' },
      { type: 'Card Processing', currentFee: 0.029, potentialSavings: 890, description: 'Negotiate better rates for high-volume cards' },
      { type: 'Volume Discounts', currentFee: 0.025, potentialSavings: 2150, description: 'Qualify for volume-based discounts' }
    ]
  },
  geographicDistribution: [
    { state: 'CA', volume: 285000, count: 1420, avgAmount: 200.70, successRate: 97.8 },
    { state: 'TX', volume: 245000, count: 1380, avgAmount: 177.54, successRate: 96.9 },
    { state: 'NY', volume: 220000, count: 1100, avgAmount: 200.00, successRate: 98.2 },
    { state: 'FL', volume: 195000, count: 1200, avgAmount: 162.50, successRate: 97.1 },
    { state: 'IL', volume: 180000, count: 980, avgAmount: 183.67, successRate: 96.8 },
    { state: 'PA', volume: 165000, count: 890, avgAmount: 185.39, successRate: 97.5 },
    { state: 'OH', volume: 150000, count: 820, avgAmount: 182.93, successRate: 96.7 },
    { state: 'GA', volume: 140000, count: 780, avgAmount: 179.49, successRate: 97.3 }
  ],
  customerBehavior: {
    repeatCustomers: {
      total: 2847,
      repeat: 2134,
      repeatRate: 74.9,
      avgLifetimeValue: 2847
    },
    paymentPatterns: [
      { month: 'Jun', newCustomers: 156, returning: 445, churned: 23 },
      { month: 'Jul', newCustomers: 178, returning: 512, churned: 31 },
      { month: 'Aug', newCustomers: 134, returning: 487, churned: 28 },
      { month: 'Sep', newCustomers: 201, returning: 556, churned: 35 },
      { month: 'Oct', newCustomers: 189, returning: 578, churned: 42 },
      { month: 'Nov', newCustomers: 98, returning: 312, churned: 18 }
    ]
  }
};

interface PaymentAnalyticsProps {
  className?: string;
}

export const PaymentAnalytics: React.FC<PaymentAnalyticsProps> = ({ className = '' }) => {
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedMetric, setSelectedMetric] = useState<'volume' | 'success' | 'fees'>('volume');

  const formatCurrency = (amount: number) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  const exportData = (type: string) => {
    console.log(`Exporting ${type} analytics data...`);
    // Implementation would handle the actual data export
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-sov-light">Payment Analytics</h1>
          <p className="text-sov-light-alt">Deep insights into payment patterns and performance</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="bg-sov-dark-alt border border-gray-600 text-sov-light px-3 py-2 rounded-lg"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <button 
            onClick={() => exportData('analytics')}
            className="bg-sov-accent text-sov-dark font-bold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors"
          >
            Export Data
          </button>
        </div>
      </div>

      {/* Volume Trends */}
      <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-sov-light">Payment Volume Trends</h3>
          <div className="flex gap-2">
            {['volume', 'success', 'fees'].map((metric) => (
              <button
                key={metric}
                onClick={() => setSelectedMetric(metric as any)}
                className={`px-3 py-1 rounded text-sm font-semibold capitalize ${
                  selectedMetric === metric 
                    ? 'bg-sov-accent text-sov-dark' 
                    : 'bg-sov-dark text-sov-light-alt hover:bg-gray-700'
                }`}
              >
                {metric}
              </button>
            ))}
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={mockAnalyticsData.volumeTrends[timeRange]}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
            <XAxis dataKey={timeRange === 'daily' ? 'date' : timeRange === 'weekly' ? 'week' : 'month'} stroke="#9ca3af" />
            <YAxis yAxisId="left" stroke="#9ca3af" />
            <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }}
              formatter={(value: number, name: string) => {
                if (name.includes('total') || name.includes('Volume')) {
                  return [formatCurrency(value), name];
                }
                return [value, name];
              }}
            />
            <Legend />
            
            {/* Volume bars */}
            <Bar yAxisId="left" dataKey="total" name="Total Volume" fill="#2dd4bf" opacity={0.7} />
            <Bar yAxisId="left" dataKey="ach" name="ACH" fill="#6366f1" opacity={0.8} />
            <Bar yAxisId="left" dataKey="card" name="Card" fill="#8b5cf6" opacity={0.8} />
            
            {/* Success rate line */}
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey={(data) => (data.success / data.total * 100)} 
              name="Success Rate %" 
              stroke="#10b981" 
              strokeWidth={3}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Success/Failure Rates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
          <h3 className="text-xl font-semibold mb-4 text-sov-light">Success Rates by Payment Method</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockAnalyticsData.successRates.byMethod}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
              <XAxis dataKey="method" stroke="#9ca3af" angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }}
                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Success Rate']}
              />
              <Bar dataKey="success" fill="#10b981" name="Success Rate %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
          <h3 className="text-xl font-semibold mb-4 text-sov-light">Success Rates by Day of Week</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockAnalyticsData.successRates.byDayOfWeek}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
              <XAxis dataKey="day" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }}
                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Success Rate']}
              />
              <Legend />
              <Line type="monotone" dataKey="ach" name="ACH" stroke="#6366f1" strokeWidth={2} />
              <Line type="monotone" dataKey="card" name="Card" stroke="#8b5cf6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Return Analysis */}
      <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
        <h3 className="text-xl font-semibold mb-4 text-sov-light">ACH Return Analysis</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="text-lg font-semibold mb-3 text-sov-light">Return Trends</h4>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={mockAnalyticsData.returnAnalysis.byMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis yAxisId="left" stroke="#9ca3af" />
                <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }}
                />
                <Legend />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="returns" 
                  name="Total Returns" 
                  stackId="1" 
                  stroke="#ef4444" 
                  fill="#ef4444" 
                  fillOpacity={0.6} 
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="returnRate" 
                  name="Return Rate %" 
                  stroke="#f59e0b" 
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-3 text-sov-light">Top Return Reasons</h4>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {mockAnalyticsData.returnAnalysis.byReason.map((item) => (
                <div key={item.code} className="flex items-center justify-between p-3 bg-sov-dark rounded-lg">
                  <div>
                    <p className="font-semibold text-sov-light">{item.code} - {item.reason}</p>
                    <p className="text-sm text-sov-light-alt">{item.count} returns</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sov-light">{formatCurrency(item.amount)}</p>
                    <p className="text-sm text-sov-light-alt">Total Amount</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fee Analysis */}
      <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
        <h3 className="text-xl font-semibold mb-4 text-sov-light">Fee Analysis & Optimization</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="text-lg font-semibold mb-3 text-sov-light">Fee Trends</h4>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={mockAnalyticsData.feeAnalysis.byMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }}
                  formatter={(value: number) => [formatCurrency(value), 'Fees']}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="achFees" 
                  name="ACH Fees" 
                  stackId="1" 
                  stroke="#2dd4bf" 
                  fill="#2dd4bf" 
                  fillOpacity={0.6} 
                />
                <Area 
                  type="monotone" 
                  dataKey="cardFees" 
                  name="Card Fees" 
                  stackId="1" 
                  stroke="#6366f1" 
                  fill="#6366f1" 
                  fillOpacity={0.6} 
                />
                <Line 
                  type="monotone" 
                  dataKey="processingFees" 
                  name="Total Processing Fees" 
                  stroke="#f59e0b" 
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-3 text-sov-light">Optimization Opportunities</h4>
            <div className="space-y-4">
              {mockAnalyticsData.feeAnalysis.optimizationOpportunities.map((opportunity, index) => (
                <div key={index} className="p-4 bg-sov-dark rounded-lg border border-gray-700">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-semibold text-sov-light">{opportunity.type}</h5>
                    <span className="text-sov-green font-bold">
                      Save {formatCurrency(opportunity.potentialSavings)}/mo
                    </span>
                  </div>
                  <p className="text-sm text-sov-light-alt mb-2">{opportunity.description}</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-sov-light-alt">Current Fee: {formatPercent(opportunity.currentFee)}</span>
                    <span className="text-sov-accent">Implementation Priority: High</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Geographic Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
          <h3 className="text-xl font-semibold mb-4 text-sov-light">Geographic Payment Distribution</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {mockAnalyticsData.geographicDistribution.map((state) => (
              <div key={state.state} className="flex items-center justify-between p-3 bg-sov-dark rounded-lg">
                <div>
                  <p className="font-semibold text-sov-light">{state.state}</p>
                  <p className="text-sm text-sov-light-alt">{state.count} payments • {formatCurrency(state.avgAmount)} avg</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sov-light">{formatCurrency(state.volume)}</p>
                  <p className="text-sm text-sov-green">{state.successRate.toFixed(1)}% success</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
          <h3 className="text-xl font-semibold mb-4 text-sov-light">Customer Payment Behavior</h3>
          <div className="space-y-6">
            <div className="p-4 bg-sov-dark rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-sov-light">Customer Retention</h4>
                <span className="text-2xl font-bold text-sov-accent">
                  {mockAnalyticsData.customerBehavior.repeatCustomers.repeatRate.toFixed(1)}%
                </span>
              </div>
              <p className="text-sm text-sov-light-alt">
                {mockAnalyticsData.customerBehavior.repeatCustomers.repeat} of {mockAnalyticsData.customerBehavior.repeatCustomers.total} customers are repeat customers
              </p>
              <div className="mt-3 w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-sov-accent h-2 rounded-full transition-all duration-500"
                  style={{ width: `${mockAnalyticsData.customerBehavior.repeatCustomers.repeatRate}%` }}
                ></div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-sov-light mb-3">Customer Flow Patterns</h4>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={mockAnalyticsData.customerBehavior.paymentPatterns}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="newCustomers" 
                    name="New Customers" 
                    stackId="1" 
                    stroke="#10b981" 
                    fill="#10b981" 
                    fillOpacity={0.6} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="returning" 
                    name="Returning Customers" 
                    stackId="1" 
                    stroke="#6366f1" 
                    fill="#6366f1" 
                    fillOpacity={0.6} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="churned" 
                    name="Churned Customers" 
                    stackId="1" 
                    stroke="#ef4444" 
                    fill="#ef4444" 
                    fillOpacity={0.6} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
        <h3 className="text-xl font-semibold mb-4 text-sov-light">Export Analytics Reports</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            onClick={() => exportData('volume-trends')}
            className="bg-sov-accent/10 text-sov-accent font-bold py-3 px-4 rounded-lg hover:bg-sov-accent/20 transition-colors border border-sov-accent/30"
          >
            Volume Trends CSV
          </button>
          <button 
            onClick={() => exportData('success-rates')}
            className="bg-sov-accent/10 text-sov-accent font-bold py-3 px-4 rounded-lg hover:bg-sov-accent/20 transition-colors border border-sov-accent/30"
          >
            Success Rates Report
          </button>
          <button 
            onClick={() => exportData('return-analysis')}
            className="bg-sov-accent/10 text-sov-accent font-bold py-3 px-4 rounded-lg hover:bg-sov-accent/20 transition-colors border border-sov-accent/30"
          >
            Return Analysis
          </button>
          <button 
            onClick={() => exportData('fee-analysis')}
            className="bg-sov-accent/10 text-sov-accent font-bold py-3 px-4 rounded-lg hover:bg-sov-accent/20 transition-colors border border-sov-accent/30"
          >
            Fee Analysis
          </button>
        </div>
      </div>
    </div>
  );
};