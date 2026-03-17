
import React from 'react';

interface KpiCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'increase' | 'decrease';
  icon: React.ReactNode;
}

export const KpiCard: React.FC<KpiCardProps> = ({ title, value, change, changeType, icon }) => {
  const changeColor = changeType === 'increase' ? 'text-sov-green' : 'text-sov-red';

  return (
    <div className="bg-sov-dark-alt/40 p-3 sm:p-5 rounded-2xl shadow-2xl border border-white/5 glass-panel relative overflow-hidden group hover:border-sov-accent/30 transition-all duration-500 hover:shadow-sov-accent/10">
      {/* Background Glow Detail */}
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-sov-accent/5 rounded-full blur-3xl group-hover:bg-sov-accent/10 transition-all duration-700" />
      
      <div className="flex flex-col h-full relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 text-sov-accent shadow-inner group-hover:scale-110 transition-transform duration-500">
            {React.cloneElement(icon as React.ReactElement, { size: 18, strokeWidth: 2.5 })}
          </div>
          {change && (
            <div className={`px-2 py-1 rounded-md text-[10px] font-black tracking-tighter uppercase backdrop-blur-sm border ${
              changeType === 'increase' ? 'bg-sov-green/10 text-sov-green border-sov-green/20' : 'bg-sov-red/10 text-sov-red border-sov-red/20'
            }`}>
              {changeType === 'increase' ? '+' : ''}{change}
            </div>
          )}
        </div>

        <div>
           <h4 className="text-[10px] font-black text-sov-light-alt uppercase tracking-[0.2em] mb-1 opacity-70 group-hover:opacity-100 transition-opacity">
            {title}
          </h4>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-sov-light tracking-tighter group-hover:text-sov-accent transition-colors">
              {value}
            </span>
          </div>
          
          <div className="mt-4 h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
            <div className={`h-full w-1/3 rounded-full opacity-50 ${
                changeType === 'increase' ? 'bg-sov-green shadow-[0_0_8px_rgba(45,212,191,0.5)]' : 'bg-sov-red shadow-[0_0_8px_rgba(248,113,113,0.5)]'
            } group-hover:w-full transition-all duration-1000`} />
          </div>
        </div>
      </div>
    </div>
  );
};
