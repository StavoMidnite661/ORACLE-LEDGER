import React, { useState, useEffect, useMemo } from 'react';
import type { AchReturn, AchPayment, AchReturnCodes } from '../../types';

interface ReturnFilters {
  dateRange: '7days' | '30days' | '90days' | 'custom';
  startDate?: string;
  endDate?: string;
  returnCode?: string;
  corrected: 'all' | 'corrected' | 'uncorrected';
  customerId?: string;
  searchTerm?: string;
}

interface PaginatedReturns {
  returns: AchReturn[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface ReturnStatistics {
  totalReturns: number;
  correctedReturns: number;
  pendingReturns: number;
  averageReturnAmount: number;
  topReturnCodes: Array<{ code: string; count: number; percentage: number }>;
}

interface CorrectionAction {
  type: 'corrected' | 'resubmit' | 'adjustment';
  notes: string;
  newPaymentDate?: string;
  adjustedAmount?: number;
}

const RETURN_CODE_DESCRIPTIONS: Record<keyof typeof AchReturnCodes, string> = {
  R01: 'Insufficient Funds',
  R02: 'Account Closed',
  R03: 'No Account / Unable to Locate Account',
  R04: 'Invalid Account Number',
  R05: 'Unauthorized Debit',
  R07: 'Authorization Revoked',
  R08: 'Payment Stopped',
  R09: 'Uncollected Funds',
  R10: 'Advices Not Delivered',
  R11: 'Check Item',
  R12: 'Branch Sold to Another RDFI',
  R13: 'Invalid ACH Routing Number',
  R14: 'Representive Payee Deceased',
  R15: 'Beneficiary Deceased',
  R16: 'Account Frozen',
  R17: 'File Record Edit Criteria',
  R18: 'Improper Effective Date',
  R19: 'Amount of File Record Field Errors',
  R20: 'Non-Payment Bank Account',
  R21: 'Invalid Company ID',
  R22: 'Invalid Individual ID Number',
  R23: 'Credit Entry Refused by Receiver',
  R24: 'Duplicate Entry',
  R25: 'Addenda Error',
  R26: 'Mandatory Field Error',
  R27: 'Trace Number Error',
  R28: 'Routing Number Check Digit Error',
  R29: 'Corporate Customer Advises Not Authorized',
  R30: 'Not Used',
  R31: 'Permissible Return Entry',
  R32: 'Bank Does Not Participate in ACH',
  R33: 'Return of XCK Entry',
  R34: 'Limited Participation RDFI',
  R35: 'Return of Improper Debit Entry',
  R36: 'Return of Improper Credit Entry',
  R37: 'Source Document Presented for Payment',
  R38: 'Stop Payment on Source Document',
  R39: 'Improper Use of Source Document',
  R40: 'Return of Return Items',
  R41: 'Invalid Transaction Code',
  R42: 'Routing Number or Account Number Format Error',
  R43: 'Permissible Return Entry Not Accepted',
  R44: 'Invalid FD Account Number',
  R45: 'Invalid Individual ID Number',
  R46: 'Invalid Individual Name',
  R47: 'Duplicate Enrollments',
  R48: 'Reserved',
  R49: 'Reserved',
  R50: 'State Law Affecting RCK Acceptance',
  R51: 'Item Related to RCK Entry',
  R52: 'Stop Payment on Item Related to RC',
  R53: 'Item and RCK Entry Presented for Payment',
  R54: 'Reserved',
  R55: 'Reserved',
  R56: 'Return of XCK Entry',
  R57: 'Return of XCK Entry',
  R58: 'Return of XCK Entry',
  R59: 'Return of XCK Entry',
  R60: 'Return of XCK Entry',
  R61: 'Return of XCK Entry',
  R62: 'Return of XCK Entry',
  R63: 'Return of XCK Entry',
  R64: 'Return of XCK Entry',
  R65: 'Return of XCK Entry',
  R66: 'Return of XCK Entry',
  R67: 'Return of XCK Entry',
  R68: 'Return of XCK Entry',
  R69: 'Return of XCK Entry',
  R70: 'Return of XCK Entry',
  R71: 'Truncated Debit Entry Returned',
  R72: 'Truncated Return Entry Not Accepted',
  R73: 'Reserved',
  R74: 'Non-Customer 3rd Party',
  R75: 'Return of XCK Entry',
  R76: 'Return of XCK Entry',
  R77: 'Corrected Return',
  R78: 'Return of XCK Entry',
  R79: 'Return of XCK Entry',
  R80: 'Corrupt Return Record',
  R81: 'Reserved',
  R82: 'Reserved',
  R83: 'Reserved',
  R84: 'Reserved',
  R85: 'Reserved'
};

export const ReturnProcessing: React.FC = () => {
  const [returns, setReturns] = useState<PaginatedReturns>({
    returns: [],
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0
  });
  const [statistics, setStatistics] = useState<ReturnStatistics>({
    totalReturns: 0,
    correctedReturns: 0,
    pendingReturns: 0,
    averageReturnAmount: 0,
    topReturnCodes: []
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedReturns, setSelectedReturns] = useState<Set<string>>(new Set());
  
  const [filters, setFilters] = useState<ReturnFilters>({
    dateRange: '30days',
    corrected: 'all'
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<AchReturn | null>(null);
  const [correctionAction, setCorrectionAction] = useState<CorrectionAction>({
    type: 'corrected',
    notes: ''
  });
  const [showStatsModal, setShowStatsModal] = useState(false);

  // Load returns and statistics
  const loadReturns = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: returns.pageSize.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => 
            value !== undefined && value !== '' && value !== 'all'
          )
        )
      });

      if (filters.dateRange === 'custom' && filters.startDate && filters.endDate) {
        params.set('startDate', filters.startDate);
        params.set('endDate', filters.endDate);
      }

      const [returnsResponse, statsResponse] = await Promise.all([
        fetch(`/api/ach-returns?${params}`),
        fetch(`/api/ach-returns/statistics?${params}`)
      ]);

      if (!returnsResponse.ok || !statsResponse.ok) {
        throw new Error('Failed to load returns data');
      }

      const returnsData = await returnsResponse.json();
      const statsData = await statsResponse.json();

      setReturns(returnsData);
      setStatistics(statsData);

    } catch (error) {
      console.error('Failed to load returns:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReturns();
  }, [filters]);

