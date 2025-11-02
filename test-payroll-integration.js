/**
 * Payroll Integration Testing Suite
 * 
 * Comprehensive tests for payroll integration including:
 * - Employee data synchronization
 * - Payroll calculation and journal entry creation
 * - Direct deposit allocation and tracking
 * - Payroll tax calculations and compliance
 * - Integration with existing payroll features
 * - Reporting and analytics for payroll
 * 
 * Updated: 2025-11-02
 */

import { directDepositService } from './services/directDepositService';
import { feeTrackingService } from './services/feeTrackingService';

// Mock employee data
const mockEmployees = [
  {
    employeeId: 'EMP001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@company.com',
    position: 'Software Engineer',
    department: 'Engineering',
    hireDate: '2023-01-15',
    employmentStatus: 'active',
    salary: 95000,
    paySchedule: 'biweekly',
    taxStatus: 'single',
    deductions: {
      federal: 0.22,
      state: 0.05,
      medicare: 0.0145,
      social_security: 0.062
    },
    bankAccount: {
      accountId: 'ba_test_1111',
      routingNumber: '123456789',
      accountNumber: '987654321',
      accountType: 'checking'
    }
  },
  {
    employeeId: 'EMP002',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@company.com',
    position: 'Marketing Manager',
    department: 'Marketing',
    hireDate: '2022-06-01',
    employmentStatus: 'active',
    salary: 75000,
    paySchedule: 'monthly',
    taxStatus: 'married',
    deductions: {
      federal: 0.18,
      state: 0.04,
      medicare: 0.0145,
      social_security: 0.062
    },
    bankAccount: {
      accountId: 'ba_test_2222',
      routingNumber: '987654321',
      accountNumber: '123456789',
      accountType: 'savings'
    }
  },
  {
    employeeId: 'EMP003',
    firstName: 'Bob',
    lastName: 'Johnson',
    email: 'bob.johnson@company.com',
    position: 'Sales Representative',
    department: 'Sales',
    hireDate: '2024-03-01',
    employmentStatus: 'active',
    baseSalary: 50000,
    commission: 0.05,
    paySchedule: 'weekly',
    taxStatus: 'single',
    deductions: {
      federal: 0.20,
      state: 0.05,
      medicare: 0.0145,
      social_security: 0.062
    },
    bankAccount: {
      accountId: 'ba_test_3333',
      routingNumber: '555666777',
      accountNumber: '888999000',
      accountType: 'checking'
    }
  }
];

// Mock payroll period
const mockPayrollPeriod = {
  periodId: 'PR2025-11-001',
  startDate: '2025-10-16',
  endDate: '2025-10-31',
  payDate: '2025-11-01',
  paySchedule: 'biweekly',
  timezone: 'America/New_York'
};

// Test result tracking
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

  printSummary(): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 PAYROLL INTEGRATION TEST SUMMARY');
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

