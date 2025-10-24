
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
      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
        isActive
          ? 'bg-sov-accent text-sov-dark'
          : 'text-sov-light-alt hover:bg-sov-dark hover:text-sov-light'
      }`}>
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
};
