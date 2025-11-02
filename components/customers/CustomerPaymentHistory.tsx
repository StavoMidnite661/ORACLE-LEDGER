import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Download, Eye, RotateCcw, FileText, CreditCard, Building2, Calendar, DollarSign, Clock, CheckCircle, XCircle, AlertCircle, Plus } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Select } from '@/components/shared/Select';
import { Modal } from '@/components/shared/Modal';
import { Badge } from '@/components/shared/Badge';
import { KpiCard } from '@/components/shared/KpiCard';
import { Table } from '@/components/shared/Table';

interface Payment {
  id: string;
  customerId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded' | 'partially_refunded' | 'disputed';
  paymentMethodId: string;
  paymentMethodType: 'card' | 'bank_account';
  paymentMethodDetails: {
    brand?: string;
    last4?: string;
    bankName?: string;
    accountType?: string;
  };
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  description?: string;
  invoiceId?: string;
  failureReason?: string;
  failureCode?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
  refundedAt?: string;
  refundedAmount?: number;
  disputeDetails?: {
    reason: string;
    status: 'warning_needs_response' | 'warning_under_review' | 'warning_closed' | 'needs_response' | 'under_review' | 'charge_refunded' | 'won' | 'lost';
    createdAt: string;
    evidenceDueBy?: string;
  };
  receipt?: {
    url: string;
    number: string;
  };
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
}

interface RefundFormData {
  amount: number;
  reason: string;
  description?: string;
}