async function runEmployeeDataSyncTests(): Promise<void> {
  const testRunner = new TestRunner();

  // Test 1: Employee Record Synchronization
  await testRunner.runTest('Synchronize Employee Records', async () => {
    const syncResults = [];

    for (const employee of mockEmployees) {
      const syncResult = await this.syncEmployeeRecord(employee);
      syncResults.push(syncResult);
    }

    if (syncResults.length !== mockEmployees.length) {
      throw new Error('Not all employee records synchronized');
    }

    const successfulSyncs = syncResults.filter(r => r.success);
    if (successfulSyncs.length !== mockEmployees.length) {
      throw new Error('Some employee records failed to sync');
    }
  });

  // Test 2: Employee Status Changes
  await testRunner.runTest('Handle Employee Status Changes', async () => {
    const statusChanges = [
      { employeeId: 'EMP001', oldStatus: 'active', newStatus: 'terminated', effectiveDate: '2025-10-30' },
      { employeeId: 'EMP004', oldStatus: 'terminated', newStatus: 'active', effectiveDate: '2025-11-01' },
      { employeeId: 'EMP002', oldStatus: 'active', newStatus: 'leave', effectiveDate: '2025-11-01' }
    ];

    for (const change of statusChanges) {
      const result = await this.handleEmployeeStatusChange(change);
      
      if (change.oldStatus === 'active' && change.newStatus === 'terminated') {
        // Should prevent new payroll entries but allow pending payments
        if (result.canCreateNewEntries) {
          throw new Error('Should not allow new payroll entries for terminated employee');
        }
      }
    }
  });

  // Test 3: Salary/Benefits Changes
  await testRunner.runTest('Process Salary and Benefits Changes', async () => {
    const salaryChanges = [
      { employeeId: 'EMP001', oldSalary: 95000, newSalary: 100000, effectiveDate: '2025-11-01', reason: 'annual_review' },
      { employeeId: 'EMP002', oldSalary: 75000, newSalary: 80000, effectiveDate: '2025-11-01', reason: 'promotion' }
    ];

    for (const change of salaryChanges) {
      const result = await this.processSalaryChange(change);
      
      if (!result.success) {
        throw new Error(`Salary change failed for ${change.employeeId}`);
      }

      if (result.requiresPayrollReview && change.newSalary > change.oldSalary * 1.2) {
        throw new Error('Large salary increase should require approval');
      }
    }
  });

  // Test 4: Multi-pay Schedule Handling
  await testRunner.runTest('Handle Multiple Pay Schedules', async () => {
    const paySchedules = ['weekly', 'biweekly', 'semimonthly', 'monthly'];
    const employeesBySchedule = {};

    for (const schedule of paySchedules) {
      const employees = mockEmployees.filter(emp => emp.paySchedule === schedule);
      employeesBySchedule[schedule] = employees.length;
    }

    // Verify all schedules are handled
    if (Object.keys(employeesBySchedule).length !== paySchedules.length) {
      throw new Error('Not all pay schedules processed');
    }

    // Verify employee distribution
    const totalEmployees = Object.values(employeesBySchedule).reduce((sum, count) => sum + count, 0);
    if (totalEmployees !== mockEmployees.length) {
      throw new Error('Employee count mismatch across schedules');
    }
  });

  // Test 5: Employee Validation
  await testRunner.runTest('Validate Employee Data', async () => {
    const validationResults = [];

    for (const employee of mockEmployees) {
      const validation = await this.validateEmployeeData(employee);
      validationResults.push(validation);
    }

    const validEmployees = validationResults.filter(v => v.isValid);
    if (validEmployees.length !== mockEmployees.length) {
      throw new Error('Not all employees have valid data');
    }

    // Check for required fields
    for (const result of validationResults) {
      const requiredFields = ['employeeId', 'email', 'bankAccount', 'salary'];
      const missingFields = requiredFields.filter(field => !result.hasField(field));
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }
    }
  });

  testRunner.printSummary();
}

