import React from 'react';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  indicatorClassName?: string;
}

export const Progress: React.FC<ProgressProps> = ({ 
  value, 
  max = 100, 
  className = '',
  indicatorClassName = ''
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  return (
    <div className={`w-full bg-sov-light/10 rounded-full h-2.5 ${className}`}>
      <div 
        className={`bg-sov-blue h-2.5 rounded-full transition-all duration-300 ${indicatorClassName}`} 
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
};
