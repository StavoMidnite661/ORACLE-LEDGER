import React, { useState, useMemo } from 'react';
import type { 
  ConsulCreditsConfig, 
  SupportedToken, 
  ConsulCreditsTransaction, 
  ConsulCreditsStats,
  ConsulCreditsTab
} from '../types';

interface ConsulCreditsViewProps {
  config: ConsulCreditsConfig;
  supportedTokens: SupportedToken[];
  transactions: ConsulCreditsTransaction[];
  stats: ConsulCreditsStats;
  updateConfig: (config: Partial<ConsulCreditsConfig>) => void;
}

export const ConsulCreditsView: React.FC<ConsulCreditsViewProps> = ({
  config,
  supportedTokens,
  transactions,
  stats,
  updateConfig
}) => {
  const [activeTab, setActiveTab] = useState<ConsulCreditsTab>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ConsulCreditsTransaction['status']>('all');

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesSearch = 
        tx.txHash.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.tokenSymbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.userAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.ledgerReference.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [transactions, searchTerm, statusFilter]);

  // Calculate overview metrics
  const overviewMetrics = useMemo(() => {
    const totalDeposits = transactions
      .filter(tx => tx.eventType === 'DEPOSIT' && tx.status === 'CONFIRMED')
      .reduce((sum, tx) => sum + parseFloat(tx.consulCreditsAmount), 0);
    
    const totalWithdrawals = transactions
      .filter(tx => tx.eventType === 'WITHDRAW' && tx.status === 'CONFIRMED')
      .reduce((sum, tx) => sum + parseFloat(tx.consulCreditsAmount), 0);
    
    const totalMinted = transactions
      .filter(tx => tx.eventType === 'ORACLE_MINT' && tx.status === 'CONFIRMED')
      .reduce((sum, tx) => sum + parseFloat(tx.consulCreditsAmount), 0);
    
    const totalBurned = transactions
      .filter(tx => tx.eventType === 'ORACLE_BURN' && tx.status === 'CONFIRMED')
      .reduce((sum, tx) => sum + parseFloat(tx.consulCreditsAmount), 0);
    
    return {
      totalDeposits,
      totalWithdrawals,
      totalMinted,
      totalBurned,
      netSupply: totalDeposits + totalMinted - totalWithdrawals - totalBurned,
      transactionCount: transactions.length,
      activeTokens: supportedTokens.filter(t => t.isActive).length
    };
  }, [transactions, supportedTokens]);

  const formatCurrency = (amount: number | string) => 
    new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);

  const formatTokenAmount = (amount: string, decimals: number = 18) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: Math.min(decimals, 8)
    }).format(num);
  };

  const getEventTypeColor = (eventType: ConsulCreditsTransaction['eventType']) => {
    switch (eventType) {
      case 'DEPOSIT': return 'bg-green-500/20 text-green-400';
      case 'WITHDRAW': return 'bg-red-500/20 text-red-400';
      case 'ORACLE_MINT': return 'bg-blue-500/20 text-blue-400';
      case 'ORACLE_BURN': return 'bg-orange-500/20 text-orange-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusColor = (status: ConsulCreditsTransaction['status']) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-sov-green/20 text-sov-green';
      case 'PENDING': return 'bg-yellow-500/20 text-yellow-400';
      case 'FAILED': return 'bg-sov-red/20 text-sov-red';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy to clipboard');
    });
  };

  const openEtherscan = (txHash: string) => {
    const baseUrl = config.chainId === 1 
      ? 'https://etherscan.io/tx/' 
      : `https://sepolia.etherscan.io/tx/`;
    window.open(`${baseUrl}${txHash}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
        <h1 className="text-2xl font-bold text-sov-light mb-2">Consul Credits Wrapper</h1>
        <p className="text-sov-light-alt">
          ERC-20 token wrapper for denominated consul credit units - Oracle Ledger blockchain integration
        </p>
        
        {/* Contract Status */}
        <div className="mt-4 flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${config.isEnabled ? 'bg-sov-green' : 'bg-red-500'}`}></div>
            <span className="text-sm text-sov-light-alt">
              {config.isEnabled ? 'Contract Active' : 'Contract Disabled'}
            </span>
          </div>
          <div className="text-sm text-sov-light-alt">
            Network: {config.networkName}
          </div>
          <div className="text-sm text-sov-light-alt">
            Chain ID: {config.chainId}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
        <div className="flex space-x-4 border-b border-gray-700 pb-4">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'tokens', label: 'Supported Tokens' },
            { key: 'transactions', label: 'Transactions' },
            { key: 'settings', label: 'Settings' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as ConsulCreditsTab)}
              className={`px-4 py-2 font-semibold rounded-lg transition-colors ${
                activeTab === tab.key 
                  ? 'bg-sov-accent text-sov-dark' 
                  : 'text-sov-light-alt hover:text-sov-light'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="pt-6">
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-sov-dark p-4 rounded-lg border border-gray-600">
                <h3 className="text-sm font-medium text-sov-light-alt">Total Supply</h3>
                <p className="text-2xl font-bold text-sov-light">{formatTokenAmount(stats.totalSupply)}</p>
                <p className="text-xs text-sov-light-alt">Consul Credits</p>
              </div>
              
              <div className="bg-sov-dark p-4 rounded-lg border border-gray-600">
                <h3 className="text-sm font-medium text-sov-light-alt">Net Deposits</h3>
                <p className="text-2xl font-bold text-green-400">{formatTokenAmount(overviewMetrics.netSupply.toString())}</p>
                <p className="text-xs text-sov-light-alt">Active Balance</p>
              </div>
              
              <div className="bg-sov-dark p-4 rounded-lg border border-gray-600">
                <h3 className="text-sm font-medium text-sov-light-alt">Active Tokens</h3>
                <p className="text-2xl font-bold text-sov-accent">{overviewMetrics.activeTokens}</p>
                <p className="text-xs text-sov-light-alt">ERC-20 Tokens</p>
              </div>
              
              <div className="bg-sov-dark p-4 rounded-lg border border-gray-600">
                <h3 className="text-sm font-medium text-sov-light-alt">Total Transactions</h3>
                <p className="text-2xl font-bold text-sov-light">{overviewMetrics.transactionCount}</p>
                <p className="text-xs text-sov-light-alt">All Events</p>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-sov-dark p-4 rounded-lg border border-gray-600">
              <h3 className="text-lg font-semibold text-sov-light mb-4">Recent Transactions</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-600">
                      <th className="text-left py-2 text-sov-light-alt">Type</th>
                      <th className="text-left py-2 text-sov-light-alt">Token</th>
                      <th className="text-left py-2 text-sov-light-alt">Amount</th>
                      <th className="text-left py-2 text-sov-light-alt">Status</th>
                      <th className="text-left py-2 text-sov-light-alt">Transaction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 5).map(tx => (
                      <tr key={tx.id} className="border-b border-gray-700">
                        <td className="py-2">
                          <span className={`px-2 py-1 rounded text-xs ${getEventTypeColor(tx.eventType)}`}>
                            {tx.eventType}
                          </span>
                        </td>
                        <td className="py-2 text-sov-light">{tx.tokenSymbol}</td>
                        <td className="py-2 text-sov-light">
                          {formatTokenAmount(tx.consulCreditsAmount)} CC
                        </td>
                        <td className="py-2">
                          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(tx.status)}`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-2">
                          <button
                            onClick={() => openEtherscan(tx.txHash)}
                            className="text-sov-purple hover:text-sov-pink transition-colors text-xs"
                          >
                            {tx.txHash.slice(0, 10)}...
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Supported Tokens Tab */}
        {activeTab === 'tokens' && (
          <div className="pt-6">
            <div className="grid gap-4">
              {supportedTokens.map(token => {
                const totalDeposited = parseFloat(token.totalDeposited) / Math.pow(10, token.decimals);
                const totalWithdrawn = parseFloat(token.totalWithdrawn) / Math.pow(10, token.decimals);
                const netBalance = totalDeposited - totalWithdrawn;
                
                return (
                  <div key={token.address} className="bg-sov-dark p-4 rounded-lg border border-gray-600">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-sov-purple to-sov-pink rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{token.symbol.slice(0, 2)}</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-sov-light">{token.name}</h3>
                          <p className="text-sm text-sov-light-alt">{token.symbol}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`px-2 py-1 rounded text-xs ${token.isActive ? 'bg-sov-green/20 text-sov-green' : 'bg-gray-500/20 text-gray-400'}`}>
                          {token.isActive ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-sov-light-alt">Exchange Rate</p>
                        <p className="text-sov-light font-mono">
                          1 {token.symbol} = {formatTokenAmount(token.exchangeRate)} CC
                        </p>
                      </div>
                      <div>
                        <p className="text-sov-light-alt">Total Deposited</p>
                        <p className="text-green-400 font-mono">
                          {formatTokenAmount(totalDeposited.toString())} {token.symbol}
                        </p>
                      </div>
                      <div>
                        <p className="text-sov-light-alt">Total Withdrawn</p>
                        <p className="text-red-400 font-mono">
                          {formatTokenAmount(totalWithdrawn.toString())} {token.symbol}
                        </p>
                      </div>
                      <div>
                        <p className="text-sov-light-alt">Net Balance</p>
                        <p className="text-sov-accent font-mono">
                          {formatTokenAmount(netBalance.toString())} {token.symbol}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-600">
                      <div className="flex items-center justify-between text-xs text-sov-light-alt">
                        <span>Contract Address:</span>
                        <button
                          onClick={() => copyToClipboard(token.address)}
                          className="text-sov-purple hover:text-sov-pink transition-colors font-mono"
                        >
                          {token.address.slice(0, 6)}...{token.address.slice(-4)}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="pt-6">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by transaction hash, token, address, or ledger reference..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-sov-dark border border-gray-600 rounded-md shadow-sm py-2 px-3 text-sov-light focus:outline-none focus:ring-sov-accent focus:border-sov-accent"
                />
              </div>
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-sov-dark border border-gray-600 rounded-md shadow-sm py-2 px-3 text-sov-light focus:outline-none focus:ring-sov-accent focus:border-sov-accent"
                >
                  <option value="all">All Status</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-sov-dark rounded-lg border border-gray-600 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="text-left py-3 px-4 text-sov-light-alt">Type</th>
                      <th className="text-left py-3 px-4 text-sov-light-alt">Token</th>
                      <th className="text-left py-3 px-4 text-sov-light-alt">Amount</th>
                      <th className="text-left py-3 px-4 text-sov-light-alt">Consul Credits</th>
                      <th className="text-left py-3 px-4 text-sov-light-alt">User</th>
                      <th className="text-left py-3 px-4 text-sov-light-alt">Status</th>
                      <th className="text-left py-3 px-4 text-sov-light-alt">Block</th>
                      <th className="text-left py-3 px-4 text-sov-light-alt">Journal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map(tx => (
                      <tr key={tx.id} className="border-b border-gray-600 hover:bg-gray-700/50">
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs ${getEventTypeColor(tx.eventType)}`}>
                            {tx.eventType}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sov-light font-mono">{tx.tokenSymbol}</td>
                        <td className="py-3 px-4 text-sov-light font-mono">
                          {tx.tokenAmount !== '0' ? formatTokenAmount(tx.tokenAmount) : '-'}
                        </td>
                        <td className="py-3 px-4 text-sov-accent font-mono">
                          {formatTokenAmount(tx.consulCreditsAmount)} CC
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => copyToClipboard(tx.userAddress)}
                            className="text-sov-purple hover:text-sov-pink transition-colors font-mono"
                          >
                            {tx.userAddress.slice(0, 6)}...{tx.userAddress.slice(-4)}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(tx.status)}`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => openEtherscan(tx.txHash)}
                            className="text-sov-purple hover:text-sov-pink transition-colors font-mono"
                          >
                            {tx.blockNumber.toLocaleString()}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          {tx.journalEntryId ? (
                            <span className="text-sov-accent">{tx.journalEntryId}</span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {filteredTransactions.length === 0 && (
                <div className="py-8 text-center text-sov-light-alt">
                  No transactions found matching your criteria.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="pt-6">
            <div className="bg-sov-dark p-6 rounded-lg border border-gray-600">
              <h3 className="text-lg font-semibold text-sov-light mb-4">Contract Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-sov-light-alt mb-2">
                    Contract Address
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={config.contractAddress}
                      readOnly
                      className="flex-1 bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-sov-light font-mono text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(config.contractAddress)}
                      className="text-sov-purple hover:text-sov-pink transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-sov-light-alt mb-2">
                    Network
                  </label>
                  <input
                    type="text"
                    value={`${config.networkName} (Chain ID: ${config.chainId})`}
                    readOnly
                    className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-sov-light"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-sov-light-alt mb-2">
                    RPC URL
                  </label>
                  <input
                    type="text"
                    value={config.rpcUrl}
                    readOnly
                    className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-sov-light font-mono text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-sov-light-alt mb-2">
                    Oracle Integrator
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={config.oracleIntegratorAddress}
                      readOnly
                      className="flex-1 bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-sov-light font-mono text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(config.oracleIntegratorAddress)}
                      className="text-sov-purple hover:text-sov-pink transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-sov-light-alt mb-2">
                    Confirmations Required
                  </label>
                  <input
                    type="number"
                    value={config.confirmationsRequired}
                    onChange={(e) => updateConfig({ confirmationsRequired: parseInt(e.target.value) })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-sov-light"
                  />
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isEnabled"
                    checked={config.isEnabled}
                    onChange={(e) => updateConfig({ isEnabled: e.target.checked })}
                    className="rounded border-gray-600 text-sov-accent focus:ring-sov-accent"
                  />
                  <label htmlFor="isEnabled" className="text-sm font-medium text-sov-light-alt">
                    Enable Contract Integration
                  </label>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-600">
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.96-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <h3 className="text-sm font-medium text-yellow-400">Contract Information</h3>
                  </div>
                  <p className="mt-2 text-sm text-yellow-300">
                    This smart contract wrapper accepts ERC-20 token deposits and generates equivalent consul credit units for Oracle Ledger integration. 
                    All transactions are automatically recorded as journal entries for seamless financial tracking.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};