async function runPayrollCalculationTests(): Promise<void> {
  const testRunner = new TestRunner();

  // Test 1: Gross to Net Calculation
  await testRunner.runTest('Calculate Gross to Net Payroll', async () => {
    for (const employee of mockEmployees) {
      const grossAmount = this.calculateGrossAmount(employee, mockPayrollPeriod);
      const taxes = this.calculateTaxes(employee, grossAmount);
      const deductions = this.calculateDeductions(employee, grossAmount);
      const netAmount = grossAmount - taxes.totalTax - deductions.totalDeductions;

      if (netAmount < 0) {
        throw new Error(`Negative net amount calculated for ${employee.employeeId}`);
      }

      const effectiveRate = (grossAmount - netAmount) / grossAmount;
      if (effectiveRate > 0.5 || effectiveRate < 0.2) {
        throw new Error(`Effective tax rate outside expected range for ${employee.employeeId}`);
      }

      console.log(`  ${employee.employeeId}: Gross=$${grossAmount.toFixed(2)}, Net=$${netAmount.toFixed(2)}, Rate=${(effectiveRate * 100).toFixed(1)}%`);
    }
  });

  // Test 2: Commission Calculation
  await testRunner.runTest('Calculate Commission-Based Pay', async () => {
    const commissionEmployee = mockEmployees.find(emp => emp.employeeId === 'EMP003');
    
    if (!commissionEmployee) {
      throw new Error('Commission employee not found');
    }

    const grossSales = 50000; // $50k in sales
    const commission = grossSales * commissionEmployee.commission;
    const basePay = this.calculateGrossAmount(commissionEmployee, mockPayrollPeriod);
    const totalGross = basePay + commission;

    if (commission !== 2500) {
      throw new Error(`Commission calculation incorrect: expected $2500, got $${commission}`);
    }

    console.log(`  Commission: $${commission.toFixed(2)} on $${grossSales.toLocaleString()} sales`);
  });

  // Test 3: Overtime Calculation
  await testRunner.runTest('Calculate Overtime Pay', async () => {
    const overtimeData = {
      employeeId: 'EMP004',
      hoursWorked: 50, // 10 hours overtime
      hourlyRate: 25.00,
      overtimeRate: 37.50, // 1.5x regular rate
      regularHours: 40,
      overtimeHours: 10
    };

    const regularPay = overtimeData.regularHours * overtimeData.hourlyRate;
    const overtimePay = overtimeData.overtimeHours * overtimeData.overtimeRate;
    const totalGross = regularPay + overtimePay;

    if (regularPay !== 1000) {
      throw new Error('Regular pay calculation incorrect');
    }

    if (overtimePay !== 375) {
      throw new Error('Overtime pay calculation incorrect');
    }

    console.log(`  Overtime: Regular=$${regularPay.toFixed(2)}, OT=$${overtimePay.toFixed(2)}`);
  });

  // Test 4: Tax Calculation Accuracy
  await testRunner.runTest('Calculate Payroll Taxes', async () => {
    const employee = mockEmployees[0];
    const grossAmount = this.calculateGrossAmount(employee, mockPayrollPeriod);
    
    const taxBreakdown = this.calculateTaxes(employee, grossAmount);
    
    // Verify federal tax
    const expectedFederal = grossAmount * employee.deductions.federal;
    if (Math.abs(taxBreakdown.federal - expectedFederal) > 0.01) {
      throw new Error('Federal tax calculation mismatch');
    }

    // Verify FICA taxes
    const expectedMedicare = grossAmount * employee.deductions.medicare;
    const expectedSS = grossAmount * employee.deductions.social_security;
    
    if (Math.abs(taxBreakdown.medicare - expectedMedicare) > 0.01) {
      throw new Error('Medicare tax calculation mismatch');
    }

    if (Math.abs(taxBreakdown.social_security - expectedSS) > 0.01) {
      throw new Error('Social Security tax calculation mismatch');
    }

    console.log(`  Tax breakdown for ${employee.employeeId}: Fed=$${taxBreakdown.federal.toFixed(2)}, SS=$${taxBreakdown.social_security.toFixed(2)}, Medicare=$${taxBreakdown.medicare.toFixed(2)}`);
  });

  // Test 5: Journal Entry Creation
  await testRunner.runTest('Create Payroll Journal Entries', async () => {
    for (const employee of mockEmployees) {
      const grossAmount = this.calculateGrossAmount(employee, mockPayrollPeriod);
      const taxes = this.calculateTaxes(employee, grossAmount);
      const netAmount = grossAmount - taxes.totalTax;

      const journalEntry = {
        date: mockPayrollPeriod.payDate,
        description: `Payroll ${employee.employeeId} - ${mockPayrollPeriod.periodId}`,
        lines: [
          { accountId: 5201, type: 'DEBIT', description: 'Payroll Expense', amount: grossAmount },
          { accountId: 2102, type: 'CREDIT', description: 'Federal Tax Payable', amount: taxes.federal },
          { accountId: 2103, type: 'CREDIT', description: 'State Tax Payable', amount: taxes.state },
          { accountId: 2104, type: 'CREDIT', description: 'Social Security Payable', amount: taxes.social_security },
          { accountId: 2105, type: 'CREDIT', description: 'Medicare Payable', amount: taxes.medicare },
          { accountId: 2101, type: 'CREDIT', description: 'Direct Deposit Payable', amount: netAmount }
        ]
      };

      // Validate journal entry
      const totalDebits = journalEntry.lines.filter(l => l.type === 'DEBIT').reduce((sum, l) => sum + l.amount, 0);
      const totalCredits = journalEntry.lines.filter(l => l.type === 'CREDIT').reduce((sum, l) => sum + l.amount, 0);

      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        throw new Error(`Unbalanced journal entry for ${employee.employeeId}`);
      }
    }
  });

  testRunner.printSummary();
}

