
import React from 'react';

interface HeaderProps {
    currentViewName: string;
}

export const Header: React.FC<HeaderProps> = ({ currentViewName }) => {
  return (
    <header className="bg-sov-dark-alt p-4 flex justify-between items-center border-b border-gray-700">
      <h2 className="text-2xl font-semibold text-sov-light">{currentViewName}</h2>
      <div className="flex items-center">
        <div className="text-right mr-4">
          <p className="font-semibold text-sov-light">Chief Ledgering Consul</p>
          <p className="text-sm text-sov-light-alt">SOVR Development Holdings LLC</p>
        </div>
        <img
          className="h-10 w-10 rounded-full object-cover"
          src="https://picsum.photos/100"
          alt="User avatar"
        />
      </div>
    </header>
  );
};
