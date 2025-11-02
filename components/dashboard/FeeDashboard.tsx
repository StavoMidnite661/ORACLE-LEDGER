import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Target, 
  FileText, 
  Download,
  RefreshCw,
  Filter,
  Calendar,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ComposedChart,
  Area,
  AreaChart
} from 'recharts';

// Import fee tracking service types
import type {
  MonthlyFeeReport,
  FeeOptimizationRecommendation,
  FeeVarianceAlert,
  FeeDisputeRecord,
  FeeAnalyticsCache
} from '../../services/feeTrackingService';

interface FeeDashboardProps {
  className?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

interface DashboardMetrics {
  totalMonthlyFees: number;
  totalVolume: number;
  effectiveRate: number;
  potentialSavings: number;
  activeAlerts: number;
  openDisputes: number;
  complianceScore: number;
  avgProcessingTime: number;
}

interface FeeTrendData {
  month: string;
  totalFees: number;
  achFees: number;
  cardFees: number;
  ddFees: number;
  volume: number;
  effectiveRate: number;
}

interface OptimizationImpact {
  recommendation: string;
  monthlySavings: number;
  implementationCost: number;
  roi: number;
  timeframe: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

// Mock data - would come from API in production
const mockMetrics: DashboardMetrics = {
  totalMonthlyFees: 13650, // $136.50
  totalVolume: 1950000, // $19,500
  effectiveRate: 0.7, // 0.7%
  potentialSavings: 819, // $8.19
  activeAlerts: 3,
  openDisputes: 2,
  complianceScore: 95,
  avgProcessingTime: 2.3
};

const mockTrendData: FeeTrendData[] = [
  { month: 'Jun', totalFees: 8400, achFees: 4200, cardFees: 2400, ddFees: 600, volume: 1200000, effectiveRate: 0.7 },
  { month: 'Jul', totalFees: 9450, achFees: 4800, cardFees: 2700, ddFees: 600, volume: 1350000, effectiveRate: 0.7 },
  { month: 'Aug', totalFees: 9940, achFees: 5120, cardFees: 2840, ddFees: 560, volume: 1420000, effectiveRate: 0.7 },
  { month: 'Sep', totalFees: 11060, achFees: 5680, cardFees: 3160, ddFees: 620, volume: 1580000, effectiveRate: 0.7 },
  { month: 'Oct', totalFees: 12250, achFees: 6300, cardFees: 3500, ddFees: 700, volume: 1750000, effectiveRate: 0.7 },
  { month: 'Nov', totalFees: 13650, achFees: 7020, cardFees: 3900, ddFees: 780, volume: 1950000, effectiveRate: 0.7 }
];

const mockOptimizationImpact: OptimizationImpact[] = [
  {
    recommendation: 'Volume-based ACH routing',
    monthlySavings: 350,
    implementationCost: 5000,
    roi: 0.84,
    timeframe: '2-4 weeks',
    priority: 'high'
  },
  {
    recommendation: 'Enterprise pricing tier',
    monthlySavings: 819,
    implementationCost: 0,
    roi: Infinity,
    timeframe: '1-2 weeks',
    priority: 'critical'
  },
  {
    recommendation: 'Batch processing optimization',
    monthlySavings: 234,
    implementationCost: 2500,
    roi: 1.12,
    timeframe: '3-6 weeks',
    priority: 'medium'
  }
];

const mockVarianceAlerts: FeeVarianceAlert[] = [
  {
    id: 'alert-1',
    type: 'unusual_pattern',
    severity: 'medium',
    message: 'Card processing fees increased by 25% vs last month',
    currentValue: 3900,
    expectedValue: 3120,
    variance: 780,
    timestamp: new Date(),
    resolved: false
  },
  {
    id: 'alert-2',
    type: 'cost_increase',
    severity: 'high',
    message: 'Effective rate exceeded 0.8% threshold',
    currentValue: 0.8,
    expectedValue: 0.7,
    variance: 0.1,
    timestamp: new Date(),
    resolved: false
  },
  {
    id: 'alert-3',
    type: 'threshold_exceeded',
    severity: 'low',
    message: 'ACH return fees approaching monthly limit',
    currentValue: 850,
    expectedValue: 1000,
    variance: -150,
    timestamp: new Date(Date.now() - 86400000),
    resolved: false
  }
];

const mockDisputes: FeeDisputeRecord[] = [
  {
    id: 'dispute-1',
    feeTransactionId: 'fee-123',
    disputeType: 'duplicate_charge',
    status: 'open',
    amount: 3000,
    reason: 'Duplicate card processing fee',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'dispute-2',
    feeTransactionId: 'fee-456',
    disputeType: 'incorrect_calculation',
    status: 'under_review',
    amount: 1500,
    reason: 'ACH fee over cap',
    createdAt: new Date(Date.now() - 86400000),
    updatedAt: new Date()
  }
];

export const FeeDashboard: React.FC<FeeDashboardProps> = ({ className = '' }) => {
  const [metrics, setMetrics] = useState<DashboardMetrics>(mockMetrics);
  const [trendData, setTrendData] = useState<FeeTrendData[]>(mockTrendData);
  const [optimizationImpact, setOptimizationImpact] = useState<OptimizationImpact[]>(mockOptimizationImpact);
  const [varianceAlerts, setVarianceAlerts] = useState<FeeVarianceAlert[]>(mockVarianceAlerts);
  const [disputes, setDisputes] = useState<FeeDisputeRecord[]>(mockDisputes);
  
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'fees' | 'volume' | 'savings'>('fees');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const formatCurrency = (amount: number) => `$${(amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  const formatPercent = (value: number) => `${(value * 100).toFixed(2)}%`;
  const formatCompactCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return formatCurrency(amount);
  };

  const refreshDashboard = async () => {
    setIsRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setIsRefreshing(false);
    }, 2000);
  };

  const handleResolveAlert = (alertId: string) => {
    setVarianceAlerts(prev => prev.map(alert => 
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

  const exportDashboard = (format: 'pdf' | 'csv' | 'excel') => {
    console.log(`Exporting dashboard as ${format}`);
    // Implementation would handle actual export
  };

  const kpiCards = [
    {
      title: 'Total Monthly Fees',
      value: formatCurrency(metrics.totalMonthlyFees),
      change: '+12.5%',
      changeType: 'increase' as const,
      icon: DollarSign,
      color: 'text-sov-accent',
      bgColor: 'bg-sov-accent/10'
    },
    {
      title: 'Total Volume',
      value: formatCompactCurrency(metrics.totalVolume),
      change: '+8.2%',
      changeType: 'increase' as const,
      icon: TrendingUp,
      color: 'text-sov-green',
      bgColor: 'bg-sov-green/10'
    },
    {
      title: 'Effective Fee Rate',
      value: formatPercent(metrics.effectiveRate / 100),
      change: '-0.1%',
      changeType: 'decrease' as const,
      icon: Target,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10'
    },
    {
      title: 'Potential Savings',
      value: formatCurrency(metrics.potentialSavings),
      change: '+25.3%',
      changeType: 'increase' as const,
      icon: TrendingDown,
      color: 'text-sov-green',
      bgColor: 'bg-sov-green/10'
    }
  ];

  const complianceCards = [
    {
      title: 'Active Alerts',
      value: metrics.activeAlerts,
      status: metrics.activeAlerts > 0 ? 'warning' : 'good',
      icon: AlertTriangle,
      color: metrics.activeAlerts > 5 ? 'text-red-400' : metrics.activeAlerts > 2 ? 'text-yellow-400' : 'text-green-400'
    },
    {
      title: 'Open Disputes',
      value: metrics.openDisputes,
      status: metrics.openDisputes > 0 ? 'warning' : 'good',
      icon: FileText,
      color: metrics.openDisputes > 3 ? 'text-red-400' : metrics.openDisputes > 1 ? 'text-yellow-400' : 'text-green-400'
    },
    {
      title: 'Compliance Score',
      value: `${metrics.complianceScore}%`,
      status: metrics.complianceScore >= 95 ? 'excellent' : metrics.complianceScore >= 85 ? 'good' : 'warning',
      icon: Target,
      color: metrics.complianceScore >= 95 ? 'text-green-400' : metrics.complianceScore >= 85 ? 'text-yellow-400' : 'text-red-400'
    },
    {
      title: 'Avg Processing Time',
      value: `${metrics.avgProcessingTime}d`,
      status: metrics.avgProcessingTime <= 2 ? 'good' : metrics.avgProcessingTime <= 3 ? 'warning' : 'poor',
      icon: RefreshCw,
      color: metrics.avgProcessingTime <= 2 ? 'text-green-400' : metrics.avgProcessingTime <= 3 ? 'text-yellow-400' : 'text-red-400'
    }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-sov-light">Fee Management Dashboard</h1>
          <p className="text-sov-light-alt">Comprehensive fee tracking and optimization insights</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select 
            value={selectedTimeRange} 
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="bg-sov-dark-alt border border-gray-600 text-sov-light px-3 py-2 rounded-lg"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button 
            onClick={refreshDashboard}
            disabled={isRefreshing}
            className="bg-sov-accent/10 text-sov-accent font-bold py-2 px-4 rounded-lg hover:bg-sov-accent/20 transition-colors border border-sov-accent/30 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button 
            onClick={() => exportDashboard('pdf')}
            className="bg-sov-accent text-sov-dark font-bold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
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
                <div className="flex-1">
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
                <div className={`p-3 rounded-lg ${kpi.bgColor}`}>
                  <Icon className={`h-6 w-6 ${kpi.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Fee Trends Chart */}
      <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-sov-light">Fee Trends Analysis</h3>
          <div className="flex gap-2">
            {['fees', 'volume', 'savings'].map((metric) => (
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
            
            {selectedMetric === 'fees' && (
              <>
                <Area yAxisId="left" dataKey="totalFees" name="Total Fees" fill="#ef4444" fillOpacity={0.3} stroke="#ef4444" strokeWidth={2} />
                <Bar yAxisId="left" dataKey="achFees" name="ACH Fees" fill="#6366f1" opacity={0.8} />
                <Bar yAxisId="left" dataKey="cardFees" name="Card Fees" fill="#8b5cf6" opacity={0.8} />
                <Bar yAxisId="left" dataKey="ddFees" name="Direct Deposit Fees" fill="#2dd4bf" opacity={0.8} />
              </>
            )}
            
            {selectedMetric === 'volume' && (
              <>
                <Area yAxisId="left" dataKey="volume" name="Total Volume" fill="#10b981" fillOpacity={0.3} stroke="#10b981" strokeWidth={2} />
                <Line yAxisId="right" dataKey="effectiveRate" name="Effective Rate %" stroke="#f59e0b" strokeWidth={3} />
              </>
            )}
            
            {selectedMetric === 'savings' && (
              <>
                <Bar yAxisId="left" dataKey="totalFees" name="Current Fees" fill="#ef4444" opacity={0.8} />
                <Bar yAxisId="left" dataKey={(data) => data.totalFees - (data.totalFees * 0.05)} name="Optimized Fees" fill="#10b981" opacity={0.8} />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Compliance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
          <h3 className="text-xl font-semibold mb-4 text-sov-light">Compliance Status</h3>
          <div className="grid grid-cols-2 gap-4">
            {complianceCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <div key={index} className="p-4 bg-sov-dark rounded-lg border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`h-5 w-5 ${card.color}`} />
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      card.status === 'excellent' ? 'bg-green-500/20 text-green-400' :
                      card.status === 'good' ? 'bg-blue-500/20 text-blue-400' :
                      card.status === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {card.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sov-light font-bold text-lg">{card.value}</p>
                  <p className="text-sov-light-alt text-sm">{card.title}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
          <h3 className="text-xl font-semibold mb-4 text-sov-light">Optimization Impact</h3>
          <div className="space-y-4">
            {optimizationImpact.map((item, index) => (
              <div key={index} className="p-4 bg-sov-dark rounded-lg border border-gray-700">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-sov-light">{item.recommendation}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    item.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
                    item.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                    item.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {item.priority.toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-sov-light-alt">Monthly Savings</p>
                    <p className="text-sov-green font-semibold">{formatCurrency(item.monthlySavings)}</p>
                  </div>
                  <div>
                    <p className="text-sov-light-alt">Implementation Cost</p>
                    <p className="text-sov-light font-semibold">{formatCurrency(item.implementationCost)}</p>
                  </div>
                  <div>
                    <p className="text-sov-light-alt">ROI</p>
                    <p className="text-sov-accent font-semibold">
                      {item.roi === Infinity ? '∞' : `${item.roi.toFixed(1)}x`}
                    </p>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-sov-light-alt text-xs">Timeframe: {item.timeframe}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts and Disputes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Variance Alerts */}
        <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-sov-light">Variance Alerts</h3>
            <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm">
              {varianceAlerts.filter(a => !a.resolved).length} Active
            </span>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {varianceAlerts.map((alert) => (
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
                        Expected: {alert.expectedValue.toFixed ? alert.expectedValue.toFixed(2) : alert.expectedValue}
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
            <h3 className="text-xl font-semibold text-sov-light">Fee Disputes</h3>
            <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-sm">
              {disputes.filter(d => d.status === 'open' || d.status === 'under_review').length} Active
            </span>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto">
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

      {/* Quick Actions */}
      <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
        <h3 className="text-xl font-semibold mb-4 text-sov-light">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="bg-sov-accent/10 text-sov-accent font-bold py-3 px-4 rounded-lg hover:bg-sov-accent/20 transition-colors border border-sov-accent/30">
            <BarChart3 className="h-5 w-5 mb-2" />
            Generate Report
          </button>
          <button className="bg-sov-accent/10 text-sov-accent font-bold py-3 px-4 rounded-lg hover:bg-sov-accent/20 transition-colors border border-sov-accent/30">
            <PieChart className="h-5 w-5 mb-2" />
            Fee Analysis
          </button>
          <button className="bg-sov-accent/10 text-sov-accent font-bold py-3 px-4 rounded-lg hover:bg-sov-accent/20 transition-colors border border-sov-accent/30">
            <LineChart className="h-5 w-5 mb-2" />
            Trend Analysis
          </button>
          <button className="bg-sov-accent/10 text-sov-accent font-bold py-3 px-4 rounded-lg hover:bg-sov-accent/20 transition-colors border border-sov-accent/30">
            <FileText className="h-5 w-5 mb-2 />
            Compliance Report
          </button>
        </div>
      </div>
    </div>
  );
};