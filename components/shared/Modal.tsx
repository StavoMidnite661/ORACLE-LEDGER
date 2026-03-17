
import React from 'react';

import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
  gradient?: string;
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  maxWidth = 'max-w-lg',
  gradient = 'from-white/5 to-transparent'
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-start justify-center pt-16 pb-4 px-4 sm:items-center sm:pt-0 sm:pb-0">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div 
        className={`relative bg-[#0F1117] border border-white/10 rounded-xl shadow-2xl w-full ${maxWidth} max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-2 duration-200 ring-1 ring-white/5`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Ambient Gradient - More subtle */}
        <div className={`absolute top-0 inset-x-0 h-24 bg-gradient-to-b ${gradient} opacity-20 pointer-events-none`} />

        {/* Header */}
        <div className="relative flex-shrink-0 pt-5 px-5 pb-3 flex justify-between items-center z-20 border-b border-white/5">
          <h3 className="text-lg font-semibold tracking-tight text-white">{title}</h3>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors group -mr-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white/40 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-5 overflow-y-auto custom-scrollbar relative z-10">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};
