import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, RadialBarChart, RadialBar, AreaChart, Area,
  ComposedChart, ScatterChart, Scatter
} from 'recharts';
import type { ComplianceChecklistItem, PciAuditLogEntry } from '../../types';
import { ComplianceHealthMonitor } from '../compliance/ComplianceHealthMonitor';
import { RegulatoryCalendar } from '../compliance/RegulatoryCalendar';
import { RiskAssessmentTool } from '../compliance/RiskAssessmentTool';
import { ComplianceAlerts } from '../compliance/ComplianceAlerts';
import { ComplianceTraining } from '../compliance/ComplianceTraining';
import { PolicyManagement } from '../compliance/PolicyManagement';
import { AuditTrailExplorer } from '../compliance/AuditTrailExplorer';

// Enhanced compliance data with advanced metrics
const mockComplianceData = {
  overallHealthScore: 94.2,
  healthScoreBreakdown: {
    pciCompliance: 98.5,
    nachaCompliance: 96.8,
    amlCompliance: 92.1,
    soxCompliance: 95.3,
    bankingRegulations: 91.7
  },
  realTimeMetrics: {
    totalTransactions: 12847,
    compliantTransactions: 12592,
    nonCompliantTransactions: 98,
    pendingReviewTransactions: 157,
    complianceRate: 98.2,
    avgResponseTime: 1.8,
    riskScore: 2.1
  },
  pciComplianceStatus: {
    level: 'Level 1',
    status: 'Compliant',
    lastAssessment: '2024-10-15',
    nextAssessment: '2025-10-15',
    score: 98.5,
    requirements: {
      completed: 47,
      total: 48,
      pending: 1,
      failed: 0
    },
    heatMapData: [
      { category: 'Network Security', score: 95, risk: 'low', requirements: 12 },
      { category: 'Data Protection', score: 98, risk: 'low', requirements: 8 },
      { category: 'Access Control', score: 92, risk: 'medium', requirements: 15 },
      { category: 'Monitoring', score: 97, risk: 'low', requirements: 6 },
      { category: 'Incident Response', score: 89, risk: 'medium', requirements: 7 }
    ]
  },
  auditLogSummary: {
    totalEvents: 2847,
    eventsToday: 156,
    eventsByAction: [
      { action: 'Card Number Revealed', count: 23, severity: 'high' },
      { action: 'Payment Processed', count: 892, severity: 'low' },
      { action: 'ACH Payment Created', count: 445, severity: 'medium' },
      { action: 'Settings Changed', count: 67, severity: 'medium' },
      { action: 'Failed Login Attempt', count: 12, severity: 'high' },
      { action: 'User Created', count: 8, severity: 'low' }
    ]
  },
  complianceChecklist: [
    {
      id: 'check-001',
      category: 'PCI DSS',
      requirement: 'Encrypt transmission of cardholder data',
      description: 'All transmission of cardholder data must be encrypted',
      status: 'completed',
      priority: 'critical',
      assignedTo: 'Security Team',
      completedDate: '2024-09-15',
      evidence: 'SSL/TLS certificates verified',
      regulatoryStandard: 'PCI_DSS'
    },
    {
      id: 'check-002',
      category: 'PCI DSS',
      requirement: 'Maintain secure network',
      description: 'Firewall configuration must be maintained',
      status: 'completed',
      priority: 'critical',
      assignedTo: 'IT Team',
      completedDate: '2024-09-20',
      evidence: 'Firewall rules documented and tested',
      regulatoryStandard: 'PCI_DSS'
    },
    {
      id: 'check-003',
      category: 'NACHA',
      requirement: 'Verify authorization for ACH entries',
      description: 'All ACH entries must have proper authorization',
      status: 'in_progress',
      priority: 'high',
      assignedTo: 'Operations Team',
      dueDate: '2024-11-15',
      progress: 75,
      regulatoryStandard: 'NACHA'
    },
    {
      id: 'check-004',
      category: 'AML',
      requirement: 'Customer due diligence',
      description: 'Enhanced due diligence for high-risk customers',
      status: 'pending',
      priority: 'high',
      assignedTo: 'Compliance Team',
      dueDate: '2024-11-30',
      progress: 0,
      regulatoryStandard: 'AML'
    },
    {
      id: 'check-005',
      category: 'SOX',
      requirement: 'Internal controls documentation',
      description: 'Document all internal controls for financial reporting',
      status: 'completed',
      priority: 'medium',
      assignedTo: 'Finance Team',
      completedDate: '2024-10-01',
      evidence: 'Controls documented in SharePoint',
      regulatoryStandard: 'SOX'
    },
    {
      id: 'check-006',
      category: 'PCI DSS',
      requirement: 'Regular security testing',
      description: 'Conduct quarterly penetration testing',
      status: 'pending',
      priority: 'high',
      assignedTo: 'Security Team',
      dueDate: '2024-12-01',
      progress: 0,
      regulatoryStandard: 'PCI_DSS'
    }
  ],
  riskAssessment: {
    overallRisk: 'Low',
    riskScore: 2.1,
    riskFactors: [
      { factor: 'Data Security', score: 1.5, status: 'low' },
      { factor: 'Operational Risk', score: 2.0, status: 'low' },
      { factor: 'Compliance Risk', score: 2.8, status: 'medium' },
      { factor: 'Financial Risk', score: 1.9, status: 'low' },
      { factor: 'Technology Risk', score: 2.3, status: 'low' }
    ],
    trends: [
      { month: 'Jun', riskScore: 2.8 },
      { month: 'Jul', riskScore: 2.6 },
      { month: 'Aug', riskScore: 2.4 },
      { month: 'Sep', riskScore: 2.2 },
      { month: 'Oct', riskScore: 2.1 },
      { month: 'Nov', score: 2.1 }
    ]
  },
  regulatoryReporting: [
    {
      id: 'rpt-001',
      reportType: 'PCI Annual Assessment',
      dueDate: '2024-12-31',
      status: 'in_progress',
      assignedTo: 'Security Team',
      progress: 60,
      regulatoryBody: 'PCI Security Standards Council'
    },
    {
      id: 'rpt-002',
      reportType: 'NACHA Annual Compliance',
      dueDate: '2024-11-30',
      status: 'completed',
      assignedTo: 'Operations Team',
      progress: 100,
      regulatoryBody: 'NACHA Operating Rules'
    },
    {
      id: 'rpt-003',
      reportType: 'AML Suspicious Activity Report',
      dueDate: '2024-11-15',
      status: 'pending',
      assignedTo: 'Compliance Team',
      progress: 0,
      regulatoryBody: 'Financial Crimes Enforcement Network'
    },
    {
      id: 'rpt-004',
      reportType: 'SOX Internal Controls',
      dueDate: '2024-12-15',
      status: 'not_started',
      assignedTo: 'Finance Team',
      progress: 0,
      regulatoryBody: 'Securities and Exchange Commission'
    }
  ],
  alertNotifications: [
    {
      id: 'alert-001',
      type: 'warning',
      title: 'PCI Assessment Due',
      description: 'Annual PCI DSS assessment is due in 45 days',
      timestamp: '2024-11-02T14:30:00Z',
      severity: 'medium',
      assignedTo: 'Security Team',
      category: 'assessment'
    },
    {
      id: 'alert-002',
      type: 'info',
      title: 'Compliance Checklist Update',
      description: '3 new checklist items have been added for Q4',
      timestamp: '2024-11-02T10:15:00Z',
      severity: 'low',
      assignedTo: 'Compliance Team',
      category: 'checklist'
    },
    {
      id: 'alert-003',
      type: 'error',
      title: 'Failed Security Scan',
      description: 'Weekly vulnerability scan found 2 high-severity issues',
      timestamp: '2024-11-02T08:00:00Z',
      severity: 'high',
      assignedTo: 'IT Team',
      category: 'security'
    },
    {
      id: 'alert-004',
      type: 'warning',
      title: 'NACHA Rule Update',
      description: 'New NACHA operating rules take effect next month',
      timestamp: '2024-11-01T16:20:00Z',
      severity: 'medium',
      assignedTo: 'Operations Team',
      category: 'regulatory'
    },
    {
      id: 'alert-005',
      type: 'info',
      title: 'Training Deadline Approaching',
      description: 'AML training deadline in 5 days - 3 users pending',
      timestamp: '2024-10-31T09:00:00Z',
      severity: 'medium',
      assignedTo: 'HR Team',
      category: 'training'
    }
  ],
  complianceTrends: [
    { month: 'Jun', score: 89.2, violations: 12, training: 85 },
    { month: 'Jul', score: 90.8, violations: 9, training: 88 },
    { month: 'Aug', score: 92.1, violations: 7, training: 92 },
    { month: 'Sep', score: 93.5, violations: 5, training: 94 },
    { month: 'Oct', score: 94.2, violations: 4, training: 96 },
    { month: 'Nov', score: 94.2, violations: 3, training: 98 }
  ],
  riskMatrix: [
    { impact: 'high', probability: 'low', risk: 'low', count: 2 },
    { impact: 'high', probability: 'medium', risk: 'medium', count: 1 },
    { impact: 'high', probability: 'high', risk: 'high', count: 0 },
    { impact: 'medium', probability: 'low', risk: 'low', count: 5 },
    { impact: 'medium', probability: 'medium', risk: 'medium', count: 3 },
    { impact: 'medium', probability: 'high', risk: 'high', count: 1 },
    { impact: 'low', probability: 'low', risk: 'low', count: 8 },
    { impact: 'low', probability: 'medium', risk: 'low', count: 2 },
    { impact: 'low', probability: 'high', risk: 'low', count: 1 }
  ],
  complianceTemplates: [
    {
      id: 'template-001',
      name: 'Quarterly PCI Assessment',
      type: 'assessment',
      regulatoryStandard: 'PCI_DSS',
      description: 'Standard quarterly PCI DSS compliance assessment template',
      lastUsed: '2024-10-15',
      usageCount: 12,
      completionRate: 100
    },
    {
      id: 'template-002',
      name: 'Annual AML Review',
      type: 'review',
      regulatoryStandard: 'AML',
      description: 'Annual anti-money laundering compliance review',
      lastUsed: '2024-01-15',
      usageCount: 3,
      completionRate: 100
    },
    {
      id: 'template-003',
      name: 'NACHA Rules Compliance',
      type: 'checklist',
      regulatoryStandard: 'NACHA',
      description: 'NACHA operating rules compliance verification checklist',
      lastUsed: '2024-09-30',
      usageCount: 8,
      completionRate: 87.5
    }
  ],
  complianceKPIs: [
    {
      metric: 'Overall Compliance Score',
      value: 94.2,
      target: 95.0,
      trend: 'up',
      unit: '%',
      status: 'near_target'
    },
    {
      metric: 'Average Assessment Time',
      value: 12.5,
      target: 15.0,
      trend: 'down',
      unit: 'days',
      status: 'exceeds_target'
    },
    {
      metric: 'Policy Update Frequency',
      value: 4.2,
      target: 4.0,
      trend: 'up',
      unit: 'per month',
      status: 'exceeds_target'
    },
    {
      metric: 'Training Completion Rate',
      value: 96.8,
      target: 90.0,
      trend: 'up',
      unit: '%',
      status: 'exceeds_target'
    },
    {
      metric: 'Audit Finding Resolution',
      value: 8.3,
      target: 7.0,
      trend: 'down',
      unit: 'days avg',
      status: 'exceeds_target'
    },
    {
      metric: 'Regulatory Change Response',
      value: 2.1,
      target: 3.0,
      trend: 'down',
      unit: 'days avg',
      status: 'exceeds_target'
    }
  ],
  trainingMetrics: {
    totalEmployees: 156,
    completedTraining: 151,
    pendingTraining: 5,
    overdueTraining: 0,
    completionRate: 96.8,
    averageScore: 94.2,
    certifications: [
      { name: 'PCI DSS Awareness', completed: 156, required: 156, score: 95.8 },
      { name: 'AML Training', completed: 151, required: 156, score: 92.4 },
      { name: 'Data Protection', completed: 156, required: 156, score: 96.1 },
      { name: 'Cybersecurity Basics', completed: 156, required: 156, score: 93.7 }
    ]
  }
};