async function runDirectDepositAllocationTests(): Promise<void> {
  const testRunner = new TestRunner();

  // Test 1: Direct Deposit Allocation per Employee
  await testRunner.runTest('Allocate Direct Deposits per Employee', async () => {
    const directDepositAllocations = [];

    for (const employee of mockEmployees) {
      const grossAmount = this.calculateGrossAmount(employee, mockPayrollPeriod);
      const taxes = this.calculateTaxes(employee, grossAmount);
      const netAmount = grossAmount - taxes.totalTax;

      const allocation = {
        employeeId: employee.employeeId,
        grossAmount,
        netAmount,
        bankAccountId: employee.bankAccount.accountId,
        directDepositAmount: netAmount, // 100% direct deposit for this test
        status: 'ready_for_processing'
      };

      directDepositAllocations.push(allocation);
    }

    if (directDepositAllocations.length !== mockEmployees.length) {
      throw new Error('Direct deposit allocation count mismatch');
    }

    const totalDirectDeposits = directDepositAllocations.reduce((sum, alloc) => sum + alloc.directDepositAmount, 0);
    const expectedTotal = mockEmployees.reduce((sum, emp) => {
      const gross = this.calculateGrossAmount(emp, mockPayrollPeriod);
      const taxes = this.calculateTaxes(emp, gross);
      return sum + (gross - taxes.totalTax);
    }, 0);

    if (Math.abs(totalDirectDeposits - expectedTotal) > 0.01) {
      throw new Error('Total direct deposit amount mismatch');
    }

    console.log(`  Total direct deposits: $${totalDirectDeposits.toFixed(2)} for ${directDepositAllocations.length} employees`);
  });

  // Test 2: Partial Direct Deposit Allocation
  await testRunner.runTest('Handle Partial Direct Deposits', async () => {
    const partialAllocation = {
      employeeId: 'EMP005',
      grossAmount: 5000,
      allocations: [
        { accountId: 'checking', percentage: 80, amount: 4000 },
        { accountId: 'savings', percentage: 20, amount: 1000 }
      ]
    };

    const totalAllocated = partialAllocation.allocations.reduce((sum, alloc) => sum + alloc.amount, 0);
    const netAmount = partialAllocation.grossAmount - (partialAllocation.grossAmount * 0.25); // Assume 25% taxes

    if (Math.abs(totalAllocated - netAmount) > 0.01) {
      throw new Error('Partial allocation amounts do not sum to net pay');
    }

    // Verify percentages sum to 100%
    const totalPercentage = partialAllocation.allocations.reduce((sum, alloc) => sum + alloc.percentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new Error('Allocation percentages do not sum to 100%');
    }
  });

  // Test 3: Batch Direct Deposit Processing
  await testRunner.runTest('Process Batch Direct Deposits', async () => {
    const batchDeposits = [];

    for (const employee of mockEmployees) {
      const grossAmount = this.calculateGrossAmount(employee, mockPayrollPeriod);
      const taxes = this.calculateTaxes(employee, grossAmount);
      const netAmount = grossAmount - taxes.totalTax;

      batchDeposits.push({
        recipientId: `acct_${employee.employeeId.toLowerCase()}`,
        employeeId: employee.employeeId,
        amount: netAmount,
        description: `${employee.firstName} ${employee.lastName} - ${mockPayrollPeriod.periodId}`,
        payPeriodStart: mockPayrollPeriod.startDate,
        payPeriodEnd: mockPayrollPeriod.endDate,
        bankAccountId: employee.bankAccount.accountId,
        purpose: 'salary' as const
      });
    }

    const batchRequest = {
      deposits: batchDeposits,
      batchDescription: `Payroll ${mockPayrollPeriod.periodId}`,
      scheduledDate: mockPayrollPeriod.payDate,
      payPeriodStart: mockPayrollPeriod.startDate,
      payPeriodEnd: mockPayrollPeriod.endDate
    };

    const result = await directDepositService.processDirectDepositBatch(batchRequest);

    if (!result.success) {
      throw new Error(`Batch processing failed: ${JSON.stringify(result.failedDeposits)}`);
    }

    if (result.successfulDeposits !== mockEmployees.length) {
      throw new Error(`Expected ${mockEmployees.length} successful deposits, got ${result.successfulDeposits}`);
    }

    console.log(`  Batch processed: ${result.successfulDeposits}/${mockEmployees.length} successful`);
    console.log(`  Total amount: $${result.totalAmount.toFixed(2)}`);
    console.log(`  Total fees: $${(result.totalFees / 100).toFixed(2)}`);
  });

  // Test 4: Direct Deposit Failure Recovery
  await testRunner.runTest('Handle Direct Deposit Failures', async () => {
    const mixedResults = {
      successful: ['EMP001', 'EMP003'],
      failed: [
        { employeeId: 'EMP002', reason: 'insufficient_funds' },
        { employeeId: 'EMP004', reason: 'account_closed' }
      ]
    };

    const recoveryActions = [];
    
    for (const failure of mixedResults.failed) {
      const action = this.determineRecoveryAction(failure.reason);
      recoveryActions.push(action);
    }

    // Verify appropriate actions were taken
    const insufficientFundsAction = recoveryActions.find(a => a.reason === 'insufficient_funds');
    if (!insufficientFundsAction || insufficientFundsAction.action !== 'retry') {
      throw new Error('Insufficient funds should trigger retry');
    }

    const accountClosedAction = recoveryActions.find(a => a.reason === 'account_closed');
    if (!accountClosedAction || accountClosedAction.action !== 'update_bank_account') {
      throw new Error('Account closed should require bank account update');
    }
  });

  // Test 5: Direct Deposit Tracking
  await testRunner.runTest('Track Direct Deposit Status', async () => {
    const trackingData = [
      { employeeId: 'EMP001', status: 'paid', timestamp: new Date(), amount: 3847.50 },
      { employeeId: 'EMP002', status: 'in_transit', timestamp: new Date(), amount: 3022.50 },
      { employeeId: 'EMP003', status: 'pending', timestamp: new Date(), amount: 4235.00 }
    ];

    for (const track of trackingData) {
      const statusValid = ['pending', 'in_transit', 'paid', 'failed'].includes(track.status);
      if (!statusValid) {
        throw new Error(`Invalid status: ${track.status}`);
      }

      if (track.amount <= 0) {
        throw new Error('Invalid tracking amount');
      }
    }

    const statusCounts = trackingData.reduce((counts, track) => {
      counts[track.status] = (counts[track.status] || 0) + 1;
      return counts;
    }, {});

    console.log('  Status distribution:', statusCounts);
  });

  testRunner.printSummary();
}

