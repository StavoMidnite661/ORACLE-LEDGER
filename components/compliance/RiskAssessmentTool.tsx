import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  BarChart,
  Bar,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

interface RiskFactor {
  factor: string;
  score: number;
  status: 'low' | 'medium' | 'high';
}

interface RiskMatrixItem {
  impact: 'low' | 'medium' | 'high';
  probability: 'low' | 'medium' | 'high';
  risk: 'low' | 'medium' | 'high';
  count: number;
}

interface RiskTrend {
  month: string;
  riskScore: number;
}

interface RiskAssessmentToolProps {
  riskMatrix: RiskMatrixItem[];
  riskFactors: RiskFactor[];
  trends: RiskTrend[];
  className?: string;
}

export const RiskAssessmentTool: React.FC<RiskAssessmentToolProps> = ({
  riskMatrix,
  riskFactors,
  trends,
  className = ''
}) => {
  const [selectedView, setSelectedView] = useState<'matrix' | 'factors' | 'trends' | 'radar'>('matrix');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'3m' | '6m' | '1y'>('6m');

  const getRiskColor = (risk: string, opacity: number = 1) => {
    switch (risk) {
      case 'low': return `rgba(16, 185, 129, ${opacity})`;
      case 'medium': return `rgba(245, 158, 11, ${opacity})`;
      case 'high': return `rgba(239, 68, 68, ${opacity})`;
      default: return `rgba(107, 114, 128, ${opacity})`;
    }
  };

  const getScoreColor = (score: number) => {
    if (score <= 2) return 'text-sov-green';
    if (score <= 3.5) return 'text-sov-gold';
    return 'text-sov-red';
  };

  const getScoreBgColor = (score: number) => {
    if (score <= 2) return 'bg-sov-green/20';
    if (score <= 3.5) return 'bg-sov-gold/20';
    return 'bg-sov-red/20';
  };

  // Prepare risk matrix data for heat map
  const matrixData = riskMatrix.map(item => ({
    ...item,
    x: item.impact === 'low' ? 1 : item.impact === 'medium' ? 2 : 3,
    y: item.probability === 'low' ? 1 : item.probability === 'medium' ? 2 : 3,
    z: item.count
  }));

  // Prepare radar chart data
  const radarData = riskFactors.map(factor => ({
    factor: factor.factor,
    score: factor.score,
    fullMark: 5
  }));

  // Calculate overall risk score
  const overallRiskScore = riskFactors.reduce((sum, factor) => sum + factor.score, 0) / riskFactors.length;

  return (
    <div className={`bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-sov-light">Risk Assessment Tool</h3>
        <div className="flex gap-2">
          <select 
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value as '3m' | '6m' | '1y')}
            className="bg-sov-dark border border-gray-600 text-sov-light px-3 py-2 rounded-lg text-sm"
          >
            <option value="3m">Last 3 Months</option>
            <option value="6m">Last 6 Months</option>
            <option value="1y">Last Year</option>
          </select>
          <div className="flex bg-sov-dark border border-gray-600 rounded-lg overflow-hidden">
            {[
              { key: 'matrix', label: 'Risk Matrix', icon: '🎯' },
              { key: 'factors', label: 'Factors', icon: '📊' },
              { key: 'trends', label: 'Trends', icon: '📈' },
              { key: 'radar', label: 'Radar', icon: '🕸️' }
            ].map(view => (
              <button
                key={view.key}
                onClick={() => setSelectedView(view.key as any)}
                className={`flex items-center space-x-1 px-3 py-2 text-sm font-semibold ${
                  selectedView === view.key ? 'bg-sov-accent text-sov-dark' : 'text-sov-light hover:bg-gray-700'
                }`}
              >
                <span>{view.icon}</span>
                <span className="hidden sm:inline">{view.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Risk Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-sov-dark rounded-lg border border-gray-700">
          <div className={`text-3xl font-bold mb-2 ${getScoreColor(overallRiskScore)}`}>
            {overallRiskScore.toFixed(1)}
          </div>
          <div className="text-sm text-sov-light-alt">Overall Risk Score</div>
        </div>
        <div className="text-center p-4 bg-sov-dark rounded-lg border border-gray-700">
          <div className="text-3xl font-bold text-sov-green mb-2">
            {riskMatrix.filter(item => item.risk === 'low').reduce((sum, item) => sum + item.count, 0)}
          </div>
          <div className="text-sm text-sov-light-alt">Low Risk Items</div>
        </div>
        <div className="text-center p-4 bg-sov-dark rounded-lg border border-gray-700">
          <div className="text-3xl font-bold text-sov-gold mb-2">
            {riskMatrix.filter(item => item.risk === 'medium').reduce((sum, item) => sum + item.count, 0)}
          </div>
          <div className="text-sm text-sov-light-alt">Medium Risk Items</div>
        </div>
        <div className="text-center p-4 bg-sov-dark rounded-lg border border-gray-700">
          <div className="text-3xl font-bold text-sov-red mb-2">
            {riskMatrix.filter(item => item.risk === 'high').reduce((sum, item) => sum + item.count, 0)}
          </div>
          <div className="text-sm text-sov-light-alt">High Risk Items</div>
        </div>
      </div>

      {/* Risk Assessment Views */}
      {selectedView === 'matrix' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Matrix Heat Map */}
            <div className="bg-sov-dark p-4 rounded-lg border border-gray-700">
              <h4 className="text-lg font-semibold mb-4 text-sov-light">Risk Matrix Heat Map</h4>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                  <XAxis 
                    type="number" 
                    dataKey="x" 
                    domain={[0.5, 3.5]} 
                    ticks={[1, 2, 3]}
                    tickFormatter={(value) => value === 1 ? 'Low' : value === 2 ? 'Medium' : 'High'}
                    stroke="#9ca3af"
                  />
                  <YAxis 
                    type="number" 
                    dataKey="y" 
                    domain={[0.5, 3.5]} 
                    ticks={[1, 2, 3]}
                    tickFormatter={(value) => value === 1 ? 'Low' : value === 2 ? 'Medium' : 'High'}
                    stroke="#9ca3af"
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }}
                    formatter={(value, name) => [value, name === 'x' ? 'Impact' : name === 'y' ? 'Probability' : 'Count']}
                    labelFormatter={() => ''}
                  />
                  <Scatter 
                    data={matrixData} 
                    fill={(entry: any) => getRiskColor(entry.risk)}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Risk Matrix Details */}
            <div className="bg-sov-dark p-4 rounded-lg border border-gray-700">
              <h4 className="text-lg font-semibold mb-4 text-sov-light">Risk Distribution</h4>
              <div className="space-y-3">
                {riskMatrix.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-sov-dark-alt rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: getRiskColor(item.risk) }}
                      ></div>
                      <div>
                        <div className="font-semibold text-sov-light">
                          {item.impact.charAt(0).toUpperCase() + item.impact.slice(1)} Impact / {item.probability.charAt(0).toUpperCase() + item.probability.slice(1)} Probability
                        </div>
                        <div className="text-sm text-sov-light-alt">
                          {item.count} risk item{item.count !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getScoreBgColor(item.risk === 'low' ? 1.5 : item.risk === 'medium' ? 2.5 : 4)} ${getScoreColor(item.risk === 'low' ? 1.5 : item.risk === 'medium' ? 2.5 : 4)}`}>
                      {item.risk}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedView === 'factors' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Factors */}
            <div className="bg-sov-dark p-4 rounded-lg border border-gray-700">
              <h4 className="text-lg font-semibold mb-4 text-sov-light">Risk Factors Analysis</h4>
              <div className="space-y-3">
                {riskFactors.map((factor, index) => (
                  <div key={index} className="p-3 bg-sov-dark-alt rounded-lg border border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                      <h5 className="font-semibold text-sov-light">{factor.factor}</h5>
                      <span className={`px-2 py-1 rounded-full text-sm font-semibold ${getScoreBgColor(factor.score)} ${getScoreColor(factor.score)}`}>
                        {factor.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-sov-light-alt">Risk Score</span>
                      <span className={`text-lg font-bold ${getScoreColor(factor.score)}`}>
                        {factor.score.toFixed(1)}/5.0
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          factor.score <= 2 ? 'bg-sov-green' : 
                          factor.score <= 3.5 ? 'bg-sov-gold' : 'bg-sov-red'
                        }`}
                        style={{ width: `${(factor.score / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Factors Bar Chart */}
            <div className="bg-sov-dark p-4 rounded-lg border border-gray-700">
              <h4 className="text-lg font-semibold mb-4 text-sov-light">Risk Scores Comparison</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={riskFactors}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                  <XAxis 
                    dataKey="factor" 
                    stroke="#9ca3af" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    fontSize={12}
                  />
                  <YAxis stroke="#9ca3af" domain={[0, 5]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }}
                  />
                  <Bar 
                    dataKey="score" 
                    fill={(entry: any) => entry.score <= 2 ? '#10b981' : entry.score <= 3.5 ? '#f59e0b' : '#ef4444'}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {selectedView === 'trends' && (
        <div className="space-y-6">
          <div className="bg-sov-dark p-4 rounded-lg border border-gray-700">
            <h4 className="text-lg font-semibold mb-4 text-sov-light">Risk Trends Over Time</h4>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" domain={[0, 5]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }}
                />
                <Legend />
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
      )}

      {selectedView === 'radar' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <div className="bg-sov-dark p-4 rounded-lg border border-gray-700">
              <h4 className="text-lg font-semibold mb-4 text-sov-light">Risk Factor Radar</h4>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#4b5563" />
                  <PolarAngleAxis dataKey="factor" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 5]} 
                    tick={{ fill: '#9ca3af', fontSize: 10 }}
                  />
                  <Radar
                    name="Risk Score"
                    dataKey="score"
                    stroke="#2dd4bf"
                    fill="#2dd4bf"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Risk Assessment Summary */}
            <div className="bg-sov-dark p-4 rounded-lg border border-gray-700">
              <h4 className="text-lg font-semibold mb-4 text-sov-light">Risk Assessment Summary</h4>
              <div className="space-y-4">
                <div className="p-3 bg-sov-green/10 border border-sov-green/20 rounded-lg">
                  <h5 className="font-semibold text-sov-green mb-2">Strengths</h5>
                  <ul className="text-sm text-sov-light-alt space-y-1">
                    {riskFactors.filter(f => f.score <= 2).map((factor, index) => (
                      <li key={index}>• {factor.factor} - Well controlled ({factor.score.toFixed(1)}/5.0)</li>
                    ))}
                  </ul>
                </div>
                
                <div className="p-3 bg-sov-gold/10 border border-sov-gold/20 rounded-lg">
                  <h5 className="font-semibold text-sov-gold mb-2">Areas for Improvement</h5>
                  <ul className="text-sm text-sov-light-alt space-y-1">
                    {riskFactors.filter(f => f.score > 2 && f.score <= 3.5).map((factor, index) => (
                      <li key={index}>• {factor.factor} - Monitor closely ({factor.score.toFixed(1)}/5.0)</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 bg-sov-red/10 border border-sov-red/20 rounded-lg">
                  <h5 className="font-semibold text-sov-red mb-2">High Priority Risks</h5>
                  <ul className="text-sm text-sov-light-alt space-y-1">
                    {riskFactors.filter(f => f.score > 3.5).map((factor, index) => (
                      <li key={index}>• {factor.factor} - Immediate attention ({factor.score.toFixed(1)}/5.0)</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
