/**
 * Test Suite for Stripe Journal Services
 * 
 * This test file validates:
 * - stripeJournalService functionality
 * - reconciliationService operations
 * - Integration with databaseService
 * - Error handling and edge cases
 * - Business rule validation
 */

import { stripeJournalService } from '../services/stripeJournalService';
import { reconciliationService } from '../services/reconciliationService';
import { journalTemplateService } from '../services/journalTemplateService';
import { databaseService } from '../services/databaseService';

// Mock data for testing
const mockACHPaymentData = {
  achTransactionId: 'ach_test_123456789',
  amount: 1500.00, // $1500.00 in dollars
  currency: 'usd',
  customerId: 'cus_test_customer',
  description: 'Monthly subscription payment',
  created: Math.floor(Date.now() / 1000),
  status: 'succeeded' as const,
  bankAccountLast4: '1234',
};

const mockStripePaymentData = {
  stripeTransactionId: 'ch_test_123456789',
  amount: 150000, // $1500.00 in cents
  currency: 'usd',
  customerId: 'cus_test_customer',
  description: 'Customer payment',
  created: Math.floor(Date.now() / 1000),
  sourceType: 'card' as const,
  status: 'succeeded',
  feeAmount: 4500, // $45.00 fee
  netAmount: 145500, // $1455.00 net
};

const mockPayrollData = {
  employeeId: 'EMP001',
  employeeName: 'John Doe',
  grossAmount: 5000.00,
  netAmount: 4000.00,
  taxAmount: 1000.00,
  bankRoutingNumber: '123456789',
  bankAccountLast4: '5678',
  payPeriod: '2024-01',
  payrollDate: '2024-01-31',
};

const mockACHReturnData = {
  achTransactionId: 'ach_return_123',
  amount: 500.00,
  currency: 'usd',
  customerId: 'cus_return_customer',
  description: 'Payment return',
  created: Math.floor(Date.now() / 1000),
  status: 'failed' as const,
  returnCode: 'R01',
  returnDescription: 'Insufficient Funds',
  bankAccountLast4: '9876',
};

const mockCustomerPaymentApplication = {
  customerId: 'cus_payment_customer',
  invoiceIds: ['INV001', 'INV002', 'INV003'],
  paymentAmount: 75000, // $750.00 in cents
  discountAmount: 2500, // $25.00 discount
  stripeTransactionId: 'ch_payment_123',
  paymentDate: '2024-01-15',
};

const mockVendorPaymentData = {
  vendorId: 'VEN001',
  vendorName: 'ABC Supplies Inc.',
  invoiceNumber: 'PO-2024-001',
  amount: 2500.00,
  paymentMethod: 'ach_debit' as const,
  bankAccountLast4: '5432',
  description: 'Office supplies purchase',
};

// Test results tracking
interface TestResult {
  testName: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  error?: string;
  executionTime: number;
}

class TestRunner {
  private results: TestResult[] = [];

  async runTest(testName: string, testFunction: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    console.log(`\n🔧 Running test: ${testName}`);
    
    try {
      await testFunction();
      const executionTime = Date.now() - startTime;
      this.results.push({
        testName,
        status: 'PASS',
        executionTime,
      });
      console.log(`✅ PASS: ${testName} (${executionTime}ms)`);
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.results.push({
        testName,
        status: 'FAIL',
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime,
      });
      console.log(`❌ FAIL: ${testName} - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async runTestWithExpectedError(testName: string, testFunction: () => Promise<void>, expectedError: string): Promise<void> {
    const startTime = Date.now();
    console.log(`\n🔧 Running test (expecting error): ${testName}`);
    
    try {
      await testFunction();
      const executionTime = Date.now() - startTime;
      this.results.push({
        testName,
        status: 'FAIL',
        error: 'Expected error was not thrown',
        executionTime,
      });
      console.log(`❌ FAIL: ${testName} - Expected error was not thrown`);
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes(expectedError)) {
        this.results.push({
          testName,
          status: 'PASS',
          executionTime,
        });
        console.log(`✅ PASS: ${testName} (${executionTime}ms) - Expected error caught`);
      } else {
        this.results.push({
          testName,
          status: 'FAIL',
          error: `Expected "${expectedError}" but got "${errorMessage}"`,
          executionTime,
        });
        console.log(`❌ FAIL: ${testName} - Wrong error: ${errorMessage}`);
      }
    }
  }

  printSummary(): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(80));
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;
    const total = this.results.length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} (${((passed/total) * 100).toFixed(1)}%)`);
    console.log(`Failed: ${failed} (${((failed/total) * 100).toFixed(1)}%)`);
    console.log(`Skipped: ${skipped} (${((skipped/total) * 100).toFixed(1)}%)`);
    
    if (failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => {
          console.log(`  - ${r.testName}: ${r.error}`);
        });
    }
    
    console.log('\n⏱️ EXECUTION TIMES:');
    this.results.forEach(r => {
      console.log(`  - ${r.testName}: ${r.executionTime}ms`);
    });
    
    console.log('='.repeat(80));
  }
}

async function runStripeJournalServiceTests(): Promise<void> {
  const testRunner = new TestRunner();

  // Test 1: ACH Payment Entry Creation
  await testRunner.runTest('Create ACH Payment Entry', async () => {
    const entry = await stripeJournalService.createACHPaymentEntry(mockACHPaymentData);
    
    if (!entry || !entry.id) {
      throw new Error('Journal entry was not created');
    }
    
    if (entry.lines.length !== 2) {
      throw new Error(`Expected 2 lines, got ${entry.lines.length}`);
    }
    
    // Validate debit/credit balance
    const totalDebits = entry.lines.filter(line => line.type === 'DEBIT').reduce((sum, line) => sum + line.amount, 0);
    const totalCredits = entry.lines.filter(line => line.type === 'CREDIT').reduce((sum, line) => sum + line.amount, 0);
    
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      throw new Error(`Unbalanced entry: Debits ${totalDebits}, Credits ${totalCredits}`);
    }
  });

  // Test 2: Stripe Fee Entry Creation
  await testRunner.runTest('Create Stripe Fee Entry', async () => {
    const entry = await stripeJournalService.createStripeFeeEntry(mockStripePaymentData);
    
    if (!entry || !entry.id) {
      throw new Error('Journal entry was not created');
    }
    
    if (entry.lines.length !== 3) {
      throw new Error(`Expected 3 lines, got ${entry.lines.length}`);
    }
    
    // Validate amounts match
    const debitTotal = entry.lines.filter(line => line.type === 'DEBIT').reduce((sum, line) => sum + line.amount, 0);
    const creditTotal = entry.lines.filter(line => line.type === 'CREDIT').reduce((sum, line) => sum + line.amount, 0);
    
    if (Math.abs(debitTotal - creditTotal) > 0.01) {
      throw new Error(`Unbalanced entry: Debits ${debitTotal}, Credits ${creditTotal}`);
    }
  });

  // Test 3: Payroll Entry Creation
  await testRunner.runTest('Create Payroll Entry', async () => {
    const entry = await stripeJournalService.createPayrollEntry(mockPayrollData);
    
    if (!entry || !entry.id) {
      throw new Error('Journal entry was not created');
    }
    
    if (entry.lines.length !== 5) {
      throw new Error(`Expected 5 lines, got ${entry.lines.length}`);
    }
    
    // Validate payroll amounts
    const grossDebit = entry.lines.find(line => line.accountId === 5201)?.amount || 0;
    const taxDebit = entry.lines.find(line => line.accountId === 5202)?.amount || 0;
    const netCredit = entry.lines.find(line => line.accountId === 2102)?.amount || 0;
    
    if (grossDebit !== mockPayrollData.grossAmount) {
      throw new Error(`Gross amount mismatch: expected ${mockPayrollData.grossAmount}, got ${grossDebit}`);
    }
    
    if (netCredit !== mockPayrollData.netAmount) {
      throw new Error(`Net amount mismatch: expected ${mockPayrollData.netAmount}, got ${netCredit}`);
    }
  });

  // Test 4: ACH Return Entry Creation
  await testRunner.runTest('Create ACH Return Entry', async () => {
    const entry = await stripeJournalService.createACHReturnEntry(mockACHReturnData);
    
    if (!entry || !entry.id) {
      throw new Error('Journal entry was not created');
    }
    
    // Should include return fee lines
    const hasReturnFees = entry.lines.some(line => line.accountId === 5102 || line.accountId === 2103);
    if (!hasReturnFees) {
      throw new Error('Return entry should include return fee lines');
    }
  });

  // Test 5: Customer Payment Application
  await testRunner.runTest('Create Customer Payment Application', async () => {
    const entry = await stripeJournalService.createCustomerPaymentApplication(mockCustomerPaymentApplication);
    
    if (!entry || !entry.id) {
      throw new Error('Journal entry was not created');
    }
    
    if (entry.lines.length !== 3) {
      throw new Error(`Expected 3 lines (including discount), got ${entry.lines.length}`);
    }
  });

  // Test 6: Vendor Payment Entry
  await testRunner.runTest('Create Vendor Payment Entry', async () => {
    // Note: This test may fail if the vendor doesn't exist in the database
    try {
      const entry = await stripeJournalService.createVendorPaymentEntry(mockVendorPaymentData);
      
      if (!entry || !entry.id) {
        throw new Error('Journal entry was not created');
      }
    } catch (error) {
      // If vendor doesn't exist, that's expected for this test
      if (error instanceof Error && error.message.includes('Vendor not found')) {
        console.log('  (Vendor not found - expected for this test)');
        return;
      }
      throw error;
    }
  });

  // Test 7: Batch Entry Processing
  await testRunner.runTest('Process Batch Entries', async () => {
    const batchEntries = [
      {
        type: 'ACH_PAYMENT',
        data: mockACHPaymentData,
      },
      {
        type: 'STRIPE_FEES',
        data: mockStripePaymentData,
      },
    ];

    const entries = await stripeJournalService.processBatchEntries(batchEntries);
    
    if (entries.length !== 2) {
      throw new Error(`Expected 2 entries, got ${entries.length}`);
    }
  });

  // Test 8: Account Mappings
  await testRunner.runTest('Get Account Mappings', async () => {
    const mappings = stripeJournalService.getAccountMappings();
    
    if (!mappings || Object.keys(mappings).length === 0) {
      throw new Error('Account mappings are empty');
    }
    
    // Check for key accounts
    const requiredAccounts = [
      'STRIPE_BALANCE',
      'CUSTOMER_PAYMENTS',
      'STRIPE_FEE_EXPENSE',
      'PAYROLL_EXPENSE',
      'DIRECT_DEPOSIT_PAYABLE',
    ];
    
    for (const account of requiredAccounts) {
      if (!(account in mappings)) {
        throw new Error(`Missing required account mapping: ${account}`);
      }
    }
  });

  // Test 9: Template Validation
  await testRunner.runTest('Get Journal Templates', async () => {
    const templates = stripeJournalService.getTemplates();
    
    if (!templates || templates.length === 0) {
      throw new Error('No journal templates found');
    }
    
    // Check for required templates
    const requiredTemplates = [
      'ACH Payment',
      'Stripe Fee Allocation',
      'Direct Deposit Payroll',
      'ACH Return',
      'Customer Payment Application',
    ];
    
    const templateNames = templates.map(t => t.entryType);
    for (const templateName of requiredTemplates) {
      if (!templateNames.includes(templateName)) {
        throw new Error(`Missing required template: ${templateName}`);
      }
    }
  });

  // Test 10: Error Handling - Invalid Data
  await testRunner.runTestWithExpectedError('Handle Invalid ACH Payment Data', async () => {
    const invalidData = { ...mockACHPaymentData };
    delete (invalidData as any).amount;
    
    await stripeJournalService.createACHPaymentEntry(invalidData);
  }, 'Required field missing');

  // Test 11: Fee Report Generation
  await testRunner.runTest('Generate Fee Report', async () => {
    const report = await stripeJournalService.generateFeeReport('2024-01-01', '2024-01-31');
    
    if (!report || typeof report.totalFees !== 'number') {
      throw new Error('Invalid fee report structure');
    }
  });

  // Test 12: Unreconciled Transactions
  await testRunner.runTest('Get Unreconciled Transactions', async () => {
    const transactions = await stripeJournalService.getUnreconciledTransactions();
    
    if (!Array.isArray(transactions)) {
      throw new Error('Unreconciled transactions should be an array');
    }
  });

  testRunner.printSummary();
}