async function runComplianceReportingTests(): Promise<void> {
  const testRunner = new TestRunner();

  // Test 1: Tax Compliance Reporting
  await testRunner.runTest('Generate Tax Compliance Reports', async () => {
    const taxReports = [];
    
    for (const employee of mockEmployees) {
      const grossAmount = this.calculateGrossAmount(employee, mockPayrollPeriod);
      const taxes = this.calculateTaxes(employee, grossAmount);
      
      taxReports.push({
        employeeId: employee.employeeId,
        federalTax: taxes.federal,
        stateTax: taxes.state,
        socialSecurity: taxes.social_security,
        medicare: taxes.medicare,
        totalTax: taxes.totalTax,
        quarter: 'Q4',
        year: 2025
      });
    }

    const totalFederalTax = taxReports.reduce((sum, report) => sum + report.federalTax, 0);
    const totalSSTax = taxReports.reduce((sum, report) => sum + report.socialSecurity, 0);
    const totalMedicare = taxReports.reduce((sum, report) => sum + report.medicare, 0);

    // Verify reporting accuracy
    if (totalFederalTax <= 0 || totalSSTax <= 0 || totalMedicare <= 0) {
      throw new Error('Tax reporting totals invalid');
    }

    console.log(`  Federal tax: $${totalFederalTax.toFixed(2)}`);
    console.log(`  Social Security: $${totalSSTax.toFixed(2)}`);
    console.log(`  Medicare: $${totalMedicare.toFixed(2)}`);
  });

  // Test 2: Annual W-2 Preparation
  await testRunner.runTest('Prepare W-2 Forms', async () => {
    const yearToDate = {
      year: 2025,
      quarter: 'Q4',
      employees: [
        { employeeId: 'EMP001', totalGross: 95000, totalTax: 23750, totalNet: 71250 },
        { employeeId: 'EMP002', totalGross: 75000, totalTax: 18750, totalNet: 56250 },
        { employeeId: 'EMP003', totalGross: 65000, totalTax: 16250, totalNet: 48750 }
      ]
    };

    for (const emp of yearToDate.employees) {
      const w2Data = this.prepareW2Data(emp);
      
      // Validate W-2 data
      if (w2Data.box1 < w2Data.box16 || w2Data.box2 > w2Data.box1) {
        throw new Error(`Invalid W-2 data for ${emp.employeeId}`);
      }

      if (w2Data.box3 !== w2Data.box1) {
        throw new Error(`Social Security wages should equal federal wages for ${emp.employeeId}`);
      }
    }
  });

  // Test 3: Audit Trail Creation
  await testRunner.runTest('Create Comprehensive Audit Trail', async () => {
    const auditEvents = [
      { action: 'payroll_created', actor: 'system', timestamp: new Date(), details: { periodId: mockPayrollPeriod.periodId } },
      { action: 'employee_added', actor: 'hr_user', timestamp: new Date(), details: { employeeId: 'EMP006' } },
      { action: 'salary_changed', actor: 'hr_manager', timestamp: new Date(), details: { employeeId: 'EMP001', old: 95000, new: 100000 } },
      { action: 'direct_deposit_processed', actor: 'system', timestamp: new Date(), details: { batchId: 'batch_001', count: 3 } }
    ];

    for (const event of auditEvents) {
      const auditRecord = await this.createAuditRecord(event);
      
      if (!auditRecord.id || !auditRecord.timestamp) {
        throw new Error('Audit record missing required fields');
      }

      if (!auditRecord.unchangeable) {
        throw new Error('Audit records should be unchangeable');
      }
    }

    console.log(`  Created ${auditEvents.length} audit records`);
  });

  // Test 4: Regulatory Compliance Checks
  await testRunner.runTest('Perform Regulatory Compliance Checks', async () => {
    const complianceChecks = [
      { type: 'minimum_wage', threshold: 15.00, result: 'pass' },
      { type: 'overtime_calculation', threshold: 1.5, result: 'pass' },
      { type: 'tax_withholding', threshold: 0.50, result: 'pass' },
      { type: 'record_retention', threshold: 7, result: 'pass' }
    ];

    for (const check of complianceChecks) {
      const complianceResult = await this.performComplianceCheck(check.type, check.threshold);
      
      if (complianceResult.result !== check.result) {
        throw new Error(`Compliance check ${check.type} failed`);
      }

      if (!complianceResult.timestamp || !complianceResult.checkId) {
        throw new Error('Compliance check missing required fields');
      }
    }

    console.log(`  Completed ${complianceChecks.length} compliance checks`);
  });

  testRunner.printSummary();
}

