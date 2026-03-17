import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface AuditLogEntry {
  action: string;
  count: number;
  severity: 'low' | 'medium' | 'high';
  timestamp?: string;
  userId?: string;
  entityType?: string;
  details?: string;
}

interface AuditTrailExplorerProps {
  auditLogs: AuditLogEntry[];
  totalEvents: number;
  eventsToday: number;
  className?: string;
}

export const AuditTrailExplorer: React.FC<AuditTrailExplorerProps> = ({
  auditLogs,
  totalEvents,
  eventsToday,
  className = ''
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  // Mock detailed audit data
  const mockDetailedLogs = [
    {
      id: '1',
      timestamp: '2024-11-02T14:30:00Z',
      userId: 'user-123',
      userEmail: 'john.smith@company.com',
      action: 'CUSTOMER_DATA_ACCESSED',
      entityType: 'stripe_customers',
      entityId: 'cust_abc123',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      severity: 'medium',
      details: 'Accessed customer payment information for support case #12345',
      sessionId: 'sess_789xyz',
      changes: {
        before: null,
        after: { payment_method: 'pm_1234567890' }
      }
    },
    {
      id: '2',
      timestamp: '2024-11-02T14:25:00Z',
      userId: 'user-456',
      userEmail: 'sarah.johnson@company.com',
      action: 'PAYMENT_METHOD_REVEALED',
      entityType: 'company_cards',
      entityId: 'card_def456',
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      severity: 'high',
      details: 'Credit card details revealed for employee expense approval',
      sessionId: 'sess_456abc',
      changes: {
        before: { revealed: false },
        after: { revealed: true, revealed_by: 'user-456', reason: 'expense_approval' }
      }
    },
    {
      id: '3',
      timestamp: '2024-11-02T14:20:00Z',
      userId: 'user-789',
      userEmail: 'mike.davis@company.com',
      action: 'COMPLIANCE_CHECKLIST_UPDATED',
      entityType: 'compliance_checklist',
      entityId: 'checklist_001',
      ipAddress: '192.168.1.102',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      severity: 'low',
      details: 'Updated PCI DSS compliance checklist item "Network Security" status to completed',
      sessionId: 'sess_123def',
      changes: {
        before: { status: 'in_progress', completed_date: null },
        after: { status: 'completed', completed_date: '2024-11-02' }
      }
    },
    {
      id: '4',
      timestamp: '2024-11-02T14:15:00Z',
      userId: 'user-123',
      userEmail: 'john.smith@company.com',
      action: 'FAILED_LOGIN_ATTEMPT',
      entityType: 'user_session',
      entityId: 'login_failed_001',
      ipAddress: '192.168.1.105',
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
      severity: 'medium',
      details: 'Failed login attempt - incorrect password',
      sessionId: null,
      changes: {
        before: null,
        after: { attempt_count: 1, lockout_status: false }
      }
    },
    {
      id: '5',
      timestamp: '2024-11-02T14:10:00Z',
      userId: 'system',
      userEmail: 'system@company.com',
      action: 'SECURITY_SCAN_COMPLETED',
      entityType: 'security_scan',
      entityId: 'scan_weekly_001',
      ipAddress: '10.0.0.50',
      userAgent: 'Internal Security Scanner',
      severity: 'low',
      details: 'Weekly vulnerability scan completed - no critical issues found',
      sessionId: null,
      changes: {
        before: { status: 'running' },
        after: { status: 'completed', issues_found: 0, scan_duration: '45 minutes' }
      }
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-sov-red';
      case 'medium': return 'text-sov-gold';
      case 'low': return 'text-sov-green';
      default: return 'text-sov-light-alt';
    }
  };

  const getSeverityBgColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-sov-red/20';
      case 'medium': return 'bg-sov-gold/20';
      case 'low': return 'bg-sov-green/20';
      default: return 'bg-gray-700';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'payment processed': return '💳';
      case 'customer data accessed': return '👤';
      case 'card number revealed': return '🔑';
      case 'settings changed': return '⚙️';
      case 'failed login attempt': return '🚫';
      case 'user created': return '➕';
      case 'compliance checklist updated': return '✅';
      case 'security scan completed': return '🔒';
      default: return '📋';
    }
  };

  // Filter logs based on current selections
  const filteredLogs = mockDetailedLogs.filter(log => {
    if (selectedSeverity !== 'all' && log.severity !== selectedSeverity) return false;
    if (selectedAction !== 'all' && log.action !== selectedAction) return false;
    if (searchQuery && !log.details.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !log.userEmail.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Prepare chart data
  const chartData = auditLogs.map(log => ({
    name: log.action.substring(0, 20) + (log.action.length > 20 ? '...' : ''),
    count: log.count,
    severity: log.severity
  }));

  const severityDistribution = [
    { name: 'High', value: auditLogs.filter(log => log.severity === 'high').length, color: '#ef4444' },
    { name: 'Medium', value: auditLogs.filter(log => log.severity === 'medium').length, color: '#f59e0b' },
    { name: 'Low', value: auditLogs.filter(log => log.severity === 'low').length, color: '#10b981' }
  ];

  // Mock time series data for activity trends
  const activityTrends = [
    { time: '00:00', events: 12 },
    { time: '04:00', events: 8 },
    { time: '08:00', events: 45 },
    { time: '12:00', events: 67 },
    { time: '16:00', events: 89 },
    { time: '20:00', events: 34 },
    { time: '23:59', events: 18 }
  ];

  return (
    <div className={`bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-semibold text-sov-light">Advanced Audit Trail Explorer</h3>
          <p className="text-sm text-sov-light-alt mt-1">
            Comprehensive audit trail search, analysis, and reporting
          </p>
        </div>
        <div className="flex gap-2">
          <select 
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value as any)}
            className="bg-sov-dark border border-gray-600 text-sov-light px-3 py-2 rounded-lg text-sm"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <button className="bg-sov-accent text-sov-dark font-semibold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors">
            Export Logs
          </button>
          <button className="bg-sov-dark-alt border border-gray-600 text-sov-light font-semibold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors">
            Schedule Report
          </button>
        </div>
      </div>

      {/* Overview Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-sov-dark rounded-lg border border-gray-700">
          <div className="text-3xl font-bold text-sov-light">{totalEvents.toLocaleString()}</div>
          <div className="text-sm text-sov-light-alt">Total Events</div>
        </div>
        <div className="text-center p-4 bg-sov-dark rounded-lg border border-gray-700">
          <div className="text-3xl font-bold text-sov-accent">{eventsToday.toLocaleString()}</div>
          <div className="text-sm text-sov-light-alt">Events Today</div>
        </div>
        <div className="text-center p-4 bg-sov-dark rounded-lg border border-gray-700">
          <div className="text-3xl font-bold text-sov-red">
            {auditLogs.filter(log => log.severity === 'high').length}
          </div>
          <div className="text-sm text-sov-light-alt">High Severity</div>
        </div>
        <div className="text-center p-4 bg-sov-dark rounded-lg border border-gray-700">
          <div className="text-3xl font-bold text-sov-gold">
            {auditLogs.filter(log => log.severity === 'medium').length}
          </div>
          <div className="text-sm text-sov-light-alt">Medium Severity</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search audit logs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-sov-dark border border-gray-600 text-sov-light px-3 py-2 rounded-lg flex-1 min-w-[250px]"
        />
        <select
          value={selectedSeverity}
          onChange={(e) => setSelectedSeverity(e.target.value)}
          className="bg-sov-dark border border-gray-600 text-sov-light px-3 py-2 rounded-lg"
        >
          <option value="all">All Severities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          value={selectedAction}
          onChange={(e) => setSelectedAction(e.target.value)}
          className="bg-sov-dark border border-gray-600 text-sov-light px-3 py-2 rounded-lg"
        >
          <option value="all">All Actions</option>
          <option value="CUSTOMER_DATA_ACCESSED">Customer Data Accessed</option>
          <option value="PAYMENT_METHOD_REVEALED">Payment Method Revealed</option>
          <option value="COMPLIANCE_CHECKLIST_UPDATED">Checklist Updated</option>
          <option value="FAILED_LOGIN_ATTEMPT">Failed Login</option>
          <option value="SECURITY_SCAN_COMPLETED">Security Scan</option>
        </select>
      </div>

      {/* Audit Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-sov-dark p-4 rounded-lg border border-gray-700">
          <h4 className="text-lg font-semibold mb-4 text-sov-light">Audit Activity by Type</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
              <XAxis dataKey="name" stroke="#9ca3af" angle={-45} textAnchor="end" height={80} fontSize={12} />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }}
              />
              <Bar 
                dataKey="count" 
                fill="#2dd4bf"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-sov-dark p-4 rounded-lg border border-gray-700">
          <h4 className="text-lg font-semibold mb-4 text-sov-light">Severity Distribution</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={severityDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {severityDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Activity Trends */}
      <div className="bg-sov-dark p-4 rounded-lg border border-gray-700 mb-6">
        <h4 className="text-lg font-semibold mb-4 text-sov-light">Activity Trends (24 Hours)</h4>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={activityTrends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
            <XAxis dataKey="time" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }}
            />
            <Line 
              type="monotone" 
              dataKey="events" 
              stroke="#2dd4bf" 
              strokeWidth={3}
              dot={{ fill: '#2dd4bf', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Audit Logs */}
      <div className="bg-sov-dark rounded-lg border border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <h4 className="text-lg font-semibold text-sov-light">Detailed Audit Logs</h4>
          <p className="text-sm text-sov-light-alt mt-1">
            Showing {filteredLogs.length} of {mockDetailedLogs.length} events
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-sov-dark-alt border-b border-gray-700">
              <tr>
                <th className="text-left p-3 text-sov-light font-semibold">Timestamp</th>
                <th className="text-left p-3 text-sov-light font-semibold">Action</th>
                <th className="text-left p-3 text-sov-light font-semibold">User</th>
                <th className="text-left p-3 text-sov-light font-semibold">Entity</th>
                <th className="text-left p-3 text-sov-light font-semibold">Severity</th>
                <th className="text-left p-3 text-sov-light font-semibold">IP Address</th>
                <th className="text-left p-3 text-sov-light font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log.id} className="border-b border-gray-700 hover:bg-sov-dark/50">
                  <td className="p-3 text-sov-light-alt text-sm">
                    {new Date(log.timestamp!).toLocaleString()}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center space-x-2">
                      <span>{getActionIcon(log.action)}</span>
                      <span className="text-sov-light font-semibold text-sm">{log.action}</span>
                    </div>
                  </td>
                  <td className="p-3 text-sov-light text-sm">
                    <div>
                      <div className="font-semibold">{log.userEmail}</div>
                      <div className="text-sov-light-alt">{log.userId}</div>
                    </div>
                  </td>
                  <td className="p-3 text-sov-light text-sm">
                    <div>
                      <div>{log.entityType}</div>
                      <div className="text-sov-light-alt">{log.entityId}</div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getSeverityBgColor(log.severity)} ${getSeverityColor(log.severity)}`}>
                      {log.severity}
                    </span>
                  </td>
                  <td className="p-3 text-sov-light-alt text-sm">{log.ipAddress}</td>
                  <td className="p-3">
                    <button 
                      onClick={() => setSelectedLog(log)}
                      className="text-sov-accent hover:text-sov-accent/80 text-sm"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-sov-dark-alt max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-lg border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold text-sov-light">Audit Log Details</h3>
                  <p className="text-sov-light-alt">Event ID: {selectedLog.id}</p>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-sov-light hover:text-sov-light/80"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-sov-light mb-3">Event Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-sov-light-alt">Timestamp:</span>
                      <span className="text-sov-light font-semibold">
                        {new Date(selectedLog.timestamp!).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sov-light-alt">Action:</span>
                      <span className="text-sov-light font-semibold">{selectedLog.action}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sov-light-alt">Severity:</span>
                      <span className={`font-semibold ${getSeverityColor(selectedLog.severity)}`}>
                        {selectedLog.severity}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sov-light-alt">Entity Type:</span>
                      <span className="text-sov-light font-semibold">{selectedLog.entityType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sov-light-alt">Entity ID:</span>
                      <span className="text-sov-light font-semibold">{selectedLog.entityId}</span>
                    </div>
                  </div>

                  <h4 className="font-semibold text-sov-light mb-3 mt-6">User Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-sov-light-alt">User ID:</span>
                      <span className="text-sov-light font-semibold">{selectedLog.userId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sov-light-alt">Email:</span>
                      <span className="text-sov-light font-semibold">{selectedLog.userEmail}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sov-light-alt">IP Address:</span>
                      <span className="text-sov-light font-semibold">{selectedLog.ipAddress}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sov-light-alt">Session ID:</span>
                      <span className="text-sov-light font-semibold">{selectedLog.sessionId || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-sov-light mb-3">Event Details</h4>
                  <p className="text-sm text-sov-light-alt mb-4">{selectedLog.details}</p>

                  <h4 className="font-semibold text-sov-light mb-3">Changes</h4>
                  <div className="bg-sov-dark p-3 rounded-lg border border-gray-700">
                    <div className="mb-3">
                      <h5 className="text-sm font-semibold text-sov-light mb-2">Before:</h5>
                      <pre className="text-xs text-sov-light-alt overflow-x-auto">
                        {JSON.stringify(selectedLog.changes.before, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <h5 className="text-sm font-semibold text-sov-light mb-2">After:</h5>
                      <pre className="text-xs text-sov-light-alt overflow-x-auto">
                        {JSON.stringify(selectedLog.changes.after, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-700">
                <button className="bg-sov-accent text-sov-dark font-semibold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors">
                  Export Details
                </button>
                <button className="bg-sov-dark-alt border border-gray-600 text-sov-light font-semibold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors">
                  Create Alert
                </button>
                <button className="bg-sov-dark-alt border border-gray-600 text-sov-light font-semibold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors">
                  Investigate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