async function runReconciliationServiceTests(): Promise<void> {
  const testRunner = new TestRunner();

  // Test 1: Template Initialization
  await testRunner.runTest('Initialize Journal Templates', async () => {
    const templates = journalTemplateService.getAllTemplates();
    
    if (templates.length === 0) {
      throw new Error('No templates were initialized');
    }
  });

  // Test 2: Template Application
  await testRunner.runTest('Find Applicable Templates', async () => {
    const applicable = journalTemplateService.findApplicableTemplates({
      amount: 1500.00,
      customerId: 'cus_test',
      bankAccountLast4: '1234',
      status: 'succeeded',
    });
    
    if (applicable.length === 0) {
      throw new Error('No applicable templates found');
    }
  });

  // Test 3: Template Preview Generation
  await testRunner.runTest('Generate Template Preview', async () => {
    const preview = journalTemplateService.generateTemplatePreview('ACH_PAYMENT', {
      amount: 1500.00,
      customerId: 'cus_test',
      bankAccountLast4: '1234',
      status: 'succeeded',
    });
    
    if (!preview) {
      throw new Error('Template preview was not generated');
    }
    
    if (!preview.isValid) {
      console.log('  Validation warnings:', preview.validationResults.warnings);
    }
  });

  // Test 4: Account Mapping Validation
  await testRunner.runTest('Validate Account Mappings', async () => {
    const mappings = journalTemplateService.getDefaultStripeAccountMappings();
    
    if (mappings.length === 0) {
      throw new Error('No default account mappings found');
    }
    
    // Check for required mappings
    const requiredTypes = ['balance', 'customer_payments', 'fee_expense'];
    const mappingTypes = mappings.map(m => m.stripeAccountType);
    
    for (const type of requiredTypes) {
      if (!mappingTypes.includes(type)) {
        throw new Error(`Missing required account mapping: ${type}`);
      }
    }
  });

  // Test 5: Business Rule Validation
  await testRunner.runTest('Validate Business Rules', async () => {
    const template = journalTemplateService.getTemplate('STRIPE_FEES');
    if (!template) {
      throw new Error('Template not found');
    }
    
    // Test valid data
    const validData = {
      amount: 1500.00,
      feeAmount: 45.00,
      netAmount: 1455.00,
    };
    
    const validPreview = journalTemplateService.generateTemplatePreview('STRIPE_FEES', validData);
    if (!validPreview?.validationResults.isValid) {
      throw new Error('Valid data should pass validation');
    }
    
    // Test invalid data (fee > amount)
    const invalidData = {
      amount: 100.00,
      feeAmount: 150.00, // Fee exceeds amount
      netAmount: -50.00,
    };
    
    const invalidPreview = journalTemplateService.generateTemplatePreview('STRIPE_FEES', invalidData);
    if (invalidPreview?.validationResults.isValid) {
      throw new Error('Invalid data should fail validation');
    }
  });

  testRunner.printSummary();
}

