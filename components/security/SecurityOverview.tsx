import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { securityMonitoringService } from '../../services/securityMonitoringService';
import { alertManagementService } from '../../services/alertManagementService';
import { securityComplianceService } from '../../services/securityComplianceService';

interface SecurityStatus {
  activeThreats: number;
  recentEvents: any[];
  systemHealth: number;
  complianceScore: number;
  topThreats: Array<{ type: string; count: number; severity: string }>;
}

interface AlertMetrics {
  timestamp: Date;
  totalAlerts: number;
  openAlerts: number;
  resolvedAlerts: number;
  averageResolutionTime: number;
  escalationRate: number;
}

interface ComplianceStatus {
  overallScore: number;
  standards: Array<{
    id: string;
    name: string;
    score: number;
    status: string;
  }>;
  riskLevel: string;
}

const SecurityOverview: React.FC = () => {
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(null);
  const [alertMetrics, setAlertMetrics] = useState<AlertMetrics | null>(null);
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatus | null>(null);
  const [securityMetrics, setSecurityMetrics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadSecurityData();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(loadSecurityData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadSecurityData = async () => {
    try {
      setIsLoading(true);
      
      // Load security monitoring data
      const status = await securityMonitoringService.getSecurityStatus();
      setSecurityStatus(status);
      
      // Load alert metrics
      const alertMetrics = alertManagementService.getAlertMetrics('24h');
      setAlertMetrics(alertMetrics);
      
      // Load compliance status
      const compliance = await securityComplianceService.getComplianceStatus();
      setComplianceStatus(compliance);
      
      // Load security metrics for charts
      const metrics = await securityMonitoringService.getSecurityMetrics('24h');
      setSecurityMetrics(metrics);
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load security data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getHealthColor = (health: number) => {
    if (health >= 90) return 'text-green-400';
    if (health >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getComplianceColor = (score: number) => {
    if (score >= 95) return 'text-green-400';
    if (score >= 85) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#d97706';
      case 'low': return '#16a34a';
      default: return '#6b7280';
    }
  };

  // Mock data for real-time charts
  const threatTrends = [
    { time: '00:00', threats: 2, blocked: 15, suspicious: 8 },
    { time: '04:00', threats: 1, blocked: 12, suspicious: 5 },
    { time: '08:00', threats: 5, blocked: 28, suspicious: 15 },
    { time: '12:00', threats: 8, blocked: 35, suspicious: 22 },
    { time: '16:00', threats: 6, blocked: 31, suspicious: 18 },
    { time: '20:00', threats: 3, blocked: 19, suspicious: 11 },
  ];

  const alertDistribution = [
    { name: 'Open', value: alertMetrics?.openAlerts || 0, color: '#dc2626' },
    { name: 'Resolved', value: alertMetrics?.resolvedAlerts || 0, color: '#16a34a' },
    { name: 'Acknowledged', value: 3, color: '#d97706' },
  ];

  const systemHealthData = securityMetrics.map((metric, index) => ({
    time: `${index}`,
    health: metric.systemHealth || 0,
    compliance: metric.complianceScore || 0,
    threats: metric.activeThreats || 0,
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sov-accent"></div>
        <span className="ml-2 text-sov-light">Loading security status...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-sov-light">Security Overview</h1>
          <p className="text-sov-light-alt">Real-time security monitoring and threat detection</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-sov-light-alt">Last Updated</p>
            <p className="text-sov-light font-semibold">
              {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
          <button
            onClick={loadSecurityData}
            className="bg-sov-accent text-sov-dark font-bold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sov-light-alt text-sm">Active Threats</p>
              <p className="text-3xl font-bold text-sov-red">
                {securityStatus?.activeThreats || 0}
              </p>
              <p className="text-xs text-sov-light-alt mt-1">Requiring attention</p>
            </div>
            <div className="p-3 bg-sov-red/20 rounded-lg">
              <AlertTriangleIcon className="h-6 w-6 text-sov-red" />
            </div>
          </div>
        </div>

        <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sov-light-alt text-sm">System Health</p>
              <p className={`text-3xl font-bold ${getHealthColor(securityStatus?.systemHealth || 0)}`}>
                {Math.round(securityStatus?.systemHealth || 0)}%
              </p>
              <p className="text-xs text-sov-light-alt mt-1">Overall status</p>
            </div>
            <div className="p-3 bg-sov-green/20 rounded-lg">
              <HeartIcon className={`h-6 w-6 ${getHealthColor(securityStatus?.systemHealth || 0)}`} />
            </div>
          </div>
        </div>

        <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sov-light-alt text-sm">Compliance Score</p>
              <p className={`text-3xl font-bold ${getComplianceColor(securityStatus?.complianceScore || 0)}`}>
                {Math.round(securityStatus?.complianceScore || 0)}%
              </p>
              <p className="text-xs text-sov-light-alt mt-1">Regulatory status</p>
            </div>
            <div className="p-3 bg-sov-accent/20 rounded-lg">
              <ShieldIcon className={`h-6 w-6 ${getComplianceColor(securityStatus?.complianceScore || 0)}`} />
            </div>
          </div>
        </div>

        <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sov-light-alt text-sm">Open Alerts</p>
              <p className="text-3xl font-bold text-sov-gold">
                {alertMetrics?.openAlerts || 0}
              </p>
              <p className="text-xs text-sov-light-alt mt-1">Active notifications</p>
            </div>
            <div className="p-3 bg-sov-gold/20 rounded-lg">
              <BellIcon className="h-6 w-6 text-sov-gold" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Threat Trends */}
        <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
          <h3 className="text-xl font-semibold text-sov-light mb-4">Security Events (24h)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={threatTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="threats"
                stroke="#dc2626"
                strokeWidth={2}
                name="Active Threats"
              />
              <Line
                type="monotone"
                dataKey="blocked"
                stroke="#16a34a"
                strokeWidth={2}
                name="Blocked Attempts"
              />
              <Line
                type="monotone"
                dataKey="suspicious"
                stroke="#d97706"
                strokeWidth={2}
                name="Suspicious Activity"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* System Health Trend */}
        <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
          <h3 className="text-xl font-semibold text-sov-light mb-4">System Health Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={systemHealthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="health"
                stroke="#16a34a"
                fill="#16a34a"
                fillOpacity={0.3}
                name="System Health %"
              />
              <Area
                type="monotone"
                dataKey="compliance"
                stroke="#2dd4bf"
                fill="#2dd4bf"
                fillOpacity={0.3}
                name="Compliance %"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Threats */}
        <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
          <h3 className="text-xl font-semibold text-sov-light mb-4">Top Threats (24h)</h3>
          <div className="space-y-3">
            {securityStatus?.topThreats.slice(0, 5).map((threat, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-sov-dark rounded-lg">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getSeverityColor(threat.severity) }}
                  />
                  <span className="text-sov-light font-medium truncate">{threat.type}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sov-light font-bold">{threat.count}</span>
                  <span className="text-xs text-sov-light-alt">{threat.severity}</span>
                </div>
              </div>
            )) || (
              <div className="text-sov-light-alt text-center py-4">No threats detected</div>
            )}
          </div>
        </div>

        {/* Alert Distribution */}
        <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
          <h3 className="text-xl font-semibold text-sov-light mb-4">Alert Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={alertDistribution}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {alertDistribution.map((entry, index) => (
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
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center space-x-4 mt-4">
            {alertDistribution.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sov-light-alt text-sm">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance Status */}
        <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
          <h3 className="text-xl font-semibold text-sov-light mb-4">Compliance Standards</h3>
          <div className="space-y-3">
            {complianceStatus?.standards.map((standard, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-sov-dark rounded-lg">
                <div>
                  <p className="text-sov-light font-medium">{standard.name}</p>
                  <p className="text-xs text-sov-light-alt">{standard.status}</p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${getComplianceColor(standard.score)}`}>
                    {standard.score}%
                  </p>
                </div>
              </div>
            )) || (
              <div className="text-sov-light-alt text-center py-4">No compliance data</div>
            )}
          </div>
          <div className="mt-4 p-3 bg-sov-dark rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sov-light-alt">Overall Risk Level</span>
              <span className={`font-bold ${
                complianceStatus?.riskLevel === 'low' ? 'text-green-400' :
                complianceStatus?.riskLevel === 'medium' ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {complianceStatus?.riskLevel?.toUpperCase() || 'UNKNOWN'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Security Events */}
      <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
        <h3 className="text-xl font-semibold text-sov-light mb-4">Recent Security Events</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-sov-light-alt pb-3">Time</th>
                <th className="text-sov-light-alt pb-3">Event</th>
                <th className="text-sov-light-alt pb-3">Severity</th>
                <th className="text-sov-light-alt pb-3">Source</th>
                <th className="text-sov-light-alt pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {securityStatus?.recentEvents.slice(0, 10).map((event, index) => (
                <tr key={index} className="border-b border-gray-700/50">
                  <td className="py-3 text-sov-light text-sm">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-3 text-sov-light">{event.eventType}</td>
                  <td className="py-3">
                    <span
                      className="px-2 py-1 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: `${getSeverityColor(event.severity)}20`,
                        color: getSeverityColor(event.severity)
                      }}
                    >
                      {event.severity}
                    </span>
                  </td>
                  <td className="py-3 text-sov-light-alt text-sm">{event.sourceType}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      event.status === 'open' ? 'bg-sov-red/20 text-sov-red' :
                      event.status === 'investigating' ? 'bg-sov-gold/20 text-sov-gold' :
                      'bg-sov-green/20 text-sov-green'
                    }`}>
                      {event.status}
                    </span>
                  </td>
                </tr>
              )) || (
                <tr>
                  <td colSpan={5} className="py-4 text-sov-light-alt text-center">
                    No recent events
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Icon components
const AlertTriangleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

const HeartIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
  </svg>
);

const ShieldIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const BellIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
  </svg>
);

export default SecurityOverview;