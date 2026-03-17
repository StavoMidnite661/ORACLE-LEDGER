import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
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
      <input
        className={`
          w-full bg-sov-dark border border-gray-600 text-sov-light rounded-lg px-4 py-2 text-sm
          focus:outline-none focus:ring-2 focus:ring-sov-accent/50 focus:border-sov-accent
          placeholder:text-gray-500 transition-all
          ${error ? 'border-sov-red ring-sov-red/20' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-xs text-sov-red mt-1">{error}</p>
      )}
      {!error && helperText && (
        <p className="text-xs text-sov-light-alt mt-1">{helperText}</p>
      )}
    </div>
  );
};
