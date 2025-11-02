import React, { useState, useEffect } from 'react';
import { CreditCard, Building2, Shield, Check, AlertCircle, Eye, EyeOff, Lock, Globe, FileText, UserCheck } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Modal } from '@/components/shared/Modal';
import { Badge } from '@/components/shared/Badge';
import { Progress } from '@/components/shared/Progress';

interface PaymentMethodSetupProps {
  customerId: string;
  customerName: string;
  onSuccess: (paymentMethodId: string) => void;
  onCancel: () => void;
}

interface SetupStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

interface FormData {
  methodType: 'card' | 'bank_account';
  // Card fields
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvc: string;
  cardholderName: string;
  // Bank account fields
  routingNumber: string;
  accountNumber: string;
  accountType: 'checking' | 'savings';
  accountOwnerName: string;
  // Verification
  verificationMethod: 'instant' | 'micro_deposit' | 'manual';
  // Consent
  privacyConsent: boolean;
  termsConsent: boolean;
  nachaConsent: boolean;
  autoDebitConsent: boolean;
}

const PaymentMethodSetup: React.FC<PaymentMethodSetupProps> = ({
  customerId,
  customerName,
  onSuccess,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    methodType: 'card',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvc: '',
    cardholderName: customerName,
    routingNumber: '',
    accountNumber: '',
    accountType: 'checking',
    accountOwnerName: customerName,
    verificationMethod: 'instant',
    privacyConsent: false,
    termsConsent: false,
    nachaConsent: false,
    autoDebitConsent: false,
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [microDepositAmounts, setMicroDepositAmounts] = useState({ amount1: '', amount2: '' });
  const [showCardNumber, setShowCardNumber] = useState(false);
  const [showAccountNumber, setShowAccountNumber] = useState(false);

  const steps: SetupStep[] = [
    {
      id: 'method-type',
      title: 'Choose Payment Method',
      description: 'Select card or bank account',
      completed: currentStep > 0,
    },
    {
      id: 'enter-details',
      title: 'Enter Payment Details',
      description: 'Provide payment method information',
      completed: currentStep > 1,
    },
    {
      id: 'verification',
      title: 'Verify Payment Method',
      description: 'Confirm account ownership',
      completed: currentStep > 2,
    },
    {
      id: 'consent',
      title: 'Legal Consent',
      description: 'Review and accept terms',
      completed: currentStep > 3,
    },
  ];

  const validateStep = (step: number): Record<string, string> => {
    const errors: Record<string, string> = {};

    switch (step) {
      case 0: // Method type
        if (!formData.methodType) {
          errors.methodType = 'Please select a payment method type';
        }
        break;

      case 1: // Payment details
        if (formData.methodType === 'card') {
          if (!formData.cardNumber.replace(/\s/g, '')) {
            errors.cardNumber = 'Card number is required';
          } else if (formData.cardNumber.replace(/\s/g, '').length < 15) {
            errors.cardNumber = 'Please enter a valid card number';
          }
          
          if (!formData.expiryMonth) {
            errors.expiryMonth = 'Expiry month is required';
          }
          
          if (!formData.expiryYear) {
            errors.expiryYear = 'Expiry year is required';
          }
          
          if (!formData.cvc) {
            errors.cvc = 'CVC is required';
          } else if (formData.cvc.length < 3) {
            errors.cvc = 'CVC must be at least 3 digits';
          }
          
          if (!formData.cardholderName.trim()) {
            errors.cardholderName = 'Cardholder name is required';
          }
        } else {
          if (!formData.routingNumber?.replace(/\s/g, '')) {
            errors.routingNumber = 'Routing number is required';
          } else if (formData.routingNumber.replace(/\s/g, '').length !== 9) {
            errors.routingNumber = 'Routing number must be 9 digits';
          }
          
          if (!formData.accountNumber) {
            errors.accountNumber = 'Account number is required';
          }
          
          if (!formData.accountType) {
            errors.accountType = 'Account type is required';
          }
          
          if (!formData.accountOwnerName.trim()) {
            errors.accountOwnerName = 'Account owner name is required';
          }
        }
        break;

      case 2: // Verification
        if (formData.methodType === 'bank_account' && formData.verificationMethod === 'micro_deposit') {
          if (!microDepositAmounts.amount1 || !microDepositAmounts.amount2) {
            errors.microDeposit = 'Please enter both micro-deposit amounts';
          }
        }
        break;

      case 3: // Consent
        if (!formData.privacyConsent) {
          errors.privacyConsent = 'Privacy policy consent is required';
        }
        if (!formData.termsConsent) {
          errors.termsConsent = 'Terms of service consent is required';
        }
        if (formData.methodType === 'bank_account' && !formData.nachaConsent) {
          errors.nachaConsent = 'NACHA authorization is required for bank accounts';
        }
        if (!formData.autoDebitConsent) {
          errors.autoDebitConsent = 'Auto-debit authorization is required';
        }
        break;
    }

    return errors;
  };

  const handleNext = () => {
    const errors = validateStep(currentStep);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setFormErrors({});
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    const errors = validateStep(currentStep);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});

    try {
      console.log('Setting up payment method:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate payment method ID
      const paymentMethodId = `pm_${Date.now()}`;
      
      // Simulate verification process for bank accounts
      if (formData.methodType === 'bank_account') {
        if (formData.verificationMethod === 'instant') {
          setVerificationStatus('success');
        } else if (formData.verificationMethod === 'micro_deposit') {
          // Simulate micro-deposit verification
          setTimeout(() => {
            if (parseFloat(microDepositAmounts.amount1) > 0 && parseFloat(microDepositAmounts.amount2) > 0) {
              setVerificationStatus('success');
            } else {
              setVerificationStatus('failed');
            }
          }, 2000);
        }
      }
      
      onSuccess(paymentMethodId);
    } catch (error) {
      console.error('Error setting up payment method:', error);
    } finally {
      setIsSubmitting(false);
    }
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

  const detectCardBrand = (cardNumber: string): string => {
    const number = cardNumber.replace(/\s/g, '');
    if (number.startsWith('4')) return 'visa';
    if (number.startsWith('5')) return 'mastercard';
    if (number.startsWith('3')) return 'amex';
    if (number.startsWith('6')) return 'discover';
    return 'unknown';
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Payment Method</h2>
              <p className="text-gray-600">Select how you'd like to receive payments</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className={`border-2 rounded-lg p-6 cursor-pointer transition-colors ${
                  formData.methodType === 'card'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setFormData(prev => ({ ...prev, methodType: 'card' }))}
              >
                <div className="flex items-center mb-4">
                  <CreditCard className="h-8 w-8 text-blue-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">Credit/Debit Card</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Instant setup
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    No verification required
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    PCI compliant
                  </li>
                  <li className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-yellow-500 mr-2" />
                    Processing fees apply
                  </li>
                </ul>
              </div>

              <div
                className={`border-2 rounded-lg p-6 cursor-pointer transition-colors ${
                  formData.methodType === 'bank_account'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setFormData(prev => ({ ...prev, methodType: 'bank_account' }))}
              >
                <div className="flex items-center mb-4">
                  <Building2 className="h-8 w-8 text-green-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">Bank Account</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Lower processing fees
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    ACH direct debit
                  </li>
                  <li className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-yellow-500 mr-2" />
                    Verification required
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Bank-level security
                  </li>
                </ul>
              </div>
            </div>

            {formErrors.methodType && (
              <p className="text-red-600 text-sm">{formErrors.methodType}</p>
            )}
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Enter Payment Details</h2>
              <p className="text-gray-600">Provide your {formData.methodType === 'card' ? 'card' : 'bank account'} information</p>
            </div>

            {formData.methodType === 'card' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Card Number *
                  </label>
                  <div className="relative">
                    <Input
                      type={showCardNumber ? 'text' : 'password'}
                      value={formData.cardNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, cardNumber: formatCardNumber(e.target.value) }))}
                      placeholder="1234 5678 9012 3456"
                      className={formErrors.cardNumber ? 'border-red-500 pr-10' : 'pr-10'}
                      maxLength={19}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCardNumber(!showCardNumber)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCardNumber ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
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
                      value={formData.expiryMonth}
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
                      value={formData.expiryYear}
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
                    <Input
                      type="text"
                      value={formData.cvc}
                      onChange={(e) => setFormData(prev => ({ ...prev, cvc: e.target.value.replace(/\D/g, '') }))}
                      placeholder="123"
                      className={formErrors.cvc ? 'border-red-500' : ''}
                      maxLength={4}
                    />
                    {formErrors.cvc && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.cvc}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cardholder Name *
                  </label>
                  <Input
                    type="text"
                    value={formData.cardholderName}
                    onChange={(e) => setFormData(prev => ({ ...prev, cardholderName: e.target.value }))}
                    placeholder="Enter name as it appears on card"
                    className={formErrors.cardholderName ? 'border-red-500' : ''}
                  />
                  {formErrors.cardholderName && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.cardholderName}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex">
                    <Building2 className="h-5 w-5 text-blue-400 mt-0.5" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">Secure Bank Connection</h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>Connect your bank account securely using our partner's encrypted connection. Your banking credentials are never stored on our servers.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Routing Number *
                  </label>
                  <Input
                    type="text"
                    value={formData.routingNumber}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      routingNumber: e.target.value.replace(/\D/g, '').slice(0, 9) 
                    }))}
                    placeholder="123456789"
                    className={formErrors.routingNumber ? 'border-red-500' : ''}
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
                  <div className="relative">
                    <Input
                      type={showAccountNumber ? 'text' : 'password'}
                      value={formData.accountNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                      placeholder="Enter account number"
                      className={formErrors.accountNumber ? 'border-red-500 pr-10' : 'pr-10'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowAccountNumber(!showAccountNumber)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showAccountNumber ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {formErrors.accountNumber && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.accountNumber}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Type *
                  </label>
                  <select
                    value={formData.accountType}
                    onChange={(e) => setFormData(prev => ({ ...prev, accountType: e.target.value as any }))}
                    className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                      formErrors.accountType ? 'border-red-500' : ''
                    }`}
                  >
                    <option value="">Select account type</option>
                    <option value="checking">Checking Account</option>
                    <option value="savings">Savings Account</option>
                  </select>
                  {formErrors.accountType && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.accountType}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Owner Name *
                  </label>
                  <Input
                    type="text"
                    value={formData.accountOwnerName}
                    onChange={(e) => setFormData(prev => ({ ...prev, accountOwnerName: e.target.value }))}
                    placeholder="Enter account owner name"
                    className={formErrors.accountOwnerName ? 'border-red-500' : ''}
                  />
                  {formErrors.accountOwnerName && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.accountOwnerName}</p>
                  )}
                </div>
              </div>
            )}

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Shield className="h-5 w-5 text-gray-400 mr-2" />
                <h4 className="text-sm font-medium text-gray-900">Security Guarantee</h4>
              </div>
              <p className="text-sm text-gray-600">
                Your payment information is encrypted using 256-bit SSL encryption and stored in PCI DSS compliant data centers. We never store your full card details or banking credentials.
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Payment Method</h2>
              <p className="text-gray-600">Confirm ownership of your {formData.methodType === 'card' ? 'card' : 'bank account'}</p>
            </div>

            {formData.methodType === 'bank_account' ? (
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">Account Verification Required</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>For security reasons, we need to verify your bank account ownership before enabling payments.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Verification Method</h3>
                  <div className="space-y-4">
                    <label className="flex items-start">
                      <input
                        type="radio"
                        value="instant"
                        checked={formData.verificationMethod === 'instant'}
                        onChange={(e) => setFormData(prev => ({ ...prev, verificationMethod: e.target.value as any }))}
                        className="mt-1 mr-3"
                      />
                      <div>
                        <div className="font-medium text-gray-900">Instant Verification</div>
                        <div className="text-sm text-gray-600">Verify instantly through secure bank connection (recommended)</div>
                        <div className="text-xs text-green-600 mt-1">✓ Fastest • No delay</div>
                      </div>
                    </label>

                    <label className="flex items-start">
                      <input
                        type="radio"
                        value="micro_deposit"
                        checked={formData.verificationMethod === 'micro_deposit'}
                        onChange={(e) => setFormData(prev => ({ ...prev, verificationMethod: e.target.value as any }))}
                        className="mt-1 mr-3"
                      />
                      <div>
                        <div className="font-medium text-gray-900">Micro-deposit Verification</div>
                        <div className="text-sm text-gray-600">Verify by confirming two small deposits (1-3 business days)</div>
                        <div className="text-xs text-yellow-600 mt-1">⚠ 1-3 business days</div>
                      </div>
                    </label>

                    <label className="flex items-start">
                      <input
                        type="radio"
                        value="manual"
                        checked={formData.verificationMethod === 'manual'}
                        onChange={(e) => setFormData(prev => ({ ...prev, verificationMethod: e.target.value as any }))}
                        className="mt-1 mr-3"
                      />
                      <div>
                        <div className="font-medium text-gray-900">Manual Verification</div>
                        <div className="text-sm text-gray-600">Submit documentation for manual review (3-5 business days)</div>
                        <div className="text-xs text-red-600 mt-1">⚠ 3-5 business days</div>
                      </div>
                    </label>
                  </div>
                </div>

                {formData.verificationMethod === 'micro_deposit' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Micro-deposit Verification</h4>
                    <p className="text-sm text-blue-800 mb-3">
                      We will send two small deposits (typically $0.32 and $0.45) to your bank account. 
                      Check your bank statement and enter the amounts below to verify ownership.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-blue-900 mb-1">
                          First deposit amount
                        </label>
                        <Input
                          type="text"
                          value={microDepositAmounts.amount1}
                          onChange={(e) => setMicroDepositAmounts(prev => ({
                            ...prev,
                            amount1: e.target.value
                          }))}
                          placeholder="$0.32"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-blue-900 mb-1">
                          Second deposit amount
                        </label>
                        <Input
                          type="text"
                          value={microDepositAmounts.amount2}
                          onChange={(e) => setMicroDepositAmounts(prev => ({
                            ...prev,
                            amount2: e.target.value
                          }))}
                          placeholder="$0.45"
                        />
                      </div>
                    </div>
                    {formErrors.microDeposit && (
                      <p className="mt-2 text-sm text-red-600">{formErrors.microDeposit}</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex">
                  <Check className="h-5 w-5 text-green-400 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Card Verification</h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>Your card will be verified automatically through the card network. No additional steps required.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Legal Consent</h2>
              <p className="text-gray-600">Review and accept the following terms and conditions</p>
            </div>

            <div className="space-y-6">
              {/* Privacy Policy */}
              <div className="border rounded-lg p-4">
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={formData.privacyConsent}
                    onChange={(e) => setFormData(prev => ({ ...prev, privacyConsent: e.target.checked }))}
                    className="mt-1 mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Privacy Policy Consent *</div>
                    <div className="text-sm text-gray-600 mt-1">
                      I have read and agree to the <a href="#" className="text-blue-600 hover:text-blue-800">Privacy Policy</a> and 
                      understand how my personal and payment information will be collected, used, and protected.
                    </div>
                    {formErrors.privacyConsent && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.privacyConsent}</p>
                    )}
                  </div>
                </label>
              </div>

              {/* Terms of Service */}
              <div className="border rounded-lg p-4">
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={formData.termsConsent}
                    onChange={(e) => setFormData(prev => ({ ...prev, termsConsent: e.target.checked }))}
                    className="mt-1 mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Terms of Service Consent *</div>
                    <div className="text-sm text-gray-600 mt-1">
                      I agree to the <a href="#" className="text-blue-600 hover:text-blue-800">Terms of Service</a> and 
                      understand the payment processing terms, fees, and dispute resolution procedures.
                    </div>
                    {formErrors.termsConsent && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.termsConsent}</p>
                    )}
                  </div>
                </label>
              </div>

              {/* NACHA Authorization (for bank accounts) */}
              {formData.methodType === 'bank_account' && (
                <div className="border rounded-lg p-4 bg-blue-50">
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      checked={formData.nachaConsent}
                      onChange={(e) => setFormData(prev => ({ ...prev, nachaConsent: e.target.checked }))}
                      className="mt-1 mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">NACHA Authorization *</div>
                      <div className="text-sm text-gray-600 mt-1">
                        I authorize ORACLE-LEDGER to initiate ACH debit entries from my bank account for payment processing. 
                        I understand this authorization will remain in effect until I provide written notice of cancellation.
                        <br /><br />
                        <strong>Rights and Liabilities:</strong> I understand that I have certain rights regarding ACH transactions 
                        and may dispute unauthorized transactions within 60 days of the transaction date.
                      </div>
                      {formErrors.nachaConsent && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.nachaConsent}</p>
                      )}
                    </div>
                  </label>
                </div>
              )}

              {/* Auto-debit Authorization */}
              <div className="border rounded-lg p-4">
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={formData.autoDebitConsent}
                    onChange={(e) => setFormData(prev => ({ ...prev, autoDebitConsent: e.target.checked }))}
                    className="mt-1 mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Automatic Payment Authorization *</div>
                    <div className="text-sm text-gray-600 mt-1">
                      I authorize ORACLE-LEDGER to automatically process payments using this payment method when payments are due. 
                      I can cancel this authorization at any time through my account settings.
                      <br /><br />
                      <strong>Notification:</strong> I will receive email notifications before any automatic payments are processed.
                    </div>
                    {formErrors.autoDebitConsent && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.autoDebitConsent}</p>
                    )}
                  </div>
                </label>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Lock className="h-5 w-5 text-gray-400 mr-2" />
                <h4 className="text-sm font-medium text-gray-900">Compliance & Security</h4>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• PCI DSS Level 1 compliant payment processing</li>
                <li>• 256-bit SSL encryption for all data transmission</li>
                <li>• NACHA-compliant ACH processing</li>
                <li>• SOC 2 Type II certified infrastructure</li>
                <li>• Regular security audits and penetration testing</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                index <= currentStep
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {step.completed ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              <div className="ml-3 hidden sm:block">
                <div className={`text-sm font-medium ${
                  index <= currentStep ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </div>
                <div className="text-xs text-gray-500">{step.description}</div>
              </div>
              {index < steps.length - 1 && (
                <div className={`hidden sm:block w-12 h-0.5 ml-4 ${
                  index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-4">
          <Progress 
            value={(currentStep / (steps.length - 1)) * 100} 
            className="h-2"
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0}
        >
          Back
        </Button>
        
        {currentStep < steps.length - 1 ? (
          <Button
            onClick={handleNext}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? 'Setting up...' : 'Complete Setup'}
          </Button>
        )}
      </div>

      {/* Verification Status (for micro-deposit) */}
      {formData.methodType === 'bank_account' && 
       formData.verificationMethod === 'micro_deposit' && 
       currentStep === 2 && 
       verificationStatus !== 'pending' && (
        <div className="mt-6">
          <div className={`border rounded-lg p-4 ${
            verificationStatus === 'success' 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center">
              {verificationStatus === 'success' ? (
                <Check className="h-5 w-5 text-green-400 mr-2" />
              ) : (
                <X className="h-5 w-5 text-red-400 mr-2" />
              )}
              <div>
                <div className={`font-medium ${
                  verificationStatus === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {verificationStatus === 'success' 
                    ? 'Verification Successful!' 
                    : 'Verification Failed'
                  }
                </div>
                <div className={`text-sm mt-1 ${
                  verificationStatus === 'success' ? 'text-green-700' : 'text-red-700'
                }`}>
                  {verificationStatus === 'success'
                    ? 'Your bank account has been verified and is ready to use.'
                    : 'The amounts entered do not match our micro-deposits. Please check your bank statement and try again.'
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodSetup;