import React, { useState, useEffect } from 'react';
import { Plus, CreditCard, Building2, Shield, Check, X, AlertCircle, Star, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Modal } from '@/components/shared/Modal';
import { Badge } from '@/components/shared/Badge';
import { KpiCard } from '@/components/shared/KpiCard';
import { Table } from '@/components/shared/Table';

interface PaymentMethod {
  id: string;
  customerId: string;
  type: 'card' | 'bank_account';
  stripePaymentMethodId?: string;
  brand?: string; // For cards
  last4?: string; // Last 4 digits
  expMonth?: number;
  expYear?: number;
  bankName?: string; // For bank accounts
  accountType?: 'checking' | 'savings';
  routingNumber: string; // Partially masked
  verificationStatus: 'verified' | 'pending' | 'failed' | 'not_required';
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastUsed?: string;
  failureCount: number;
  metadata?: Record<string, any>;
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  stripeCustomerId?: string;
}

interface PaymentMethodFormData {
  type: 'card' | 'bank_account';
  // Card fields
  cardNumber?: string;
  expiryMonth?: string;
  expiryYear?: string;
  cvc?: string;
  // Bank account fields
  routingNumber?: string;
  accountNumber?: string;
  accountType?: 'checking' | 'savings';
}

const PaymentMethodManagement: React.FC = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<PaymentMethodFormData>({
    type: 'card',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Mock data
  useEffect(() => {
    const mockCustomers: Customer[] = [
      {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        stripeCustomerId: 'cus_1234567890',
      },
      {
        id: '2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        stripeCustomerId: 'cus_0987654321',
      },
    ];

    const mockPaymentMethods: PaymentMethod[] = [
      {
        id: 'pm_1',
        customerId: '1',
        type: 'card',
        stripePaymentMethodId: 'pm_1234567890',
        brand: 'visa',
        last4: '4242',
        expMonth: 12,
        expYear: 2027,
        verificationStatus: 'verified',
        isDefault: true,
        isActive: true,
        createdAt: '2024-01-15T09:00:00Z',
        updatedAt: '2024-01-15T09:00:00Z',
        lastUsed: '2024-10-20T14:30:00Z',
        failureCount: 0,
      },
      {
        id: 'pm_2',
        customerId: '1',
        type: 'bank_account',
        stripePaymentMethodId: 'ba_1234567890',
        bankName: 'Chase Bank',
        accountType: 'checking',
        routingNumber: '****3456',
        verificationStatus: 'verified',
        isDefault: false,
        isActive: true,
        createdAt: '2024-02-20T10:30:00Z',
        updatedAt: '2024-02-20T10:30:00Z',
        lastUsed: '2024-09-15T09:15:00Z',
        failureCount: 0,
      },
      {
        id: 'pm_3',
        customerId: '2',
        type: 'card',
        stripePaymentMethodId: 'pm_0987654321',
        brand: 'mastercard',
        last4: '8888',
        expMonth: 8,
        expYear: 2026,
        verificationStatus: 'verified',
        isDefault: true,
        isActive: true,
        createdAt: '2024-03-10T11:45:00Z',
        updatedAt: '2024-03-10T11:45:00Z',
        lastUsed: '2024-10-18T16:20:00Z',
        failureCount: 1,
      },
    ];

    setTimeout(() => {
      setCustomers(mockCustomers);
      setPaymentMethods(mockPaymentMethods);
      setSelectedCustomer(mockCustomers[0]);
      setLoading(false);
    }, 1000);
  }, []);

  const customerPaymentMethods = paymentMethods.filter(pm => pm.customerId === selectedCustomer?.id);

  // Statistics
  const stats = {
    totalMethods: customerPaymentMethods.length,
    activeMethods: customerPaymentMethods.filter(pm => pm.isActive).length,
    defaultMethods: customerPaymentMethods.filter(pm => pm.isDefault).length,
    failedVerifications: customerPaymentMethods.filter(pm => pm.verificationStatus === 'failed').length,
  };

  const validateForm = (data: PaymentMethodFormData): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (data.type === 'card') {
      if (!data.cardNumber?.replace(/\s/g, '')) {
        errors.cardNumber = 'Card number is required';
      } else if (data.cardNumber.replace(/\s/g, '').length < 15) {
        errors.cardNumber = 'Please enter a valid card number';
      }
      
      if (!data.expiryMonth) {
        errors.expiryMonth = 'Expiry month is required';
      }
      
      if (!data.expiryYear) {
        errors.expiryYear = 'Expiry year is required';
      }
      
      if (!data.cvc) {
        errors.cvc = 'CVC is required';
      } else if (data.cvc.length < 3) {
        errors.cvc = 'CVC must be at least 3 digits';
      }
    } else if (data.type === 'bank_account') {
      if (!data.routingNumber?.replace(/\s/g, '')) {
        errors.routingNumber = 'Routing number is required';
      } else if (data.routingNumber.replace(/\s/g, '').length !== 9) {
        errors.routingNumber = 'Routing number must be 9 digits';
      }
      
      if (!data.accountNumber) {
        errors.accountNumber = 'Account number is required';
      }
      
      if (!data.accountType) {
        errors.accountType = 'Account type is required';
      }
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setIsSubmitting(false);
      return;
    }

    try {
      console.log('Adding payment method:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create new payment method object
      const newPaymentMethod: PaymentMethod = {
        id: `pm_${Date.now()}`,
        customerId: selectedCustomer!.id,
        type: formData.type,
        stripePaymentMethodId: `pm_${Date.now()}`,
        ...(formData.type === 'card' ? {
          brand: detectCardBrand(formData.cardNumber!),
          last4: formData.cardNumber!.slice(-4),
          expMonth: parseInt(formData.expiryMonth!),
          expYear: parseInt(formData.expiryYear!),
        } : {
          bankName: 'Bank of America', // Mock
          accountType: formData.accountType!,
          routingNumber: `${formData.routingNumber!.slice(0, 4)}****${formData.routingNumber!.slice(-2)}`,
        }),
        verificationStatus: 'verified',
        isDefault: customerPaymentMethods.length === 0, // First method is default
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
        failureCount: 0,
      };

      setPaymentMethods(prev => [...prev, newPaymentMethod]);
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('Error adding payment method:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'card',
    });
    setFormErrors({});
  };

  const detectCardBrand = (cardNumber: string): string => {
    const number = cardNumber.replace(/\s/g, '');
    if (number.startsWith('4')) return 'visa';
    if (number.startsWith('5')) return 'mastercard';
    if (number.startsWith('3')) return 'amex';
    if (number.startsWith('6')) return 'discover';
    return 'unknown';
  };

  const formatCardNumber = (value: string): string => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string): string => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      console.log('Setting default payment method:', paymentMethodId);
      
      setPaymentMethods(prev => prev.map(pm => ({
        ...pm,
        isDefault: pm.id === paymentMethodId,
        updatedAt: new Date().toISOString(),
      })));
    } catch (error) {
      console.error('Error setting default payment method:', error);
    }
  };

  const handleToggleActive = async (paymentMethodId: string, isActive: boolean) => {
    try {
      console.log('Toggling payment method active status:', paymentMethodId, isActive);
      
      setPaymentMethods(prev => prev.map(pm => 
        pm.id === paymentMethodId 
          ? { ...pm, isActive, updatedAt: new Date().toISOString() }
          : pm
      ));
    } catch (error) {
      console.error('Error toggling payment method status:', error);
    }
  };

  const handleDelete = async (paymentMethodId: string) => {
    if (!confirm('Are you sure you want to delete this payment method? This action cannot be undone.')) return;

    try {
      console.log('Deleting payment method:', paymentMethodId);
      
      setPaymentMethods(prev => prev.filter(pm => pm.id !== paymentMethodId));
    } catch (error) {
      console.error('Error deleting payment method:', error);
    }
  };

  const handleVerifyBankAccount = async (paymentMethodId: string) => {
    try {
      console.log('Verifying bank account:', paymentMethodId);
      
      // Simulate verification process
      setTimeout(() => {
        setPaymentMethods(prev => prev.map(pm =>
          pm.id === paymentMethodId
            ? { ...pm, verificationStatus: 'verified', updatedAt: new Date().toISOString() }
            : pm
        ));
      }, 2000);
    } catch (error) {
      console.error('Error verifying bank account:', error);
    }
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

  const getCardIcon = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa': return '💳';
      case 'mastercard': return '💳';
      case 'amex': return '💳';
      case 'discover': return '💳';
      default: return '💳';
    }
  };

  const getVerificationStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVerificationStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <Check className="h-4 w-4" />;
      case 'pending': return <AlertCircle className="h-4 w-4" />;
      case 'failed': return <X className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Payment Method Management</h1>
          <p className="text-gray-600">Manage customer payment methods and verification status</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
          disabled={!selectedCustomer}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Payment Method
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
          className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">Choose a customer...</option>
          {customers.map(customer => (
            <option key={customer.id} value={customer.id}>
              {customer.firstName} {customer.lastName} ({customer.email})
            </option>
          ))}
        </select>
      </div>

      {selectedCustomer && (
        <>
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KpiCard
              title="Total Methods"
              value={stats.totalMethods.toString()}
              icon={<CreditCard className="h-6 w-6" />}
            />
            <KpiCard
              title="Active Methods"
              value={stats.activeMethods.toString()}
              icon={<Shield className="h-6 w-6" />}
            />
            <KpiCard
              title="Default Methods"
              value={stats.defaultMethods.toString()}
              icon={<Star className="h-6 w-6" />}
            />
            <KpiCard
              title="Failed Verifications"
              value={stats.failedVerifications.toString()}
              icon={<AlertCircle className="h-6 w-6" />}
              trend={stats.failedVerifications > 0 ? +stats.failedVerifications : 0}
            />
          </div>

          {/* Payment Methods Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <Table>
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Verification
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Used
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customerPaymentMethods.map((paymentMethod) => (
                  <tr key={paymentMethod.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="mr-3">
                          {paymentMethod.type === 'card' ? (
                            <div className="flex items-center">
                              <span className="text-lg mr-2">{getCardIcon(paymentMethod.brand!)}</span>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {paymentMethod.brand?.toUpperCase()} •••• {paymentMethod.last4}
                                </div>
                                {paymentMethod.expMonth && paymentMethod.expYear && (
                                  <div className="text-xs text-gray-500">
                                    Expires {paymentMethod.expMonth.toString().padStart(2, '0')}/{paymentMethod.expYear}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <Building2 className="h-5 w-5 text-gray-400 mr-2" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {paymentMethod.bankName} {paymentMethod.accountType?.toUpperCase()}
                                </div>
                                <div className="text-xs text-gray-500">
                                  •••••{paymentMethod.last4}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        {paymentMethod.isDefault && (
                          <Badge className="bg-blue-100 text-blue-800">
                            <Star className="h-3 w-3 mr-1" />
                            Default
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={paymentMethod.type === 'card' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                        {paymentMethod.type === 'card' ? 'Card' : 'Bank Account'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Badge className={`${getVerificationStatusColor(paymentMethod.verificationStatus)} flex items-center`}>
                          {getVerificationStatusIcon(paymentMethod.verificationStatus)}
                          <span className="ml-1 capitalize">{paymentMethod.verificationStatus}</span>
                        </Badge>
                        {paymentMethod.type === 'bank_account' && paymentMethod.verificationStatus === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVerifyBankAccount(paymentMethod.id)}
                            className="ml-2"
                          >
                            Verify
                          </Button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(paymentMethod.id, !paymentMethod.isActive)}
                        className={paymentMethod.isActive ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-gray-600'}
                      >
                        {paymentMethod.isActive ? 'Active' : 'Inactive'}
                      </Button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {paymentMethod.lastUsed ? formatDate(paymentMethod.lastUsed) : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPaymentMethod(paymentMethod);
                            setShowDetailsModal(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!paymentMethod.isDefault && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefault(paymentMethod.id)}
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(paymentMethod.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

            {customerPaymentMethods.length === 0 && (
              <div className="text-center py-12">
                <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No payment methods</h3>
                <p className="mt-1 text-sm text-gray-500">
                  This customer doesn't have any payment methods yet.
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Create Payment Method Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Add Payment Method"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method Type
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="card"
                  checked={formData.type === 'card'}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                  className="mr-2"
                />
                <CreditCard className="h-4 w-4 mr-1" />
                Credit/Debit Card
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="bank_account"
                  checked={formData.type === 'bank_account'}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                  className="mr-2"
                />
                <Building2 className="h-4 w-4 mr-1" />
                Bank Account
              </label>
            </div>
          </div>

          {formData.type === 'card' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Card Number *
                </label>
                <input
                  type="text"
                  value={formData.cardNumber || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, cardNumber: formatCardNumber(e.target.value) }))}
                  placeholder="1234 5678 9012 3456"
                  className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    formErrors.cardNumber ? 'border-red-500' : ''
                  }`}
                  maxLength={19}
                />
                {formErrors.cardNumber && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.cardNumber}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Month *
                  </label>
                  <select
                    value={formData.expiryMonth || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiryMonth: e.target.value }))}
                    className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                      formErrors.expiryMonth ? 'border-red-500' : ''
                    }`}
                  >
                    <option value="">Month</option>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {(i + 1).toString().padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                  {formErrors.expiryMonth && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.expiryMonth}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year *
                  </label>
                  <select
                    value={formData.expiryYear || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiryYear: e.target.value }))}
                    className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                      formErrors.expiryYear ? 'border-red-500' : ''
                    }`}
                  >
                    <option value="">Year</option>
                    {Array.from({ length: 20 }, (_, i) => (
                      <option key={i} value={new Date().getFullYear() + i}>
                        {new Date().getFullYear() + i}
                      </option>
                    ))}
                  </select>
                  {formErrors.expiryYear && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.expiryYear}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CVC *
                  </label>
                  <input
                    type="text"
                    value={formData.cvc || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, cvc: e.target.value.replace(/\D/g, '') }))}
                    placeholder="123"
                    className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                      formErrors.cvc ? 'border-red-500' : ''
                    }`}
                    maxLength={4}
                  />
                  {formErrors.cvc && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.cvc}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {formData.type === 'bank_account' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Routing Number *
                </label>
                <input
                  type="text"
                  value={formData.routingNumber || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    routingNumber: e.target.value.replace(/\D/g, '').slice(0, 9) 
                  }))}
                  placeholder="123456789"
                  className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    formErrors.routingNumber ? 'border-red-500' : ''
                  }`}
                  maxLength={9}
                />
                {formErrors.routingNumber && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.routingNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Number *
                </label>
                <input
                  type="text"
                  value={formData.accountNumber || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                  placeholder="Enter account number"
                  className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    formErrors.accountNumber ? 'border-red-500' : ''
                  }`}
                />
                {formErrors.accountNumber && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.accountNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Type *
                </label>
                <select
                  value={formData.accountType || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountType: e.target.value as any }))}
                  className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    formErrors.accountType ? 'border-red-500' : ''
                  }`}
                >
                  <option value="">Select account type</option>
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                </select>
                {formErrors.accountType && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.accountType}</p>
                )}
              </div>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex">
              <Shield className="h-5 w-5 text-blue-400 mt-0.5" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Security Notice</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>Your payment information is encrypted and stored securely using PCI-compliant infrastructure. We never store your full card details or bank account information on our servers.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'Adding...' : 'Add Payment Method'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Payment Method Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedPaymentMethod(null);
        }}
        title="Payment Method Details"
        size="lg"
      >
        {selectedPaymentMethod && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Method Information</h3>
                <div className="space-y-2">
                  <p><strong>Type:</strong> {selectedPaymentMethod.type === 'card' ? 'Credit/Debit Card' : 'Bank Account'}</p>
                  <p><strong>ID:</strong> {selectedPaymentMethod.id}</p>
                  <p><strong>Stripe ID:</strong> {selectedPaymentMethod.stripePaymentMethodId}</p>
                  <p><strong>Created:</strong> {formatDate(selectedPaymentMethod.createdAt)}</p>
                  <p><strong>Updated:</strong> {formatDate(selectedPaymentMethod.updatedAt)}</p>
                  {selectedPaymentMethod.lastUsed && (
                    <p><strong>Last Used:</strong> {formatDate(selectedPaymentMethod.lastUsed)}</p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Status & Verification</h3>
                <div className="space-y-2">
                  <p><strong>Status:</strong> 
                    <Badge className={`ml-2 ${selectedPaymentMethod.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {selectedPaymentMethod.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </p>
                  <p><strong>Default:</strong> 
                    <Badge className="ml-2 bg-blue-100 text-blue-800">
                      {selectedPaymentMethod.isDefault ? 'Yes' : 'No'}
                    </Badge>
                  </p>
                  <p><strong>Verification:</strong> 
                    <Badge className={`ml-2 ${getVerificationStatusColor(selectedPaymentMethod.verificationStatus)}`}>
                      {selectedPaymentMethod.verificationStatus}
                    </Badge>
                  </p>
                  <p><strong>Failure Count:</strong> {selectedPaymentMethod.failureCount}</p>
                </div>
              </div>
            </div>

            {selectedPaymentMethod.type === 'card' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Card Details</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p><strong>Brand:</strong> {selectedPaymentMethod.brand?.toUpperCase()}</p>
                      <p><strong>Last 4:</strong> •••• {selectedPaymentMethod.last4}</p>
                    </div>
                    <div>
                      <p><strong>Expiry:</strong> {selectedPaymentMethod.expMonth}/{selectedPaymentMethod.expYear}</p>
                      <p><strong>Stripe ID:</strong> {selectedPaymentMethod.stripePaymentMethodId}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedPaymentMethod.type === 'bank_account' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Bank Account Details</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p><strong>Bank:</strong> {selectedPaymentMethod.bankName}</p>
                      <p><strong>Account Type:</strong> {selectedPaymentMethod.accountType?.toUpperCase()}</p>
                    </div>
                    <div>
                      <p><strong>Account:</strong> •••••{selectedPaymentMethod.last4}</p>
                      <p><strong>Routing:</strong> {selectedPaymentMethod.routingNumber}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PaymentMethodManagement;