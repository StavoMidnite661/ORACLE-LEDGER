import React, { useState, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import type { StripeWebhookEvent } from '../../types';

// Mock webhook data - In production, this would come from your webhook monitoring API
const mockWebhookData = {
  recentEvents: [
    {
      id: 'wh-001',
      stripeEventId: 'evt_3Nx4aK2Abc123...',
      eventType: 'payment_intent.succeeded',
      description: 'Payment succeeded',
      status: 'processed',
      processingTime: 156,
      timestamp: '2024-11-02T14:35:22Z',
      customerId: 'cus_123abc',
      retryCount: 0,
      errorMessage: null,
      endpoint: '/webhooks/stripe'
    },
    {
      id: 'wh-002',
      stripeEventId: 'evt_3Ny8bL3Def456...',
      eventType: 'payment_intent.payment_failed',
      description: 'Payment failed',
      status: 'failed',
      processingTime: 89,
      timestamp: '2024-11-02T14:32:15Z',
      customerId: 'cus_456def',
      retryCount: 2,
      errorMessage: 'Insufficient funds',
      endpoint: '/webhooks/stripe'
    },
    {
      id: 'wh-003',
      stripeEventId: 'evt_3Nz2cM4Ghi789...',
      eventType: 'customer.created',
      description: 'New customer created',
      status: 'processed',
      processingTime: 234,
      timestamp: '2024-11-02T14:30:45Z',
      customerId: null,
      retryCount: 0,
      errorMessage: null,
      endpoint: '/webhooks/stripe'
    },
    {
      id: 'wh-004',
      stripeEventId: 'evt_3N04dN5Jkl012...',
      eventType: 'charge.dispute.created',
      description: 'Dispute created',
      status: 'processed',
      processingTime: 445,
      timestamp: '2024-11-02T14:28:10Z',
      customerId: 'cus_789ghi',
      retryCount: 0,
      errorMessage: null,
      endpoint: '/webhooks/stripe'
    },
    {
      id: 'wh-005',
      stripeEventId: 'evt_3N15eO6Mno345...',
      eventType: 'invoice.payment_succeeded',
      description: 'Invoice payment succeeded',
      status: 'retry',
      processingTime: 1200,
      timestamp: '2024-11-02T14:25:33Z',
      customerId: 'cus_012jkl',
      retryCount: 1,
      errorMessage: 'Timeout connecting to database',
      endpoint: '/webhooks/stripe'
    }
  ],
  processingStatus: {
    totalEvents: 15847,
    processed: 15634,
    pending: 12,
    failed: 34,
    retrying: 167,
    processingRate: 98.7
  },
  eventTypeBreakdown: [
    { type: 'payment_intent.succeeded', count: 4523, percentage: 28.5, color: '#10b981' },
    { type: 'payment_intent.payment_failed', count: 1205, percentage: 7.6, color: '#ef4444' },
    { type: 'customer.created', count: 892, percentage: 5.6, color: '#6366f1' },
    { type: 'customer.updated', count: 1876, percentage: 11.8, color: '#8b5cf6' },
    { type: 'charge.dispute.created', count: 123, percentage: 0.8, color: '#f59e0b' },
    { type: 'invoice.payment_succeeded', count: 2156, percentage: 13.6, color: '#2dd4bf' },
    { type: 'invoice.payment_failed', count: 456, percentage: 2.9, color: '#fb7185' },
    { type: 'subscription.created', count: 334, percentage: 2.1, color: '#14b8a6' },
    { type: 'subscription.updated', count: 612, percentage: 3.9, color: '#06b6d4' },
    { type: 'other', count: 3670, percentage: 23.2, color: '#64748b' }
  ],
  performanceMetrics: {
    avgProcessingTime: 234,
    minProcessingTime: 45,
    maxProcessingTime: 2847,
    successRate: 98.7,
    dailyVolume: [
      { date: '2024-10-27', events: 1247, processed: 1234, failed: 13 },
      { date: '2024-10-28', events: 1389, processed: 1372, failed: 17 },
      { date: '2024-10-29', events: 1156, processed: 1142, failed: 14 },
      { date: '2024-10-30', events: 1523, processed: 1501, failed: 22 },
      { date: '2024-10-31', events: 1678, processed: 1654, failed: 24 },
      { date: '2024-11-01', events: 1834, processed: 1812, failed: 22 },
      { date: '2024-11-02', events: 1456, processed: 1439, failed: 17 }
    ],
    processingTimes: [
      { time: '00:00-01:00', avgTime: 189, events: 45 },
      { time: '01:00-02:00', avgTime: 156, events: 23 },
      { time: '02:00-03:00', avgTime: 203, events: 67 },
      { time: '03:00-04:00', avgTime: 178, events: 89 },
      { time: '04:00-05:00', avgTime: 234, events: 112 },
      { time: '05:00-06:00', avgTime: 267, events: 134 },
      { time: '06:00-07:00', avgTime: 289, events: 156 },
      { time: '07:00-08:00', avgTime: 312, events: 178 },
      { time: '08:00-09:00', avgTime: 345, events: 201 },
      { time: '09:00-10:00', avgTime: 298, events: 234 },
      { time: '10:00-11:00', avgTime: 267, events: 267 },
      { time: '11:00-12:00', avgTime: 245, events: 289 },
      { time: '12:00-13:00', avgTime: 223, events: 312 },
      { time: '13:00-14:00', avgTime: 234, events: 298 },
      { time: '14:00-15:00', avgTime: 256, events: 276 },
      { time: '15:00-16:00', avgTime: 278, events: 254 },
      { time: '16:00-17:00', avgTime: 267, events: 289 },
      { time: '17:00-18:00', avgTime: 245, events: 267 },
      { time: '18:00-19:00', avgTime: 223, events: 234 },
      { time: '19:00-20:00', avgTime: 201, events: 198 },
      { time: '20:00-21:00', avgTime: 189, events: 167 },
      { time: '21:00-22:00', avgTime: 167, events: 134 },
      { time: '22:00-23:00', avgTime: 145, events: 112 },
      { time: '23:00-00:00', avgTime: 134, events: 89 }
    ]
  },
  failedEvents: [
    {
      id: 'failed-001',
      stripeEventId: 'evt_3Ny8bL3Def456...',
      eventType: 'payment_intent.payment_failed',
      failureReason: 'Insufficient funds',
      customerId: 'cus_456def',
      retryCount: 2,
      lastAttempt: '2024-11-02T14:32:15Z',
      nextRetry: '2024-11-02T16:32:15Z',
      endpoint: '/webhooks/stripe'
    },
    {
      id: 'failed-002',
      stripeEventId: 'evt_3N15eO6Mno345...',
      eventType: 'invoice.payment_succeeded',
      failureReason: 'Timeout connecting to database',
      customerId: 'cus_012jkl',
      retryCount: 1,
      lastAttempt: '2024-11-02T14:25:33Z',
      nextRetry: '2024-11-02T15:25:33Z',
      endpoint: '/webhooks/stripe'
    }
  ]
};

interface WebhookStatusProps {
  className?: string;
}

export const WebhookStatus: React.FC<WebhookStatusProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'performance' | 'debugging'>('overview');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatProcessingTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed': return 'text-sov-green';
      case 'pending': return 'text-sov-gold';
      case 'failed': return 'text-sov-red';
      case 'retry': return 'text-sov-accent';
      default: return 'text-sov-light-alt';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed':
        return <CheckIcon className="h-4 w-4 text-sov-green" />;
      case 'pending':
        return <ClockIcon className="h-4 w-4 text-sov-gold" />;
      case 'failed':
        return <XIcon className="h-4 w-4 text-sov-red" />;
      case 'retry':
        return <RefreshIcon className="h-4 w-4 text-sov-accent" />;
      default:
        return null;
    }
  };

  const handleRetryEvent = (eventId: string) => {
    console.log(`Retrying event ${eventId}...`);
    // Implementation would trigger the retry
  };

  const handleRetryAll = () => {
    console.log('Retrying all failed events...');
    // Implementation would retry all failed events
  };

  const exportEventLog = () => {
    console.log('Exporting event log...');
    // Implementation would handle the export
  };

  const filteredEvents = mockWebhookData.recentEvents.filter(
    event => selectedStatus === 'all' || event.status === selectedStatus
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-sov-light">Webhook Status Monitor</h1>
          <p className="text-sov-light-alt">Real-time monitoring of Stripe webhook events and processing</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`font-bold py-2 px-4 rounded-lg transition-colors ${
              autoRefresh 
                ? 'bg-sov-green text-sov-dark hover:bg-green-400' 
                : 'bg-sov-dark-alt border border-gray-600 text-sov-light hover:bg-gray-700'
            }`}
          >
            Auto Refresh {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <button 
            onClick={handleRetryAll}
            className="bg-sov-accent text-sov-dark font-bold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors"
          >
            Retry Failed Events
          </button>
          <button 
            onClick={exportEventLog}
            className="bg-sov-dark-alt border border-gray-600 text-sov-light font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Export Log
          </button>
        </div>
      </div>

      {/* Processing Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-sov-light">Total Events</h3>
            <DatabaseIcon className="h-6 w-6 text-sov-accent" />
          </div>
          <p className="text-3xl font-bold text-sov-light">
            {mockWebhookData.processingStatus.totalEvents.toLocaleString()}
          </p>
          <p className="text-sm text-sov-light-alt mt-1">Last 30 days</p>
        </div>

        <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-sov-light">Processed</h3>
            <CheckCircleIcon className="h-6 w-6 text-sov-green" />
          </div>
          <p className="text-3xl font-bold text-sov-green">
            {mockWebhookData.processingStatus.processed.toLocaleString()}
          </p>
          <p className="text-sm text-sov-light-alt mt-1">
            {mockWebhookData.processingStatus.processingRate}% success rate
          </p>
        </div>

        <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-sov-light">Pending</h3>
            <ClockIcon className="h-6 w-6 text-sov-gold" />
          </div>
          <p className="text-3xl font-bold text-sov-gold">
            {mockWebhookData.processingStatus.pending.toLocaleString()}
          </p>
          <p className="text-sm text-sov-light-alt mt-1">Awaiting processing</p>
        </div>

        <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-sov-light">Failed</h3>
            <XCircleIcon className="h-6 w-6 text-sov-red" />
          </div>
          <p className="text-3xl font-bold text-sov-red">
            {mockWebhookData.processingStatus.failed.toLocaleString()}
          </p>
          <p className="text-sm text-sov-light-alt mt-1">Require attention</p>
        </div>

        <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-sov-light">Avg Time</h3>
            <ClockIcon className="h-6 w-6 text-sov-accent" />
          </div>
          <p className="text-3xl font-bold text-sov-accent">
            {formatProcessingTime(mockWebhookData.performanceMetrics.avgProcessingTime)}
          </p>
          <p className="text-sm text-sov-light-alt mt-1">Processing time</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-sov-dark-alt rounded-lg shadow-lg border border-gray-700">
        <div className="flex flex-wrap border-b border-gray-700">
          {[
            { key: 'overview', label: 'Overview', count: mockWebhookData.processingStatus.totalEvents },
            { key: 'events', label: 'Recent Events', count: mockWebhookData.recentEvents.length },
            { key: 'performance', label: 'Performance', count: mockWebhookData.performanceMetrics.dailyVolume.length },
            { key: 'debugging', label: 'Debugging', count: mockWebhookData.failedEvents.length }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center space-x-2 px-6 py-4 font-semibold transition-colors ${
                activeTab === tab.key
                  ? 'text-sov-accent border-b-2 border-sov-accent bg-sov-dark/50'
                  : 'text-sov-light-alt hover:text-sov-light hover:bg-sov-dark/25'
              }`}
            >
              <span>{tab.label}</span>
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
                  <h3 className="text-xl font-semibold mb-4 text-sov-light">Event Type Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={mockWebhookData.eventTypeBreakdown}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="count"
                        label={({ type, percentage }) => `${type.split('.')[0]}: ${percentage}%`}
                        labelLine={false}
                        fontSize={10}
                      >
                        {mockWebhookData.eventTypeBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4 text-sov-light">Daily Event Volume</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={mockWebhookData.performanceMetrics.dailyVolume}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                      <XAxis dataKey="date" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="events" 
                        name="Total Events" 
                        stackId="1" 
                        stroke="#2dd4bf" 
                        fill="#2dd4bf" 
                        fillOpacity={0.6} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="failed" 
                        name="Failed Events" 
                        stackId="2" 
                        stroke="#ef4444" 
                        fill="#ef4444" 
                        fillOpacity={0.6} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4 text-sov-light">Top Event Types</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {mockWebhookData.eventTypeBreakdown.slice(0, 6).map((eventType) => (
                    <div key={eventType.type} className="p-4 bg-sov-dark rounded-lg border border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sov-light text-sm">
                          {eventType.type.split('.').join(' ').toUpperCase()}
                        </span>
                        <span 
                          className="px-2 py-1 rounded-full text-xs font-semibold"
                          style={{ 
                            backgroundColor: `${eventType.color}20`, 
                            color: eventType.color 
                          }}
                        >
                          {eventType.percentage}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-sov-light-alt">Count:</span>
                        <span className="text-sov-light font-semibold">{eventType.count.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Recent Events Tab */}
          {activeTab === 'events' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-sov-light">Recent Webhook Events</h3>
                <select 
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-sov-dark border border-gray-600 text-sov-light px-3 py-2 rounded-lg"
                >
                  <option value="all">All Status</option>
                  <option value="processed">Processed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="retry">Retry</option>
                </select>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="p-3">Event ID</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Description</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Processing Time</th>
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.map((event) => (
                      <tr key={event.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                        <td className="p-3">
                          <p className="font-mono text-sm text-sov-light-alt">{event.stripeEventId}</p>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-1 bg-sov-accent/20 text-sov-accent rounded-full text-xs font-semibold">
                            {event.eventType.split('.')[1] || event.eventType}
                          </span>
                        </td>
                        <td className="p-3 text-sov-light">{event.description}</td>
                        <td className="p-3 text-sov-light-alt">
                          {event.customerId ? event.customerId : 'N/A'}
                        </td>
                        <td className="p-3">
                          <span className={`font-semibold ${
                            event.processingTime < 200 ? 'text-sov-green' :
                            event.processingTime < 500 ? 'text-sov-gold' : 'text-sov-red'
                          }`}>
                            {formatProcessingTime(event.processingTime)}
                          </span>
                        </td>
                        <td className="p-3 text-sov-light-alt">
                          {formatTimestamp(event.timestamp)}
                        </td>
                        <td className="p-3">
                          <div className={`flex items-center space-x-1 ${getStatusColor(event.status)}`}>
                            {getStatusIcon(event.status)}
                            <span className="text-sm capitalize">{event.status}</span>
                            {event.retryCount > 0 && (
                              <span className="text-xs text-sov-gold">({event.retryCount})</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleRetryEvent(event.id)}
                              className="text-sov-accent hover:text-sov-accent-hover text-sm font-semibold"
                            >
                              Retry
                            </button>
                            <button className="text-sov-light-alt hover:text-sov-light text-sm">
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-sov-light">Processing Time by Hour</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={mockWebhookData.performanceMetrics.processingTimes}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                      <XAxis dataKey="time" stroke="#9ca3af" angle={-45} textAnchor="end" height={100} />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="avgTime" 
                        name="Avg Processing Time (ms)" 
                        stroke="#2dd4bf" 
                        strokeWidth={3}
                        dot={{ fill: '#2dd4bf', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4 text-sov-light">Event Volume by Hour</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={mockWebhookData.performanceMetrics.processingTimes}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                      <XAxis dataKey="time" stroke="#9ca3af" angle={-45} textAnchor="end" height={100} />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="events" 
                        name="Event Count" 
                        stroke="#6366f1" 
                        fill="#6366f1" 
                        fillOpacity={0.6} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-sov-dark rounded-lg">
                  <p className="text-2xl font-bold text-sov-green">
                    {formatProcessingTime(mockWebhookData.performanceMetrics.minProcessingTime)}
                  </p>
                  <p className="text-sm text-sov-light-alt">Min Processing Time</p>
                </div>
                <div className="text-center p-6 bg-sov-dark rounded-lg">
                  <p className="text-2xl font-bold text-sov-accent">
                    {formatProcessingTime(mockWebhookData.performanceMetrics.avgProcessingTime)}
                  </p>
                  <p className="text-sm text-sov-light-alt">Average Processing Time</p>
                </div>
                <div className="text-center p-6 bg-sov-dark rounded-lg">
                  <p className="text-2xl font-bold text-sov-red">
                    {formatProcessingTime(mockWebhookData.performanceMetrics.maxProcessingTime)}
                  </p>
                  <p className="text-sm text-sov-light-alt">Max Processing Time</p>
                </div>
              </div>
            </div>
          )}

          {/* Debugging Tab */}
          {activeTab === 'debugging' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-sov-light">Failed Events & Debugging Tools</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold mb-4 text-sov-light">Failed Events</h4>
                  <div className="space-y-4">
                    {mockWebhookData.failedEvents.map((failed) => (
                      <div key={failed.id} className="p-4 bg-sov-dark rounded-lg border border-sov-red/30">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h5 className="font-semibold text-sov-light">{failed.eventType}</h5>
                            <p className="text-sm text-sov-light-alt">{failed.stripeEventId}</p>
                          </div>
                          <span className="px-2 py-1 bg-sov-red/20 text-sov-red rounded-full text-xs font-semibold">
                            FAILED
                          </span>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-sov-light-alt">Failure Reason:</span>
                            <span className="text-sov-light font-semibold">{failed.failureReason}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sov-light-alt">Retry Count:</span>
                            <span className="text-sov-light font-semibold">{failed.retryCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sov-light-alt">Next Retry:</span>
                            <span className="text-sov-light font-semibold">
                              {formatTimestamp(failed.nextRetry)}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                          <button 
                            onClick={() => handleRetryEvent(failed.id)}
                            className="flex-1 bg-sov-accent/10 text-sov-accent font-semibold py-2 px-3 rounded-lg hover:bg-sov-accent/20 transition-colors"
                          >
                            Retry Now
                          </button>
                          <button className="bg-sov-dark-alt border border-gray-600 text-sov-light font-semibold py-2 px-3 rounded-lg hover:bg-gray-700 transition-colors">
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-4 text-sov-light">Debugging Tools</h4>
                  <div className="space-y-4">
                    <div className="p-4 bg-sov-dark rounded-lg border border-gray-700">
                      <h5 className="font-semibold text-sov-light mb-2">Endpoint Health Check</h5>
                      <p className="text-sm text-sov-light-alt mb-3">
                        Check the status of webhook endpoints and connectivity
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sov-green font-semibold">Status: Healthy</span>
                        <button className="bg-sov-accent text-sov-dark font-semibold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors">
                          Check Now
                        </button>
                      </div>
                    </div>

                    <div className="p-4 bg-sov-dark rounded-lg border border-gray-700">
                      <h5 className="font-semibold text-sov-light mb-2">Database Connection Test</h5>
                      <p className="text-sm text-sov-light-alt mb-3">
                        Verify database connectivity for event processing
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sov-green font-semibold">Connected</span>
                        <button className="bg-sov-accent text-sov-dark font-semibold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors">
                          Test Connection
                        </button>
                      </div>
                    </div>

                    <div className="p-4 bg-sov-dark rounded-lg border border-gray-700">
                      <h5 className="font-semibold text-sov-light mb-2">Event Queue Analysis</h5>
                      <p className="text-sm text-sov-light-alt mb-3">
                        Analyze processing queue and identify bottlenecks
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sov-gold font-semibold">Queue: 12 events</span>
                        <button className="bg-sov-accent text-sov-dark font-semibold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors">
                          Analyze
                        </button>
                      </div>
                    </div>

                    <div className="p-4 bg-sov-dark rounded-lg border border-gray-700">
                      <h5 className="font-semibold text-sov-light mb-2">Test Webhook Delivery</h5>
                      <p className="text-sm text-sov-light-alt mb-3">
                        Send test events to verify webhook processing
                      </p>
                      <button className="w-full bg-sov-accent text-sov-dark font-semibold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors">
                        Send Test Event
                      </button>
                    </div>
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

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
  </svg>
);

const RefreshIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
  </svg>
);

const DatabaseIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
  </svg>
);

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const XCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
  </svg>
);