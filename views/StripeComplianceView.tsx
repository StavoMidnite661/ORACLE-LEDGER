import React, { useState, useMemo } from 'react';
import { KpiCard } from '../components/shared/KpiCard';
import type { ComplianceChecklistItem, PciAuditLogEntry, AchReturn } from '../types';
import { Modal } from '../components/shared/Modal';

interface StripeComplianceViewProps {
  complianceItems?: ComplianceChecklistItem[];
  auditLogs?: PciAuditLogEntry[];
  achReturns?: AchReturn[];
}

type ComplianceTab = 'overview' | 'checklist' | 'audit-logs' | 'reports' | 'risk-assessment' | 'documentation';

export const StripeComplianceView: React.FC<StripeComplianceViewProps> = ({
  complianceItems = mockComplianceItems,
  auditLogs = mockAuditLogs,
  achReturns = mockAchReturns,
}) => {
  const [activeTab, setActiveTab] = useState<ComplianceTab>('overview');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<PciAuditLogEntry | null>(null);
  const [selectedItem, setSelectedItem] = useState<ComplianceChecklistItem | null>(null);

  // Calculate compliance metrics
  const complianceMetrics = useMemo(() => {
    const totalItems = complianceItems.length;
    const completedItems = complianceItems.filter(item => item.status === 'completed').length;
    const inProgressItems = complianceItems.filter(item => item.status === 'in_progress').length;
    const failedItems = complianceItems.filter(item => item.status === 'failed').length;
    const complianceScore = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    // Risk assessment
    const highRiskItems = complianceItems.filter(item => item.riskLevel === 'high' || item.riskLevel === 'critical').length;
    const mediumRiskItems = complianceItems.filter(item => item.riskLevel === 'medium').length;
    const lowRiskItems = complianceItems.filter(item => item.riskLevel === 'low').length;

    // Recent audit activity
    const recentAudits = auditLogs.filter(log => {
      const logDate = new Date(log.createdAt);
      const daysAgo = (Date.now() - logDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo <= 30;
    }).length;

    return {
      totalItems,
      completedItems,
      inProgressItems,
      failedItems,
      complianceScore,
      highRiskItems,
      mediumRiskItems,
      lowRiskItems,
      recentAudits,
    };
  }, [complianceItems, auditLogs]);

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      completed: 'bg-sov-green/20 text-sov-green',
      in_progress: 'bg-sov-yellow/20 text-sov-yellow',
      not_started: 'bg-gray-500/20 text-gray-400',
      failed: 'bg-sov-red/20 text-sov-red',
      exempt: 'bg-sov-blue/20 text-sov-blue',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[status as keyof typeof statusColors] || 'bg-gray-500/20 text-gray-400'}`}>
        {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </span>
    );
  };

  const getRiskBadge = (riskLevel: string) => {
    const riskColors = {
      low: 'bg-sov-green/20 text-sov-green',
      medium: 'bg-sov-yellow/20 text-sov-yellow',
      high: 'bg-sov-orange/20 text-sov-orange',
      critical: 'bg-sov-red/20 text-sov-red',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${riskColors[riskLevel as keyof typeof riskColors] || 'bg-gray-500/20 text-gray-400'}`}>
        {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
      </span>
    );
  };

  const generateComplianceReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      timeframe: selectedTimeframe,
      complianceScore: complianceMetrics.complianceScore,
      totalItems: complianceMetrics.totalItems,
      completedItems: complianceMetrics.completedItems,
      highRiskItems: complianceMetrics.highRiskItems,
      auditLogsCount: auditLogs.length,
      recommendations: [
        'Complete pending KYC verification procedures',
        'Review and update data retention policies',
        'Enhance audit logging for sensitive operations',
        'Schedule regular compliance training sessions',
      ],
    };

    // In a real implementation, this would generate a PDF or download as CSV
    console.log('Compliance Report:', reportData);
    setIsReportModalOpen(false);
    alert('Compliance report generated successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-sov-light">Compliance Management</h1>
        <div className="flex space-x-2">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value as any)}
            className="bg-sov-dark-alt border border-gray-600 rounded-lg px-3 py-2 text-sov-light"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="bg-sov-accent text-sov-dark font-bold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors"
          >
            Generate Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Compliance Score"
          value={`${Math.round(complianceMetrics.complianceScore)}%`}
          icon={<TargetIcon />}
          trend={complianceMetrics.complianceScore >= 90 ? "Excellent" : complianceMetrics.complianceScore >= 75 ? "Good" : "Needs Attention"}
          trendDirection={complianceMetrics.complianceScore >= 75 ? "up" : "down"}
        />
        <KpiCard
          title="Completed Items"
          value={`${complianceMetrics.completedItems}/${complianceMetrics.totalItems}`}
          icon={<CheckIcon />}
        />
        <KpiCard
          title="High Risk Items"
          value={complianceMetrics.highRiskItems.toString()}
          icon={<AlertTriangleIcon />}
          trend={complianceMetrics.highRiskItems > 0 ? "Review Required" : "All Clear"}
          trendDirection={complianceMetrics.highRiskItems === 0 ? "up" : "neutral"}
        />
        <KpiCard
          title="Audit Events"
          value={complianceMetrics.recentAudits.toString()}
          icon={<FileTextIcon />}
          trend="Last 30 days"
          trendDirection="neutral"
        />
      </div>

      {/* Tab Navigation */}
      <div className="bg-sov-dark-alt rounded-lg p-1 border border-gray-700">
        <nav className="flex space-x-1 flex-wrap">
          {[
            { id: 'overview', label: 'Overview', icon: <DashboardIcon /> },
            { id: 'checklist', label: 'Checklist', icon: <CheckIcon /> },
            { id: 'audit-logs', label: 'Audit Logs', icon: <FileTextIcon /> },
            { id: 'reports', label: 'Reports', icon: <DocumentIcon /> },
            { id: 'risk-assessment', label: 'Risk Assessment', icon: <ShieldAlertIcon /> },
            { id: 'documentation', label: 'Documentation', icon: <BookIcon /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ComplianceTab)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-semibold transition-colors text-sm ${
                activeTab === tab.id
                  ? 'bg-sov-accent text-sov-dark'
                  : 'text-sov-light hover:bg-sov-dark hover:text-sov-accent'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-sov-light">Compliance Overview</h3>
            
            {/* Compliance Progress */}
            <div className="bg-sov-dark p-6 rounded-lg border border-gray-600">
              <h4 className="font-semibold text-sov-light mb-4">Overall Compliance Status</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sov-light">Compliance Score</span>
                  <span className="text-2xl font-bold text-sov-accent">{Math.round(complianceMetrics.complianceScore)}%</span>
                </div>
                <div className="w-full bg-sov-dark-alt rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      complianceMetrics.complianceScore >= 90 ? 'bg-sov-green' :
                      complianceMetrics.complianceScore >= 75 ? 'bg-sov-yellow' : 'bg-sov-red'
                    }`}
                    style={{ width: `${complianceMetrics.complianceScore}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Risk Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-sov-dark p-4 rounded-lg border border-gray-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sov-light-alt text-sm">Low Risk</p>
                    <p className="text-2xl font-bold text-sov-green">{complianceMetrics.lowRiskItems}</p>
                  </div>
                  <ShieldIcon className="text-sov-green h-8 w-8" />
                </div>
              </div>
              
              <div className="bg-sov-dark p-4 rounded-lg border border-gray-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sov-light-alt text-sm">Medium Risk</p>
                    <p className="text-2xl font-bold text-sov-yellow">{complianceMetrics.mediumRiskItems}</p>
                  </div>
                  <ShieldAlertIcon className="text-sov-yellow h-8 w-8" />
                </div>
              </div>
              
              <div className="bg-sov-dark p-4 rounded-lg border border-gray-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sov-light-alt text-sm">High Risk</p>
                    <p className="text-2xl font-bold text-sov-red">{complianceMetrics.highRiskItems}</p>
                  </div>
                  <AlertTriangleIcon className="text-sov-red h-8 w-8" />
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h4 className="text-lg font-semibold text-sov-light mb-4">Recent Compliance Activity</h4>
              <div className="space-y-3">
                {auditLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="bg-sov-dark p-4 rounded-lg border border-gray-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileTextIcon />
                        <div>
                          <p className="font-semibold text-sov-light">{log.actionType}</p>
                          <p className="text-sm text-sov-light-alt">{log.tableName} • {formatDate(log.createdAt)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-sov-light-alt">{log.userEmail || 'System'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ACH Returns */}
            {achReturns.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-sov-light mb-4">Recent ACH Returns</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="p-3">Return Code</th>
                        <th className="p-3">Reason</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {achReturns.slice(0, 5).map((achReturn) => (
                        <tr key={achReturn.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                          <td className="p-3 font-mono text-sov-accent">{achReturn.returnCode}</td>
                          <td className="p-3 text-sov-light">{achReturn.returnReason}</td>
                          <td className="p-3 text-sov-light-alt">{formatDate(achReturn.returnedAt)}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              achReturn.corrected ? 'bg-sov-green/20 text-sov-green' : 'bg-sov-yellow/20 text-sov-yellow'
                            }`}>
                              {achReturn.corrected ? 'Resolved' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'checklist' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-sov-light">Compliance Checklist</h3>
              <button className="bg-sov-accent text-sov-dark font-bold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors">
                Add Item
              </button>
            </div>
            
            <div className="space-y-3">
              {complianceItems.map((item) => (
                <div key={item.id} className="bg-sov-dark p-4 rounded-lg border border-gray-600 hover:border-sov-accent/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-sov-light">{item.itemDescription}</h4>
                        {getStatusBadge(item.status)}
                        {getRiskBadge(item.riskLevel)}
                      </div>
                      <p className="text-sov-light-alt text-sm mb-2">{item.requirement}</p>
                      <div className="flex items-center space-x-4 text-sm text-sov-light-alt">
                        <span>Standard: {item.regulatoryStandard}</span>
                        {item.dueDate && <span>Due: {new Date(item.dueDate).toLocaleDateString()}</span>}
                        {item.assignedTo && <span>Assigned: {item.assignedTo}</span>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="text-sov-blue hover:text-sov-blue-hover transition-colors"
                      >
                        View Details
                      </button>
                      <button className="text-sov-accent hover:text-sov-accent-hover transition-colors">
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'audit-logs' && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-sov-light">Audit Logs</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">User</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Table</th>
                    <th className="p-3">IP Address</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.slice(0, 20).map((log) => (
                    <tr key={log.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-3 text-sov-light-alt">{formatDate(log.createdAt)}</td>
                      <td className="p-3 text-sov-light">{log.userEmail || 'System'}</td>
                      <td className="p-3 text-sov-light">{log.actionType}</td>
                      <td className="p-3 text-sov-light-alt">{log.tableName}</td>
                      <td className="p-3 text-sov-light-alt font-mono">{log.ipAddress || '-'}</td>
                      <td className="p-3">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-sov-accent hover:text-sov-accent-hover transition-colors"
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
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-sov-light">Compliance Reports</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-sov-dark p-6 rounded-lg border border-gray-600 hover:border-sov-accent cursor-pointer transition-colors">
                <div className="flex items-center space-x-3 mb-4">
                  <DocumentIcon className="text-sov-accent h-8 w-8" />
                  <div>
                    <h4 className="font-semibold text-sov-light">NACHA Compliance</h4>
                    <p className="text-sov-light-alt text-sm">ACH processing compliance report</p>
                  </div>
                </div>
                <button className="w-full bg-sov-accent/10 text-sov-accent font-bold py-2 px-4 rounded-lg hover:bg-sov-accent/20 transition-colors">
                  Generate Report
                </button>
              </div>

              <div className="bg-sov-dark p-6 rounded-lg border border-gray-600 hover:border-sov-blue cursor-pointer transition-colors">
                <div className="flex items-center space-x-3 mb-4">
                  <ShieldIcon className="text-sov-blue h-8 w-8" />
                  <div>
                    <h4 className="font-semibold text-sov-light">PCI DSS Assessment</h4>
                    <p className="text-sov-light-alt text-sm">Payment card data security</p>
                  </div>
                </div>
                <button className="w-full bg-sov-blue/10 text-sov-blue font-bold py-2 px-4 rounded-lg hover:bg-sov-blue/20 transition-colors">
                  Generate Report
                </button>
              </div>

              <div className="bg-sov-dark p-6 rounded-lg border border-gray-600 hover:border-sov-green cursor-pointer transition-colors">
                <div className="flex items-center space-x-3 mb-4">
                  <FileTextIcon className="text-sov-green h-8 w-8" />
                  <div>
                    <h4 className="font-semibold text-sov-light">Risk Assessment</h4>
                    <p className="text-sov-light-alt text-sm">Comprehensive risk analysis</p>
                  </div>
                </div>
                <button className="w-full bg-sov-green/10 text-sov-green font-bold py-2 px-4 rounded-lg hover:bg-sov-green/20 transition-colors">
                  Generate Report
                </button>
              </div>
            </div>

            {/* Report History */}
            <div className="bg-sov-dark p-6 rounded-lg border border-gray-600">
              <h4 className="font-semibold text-sov-light mb-4">Recent Reports</h4>
              <div className="space-y-3">
                {[
                  { name: 'Monthly Compliance Summary', date: '2024-03-01', type: 'Monthly', status: 'Completed' },
                  { name: 'PCI DSS Assessment Q1', date: '2024-02-28', type: 'Quarterly', status: 'Completed' },
                  { name: 'NACHA Audit Log', date: '2024-02-25', type: 'Weekly', status: 'Completed' },
                ].map((report, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-sov-dark-alt rounded-lg">
                    <div>
                      <p className="font-semibold text-sov-light">{report.name}</p>
                      <p className="text-sov-light-alt text-sm">{report.date} • {report.type}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="bg-sov-green/20 text-sov-green px-2 py-1 rounded-full text-xs font-semibold">
                        {report.status}
                      </span>
                      <button className="text-sov-accent hover:text-sov-accent-hover transition-colors">
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'risk-assessment' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-sov-light">Risk Assessment</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-sov-dark p-6 rounded-lg border border-gray-600">
                <h4 className="font-semibold text-sov-light mb-4">Risk Categories</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sov-light">Payment Processing</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-sov-dark-alt rounded-full h-2">
                        <div className="bg-sov-yellow h-2 rounded-full" style={{ width: '60%' }}></div>
                      </div>
                      <span className="text-sov-yellow">Medium</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sov-light">Data Security</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-sov-dark-alt rounded-full h-2">
                        <div className="bg-sov-green h-2 rounded-full" style={{ width: '90%' }}></div>
                      </div>
                      <span className="text-sov-green">Low</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sov-light">Compliance</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-sov-dark-alt rounded-full h-2">
                        <div className="bg-sov-green h-2 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                      <span className="text-sov-green">Low</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sov-light">Operational</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-sov-dark-alt rounded-full h-2">
                        <div className="bg-sov-red h-2 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                      <span className="text-sov-red">High</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-sov-dark p-6 rounded-lg border border-gray-600">
                <h4 className="font-semibold text-sov-light mb-4">Risk Mitigation Actions</h4>
                <div className="space-y-3">
                  {[
                    { action: 'Implement enhanced monitoring for ACH returns', priority: 'High', status: 'In Progress' },
                    { action: 'Complete PCI DSS compliance training', priority: 'Medium', status: 'Pending' },
                    { action: 'Review and update security policies', priority: 'High', status: 'Completed' },
                    { action: 'Establish incident response procedures', priority: 'Medium', status: 'In Progress' },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-sov-dark-alt rounded-lg">
                      <div>
                        <p className="font-semibold text-sov-light">{item.action}</p>
                        <p className="text-sov-light-alt text-sm">{item.priority} Priority</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        item.status === 'Completed' ? 'bg-sov-green/20 text-sov-green' :
                        item.status === 'In Progress' ? 'bg-sov-yellow/20 text-sov-yellow' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documentation' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-sov-light">Regulatory Documentation</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-sov-light">Compliance Policies</h4>
                {[
                  { name: 'NACHA Operating Rules', lastUpdated: '2024-01-15', status: 'Current' },
                  { name: 'PCI DSS Data Security Standard', lastUpdated: '2024-02-01', status: 'Current' },
                  { name: 'AML/KYC Procedures', lastUpdated: '2024-01-30', status: 'Review Needed' },
                  { name: 'Data Retention Policy', lastUpdated: '2023-12-15', status: 'Current' },
                ].map((doc, index) => (
                  <div key={index} className="bg-sov-dark p-4 rounded-lg border border-gray-600">
                    <div className="flex justify-between items-center">
                      <div>
                        <h5 className="font-semibold text-sov-light">{doc.name}</h5>
                        <p className="text-sov-light-alt text-sm">Updated: {doc.lastUpdated}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          doc.status === 'Current' ? 'bg-sov-green/20 text-sov-green' : 'bg-sov-yellow/20 text-sov-yellow'
                        }`}>
                          {doc.status}
                        </span>
                        <button className="text-sov-accent hover:text-sov-accent-hover transition-colors">
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-sov-light">Training Materials</h4>
                {[
                  { name: 'Compliance Basics Training', type: 'Interactive', duration: '30 min' },
                  { name: 'NACHA Rules Overview', type: 'Video', duration: '45 min' },
                  { name: 'PCI DSS Implementation', type: 'Documentation', duration: 'Self-paced' },
                  { name: 'Security Awareness', type: 'Quiz', duration: '15 min' },
                ].map((training, index) => (
                  <div key={index} className="bg-sov-dark p-4 rounded-lg border border-gray-600">
                    <div className="flex justify-between items-center">
                      <div>
                        <h5 className="font-semibold text-sov-light">{training.name}</h5>
                        <p className="text-sov-light-alt text-sm">{training.type} • {training.duration}</p>
                      </div>
                      <button className="bg-sov-blue/20 text-sov-blue font-bold py-2 px-4 rounded-lg hover:bg-sov-blue/30 transition-colors">
                        Start
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title="Generate Compliance Report">
        <div className="text-sov-light space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Report Configuration</h4>
            <div className="space-y-2">
              <div>
                <label className="block text-sm font-medium mb-1">Report Type</label>
                <select className="w-full bg-sov-dark-alt border border-gray-600 rounded-lg px-3 py-2">
                  <option>Comprehensive Compliance Report</option>
                  <option>NACHA Compliance Summary</option>
                  <option>PCI DSS Assessment</option>
                  <option>Risk Assessment Report</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date Range</label>
                <select value={selectedTimeframe} onChange={(e) => setSelectedTimeframe(e.target.value as any)} className="w-full bg-sov-dark-alt border border-gray-600 rounded-lg px-3 py-2">
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="1y">Last year</option>
                </select>
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-4 space-x-2">
            <button onClick={() => setIsReportModalOpen(false)} className="bg-sov-dark-alt border border-gray-600 text-sov-light font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors">
              Cancel
            </button>
            <button onClick={generateComplianceReport} className="bg-sov-accent text-sov-dark font-bold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors">
              Generate Report
            </button>
          </div>
        </div>
      </Modal>

      {selectedLog && (
        <Modal isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} title="Audit Log Details">
          <div className="text-sov-light space-y-4">
            <div>
              <h4 className="font-semibold">Action Details</h4>
              <p className="text-sov-light-alt">{selectedLog.actionType}</p>
            </div>
            <div>
              <h4 className="font-semibold">User Information</h4>
              <p className="text-sov-light-alt">{selectedLog.userEmail || 'System User'}</p>
              <p className="text-sov-light-alt">{selectedLog.ipAddress || 'N/A'}</p>
            </div>
            <div>
              <h4 className="font-semibold">Timestamp</h4>
              <p className="text-sov-light-alt">{formatDate(selectedLog.createdAt)}</p>
            </div>
            {selectedLog.oldValues && (
              <div>
                <h4 className="font-semibold">Previous Values</h4>
                <pre className="bg-sov-dark p-2 rounded text-sm">{selectedLog.oldValues}</pre>
              </div>
            )}
          </div>
        </Modal>
      )}

      {selectedItem && (
        <Modal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} title="Compliance Item Details">
          <div className="text-sov-light space-y-4">
            <div>
              <h4 className="font-semibold">{selectedItem.itemDescription}</h4>
              <p className="text-sov-light-alt">{selectedItem.requirement}</p>
            </div>
            <div className="flex space-x-2">
              {getStatusBadge(selectedItem.status)}
              {getRiskBadge(selectedItem.riskLevel)}
            </div>
            <div>
              <h4 className="font-semibold">Regulatory Standard</h4>
              <p className="text-sov-light-alt">{selectedItem.regulatoryStandard}</p>
            </div>
            {selectedItem.dueDate && (
              <div>
                <h4 className="font-semibold">Due Date</h4>
                <p className="text-sov-light-alt">{new Date(selectedItem.dueDate).toLocaleDateString()}</p>
              </div>
            )}
            {selectedItem.assignedTo && (
              <div>
                <h4 className="font-semibold">Assigned To</h4>
                <p className="text-sov-light-alt">{selectedItem.assignedTo}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

// Mock data
const mockComplianceItems: ComplianceChecklistItem[] = [
  {
    id: '1',
    checklistType: 'NACHA',
    itemDescription: 'Verify customer authorization for ACH debits',
    requirement: 'Maintain signed authorization for all ACH transactions',
    status: 'completed',
    regulatoryStandard: 'NACHA',
    riskLevel: 'high',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-03-01'),
  },
  {
    id: '2',
    checklistType: 'PCI_DSS',
    itemDescription: 'Secure cardholder data encryption',
    requirement: 'All cardholder data must be encrypted in transit and at rest',
    status: 'completed',
    regulatoryStandard: 'PCI_DSS',
    riskLevel: 'critical',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-02-15'),
  },
  {
    id: '3',
    checklistType: 'AML',
    itemDescription: 'Customer due diligence implementation',
    requirement: 'Complete KYC verification for all new customers',
    status: 'in_progress',
    regulatoryStandard: 'AML',
    riskLevel: 'medium',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-03-15'),
  },
];

const mockAuditLogs: PciAuditLogEntry[] = [
  {
    id: '1',
    actionType: 'CUSTOMER_DATA_ACCESSED',
    tableName: 'stripe_customers',
    recordId: 'cust_123',
    userId: 'user_456',
    userEmail: 'admin@oracle-ledger.com',
    ipAddress: '192.168.1.100',
    sensitiveFieldsAccessed: ['email', 'phone', 'address'],
    dataMasked: true,
    accessPurpose: 'Customer support',
    createdAt: new Date('2024-03-15T10:30:00Z'),
  },
  {
    id: '2',
    actionType: 'PAYMENT_METHOD_ADDED',
    tableName: 'stripe_payment_methods',
    recordId: 'pm_789',
    userId: 'user_456',
    userEmail: 'admin@oracle-ledger.com',
    ipAddress: '192.168.1.100',
    dataMasked: false,
    createdAt: new Date('2024-03-15T09:15:00Z'),
  },
];

const mockAchReturns: AchReturn[] = [
  {
    id: '1',
    achPaymentId: 'payment_123',
    returnCode: 'R01',
    returnReason: 'Insufficient Funds',
    returnedAt: new Date('2024-03-10'),
    corrected: false,
    createdAt: new Date('2024-03-10'),
  },
];

// Icon components
const TargetIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

const AlertTriangleIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const DocumentIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const BookIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);