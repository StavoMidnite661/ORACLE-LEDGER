# Stripe Journal Services Documentation

## Overview

This documentation describes the implementation of automatic journal entry creation for all Stripe payment types in ORACLE-LEDGER. The system provides comprehensive journal entry services, banking reconciliation, and accounting automation.

## Table of Contents

1. [Services Overview](#services-overview)
2. [Stripe Journal Service](#stripe-journal-service)
3. [Reconciliation Service](#reconciliation-service)
4. [Journal Template Service](#journal-template-service)
5. [Database Integration](#database-integration)
6. [API Integration](#api-integration)
7. [Usage Examples](#usage-examples)
8. [Configuration](#configuration)
9. [Testing](#testing)
10. [Error Handling](#error-handling)
11. [Best Practices](#best-practices)

## Services Overview

### Core Services

- **stripeJournalService**: Handles automatic journal entry creation for Stripe transactions
- **reconciliationService**: Provides banking reconciliation and exception management
- **journalTemplateService**: Manages journal entry templates and business rules
- **databaseService**: Enhanced with Stripe-specific database operations
- **apiService**: Updated with new API endpoints for Stripe operations

### Key Features

- ✅ ACH payment journal entries
- ✅ Stripe fee allocation and tracking
- ✅ Direct deposit payroll journal entries
- ✅ Return and NSF adjustment entries
- ✅ Customer payment application
- ✅ Vendor payment processing
- ✅ Automated reconciliation
- ✅ Exception handling and reporting
- ✅ Batch processing capabilities
- ✅ Comprehensive audit logging

## Stripe Journal Service

### Purpose

The `stripeJournalService` is responsible for creating journal entries automatically based on Stripe transaction data, following double-entry bookkeeping principles.

### Account Mappings

The service uses predefined account mappings for Stripe transactions:

```typescript
const STRIPE_ACCOUNTS = {
  STRIPE_BALANCE: 1001,          // Asset - Stripe Balance
  CUSTOMER_PAYMENTS: 1201,       // Asset - Customer Payments Receivable
  STRIPE_FEE_EXPENSE: 5101,      // Expense - Stripe Fee Expense
  PAYROLL_EXPENSE: 5201,         // Expense - Payroll Expense
  DIRECT_DEPOSIT_PAYABLE: 2102,  // Liability - Direct Deposit Payable
  RETURN_FEE_EXPENSE: 5102,      // Expense - Return Fee Expense
  // ... more mappings
};
```

### Core Methods

#### 1. ACH Payment Processing

```typescript
async createACHPaymentEntry(paymentData: ACHPaymentData): Promise<JournalEntry>
```

Creates journal entries for ACH payments with automatic fee allocation and return handling.

**Parameters:**
- `achTransactionId`: Unique identifier for the ACH transaction
- `amount`: Payment amount in dollars
- `currency`: Currency code (typically 'usd')
- `customerId`: Stripe customer identifier
- `status`: Payment status ('pending', 'succeeded', 'failed')
- `returnCode`: Return code for failed payments (optional)
- `bankAccountLast4`: Last 4 digits of bank account

**Example:**
```typescript
const entry = await stripeJournalService.createACHPaymentEntry({
  achTransactionId: 'ach_test_123456789',
  amount: 1500.00,
  currency: 'usd',
  customerId: 'cus_test_customer',
  status: 'succeeded',
  bankAccountLast4: '1234',
});
```

#### 2. Stripe Fee Allocation

```typescript
async createStripeFeeEntry(paymentData: StripePaymentData): Promise<JournalEntry>
```

Creates journal entries for Stripe processing fee allocation.

**Example:**
```typescript
const feeEntry = await stripeJournalService.createStripeFeeEntry({
  stripeTransactionId: 'ch_test_123456789',
  amount: 150000, // cents
  feeAmount: 4500, // cents
  netAmount: 145500, // cents
  currency: 'usd',
  description: 'Customer subscription payment',
});
```

#### 3. Payroll Processing

```typescript
async createPayrollEntry(payrollData: DirectDepositData): Promise<JournalEntry>
```

Creates journal entries for direct deposit payroll processing.

**Example:**
```typescript
const payrollEntry = await stripeJournalService.createPayrollEntry({
  employeeId: 'EMP001',
  employeeName: 'John Doe',
  grossAmount: 5000.00,
  netAmount: 4000.00,
  taxAmount: 1000.00,
  bankRoutingNumber: '123456789',
  bankAccountLast4: '5678',
  payPeriod: '2024-01',
  payrollDate: '2024-01-31',
});
```

#### 4. Batch Processing

```typescript
async processBatchEntries(entries: BatchEntry[]): Promise<JournalEntry[]>
```

Processes multiple journal entries in a single operation.

**Example:**
```typescript
const batchEntries = [
  {
    type: 'ACH_PAYMENT',
    data: achPaymentData,
  },
  {
    type: 'PAYROLL',
    data: payrollData,
  },
];

const entries = await stripeJournalService.processBatchEntries(batchEntries);
```

### Return Code Handling

The service automatically handles ACH return codes with appropriate fee calculations:

- **R01**: Insufficient Funds - $5.00 fee
- **R02**: Account Closed - $3.00 fee
- **R03**: No Account/Unable to Locate - $5.00 fee
- **R04**: Invalid Account Number - $3.00 fee
- **R05**: Unauthorized Debit - $5.00 fee
- **R06**: Returned per ODFI Request - $3.00 fee

## Reconciliation Service

### Purpose

The `reconciliationService` provides automated banking reconciliation and exception handling for Stripe transactions.

### Core Features

#### 1. Automated Reconciliation

```typescript
async performAutomatedReconciliation(startDate: string, endDate: string): Promise<ReconciliationResult>
```

Performs automated matching between Stripe transactions and journal entries.

**Example:**
```typescript
const result = await reconciliationService.performAutomatedReconciliation(
  '2024-01-01',
  '2024-01-31'
);

console.log(`Matched: ${result.report.matchedTransactions}`);
console.log(`Unmatched: ${result.report.unmatchedTransactions}`);
console.log(`Reconciliation Rate: ${result.report.reconciliationRate}%`);
```

#### 2. Exception Management

```typescript
async getReconciliationExceptions(severity?: string): Promise<ReconciliationException[]>
```

Retrieves reconciliation exceptions for manual review.

**Example:**
```typescript
const exceptions = await reconciliationService.getReconciliationExceptions('high');

for (const exception of exceptions) {
  console.log(`Exception: ${exception.type} - ${exception.description}`);
  
  // Resolve exception
  await reconciliationService.resolveException(
    exception.id,
    'create_entry',
    'Creating missing journal entry',
    'system'
  );
}
```

#### 3. Manual Reconciliation

```typescript
async performManualReconciliation(
  stripeTransactionId: string, 
  journalEntryId: string, 
  notes?: string
): Promise<void>
```

Allows manual matching of unmatched transactions.

**Example:**
```typescript
await reconciliationService.performManualReconciliation(
  'ch_test_123',
  'JE-123456',
  'Matched manually by accounting team'
);
```

#### 4. ACH Return Processing

```typescript
async processACHRturns(returns: ACHTransaction[]): Promise<ProcessingResult>
```

Processes ACH returns and creates adjustment entries automatically.

**Example:**
```typescript
const processingResult = await reconciliationService.processACHRturns([
  {
    id: 'ach_return_123',
    amount: -50000, // negative for return
    status: 'failed',
    failure_code: 'R01',
    failure_message: 'Insufficient Funds',
    // ... other fields
  }
]);
```

### Matching Algorithm

The reconciliation service uses a sophisticated matching algorithm with configurable thresholds:

1. **Exact Match**: Amounts match within $0.01, dates within 3 days
2. **Fuzzy Match**: Description similarity ≥ 80%
3. **Manual Review**: Multiple potential matches or low confidence scores

## Journal Template Service

### Purpose

The `journalTemplateService` manages journal entry templates, business rules, and conditional logic for automated processing.

### Template Structure

```typescript
interface JournalEntryTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  accountMappings: TemplateAccountMapping[];
  validationRules: TemplateValidationRules;
  isActive: boolean;
}
```

### Core Methods

#### 1. Template Management

```typescript
// Get all templates
getAllTemplates(): JournalEntryTemplate[]

// Get specific template
getTemplate(templateId: string): JournalEntryTemplate | null

// Create new template
createTemplate(template: TemplateData): JournalEntryTemplate

// Update template
updateTemplate(templateId: string, updates: Partial<JournalEntryTemplate>): JournalEntryTemplate

// Delete template
deleteTemplate(templateId: string): boolean
```

#### 2. Template Application

```typescript
// Find applicable templates for transaction data
findApplicableTemplates(transactionData: any): JournalEntryTemplate[]

// Generate template preview
generateTemplatePreview(templateId: string, transactionData: any): TemplatePreview
```

#### 3. Business Rules

Templates include validation rules and business logic:

```typescript
validationRules: {
  requiredFields: ['amount', 'customerId', 'bankAccountLast4'],
  amountValidation: {
    min: 0.01,
    max: 100000,
    precision: 2,
  },
  businessRules: [
    {
      field: 'status',
      operator: 'in',
      value: ['pending', 'succeeded', 'failed'],
      errorMessage: 'Invalid payment status',
    },
  ],
}
```

### Default Templates

The system includes pre-configured templates:

1. **ACH Payment Entry**: Customer ACH payments
2. **Stripe Fee Allocation**: Processing fee distribution
3. **Payroll Entry**: Direct deposit payroll
4. **ACH Return Entry**: Return processing
5. **Customer Payment Application**: Payment application to invoices

## Database Integration

### Enhanced DatabaseService

The `databaseService` has been extended with Stripe-specific operations:

#### 1. Stripe Transaction Management

```typescript
// Add Stripe transaction record
async addStripeTransaction(stripeTransaction: StripeTransactionData): Promise<void>

// Get Stripe transactions for period
async getStripeTransactions(startDate?: string, endDate?: string): Promise<StripeTransaction[]>
```

#### 2. Reconciliation Tracking

```typescript
// Add reconciliation match
async addReconciliationMatch(match: ReconciliationMatchData): Promise<void>

// Get reconciliation matches
async getReconciliationMatches(): Promise<ReconciliationMatch[]>
```

#### 3. Exception Management

```typescript
// Add reconciliation exception
async addReconciliationException(exception: ExceptionData): Promise<string>

// Get exceptions
async getReconciliationExceptions(resolved?: boolean): Promise<ReconciliationException[]>

// Resolve exception
async resolveReconciliationException(
  exceptionId: string, 
  resolution: string, 
  notes: string, 
  resolvedBy: string
): Promise<void>
```

#### 4. Audit Trail

```typescript
// Add journal entry audit log
async addJournalEntryAudit(audit: AuditData): Promise<void>

// Get audit trail for entry
async getJournalEntryAudit(journalEntryId: string): Promise<AuditEntry[]>
```

## API Integration

### Enhanced ApiService

The `apiService` includes new endpoints for Stripe operations:

#### Journal Entry Endpoints

```typescript
// Create journal entries
createACHPaymentEntry(paymentData: ACHPaymentData): Promise<ApiResponse>
createStripeFeeEntry(paymentData: StripePaymentData): Promise<ApiResponse>
createPayrollEntry(payrollData: DirectDepositData): Promise<ApiResponse>
createACHReturnEntry(paymentData: ACHReturnData): Promise<ApiResponse>

// Batch processing
processBatchEntries(entries: BatchEntry[]): Promise<ApiResponse>

// Templates and mappings
getStripeAccountMappings(): Promise<ApiResponse>
generateFeeReport(startDate: string, endDate: string): Promise<ApiResponse>
```

#### Reconciliation Endpoints

```typescript
// Automated reconciliation
performAutomatedReconciliation(startDate: string, endDate: string): Promise<ApiResponse>

// Manual operations
performManualReconciliation(stripeTransactionId: string, journalEntryId: string): Promise<ApiResponse>
getReconciliationExceptions(severity?: string): Promise<ApiResponse>
resolveException(exceptionId: string, resolution: string, notes: string): Promise<ApiResponse>

// Reports and analytics
generateReconciliationReport(startDate: string, endDate: string): Promise<ApiResponse>
getReconciliationStatistics(days: number): Promise<ApiResponse>
```

## Usage Examples

### Complete ACH Payment Flow

```typescript
import { stripeJournalService } from './services/stripeJournalService';

// 1. Process ACH payment
const achEntry = await stripeJournalService.createACHPaymentEntry({
  achTransactionId: 'ach_test_123456789',
  amount: 1500.00,
  currency: 'usd',
  customerId: 'cus_test_customer',
  description: 'Monthly subscription',
  status: 'succeeded',
  bankAccountLast4: '1234',
});

// 2. Process Stripe fees
const feeEntry = await stripeJournalService.createStripeFeeEntry({
  stripeTransactionId: 'ch_test_123456789',
  amount: 150000, // cents
  feeAmount: 4500, // cents
  netAmount: 145500, // cents
  currency: 'usd',
  description: 'Monthly subscription',
  sourceType: 'ach_credit_transfer',
  status: 'succeeded',
});

// 3. Apply payment to customer invoices
const applicationEntry = await stripeJournalService.createCustomerPaymentApplication({
  customerId: 'cus_test_customer',
  invoiceIds: ['INV001', 'INV002'],
  paymentAmount: 145500, // cents (net amount)
  stripeTransactionId: 'ch_test_123456789',
  paymentDate: '2024-01-15',
});

console.log('Journal entries created successfully');
```

### Complete Payroll Processing Flow

```typescript
import { stripeJournalService } from './services/stripeJournalService';

// Process payroll for multiple employees
const payrollBatch = [
  {
    type: 'PAYROLL',
    data: {
      employeeId: 'EMP001',
      employeeName: 'John Doe',
      grossAmount: 5000.00,
      netAmount: 4000.00,
      taxAmount: 1000.00,
      bankRoutingNumber: '123456789',
      bankAccountLast4: '5678',
      payPeriod: '2024-01',
      payrollDate: '2024-01-31',
    },
  },
  {
    type: 'PAYROLL',
    data: {
      employeeId: 'EMP002',
      employeeName: 'Jane Smith',
      grossAmount: 6000.00,
      netAmount: 4800.00,
      taxAmount: 1200.00,
      bankRoutingNumber: '987654321',
      bankAccountLast4: '9876',
      payPeriod: '2024-01',
      payrollDate: '2024-01-31',
    },
  },
];

const payrollEntries = await stripeJournalService.processBatchEntries(payrollBatch);
console.log(`Created ${payrollEntries.length} payroll entries`);
```

### Reconciliation Process

```typescript
import { reconciliationService } from './services/reconciliationService';

// 1. Perform automated reconciliation
const reconciliationResult = await reconciliationService.performAutomatedReconciliation(
  '2024-01-01',
  '2024-01-31'
);

// 2. Review exceptions
console.log(`Found ${reconciliationResult.exceptions.length} exceptions`);

for (const exception of reconciliationResult.exceptions) {
  if (exception.severity === 'high') {
    console.log(`High priority exception: ${exception.description}`);
    
    // Resolve by creating missing entry
    await reconciliationService.resolveException(
      exception.id,
      'create_entry',
      'Auto-resolved by creating missing journal entry',
      'system'
    );
  }
}

// 3. Generate report
const report = await reconciliationService.generateReconciliationReport(
  '2024-01-01',
  '2024-01-31'
);

console.log(`Reconciliation rate: ${report.reconciliationRate}%`);
console.log(`Total matched: ${report.matchedTransactions}`);
console.log(`Total unmatched: ${report.unmatchedTransactions}`);
```

### Template Customization

```typescript
import { journalTemplateService } from './services/journalTemplateService';

// 1. Create custom template
const customTemplate = journalTemplateService.createTemplate({
  name: 'Custom Payment Template',
  category: 'Custom',
  description: 'Custom payment processing template',
  accountMappings: [
    {
      accountId: 1001,
      accountName: 'Custom Asset Account',
      accountType: 'Asset',
      entryType: 'DEBIT',
      amountType: 'variable',
      description: 'Custom amount received',
      isRequired: true,
    },
    {
      accountId: 2001,
      accountName: 'Custom Liability Account',
      accountType: 'Liability',
      entryType: 'CREDIT',
      amountType: 'variable',
      description: 'Custom liability entry',
      isRequired: true,
    },
  ],
  validationRules: {
    requiredFields: ['amount', 'customField'],
    amountValidation: {
      min: 0.01,
      max: 50000,
      precision: 2,
    },
  },
  isActive: true,
});

// 2. Test template with data
const preview = journalTemplateService.generateTemplatePreview(
  customTemplate.id,
  {
    amount: 1000.00,
    customField: 'custom_value',
  }
);

if (preview.validationResults.isValid) {
  console.log('Template validation passed');
  console.log('Preview lines:', preview.previewLines);
} else {
  console.log('Validation errors:', preview.validationResults.errors);
}

// 3. Export templates for backup
const exportData = journalTemplateService.exportTemplates();
console.log('Template export data:', exportData);
```

## Configuration

### Account Mappings

Configure account mappings in the `STRIPE_ACCOUNTS` constant:

```typescript
const STRIPE_ACCOUNTS = {
  STRIPE_BALANCE: 1001,           // Your Stripe Balance account ID
  CUSTOMER_PAYMENTS: 1201,        // Customer payment tracking
  STRIPE_FEE_EXPENSE: 5101,       // Stripe fee expense account
  // ... add your specific account IDs
};
```

### Return Fee Configuration

Customize return fees by modifying the `calculateReturnFee` method:

```typescript
private calculateReturnFee(returnCode: string): number {
  const returnFeeMap: Record<string, number> = {
    'R01': 500,  // $5.00
    'R02': 300,  // $3.00
    // ... customize as needed
  };
  
  return returnFeeMap[returnCode] || 300;
}
```

### Reconciliation Thresholds

Adjust matching thresholds in `ReconciliationService`:

```typescript
private readonly MATCH_THRESHOLDS = {
  EXACT_AMOUNT: 0.01,              // $0.01 tolerance
  DATE_TOLERANCE: 3,               // 3 days
  FUZZY_DESCRIPTION_THRESHOLD: 0.8, // 80% similarity
};
```

## Testing

### Running Tests

```bash
# Run all tests
npm run test:stripe-services

# Run specific test suites
npm run test:stripe-journal
npm run test:reconciliation
npm run test:integration
npm run test:performance
```

### Test Coverage

The test suite includes:

- ✅ Unit tests for all service methods
- ✅ Integration tests with database
- ✅ Error handling tests
- ✅ Performance tests
- ✅ Business rule validation tests
- ✅ Batch processing tests

### Manual Testing

Use the test runner for manual testing:

```typescript
import { runAllTests } from './services/stripeServices.test';

// Run all test suites
await runAllTests();

// Run specific test suite
await runStripeJournalServiceTests();
await runReconciliationServiceTests();
```

## Error Handling

### Common Error Types

1. **Validation Errors**: Missing required fields or invalid data
2. **Business Rule Errors**: Violations of accounting rules
3. **Database Errors**: Connection or query issues
4. **Integration Errors**: External service failures

### Error Handling Patterns

```typescript
try {
  const entry = await stripeJournalService.createACHPaymentEntry(data);
  console.log('Entry created successfully:', entry.id);
} catch (error) {
  if (error instanceof Error) {
    switch (error.message) {
      case 'Required field missing: amount':
        console.log('Amount field is required');
        break;
      case 'Invalid amount':
        console.log('Amount must be positive');
        break;
      default:
        console.log('Unexpected error:', error.message);
    }
  }
}
```

### Retry Logic

For transient errors, implement retry logic:

```typescript
async function createEntryWithRetry(data: any, maxRetries: number = 3): Promise<JournalEntry> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await stripeJournalService.createACHPaymentEntry(data);
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  
  throw new Error('Max retries exceeded');
}
```

## Best Practices

### 1. Data Validation

Always validate data before processing:

```typescript
// Validate required fields
function validateACHPaymentData(data: ACHPaymentData): void {
  const required = ['achTransactionId', 'amount', 'customerId', 'status'];
  
  for (const field of required) {
    if (!data[field as keyof ACHPaymentData]) {
      throw new Error(`Required field missing: ${field}`);
    }
  }
  
  // Validate amounts
  if (data.amount <= 0) {
    throw new Error('Amount must be positive');
  }
}
```

### 2. Error Recovery

Implement graceful error handling:

```typescript
async function processBatchWithErrorHandling(entries: BatchEntry[]): Promise<{
  successful: JournalEntry[];
  failed: { entry: BatchEntry; error: string }[];
}> {
  const successful: JournalEntry[] = [];
  const failed: { entry: BatchEntry; error: string }[] = [];
  
  for (const entry of entries) {
    try {
      const result = await stripeJournalService.processBatchEntries([entry]);
      successful.push(...result);
    } catch (error) {
      failed.push({
        entry,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  
  return { successful, failed };
}
```

### 3. Audit Logging

Always log journal entry operations:

```typescript
async function createEntryWithAudit(data: any): Promise<JournalEntry> {
  const entry = await stripeJournalService.createACHPaymentEntry(data);
  
  // Log to audit trail
  await databaseService.addJournalEntryAudit({
    journalEntryId: entry.id,
    action: 'CREATE',
    performedBy: 'system',
    details: `Created ACH payment entry for ${data.amount}`,
    timestamp: new Date().toISOString(),
  });
  
  return entry;
}
```

### 4. Performance Optimization

Use batch operations for multiple entries:

```typescript
// Instead of individual calls
for (const payment of payments) {
  await stripeJournalService.createACHPaymentEntry(payment);
}

// Use batch processing
await stripeJournalService.processBatchEntries(
  payments.map(payment => ({
    type: 'ACH_PAYMENT',
    data: payment,
  }))
);
```

### 5. Monitoring and Alerting

Implement monitoring for critical operations:

```typescript
async function processWithMonitoring(entryData: any): Promise<JournalEntry> {
  const startTime = Date.now();
  
  try {
    const entry = await stripeJournalService.createACHPaymentEntry(entryData);
    
    // Log successful operation
    console.log(`Entry created in ${Date.now() - startTime}ms: ${entry.id}`);
    
    return entry;
  } catch (error) {
    // Log error with details
    console.error(`Failed to create entry after ${Date.now() - startTime}ms:`, error);
    
    // Send alert for critical failures
    if (Date.now() - startTime > 10000) { // 10 seconds
      console.alert('Slow operation detected');
    }
    
    throw error;
  }
}
```

### 6. Configuration Management

Use environment-specific configurations:

```typescript
// Development
const config = {
  matchThreshold: 0.01,
  retryAttempts: 3,
  batchSize: 10,
};

// Production
const prodConfig = {
  matchThreshold: 0.005,
  retryAttempts: 5,
  batchSize: 50,
  enableMonitoring: true,
};
```

### 7. Testing Strategy

Implement comprehensive testing:

```typescript
// Unit tests for individual methods
describe('createACHPaymentEntry', () => {
  it('should create balanced journal entry', async () => {
    // Test implementation
  });
  
  it('should handle validation errors', async () => {
    // Test implementation
  });
});

// Integration tests
describe('ACH Payment Integration', () => {
  it('should process end-to-end payment flow', async () => {
    // Test implementation
  });
});
```

## Troubleshooting

### Common Issues

1. **Account mappings not found**: Ensure chart of accounts includes required accounts
2. **Unbalanced entries**: Check account mapping logic and amount calculations
3. **Reconciliation failures**: Verify transaction data and matching thresholds
4. **Performance issues**: Monitor batch sizes and database queries

### Debug Mode

Enable debug logging:

```typescript
process.env.DEBUG = 'stripe-journal:*';

console.log('Debug mode enabled for Stripe journal services');
```

### Health Checks

Implement health checks for monitoring:

```typescript
async function healthCheck(): Promise<HealthStatus> {
  try {
    // Check database connectivity
    await databaseService.getJournalEntries();
    
    // Check service availability
    const templates = journalTemplateService.getAllTemplates();
    
    return {
      status: 'healthy',
      services: {
        database: 'ok',
        templates: `${templates.length} templates loaded`,
        journalService: 'ok',
        reconciliationService: 'ok',
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}
```

---

This documentation provides comprehensive coverage of the Stripe journal services implementation. For additional support or questions, refer to the test files or contact the development team.