interface ComplianceDashboardProps {
  className?: string;
}

export const ComplianceDashboard: React.FC<ComplianceDashboardProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'health' | 'calendar' | 'risk' | 'training' | 'policies' | 'audit' | 'checklist' | 'reporting'>('overview');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [realTimeData, setRealTimeData] = useState(mockComplianceData.realTimeMetrics);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-sov-green';
      case 'in_progress': return 'text-sov-accent';
      case 'pending': return 'text-sov-gold';
      case 'failed': return 'text-sov-red';
      default: return 'text-sov-light-alt';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckIcon className="h-4 w-4 text-sov-green" />;
      case 'in_progress':
        return <PlayIcon className="h-4 w-4 text-sov-accent" />;
      case 'pending':
        return <ClockIcon className="h-4 w-4 text-sov-gold" />;
      case 'failed':
        return <XIcon className="h-4 w-4 text-sov-red" />;
      default:
        return null;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-sov-red/20 text-sov-red';
      case 'medium': return 'bg-sov-gold/20 text-sov-gold';
      case 'low': return 'bg-sov-green/20 text-sov-green';
      default: return 'bg-gray-700 text-gray-300';
    }
  };

  const getRiskColor = (score: number) => {
    if (score <= 2) return 'text-sov-green';
    if (score <= 3.5) return 'text-sov-gold';
    return 'text-sov-red';
  };

  const filteredChecklist = mockComplianceData.complianceChecklist.filter(
    item => selectedCategory === 'all' || item.category === selectedCategory
  );

  const checklistProgress = useMemo(() => {
    const total = mockComplianceData.complianceChecklist.length;
    const completed = mockComplianceData.complianceChecklist.filter(item => item.status === 'completed').length;
    return (completed / total) * 100;
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      // Simulate real-time data updates
      setRealTimeData(prev => ({
        ...prev,
        totalTransactions: prev.totalTransactions + Math.floor(Math.random() * 5),
        complianceRate: 98.2 + (Math.random() - 0.5) * 0.2
      }));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const exportComplianceReport = (type: string) => {
    console.log(`Exporting ${type} compliance report...`);
    // Implementation would handle the actual export
  };

  const generateCustomReport = () => {
    console.log('Generating custom compliance report...');
    // Open report generation modal
  };

  const scheduleAssessment = () => {
    console.log('Scheduling compliance assessment...');
    // Open assessment scheduling modal
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Enhanced Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-sov-light">Advanced Compliance Dashboard</h1>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${autoRefresh ? 'bg-sov-green animate-pulse' : 'bg-gray-500'}`}></div>
              <span className="text-sm text-sov-light-alt">
                {autoRefresh ? 'Real-time monitoring active' : 'Manual refresh mode'}
              </span>
            </div>
          </div>
          <p className="text-sov-light-alt">Enterprise-grade compliance monitoring and management</p>
          <div className="flex items-center gap-6 mt-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-sov-light-alt">Current Score:</span>
              <span className="text-2xl font-bold text-sov-green">{mockComplianceData.overallHealthScore}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sov-light-alt">Active Transactions:</span>
              <span className="text-sov-light font-semibold">{realTimeData.totalTransactions.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sov-light-alt">Compliance Rate:</span>
              <span className="text-sov-light font-semibold">{realTimeData.complianceRate.toFixed(1)}%</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`font-bold py-2 px-4 rounded-lg transition-colors ${
              autoRefresh 
                ? 'bg-sov-green text-sov-dark hover:bg-sov-green/80' 
                : 'bg-sov-dark-alt border border-gray-600 text-sov-light hover:bg-gray-700'
            }`}
          >
            {autoRefresh ? 'Auto-Refresh: ON' : 'Auto-Refresh: OFF'}
          </button>
          <button 
            onClick={generateCustomReport}
            className="bg-sov-accent text-sov-dark font-bold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors"
          >
            Generate Report
          </button>
          <button 
            onClick={scheduleAssessment}
            className="bg-sov-dark-alt border border-gray-600 text-sov-light font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Schedule Assessment
          </button>
        </div>
      </div>

      {/* Overall Compliance Health Monitor */}
      <ComplianceHealthMonitor 
        healthScore={mockComplianceData.overallHealthScore}
        breakdown={mockComplianceData.healthScoreBreakdown}
        kpis={mockComplianceData.complianceKPIs}
        className="mb-6"
      />

      {/* PCI Compliance Status with Heat Map */}
      <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-sov-light">PCI DSS Compliance Status</h3>
          <div className="flex items-center space-x-2">
            <ShieldIcon className="h-6 w-6 text-sov-green" />
            <span className="text-sov-green font-bold">Level 1 Compliant</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-sov-dark rounded-lg">
                <p className="text-2xl font-bold text-sov-green">
                  {mockComplianceData.pciComplianceStatus.score}%
                </p>
                <p className="text-sm text-sov-light-alt">Overall Score</p>
              </div>
              <div className="text-center p-4 bg-sov-dark rounded-lg">
                <p className="text-2xl font-bold text-sov-green">
                  {mockComplianceData.pciComplianceStatus.requirements.completed}
                </p>
                <p className="text-sm text-sov-light-alt">Requirements Met</p>
              </div>
              <div className="text-center p-4 bg-sov-dark rounded-lg">
                <p className="text-2xl font-bold text-sov-gold">
                  {mockComplianceData.pciComplianceStatus.requirements.pending}
                </p>
                <p className="text-sm text-sov-light-alt">Pending Review</p>
              </div>
              <div className="text-center p-4 bg-sov-dark rounded-lg">
                <p className="text-sm text-sov-light-alt">Next Assessment</p>
                <p className="text-lg font-semibold text-sov-light">
                  {new Date(mockComplianceData.pciComplianceStatus.nextAssessment).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            {/* Compliance Heat Map */}
            <div>
              <h4 className="text-lg font-semibold mb-3 text-sov-light">Compliance Heat Map</h4>
              <div className="space-y-2">
                {mockComplianceData.pciComplianceStatus.heatMapData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-sov-dark rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${
                        item.risk === 'low' ? 'bg-sov-green' : 
                        item.risk === 'medium' ? 'bg-sov-gold' : 'bg-sov-red'
                      }`}></div>
                      <span className="font-semibold text-sov-light">{item.category}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-sov-light">{item.score}%</div>
                      <div className="text-sm text-sov-light-alt">{item.requirements} req.</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Trend Analysis */}
          <div className="lg:col-span-2">
            <h4 className="text-lg font-semibold mb-3 text-sov-light">Compliance Trends & Forecasting</h4>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={mockComplianceData.complianceTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis yAxisId="left" stroke="#9ca3af" />
                <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="score" fill="#2dd4bf" name="Compliance Score" />
                <Line yAxisId="left" type="monotone" dataKey="violations" stroke="#ef4444" strokeWidth={3} name="Violations" />
                <Line yAxisId="right" type="monotone" dataKey="training" stroke="#f59e0b" strokeWidth={3} name="Training %" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Enhanced Tab Navigation */}
      <div className="bg-sov-dark-alt rounded-lg shadow-lg border border-gray-700">
        <div className="flex flex-wrap border-b border-gray-700">
          {[
            { key: 'overview', label: 'Overview', count: mockComplianceData.complianceChecklist.length, icon: '📊' },
            { key: 'health', label: 'Health Monitor', count: 5, icon: '💓' },
            { key: 'calendar', label: 'Regulatory Calendar', count: 12, icon: '📅' },
            { key: 'risk', label: 'Risk Assessment', count: mockComplianceData.riskAssessment.riskFactors.length, icon: '⚠️' },
            { key: 'training', label: 'Training & Cert', count: mockComplianceData.trainingMetrics.pendingTraining, icon: '🎓' },
            { key: 'policies', label: 'Policy Management', count: 8, icon: '📋' },
            { key: 'audit', label: 'Audit Trail', count: mockComplianceData.auditLogSummary.totalEvents, icon: '🔍' },
            { key: 'checklist', label: 'Checklist', count: filteredChecklist.length, icon: '✅' },
            { key: 'reporting', label: 'Reports', count: mockComplianceData.regulatoryReporting.length, icon: '📄' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center space-x-2 px-4 py-3 font-semibold transition-colors ${
                activeTab === tab.key
                  ? 'text-sov-accent border-b-2 border-sov-accent bg-sov-dark/50'
                  : 'text-sov-light-alt hover:text-sov-light hover:bg-sov-dark/25'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
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
                  <h3 className="text-xl font-semibold mb-4 text-sov-light">Compliance Progress</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <RadialBarChart 
                      cx="50%" 
                      cy="50%" 
                      innerRadius="60%" 
                      outerRadius="90%" 
                      data={[{ name: 'Progress', value: checklistProgress }]}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <RadialBar 
                        dataKey="value" 
                        cornerRadius={10} 
                        fill="#2dd4bf"
                      />
                      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-sov-light text-2xl font-bold">
                        {checklistProgress.toFixed(0)}%
                      </text>
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <p className="text-center text-sov-light-alt mt-2">
                    {mockComplianceData.complianceChecklist.filter(item => item.status === 'completed').length} of {mockComplianceData.complianceChecklist.length} requirements completed
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4 text-sov-light">Recent Alerts</h3>
                  <div className="space-y-3">
                    {mockComplianceData.alertNotifications.map((alert) => (
                      <div key={alert.id} className="p-4 bg-sov-dark rounded-lg border border-gray-700">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {alert.severity === 'high' && <AlertIcon className="h-4 w-4 text-sov-red" />}
                            {alert.severity === 'medium' && <WarningIcon className="h-4 w-4 text-sov-gold" />}
                            {alert.severity === 'low' && <InfoIcon className="h-4 w-4 text-sov-accent" />}
                            <h4 className="font-semibold text-sov-light">{alert.title}</h4>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getSeverityColor(alert.severity)}`}>
                            {alert.severity}
                          </span>
                        </div>
                        <p className="text-sm text-sov-light-alt mb-2">{alert.description}</p>
                        <div className="flex justify-between text-xs">
                          <span className="text-sov-light-alt">
                            Assigned to: {alert.assignedTo}
                          </span>
                          <span className="text-sov-light-alt">
                            {new Date(alert.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4 text-sov-light">Risk Assessment Overview</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-semibold mb-3 text-sov-light">Risk Factors</h4>
                    <div className="space-y-3">
                      {mockComplianceData.riskAssessment.riskFactors.map((factor) => (
                        <div key={factor.factor} className="flex items-center justify-between p-3 bg-sov-dark rounded-lg">
                          <span className="font-semibold text-sov-light">{factor.factor}</span>
                          <div className="flex items-center space-x-2">
                            <span className={`font-bold ${getRiskColor(factor.score)}`}>
                              {factor.score.toFixed(1)}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              factor.status === 'low' ? 'bg-sov-green/20 text-sov-green' :
                              factor.status === 'medium' ? 'bg-sov-gold/20 text-sov-gold' :
                              'bg-sov-red/20 text-sov-red'
                            }`}>
                              {factor.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold mb-3 text-sov-light">Risk Trend</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={mockComplianceData.riskAssessment.trends}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                        <XAxis dataKey="month" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" domain={[0, 5]} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="riskScore" 
                          name="Risk Score" 
                          stroke="#f59e0b" 
                          strokeWidth={3}
                          dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Health Monitor Tab */}
          {activeTab === 'health' && (
            <div className="space-y-6">
              <ComplianceHealthMonitor 
                healthScore={mockComplianceData.overallHealthScore}
                breakdown={mockComplianceData.healthScoreBreakdown}
                kpis={mockComplianceData.complianceKPIs}
                detailed={true}
              />
            </div>
          )}

          {/* Regulatory Calendar Tab */}
          {activeTab === 'calendar' && (
            <div className="space-y-6">
              <RegulatoryCalendar 
                complianceDeadlines={mockComplianceData.regulatoryReporting}
                upcomingEvents={[
                  { id: 'event-1', title: 'PCI DSS Assessment Due', date: '2025-01-15', type: 'assessment', priority: 'high' },
                  { id: 'event-2', title: 'AML Training Deadline', date: '2024-11-30', type: 'training', priority: 'medium' },
                  { id: 'event-3', title: 'NACHA Rules Update', date: '2024-12-01', type: 'regulatory', priority: 'high' },
                  { id: 'event-4', title: 'SOX Control Review', date: '2024-12-15', type: 'review', priority: 'medium' }
                ]}
              />
            </div>
          )}

          {/* Risk Assessment Tab */}
          {activeTab === 'risk' && (
            <div className="space-y-6">
              <RiskAssessmentTool 
                riskMatrix={mockComplianceData.riskMatrix}
                riskFactors={mockComplianceData.riskAssessment.riskFactors}
                trends={mockComplianceData.riskAssessment.trends}
              />
            </div>
          )}

          {/* Training & Certification Tab */}
          {activeTab === 'training' && (
            <div className="space-y-6">
              <ComplianceTraining 
                trainingMetrics={mockComplianceData.trainingMetrics}
                completionRate={mockComplianceData.trainingMetrics.completionRate}
                averageScore={mockComplianceData.trainingMetrics.averageScore}
              />
            </div>
          )}

          {/* Policy Management Tab */}
          {activeTab === 'policies' && (
            <div className="space-y-6">
              <PolicyManagement 
                complianceTemplates={mockComplianceData.complianceTemplates}
                policies={[
                  { id: 'policy-1', name: 'Data Protection Policy', version: '2.1', status: 'active', lastReview: '2024-10-15' },
                  { id: 'policy-2', name: 'Access Control Policy', version: '1.8', status: 'active', lastReview: '2024-09-20' },
                  { id: 'policy-3', name: 'Incident Response Plan', version: '3.0', status: 'review', lastReview: '2024-11-01' }
                ]}
              />
            </div>
          )}

          {/* Audit Trail Tab */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              <AuditTrailExplorer 
                auditLogs={mockComplianceData.auditLogSummary.eventsByAction}
                totalEvents={mockComplianceData.auditLogSummary.totalEvents}
                eventsToday={mockComplianceData.auditLogSummary.eventsToday}
              />
            </div>
          )}

          {/* Compliance Checklist Tab */}
          {activeTab === 'checklist' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-sov-light">Compliance Checklist</h3>
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-sov-dark border border-gray-600 text-sov-light px-3 py-2 rounded-lg"
                >
                  <option value="all">All Categories</option>
                  <option value="PCI DSS">PCI DSS</option>
                  <option value="NACHA">NACHA</option>
                  <option value="AML">AML</option>
                  <option value="SOX">SOX</option>
                </select>
              </div>
              
              <div className="space-y-4">
                {filteredChecklist.map((item) => (
                  <div key={item.id} className="p-6 bg-sov-dark rounded-lg border border-gray-700">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${
                          item.priority === 'critical' ? 'bg-sov-red/20 text-sov-red' :
                          item.priority === 'high' ? 'bg-sov-gold/20 text-sov-gold' :
                          'bg-sov-accent/20 text-sov-accent'
                        }`}>
                          {item.priority === 'critical' && <ShieldIcon />}
                          {item.priority === 'high' && <AlertIcon />}
                          {item.priority === 'medium' && <ClockIcon />}
                        </div>
                        <div>
                          <h4 className="font-semibold text-sov-light">{item.requirement}</h4>
                          <p className="text-sm text-sov-light-alt">{item.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(item.status)}
                        <span className={`text-sm font-semibold ${getStatusColor(item.status)}`}>
                          {item.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-sov-light-alt">Category:</span>
                        <span className="ml-2 text-sov-light font-semibold">{item.category}</span>
                      </div>
                      <div>
                        <span className="text-sov-light-alt">Assigned to:</span>
                        <span className="ml-2 text-sov-light font-semibold">{item.assignedTo}</span>
                      </div>
                      <div>
                        <span className="text-sov-light-alt">Due Date:</span>
                        <span className="ml-2 text-sov-light font-semibold">
                          {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>

                    {item.status === 'completed' && item.evidence && (
                      <div className="mt-4 p-3 bg-sov-green/10 border border-sov-green/20 rounded-lg">
                        <p className="text-sm text-sov-light-alt">
                          <span className="font-semibold text-sov-green">Evidence:</span> {item.evidence}
                        </p>
                        {item.completedDate && (
                          <p className="text-sm text-sov-light-alt mt-1">
                            <span className="font-semibold text-sov-green">Completed:</span> {new Date(item.completedDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}

                    {item.status === 'in_progress' && item.progress !== undefined && (
                      <div className="mt-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-sov-light-alt">Progress</span>
                          <span className="text-sov-light font-semibold">{item.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-sov-accent h-2 rounded-full transition-all duration-500"
                            style={{ width: `${item.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audit Log Tab */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-sov-light">Audit Log Summary</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold mb-3 text-sov-light">Events by Action Type</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={mockComplianceData.auditLogSummary.eventsByAction}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                      <XAxis 
                        dataKey="action" 
                        stroke="#9ca3af" 
                        angle={-45} 
                        textAnchor="end" 
                        height={100}
                      />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }}
                      />
                      <Bar dataKey="count" fill="#2dd4bf" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-3 text-sov-light">Recent Audit Events</h4>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {mockComplianceData.auditLogSummary.eventsByAction.slice(0, 5).map((event, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-sov-dark rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getSeverityColor(event.severity)}`}>
                            {event.severity}
                          </span>
                          <span className="text-sov-light">{event.action}</span>
                        </div>
                        <span className="text-sov-light font-semibold">{event.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Risk Assessment Tab */}
          {activeTab === 'risk' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-sov-light">Risk Score Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={mockComplianceData.riskAssessment.riskFactors}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                      <XAxis dataKey="factor" stroke="#9ca3af" angle={-45} textAnchor="end" height={80} />
                      <YAxis stroke="#9ca3af" domain={[0, 5]} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }}
                      />
                      <Bar 
                        dataKey="score" 
                        fill={(entry) => entry.score <= 2 ? '#10b981' : entry.score <= 3.5 ? '#f59e0b' : '#ef4444'}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4 text-sov-light">Overall Risk Assessment</h3>
                  <div className="text-center p-8 bg-sov-dark rounded-lg">
                    <div className="text-6xl font-bold text-sov-green mb-4">
                      {mockComplianceData.riskAssessment.overallRisk}
                    </div>
                    <div className="text-2xl font-semibold text-sov-light mb-2">
                      Score: {mockComplianceData.riskAssessment.riskScore.toFixed(1)}/5.0
                    </div>
                    <p className="text-sov-light-alt">
                      Based on current compliance posture and risk factors
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Regulatory Reporting Tab */}
          {activeTab === 'reporting' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-sov-light">Automated Compliance Reporting</h3>
                <div className="flex gap-2">
                  <select className="bg-sov-dark border border-gray-600 text-sov-light px-3 py-2 rounded-lg">
                    <option>Quarterly Reports</option>
                    <option>Annual Reports</option>
                    <option>Custom Reports</option>
                  </select>
                  <button className="bg-sov-accent text-sov-dark font-semibold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors">
                    Schedule Auto-Report
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Reporting Templates */}
                <div>
                  <h4 className="text-lg font-semibold mb-4 text-sov-light">Report Templates</h4>
                  <div className="space-y-3">
                    {mockComplianceData.complianceTemplates.map((template) => (
                      <div key={template.id} className="p-4 bg-sov-dark rounded-lg border border-gray-700">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h5 className="font-semibold text-sov-light">{template.name}</h5>
                            <p className="text-sm text-sov-light-alt">{template.description}</p>
                          </div>
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-sov-accent/20 text-sov-accent">
                            {template.regulatoryStandard}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-sov-light-alt">
                            Used {template.usageCount} times
                          </span>
                          <span className="text-sov-light-alt">
                            {template.completionRate}% completion rate
                          </span>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button className="flex-1 bg-sov-accent/10 text-sov-accent font-semibold py-2 px-3 rounded-lg hover:bg-sov-accent/20 transition-colors text-sm">
                            Generate
                          </button>
                          <button className="bg-sov-dark-alt border border-gray-600 text-sov-light font-semibold py-2 px-3 rounded-lg hover:bg-gray-700 transition-colors text-sm">
                            Edit
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active Reports */}
                <div>
                  <h4 className="text-lg font-semibold mb-4 text-sov-light">Active Reports</h4>
                  <div className="space-y-3">
                    {mockComplianceData.regulatoryReporting.map((report) => (
                      <div key={report.id} className="p-4 bg-sov-dark rounded-lg border border-gray-700">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h5 className="font-semibold text-sov-light">{report.reportType}</h5>
                            <p className="text-sm text-sov-light-alt">{report.regulatoryBody}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            report.status === 'completed' ? 'bg-sov-green/20 text-sov-green' :
                            report.status === 'in_progress' ? 'bg-sov-accent/20 text-sov-accent' :
                            report.status === 'pending' ? 'bg-sov-gold/20 text-sov-gold' :
                            'bg-gray-700 text-gray-300'
                          }`}>
                            {report.status.replace('_', ' ')}
                          </span>
                        </div>
                        
                        <div className="space-y-2 mb-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-sov-light-alt">Due Date:</span>
                            <span className="text-sov-light font-semibold">
                              {new Date(report.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-sov-light-alt">Assigned to:</span>
                            <span className="text-sov-light font-semibold">{report.assignedTo}</span>
                          </div>
                        </div>

                        {report.status === 'in_progress' && (
                          <div className="mb-3">
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-sov-light-alt">Progress</span>
                              <span className="text-sov-light font-semibold">{report.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-sov-accent h-2 rounded-full transition-all duration-500"
                                style={{ width: `${report.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button 
                            onClick={() => exportComplianceReport(report.id)}
                            className="flex-1 bg-sov-accent/10 text-sov-accent font-semibold py-2 px-3 rounded-lg hover:bg-sov-accent/20 transition-colors text-sm"
                          >
                            View
                          </button>
                          <button className="bg-sov-dark-alt border border-gray-600 text-sov-light font-semibold py-2 px-3 rounded-lg hover:bg-gray-700 transition-colors text-sm">
                            Export
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
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

const PlayIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
  </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

const ShieldIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const AlertIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

const WarningIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

const InfoIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
  </svg>
);