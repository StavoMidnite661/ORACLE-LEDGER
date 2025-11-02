import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart
} from 'recharts';
import { securityMonitoringService } from '../../services/securityMonitoringService';
import { alertManagementService } from '../../services/alertManagementService';
import { securityComplianceService } from '../../services/securityComplianceService';

interface SecurityMetrics {
  timestamp: Date;
  activeThreats: number;
  blockedAttempts: number;
  suspiciousActivities: number;
  failedLogins: number;
  apiAbuseAttempts: number;
  databaseIntrusions: number;
  systemHealth: number;
  complianceScore: number;
}

interface AlertMetrics {
  timestamp: Date;
  totalAlerts: number;
  openAlerts: number;
  resolvedAlerts: number;
  averageResolutionTime: number;
  escalationRate: number;
  falsePositiveRate: number;
}

interface ComplianceMetrics {
  timestamp: Date;
  overallComplianceScore: number;
  controlsImplemented: number;
  controlsTotal: number;
  testsPassed: number;
  testsTotal: number;
  vulnerabilitiesOpen: number;
  vulnerabilitiesCritical: number;
  policiesCompliant: number;
  policiesTotal: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  trend: 'improving' | 'stable' | 'declining';
}

interface KPIScore {
  name: string;
  current: number;
  target: number;
  trend: number;
  status: 'good' | 'warning' | 'critical';
  description: string;
}

