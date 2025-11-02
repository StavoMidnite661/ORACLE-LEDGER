import React from 'react';
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
  Legend,
  LineChart,
  Line
} from 'recharts';

interface ComplianceKPIMetric {
  metric: string;
  value: number;
  target: number;
  trend: 'up' | 'down' | 'stable';
  unit: string;
  status: 'exceeds_target' | 'near_target' | 'below_target';
}

interface ComplianceHealthMonitorProps {
  healthScore: number;
  breakdown: {
    pciCompliance: number;
    nachaCompliance: number;
    amlCompliance: number;
    soxCompliance: number;
    bankingRegulations: number;
  };
  kpis: ComplianceKPIMetric[];
  detailed?: boolean;
  className?: string;
}

export const ComplianceHealthMonitor: React.FC<ComplianceHealthMonitorProps> = ({
  healthScore,
  breakdown,
  kpis,
  detailed = false,
  className = ''
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'exceeds_target': return 'text-sov-green';
      case 'near_target': return 'text-sov-gold';
      case 'below_target': return 'text-sov-red';
      default: return 'text-sov-light-alt';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'exceeds_target': return 'bg-sov-green/20';
      case 'near_target': return 'bg-sov-gold/20';
      case 'below_target': return 'bg-sov-red/20';
      default: return 'bg-gray-700';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      case 'stable': return '➡️';
      default: return '📊';
    }
  };

  const breakdownData = Object.entries(breakdown).map(([key, value]) => ({
    name: key.replace('Compliance', '').replace(/([A-Z])/g, ' $1').trim(),
    value: value,
    fullName: key
  }));

  const healthChartData = [
    { name: 'Current', value: healthScore, fill: healthScore >= 90 ? '#10b981' : healthScore >= 75 ? '#f59e0b' : '#ef4444' }
  ];

  return (
    <div className={`bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-sov-light">Compliance Health Monitor</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            healthScore >= 90 ? 'bg-sov-green animate-pulse' : 
            healthScore >= 75 ? 'bg-sov-gold' : 'bg-sov-red'
          }`}></div>
          <span className="text-sov-light font-semibold">
            {healthScore >= 90 ? 'Excellent' : healthScore >= 75 ? 'Good' : 'Needs Attention'}
          </span>
        </div>
      </div>

      <div className={`grid gap-6 ${detailed ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2'}`}>
        {/* Overall Health Score */}
        <div className="text-center">
          <h4 className="text-lg font-semibold mb-4 text-sov-light">Overall Health Score</h4>
          <ResponsiveContainer width="100%" height={200}>
            <RadialBarChart 
              cx="50%" 
              cy="50%" 
              innerRadius="60%" 
              outerRadius="90%" 
              data={healthChartData}
              startAngle={90}
              endAngle={-270}
            >
              <RadialBar 
                dataKey="value" 
                cornerRadius={10} 
                fill={healthScore >= 90 ? '#10b981' : healthScore >= 75 ? '#f59e0b' : '#ef4444'}
              />
              <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-sov-light text-3xl font-bold">
                {healthScore}%
              </text>
            </RadialBarChart>
          </ResponsiveContainer>
          <p className="text-sov-light-alt mt-2">
            Real-time compliance health assessment
          </p>
        </div>

        {/* Compliance Breakdown */}
        <div>
          <h4 className="text-lg font-semibold mb-4 text-sov-light">Compliance Breakdown</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={breakdownData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
              <XAxis type="number" domain={[0, 100]} stroke="#9ca3af" />
              <YAxis dataKey="name" type="category" width={80} stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }}
              />
              <Bar dataKey="value" fill="#2dd4bf" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* KPI Metrics */}
        {detailed && (
          <div className="lg:col-span-1">
            <h4 className="text-lg font-semibold mb-4 text-sov-light">Key Performance Indicators</h4>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {kpis.map((kpi, index) => (
                <div key={index} className="p-3 bg-sov-dark rounded-lg border border-gray-700">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-semibold text-sov-light text-sm">{kpi.metric}</h5>
                    <span className="text-xs">{getTrendIcon(kpi.trend)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-right">
                      <span className="text-lg font-bold text-sov-light">
                        {kpi.value} {kpi.unit}
                      </span>
                      <div className="text-xs text-sov-light-alt">
                        Target: {kpi.target} {kpi.unit}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBgColor(kpi.status)} ${getStatusColor(kpi.status)}`}>
                      {kpi.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        kpi.status === 'exceeds_target' ? 'bg-sov-green' :
                        kpi.status === 'near_target' ? 'bg-sov-gold' : 'bg-sov-red'
                      }`}
                      style={{ 
                        width: `${Math.min(100, (kpi.value / kpi.target) * 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {detailed && (
        <div className="mt-6 p-4 bg-sov-dark rounded-lg border border-gray-700">
          <h4 className="text-lg font-semibold mb-3 text-sov-light">Health Analysis</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-sov-green mb-1">
                {Object.values(breakdown).filter(score => score >= 90).length}
              </div>
              <div className="text-sov-light-alt">Standards Exceeding 90%</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-sov-gold mb-1">
                {Object.values(breakdown).filter(score => score >= 75 && score < 90).length}
              </div>
              <div className="text-sov-light-alt">Standards Near Target</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-sov-red mb-1">
                {Object.values(breakdown).filter(score => score < 75).length}
              </div>
              <div className="text-sov-light-alt">Standards Needing Attention</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