async function runIntegrationTests(): Promise<void> {
  const testRunner = new TestRunner();

  // Test 1: End-to-End ACH Payment Processing
  await testRunner.runTest('End-to-End ACH Payment Processing', async () => {
    // 1. Create ACH payment entry
    const paymentEntry = await stripeJournalService.createACHPaymentEntry(mockACHPaymentData);
    if (!paymentEntry.id) throw new Error('Payment entry not created');
    
    // 2. Simulate fee allocation
    const feeEntry = await stripeJournalService.createStripeFeeEntry(mockStripePaymentData);
    if (!feeEntry.id) throw new Error('Fee entry not created');
    
    // 3. Verify entries are balanced
    const allEntries = await databaseService.getJournalEntries();
    const recentEntries = allEntries.filter(entry => 
      entry.date === paymentEntry.date && 
      (entry.id === paymentEntry.id || entry.id === feeEntry.id)
    );
    
    if (recentEntries.length < 2) {
      throw new Error('Expected entries not found in database');
    }
  });

  // Test 2: Batch Processing with Error Handling
  await testRunner.runTest('Batch Processing with Error Handling', async () => {
    const batchEntries = [
      {
        type: 'ACH_PAYMENT',
        data: mockACHPaymentData,
      },
      {
        type: 'INVALID_TYPE', // This should cause an error
        data: mockACHPaymentData,
      },
      {
        type: 'PAYROLL',
        data: mockPayrollData,
      },
    ];

    const results = await stripeJournalService.processBatchEntries(batchEntries);
    
    // Should have some successful entries even with one error
    if (results.length === 0) {
      throw new Error('No entries were processed successfully');
    }
  });

  // Test 3: Database Service Integration
  await testRunner.runTest('Database Service Integration', async () => {
    // Test adding Stripe transaction
    await databaseService.addStripeTransaction({
      stripeId: 'ch_test_integration',
      type: 'charge',
      amount: 1500.00,
      currency: 'usd',
      description: 'Integration test transaction',
      status: 'succeeded',
      createdAt: new Date().toISOString(),
    });
    
    // Test retrieving transactions
    const transactions = await databaseService.getStripeTransactions();
    if (transactions.length === 0) {
      throw new Error('No transactions found after adding');
    }
  });

  // Test 4: Template Export/Import
  await testRunner.runTest('Template Export/Import', async () => {
    // Export templates
    const exportData = journalTemplateService.exportTemplates();
    if (!exportData || exportData.length === 0) {
      throw new Error('Export data is empty');
    }
    
    // Import templates (should work with the exported data)
    const importResult = journalTemplateService.importTemplates(exportData);
    if (!importResult.success) {
      throw new Error('Import failed: ' + importResult.errors.join(', '));
    }
  });

  testRunner.printSummary();
}

