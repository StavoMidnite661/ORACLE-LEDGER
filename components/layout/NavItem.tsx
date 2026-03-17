
import React from 'react';

interface NavItemProps {
  label: string;
  icon: React.ReactNode;
  isActive?: boolean;
  onClick: () => void;
}

export const NavItem: React.FC<NavItemProps> = ({ label, icon, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
        isActive
          ? 'bg-sov-accent/10 text-sov-accent border border-sov-accent/20'
          : 'text-sov-light-alt hover:bg-white/5 hover:text-sov-light border border-transparent'
      }`}>
      <div className={`flex-shrink-0 transition-opacity ${isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>
        {icon}
      </div>
      <span className="text-[15px] font-medium tracking-tight whitespace-nowrap">{label}</span>
    </button>
  );
};
