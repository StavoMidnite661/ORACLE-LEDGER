import React, { useState } from 'react';
import {
  AchPaymentForm,
  BankAccountVerification,
  AchPaymentHistory,
  ReturnProcessing,
  type AchPayment,
  type Customer
} from './index';

/**
 * ACH Payments Dashboard Demo
 * 
 * This example demonstrates how to integrate all ACH payment processing components
 * into a comprehensive payments management system.
 */
export const AchPaymentsDashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<'history' | 'new-payment' | 'returns'>('history');
  const [showVerification, setShowVerification] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<any>(null);

  // Handle new payment submission
  const handlePaymentSubmit = async (paymentData: any) => {
    try {
      // First, create customer if needed
      let customerId = paymentData.customerId;
      
      if (!customerId && paymentData.newCustomer) {
        const customerResponse = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(paymentData.newCustomer)
        });
        
        if (!customerResponse.ok) {
          throw new Error('Failed to create customer');
        }
        
        const customer = await customerResponse.json();
        customerId = customer.id;
      }

      // Handle bank account verification if needed
      if (paymentData.bankAccount && !paymentData.paymentMethodId) {
        // Store payment data temporarily and show verification
        setPendingPayment({ ...paymentData, customerId });
        setShowVerification(true);
        return;
      }

      // Create payment
      const payment = await createAchPayment({ ...paymentData, customerId });
      
      // Handle success
      alert(`Payment created successfully: ${payment.id}`);
      
      // Refresh history view
      setActiveView('history');
      
    } catch (error) {
      console.error('Payment submission failed:', error);
      alert('Failed to create payment. Please try again.');
    }
  };

  // Handle bank account verification
  const handleVerificationComplete = async (verificationResult: {
    verified: boolean;
    verificationMethod: string;
    paymentMethodId?: string;
    error?: string;
  }) => {
    if (!pendingPayment) return;

    if (!verificationResult.verified) {
      alert('Bank account verification failed. Please try again.');
      setShowVerification(false);
      return;
    }

    try {
      // Create payment with verified payment method
      const payment = await createAchPayment({
        ...pendingPayment,
        paymentMethodId: verificationResult.paymentMethodId,
        customerId: pendingPayment.customerId
      });

      alert(`Payment created successfully: ${payment.id}`);
      setActiveView('history');
      
    } catch (error) {
      console.error('Payment creation failed:', error);
      alert('Failed to create payment after verification.');
    } finally {
      setShowVerification(false);
      setPendingPayment(null);
    }
  };

  // Helper function to create ACH payment
  const createAchPayment = async (paymentData: any): Promise<AchPayment> => {
    const response = await fetch('/api/ach-payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });

    if (!response.ok) {
      throw new Error('Failed to create payment');
    }

    return response.json();
  };

  // Render navigation
  const renderNavigation = () => (
    <div className="flex space-x-4 mb-6 border-b border-gray-700">
      <button
        onClick={() => setActiveView('history')}
        className={`pb-2 px-1 border-b-2 font-medium text-sm ${
          activeView === 'history'
            ? 'border-sov-accent text-sov-accent'
            : 'border-transparent text-sov-light-alt hover:text-sov-light'
        }`}
      >
        Payment History
      </button>
      <button
        onClick={() => setActiveView('new-payment')}
        className={`pb-2 px-1 border-b-2 font-medium text-sm ${
          activeView === 'new-payment'
            ? 'border-sov-accent text-sov-accent'
            : 'border-transparent text-sov-light-alt hover:text-sov-light'
        }`}
      >
        New Payment
      </button>
      <button
        onClick={() => setActiveView('returns')}
        className={`pb-2 px-1 border-b-2 font-medium text-sm ${
          activeView === 'returns'
            ? 'border-sov-accent text-sov-accent'
            : 'border-transparent text-sov-light-alt hover:text-sov-light'
        }`}
      >
        Return Processing
      </button>
    </div>
  );

  // Render verification component if needed
  if (showVerification && pendingPayment) {
    return (
      <div className="min-h-screen bg-sov-dark p-6">
        <div className="max-w-4xl mx-auto">
          <BankAccountVerification
            bankAccountData={pendingPayment.bankAccount}
            customerId={pendingPayment.customerId}
            onVerificationComplete={handleVerificationComplete}
            onCancel={() => {
              setShowVerification(false);
              setPendingPayment(null);
            }}
          />
        </div>
      </div>
    );
  }

  // Main dashboard render
  return (
    <div className="min-h-screen bg-sov-dark p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-sov-light mb-2">ACH Payment Processing</h1>
          <p className="text-sov-light-alt">
            Manage ACH payments, bank account verification, and return processing
          </p>
        </div>

        {renderNavigation()}

        <div className="space-y-6">
          {activeView === 'history' && (
            <AchPaymentHistory
              onPaymentSelect={(payment: AchPayment) => {
                console.log('Selected payment:', payment);
                // Could open a detailed view modal
              }}
              onExport={(filters) => {
                console.log('Export payments with filters:', filters);
                // Handle export functionality
              }}
              refreshInterval={30000}
            />
          )}

          {activeView === 'new-payment' && (
            <AchPaymentForm
              onSubmit={handlePaymentSubmit}
              onCancel={() => setActiveView('history')}
              isLoading={false}
            />
          )}

          {activeView === 'returns' && (
            <ReturnProcessing />
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Individual Component Usage Examples
 */

export const AchPaymentFormExample: React.FC = () => {
  const handlePaymentSubmit = async (paymentData: any) => {
    console.log('Payment data:', paymentData);
    
    // Validate payment data
    if (!paymentData.customerId && !paymentData.newCustomer) {
      throw new Error('Customer is required');
    }
    
    if (!paymentData.paymentMethodId && !paymentData.bankAccount) {
      throw new Error('Payment method is required');
    }

    // Create the payment
    try {
      const response = await fetch('/api/ach-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        throw new Error('Payment creation failed');
      }

      const payment = await response.json();
      console.log('Created payment:', payment);
      
      alert(`Payment created successfully: ${payment.id}`);
    } catch (error) {
      console.error('Payment creation failed:', error);
      alert('Failed to create payment. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <AchPaymentForm
        onSubmit={handlePaymentSubmit}
        isLoading={false}
      />
    </div>
  );
};

export const BankAccountVerificationExample: React.FC = () => {
  const handleVerificationComplete = (result: {
    verified: boolean;
    verificationMethod: string;
    paymentMethodId?: string;
    error?: string;
  }) => {
    console.log('Verification result:', result);
    
    if (result.verified) {
      console.log('Bank account verified with method:', result.verificationMethod);
      console.log('Payment method ID:', result.paymentMethodId);
      
      // Proceed with payment creation using verified payment method
    } else {
      console.error('Verification failed:', result.error);
      alert('Bank account verification failed. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <BankAccountVerification
        bankAccountData={{
          routingNumber: '123456789',
          accountNumber: '987654321',
          accountType: 'checking',
          bankName: 'Demo Bank'
        }}
        onVerificationComplete={handleVerificationComplete}
        onCancel={() => {
          console.log('Verification cancelled');
        }}
      />
    </div>
  );
};

export const AchPaymentHistoryExample: React.FC = () => {
  const handlePaymentSelect = (payment: AchPayment) => {
    console.log('Selected payment for detailed view:', payment);
    // Could open a modal or navigate to detailed view
  };

  const handleExport = (filters: any) => {
    console.log('Export request with filters:', filters);
    // Handle CSV/Excel export
  };

  return (
    <div className="max-w-7xl mx-auto">
      <AchPaymentHistory
        onPaymentSelect={handlePaymentSelect}
        onExport={handleExport}
        refreshInterval={30000}
      />
    </div>
  );
};

export const ReturnProcessingExample: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto">
      <ReturnProcessing />
    </div>
  );
};

// Default export for easy importing
export default AchPaymentsDashboard;