  const handleReturnAction = async (returnId: string, action: 'corrected' | 'resubmit', correctionData?: CorrectionAction) => {
    try {
      setActionLoading(returnId);
      
      const response = await fetch(`/api/ach-returns/${returnId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(correctionData || {})
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} return`);
      }

      // Refresh data
      await loadReturns(returns.page);

    } catch (error) {
      console.error(`Failed to ${action} return:`, error);
      alert(`Failed to ${action} return. Please try again.`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCorrectionSubmit = async () => {
    if (!selectedReturn) return;

    await handleReturnAction(selectedReturn.id, correctionAction.type, correctionAction);
    setShowCorrectionModal(false);
    setSelectedReturn(null);
    setCorrectionAction({ type: 'corrected', notes: '' });
  };

  const handleBulkAction = async (action: 'corrected' | 'resubmit') => {
    if (selectedReturns.size === 0) return;

    try {
      setActionLoading('bulk');
      
      const response = await fetch('/api/ach-returns/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          returnIds: Array.from(selectedReturns)
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} selected returns`);
      }

      setSelectedReturns(new Set());
      await loadReturns(returns.page);

    } catch (error) {
      console.error(`Failed to ${action} returns:`, error);
      alert(`Failed to ${action} returns. Please try again.`);
    } finally {
      setActionLoading(null);
    }
  };

  const formatAmount = (amountCents: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amountCents / 100);
  };

  const formatDate = (dateString: string | Date): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getReturnCodeDescription = (code: string): string => {
    return RETURN_CODE_DESCRIPTIONS[code as keyof typeof RETURN_CODE_DESCRIPTIONS] || code;
  };

  const getReturnCodeSeverity = (code: string): 'low' | 'medium' | 'high' | 'critical' => {
    const highSeverityCodes = ['R02', 'R03', 'R04', 'R05', 'R07', 'R08', 'R13', 'R16'];
    const mediumSeverityCodes = ['R01', 'R09', 'R14', 'R15'];
    
    if (highSeverityCodes.includes(code)) return 'high';
    if (mediumSeverityCodes.includes(code)) return 'medium';
    return 'low';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-400/10 border-red-400/30';
      case 'high': return 'text-orange-400 bg-orange-400/10 border-orange-400/30';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      default: return 'text-sov-light-alt bg-gray-400/10 border-gray-400/30';
    }
  };

  // Filtered returns
  const filteredReturns = useMemo(() => {
    let filtered = [...returns.returns];

    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(achReturn =>
        achReturn.returnCode.toLowerCase().includes(searchLower) ||
        achReturn.returnReason?.toLowerCase().includes(searchLower) ||
        achReturn.achPaymentId.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [returns.returns, filters]);

  return (
    <div className="bg-sov-dark-alt rounded-lg shadow-xl border border-gray-700 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-sov-light">ACH Return Processing</h2>
          <p className="text-sov-light-alt mt-1">
            {statistics.totalReturns} total returns • {statistics.pendingReturns} pending correction
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowStatsModal(true)}
            className="px-4 py-2 text-sov-accent border border-sov-accent/30 rounded-md hover:bg-sov-accent/10 focus:outline-none focus:ring-2 focus:ring-sov-accent/50"
          >
            Statistics
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 text-sov-light border border-gray-600 rounded-md hover:bg-sov-dark focus:outline-none focus:ring-2 focus:ring-sov-accent"
          >
            Filters
          </button>
          <button
            onClick={() => loadReturns(returns.page)}
            disabled={loading}
            className="px-4 py-2 bg-sov-accent text-white rounded-md hover:bg-sov-accent/90 focus:outline-none focus:ring-2 focus:ring-sov-accent disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-sov-dark rounded-lg p-4 border border-gray-600">
          <h3 className="text-sov-light-alt text-sm font-medium">Total Returns</h3>
          <p className="text-2xl font-bold text-sov-light mt-1">{statistics.totalReturns}</p>
        </div>
        <div className="bg-sov-dark rounded-lg p-4 border border-gray-600">
          <h3 className="text-sov-light-alt text-sm font-medium">Pending Correction</h3>
          <p className="text-2xl font-bold text-sov-red mt-1">{statistics.pendingReturns}</p>
        </div>
        <div className="bg-sov-dark rounded-lg p-4 border border-gray-600">
          <h3 className="text-sov-light-alt text-sm font-medium">Corrected</h3>
          <p className="text-2xl font-bold text-sov-green mt-1">{statistics.correctedReturns}</p>
        </div>
        <div className="bg-sov-dark rounded-lg p-4 border border-gray-600">
          <h3 className="text-sov-light-alt text-sm font-medium">Avg Return Amount</h3>
          <p className="text-2xl font-bold text-sov-light mt-1">{formatAmount(statistics.averageReturnAmount)}</p>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-sov-dark rounded-lg p-4 mb-6 border border-gray-600">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Date Range */}
            <div>
              <label className="block text-sov-light-alt text-sm font-medium mb-2">Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any, startDate: undefined, endDate: undefined }))}
                className="w-full px-3 py-2 bg-sov-dark border border-gray-600 rounded-md text-sov-light focus:outline-none focus:ring-2 focus:ring-sov-accent"
              >
                <option value="7days">Last 7 days</option>
                <option value="30days">Last 30 days</option>
                <option value="90days">Last 90 days</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {filters.dateRange === 'custom' && (
              <>
                <div>
                  <label className="block text-sov-light-alt text-sm font-medium mb-2">Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-sov-dark border border-gray-600 rounded-md text-sov-light focus:outline-none focus:ring-2 focus:ring-sov-accent"
                  />
                </div>
                <div>
                  <label className="block text-sov-light-alt text-sm font-medium mb-2">End Date</label>
                  <input
                    type="date"
                    value={filters.endDate || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-sov-dark border border-gray-600 rounded-md text-sov-light focus:outline-none focus:ring-2 focus:ring-sov-accent"
                  />
                </div>
              </>
            )}

            {/* Status */}
            <div>
              <label className="block text-sov-light-alt text-sm font-medium mb-2">Correction Status</label>
              <select
                value={filters.corrected}
                onChange={(e) => setFilters(prev => ({ ...prev, corrected: e.target.value as any }))}
                className="w-full px-3 py-2 bg-sov-dark border border-gray-600 rounded-md text-sov-light focus:outline-none focus:ring-2 focus:ring-sov-accent"
              >
                <option value="all">All Returns</option>
                <option value="corrected">Corrected</option>
                <option value="uncorrected">Pending Correction</option>
              </select>
            </div>

            {/* Return Code */}
            <div>
              <label className="block text-sov-light-alt text-sm font-medium mb-2">Return Code</label>
              <select
                value={filters.returnCode || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, returnCode: e.target.value || undefined }))}
                className="w-full px-3 py-2 bg-sov-dark border border-gray-600 rounded-md text-sov-light focus:outline-none focus:ring-2 focus:ring-sov-accent"
              >
                <option value="">All Return Codes</option>
                {Object.keys(RETURN_CODE_DESCRIPTIONS).map(code => (
                  <option key={code} value={code}>
                    {code} - {RETURN_CODE_DESCRIPTIONS[code as keyof typeof AchReturnCodes]}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sov-light-alt text-sm font-medium mb-2">Search</label>
              <input
                type="text"
                value={filters.searchTerm || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                placeholder="Search by return code, reason, or payment ID..."
                className="w-full px-3 py-2 bg-sov-dark border border-gray-600 rounded-md text-sov-light focus:outline-none focus:ring-2 focus:ring-sov-accent"
              />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={() => setFilters({ dateRange: '30days', corrected: 'all' })}
              className="px-4 py-2 text-sov-light-alt border border-gray-600 rounded-md hover:bg-sov-dark focus:outline-none focus:ring-2 focus:ring-sov-accent mr-3"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedReturns.size > 0 && (
        <div className="bg-sov-accent/10 border border-sov-accent/30 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-sov-light">
              {selectedReturns.size} return{selectedReturns.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex space-x-3">
              <button
                onClick={() => handleBulkAction('corrected')}
                disabled={actionLoading !== null}
                className="px-4 py-2 text-sov-green border border-sov-green/30 rounded-md hover:bg-sov-green/10 focus:outline-none focus:ring-2 focus:ring-sov-green/50 disabled:opacity-50"
              >
                Mark Corrected
              </button>
              <button
                onClick={() => handleBulkAction('resubmit')}
                disabled={actionLoading !== null}
                className="px-4 py-2 bg-sov-accent text-white rounded-md hover:bg-sov-accent/90 focus:outline-none focus:ring-2 focus:ring-sov-accent disabled:opacity-50"
              >
                Schedule Resubmit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Returns Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="pb-3">
                <input
                  type="checkbox"
                  checked={selectedReturns.size === returns.returns.length && returns.returns.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedReturns(new Set(returns.returns.map(r => r.id)));
                    } else {
                      setSelectedReturns(new Set());
                    }
                  }}
                  className="text-sov-accent"
                />
              </th>
              <th className="pb-3 text-sov-light-alt font-medium">Payment ID</th>
              <th className="pb-3 text-sov-light-alt font-medium">Return Code</th>
              <th className="pb-3 text-sov-light-alt font-medium">Reason</th>
              <th className="pb-3 text-sov-light-alt font-medium">Amount</th>
              <th className="pb-3 text-sov-light-alt font-medium">Returned Date</th>
              <th className="pb-3 text-sov-light-alt font-medium">Status</th>
              <th className="pb-3 text-sov-light-alt font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-sov-light-alt">
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-sov-accent" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Loading returns...
                  </div>
                </td>
              </tr>
            ) : filteredReturns.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-sov-light-alt">
                  No returns found
                </td>
              </tr>
            ) : (
              filteredReturns.map((achReturn) => {
                const severity = getReturnCodeSeverity(achReturn.returnCode);
                return (
                  <tr key={achReturn.id} className="border-b border-gray-700/50 hover:bg-sov-dark/50">
                    <td className="py-4">
                      <input
                        type="checkbox"
                        checked={selectedReturns.has(achReturn.id)}
                        onChange={(e) => {
                          const newSelection = new Set(selectedReturns);
                          if (e.target.checked) {
                            newSelection.add(achReturn.id);
                          } else {
                            newSelection.delete(achReturn.id);
                          }
                          setSelectedReturns(newSelection);
                        }}
                        className="text-sov-accent"
                      />
                    </td>
                    <td className="py-4 text-sov-light font-mono text-sm">
                      {achReturn.achPaymentId.slice(-8)}
                    </td>
                    <td className="py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(severity)}`}>
                        {achReturn.returnCode}
                      </span>
                    </td>
                    <td className="py-4 text-sov-light-alt max-w-xs truncate">
                      {getReturnCodeDescription(achReturn.returnCode)}
                    </td>
                    <td className="py-4 text-sov-light font-medium">
                      {formatAmount(achReturn.adjustedAmountCents || 0)}
                    </td>
                    <td className="py-4 text-sov-light-alt text-sm">
                      {formatDate(achReturn.returnedAt)}
                    </td>
                    <td className="py-4">
                      {achReturn.corrected ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-sov-green bg-sov-green/10">
                          Corrected {achReturn.correctionDate && formatDate(achReturn.correctionDate)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-sov-red bg-sov-red/10">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="py-4">
                      <div className="flex space-x-2">
                        {!achReturn.corrected && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedReturn(achReturn);
                                setShowCorrectionModal(true);
                              }}
                              disabled={actionLoading === achReturn.id}
                              className="text-sov-accent hover:text-sov-accent/80 text-sm disabled:opacity-50"
                            >
                              Correct
                            </button>
                            <button
                              onClick={() => handleReturnAction(achReturn.id, 'resubmit')}
                              disabled={actionLoading === achReturn.id}
                              className="text-sov-green hover:text-sov-green/80 text-sm disabled:opacity-50"
                            >
                              Resubmit
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Top Return Codes */}
      {statistics.topReturnCodes.length > 0 && (
        <div className="mt-6 bg-sov-dark rounded-lg p-4 border border-gray-600">
          <h3 className="text-sov-light font-medium mb-3">Top Return Codes</h3>
          <div className="space-y-2">
            {statistics.topReturnCodes.map(({ code, count, percentage }) => (
              <div key={code} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(getReturnCodeSeverity(code))}`}>
                    {code}
                  </span>
                  <span className="text-sov-light-alt text-sm">
                    {getReturnCodeDescription(code)}
                  </span>
                </div>
                <div className="text-sov-light text-sm">
                  {count} ({percentage.toFixed(1)}%)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Correction Modal */}
      {showCorrectionModal && selectedReturn && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center" onClick={() => setShowCorrectionModal(false)}>
          <div className="bg-sov-dark-alt rounded-lg shadow-xl w-full max-w-md border border-gray-700 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-sov-light mb-4">Process Return</h3>
            
            <div className="space-y-4">
              <div className="bg-sov-dark rounded p-3">
                <h4 className="text-sov-light font-medium">Return Details</h4>
                <p className="text-sov-light-alt text-sm mt-1">
                  {selectedReturn.returnCode}: {getReturnCodeDescription(selectedReturn.returnCode)}
                </p>
                <p className="text-sov-light-alt text-sm">
                  Returned: {formatDate(selectedReturn.returnedAt)}
                </p>
              </div>

              <div>
                <label className="block text-sov-light-alt text-sm font-medium mb-2">
                  Action Type
                </label>
                <select
                  value={correctionAction.type}
                  onChange={(e) => setCorrectionAction(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 bg-sov-dark border border-gray-600 rounded-md text-sov-light focus:outline-none focus:ring-2 focus:ring-sov-accent"
                >
                  <option value="corrected">Mark as Corrected</option>
                  <option value="resubmit">Schedule Resubmit</option>
                </select>
              </div>

              {correctionAction.type === 'resubmit' && (
                <div>
                  <label className="block text-sov-light-alt text-sm font-medium mb-2">
                    New Payment Date
                  </label>
                  <input
                    type="date"
                    value={correctionAction.newPaymentDate || ''}
                    onChange={(e) => setCorrectionAction(prev => ({ ...prev, newPaymentDate: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 bg-sov-dark border border-gray-600 rounded-md text-sov-light focus:outline-none focus:ring-2 focus:ring-sov-accent"
                  />
                </div>
              )}

              <div>
                <label className="block text-sov-light-alt text-sm font-medium mb-2">
                  Notes
                </label>
                <textarea
                  value={correctionAction.notes}
                  onChange={(e) => setCorrectionAction(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 bg-sov-dark border border-gray-600 rounded-md text-sov-light focus:outline-none focus:ring-2 focus:ring-sov-accent"
                  placeholder="Notes about the correction..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6 pt-6 border-t border-gray-700">
              <button
                onClick={() => setShowCorrectionModal(false)}
                className="px-4 py-2 text-sov-light-alt border border-gray-600 rounded-md hover:bg-sov-dark focus:outline-none focus:ring-2 focus:ring-sov-accent"
              >
                Cancel
              </button>
              <button
                onClick={handleCorrectionSubmit}
                disabled={actionLoading !== null}
                className="px-4 py-2 bg-sov-accent text-white rounded-md hover:bg-sov-accent/90 focus:outline-none focus:ring-2 focus:ring-sov-accent disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Modal */}
      {showStatsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center" onClick={() => setShowStatsModal(false)}>
          <div className="bg-sov-dark-alt rounded-lg shadow-xl w-full max-w-2xl border border-gray-700 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-sov-light">Return Statistics</h3>
              <button
                onClick={() => setShowStatsModal(false)}
                className="text-sov-light-alt hover:text-sov-light"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-sov-dark rounded p-4">
                <h4 className="text-sov-light font-medium">Total Returns</h4>
                <p className="text-2xl font-bold text-sov-light mt-1">{statistics.totalReturns}</p>
              </div>
              <div className="bg-sov-dark rounded p-4">
                <h4 className="text-sov-light font-medium">Corrected Rate</h4>
                <p className="text-2xl font-bold text-sov-light mt-1">
                  {statistics.totalReturns > 0 
                    ? ((statistics.correctedReturns / statistics.totalReturns) * 100).toFixed(1)
                    : 0
                  }%
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-sov-light font-medium mb-3">Return Code Distribution</h4>
              <div className="space-y-3">
                {statistics.topReturnCodes.map(({ code, count, percentage }) => (
                  <div key={code} className="flex items-center justify-between p-3 bg-sov-dark rounded">
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(getReturnCodeSeverity(code))}`}>
                        {code}
                      </span>
                      <span className="text-sov-light-alt">
                        {getReturnCodeDescription(code)}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sov-light font-medium">{count} returns</div>
                      <div className="text-sov-light-alt text-sm">{percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};