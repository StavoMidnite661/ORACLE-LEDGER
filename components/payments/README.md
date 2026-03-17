# ACH Payment Processing Components

This directory contains comprehensive React TypeScript components for handling ACH payment processing in the ORACLE-LEDGER application. The components provide a complete workflow for ACH payments including form creation, bank verification, payment history tracking, and return processing.

## Components Overview

### 1. AchPaymentForm
Main form component for creating new ACH payments with comprehensive validation and customer management.

**Features:**
- Customer selection (existing) or new customer creation
- Bank account entry with routing/account number validation
- Payment amount and description fields
- ACH class code selection (PPD, CCD, WEB, CBP)
- Immediate or scheduled processing options
- Real-time form validation and error handling
- Stripe Payment Intents API integration
- Security-focused data handling

**Usage:**
```tsx
import { AchPaymentForm } from './payments';

<AchPaymentForm
  onSubmit={handlePaymentSubmit}
  onCancel={() => setShowForm(false)}
  isLoading={false}
  initialData={{ achClassCode: 'WEB' }}
/>
```

### 2. BankAccountVerification
Handles bank account verification using instant verification or micro-deposit methods.

**Features:**
- Instant verification via secure database lookup
- Micro-deposit verification (2-3 business days)
- Real-time verification progress tracking
- Error handling and retry functionality
- Account type selection (checking/savings)
- Bank name lookup and validation
- Comprehensive status reporting

**Usage:**
```tsx
import { BankAccountVerification } from './payments';

<BankAccountVerification
  bankAccountData={{
    routingNumber: '123456789',
    accountNumber: '987654321',
    accountType: 'checking',
    bankName: 'Demo Bank'
  }}
  customerId="customer-123"
  onVerificationComplete={handleVerificationComplete}
  onCancel={() => setShowVerification(false)}
/>
```

### 3. AchPaymentHistory
Comprehensive payment tracking with filtering, pagination, and bulk operations.

**Features:**
- List all ACH payments with advanced filtering
- Status indicators with color coding
- Real-time updates (30-second refresh interval)
- Search functionality across multiple fields
- Return code explanations (R01-R85)
- Settlement date tracking
- Bulk action capabilities (cancel, retry)
- CSV export functionality
- Pagination with configurable page sizes

**Usage:**
```tsx
import { AchPaymentHistory } from './payments';

<AchPaymentHistory
  onPaymentSelect={handlePaymentSelect}
  onExport={handleExport}
  refreshInterval={30000}
/>
```

### 4. ReturnProcessing
Manage ACH returns with correction workflows and statistics.

**Features:**
- List all returned payments with filtering
- Return reason display and explanations
- Correction options and workflows
- Bulk correction capabilities
- Return statistics and reporting
- New payment scheduling for corrected returns
- Top return codes analysis
- Severity-based color coding for return codes

**Usage:**
```tsx
import { ReturnProcessing } from './payments';

<ReturnProcessing />
```

## Integration Guide

### API Endpoints Required

The components expect the following backend API endpoints:

```typescript
// Customer Management
GET    /api/customers
POST   /api/customers

// Payment Methods
GET    /api/payment-methods
GET    /api/payment-methods?type=us_bank_account
POST   /api/payment-methods/verify-instant
POST   /api/payment-methods/verify-micro-deposit
POST   /api/payment-methods/confirm-micro-deposit

// ACH Payments
GET    /api/ach-payments
GET    /api/ach-payments/:id
POST   /api/ach-payments
POST   /api/ach-payments/:id/cancel
POST   /api/ach-payments/:id/retry
POST   /api/ach-payments/bulk-action
GET    /api/ach-payments/export

// ACH Returns
GET    /api/ach-returns
GET    /api/ach-returns/statistics
POST   /api/ach-returns/:id/corrected
POST   /api/ach-returns/:id/resubmit
POST   /api/ach-returns/bulk-action
```