async function runIntegrationReportingTests(): Promise<void> {
  const testRunner = new TestRunner();

  // Test 1: Payroll Dashboard Metrics
  await testRunner.runTest('Generate Payroll Dashboard Metrics', async () => {
    const metrics = await this.generatePayrollMetrics(mockPayrollPeriod);
    
    const requiredMetrics = [
      'totalGross',
      'totalNet',
      'totalEmployees',
      'averageSalary',
      'taxBreakdown',
      'departmentBreakdown'
    ];

    for (const metric of requiredMetrics) {
      if (!(metric in metrics)) {
        throw new Error(`Missing required metric: ${metric}`);
      }
    }

    if (metrics.totalEmployees !== mockEmployees.length) {
      throw new Error('Employee count mismatch in metrics');
    }

    console.log('  Dashboard metrics generated successfully');
  });

  // Test 2: Historical Trend Analysis
  await testRunner.runTest('Analyze Historical Payroll Trends', async () => {
    const trendData = [];
    
    // Simulate 12 months of data
    for (let month = 1; month <= 12; month++) {
      trendData.push({
        month: `2025-${month.toString().padStart(2, '0')}`,
        totalPayroll: 50000 + (month * 2000), // Growing payroll
        employeeCount: 3 + Math.floor(month / 4),
        averageSalary: 60000 + (month * 1000)
      });
    }

    // Calculate trend analysis
    const trendAnalysis = this.analyzePayrollTrends(trendData);
    
    if (!trendAnalysis.growthRate || !trendAnalysis.projectedNextYear) {
      throw new Error('Trend analysis incomplete');
    }

    console.log(`  Annual growth rate: ${(trendAnalysis.growthRate * 100).toFixed(1)}%`);
    console.log(`  Projected next year: $${trendAnalysis.projectedNextYear.toLocaleString()}`);
  });

  // Test 3: Cost Allocation Reporting
  await testRunner.runTest('Generate Cost Allocation Reports', async () => {
    const costAllocation = this.calculateCostAllocation(mockEmployees, mockPayrollPeriod);
    
    const departments = ['Engineering', 'Marketing', 'Sales'];
    for (const dept of departments) {
      const deptCost = costAllocation[dept];
      if (!deptCost || deptCost.total <= 0) {
        throw new Error(`Missing cost data for ${dept}`);
      }
    }

    const totalCost = Object.values(costAllocation).reduce((sum, dept) => sum + dept.total, 0);
    const expectedTotal = mockEmployees.reduce((sum, emp) => {
      const gross = this.calculateGrossAmount(emp, mockPayrollPeriod);
      const taxes = this.calculateTaxes(emp, gross);
      return sum + gross + taxes.totalTax;
    }, 0);

    if (Math.abs(totalCost - expectedTotal) > 0.01) {
      throw new Error('Cost allocation total mismatch');
    }

    console.log('  Cost allocation by department:');
    Object.entries(costAllocation).forEach(([dept, data]) => {
      console.log(`    ${dept}: $${data.total.toFixed(2)} (${data.employeeCount} employees)`);
    });
  });

  testRunner.printSummary();
}

