import React, { useState, useEffect, useMemo } from 'react';
import type { AchPayment, AchReturnCodes } from '../../types';

interface PaymentFilters {
  dateRange: '7days' | '30days' | '90days' | 'custom';
  startDate?: string;
  endDate?: string;
  status: 'all' | 'pending' | 'succeeded' | 'failed' | 'returned';
  customerId?: string;
  minAmount?: number;
  maxAmount?: number;
  searchTerm?: string;
}

interface PaginatedPayments {
  payments: AchPayment[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface AchPaymentHistoryProps {
  onPaymentSelect?: (payment: AchPayment) => void;
  onExport?: (filters: PaymentFilters) => void;
  refreshInterval?: number;
}

const STATUS_COLORS = {
  pending: 'text-sov-accent bg-sov-accent/10',
  succeeded: 'text-sov-green bg-sov-green/10',
  failed: 'text-sov-red bg-sov-red/10',
  canceled: 'text-gray-400 bg-gray-400/10',
  returned: 'text-orange-400 bg-orange-400/10'
};

const STATUS_ICONS = {
  pending: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
    </svg>
  ),
  succeeded: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  ),
  failed: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  ),
  canceled: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  ),
  returned: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  )
};

export const AchPaymentHistory: React.FC<AchPaymentHistoryProps> = ({
  onPaymentSelect,
  onExport,
  refreshInterval = 30000 // 30 seconds
}) => {
  const [payments, setPayments] = useState<PaginatedPayments>({
    payments: [],
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<PaymentFilters>({
    dateRange: '30days',
    status: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load payments
  const loadPayments = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: payments.pageSize.toString(),
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

      const response = await fetch(`/api/ach-payments?${params}`);
      if (!response.ok) {
        throw new Error('Failed to load payments');
      }

      const data = await response.json();
      setPayments(data);

      // Clear selected payments if page changed
      if (page !== payments.page) {
        setSelectedPayments(new Set());
      }

    } catch (error) {
      console.error('Failed to load payments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh
  useEffect(() => {
    loadPayments();
    const interval = setInterval(() => {
      loadPayments(payments.page);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, payments.page, filters]);

  // Filtered and sorted payments
  const filteredPayments = useMemo(() => {
    let filtered = [...payments.payments];

    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(payment =>
        payment.description?.toLowerCase().includes(searchLower) ||
        payment.customerId.includes(searchLower) ||
        payment.id.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [payments.payments, filters]);

  const handlePaymentAction = async (paymentId: string, action: 'cancel' | 'retry') => {
    try {
      setActionLoading(paymentId);
      const response = await fetch(`/api/ach-payments/${paymentId}/${action}`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} payment`);
      }

      // Refresh payments
      await loadPayments(payments.page);

    } catch (error) {
      console.error(`Failed to ${action} payment:`, error);
      alert(`Failed to ${action} payment. Please try again.`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkAction = async (action: 'cancel' | 'retry') => {
    if (selectedPayments.size === 0) return;

    try {
      setActionLoading('bulk');
      const response = await fetch('/api/ach-payments/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          paymentIds: Array.from(selectedPayments)
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} selected payments`);
      }

      setSelectedPayments(new Set());
      await loadPayments(payments.page);

    } catch (error) {
      console.error(`Failed to ${action} payments:`, error);
      alert(`Failed to ${action} payments. Please try again.`);
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

  const getReturnCodeDescription = (code?: string): string => {
    if (!code) return '';
    const returnDescriptions: Record<string, string> = {
      'R01': 'Insufficient Funds',
      'R02': 'Account Closed',
      'R03': 'No Account / Unable to Locate Account',
      'R04': 'Invalid Account Number',
      'R05': 'Unauthorized Debit',
      'R08': 'Payment Stopped'
      // Add more return codes as needed
    };
    return returnDescriptions[code] || code;
  };

  const exportPayments = async () => {
    try {
      const params = new URLSearchParams({
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => 
            value !== undefined && value !== '' && value !== 'all'
          )
        ),
        export: 'true'
      });

      const response = await fetch(`/api/ach-payments/export?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ach-payments-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export payments:', error);
    }
  };

  return (
    <div className="bg-sov-dark-alt rounded-lg shadow-xl border border-gray-700 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-sov-light">ACH Payment History</h2>
          <p className="text-sov-light-alt mt-1">
            {payments.total} payments • {formatAmount(payments.payments.reduce((sum, p) => sum + p.amountCents, 0))} total
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 text-sov-light border border-gray-600 rounded-md hover:bg-sov-dark focus:outline-none focus:ring-2 focus:ring-sov-accent"
          >
            Filters
          </button>
          <button
            onClick={exportPayments}
            className="px-4 py-2 bg-sov-accent text-white rounded-md hover:bg-sov-accent/90 focus:outline-none focus:ring-2 focus:ring-sov-accent"
          >
            Export
          </button>
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
              <label className="block text-sov-light-alt text-sm font-medium mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full px-3 py-2 bg-sov-dark border border-gray-600 rounded-md text-sov-light focus:outline-none focus:ring-2 focus:ring-sov-accent"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="succeeded">Succeeded</option>
                <option value="failed">Failed</option>
                <option value="returned">Returned</option>
              </select>
            </div>

            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sov-light-alt text-sm font-medium mb-2">Search</label>
              <input
                type="text"
                value={filters.searchTerm || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                placeholder="Search by description, customer ID, or payment ID..."
                className="w-full px-3 py-2 bg-sov-dark border border-gray-600 rounded-md text-sov-light focus:outline-none focus:ring-2 focus:ring-sov-accent"
              />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={() => setFilters({ dateRange: '30days', status: 'all' })}
              className="px-4 py-2 text-sov-light-alt border border-gray-600 rounded-md hover:bg-sov-dark focus:outline-none focus:ring-2 focus:ring-sov-accent mr-3"
            >
              Clear Filters
            </button>
            <button
              onClick={() => loadPayments(1)}
              className="px-4 py-2 bg-sov-accent text-white rounded-md hover:bg-sov-accent/90 focus:outline-none focus:ring-2 focus:ring-sov-accent"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedPayments.size > 0 && (
        <div className="bg-sov-accent/10 border border-sov-accent/30 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-sov-light">
              {selectedPayments.size} payment{selectedPayments.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex space-x-3">
              <button
                onClick={() => handleBulkAction('cancel')}
                disabled={actionLoading !== null}
                className="px-4 py-2 text-sov-red border border-sov-red/30 rounded-md hover:bg-sov-red/10 focus:outline-none focus:ring-2 focus:ring-sov-red/50 disabled:opacity-50"
              >
                Cancel Selected
              </button>
              <button
                onClick={() => handleBulkAction('retry')}
                disabled={actionLoading !== null}
                className="px-4 py-2 bg-sov-accent text-white rounded-md hover:bg-sov-accent/90 focus:outline-none focus:ring-2 focus:ring-sov-accent disabled:opacity-50"
              >
                Retry Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payments Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="pb-3">
                <input
                  type="checkbox"
                  checked={selectedPayments.size === payments.payments.length && payments.payments.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedPayments(new Set(payments.payments.map(p => p.id)));
                    } else {
                      setSelectedPayments(new Set());
                    }
                  }}
                  className="text-sov-accent"
                />
              </th>
              <th className="pb-3 text-sov-light-alt font-medium">Payment ID</th>
              <th className="pb-3 text-sov-light-alt font-medium">Customer</th>
              <th className="pb-3 text-sov-light-alt font-medium">Amount</th>
              <th className="pb-3 text-sov-light-alt font-medium">Status</th>
              <th className="pb-3 text-sov-light-alt font-medium">Date</th>
              <th className="pb-3 text-sov-light-alt font-medium">Class Code</th>
              <th className="pb-3 text-sov-light-alt font-medium">Description</th>
              <th className="pb-3 text-sov-light-alt font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-sov-light-alt">
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-sov-accent" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Loading payments...
                  </div>
                </td>
              </tr>
            ) : filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-sov-light-alt">
                  No payments found
                </td>
              </tr>
            ) : (
              filteredPayments.map((payment) => (
                <tr key={payment.id} className="border-b border-gray-700/50 hover:bg-sov-dark/50">
                  <td className="py-4">
                    <input
                      type="checkbox"
                      checked={selectedPayments.has(payment.id)}
                      onChange={(e) => {
                        const newSelection = new Set(selectedPayments);
                        if (e.target.checked) {
                          newSelection.add(payment.id);
                        } else {
                          newSelection.delete(payment.id);
                        }
                        setSelectedPayments(newSelection);
                      }}
                      className="text-sov-accent"
                    />
                  </td>
                  <td className="py-4 text-sov-light font-mono text-sm">
                    {payment.id.slice(-8)}
                  </td>
                  <td className="py-4 text-sov-light">
                    {payment.customerId}
                  </td>
                  <td className="py-4 text-sov-light font-medium">
                    {formatAmount(payment.amountCents)}
                  </td>
                  <td className="py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[payment.status as keyof typeof STATUS_COLORS]}`}>
                      {STATUS_ICONS[payment.status as keyof typeof STATUS_ICONS]}
                      <span className="ml-1 capitalize">{payment.status}</span>
                    </span>
                    {payment.returnCode && (
                      <div className="text-xs text-orange-400 mt-1">
                        {payment.returnCode}: {getReturnCodeDescription(payment.returnCode)}
                      </div>
                    )}
                  </td>
                  <td className="py-4 text-sov-light-alt text-sm">
                    {formatDate(payment.createdAt)}
                  </td>
                  <td className="py-4 text-sov-light font-mono text-sm">
                    {payment.achClassCode}
                  </td>
                  <td className="py-4 text-sov-light-alt max-w-xs truncate">
                    {payment.description || 'No description'}
                  </td>
                  <td className="py-4">
                    <div className="flex space-x-2">
                      {onPaymentSelect && (
                        <button
                          onClick={() => onPaymentSelect(payment)}
                          className="text-sov-accent hover:text-sov-accent/80 text-sm"
                        >
                          View
                        </button>
                      )}
                      {payment.status === 'pending' && (
                        <button
                          onClick={() => handlePaymentAction(payment.id, 'cancel')}
                          disabled={actionLoading === payment.id}
                          className="text-sov-red hover:text-sov-red/80 text-sm disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      )}
                      {(payment.status === 'failed' || payment.returnCode) && (
                        <button
                          onClick={() => handlePaymentAction(payment.id, 'retry')}
                          disabled={actionLoading === payment.id}
                          className="text-sov-accent hover:text-sov-accent/80 text-sm disabled:opacity-50"
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {payments.totalPages > 1 && (
        <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-700">
          <div className="text-sov-light-alt text-sm">
            Showing {((payments.page - 1) * payments.pageSize) + 1} to {Math.min(payments.page * payments.pageSize, payments.total)} of {payments.total} payments
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => loadPayments(payments.page - 1)}
              disabled={payments.page === 1 || loading}
              className="px-3 py-1 text-sov-light border border-gray-600 rounded hover:bg-sov-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sov-light">
              Page {payments.page} of {payments.totalPages}
            </span>
            <button
              onClick={() => loadPayments(payments.page + 1)}
              disabled={payments.page === payments.totalPages || loading}
              className="px-3 py-1 text-sov-light border border-gray-600 rounded hover:bg-sov-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};