### TypeScript Types

The components use comprehensive TypeScript types defined in `types.ts`:

```typescript
interface AchPayment {
  id: string;
  customerId: string;
  amountCents: number;
  currencyCode: string;
  description?: string;
  status: 'pending' | 'succeeded' | 'failed' | 'canceled' | 'returned';
  achClassCode: 'PPD' | 'CCD' | 'WEB' | 'CBP';
  returnCode?: string;
  createdAt: Date;
  // ... additional fields
}

interface AchReturn {
  id: string;
  achPaymentId: string;
  returnCode: string;
  returnReason?: string;
  returnedAt: Date;
  corrected: boolean;
  correctionDate?: Date;
  // ... additional fields
}
```

### Styling and Design

All components follow the ORACLE-LEDGER design system with:
- Dark theme colors (`sov-dark`, `sov-light`, `sov-accent`)
- Consistent spacing and typography
- Accessibility compliance (ARIA labels, keyboard navigation)
- Responsive design for mobile and desktop
- Loading states and user feedback
- Error handling with clear messaging

### Error Handling

Components implement comprehensive error handling:

```typescript
// Form validation with real-time feedback
const validateForm = (): boolean => {
  const errors: Record<string, string> = {};
  
  if (!formData.amount || formData.amount <= 0) {
    errors.amount = 'Amount must be greater than 0';
  }
  
  setValidationErrors(errors);
  return Object.keys(errors).length === 0;
};

// API error handling
try {
  const response = await fetch('/api/ach-payments', {
    method: 'POST',
    body: JSON.stringify(paymentData)
  });
  
  if (!response.ok) {
    throw new Error(`Payment creation failed: ${response.statusText}`);
  }
  
  const payment = await response.json();
  return payment;
} catch (error) {
  console.error('Payment creation failed:', error);
  alert('Failed to create payment. Please try again.');
  throw error;
}
```

### Security Features

- **Data Masking**: Account numbers are masked in displays (`****1234`)
- **Secure Input**: Sensitive fields use appropriate input types
- **Input Validation**: Comprehensive client and server-side validation
- **Error Sanitization**: Error messages don't expose sensitive system information
- **HTTPS Only**: All API calls should use HTTPS in production

### Accessibility Compliance

- **ARIA Labels**: All interactive elements have proper ARIA labels
- **Keyboard Navigation**: Full keyboard support for all functionality
- **Screen Reader Support**: Proper heading hierarchy and semantic HTML
- **Color Contrast**: All text meets WCAG contrast requirements
- **Focus Management**: Clear focus indicators and logical tab order

## Usage Examples

### Complete Integration Example

```tsx
import React, { useState } from 'react';
import {
  AchPaymentForm,
  BankAccountVerification,
  AchPaymentHistory,
  ReturnProcessing,
  type AchPayment
} from '../components/payments';

const PaymentsManager: React.FC = () => {
  const [activeView, setActiveView] = useState<'history' | 'new-payment' | 'returns'>('history');
  const [showVerification, setShowVerification] = useState(false);
  const [pendingPayment, setPendingPayment] = useState(null);

  const handlePaymentSubmit = async (paymentData: any) => {
    // Handle bank account verification if needed
    if (paymentData.bankAccount && !paymentData.paymentMethodId) {
      setPendingPayment(paymentData);
      setShowVerification(true);
      return;
    }

    // Create payment directly if payment method is verified
    const payment = await createAchPayment(paymentData);
    console.log('Payment created:', payment);
    setActiveView('history');
  };

  const handleVerificationComplete = async (result: any) => {
    if (result.verified) {
      await createAchPayment({
        ...pendingPayment,
        paymentMethodId: result.paymentMethodId
      });
      setShowVerification(false);
      setActiveView('history');
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Navigation */}
      <nav className="flex space-x-4 mb-6">
        <button onClick={() => setActiveView('history')}>
          Payment History
        </button>
        <button onClick={() => setActiveView('new-payment')}>
          New Payment
        </button>
        <button onClick={() => setActiveView('returns')}>
          Returns
        </button>
      </nav>

      {/* Components */}
      {activeView === 'history' && <AchPaymentHistory />}
      {activeView === 'new-payment' && (
        <AchPaymentForm
          onSubmit={handlePaymentSubmit}
          onCancel={() => setActiveView('history')}
        />
      )}
      {activeView === 'returns' && <ReturnProcessing />}

      {/* Verification Modal */}
      {showVerification && (
        <BankAccountVerification
          bankAccountData={pendingPayment.bankAccount}
          onVerificationComplete={handleVerificationComplete}
        />
      )}
    </div>
  );
};
```