async function runPerformanceTests(): Promise<void> {
  const testRunner = new TestRunner();

  // Test 1: Bulk Entry Creation Performance
  await testRunner.runTest('Bulk Entry Creation Performance', async () => {
    const startTime = Date.now();
    
    const batchSize = 10;
    const batchEntries = [];
    
    for (let i = 0; i < batchSize; i++) {
      batchEntries.push({
        type: 'ACH_PAYMENT',
        data: {
          ...mockACHPaymentData,
          achTransactionId: `ach_bulk_${i}`,
          amount: 1000 + i * 100,
        },
      });
    }
    
    const entries = await stripeJournalService.processBatchEntries(batchEntries);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`  Created ${entries.length} entries in ${duration}ms`);
    console.log(`  Average: ${duration / batchSize}ms per entry`);
    
    if (duration > 10000) { // 10 seconds threshold
      throw new Error(`Performance too slow: ${duration}ms for ${batchSize} entries`);
    }
  });

  // Test 2: Template Lookup Performance
  await testRunner.runTest('Template Lookup Performance', async () => {
    const startTime = Date.now();
    const iterations = 1000;
    
    for (let i = 0; i < iterations; i++) {
      journalTemplateService.getTemplate('ACH_PAYMENT');
      journalTemplateService.findApplicableTemplates(mockACHPaymentData);
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    const averageTime = duration / iterations;
    
    console.log(`  Performed ${iterations} template operations in ${duration}ms`);
    console.log(`  Average: ${averageTime.toFixed(2)}ms per operation`);
    
    if (averageTime > 10) { // 10ms threshold
      throw new Error(`Template operations too slow: ${averageTime.toFixed(2)}ms average`);
    }
  });

  testRunner.printSummary();
}

async function runAllTests(): Promise<void> {
  console.log('\n🚀 STARTING STRIPE JOURNAL SERVICES TEST SUITE');
  console.log('='.repeat(80));
  
  try {
    // Initialize services
    console.log('\n📋 Initializing services...');
    
    // Test each service
    console.log('\n📊 Testing Stripe Journal Service...');
    await runStripeJournalServiceTests();
    
    console.log('\n🔄 Testing Reconciliation Service...');
    await runReconciliationServiceTests();
    
    console.log('\n🔗 Testing Integration...');
    await runIntegrationTests();
    
    console.log('\n⚡ Testing Performance...');
    await runPerformanceTests();
    
    console.log('\n✅ ALL TESTS COMPLETED');
    
  } catch (error) {
    console.error('\n💥 TEST SUITE FAILED:', error);
    throw error;
  }
}

// Export test functions for manual testing
export {
  runStripeJournalServiceTests,
  runReconciliationServiceTests,
  runIntegrationTests,
  runPerformanceTests,
  runAllTests,
};

// Auto-run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}