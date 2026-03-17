import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Modal Label ---
interface ModalLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export const ModalLabel: React.FC<ModalLabelProps> = ({ className, children, ...props }) => {
  return (
    <label 
      className={cn("text-white/60 font-medium text-xs uppercase tracking-wide block mb-1.5 ml-0.5", className)} 
      {...props}
    >
      {children}
    </label>
  );
};

// --- Modal Input ---
interface ModalInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  // Add any specific props if needed
}

export const ModalInput: React.FC<ModalInputProps> = ({ className, ...props }) => {
  return (
    <input
      className={cn(
        "w-full bg-[#1A1D24] border border-white/5 rounded-lg py-2.5 px-3 text-sm text-sov-light focus:outline-none focus:border-sov-accent/50 focus:ring-1 focus:ring-sov-accent/50 transition-all placeholder:text-white/20",
        className
      )}
      {...props}
    />
  );
};

// --- Modal Select ---
interface ModalSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const ModalSelect: React.FC<ModalSelectProps> = ({ className, children, ...props }) => {
  return (
    <div className="relative">
        <select
        className={cn(
            "w-full bg-[#1A1D24] border border-white/5 rounded-lg py-2.5 px-3 text-sm text-sov-light focus:outline-none focus:border-sov-accent/50 focus:ring-1 focus:ring-sov-accent/50 transition-all appearance-none cursor-pointer",
            className
        )}
        {...props}
        >
        {children}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
        </div>
    </div>
  );
};

// --- Modal Textarea ---
interface ModalTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const ModalTextarea: React.FC<ModalTextareaProps> = ({ className, ...props }) => {
  return (
    <textarea
      className={cn(
        "w-full bg-[#1A1D24] border border-white/5 rounded-lg py-2.5 px-3 text-sm text-sov-light focus:outline-none focus:border-sov-accent/50 focus:ring-1 focus:ring-sov-accent/50 transition-all placeholder:text-white/20 resize-none",
        className
      )}
      {...props}
    />
  );
};


// --- Modal Button ---
interface ModalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  fullWidth?: boolean;
}

export const ModalButton: React.FC<ModalButtonProps> = ({ 
  className, 
  variant = 'primary', 
  fullWidth = false,
  children, 
  ...props 
}) => {
  const variants = {
    primary: "bg-sov-accent text-sov-dark hover:bg-sov-accent-hover shadow-lg shadow-sov-accent/20 border border-transparent",
    secondary: "bg-white/5 text-white/80 hover:text-white hover:bg-white/10 border border-white/5",
    danger: "bg-sov-red/10 text-sov-red hover:bg-sov-red/20 border border-sov-red/20",
    success: "bg-sov-green/10 text-sov-green hover:bg-sov-green/20 border border-sov-green/20",
  };

  return (
    <button
      className={cn(
        "py-2.5 px-4 rounded-lg font-semibold text-sm transition-all active:scale-[0.98]",
        variants[variant],
        fullWidth ? "w-full" : "flex-1",
        props.disabled && "opacity-50 cursor-not-allowed active:scale-100",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

// --- Modal Section (Card) ---
interface ModalSectionProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ModalSection: React.FC<ModalSectionProps> = ({ className, children, ...props }) => {
  return (
    <div 
      className={cn(
        "bg-white/[0.02] border border-white/5 rounded-xl p-4 relative overflow-hidden", 
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
};

// --- Modal Section Header ---
interface ModalSectionHeaderProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export const ModalSectionHeader: React.FC<ModalSectionHeaderProps> = ({ className, children, ...props }) => {
  return (
    <h4 
      className={cn(
        "text-[10px] font-bold text-sov-light-alt uppercase tracking-widest mb-3 border-b border-white/5 pb-2", 
        className
      )} 
      {...props}
    >
      {children}
    </h4>
  );
};

// --- Modal Field Group ---
export const ModalField: React.FC<{ label: string; value: React.ReactNode; className?: string }> = ({ label, value, className }) => (
    <div className={className}>
        <div className="text-[10px] uppercase tracking-wider text-white/40 block mb-0.5">{label}</div>
        <div className="text-sov-light font-medium text-sm">{value}</div>
    </div>
);