// Helper functions (would be implemented in production)
function calculateGrossAmount(employee, period) {
  if (employee.salary) {
    // Annual salary
    const annualSalary = employee.salary;
    switch (employee.paySchedule) {
      case 'weekly': return annualSalary / 52;
      case 'biweekly': return annualSalary / 26;
      case 'semimonthly': return annualSalary / 24;
      case 'monthly': return annualSalary / 12;
      default: return annualSalary / 12;
    }
  } else if (employee.baseSalary) {
    // Base + commission
    const baseAnnual = employee.baseSalary;
    const basePay = baseAnnual / (employee.paySchedule === 'weekly' ? 52 : 26);
    const commission = 2500; // Mock commission
    return basePay + commission;
  }
  return 0;
}

function calculateTaxes(employee, grossAmount) {
  return {
    federal: grossAmount * employee.deductions.federal,
    state: grossAmount * employee.deductions.state,
    social_security: grossAmount * employee.deductions.social_security,
    medicare: grossAmount * employee.deductions.medicare,
    totalTax: grossAmount * (employee.deductions.federal + employee.deductions.state + 
                              employee.deductions.social_security + employee.deductions.medicare)
  };
}

function calculateDeductions(employee, grossAmount) {
  // Mock additional deductions (health insurance, 401k, etc.)
  const healthInsurance = 200;
  const retirement401k = grossAmount * 0.05;
  
  return {
    healthInsurance,
    retirement401k,
    totalDeductions: healthInsurance + retirement401k
  };
}

async function syncEmployeeRecord(employee) {
  return { success: true, employeeId: employee.employeeId, timestamp: new Date() };
}

async function handleEmployeeStatusChange(change) {
  return {
    canCreateNewEntries: change.newStatus === 'active',
    reviewRequired: change.oldStatus === 'active' && change.newStatus !== 'active',
    effectiveDate: change.effectiveDate
  };
}

async function processSalaryChange(change) {
  const requiresApproval = (change.newSalary / change.oldSalary) > 1.2;
  return {
    success: true,
    requiresPayrollReview: requiresApproval,
    effectiveDate: change.effectiveDate
  };
}

async function validateEmployeeData(employee) {
  const requiredFields = ['employeeId', 'email', 'bankAccount', 'salary', 'paySchedule'];
  const hasAllFields = requiredFields.every(field => employee[field] !== undefined);
  
  return {
    isValid: hasAllFields,
    hasField: (field) => employee[field] !== undefined,
    errors: hasAllFields ? [] : requiredFields.filter(f => !employee[f]).map(f => `Missing ${f}`)
  };
}

function determineRecoveryAction(reason) {
  const actions = {
    'insufficient_funds': { action: 'retry', delay: '24h', reason },
    'account_closed': { action: 'update_bank_account', reason },
    'invalid_routing': { action: 'review_required', reason },
    'bank_error': { action: 'retry', delay: '4h', reason }
  };
  return actions[reason] || { action: 'review_required', reason };
}

