import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className = ''
}) => {
  const variants = {
    success: 'bg-sov-green/20 text-sov-green border-sov-green/30',
    warning: 'bg-sov-gold/20 text-sov-gold border-sov-gold/30',
    error: 'bg-sov-red/20 text-sov-red border-sov-red/30',
    info: 'bg-sov-blue/20 text-sov-blue border-sov-blue/30',
    neutral: 'bg-gray-700/50 text-gray-400 border-gray-600',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
