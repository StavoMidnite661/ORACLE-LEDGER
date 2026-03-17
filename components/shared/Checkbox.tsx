import React from 'react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="flex items-center">
      <input
        type="checkbox"
        className={`h-4 w-4 text-sov-blue border-sov-light/20 rounded focus:ring-sov-blue bg-sov-darker ${className}`}
        {...props}
      />
      {label && (
        <label className="ml-2 block text-sm text-sov-light-alt">
          {label}
        </label>
      )}
    </div>
  );
};
