import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  RadialBarChart, 
  RadialBar, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend
} from 'recharts';

interface TrainingCertification {
  name: string;
  completed: number;
  required: number;
  score: number;
}

interface TrainingMetrics {
  totalEmployees: number;
  completedTraining: number;
  pendingTraining: number;
  overdueTraining: number;
  completionRate: number;
  averageScore: number;
  certifications: TrainingCertification[];
}

interface ComplianceTrainingProps {
  trainingMetrics: TrainingMetrics;
  completionRate: number;
  averageScore: number;
  className?: string;
}

export const ComplianceTraining: React.FC<ComplianceTrainingProps> = ({
  trainingMetrics,
  completionRate,
  averageScore,
  className = ''
}) => {
  const [selectedView, setSelectedView] = useState<'overview' | 'certifications' | 'employees' | 'schedule'>('overview');
  const [selectedCertification, setSelectedCertification] = useState<string>('all');

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-sov-green';
    if (score >= 75) return 'text-sov-gold';
    return 'text-sov-red';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-sov-green/20';
    if (score >= 75) return 'bg-sov-gold/20';
    return 'bg-sov-red/20';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-sov-green/20 text-sov-green';
      case 'in_progress': return 'bg-sov-accent/20 text-sov-accent';
      case 'overdue': return 'bg-sov-red/20 text-sov-red';
      case 'pending': return 'bg-sov-gold/20 text-sov-gold';
      default: return 'bg-gray-700 text-gray-300';
    }
  };

  // Mock employee data
  const mockEmployees = [
    { id: '1', name: 'John Smith', email: 'john.smith@company.com', certifications: 4, lastCompletion: '2024-10-15', status: 'completed' },
    { id: '2', name: 'Sarah Johnson', email: 'sarah.johnson@company.com', certifications: 3, lastCompletion: '2024-09-20', status: 'in_progress' },
    { id: '3', name: 'Mike Davis', email: 'mike.davis@company.com', certifications: 4, lastCompletion: '2024-11-01', status: 'completed' },
    { id: '4', name: 'Lisa Wilson', email: 'lisa.wilson@company.com', certifications: 2, lastCompletion: '2024-08-10', status: 'overdue' },
    { id: '5', name: 'David Brown', email: 'david.brown@company.com', certifications: 3, lastCompletion: '2024-10-30', status: 'pending' },
    { id: '6', name: 'Emily Garcia', email: 'emily.garcia@company.com', certifications: 4, lastCompletion: '2024-11-02', status: 'completed' }
  ];

  // Mock upcoming training sessions
  const mockTrainingSessions = [
    {
      id: 'session-1',
      title: 'Advanced PCI DSS Training',
      date: '2024-11-15',
      time: '09:00 AM',
      duration: '2 hours',
      instructor: 'Security Team',
      attendees: 25,
      capacity: 30,
      status: 'scheduled'
    },
    {
      id: 'session-2',
      title: 'AML Compliance Workshop',
      date: '2024-11-20',
      time: '02:00 PM',
      duration: '3 hours',
      instructor: 'Compliance Officer',
      attendees: 15,
      capacity: 20,
      status: 'scheduled'
    },
    {
      id: 'session-3',
      title: 'Data Protection Fundamentals',
      date: '2024-11-25',
      time: '10:00 AM',
      duration: '1.5 hours',
      instructor: 'Legal Team',
      attendees: 45,
      capacity: 50,
      status: 'open'
    }
  ];

  const completionChartData = [
    {
      name: 'Completion Rate',
      value: completionRate,
      fill: completionRate >= 90 ? '#10b981' : completionRate >= 75 ? '#f59e0b' : '#ef4444'
    }
  ];

  const certificationChartData = trainingMetrics.certifications.map(cert => ({
    name: cert.name.replace(' ', '\n'),
    completed: cert.completed,
    required: cert.required,
    score: cert.score
  }));

  const trainingStatusData = [
    { status: 'Completed', count: trainingMetrics.completedTraining, color: '#10b981' },
    { status: 'In Progress', count: Math.floor(trainingMetrics.pendingTraining * 0.6), color: '#2dd4bf' },
    { status: 'Pending', count: Math.floor(trainingMetrics.pendingTraining * 0.3), color: '#f59e0b' },
    { status: 'Overdue', count: trainingMetrics.overdueTraining, color: '#ef4444' }
  ];

  return (
    <div className={`bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-sov-light">Compliance Training & Certification</h3>
        <div className="flex gap-2">
          <button className="bg-sov-accent text-sov-dark font-semibold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors">
            Schedule Training
          </button>
          <button className="bg-sov-dark-alt border border-gray-600 text-sov-light font-semibold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors">
            Generate Report
          </button>
        </div>
      </div>

      {/* Overview Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-sov-dark rounded-lg border border-gray-700">
          <div className="text-3xl font-bold text-sov-light mb-1">{trainingMetrics.totalEmployees}</div>
          <div className="text-sm text-sov-light-alt">Total Employees</div>
        </div>
        <div className="text-center p-4 bg-sov-dark rounded-lg border border-gray-700">
          <div className="text-3xl font-bold text-sov-green mb-1">{trainingMetrics.completedTraining}</div>
          <div className="text-sm text-sov-light-alt">Completed Training</div>
        </div>
        <div className="text-center p-4 bg-sov-dark rounded-lg border border-gray-700">
          <div className="text-3xl font-bold text-sov-gold mb-1">{trainingMetrics.pendingTraining}</div>
          <div className="text-sm text-sov-light-alt">Pending Training</div>
        </div>
        <div className="text-center p-4 bg-sov-dark rounded-lg border border-gray-700">
          <div className="text-3xl font-bold text-sov-red mb-1">{trainingMetrics.overdueTraining}</div>
          <div className="text-sm text-sov-light-alt">Overdue Training</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap border-b border-gray-700 mb-6">
        {[
          { key: 'overview', label: 'Overview', icon: '📊' },
          { key: 'certifications', label: 'Certifications', icon: '🏆' },
          { key: 'employees', label: 'Employees', icon: '👥' },
          { key: 'schedule', label: 'Schedule', icon: '📅' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setSelectedView(tab.key as any)}
            className={`flex items-center space-x-2 px-4 py-3 font-semibold transition-colors ${
              selectedView === tab.key
                ? 'text-sov-accent border-b-2 border-sov-accent bg-sov-dark/50'
                : 'text-sov-light-alt hover:text-sov-light hover:bg-sov-dark/25'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {selectedView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Overall Completion Rate */}
          <div className="bg-sov-dark p-4 rounded-lg border border-gray-700">
            <h4 className="text-lg font-semibold mb-4 text-sov-light">Overall Completion Rate</h4>
            <ResponsiveContainer width="100%" height={200}>
              <RadialBarChart 
                cx="50%" 
                cy="50%" 
                innerRadius="60%" 
                outerRadius="90%" 
                data={completionChartData}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar 
                  dataKey="value" 
                  cornerRadius={10} 
                  fill={completionRate >= 90 ? '#10b981' : completionRate >= 75 ? '#f59e0b' : '#ef4444'}
                />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-sov-light text-2xl font-bold">
                  {completionRate.toFixed(1)}%
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="text-center text-sov-light-alt mt-2">
              Average Score: <span className={`font-semibold ${getScoreColor(averageScore)}`}>{averageScore}%</span>
            </div>
          </div>

          {/* Training Status Distribution */}
          <div className="bg-sov-dark p-4 rounded-lg border border-gray-700">
            <h4 className="text-lg font-semibold mb-4 text-sov-light">Training Status Distribution</h4>
            <div className="space-y-3">
              {trainingStatusData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sov-light">{item.status}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-sov-light">{item.count}</div>
                    <div className="text-sm text-sov-light-alt">
                      {((item.count / trainingMetrics.totalEmployees) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Certification Progress */}
          <div className="lg:col-span-2 bg-sov-dark p-4 rounded-lg border border-gray-700">
            <h4 className="text-lg font-semibold mb-4 text-sov-light">Certification Progress</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={certificationChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }}
                />
                <Legend />
                <Bar dataKey="completed" fill="#10b981" name="Completed" />
                <Bar dataKey="required" fill="#374151" name="Required" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Certifications Tab */}
      {selectedView === 'certifications' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-semibold text-sov-light">Training Certifications</h4>
            <select 
              value={selectedCertification}
              onChange={(e) => setSelectedCertification(e.target.value)}
              className="bg-sov-dark border border-gray-600 text-sov-light px-3 py-2 rounded-lg"
            >
              <option value="all">All Certifications</option>
              {trainingMetrics.certifications.map(cert => (
                <option key={cert.name} value={cert.name}>{cert.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {trainingMetrics.certifications.map((cert, index) => (
              <div key={index} className="p-4 bg-sov-dark rounded-lg border border-gray-700">
                <div className="flex justify-between items-start mb-3">
                  <h5 className="font-semibold text-sov-light">{cert.name}</h5>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getScoreBgColor(cert.score)} ${getScoreColor(cert.score)}`}>
                    {cert.score}% Avg
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-sov-light-alt">Completion:</span>
                    <span className="text-sov-light font-semibold">
                      {cert.completed} / {cert.required}
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div 
                      className="bg-sov-accent h-3 rounded-full transition-all duration-500"
                      style={{ width: `${(cert.completed / cert.required) * 100}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between text-xs text-sov-light-alt">
                    <span>{((cert.completed / cert.required) * 100).toFixed(1)}% Complete</span>
                    <span>{cert.required - cert.completed} Remaining</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button className="flex-1 bg-sov-accent/10 text-sov-accent font-semibold py-2 px-3 rounded-lg hover:bg-sov-accent/20 transition-colors text-sm">
                    View Details
                  </button>
                  <button className="bg-sov-dark-alt border border-gray-600 text-sov-light font-semibold py-2 px-3 rounded-lg hover:bg-gray-700 transition-colors text-sm">
                    Assign
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Employees Tab */}
      {selectedView === 'employees' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-semibold text-sov-light">Employee Training Status</h4>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search employees..."
                className="bg-sov-dark border border-gray-600 text-sov-light px-3 py-2 rounded-lg text-sm"
              />
              <button className="bg-sov-dark-alt border border-gray-600 text-sov-light font-semibold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors text-sm">
                Export
              </button>
            </div>
          </div>

          <div className="bg-sov-dark rounded-lg border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-sov-dark-alt border-b border-gray-700">
                  <tr>
                    <th className="text-left p-3 text-sov-light font-semibold">Employee</th>
                    <th className="text-left p-3 text-sov-light font-semibold">Email</th>
                    <th className="text-left p-3 text-sov-light font-semibold">Certifications</th>
                    <th className="text-left p-3 text-sov-light font-semibold">Last Completion</th>
                    <th className="text-left p-3 text-sov-light font-semibold">Status</th>
                    <th className="text-left p-3 text-sov-light font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mockEmployees.map(employee => (
                    <tr key={employee.id} className="border-b border-gray-700 hover:bg-sov-dark/50">
                      <td className="p-3 text-sov-light font-semibold">{employee.name}</td>
                      <td className="p-3 text-sov-light-alt text-sm">{employee.email}</td>
                      <td className="p-3 text-sov-light">{employee.certifications} / 4</td>
                      <td className="p-3 text-sov-light-alt text-sm">
                        {new Date(employee.lastCompletion).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(employee.status)}`}>
                          {employee.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button className="text-sov-accent hover:text-sov-accent/80 text-sm">View</button>
                          <button className="text-sov-light hover:text-sov-light/80 text-sm">Assign</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Tab */}
      {selectedView === 'schedule' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-semibold text-sov-light">Upcoming Training Sessions</h4>
            <button className="bg-sov-accent text-sov-dark font-semibold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors">
              Schedule New Session
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockTrainingSessions.map(session => (
              <div key={session.id} className="p-4 bg-sov-dark rounded-lg border border-gray-700">
                <div className="flex justify-between items-start mb-3">
                  <h5 className="font-semibold text-sov-light">{session.title}</h5>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    session.status === 'scheduled' ? 'bg-sov-accent/20 text-sov-accent' :
                    session.status === 'open' ? 'bg-sov-green/20 text-sov-green' :
                    'bg-sov-gold/20 text-sov-gold'
                  }`}>
                    {session.status}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-sov-light-alt">
                  <div className="flex items-center space-x-2">
                    <span>📅</span>
                    <span>{new Date(session.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>🕐</span>
                    <span>{session.time} ({session.duration})</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>👨‍🏫</span>
                    <span>{session.instructor}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>👥</span>
                    <span>{session.attendees} / {session.capacity} attendees</span>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-sov-accent h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(session.attendees / session.capacity) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-sov-light-alt mt-1">
                    {((session.attendees / session.capacity) * 100).toFixed(0)}% capacity
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button className="flex-1 bg-sov-accent/10 text-sov-accent font-semibold py-2 px-3 rounded-lg hover:bg-sov-accent/20 transition-colors text-sm">
                    View Details
                  </button>
                  <button className="bg-sov-dark-alt border border-gray-600 text-sov-light font-semibold py-2 px-3 rounded-lg hover:bg-gray-700 transition-colors text-sm">
                    Manage
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
