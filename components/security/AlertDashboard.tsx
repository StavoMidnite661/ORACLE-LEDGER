import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { alertManagementService } from '../../services/alertManagementService';

interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  status: 'open' | 'acknowledged' | 'investigating' | 'resolved' | 'closed';
  createdAt: Date;
  assignedTo?: string;
  tags: string[];
}

interface AlertMetrics {
  totalAlerts: number;
  openAlerts: number;
  resolvedAlerts: number;
  averageResolutionTime: number;
  escalationRate: number;
  falsePositiveRate: number;
}

const AlertDashboard: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [metrics, setMetrics] = useState<AlertMetrics | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadAlertData();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(loadAlertData, 30000);
    
    return () => clearInterval(interval);
  }, [selectedSeverity, selectedStatus]);

  const loadAlertData = async () => {
    try {
      setIsLoading(true);
      
      // Load alerts with filters
      const alertFilters: any = {};
      if (selectedSeverity !== 'all') alertFilters.severity = selectedSeverity;
      if (selectedStatus !== 'all') alertFilters.status = selectedStatus;
      
      const alertsData = alertManagementService.getAlerts(alertFilters);
      setAlerts(alertsData);
      
      // Load metrics
      const alertMetrics = alertManagementService.getAlertMetrics('24h');
      if (alertMetrics) {
        setMetrics({
          totalAlerts: alertMetrics.totalAlerts,
          openAlerts: alertMetrics.openAlerts,
          resolvedAlerts: alertMetrics.resolvedAlerts,
          averageResolutionTime: alertMetrics.averageResolutionTime,
          escalationRate: alertMetrics.escalationRate,
          falsePositiveRate: alertMetrics.falsePositiveRate
        });
      }
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load alert data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await alertManagementService.acknowledgeAlert(alertId, 'current_user', 'Acknowledged from dashboard');
      loadAlertData(); // Refresh data
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await alertManagementService.resolveAlert(alertId, 'current_user', 'Resolved from dashboard');
      loadAlertData(); // Refresh data
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const handleEscalateAlert = async (alertId: string) => {
    try {
      await alertManagementService.escalateAlert(alertId, {
        reason: 'Manual escalation from dashboard',
        escalatedBy: 'current_user'
      });
      loadAlertData(); // Refresh data
    } catch (error) {
      console.error('Failed to escalate alert:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#d97706';
      case 'low': return '#16a34a';
      default: return '#6b7280';
    }
  };

  const getSeverityBadge = (severity: string) => {
    const color = getSeverityColor(severity);
    return (
      <span
        className="px-2 py-1 rounded-full text-xs font-semibold"
        style={{ backgroundColor: `${color}20`, color }}
      >
        {severity.toUpperCase()}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      open: 'bg-sov-red/20 text-sov-red',
      acknowledged: 'bg-sov-gold/20 text-sov-gold',
      investigating: 'bg-blue-500/20 text-blue-400',
      resolved: 'bg-sov-green/20 text-sov-green',
      closed: 'bg-gray-600/20 text-gray-400'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles] || styles.open}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  // Mock data for charts
  const alertTrends = [
    { date: '2024-11-01', critical: 2, high: 5, medium: 12, low: 8 },
    { date: '2024-11-02', critical: 1, high: 3, medium: 15, low: 10 },
  ];

  const alertDistribution = [
    { name: 'Critical', value: alerts.filter(a => a.severity === 'critical').length, color: '#dc2626' },
    { name: 'High', value: alerts.filter(a => a.severity === 'high').length, color: '#ea580c' },
    { name: 'Medium', value: alerts.filter(a => a.severity === 'medium').length, color: '#d97706' },
    { name: 'Low', value: alerts.filter(a => a.severity === 'low').length, color: '#16a34a' },
  ];

  const categoryDistribution = [
    { category: 'Security', count: 15 },
    { category: 'Compliance', count: 8 },
    { category: 'Performance', count: 12 },
    { category: 'System', count: 6 },
    { category: 'Network', count: 4 },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sov-accent"></div>
        <span className="ml-2 text-sov-light">Loading alerts...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-sov-light">Alert Dashboard</h1>
          <p className="text-sov-light-alt">Monitor and manage security alerts and notifications</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-sov-light-alt">Last Updated</p>
            <p className="text-sov-light font-semibold">
              {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
          <button
            onClick={loadAlertData}
            className="bg-sov-accent text-sov-dark font-bold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Alert Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sov-light-alt text-sm">Total Alerts (24h)</p>
              <p className="text-3xl font-bold text-sov-light">
                {metrics?.totalAlerts || 0}
              </p>
              <p className="text-xs text-sov-light-alt mt-1">All severities</p>
            </div>
            <div className="p-3 bg-sov-accent/20 rounded-lg">
              <BellIcon className="h-6 w-6 text-sov-accent" />
            </div>
          </div>
        </div>

        <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sov-light-alt text-sm">Open Alerts</p>
              <p className="text-3xl font-bold text-sov-red">
                {metrics?.openAlerts || 0}
              </p>
              <p className="text-xs text-sov-light-alt mt-1">Requiring attention</p>
            </div>
            <div className="p-3 bg-sov-red/20 rounded-lg">
              <AlertIcon className="h-6 w-6 text-sov-red" />
            </div>
          </div>
        </div>

        <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sov-light-alt text-sm">Avg Resolution Time</p>
              <p className="text-3xl font-bold text-sov-green">
                {Math.round(metrics?.averageResolutionTime || 0)}h
              </p>
              <p className="text-xs text-sov-light-alt mt-1">Last 24 hours</p>
            </div>
            <div className="p-3 bg-sov-green/20 rounded-lg">
              <ClockIcon className="h-6 w-6 text-sov-green" />
            </div>
          </div>
        </div>

        <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sov-light-alt text-sm">Escalation Rate</p>
              <p className="text-3xl font-bold text-sov-gold">
                {Math.round(metrics?.escalationRate || 0)}%
              </p>
              <p className="text-xs text-sov-light-alt mt-1">Requiring escalation</p>
            </div>
            <div className="p-3 bg-sov-gold/20 rounded-lg">
              <TrendingUpIcon className="h-6 w-6 text-sov-gold" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sov-light-alt text-sm mb-2">Severity</label>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-sov-dark border border-gray-600 text-sov-light px-3 py-2 rounded-lg"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-sov-light-alt text-sm mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-sov-dark border border-gray-600 text-sov-light px-3 py-2 rounded-lg"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedSeverity('all');
                setSelectedStatus('all');
              }}
              className="bg-gray-600 text-sov-light font-semibold py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alert Distribution */}
        <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
          <h3 className="text-xl font-semibold text-sov-light mb-4">Alert Distribution by Severity</h3>
          <ResponsiveContainer width="100%" height={250}>
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
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
          <h3 className="text-xl font-semibold text-sov-light mb-4">Alerts by Category</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={categoryDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="category" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="count" fill="#2dd4bf" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alert List */}
      <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-sov-light">
            Alerts ({alerts.length})
          </h3>
          <div className="flex gap-2">
            <button className="bg-sov-accent text-sov-dark font-semibold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors">
              Create Alert
            </button>
            <button className="bg-sov-dark border border-gray-600 text-sov-light font-semibold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors">
              Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-sov-light-alt pb-3">Alert</th>
                <th className="text-sov-light-alt pb-3">Severity</th>
                <th className="text-sov-light-alt pb-3">Category</th>
                <th className="text-sov-light-alt pb-3">Status</th>
                <th className="text-sov-light-alt pb-3">Created</th>
                <th className="text-sov-light-alt pb-3">Assigned</th>
                <th className="text-sov-light-alt pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {alerts.slice(0, 20).map((alert) => (
                <tr key={alert.id} className="border-b border-gray-700/50 hover:bg-sov-dark/50">
                  <td className="py-4">
                    <div>
                      <p className="text-sov-light font-medium">{alert.title}</p>
                      <p className="text-sov-light-alt text-sm">{alert.description}</p>
                    </div>
                  </td>
                  <td className="py-4">
                    {getSeverityBadge(alert.severity)}
                  </td>
                  <td className="py-4">
                    <span className="text-sov-light text-sm">{alert.category}</span>
                  </td>
                  <td className="py-4">
                    {getStatusBadge(alert.status)}
                  </td>
                  <td className="py-4 text-sov-light text-sm">
                    {new Date(alert.createdAt).toLocaleString()}
                  </td>
                  <td className="py-4">
                    <span className="text-sov-light text-sm">
                      {alert.assignedTo || 'Unassigned'}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex gap-2">
                      {alert.status === 'open' && (
                        <button
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                          className="text-sov-gold hover:text-sov-gold-hover text-sm font-semibold"
                        >
                          Acknowledge
                        </button>
                      )}
                      {(alert.status === 'open' || alert.status === 'acknowledged') && (
                        <>
                          <button
                            onClick={() => handleResolveAlert(alert.id)}
                            className="text-sov-green hover:text-sov-green-hover text-sm font-semibold"
                          >
                            Resolve
                          </button>
                          <button
                            onClick={() => handleEscalateAlert(alert.id)}
                            className="text-sov-red hover:text-sov-red-hover text-sm font-semibold"
                          >
                            Escalate
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {alerts.length === 0 && (
            <div className="text-center py-8 text-sov-light-alt">
              No alerts found matching the current filters
            </div>
          )}
        </div>

        {alerts.length > 20 && (
          <div className="mt-4 text-center">
            <button className="text-sov-accent hover:text-sov-accent-hover font-semibold">
              Load More Alerts
            </button>
          </div>
        )}
      </div>

      {/* Emergency Alert Controls */}
      <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
        <h3 className="text-xl font-semibold text-sov-light mb-4">Emergency Controls</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => alertManagementService.sendEmergencyNotification({
              title: 'Test Emergency Alert',
              description: 'This is a test emergency notification from the dashboard'
            })}
            className="bg-sov-red text-sov-light font-bold py-3 px-6 rounded-lg hover:bg-sov-red-hover transition-colors"
          >
            Send Emergency Alert
          </button>
          <button className="bg-sov-gold text-sov-dark font-bold py-3 px-6 rounded-lg hover:bg-sov-gold-hover transition-colors">
            Activate Incident Mode
          </button>
          <button className="bg-sov-dark border border-sov-red text-sov-red font-bold py-3 px-6 rounded-lg hover:bg-sov-red/10 transition-colors">
            Emergency Shutdown
          </button>
        </div>
      </div>
    </div>
  );
};

// Icon components
const BellIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
  </svg>
);

const AlertIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
  </svg>
);

const TrendingUpIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
  </svg>
);

export default AlertDashboard;