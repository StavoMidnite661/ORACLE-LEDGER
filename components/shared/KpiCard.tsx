
import React from 'react';

interface KpiCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'increase' | 'decrease';
  icon: JSX.Element;
}

export const KpiCard: React.FC<KpiCardProps> = ({ title, value, change, changeType, icon }) => {
  const changeColor = changeType === 'increase' ? 'text-sov-green' : 'text-sov-red';

  return (
    <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
            <div className="p-3 rounded-full bg-sov-accent/10 text-sov-accent">
                {icon}
            </div>
            <p className="ml-4 text-lg font-semibold text-sov-light-alt">{title}</p>
        </div>
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold text-sov-light">{value}</p>
        {change && (
          <p className={`text-sm mt-1 ${changeColor}`}>
            {change} vs last period
          </p>
        )}
      </div>
    </div>
  );
};
