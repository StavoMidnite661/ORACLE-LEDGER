
import React from 'react';
import { CHART_OF_ACCOUNTS } from '../constants';
import { AccountType } from '../types';

export const ChartOfAccountsView: React.FC = () => {
  const getAccountTypeColor = (type: AccountType) => {
    switch (type) {
      case AccountType.Asset: return 'bg-blue-500/20 text-blue-400';
      case AccountType.Liability: return 'bg-red-500/20 text-red-400';
      case AccountType.Equity: return 'bg-purple-500/20 text-purple-400';
      case AccountType.Income: return 'bg-green-500/20 text-green-400';
      case AccountType.Expense: return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
      <h3 className="text-xl font-semibold mb-4 text-sov-light">Chart of Accounts</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b border-gray-700">
            <tr>
              <th className="p-3">Account ID</th>
              <th className="p-3">Account Name</th>
              <th className="p-3">Type</th>
              <th className="p-3">Entity</th>
            </tr>
          </thead>
          <tbody>
            {CHART_OF_ACCOUNTS.map(account => (
              <tr key={account.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                <td className="p-3 font-mono">{account.id}</td>
                <td className="p-3 font-semibold">{account.name}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getAccountTypeColor(account.type)}`}>
                    {account.type}
                  </span>
                </td>
                <td className="p-3 text-sov-light-alt">{account.entity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
