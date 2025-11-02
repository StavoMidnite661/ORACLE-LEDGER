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
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { securityComplianceService } from '../../services/securityComplianceService';

interface ComplianceStatus {
  overallScore: number;
  standards: Array<{
    id: string;
    name: string;
    score: number;
    status: string;
    controlsImplemented: number;
    controlsTotal: number;
  }>;
  criticalFindings: number;
  upcomingAssessments: any[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  trends: Array<{ date: Date; score: number }>;
}

interface ComplianceControl {
  id: string;
  title: string;
  standard: string;
  status: string;
  priority: string;
  effectiveness: number;
  lastAssessment?: Date;
  nextAssessment?: Date;
}

const ComplianceMonitor: React.FC = () => {
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatus | null>(null);
  const [controls, setControls] = useState<ComplianceControl[]>([]);
  const [selectedStandard, setSelectedStandard] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadComplianceData();
    
    // Set up real-time updates every 5 minutes
    const interval = setInterval(loadComplianceData, 300000);
    
    return () => clearInterval(interval);
  }, [selectedStandard, selectedStatus, selectedPriority]);

  const loadComplianceData = async () => {
    try {
      setIsLoading(true);
      
      // Load compliance status
      const status = await securityComplianceService.getComplianceStatus();
      setComplianceStatus(status);
      
      // Load controls with filters
      const controlFilters: any = {};
      if (selectedStandard !== 'all') controlFilters.standard = selectedStandard;
      if (selectedStatus !== 'all') controlFilters.status = selectedStatus;
      if (selectedPriority !== 'all') controlFilters.priority = selectedPriority;
      
      const controlsData = securityComplianceService.getControls(controlFilters);
      setControls(controlsData);
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load compliance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateControlStatus = async (controlId: string, newStatus: string) => {
    try {
      await securityComplianceService.updateControlStatus(controlId, newStatus as any, `Status updated to ${newStatus}`);
      loadComplianceData(); // Refresh data
    } catch (error) {
      console.error('Failed to update control status:', error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 95) return 'text-green-400';
    if (score >= 85) return 'text-yellow-400';
    if (score >= 70) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 95) return 'bg-green-400';
    if (score >= 85) return 'bg-yellow-400';
    if (score >= 70) return 'bg-orange-400';
    return 'bg-red-400';
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      compliant: 'bg-sov-green/20 text-sov-green',
      implemented: 'bg-sov-accent/20 text-sov-accent',
      tested: 'bg-blue-500/20 text-blue-400',
      in_progress: 'bg-sov-gold/20 text-sov-gold',
      not_started: 'bg-gray-600/20 text-gray-400',
      non_compliant: 'bg-sov-red/20 text-sov-red'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles] || styles.not_started}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      critical: 'bg-sov-red/20 text-sov-red',
      high: 'bg-sov-gold/20 text-sov-gold',
      medium: 'bg-blue-500/20 text-blue-400',
      low: 'bg-gray-600/20 text-gray-400'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[priority as keyof typeof styles] || styles.low}`}>
        {priority.toUpperCase()}
      </span>
    );
  };

  // Mock data for charts
  const complianceTrends = complianceStatus?.trends.map(trend => ({
    date: trend.date.toLocaleDateString(),
    score: trend.score
  })) || [];

  const controlDistribution = [
    { name: 'Compliant', value: controls.filter(c => c.status === 'compliant').length, color: '#16a34a' },
    { name: 'Implemented', value: controls.filter(c => c.status === 'implemented').length, color: '#2dd4bf' },
    { name: 'In Progress', value: controls.filter(c => c.status === 'in_progress').length, color: '#f59e0b' },
    { name: 'Not Started', value: controls.filter(c => c.status === 'not_started').length, color: '#6b7280' },
    { name: 'Non-Compliant', value: controls.filter(c => c.status === 'non_compliant').length, color: '#dc2626' },
  ];

  const standardScores = complianceStatus?.standards.map(standard => ({
    name: standard.name.replace(/^(PCI_DSS|SOC_2|ISO_27001|NACHA)_/, ''),
    score: standard.score,
    fullName: standard.name
  })) || [];

  const riskRadarData = [
    { area: 'Network Security', score: 85 },
    { area: 'Data Protection', score: 92 },
    { area: 'Access Control', score: 78 },
    { area: 'Incident Response', score: 88 },
    { area: 'Compliance', score: 95 },
    { area: 'Training', score: 82 },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sov-accent"></div>
        <span className="ml-2 text-sov-light">Loading compliance data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-sov-light">Compliance Monitor</h1>
          <p className="text-sov-light-alt">Track regulatory compliance and security control effectiveness</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-sov-light-alt">Last Updated</p>
            <p className="text-sov-light font-semibold">
              {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
          <button
            onClick={loadComplianceData}
            className="bg-sov-accent text-sov-dark font-bold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Compliance Score Card */}
      <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-sov-light mb-2">Overall Compliance Score</h3>
            <p className="text-sov-light-alt">Based on all active compliance standards</p>
          </div>
          <div className="text-center">
            <div className={`text-6xl font-bold ${getScoreColor(complianceStatus?.overallScore || 0)}`}>
              {Math.round(complianceStatus?.overallScore || 0)}%
            </div>
            <p className="text-sov-light-alt mt-2">
              Risk Level: <span className={`font-semibold ${
                complianceStatus?.riskLevel === 'low' ? 'text-green-400' :
                complianceStatus?.riskLevel === 'medium' ? 'text-yellow-400' :
                complianceStatus?.riskLevel === 'high' ? 'text-orange-400' :
                'text-red-400'
              }`}>
                {complianceStatus?.riskLevel?.toUpperCase() || 'UNKNOWN'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sov-light-alt text-sm mb-2">Standard</label>
            <select
              value={selectedStandard}
              onChange={(e) => setSelectedStandard(e.target.value)}
              className="bg-sov-dark border border-gray-600 text-sov-light px-3 py-2 rounded-lg"
            >
              <option value="all">All Standards</option>
              <option value="PCI_DSS">PCI DSS</option>
              <option value="SOC_2">SOC 2</option>
              <option value="ISO_27001">ISO 27001</option>
              <option value="NACHA">NACHA</option>
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
              <option value="compliant">Compliant</option>
              <option value="implemented">Implemented</option>
              <option value="in_progress">In Progress</option>
              <option value="not_started">Not Started</option>
              <option value="non_compliant">Non-Compliant</option>
            </select>
          </div>
          <div>
            <label className="block text-sov-light-alt text-sm mb-2">Priority</label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-sov-dark border border-gray-600 text-sov-light px-3 py-2 rounded-lg"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedStandard('all');
                setSelectedStatus('all');
                setSelectedPriority('all');
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
        {/* Compliance Trends */}
        <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
          <h3 className="text-xl font-semibold text-sov-light mb-4">Compliance Score Trend (30d)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={complianceTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" domain={[70, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#2dd4bf"
                strokeWidth={3}
                dot={{ fill: '#2dd4bf', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Assessment Radar */}
        <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
          <h3 className="text-xl font-semibold text-sov-light mb-4">Security Risk Assessment</h3>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={riskRadarData}>
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis dataKey="area" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <PolarRadiusAxis tick={{ fill: '#9ca3af', fontSize: 10 }} domain={[0, 100]} />
              <Radar
                name="Risk Score"
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

      {/* Standard Scores */}
      <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
        <h3 className="text-xl font-semibold text-sov-light mb-4">Compliance Standards Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {standardScores.map((standard, index) => (
            <div key={index} className="bg-sov-dark p-4 rounded-lg">
              <h4 className="text-sov-light font-semibold text-sm mb-2">{standard.fullName}</h4>
              <div className="flex items-center justify-between">
                <span className={`text-2xl font-bold ${getScoreColor(standard.score)}`}>
                  {standard.score}%
                </span>
                <div className="w-12 h-12">
                  <svg viewBox="0 0 36 36" className="w-full h-full">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#374151"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke={standard.score >= 95 ? '#16a34a' : standard.score >= 85 ? '#f59e0b' : '#dc2626'}
                      strokeWidth="3"
                      strokeDasharray={`${standard.score}, 100`}
                    />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls Table */}
      <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-sov-light">
            Compliance Controls ({controls.length})
          </h3>
          <div className="flex gap-2">
            <button className="bg-sov-accent text-sov-dark font-semibold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors">
              Export Report
            </button>
            <button className="bg-sov-dark border border-gray-600 text-sov-light font-semibold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors">
              Generate Audit
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-sov-light-alt pb-3">Control</th>
                <th className="text-sov-light-alt pb-3">Standard</th>
                <th className="text-sov-light-alt pb-3">Status</th>
                <th className="text-sov-light-alt pb-3">Priority</th>
                <th className="text-sov-light-alt pb-3">Effectiveness</th>
                <th className="text-sov-light-alt pb-3">Last Assessment</th>
                <th className="text-sov-light-alt pb-3">Next Assessment</th>
                <th className="text-sov-light-alt pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {controls.slice(0, 15).map((control) => (
                <tr key={control.id} className="border-b border-gray-700/50 hover:bg-sov-dark/50">
                  <td className="py-4">
                    <div>
                      <p className="text-sov-light font-medium">{control.title}</p>
                      <p className="text-sov-light-alt text-sm">{control.id}</p>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="text-sov-light text-sm">{control.standard}</span>
                  </td>
                  <td className="py-4">
                    {getStatusBadge(control.status)}
                  </td>
                  <td className="py-4">
                    {getPriorityBadge(control.priority)}
                  </td>
                  <td className="py-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getScoreBackground(control.effectiveness)}`}
                          style={{ width: `${control.effectiveness}%` }}
                        />
                      </div>
                      <span className="text-sov-light text-sm font-semibold">
                        {control.effectiveness}%
                      </span>
                    </div>
                  </td>
                  <td className="py-4 text-sov-light text-sm">
                    {control.lastAssessment ? new Date(control.lastAssessment).toLocaleDateString() : 'Not assessed'}
                  </td>
                  <td className="py-4 text-sov-light text-sm">
                    {control.nextAssessment ? new Date(control.nextAssessment).toLocaleDateString() : 'Not scheduled'}
                  </td>
                  <td className="py-4">
                    <select
                      value={control.status}
                      onChange={(e) => handleUpdateControlStatus(control.id, e.target.value)}
                      className="bg-sov-dark border border-gray-600 text-sov-light px-2 py-1 rounded text-sm"
                    >
                      <option value="not_started">Not Started</option>
                      <option value="in_progress">In Progress</option>
                      <option value="implemented">Implemented</option>
                      <option value="tested">Tested</option>
                      <option value="compliant">Compliant</option>
                      <option value="non_compliant">Non-Compliant</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {controls.length === 0 && (
            <div className="text-center py-8 text-sov-light-alt">
              No controls found matching the current filters
            </div>
          )}
        </div>

        {controls.length > 15 && (
          <div className="mt-4 text-center">
            <button className="text-sov-accent hover:text-sov-accent-hover font-semibold">
              Load More Controls
            </button>
          </div>
        )}
      </div>

      {/* Upcoming Assessments */}
      <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
        <h3 className="text-xl font-semibold text-sov-light mb-4">Upcoming Assessments</h3>
        <div className="space-y-3">
          {complianceStatus?.upcomingAssessments.slice(0, 5).map((assessment, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-sov-dark rounded-lg">
              <div>
                <h4 className="text-sov-light font-semibold">{assessment.title}</h4>
                <p className="text-sov-light-alt text-sm">{assessment.standard} - {assessment.priority} priority</p>
              </div>
              <div className="text-right">
                <p className="text-sov-light font-semibold">
                  {assessment.nextAssessment ? new Date(assessment.nextAssessment).toLocaleDateString() : 'Not scheduled'}
                </p>
                <p className="text-sov-light-alt text-sm">Due date</p>
              </div>
            </div>
          )) || (
            <div className="text-sov-light-alt text-center py-4">No upcoming assessments</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComplianceMonitor;