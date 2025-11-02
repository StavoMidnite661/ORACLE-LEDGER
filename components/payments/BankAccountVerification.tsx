import React, { useState, useEffect } from 'react';
import type { StripePaymentMethod } from '../../types';

interface VerificationMethod {
  type: 'instant' | 'micro_deposit';
  name: string;
  description: string;
  processingTime: string;
  requirements?: string[];
}

interface BankAccountVerificationProps {
  bankAccountData: {
    routingNumber: string;
    accountNumber: string;
    accountType: 'checking' | 'savings';
    bankName?: string;
  };
  customerId?: string;
  onVerificationComplete: (verificationResult: {
    verified: boolean;
    verificationMethod: string;
    paymentMethodId?: string;
    error?: string;
  }) => void;
  onCancel?: () => void;
}

interface VerificationState {
  status: 'idle' | 'processing' | 'completed' | 'failed';
  progress: number;
  message?: string;
  verificationMethod?: string;
  paymentMethodId?: string;
  error?: string;
}

const VERIFICATION_METHODS: VerificationMethod[] = [
  {
    type: 'instant',
    name: 'Instant Verification',
    description: 'Verify bank account information in real-time using secure database lookup',
    processingTime: 'Instant',
    requirements: [
      'Bank must participate in instant verification network',
      'Bank account must be in good standing',
      'Valid routing and account numbers'
    ]
  },
  {
    type: 'micro_deposit',
    name: 'Micro-Deposit Verification',
    description: 'Small deposits sent to verify account ownership (2-3 business days)',
    processingTime: '2-3 business days',
    requirements: [
      'Requires access to bank account statements',
      'Customer must confirm small deposit amounts',
      'Longer processing time'
    ]
  }
];

export const BankAccountVerification: React.FC<BankAccountVerificationProps> = ({
  bankAccountData,
  customerId,
  onVerificationComplete,
  onCancel
}) => {
  const [selectedMethod, setSelectedMethod] = useState<VerificationMethod | null>(null);
  const [verificationState, setVerificationState] = useState<VerificationState>({
    status: 'idle',
    progress: 0
  });
  const [microDepositAmounts, setMicroDepositAmounts] = useState({
    first: '',
    second: ''
  });
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleMethodSelect = (method: VerificationMethod) => {
    setSelectedMethod(method);
    setVerificationState({
      status: 'idle',
      progress: 0
    });
  };

  const startInstantVerification = async () => {
    if (!selectedMethod || selectedMethod.type !== 'instant') return;

    setVerificationState({
      status: 'processing',
      progress: 25,
      message: 'Connecting to bank verification network...'
    });

    try {
      // Simulate verification progress
      await new Promise(resolve => setTimeout(resolve, 1000));
      setVerificationState(prev => ({
        ...prev,
        progress: 50,
        message: 'Validating bank account information...'
      }));

      await new Promise(resolve => setTimeout(resolve, 1500));
      setVerificationState(prev => ({
        ...prev,
        progress: 75,
        message: 'Confirming account details...'
      }));

      // Make API call to verify account
      const response = await fetch('/api/payment-methods/verify-instant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routingNumber: bankAccountData.routingNumber,
          accountNumber: bankAccountData.accountNumber,
          accountType: bankAccountData.accountType,
          bankName: bankAccountData.bankName,
          customerId
        })
      });

      if (!response.ok) {
        throw new Error('Verification failed');
      }

      const result = await response.json();

      setVerificationState({
        status: 'completed',
        progress: 100,
        message: 'Account verified successfully!',
        verificationMethod: 'instant',
        paymentMethodId: result.paymentMethodId
      });

      setTimeout(() => {
        onVerificationComplete({
          verified: true,
          verificationMethod: 'instant',
          paymentMethodId: result.paymentMethodId
        });
      }, 1500);

    } catch (error) {
      setVerificationState({
        status: 'failed',
        progress: 0,
        error: error instanceof Error ? error.message : 'Verification failed',
        verificationMethod: 'instant'
      });
    }
  };

  const startMicroDepositVerification = async () => {
    if (!selectedMethod || selectedMethod.type !== 'micro_deposit') return;

    setVerificationState({
      status: 'processing',
      progress: 25,
      message: 'Initiating micro-deposit verification...'
    });

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setVerificationState(prev => ({
        ...prev,
        progress: 50,
        message: 'Sending micro-deposits to account...'
      }));

      // Make API call to initiate micro-deposit verification
      const response = await fetch('/api/payment-methods/verify-micro-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routingNumber: bankAccountData.routingNumber,
          accountNumber: bankAccountData.accountNumber,
          accountType: bankAccountData.accountType,
          bankName: bankAccountData.bankName,
          customerId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to initiate micro-deposit verification');
      }

      const result = await response.json();

      setVerificationState({
        status: 'completed',
        progress: 100,
        message: 'Micro-deposits sent! Check your account in 2-3 business days.',
        verificationMethod: 'micro_deposit',
        paymentMethodId: result.paymentMethodId
      });

    } catch (error) {
      setVerificationState({
        status: 'failed',
        progress: 0,
        error: error instanceof Error ? error.message : 'Failed to initiate micro-deposit verification',
        verificationMethod: 'micro_deposit'
      });
    }
  };

  const confirmMicroDeposits = async () => {
    const amounts = microDepositAmounts.first && microDepositAmounts.second 
      ? [parseFloat(microDepositAmounts.first), parseFloat(microDepositAmounts.second)]
      : [];

    if (amounts.some(amount => isNaN(amount) || amount <= 0)) {
      alert('Please enter valid deposit amounts');
      return;
    }

    setVerificationState({
      status: 'processing',
      progress: 50,
      message: 'Confirming micro-deposit amounts...'
    });

    try {
      const response = await fetch('/api/payment-methods/confirm-micro-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethodId: verificationState.paymentMethodId,
          depositAmounts: amounts
        })
      });

      if (!response.ok) {
        throw new Error('Deposit confirmation failed');
      }

      const result = await response.json();

      setVerificationState({
        status: 'completed',
        progress: 100,
        message: 'Account verified successfully!',
        verificationMethod: 'micro_deposit'
      });

      setTimeout(() => {
        onVerificationComplete({
          verified: true,
          verificationMethod: 'micro_deposit',
          paymentMethodId: verificationState.paymentMethodId
        });
      }, 1500);

    } catch (error) {
      setVerificationState({
        status: 'failed',
        progress: 0,
        error: error instanceof Error ? error.message : 'Deposit confirmation failed'
      });
    }
  };

  const retryVerification = () => {
    setVerificationState({
      status: 'idle',
      progress: 0
    });
    setShowConfirmation(false);
    setMicroDepositAmounts({ first: '', second: '' });
  };

  const formatAccountNumber = (accountNumber: string): string => {
    if (accountNumber.length <= 4) return accountNumber;
    return '****' + accountNumber.slice(-4);
  };

  const getVerificationStatus = () => {
    if (verificationState.status === 'idle') return 'Not Started';
    if (verificationState.status === 'processing') return 'Processing...';
    if (verificationState.status === 'completed') return 'Verified';
    if (verificationState.status === 'failed') return 'Failed';
    return 'Unknown';
  };

  const getStatusColor = () => {
    switch (verificationState.status) {
      case 'idle': return 'text-sov-light-alt';
      case 'processing': return 'text-sov-accent';
      case 'completed': return 'text-sov-green';
      case 'failed': return 'text-sov-red';
      default: return 'text-sov-light-alt';
    }
  };

  return (
    <div className="bg-sov-dark-alt rounded-lg shadow-xl border border-gray-700 p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-sov-light mb-2">Bank Account Verification</h2>
        <p className="text-sov-light-alt">
          Verify bank account ownership using one of the methods below.
        </p>
      </div>

      {/* Account Summary */}
      <div className="bg-sov-dark rounded-lg p-4 mb-6 border border-gray-600">
        <h3 className="text-lg font-semibold text-sov-light mb-3">Account Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-sov-light-alt">Bank:</span>
            <span className="text-sov-light ml-2">{bankAccountData.bankName || 'Unknown Bank'}</span>
          </div>
          <div>
            <span className="text-sov-light-alt">Account:</span>
            <span className="text-sov-light ml-2">{formatAccountNumber(bankAccountData.accountNumber)}</span>
          </div>
          <div>
            <span className="text-sov-light-alt">Routing:</span>
            <span className="text-sov-light ml-2">***{bankAccountData.routingNumber.slice(-3)}</span>
          </div>
          <div>
            <span className="text-sov-light-alt">Type:</span>
            <span className="text-sov-light ml-2 capitalize">{bankAccountData.accountType}</span>
          </div>
        </div>
      </div>

      {/* Verification Methods */}
      {verificationState.status === 'idle' && (
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-semibold text-sov-light">Choose Verification Method</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {VERIFICATION_METHODS.map((method) => (
              <div
                key={method.type}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedMethod?.type === method.type
                    ? 'border-sov-accent bg-sov-accent/5'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
                onClick={() => handleMethodSelect(method)}
              >
                <div className="flex items-start space-x-3">
                  <input
                    type="radio"
                    checked={selectedMethod?.type === method.type}
                    onChange={() => handleMethodSelect(method)}
                    className="mt-1 text-sov-accent"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-sov-light">{method.name}</h4>
                    <p className="text-sov-light-alt text-sm mt-1">{method.description}</p>
                    <div className="flex items-center mt-2">
                      <svg className="w-4 h-4 text-sov-green mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sov-green text-sm font-medium">Processing: {method.processingTime}</span>
                    </div>
                    {method.requirements && (
                      <ul className="mt-2 text-xs text-sov-light-alt">
                        {method.requirements.map((req, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-1">•</span>
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verification Progress */}
      {(verificationState.status === 'processing' || verificationState.status === 'completed' || verificationState.status === 'failed') && (
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-sov-light">Verification Status</h3>
            <span className={`font-medium ${getStatusColor()}`}>
              {getVerificationStatus()}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-sov-dark rounded-full h-3 border border-gray-600">
            <div
              className="bg-sov-accent h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${verificationState.progress}%` }}
            />
          </div>

          {/* Status Message */}
          {verificationState.message && (
            <div className="flex items-center space-x-2 text-sov-light-alt">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>{verificationState.message}</span>
            </div>
          )}

          {/* Error Message */}
          {verificationState.error && (
            <div className="bg-sov-red/10 border border-sov-red/30 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-sov-red mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="text-sov-red font-medium">Verification Failed</h4>
                  <p className="text-sov-red/80 text-sm mt-1">{verificationState.error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {verificationState.status === 'completed' && !verificationState.error && (
            <div className="bg-sov-green/10 border border-sov-green/30 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-sov-green mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="text-sov-green font-medium">Account Verified Successfully</h4>
                  <p className="text-sov-green/80 text-sm mt-1">
                    Your bank account has been verified and is ready for ACH payments.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Micro-Deposit Confirmation */}
      {verificationState.status === 'completed' && 
       verificationState.verificationMethod === 'micro_deposit' && 
       !showConfirmation && (
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-semibold text-sov-light">Confirm Micro-Deposits</h3>
          <p className="text-sov-light-alt">
            Small deposits have been sent to your account. Please check your bank statement 
            and enter the exact amounts below to complete verification.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sov-light-alt text-sm font-medium mb-2">
                First Deposit Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="1.00"
                value={microDepositAmounts.first}
                onChange={(e) => setMicroDepositAmounts(prev => ({ ...prev, first: e.target.value }))}
                className="w-full px-3 py-2 bg-sov-dark border border-gray-600 rounded-md text-sov-light focus:outline-none focus:ring-2 focus:ring-sov-accent"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sov-light-alt text-sm font-medium mb-2">
                Second Deposit Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="1.00"
                value={microDepositAmounts.second}
                onChange={(e) => setMicroDepositAmounts(prev => ({ ...prev, second: e.target.value }))}
                className="w-full px-3 py-2 bg-sov-dark border border-gray-600 rounded-md text-sov-light focus:outline-none focus:ring-2 focus:ring-sov-accent"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-700">
        <div>
          {verificationState.status === 'failed' && (
            <button
              onClick={retryVerification}
              className="text-sov-accent hover:text-sov-accent/80 font-medium"
            >
              Try Again
            </button>
          )}
        </div>

        <div className="flex space-x-4">
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={verificationState.status === 'processing'}
              className="px-6 py-2 text-sov-light-alt border border-gray-600 rounded-md hover:bg-sov-dark focus:outline-none focus:ring-2 focus:ring-sov-accent disabled:opacity-50"
            >
              Cancel
            </button>
          )}

          {verificationState.status === 'idle' && selectedMethod && (
            <button
              onClick={selectedMethod.type === 'instant' ? startInstantVerification : startMicroDepositVerification}
              className="px-6 py-2 bg-sov-accent text-white rounded-md hover:bg-sov-accent/90 focus:outline-none focus:ring-2 focus:ring-sov-accent"
            >
              Start Verification
            </button>
          )}

          {verificationState.status === 'completed' && 
           verificationState.verificationMethod === 'micro_deposit' && 
           !showConfirmation && (
            <button
              onClick={() => setShowConfirmation(true)}
              className="px-6 py-2 bg-sov-accent text-white rounded-md hover:bg-sov-accent/90 focus:outline-none focus:ring-2 focus:ring-sov-accent"
            >
              Confirm Deposits
            </button>
          )}

          {showConfirmation && (
            <button
              onClick={confirmMicroDeposits}
              disabled={!microDepositAmounts.first || !microDepositAmounts.second}
              className="px-6 py-2 bg-sov-accent text-white rounded-md hover:bg-sov-accent/90 focus:outline-none focus:ring-2 focus:ring-sov-accent disabled:opacity-50"
            >
              Verify Account
            </button>
          )}
        </div>
      </div>

      {/* Help Information */}
      <div className="mt-6 bg-sov-accent/5 border border-sov-accent/20 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-sov-accent mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-sov-accent font-medium">Verification Tips</h4>
            <ul className="text-sov-light-alt text-sm mt-2 space-y-1">
              <li>• Instant verification is the fastest method when available</li>
              <li>• Micro-deposits typically appear as small charges on your statement</li>
              <li>• Account verification helps prevent payment failures and returns</li>
              <li>• You can verify multiple bank accounts using different methods</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};