const CustomerPaymentHistory: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'succeeded' | 'failed' | 'refunded' | 'partially_refunded' | 'disputed'>('all');
  const [dateRange, setDateRange] = useState<'all' | '7d' | '30d' | '90d' | '1y' | 'custom'>('all');
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [refundForm, setRefundForm] = useState<RefundFormData>({
    amount: 0,
    reason: '',
    description: '',
  });
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);

  // Mock data
  useEffect(() => {
    const mockCustomers: Customer[] = [
      {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        company: 'Acme Corporation',
      },
      {
        id: '2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
      },
    ];

    const mockPayments: Payment[] = [
      {
        id: 'pi_1',
        customerId: '1',
        amount: 1500.00,
        currency: 'usd',
        status: 'succeeded',
        paymentMethodId: 'pm_123',
        paymentMethodType: 'card',
        paymentMethodDetails: {
          brand: 'visa',
          last4: '4242',
        },
        stripePaymentIntentId: 'pi_1234567890',
        stripeChargeId: 'ch_1234567890',
        description: 'Invoice #INV-2024-001',
        invoiceId: 'inv_001',
        createdAt: '2024-10-20T14:30:00Z',
        updatedAt: '2024-10-20T14:32:00Z',
        processedAt: '2024-10-20T14:32:00Z',
        receipt: {
          url: 'https://example.com/receipt/pi_1',
          number: 'RCP-2024-001',
        },
        metadata: {
          invoiceNumber: 'INV-2024-001',
          productName: 'Consulting Services',
        },
      },
      {
        id: 'pi_2',
        customerId: '1',
        amount: 750.00,
        currency: 'usd',
        status: 'succeeded',
        paymentMethodId: 'pm_124',
        paymentMethodType: 'bank_account',
        paymentMethodDetails: {
          bankName: 'Chase Bank',
          accountType: 'checking',
        },
        stripePaymentIntentId: 'pi_0987654321',
        description: 'Invoice #INV-2024-002',
        invoiceId: 'inv_002',
        createdAt: '2024-10-18T10:15:00Z',
        updatedAt: '2024-10-18T10:17:00Z',
        processedAt: '2024-10-18T10:17:00Z',
        receipt: {
          url: 'https://example.com/receipt/pi_2',
          number: 'RCP-2024-002',
        },
      },
      {
        id: 'pi_3',
        customerId: '1',
        amount: 2000.00,
        currency: 'usd',
        status: 'failed',
        paymentMethodId: 'pm_123',
        paymentMethodType: 'card',
        paymentMethodDetails: {
          brand: 'visa',
          last4: '4242',
        },
        stripePaymentIntentId: 'pi_5555555555',
        stripeChargeId: 'ch_5555555555',
        description: 'Invoice #INV-2024-003',
        failureReason: 'Your card was declined.',
        failureCode: 'card_declined',
        createdAt: '2024-10-15T16:45:00Z',
        updatedAt: '2024-10-15T16:45:30Z',
      },
      {
        id: 'pi_4',
        customerId: '2',
        amount: 3200.00,
        currency: 'usd',
        status: 'refunded',
        paymentMethodId: 'pm_456',
        paymentMethodType: 'card',
        paymentMethodDetails: {
          brand: 'mastercard',
          last4: '8888',
        },
        stripePaymentIntentId: 'pi_9999999999',
        stripeChargeId: 'ch_9999999999',
        description: 'Invoice #INV-2024-004',
        invoiceId: 'inv_004',
        createdAt: '2024-10-10T09:00:00Z',
        updatedAt: '2024-10-12T14:30:00Z',
        processedAt: '2024-10-10T09:02:00Z',
        refundedAt: '2024-10-12T14:30:00Z',
        refundedAmount: 3200.00,
        receipt: {
          url: 'https://example.com/receipt/pi_4',
          number: 'RCP-2024-004',
        },
      },
    ];

    setTimeout(() => {
      setCustomers(mockCustomers);
      setPayments(mockPayments);
      setSelectedCustomer(mockCustomers[0]);
      setLoading(false);
    }, 1000);
  }, []);

  const customerPayments = useMemo(() => {
    return payments.filter(payment => payment.customerId === selectedCustomer?.id);
  }, [payments, selectedCustomer]);

  const filteredPayments = useMemo(() => {
    return customerPayments.filter(payment => {
      const matchesSearch = 
        payment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.invoiceId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.stripePaymentIntentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.receipt?.number.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
      
      let matchesDate = true;
      if (dateRange !== 'all') {
        const paymentDate = new Date(payment.createdAt);
        const now = new Date();
        const daysDiff = (now.getTime() - paymentDate.getTime()) / (1000 * 3600 * 24);
        
        switch (dateRange) {
          case '7d': matchesDate = daysDiff <= 7; break;
          case '30d': matchesDate = daysDiff <= 30; break;
          case '90d': matchesDate = daysDiff <= 90; break;
          case '1y': matchesDate = daysDiff <= 365; break;
          case 'custom': // Would implement custom date range logic
            matchesDate = true;
            break;
        }
      }
      
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [customerPayments, searchTerm, statusFilter, dateRange]);

  const paginatedPayments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPayments.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPayments, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);

  // Statistics
  const stats = useMemo(() => {
    const totalPayments = customerPayments.length;
    const successfulPayments = customerPayments.filter(p => p.status === 'succeeded').length;
    const totalAmount = customerPayments
      .filter(p => p.status === 'succeeded')
      .reduce((sum, p) => sum + p.amount, 0);
    const refundedAmount = customerPayments
      .filter(p => p.status === 'refunded')
      .reduce((sum, p) => sum + (p.refundedAmount || 0), 0);
    const netAmount = totalAmount - refundedAmount;
    const failedPayments = customerPayments.filter(p => p.status === 'failed').length;
    const disputeCount = customerPayments.filter(p => p.status === 'disputed').length;

    return {
      totalPayments,
      successfulPayments,
      failedPayments,
      disputeCount,
      totalAmount,
      refundedAmount,
      netAmount,
      successRate: totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0,
    };
  }, [customerPayments]);

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      case 'partially_refunded': return 'bg-orange-100 text-orange-800';
      case 'disputed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'succeeded': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      case 'refunded': return <RotateCcw className="h-4 w-4" />;
      case 'partially_refunded': return <RotateCcw className="h-4 w-4" />;
      case 'disputed': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const handleRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingRefund(true);

    try {
      console.log('Processing refund:', refundForm, 'for payment:', selectedPayment?.id);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update payment status
      setPayments(prev => prev.map(p => 
        p.id === selectedPayment?.id
          ? { 
              ...p, 
              status: refundForm.amount === selectedPayment.amount ? 'refunded' : 'partially_refunded',
              refundedAmount: (p.refundedAmount || 0) + refundForm.amount,
              refundedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : p
      ));
      
      setShowRefundModal(false);
      setSelectedPayment(null);
      setRefundForm({ amount: 0, reason: '', description: '' });
    } catch (error) {
      console.error('Error processing refund:', error);
    } finally {
      setIsProcessingRefund(false);
    }
  };

  const exportPayments = () => {
    const csvContent = [
      ['Date', 'Payment ID', 'Amount', 'Status', 'Method', 'Description', 'Invoice', 'Receipt #'],
      ...filteredPayments.map(payment => [
        formatDate(payment.createdAt),
        payment.id,
        payment.amount.toString(),
        payment.status,
        payment.paymentMethodType === 'card' 
          ? `${payment.paymentMethodDetails.brand} •••• ${payment.paymentMethodDetails.last4}`
          : `${payment.paymentMethodDetails.bankName} ${payment.paymentMethodDetails.accountType}`,
        payment.description || '',
        payment.invoiceId || '',
        payment.receipt?.number || '',
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment_history_${selectedCustomer?.id}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>
          <p className="text-gray-600">View and manage customer payment transactions</p>
        </div>
        <Button
          onClick={exportPayments}
          className="bg-blue-600 hover:bg-blue-700"
          disabled={!selectedCustomer}
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Customer Selection */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Select Customer</h2>
        <select
          value={selectedCustomer?.id || ''}
          onChange={(e) => {
            const customer = customers.find(c => c.id === e.target.value);
            setSelectedCustomer(customer || null);
          }}
          className="block w-full max-w-md rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">Choose a customer...</option>
          {customers.map(customer => (
            <option key={customer.id} value={customer.id}>
              {customer.firstName} {customer.lastName} ({customer.email})
              {customer.company && ` - ${customer.company}`}
            </option>
          ))}
        </select>
      </div>

      {selectedCustomer && (
        <>
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KpiCard
              title="Total Payments"
              value={stats.totalPayments.toString()}
              icon={<DollarSign className="h-6 w-6" />}
            />
            <KpiCard
              title="Successful"
              value={stats.successfulPayments.toString()}
              icon={<CheckCircle className="h-6 w-6" />}
              trend={stats.successRate}
            />
            <KpiCard
              title="Total Amount"
              value={formatCurrency(stats.totalAmount)}
              icon={<DollarSign className="h-6 w-6" />}
            />
            <KpiCard
              title="Net Amount"
              value={formatCurrency(stats.netAmount)}
              icon={<DollarSign className="h-6 w-6" />}
            />
          </div>

          {/* Filters and Search */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search payments by ID, description, invoice, or receipt..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Select
                  value={statusFilter}
                  onChange={(value) => setStatusFilter(value as any)}
                >
                  <option value="all">All Status</option>
                  <option value="succeeded">Succeeded</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                  <option value="partially_refunded">Partially Refunded</option>
                  <option value="disputed">Disputed</option>
                </Select>
                <Select
                  value={dateRange}
                  onChange={(value) => setDateRange(value as any)}
                >
                  <option value="all">All Time</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="1y">Last year</option>
                  <option value="custom">Custom range</option>
                </Select>
              </div>
            </div>
          </div>

          {/* Payments Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <Table>
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {payment.description || 'Payment'}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {payment.id}
                        </div>
                        {payment.invoiceId && (
                          <div className="text-xs text-blue-600">
                            Invoice: {payment.invoiceId}
                          </div>
                        )}
                        {payment.receipt && (
                          <div className="text-xs text-green-600">
                            Receipt: {payment.receipt.number}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(payment.amount, payment.currency)}
                      </div>
                      {payment.status === 'refunded' && (
                        <div className="text-xs text-gray-500">
                          Refunded: {formatCurrency(payment.refundedAmount || 0, payment.currency)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={`${getStatusColor(payment.status)} flex items-center`}>
                        {getStatusIcon(payment.status)}
                        <span className="ml-1 capitalize">{payment.status.replace('_', ' ')}</span>
                      </Badge>
                      {payment.failureReason && (
                        <div className="text-xs text-red-600 mt-1">
                          {payment.failureReason}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {payment.paymentMethodType === 'card' ? (
                          <>
                            <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
                            <div className="text-sm">
                              <div className="text-gray-900">
                                {payment.paymentMethodDetails.brand?.toUpperCase()} •••• {payment.paymentMethodDetails.last4}
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                            <div className="text-sm">
                              <div className="text-gray-900">
                                {payment.paymentMethodDetails.bankName} {payment.paymentMethodDetails.accountType?.toUpperCase()}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{formatDate(payment.createdAt)}</div>
                      {payment.processedAt && (
                        <div className="text-xs text-green-600">
                          Processed: {formatDate(payment.processedAt)}
                        </div>
                      )}
                      {payment.refundedAt && (
                        <div className="text-xs text-gray-600">
                          Refunded: {formatDate(payment.refundedAt)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setShowDetailsModal(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {(payment.status === 'succeeded' || payment.status === 'partially_refunded') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedPayment(payment);
                              setRefundForm({
                                amount: payment.status === 'succeeded' 
                                  ? payment.amount 
                                  : payment.amount - (payment.refundedAmount || 0),
                                reason: '',
                                description: '',
                              });
                              setShowRefundModal(true);
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                        {payment.invoiceId && (
                          <Button
                            variant="outline"
                            size="sm"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        )}
                        {payment.receipt && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(payment.receipt!.url, '_blank')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

            {paginatedPayments.length === 0 && (
              <div className="text-center py-12">
                <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No payments found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No payments match your current filters.
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredPayments.length)} of {filteredPayments.length} results
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="flex items-center px-3 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Refund Modal */}
      <Modal
        isOpen={showRefundModal}
        onClose={() => {
          setShowRefundModal(false);
          setSelectedPayment(null);
          setRefundForm({ amount: 0, reason: '', description: '' });
        }}
        title="Process Refund"
        size="md"
      >
        {selectedPayment && (
          <form onSubmit={handleRefund} className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Payment Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Payment ID:</span>
                  <div className="font-medium">{selectedPayment.id}</div>
                </div>
                <div>
                  <span className="text-gray-600">Amount:</span>
                  <div className="font-medium">{formatCurrency(selectedPayment.amount, selectedPayment.currency)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <div className="font-medium capitalize">{selectedPayment.status.replace('_', ' ')}</div>
                </div>
                <div>
                  <span className="text-gray-600">Date:</span>
                  <div className="font-medium">{formatDate(selectedPayment.createdAt)}</div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Refund Amount *
              </label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                max={selectedPayment.amount - (selectedPayment.refundedAmount || 0)}
                value={refundForm.amount}
                onChange={(e) => setRefundForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                placeholder="Enter refund amount"
                required
              />
              <div className="mt-1 text-sm text-gray-500">
                Maximum refundable: {formatCurrency(selectedPayment.amount - (selectedPayment.refundedAmount || 0), selectedPayment.currency)}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason *
              </label>
              <select
                value={refundForm.reason}
                onChange={(e) => setRefundForm(prev => ({ ...prev, reason: e.target.value }))}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">Select a reason</option>
                <option value="requested_by_customer">Requested by customer</option>
                <option value="duplicate_payment">Duplicate payment</option>
                <option value="fraudulent_payment">Fraudulent payment</option>
                <option value="product_not_received">Product not received</option>
                <option value="product_defective">Product defective</option>
                <option value="service_not_provided">Service not provided</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={refundForm.description}
                onChange={(e) => setRefundForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Additional details about the refund (optional)"
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Refund Policy</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>Refunds may take 5-10 business days to appear in your customer's account depending on their bank. You'll receive a confirmation email once the refund is processed.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowRefundModal(false);
                  setSelectedPayment(null);
                  setRefundForm({ amount: 0, reason: '', description: '' });
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isProcessingRefund || refundForm.amount <= 0 || !refundForm.reason}
                className="bg-red-600 hover:bg-red-700"
              >
                {isProcessingRefund ? 'Processing...' : 'Process Refund'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Payment Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedPayment(null);
        }}
        title="Payment Details"
        size="lg"
      >
        {selectedPayment && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Payment Information</h3>
                <div className="space-y-2">
                  <p><strong>Payment ID:</strong> {selectedPayment.id}</p>
                  <p><strong>Amount:</strong> {formatCurrency(selectedPayment.amount, selectedPayment.currency)}</p>
                  <p><strong>Status:</strong> 
                    <Badge className={`ml-2 ${getStatusColor(selectedPayment.status)}`}>
                      {selectedPayment.status.replace('_', ' ')}
                    </Badge>
                  </p>
                  <p><strong>Description:</strong> {selectedPayment.description || 'N/A'}</p>
                  {selectedPayment.invoiceId && (
                    <p><strong>Invoice:</strong> {selectedPayment.invoiceId}</p>
                  )}
                  {selectedPayment.receipt && (
                    <p><strong>Receipt:</strong> {selectedPayment.receipt.number}</p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Timing</h3>
                <div className="space-y-2">
                  <p><strong>Created:</strong> {formatDate(selectedPayment.createdAt)}</p>
                  <p><strong>Updated:</strong> {formatDate(selectedPayment.updatedAt)}</p>
                  {selectedPayment.processedAt && (
                    <p><strong>Processed:</strong> {formatDate(selectedPayment.processedAt)}</p>
                  )}
                  {selectedPayment.refundedAt && (
                    <p><strong>Refunded:</strong> {formatDate(selectedPayment.refundedAt)}</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Payment Method</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center">
                  {selectedPayment.paymentMethodType === 'card' ? (
                    <CreditCard className="h-8 w-8 text-gray-400 mr-4" />
                  ) : (
                    <Building2 className="h-8 w-8 text-gray-400 mr-4" />
                  )}
                  <div>
                    <div className="font-medium text-gray-900">
                      {selectedPayment.paymentMethodType === 'card' 
                        ? `${selectedPayment.paymentMethodDetails.brand?.toUpperCase()} •••• ${selectedPayment.paymentMethodDetails.last4}`
                        : `${selectedPayment.paymentMethodDetails.bankName} ${selectedPayment.paymentMethodDetails.accountType?.toUpperCase()}`
                      }
                    </div>
                    <div className="text-sm text-gray-500">
                      Method ID: {selectedPayment.paymentMethodId}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {selectedPayment.stripePaymentIntentId && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Stripe Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p><strong>Payment Intent:</strong> {selectedPayment.stripePaymentIntentId}</p>
                      <p><strong>Charge ID:</strong> {selectedPayment.stripeChargeId}</p>
                    </div>
                    <div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`https://dashboard.stripe.com/payments/${selectedPayment.stripePaymentIntentId}`, '_blank')}
                      >
                        View in Stripe
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedPayment.failureReason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-red-900 mb-3">Failure Information</h3>
                <div className="space-y-2">
                  <p><strong>Reason:</strong> {selectedPayment.failureReason}</p>
                  {selectedPayment.failureCode && (
                    <p><strong>Code:</strong> {selectedPayment.failureCode}</p>
                  )}
                </div>
              </div>
            )}

            {selectedPayment.status === 'refunded' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-blue-900 mb-3">Refund Information</h3>
                <div className="space-y-2">
                  <p><strong>Refunded Amount:</strong> {formatCurrency(selectedPayment.refundedAmount || 0, selectedPayment.currency)}</p>
                  <p><strong>Refund Date:</strong> {selectedPayment.refundedAt ? formatDate(selectedPayment.refundedAt) : 'N/A'}</p>
                </div>
              </div>
            )}

            {selectedPayment.disputeDetails && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-purple-900 mb-3">Dispute Information</h3>
                <div className="space-y-2">
                  <p><strong>Reason:</strong> {selectedPayment.disputeDetails.reason}</p>
                  <p><strong>Status:</strong> {selectedPayment.disputeDetails.status.replace('_', ' ')}</p>
                  <p><strong>Created:</strong> {formatDate(selectedPayment.disputeDetails.createdAt)}</p>
                  {selectedPayment.disputeDetails.evidenceDueBy && (
                    <p><strong>Evidence Due:</strong> {formatDate(selectedPayment.disputeDetails.evidenceDueBy)}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CustomerPaymentHistory;