import React, { useState, useEffect } from 'react';
import type { AchPayment, StripeCustomer, StripePaymentMethod, BankAccount } from '../../types';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

interface AchPaymentFormData {
  customerId?: string;
  newCustomer?: Customer;
  paymentMethodId?: string;
  bankAccount?: {
    routingNumber: string;
    accountNumber: string;
    accountType: 'checking' | 'savings';
    bankName?: string;
  };
  amount: number;
  description: string;
  achClassCode: 'PPD' | 'CCD' | 'WEB' | 'CBP';
  scheduledDate?: string;
  immediateProcessing: boolean;
}

interface AchPaymentFormProps {
  onSubmit: (payment: AchPaymentFormData) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<AchPaymentFormData>;
  isLoading?: boolean;
}

const ACH_CLASS_CODES = {
  PPD: 'Prearranged Payment and Deposit Entry',
  CCD: 'Corporate Credit or Debit Entry',
  WEB: 'Internet Initiated Entry',
  CBP: 'International Credit Entry'
};

export const AchPaymentForm: React.FC<AchPaymentFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<AchPaymentFormData>({
    customerId: initialData?.customerId || '',
    amount: initialData?.amount || 0,
    description: initialData?.description || '',
    achClassCode: initialData?.achClassCode || 'WEB',
    immediateProcessing: initialData?.immediateProcessing !== false,
    scheduledDate: initialData?.scheduledDate,
    bankAccount: initialData?.bankAccount,
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [existingPaymentMethods, setExistingPaymentMethods] = useState<StripePaymentMethod[]>([]);
  const [useExistingCustomer, setUseExistingCustomer] = useState(true);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load customers and payment methods
  useEffect(() => {
    loadCustomers();
    loadPaymentMethods();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const response = await fetch('/api/payment-methods?type=us_bank_account');
      if (response.ok) {
        const data = await response.json();
        setExistingPaymentMethods(data);
      }
    } catch (error) {
      console.error('Failed to load payment methods:', error);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Customer validation
    if (useExistingCustomer && !formData.customerId) {
      errors.customerId = 'Please select a customer';
    } else if (!useExistingCustomer && showNewCustomerForm) {
      const newCustomer = formData.newCustomer;
      if (!newCustomer?.firstName) errors.firstName = 'First name is required';
      if (!newCustomer?.lastName) errors.lastName = 'Last name is required';
      if (!newCustomer?.email) errors.email = 'Email is required';
    }

    // Payment method validation
    if (!formData.paymentMethodId && !formData.bankAccount?.routingNumber) {
      errors.paymentMethodId = 'Please select an existing payment method or enter bank account details';
    }

    // Amount validation
    if (!formData.amount || formData.amount <= 0) {
      errors.amount = 'Amount must be greater than 0';
    }

    // ACH Class Code validation
    if (!formData.achClassCode) {
      errors.achClassCode = 'ACH Class Code is required';
    }

    // Scheduled date validation
    if (!formData.immediateProcessing && !formData.scheduledDate) {
      errors.scheduledDate = 'Scheduled date is required for non-immediate payments';
    }

    // Bank account validation
    if (formData.bankAccount?.routingNumber) {
      if (!/^\d{9}$/.test(formData.bankAccount.routingNumber)) {
        errors.routingNumber = 'Routing number must be exactly 9 digits';
      }
      if (!/^\d{4,17}$/.test(formData.bankAccount.accountNumber)) {
        errors.accountNumber = 'Account number must be between 4-17 digits';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Payment submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof AchPaymentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error when field is changed
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleNewCustomerChange = (field: keyof Customer, value: string) => {
    setFormData(prev => ({
      ...prev,
      newCustomer: {
        ...prev.newCustomer,
        [field]: value
      } as Customer
    }));
  };

  const handleBankAccountChange = (field: keyof BankAccount, value: string) => {
    setFormData(prev => ({
      ...prev,
      bankAccount: {
        ...prev.bankAccount,
        [field]: value
      } as BankAccount
    }));
  };

  const maskAccountNumber = (accountNumber: string): string => {
    if (accountNumber.length <= 4) return accountNumber;
    return '****' + accountNumber.slice(-4);
  };

  return (
    <div className="bg-sov-dark-alt rounded-lg shadow-xl border border-gray-700 p-6">
      <h2 className="text-2xl font-bold text-sov-light mb-6">ACH Payment Form</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-sov-light-alt">Customer Information</h3>
          
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                checked={useExistingCustomer}
                onChange={() => {
                  setUseExistingCustomer(true);
                  setShowNewCustomerForm(false);
                }}
                className="mr-2 text-sov-accent"
              />
              <span className="text-sov-light">Existing Customer</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                checked={!useExistingCustomer}
                onChange={() => {
                  setUseExistingCustomer(false);
                  setShowNewCustomerForm(true);
                }}
                className="mr-2 text-sov-accent"
              />
              <span className="text-sov-light">New Customer</span>
            </label>
          </div>

          {useExistingCustomer ? (
            <div>
              <label className="block text-sov-light-alt text-sm font-medium mb-2">
                Select Customer
              </label>
              <select
                value={formData.customerId}
                onChange={(e) => handleInputChange('customerId', e.target.value)}
                className="w-full px-3 py-2 bg-sov-dark border border-gray-600 rounded-md text-sov-light focus:outline-none focus:ring-2 focus:ring-sov-accent"
                required
              >
                <option value="">Choose a customer...</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.firstName} {customer.lastName} - {customer.email}
                  </option>
                ))}
              </select>
              {validationErrors.customerId && (
                <p className="text-sov-red text-sm mt-1">{validationErrors.customerId}</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sov-light-alt text-sm font-medium mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.newCustomer?.firstName || ''}
                  onChange={(e) => handleNewCustomerChange('firstName', e.target.value)}
                  className="w-full px-3 py-2 bg-sov-dark border border-gray-600 rounded-md text-sov-light focus:outline-none focus:ring-2 focus:ring-sov-accent"
                  required
                />
                {validationErrors.firstName && (
                  <p className="text-sov-red text-sm mt-1">{validationErrors.firstName}</p>
                )}
              </div>
              <div>
                <label className="block text-sov-light-alt text-sm font-medium mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.newCustomer?.lastName || ''}
                  onChange={(e) => handleNewCustomerChange('lastName', e.target.value)}
                  className="w-full px-3 py-2 bg-sov-dark border border-gray-600 rounded-md text-sov-light focus:outline-none focus:ring-2 focus:ring-sov-accent"
                  required
                />
                {validationErrors.lastName && (
                  <p className="text-sov-red text-sm mt-1">{validationErrors.lastName}</p>
                )}
              </div>
              <div>
                <label className="block text-sov-light-alt text-sm font-medium mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.newCustomer?.email || ''}
                  onChange={(e) => handleNewCustomerChange('email', e.target.value)}
                  className="w-full px-3 py-2 bg-sov-dark border border-gray-600 rounded-md text-sov-light focus:outline-none focus:ring-2 focus:ring-sov-accent"
                  required
                />
                {validationErrors.email && (
                  <p className="text-sov-red text-sm mt-1">{validationErrors.email}</p>
                )}
              </div>
              <div>
                <label className="block text-sov-light-alt text-sm font-medium mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.newCustomer?.phone || ''}
                  onChange={(e) => handleNewCustomerChange('phone', e.target.value)}
                  className="w-full px-3 py-2 bg-sov-dark border border-gray-600 rounded-md text-sov-light focus:outline-none focus:ring-2 focus:ring-sov-accent"
                />
              </div>
            </div>
          )}
        </div>

        {/* Payment Method Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-sov-light-alt">Payment Method</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sov-light-alt text-sm font-medium mb-2">
                Existing Bank Account
              </label>
              <select
                value={formData.paymentMethodId || ''}
                onChange={(e) => handleInputChange('paymentMethodId', e.target.value)}
                className="w-full px-3 py-2 bg-sov-dark border border-gray-600 rounded-md text-sov-light focus:outline-none focus:ring-2 focus:ring-sov-accent"
              >
                <option value="">Choose an existing bank account...</option>
                {existingPaymentMethods
                  .filter(pm => pm.type === 'us_bank_account')
                  .map((paymentMethod) => (
                    <option key={paymentMethod.id} value={paymentMethod.id}>
                      {paymentMethod.bankName} - ****{paymentMethod.bankAccountLast4} ({paymentMethod.bankAccountType})
                    </option>
                  ))}
              </select>
            </div>

            <div className="text-center text-sov-light-alt">OR</div>

            <div className="border-t border-gray-700 pt-4">
              <h4 className="text-md font-medium text-sov-light mb-3">Enter New Bank Account</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sov-light-alt text-sm font-medium mb-2">
                    Routing Number *
                  </label>
                  <input
                    type="text"
                    value={formData.bankAccount?.routingNumber || ''}
                    onChange={(e) => handleBankAccountChange('routingNumber', e.target.value.replace(/\D/g, ''))}
                    maxLength={9}
                    className="w-full px-3 py-2 bg-sov-dark border border-gray-600 rounded-md text-sov-light focus:outline-none focus:ring-2 focus:ring-sov-accent"
                    placeholder="123456789"
                  />
                  {validationErrors.routingNumber && (
                    <p className="text-sov-red text-sm mt-1">{validationErrors.routingNumber}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sov-light-alt text-sm font-medium mb-2">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    value={formData.bankAccount?.accountNumber || ''}
                    onChange={(e) => handleBankAccountChange('accountNumber', e.target.value.replace(/\D/g, ''))}
                    maxLength={17}
                    className="w-full px-3 py-2 bg-sov-dark border border-gray-600 rounded-md text-sov-light focus:outline-none focus:ring-2 focus:ring-sov-accent"
                    placeholder="Account number"
                  />
                  {validationErrors.accountNumber && (
                    <p className="text-sov-red text-sm mt-1">{validationErrors.accountNumber}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sov-light-alt text-sm font-medium mb-2">
                    Account Type *
                  </label>
                  <select
                    value={formData.bankAccount?.accountType || 'checking'}
                    onChange={(e) => handleBankAccountChange('accountType', e.target.value as 'checking' | 'savings')}
                    className="w-full px-3 py-2 bg-sov-dark border border-gray-600 rounded-md text-sov-light focus:outline-none focus:ring-2 focus:ring-sov-accent"
                  >
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sov-light-alt text-sm font-medium mb-2">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={formData.bankAccount?.bankName || ''}
                    onChange={(e) => handleBankAccountChange('bankName', e.target.value)}
                    className="w-full px-3 py-2 bg-sov-dark border border-gray-600 rounded-md text-sov-light focus:outline-none focus:ring-2 focus:ring-sov-accent"
                    placeholder="Bank name"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-sov-light-alt">Payment Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sov-light-alt text-sm font-medium mb-2">
                Amount (USD) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-sov-dark border border-gray-600 rounded-md text-sov-light focus:outline-none focus:ring-2 focus:ring-sov-accent"
                placeholder="0.00"
                required
              />
              {validationErrors.amount && (
                <p className="text-sov-red text-sm mt-1">{validationErrors.amount}</p>
              )}
            </div>

            <div>
              <label className="block text-sov-light-alt text-sm font-medium mb-2">
                ACH Class Code *
              </label>
              <select
                value={formData.achClassCode}
                onChange={(e) => handleInputChange('achClassCode', e.target.value as 'PPD' | 'CCD' | 'WEB' | 'CBP')}
                className="w-full px-3 py-2 bg-sov-dark border border-gray-600 rounded-md text-sov-light focus:outline-none focus:ring-2 focus:ring-sov-accent"
                required
              >
                {Object.entries(ACH_CLASS_CODES).map(([code, description]) => (
                  <option key={code} value={code}>
                    {code} - {description}
                  </option>
                ))}
              </select>
              {validationErrors.achClassCode && (
                <p className="text-sov-red text-sm mt-1">{validationErrors.achClassCode}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sov-light-alt text-sm font-medium mb-2">
              Payment Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-sov-dark border border-gray-600 rounded-md text-sov-light focus:outline-none focus:ring-2 focus:ring-sov-accent"
              placeholder="Description for this payment..."
            />
          </div>
        </div>

        {/* Scheduling */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-sov-light-alt">Processing Options</h3>
          
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="radio"
                checked={formData.immediateProcessing}
                onChange={() => handleInputChange('immediateProcessing', true)}
                className="mr-2 text-sov-accent"
              />
              <span className="text-sov-light">Process immediately</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="radio"
                checked={!formData.immediateProcessing}
                onChange={() => handleInputChange('immediateProcessing', false)}
                className="mr-2 text-sov-accent"
              />
              <span className="text-sov-light">Schedule for later</span>
            </label>

            {!formData.immediateProcessing && (
              <div>
                <label className="block text-sov-light-alt text-sm font-medium mb-2">
                  Scheduled Date *
                </label>
                <input
                  type="date"
                  value={formData.scheduledDate || ''}
                  onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 bg-sov-dark border border-gray-600 rounded-md text-sov-light focus:outline-none focus:ring-2 focus:ring-sov-accent"
                />
                {validationErrors.scheduledDate && (
                  <p className="text-sov-red text-sm mt-1">{validationErrors.scheduledDate}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-sov-accent/10 border border-sov-accent/30 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-sov-accent mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="text-sov-accent font-medium">Security Information</h4>
              <p className="text-sov-light-alt text-sm mt-1">
                Bank account information is encrypted and securely processed. ACH payments typically take 3-5 business days to settle.
              </p>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting || isLoading}
              className="px-6 py-2 text-sov-light-alt border border-gray-600 rounded-md hover:bg-sov-dark focus:outline-none focus:ring-2 focus:ring-sov-accent disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="px-6 py-2 bg-sov-accent text-white rounded-md hover:bg-sov-accent/90 focus:outline-none focus:ring-2 focus:ring-sov-accent disabled:opacity-50 flex items-center"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </>
            ) : (
              'Submit Payment'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};