### Custom Styling

You can customize the appearance by overriding CSS classes:

```css
/* Custom styling for ACH payment components */
.ach-payment-form {
  --sov-dark: #1a1a1a;
  --sov-light: #ffffff;
  --sov-accent: #4f9eff;
  --sov-red: #ff6b6b;
  --sov-green: #51cf66;
}

.ach-payment-form .sov-button-primary {
  background-color: var(--sov-accent);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  border: none;
  cursor: pointer;
}

.ach-payment-form .sov-button-primary:hover {
  background-color: color-mix(in srgb, var(--sov-accent) 90%, black);
}
```

## Testing

### Unit Testing Example

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AchPaymentForm } from './AchPaymentForm';

describe('AchPaymentForm', () => {
  it('validates required fields', async () => {
    render(<AchPaymentForm onSubmit={jest.fn()} />);
    
    fireEvent.click(screen.getByText('Submit Payment'));
    
    await waitFor(() => {
      expect(screen.getByText('Amount must be greater than 0')).toBeInTheDocument();
    });
  });

  it('submits valid payment data', async () => {
    const mockSubmit = jest.fn();
    render(<AchPaymentForm onSubmit={mockSubmit} />);
    
    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: '100.00' }
    });
    
    fireEvent.click(screen.getByText('Submit Payment'));
    
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalled();
    });
  });
});
```

### Integration Testing

```typescript
describe('ACH Payment Flow', () => {
  it('complete payment flow with verification', async () => {
    // Test the complete flow from payment creation to verification
    render(<PaymentsManager />);
    
    // Create new payment
    fireEvent.click(screen.getByText('New Payment'));
    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '100.00' } });
    fireEvent.change(screen.getByLabelText(/routing number/i), { target: { value: '123456789' } });
    fireEvent.click(screen.getByText('Submit Payment'));
    
    // Handle verification
    await waitFor(() => {
      expect(screen.getByText('Bank Account Verification')).toBeInTheDocument();
    });
    
    // Complete verification
    fireEvent.click(screen.getByText('Start Verification'));
    await waitFor(() => {
      expect(screen.getByText('Account verified successfully')).toBeInTheDocument();
    });
  });
});
```

## Performance Considerations

### Optimization Techniques

1. **Lazy Loading**: Load components only when needed
2. **Memoization**: Use React.memo for expensive components
3. **Pagination**: Implement pagination for large datasets
4. **Debouncing**: Debounce search inputs to reduce API calls
5. **Caching**: Cache customer and payment method data

```tsx
// Example optimization with React.memo
const AchPaymentHistory = React.memo(({ onPaymentSelect }: Props) => {
  // Component implementation
});

// Example with useMemo for expensive calculations
const filteredPayments = useMemo(() => {
  return payments.filter(payment => 
    payment.status === filterStatus
  );
}, [payments, filterStatus]);
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

When adding new features to ACH payment components:

1. Follow TypeScript strict mode
2. Add comprehensive error handling
3. Include accessibility features
4. Write unit tests for new functionality
5. Update documentation
6. Follow the existing design system
7. Test across supported browsers

## License

Part of the ORACLE-LEDGER project - see main project license for details.