const SecurityMetrics: React.FC = () => {
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics[]>([]);
  const [alertMetrics, setAlertMetrics] = useState<AlertMetrics[]>([]);
  const [complianceMetrics, setComplianceMetrics] = useState<ComplianceMetrics[]>([]);
  const [kpiScores, setKpiScores] = useState<KPIScore[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadMetricsData();
    
    // Set up real-time updates every minute
    const interval = setInterval(loadMetricsData, 60000);
    
    return () => clearInterval(interval);
  }, [selectedTimeRange]);

  const loadMetricsData = async () => {
    try {
      setIsLoading(true);
      
      // Load security metrics
      const securityData = await securityMonitoringService.getSecurityMetrics(selectedTimeRange);
      setSecurityMetrics(securityData);
      
      // Load alert metrics
      const alertData = alertManagementService.getAlertMetrics(selectedTimeRange);
      setAlertMetrics([alertData].filter(Boolean) as AlertMetrics[]);
      
      // Load compliance metrics
      const complianceData = securityComplianceService.getComplianceMetrics(selectedTimeRange);
      setComplianceMetrics(complianceData);
      
      // Calculate KPI scores
      calculateKPIScores(securityData, alertData, complianceData);
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load metrics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateKPIScores = (
    securityData: SecurityMetrics[],
    alertData: AlertMetrics | undefined,
    complianceData: ComplianceMetrics[]
  ) => {
    const latestSecurity = securityData[securityData.length - 1];
    const latestCompliance = complianceData[complianceData.length - 1];
    
    const kpis: KPIScore[] = [
      {
        name: 'System Health',
        current: latestSecurity?.systemHealth || 0,
        target: 95,
        trend: 2.5,
        status: (latestSecurity?.systemHealth || 0) >= 95 ? 'good' : 
              (latestSecurity?.systemHealth || 0) >= 80 ? 'warning' : 'critical',
        description: 'Overall system health and performance'
      },
      {
        name: 'Security Posture',
        current: latestSecurity ? 
          Math.round((1 - (latestSecurity.activeThreats / 100)) * 100) : 0,
        target: 98,
        trend: 1.2,
        status: 'good',
        description: 'Current security threat level'
      },
      {
        name: 'Alert Response Time',
        current: alertData ? Math.round(60 / (alertData.averageResolutionTime || 1)) : 0,
        target: 15,
        trend: -0.8,
        status: 'warning',
        description: 'Average time to resolve security alerts (minutes)'
      },
      {
        name: 'Compliance Score',
        current: latestCompliance?.overallComplianceScore || 0,
        target: 95,
        trend: 0.5,
        status: (latestCompliance?.overallComplianceScore || 0) >= 95 ? 'good' : 
              (latestCompliance?.overallComplianceScore || 0) >= 85 ? 'warning' : 'critical',
        description: 'Regulatory compliance compliance score'
      },
      {
        name: 'Threat Detection Rate',
        current: latestSecurity ? 
          Math.round((latestSecurity.blockedAttempts / 
          (latestSecurity.blockedAttempts + latestSecurity.activeThreats)) * 100) : 0,
        target: 99,
        trend: 3.1,
        status: 'good',
        description: 'Percentage of threats successfully detected and blocked'
      },
      {
        name: 'False Positive Rate',
        current: alertData?.falsePositiveRate || 0,
        target: 5,
        trend: -1.2,
        status: (alertData?.falsePositiveRate || 0) <= 5 ? 'good' : 
               (alertData?.falsePositiveRate || 0) <= 10 ? 'warning' : 'critical',
        description: 'Percentage of alerts that were false positives'
      }
    ];
    
    setKpiScores(kpis);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return '#16a34a';
      case 'warning': return '#f59e0b';
      case 'critical': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getKPIStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircleIcon className="h-5 w-5 text-green-400" />;
      case 'warning': return <ExclamationIcon className="h-5 w-5 text-yellow-400" />;
      case 'critical': return <XCircleIcon className="h-5 w-5 text-red-400" />;
      default: return <MinusCircleIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUpIcon className="h-4 w-4 text-green-400" />;
    if (trend < 0) return <TrendingDownIcon className="h-4 w-4 text-red-400" />;
    return <MinusIcon className="h-4 w-4 text-gray-400" />;
  };

  // Prepare chart data
  const combinedMetrics = securityMetrics.map((security, index) => ({
    time: index,
    threats: security.activeThreats,
    blocked: security.blockedAttempts,
    suspicious: security.suspiciousActivities,
    health: security.systemHealth,
    compliance: security.complianceScore,
    failedLogins: security.failedLogins
  }));

  const threatDistribution = [
    { name: 'Blocked', value: securityMetrics.reduce((sum, m) => sum + m.blockedAttempts, 0), color: '#16a34a' },
    { name: 'Active', value: securityMetrics.reduce((sum, m) => sum + m.activeThreats, 0), color: '#dc2626' },
    { name: 'Suspicious', value: securityMetrics.reduce((sum, m) => sum + m.suspiciousActivities, 0), color: '#f59e0b' },
  ];

  const securityHeatmap = Array.from({ length: 24 }, (_, hour) => ({
    hour: `${hour.toString().padStart(2, '0')}:00`,
    security: Math.random() * 100,
    compliance: Math.random() * 100,
    performance: Math.random() * 100
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sov-accent"></div>
        <span className="ml-2 text-sov-light">Loading security metrics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-sov-light">Security Metrics</h1>
          <p className="text-sov-light-alt">Key Performance Indicators and security analytics</p>
        </div>
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sov-light-alt text-sm mb-2">Time Range</label>
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as any)}
              className="bg-sov-dark border border-gray-600 text-sov-light px-3 py-2 rounded-lg"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
          <div className="text-right">
            <p className="text-sm text-sov-light-alt">Last Updated</p>
            <p className="text-sov-light font-semibold">
              {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
          <button
            onClick={loadMetricsData}
            className="bg-sov-accent text-sov-dark font-bold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpiScores.map((kpi, index) => (
          <div key={index} className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                {getKPIStatusIcon(kpi.status)}
                <h3 className="text-sov-light font-semibold">{kpi.name}</h3>
              </div>
              <div className="flex items-center space-x-1">
                {getTrendIcon(kpi.trend)}
                <span className={`text-sm font-semibold ${
                  kpi.trend > 0 ? 'text-green-400' : 
                  kpi.trend < 0 ? 'text-red-400' : 'text-gray-400'
                }`}>
                  {Math.abs(kpi.trend).toFixed(1)}%
                </span>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-bold text-sov-light">
                  {kpi.current.toFixed(1)}
                </span>
                <span className="text-sov-light-alt">
                  / {kpi.target}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min((kpi.current / kpi.target) * 100, 100)}%`,
                    backgroundColor: getStatusColor(kpi.status)
                  }}
                />
              </div>
            </div>
            
            <p className="text-sov-light-alt text-sm">{kpi.description}</p>
          </div>
        ))}
      </div>

      {/* Main Metrics Chart */}
      <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
        <h3 className="text-xl font-semibold text-sov-light mb-4">
          Security Metrics Overview ({selectedTimeRange})
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={combinedMetrics}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="time" stroke="#9ca3af" />
            <YAxis yAxisId="left" stroke="#9ca3af" />
            <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="threats"
              fill="#dc2626"
              fillOpacity={0.3}
              stroke="#dc2626"
              strokeWidth={2}
              name="Active Threats"
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="suspicious"
              fill="#f59e0b"
              fillOpacity={0.3}
              stroke="#f59e0b"
              strokeWidth={2}
              name="Suspicious Activity"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="health"
              stroke="#16a34a"
              strokeWidth={3}
              name="System Health %"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="compliance"
              stroke="#2dd4bf"
              strokeWidth={3}
              name="Compliance Score %"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Threat Distribution */}
        <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
          <h3 className="text-xl font-semibold text-sov-light mb-4">Threat Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={threatDistribution}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {threatDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Security Heatmap */}
        <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
          <h3 className="text-xl font-semibold text-sov-light mb-4">24-Hour Security Heatmap</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={securityHeatmap}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="hour" stroke="#9ca3af" interval={3} />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Area
                type="monotone"
                dataKey="security"
                stroke="#dc2626"
                fill="#dc2626"
                fillOpacity={0.6}
                name="Security Score"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
        <h3 className="text-xl font-semibold text-sov-light mb-4">Security Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-sov-green mb-2">
              {securityMetrics.reduce((sum, m) => sum + m.blockedAttempts, 0)}
            </div>
            <div className="text-sov-light-alt">Threats Blocked</div>
            <div className="text-sm text-sov-green mt-1">↑ 15% from last period</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-sov-accent mb-2">
              {Math.round(securityMetrics.reduce((sum, m) => sum + m.systemHealth, 0) / securityMetrics.length || 0)}%
            </div>
            <div className="text-sov-light-alt">Avg System Health</div>
            <div className="text-sm text-sov-accent mt-1">→ Stable</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-sov-gold mb-2">
              {Math.round(complianceMetrics.reduce((sum, m) => sum + m.overallComplianceScore, 0) / complianceMetrics.length || 0)}%
            </div>
            <div className="text-sov-light-alt">Avg Compliance Score</div>
            <div className="text-sm text-sov-gold mt-1">↑ 2.1% from last period</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-sov-red mb-2">
              {securityMetrics.reduce((sum, m) => sum + m.failedLogins, 0)}
            </div>
            <div className="text-sov-light-alt">Failed Login Attempts</div>
            <div className="text-sm text-sov-red mt-1">↓ 8% from last period</div>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Events Breakdown */}
        <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
          <h3 className="text-xl font-semibold text-sov-light mb-4">Security Events Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={securityMetrics.slice(-10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="timestamp" stroke="#9ca3af" tickFormatter={(value) => new Date(value).toLocaleTimeString()} />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="blockedAttempts" fill="#16a34a" name="Blocked" />
              <Bar dataKey="suspiciousActivities" fill="#f59e0b" name="Suspicious" />
              <Bar dataKey="activeThreats" fill="#dc2626" name="Active" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* System Health Radar */}
        <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
          <h3 className="text-xl font-semibold text-sov-light mb-4">System Health Radar</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={[
              { area: 'Network', score: 92 },
              { area: 'Database', score: 88 },
              { area: 'API', score: 95 },
              { area: 'Authentication', score: 89 },
              { area: 'Storage', score: 94 },
              { area: 'Monitoring', score: 97 }
            ]}>
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis dataKey="area" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <PolarRadiusAxis tick={{ fill: '#9ca3af', fontSize: 10 }} domain={[0, 100]} />
              <Radar
                name="Health Score"
                dataKey="score"
                stroke="#2dd4bf"
                fill="#2dd4bf"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Export Section */}
      <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
        <h3 className="text-xl font-semibold text-sov-light mb-4">Export & Reporting</h3>
        <div className="flex flex-wrap gap-4">
          <button className="bg-sov-accent text-sov-dark font-semibold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors">
            Export Metrics CSV
          </button>
          <button className="bg-sov-dark border border-gray-600 text-sov-light font-semibold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors">
            Generate Security Report
          </button>
          <button className="bg-sov-dark border border-gray-600 text-sov-light font-semibold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors">
            Schedule Report
          </button>
          <button className="bg-sov-dark border border-gray-600 text-sov-light font-semibold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors">
            Configure Alerts
          </button>
        </div>
      </div>
    </div>
  );
};

// Icon components
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

const XCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
  </svg>
);

const MinusCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd" />
  </svg>
);

const TrendingUpIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
  </svg>
);

const TrendingDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v3.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.586 14.586 13H12z" clipRule="evenodd" />
  </svg>
);

const MinusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
  </svg>
);

export default SecurityMetrics;