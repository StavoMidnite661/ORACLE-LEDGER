import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: Array<{ label: string; value: string }>;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  children,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-sov-light-alt text-left">
          {label}
        </label>
      )}
      <select
        className={`
          w-full bg-sov-dark border border-gray-600 text-sov-light rounded-lg px-4 py-2 text-sm
          focus:outline-none focus:ring-2 focus:ring-sov-accent/50 focus:border-sov-accent
          appearance-none transition-all
          ${error ? 'border-sov-red ring-sov-red/20' : ''}
          ${className}
        `}
        {...props}
      >
        {options ? options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        )) : children}
      </select>
      {error && (
        <p className="text-xs text-sov-red mt-1">{error}</p>
      )}
    </div>
  );
};