async function createAuditRecord(event) {
  return {
    id: `audit_${Date.now()}`,
    timestamp: event.timestamp,
    actor: event.actor,
    action: event.action,
    details: event.details,
    unchangeable: true
  };
}

async function performComplianceCheck(type, threshold) {
  // Mock compliance check
  return {
    result: 'pass',
    timestamp: new Date(),
    checkId: `check_${type}`,
    details: { type, threshold, result: 'pass' }
  };
}

async function generatePayrollMetrics(period) {
  const totalGross = mockEmployees.reduce((sum, emp) => sum + calculateGrossAmount(emp, period), 0);
  const totalTax = mockEmployees.reduce((sum, emp) => {
    const gross = calculateGrossAmount(emp, period);
    const taxes = calculateTaxes(emp, gross);
    return sum + taxes.totalTax;
  }, 0);

  return {
    totalGross,
    totalNet: totalGross - totalTax,
    totalEmployees: mockEmployees.length,
    averageSalary: totalGross / mockEmployees.length,
    taxBreakdown: { total: totalTax, rate: totalTax / totalGross },
    departmentBreakdown: {
      Engineering: { count: 1, total: 1836.54 },
      Marketing: { count: 1, total: 1448.08 },
      Sales: { count: 1, total: 1465.38 }
    }
  };
}

function analyzePayrollTrends(trendData) {
  const firstMonth = trendData[0].totalPayroll;
  const lastMonth = trendData[trendData.length - 1].totalPayroll;
  const growthRate = (lastMonth - firstMonth) / firstMonth;
  const projectedNextYear = lastMonth * (1 + growthRate);

  return {
    growthRate,
    projectedNextYear,
    averageGrowth: trendData.reduce((sum, month, i) => {
      if (i === 0) return 0;
      const prevMonth = trendData[i - 1].totalPayroll;
      const currMonth = month.totalPayroll;
      return sum + (currMonth - prevMonth) / prevMonth;
    }, 0) / (trendData.length - 1)
  };
}

function calculateCostAllocation(employees, period) {
  const allocation = {};
  
  for (const employee of employees) {
    const dept = employee.department;
    const gross = calculateGrossAmount(employee, period);
    const taxes = calculateTaxes(employee, gross);
    const total = gross + taxes.totalTax;
    
    if (!allocation[dept]) {
      allocation[dept] = { total: 0, employeeCount: 0 };
    }
    
    allocation[dept].total += total;
    allocation[dept].employeeCount += 1;
  }
  
  return allocation;
}

function prepareW2Data(empYearToDate) {
  return {
    box1: empYearToDate.totalGross, // Federal wages
    box2: empYearToDate.totalTax, // Federal tax withheld
    box3: empYearToDate.totalGross, // Social Security wages
    box4: empYearToDate.totalGross * 0.062, // Social Security tax (6.2%)
    box5: empYearToDate.totalGross, // Medicare wages
    box6: empYearToDate.totalGross * 0.0145, // Medicare tax (1.45%)
    box16: empYearToDate.totalGross, // State wages
    box17: empYearToDate.totalTax * 0.8 // State tax (assume 80% of federal)
  };
}

async function runAllTests(): Promise<void> {
  console.log('\n🚀 STARTING PAYROLL INTEGRATION TEST SUITE');
  console.log('='.repeat(80));
  
  try {
    console.log('\n📋 Initializing test environment...');
    
    console.log('\n👥 Testing Employee Data Synchronization...');
    await runEmployeeDataSyncTests();
    
    console.log('\n💰 Testing Payroll Calculations...');
    await runPayrollCalculationTests();
    
    console.log('\n🏦 Testing Direct Deposit Allocation...');
    await runDirectDepositAllocationTests();
    
    console.log('\n📋 Testing Compliance Reporting...');
    await runComplianceReportingTests();
    
    console.log('\n📊 Testing Integration Reporting...');
    await runIntegrationReportingTests();
    
    console.log('\n✅ ALL PAYROLL INTEGRATION TESTS COMPLETED');
    
  } catch (error) {
    console.error('\n💥 TEST SUITE FAILED:', error);
    throw error;
  }
}

// Export test functions
export {
  runEmployeeDataSyncTests,
  runPayrollCalculationTests,
  runDirectDepositAllocationTests,
  runComplianceReportingTests,
  runIntegrationReportingTests,
  runAllTests,
};

// Auto-run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}
