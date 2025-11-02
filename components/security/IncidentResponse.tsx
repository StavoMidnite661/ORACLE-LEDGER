import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { securityMonitoringService } from '../../services/securityMonitoringService';
import { alertManagementService } from '../../services/alertManagementService';

interface SecurityIncident {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'contained' | 'resolved' | 'closed';
  category: string;
  createdAt: Date;
  updatedAt: Date;
  assignedTo?: string;
  timeline: IncidentEvent[];
  impact: string;
  affectedSystems: string[];
  containmentActions: string[];
  lessonsLearned?: string;
}

interface IncidentEvent {
  id: string;
  timestamp: Date;
  eventType: string;
  description: string;
  userId: string;
  metadata: Record<string, any>;
}

interface IncidentMetrics {
  totalIncidents: number;
  openIncidents: number;
  meanTimeToDetection: number;
  meanTimeToResponse: number;
  meanTimeToResolution: number;
  escalationRate: number;
  reoccurrenceRate: number;
}

const IncidentResponse: React.FC = () => {
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<SecurityIncident | null>(null);
  const [metrics, setMetrics] = useState<IncidentMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'overview' | 'incidents' | 'response' | 'forensics'>('overview');

  useEffect(() => {
    loadIncidentData();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(loadIncidentData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadIncidentData = async () => {
    try {
      setIsLoading(true);
      
      // Load recent security events as potential incidents
      const securityStatus = await securityMonitoringService.getSecurityStatus();
      const recentEvents = securityStatus.recentEvents;
      
      // Convert events to incidents (mock conversion)
      const incidentEvents: SecurityIncident[] = recentEvents
        .filter(event => event.severity === 'high' || event.severity === 'critical')
        .map(event => ({
          id: event.id,
          title: event.eventType.replace(/_/g, ' '),
          description: event.description,
          severity: event.severity,
          status: event.status === 'open' ? 'open' : 'investigating',
          category: getEventCategory(event.eventType),
          createdAt: event.timestamp,
          updatedAt: event.timestamp,
          assignedTo: event.userId,
          timeline: [
            {
              id: '1',
              timestamp: event.timestamp,
              eventType: 'DETECTION',
              description: event.description,
              userId: event.userId || 'system',
              metadata: event.metadata
            }
          ],
          impact: event.severity === 'critical' ? 'High - Business critical systems affected' : 
                  event.severity === 'high' ? 'Medium - Some business operations impacted' : 'Low - Limited impact',
          affectedSystems: [event.sourceType],
          containmentActions: []
        }));
      
      setIncidents(incidentEvents);
      
      // Mock metrics
      setMetrics({
        totalIncidents: incidentEvents.length,
        openIncidents: incidentEvents.filter(i => i.status === 'open').length,
        meanTimeToDetection: 15, // minutes
        meanTimeToResponse: 8,   // minutes
        meanTimeToResolution: 120, // minutes
        escalationRate: 25, // percentage
        reoccurrenceRate: 12 // percentage
      });
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load incident data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getEventCategory = (eventType: string): string => {
    if (eventType.includes('LOGIN') || eventType.includes('AUTH')) return 'Authentication';
    if (eventType.includes('DATABASE') || eventType.includes('DB_')) return 'Data Breach';
    if (eventType.includes('API') || eventType.includes('ABUSE')) return 'API Security';
    if (eventType.includes('PRIVILEGE')) return 'Access Control';
    if (eventType.includes('VULNERABILITY')) return 'Vulnerability';
    if (eventType.includes('MALWARE')) return 'Malware';
    return 'Other';
  };

  const handleUpdateIncidentStatus = async (incidentId: string, newStatus: SecurityIncident['status']) => {
    try {
      // Update incident status
      setIncidents(prev => prev.map(incident => 
        incident.id === incidentId 
          ? { ...incident, status: newStatus, updatedAt: new Date() }
          : incident
      ));
      
      // Add timeline event
      const timelineEvent: IncidentEvent = {
        id: Date.now().toString(),
        timestamp: new Date(),
        eventType: 'STATUS_CHANGE',
        description: `Incident status changed to ${newStatus}`,
        userId: 'current_user',
        metadata: { newStatus, oldStatus: selectedIncident?.status }
      };
      
      if (selectedIncident?.id === incidentId) {
        setSelectedIncident(prev => prev ? {
          ...prev,
          status: newStatus,
          timeline: [...prev.timeline, timelineEvent],
          updatedAt: new Date()
        } : null);
      }
      
      // Log security event
      await securityMonitoringService.logSecurityEvent({
        sourceType: 'user',
        sourceId: 'incident_responder',
        eventType: 'INCIDENT_STATUS_CHANGED',
        severity: 'medium',
        description: `Incident ${incidentId} status changed to ${newStatus}`,
        metadata: { incidentId, newStatus },
        userId: 'incident_responder',
        tags: ['incident_response', 'status_change']
      });
      
    } catch (error) {
      console.error('Failed to update incident status:', error);
    }
  };

  const handleAddTimelineEvent = (incidentId: string, eventType: string, description: string) => {
    const timelineEvent: IncidentEvent = {
      id: Date.now().toString(),
      timestamp: new Date(),
      eventType,
      description,
      userId: 'current_user',
      metadata: {}
    };
    
    setIncidents(prev => prev.map(incident => 
      incident.id === incidentId 
        ? { 
            ...incident, 
            timeline: [...incident.timeline, timelineEvent],
            updatedAt: new Date()
          }
        : incident
    ));
    
    if (selectedIncident?.id === incidentId) {
      setSelectedIncident(prev => prev ? {
        ...prev,
        timeline: [...prev.timeline, timelineEvent],
        updatedAt: new Date()
      } : null);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#dc2626';
      case 'investigating': return '#d97706';
      case 'contained': return '#3b82f6';
      case 'resolved': return '#16a34a';
      case 'closed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  // Mock data for charts
  const incidentTrends = [
    { date: '2024-11-01', incidents: 3, resolved: 2, escalated: 1 },
    { date: '2024-11-02', incidents: 5, resolved: 4, escalated: 2 },
  ];

  const incidentCategoryData = [
    { category: 'Authentication', count: 8, color: '#dc2626' },
    { category: 'Data Breach', count: 3, color: '#ea580c' },
    { category: 'API Security', count: 6, color: '#d97706' },
    { category: 'Access Control', count: 4, color: '#3b82f6' },
    { category: 'Other', count: 2, color: '#6b7280' },
  ];

  const responseTimeData = [
    { phase: 'Detection', avgMinutes: metrics?.meanTimeToDetection || 15 },
    { phase: 'Response', avgMinutes: metrics?.meanTimeToResponse || 8 },
    { phase: 'Resolution', avgMinutes: metrics?.meanTimeToResolution || 120 },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sov-accent"></div>
        <span className="ml-2 text-sov-light">Loading incident data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-sov-light">Incident Response</h1>
          <p className="text-sov-light-alt">Security incident management and response coordination</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-sov-light-alt">Last Updated</p>
            <p className="text-sov-light font-semibold">
              {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
          <button
            onClick={loadIncidentData}
            className="bg-sov-accent text-sov-dark font-bold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-sov-dark-alt rounded-lg shadow-lg border border-gray-700">
        <div className="flex border-b border-gray-700">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'incidents', label: 'Active Incidents' },
            { key: 'response', label: 'Response Playbooks' },
            { key: 'forensics', label: 'Forensics' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-6 py-4 font-semibold transition-colors ${
                activeTab === tab.key
                  ? 'text-sov-accent border-b-2 border-sov-accent bg-sov-dark/50'
                  : 'text-sov-light-alt hover:text-sov-light hover:bg-sov-dark/25'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-sov-dark p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sov-light-alt text-sm">Total Incidents (24h)</p>
                      <p className="text-3xl font-bold text-sov-light">
                        {metrics?.totalIncidents || 0}
                      </p>
                    </div>
                    <AlertIcon className="h-8 w-8 text-sov-red" />
                  </div>
                </div>

                <div className="bg-sov-dark p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sov-light-alt text-sm">Open Incidents</p>
                      <p className="text-3xl font-bold text-sov-red">
                        {metrics?.openIncidents || 0}
                      </p>
                    </div>
                    <ClockIcon className="h-8 w-8 text-sov-gold" />
                  </div>
                </div>

                <div className="bg-sov-dark p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sov-light-alt text-sm">Mean Time to Detection</p>
                      <p className="text-3xl font-bold text-sov-accent">
                        {metrics?.meanTimeToDetection || 0}m
                      </p>
                    </div>
                    <EyeIcon className="h-8 w-8 text-sov-accent" />
                  </div>
                </div>

                <div className="bg-sov-dark p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sov-light-alt text-sm">Mean Time to Resolution</p>
                      <p className="text-3xl font-bold text-sov-green">
                        {Math.round((metrics?.meanTimeToResolution || 0) / 60)}h
                      </p>
                    </div>
                    <CheckIcon className="h-8 w-8 text-sov-green" />
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xl font-semibold text-sov-light mb-4">Incident Trends</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={incidentTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9ca3af" />
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
                        dataKey="incidents"
                        stroke="#dc2626"
                        strokeWidth={2}
                        name="New Incidents"
                      />
                      <Line
                        type="monotone"
                        dataKey="resolved"
                        stroke="#16a34a"
                        strokeWidth={2}
                        name="Resolved"
                      />
                      <Line
                        type="monotone"
                        dataKey="escalated"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        name="Escalated"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-sov-light mb-4">Response Time by Phase</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={responseTimeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="phase" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="avgMinutes" fill="#2dd4bf" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-sov-light mb-4">Incidents by Category</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {incidentCategoryData.map((category, index) => (
                    <div key={index} className="bg-sov-dark p-4 rounded-lg text-center">
                      <div
                        className="w-4 h-4 rounded-full mx-auto mb-2"
                        style={{ backgroundColor: category.color }}
                      />
                      <p className="text-sov-light font-semibold">{category.count}</p>
                      <p className="text-sov-light-alt text-sm">{category.category}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Incidents Tab */}
          {activeTab === 'incidents' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-sov-light">
                  Active Security Incidents ({incidents.length})
                </h3>
                <button className="bg-sov-red text-sov-light font-bold py-2 px-4 rounded-lg hover:bg-sov-red-hover transition-colors">
                  Create Incident
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Incident List */}
                <div className="space-y-4">
                  {incidents.slice(0, 10).map((incident) => (
                    <div
                      key={incident.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                        selectedIncident?.id === incident.id
                          ? 'border-sov-accent bg-sov-accent/10'
                          : 'border-gray-700 bg-sov-dark hover:border-gray-600'
                      }`}
                      onClick={() => setSelectedIncident(incident)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sov-light font-semibold">{incident.title}</h4>
                        <div className="flex gap-2">
                          <span
                            className="px-2 py-1 rounded-full text-xs font-semibold"
                            style={{
                              backgroundColor: `${getSeverityColor(incident.severity)}20`,
                              color: getSeverityColor(incident.severity)
                            }}
                          >
                            {incident.severity.toUpperCase()}
                          </span>
                          <span
                            className="px-2 py-1 rounded-full text-xs font-semibold"
                            style={{
                              backgroundColor: `${getStatusColor(incident.status)}20`,
                              color: getStatusColor(incident.status)
                            }}
                          >
                            {incident.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <p className="text-sov-light-alt text-sm mb-2">{incident.description}</p>
                      <div className="flex justify-between text-xs text-sov-light-alt">
                        <span>{incident.category}</span>
                        <span>{new Date(incident.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Incident Details */}
                <div className="bg-sov-dark p-6 rounded-lg">
                  {selectedIncident ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sov-light font-semibold text-lg mb-2">
                          {selectedIncident.title}
                        </h4>
                        <p className="text-sov-light-alt">{selectedIncident.description}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sov-light-alt text-sm">Severity</p>
                          <p className="text-sov-light font-semibold" style={{ color: getSeverityColor(selectedIncident.severity) }}>
                            {selectedIncident.severity.toUpperCase()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sov-light-alt text-sm">Status</p>
                          <select
                            value={selectedIncident.status}
                            onChange={(e) => handleUpdateIncidentStatus(selectedIncident.id, e.target.value as SecurityIncident['status'])}
                            className="bg-sov-dark-alt border border-gray-600 text-sov-light px-3 py-1 rounded text-sm"
                          >
                            <option value="open">Open</option>
                            <option value="investigating">Investigating</option>
                            <option value="contained">Contained</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                        </div>
                        <div>
                          <p className="text-sov-light-alt text-sm">Created</p>
                          <p className="text-sov-light font-semibold">
                            {new Date(selectedIncident.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sov-light-alt text-sm">Last Updated</p>
                          <p className="text-sov-light font-semibold">
                            {new Date(selectedIncident.updatedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sov-light-alt text-sm mb-2">Impact</p>
                        <p className="text-sov-light">{selectedIncident.impact}</p>
                      </div>

                      <div>
                        <p className="text-sov-light-alt text-sm mb-2">Affected Systems</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedIncident.affectedSystems.map((system, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-sov-accent/20 text-sov-accent rounded text-xs"
                            >
                              {system}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sov-light-alt text-sm">Quick Actions</p>
                        <div className="flex flex-wrap gap-2">
                          <button className="bg-sov-gold text-sov-dark font-semibold py-1 px-3 rounded text-sm hover:bg-sov-gold-hover transition-colors">
                            Contain
                          </button>
                          <button className="bg-sov-red text-sov-light font-semibold py-1 px-3 rounded text-sm hover:bg-sov-red-hover transition-colors">
                            Isolate
                          </button>
                          <button className="bg-sov-accent text-sov-dark font-semibold py-1 px-3 rounded text-sm hover:bg-sov-accent-hover transition-colors">
                            Escalate
                          </button>
                          <button className="bg-sov-green text-sov-light font-semibold py-1 px-3 rounded text-sm hover:bg-sov-green-hover transition-colors">
                            Resolve
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-sov-light-alt py-8">
                      Select an incident to view details
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Response Tab */}
          {activeTab === 'response' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-sov-light">Incident Response Playbooks</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { name: 'Data Breach Response', severity: 'critical', steps: 8 },
                  { name: 'DDoS Attack', severity: 'high', steps: 6 },
                  { name: 'Malware Infection', severity: 'high', steps: 7 },
                  { name: 'Unauthorized Access', severity: 'medium', steps: 5 },
                  { name: 'System Compromise', severity: 'critical', steps: 9 },
                  { name: 'Phishing Attack', severity: 'medium', steps: 4 }
                ].map((playbook, index) => (
                  <div key={index} className="bg-sov-dark p-6 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sov-light font-semibold">{playbook.name}</h4>
                      <span
                        className="px-2 py-1 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: `${getSeverityColor(playbook.severity)}20`,
                          color: getSeverityColor(playbook.severity)
                        }}
                      >
                        {playbook.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sov-light-alt text-sm mb-4">
                      {playbook.steps} step response process
                    </p>
                    <button className="w-full bg-sov-accent text-sov-dark font-semibold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors">
                      Execute Playbook
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Forensics Tab */}
          {activeTab === 'forensics' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-sov-light">Forensic Analysis</h3>
              
              <div className="bg-sov-dark p-6 rounded-lg">
                <h4 className="text-sov-light font-semibold mb-4">Forensic Tools & Capabilities</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 bg-sov-dark-alt rounded-lg">
                    <h5 className="text-sov-light font-medium mb-2">Memory Analysis</h5>
                    <p className="text-sov-light-alt text-sm">RAM dump analysis and malware detection</p>
                    <button className="mt-2 text-sov-accent hover:text-sov-accent-hover text-sm font-semibold">
                      Launch Tool
                    </button>
                  </div>
                  <div className="p-4 bg-sov-dark-alt rounded-lg">
                    <h5 className="text-sov-light font-medium mb-2">Disk Forensics</h5>
                    <p className="text-sov-light-alt text-sm">File system analysis and recovery</p>
                    <button className="mt-2 text-sov-accent hover:text-sov-accent-hover text-sm font-semibold">
                      Launch Tool
                    </button>
                  </div>
                  <div className="p-4 bg-sov-dark-alt rounded-lg">
                    <h5 className="text-sov-light font-medium mb-2">Network Analysis</h5>
                    <p className="text-sov-light-alt text-sm">Traffic analysis and packet capture</p>
                    <button className="mt-2 text-sov-accent hover:text-sov-accent-hover text-sm font-semibold">
                      Launch Tool
                    </button>
                  </div>
                </div>
              </div>

              {selectedIncident && (
                <div className="bg-sov-dark p-6 rounded-lg">
                  <h4 className="text-sov-light font-semibold mb-4">Timeline - {selectedIncident.title}</h4>
                  <div className="space-y-3">
                    {selectedIncident.timeline.map((event) => (
                      <div key={event.id} className="flex items-start space-x-4 p-3 bg-sov-dark-alt rounded-lg">
                        <div className="w-2 h-2 bg-sov-accent rounded-full mt-2"></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sov-light font-medium">{event.eventType}</span>
                            <span className="text-sov-light-alt text-sm">
                              {new Date(event.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sov-light-alt text-sm">{event.description}</p>
                          <p className="text-sov-light-alt text-xs">By: {event.userId}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Icon components
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

const EyeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

export default IncidentResponse;