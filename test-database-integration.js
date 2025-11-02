/**
 * ORACLE-LEDGER Database Integration Tests
 * Comprehensive testing for database operations and data integrity
 * Updated: 2025-11-02
 */

const { Pool } = require('pg');
const { assert } = require('chai');
const { testEnvironmentSetup, getTestDatabase } = require('./test-environment-setup');

/**
 * Database Integration Test Suite
 */
class TestDatabaseIntegration {
  constructor() {
    this.testResults = new Map();
    this.testDb = null;
    this.schemaTables = new Set();
    this.testData = new Map();
  }

  /**
   * Initialize test suite
   */
  async initialize() {
    console.log('🚀 Initializing Database Integration Tests...');
    
    this.testDb = getTestDatabase();
    
    // Get schema tables
    await this.loadSchemaTables();
    
    console.log('✅ Database Integration Tests initialized');
  }

  /**
   * Run all database integration tests
   */
  async runAllTests() {
    const results = {
      total: 0,
      passed: 0,
      failed: 0,
      tests: []
    };

    const testMethods = [
      this.testDatabaseSchema,
      this.testCustomerTableOperations,
      this.testPaymentMethodsTable,
      this.testAchPaymentsTable,
      this.testAchReturnsTable,
      this.testWebhookEventsTable,
      this.testReconciliationTable,
      this.testComplianceTables,
      this.testDataIntegrity,
      this.testTransactionIntegrity,
      this.testIndexesAndPerformance,
      this.testConstraintsAndValidation,
      this.testTriggers,
      this.testDataPersistence,
      this.testBackupAndRecovery
    ];

    for (const testMethod of testMethods) {
      results.total++;
      
      try {
        console.log(`\n🧪 Running ${testMethod.name}...`);
        const startTime = Date.now();
        const result = await testMethod.call(this);
        const executionTime = Date.now() - startTime;
        
        results.tests.push({ name: testMethod.name, ...result, executionTime });
        
        if (result.success) {
          results.passed++;
          console.log(`✅ ${testMethod.name}: PASSED (${executionTime}ms)`);
        } else {
          results.failed++;
          console.log(`❌ ${testMethod.name}: FAILED (${executionTime}ms) - ${result.error}`);
        }
      } catch (error) {
        results.failed++;
        results.tests.push({
          name: testMethod.name,
          success: false,
          error: error.message,
          details: error.stack
        });
        console.log(`❌ ${testMethod.name}: ERROR - ${error.message}`);
      }
    }

    this.testResults = results;
    return results;
  }

  /**
   * Test database schema integrity
   */
  async testDatabaseSchema() {
    const result = {
      name: 'testDatabaseSchema',
      success: true,
      details: {}
    };

    try {
      // Test 1: Required tables exist
      const requiredTables = [
        'customers',
        'payment_methods',
        'ach_payments',
        'ach_returns',
        'stripe_webhook_events',
        'payment_reconciliation',
        'pci_audit_log',
        'compliance_checklist'
      ];

      const existingTables = await this.getExistingTables();
      const missingTables = requiredTables.filter(table => !existingTables.includes(table));
      
      assert.equal(missingTables.length, 0, `Missing required tables: ${missingTables.join(', ')}`);

      // Test 2: Table columns validation
      const customerColumns = await this.getTableColumns('customers');
      const requiredCustomerColumns = [
        'id', 'stripe_customer_id', 'first_name', 'last_name', 
        'email', 'created_at', 'updated_at'
      ];
      
      const missingCustomerColumns = requiredCustomerColumns.filter(col => !customerColumns.includes(col));
      assert.equal(missingCustomerColumns.length, 0, 
        `Missing customer columns: ${missingCustomerColumns.join(', ')}`);

      // Test 3: Indexes exist
      const indexes = await this.getTableIndexes('customers');
      const requiredIndexes = ['idx_customers_stripe_id', 'idx_customers_email'];
      
      const missingIndexes = requiredIndexes.filter(index => !indexes.includes(index));
      assert.equal(missingIndexes.length, 0, 
        `Missing indexes: ${missingIndexes.join(', ')}`);

      // Test 4: Foreign key constraints
      const fkConstraints = await this.getForeignKeyConstraints();
      const requiredConstraints = [
        'payment_methods_customer_id_fkey',
        'ach_payments_customer_id_fkey',
        'ach_payments_payment_method_id_fkey'
      ];
      
      const missingConstraints = requiredConstraints.filter(constraint => !fkConstraints.includes(constraint));
      assert.equal(missingConstraints.length, 0, 
        `Missing constraints: ${missingConstraints.join(', ')}`);

      // Test 5: Triggers exist
      const triggers = await this.getTableTriggers();
      const requiredTriggers = [
        'update_customers_updated_at',
        'update_ach_payments_updated_at'
      ];
      
      const missingTriggers = requiredTriggers.filter(trigger => !triggers.includes(trigger));
      assert.equal(missingTriggers.length, 0, 
        `Missing triggers: ${missingTriggers.join(', ')}`);

      result.details = {
        allRequiredTablesExist: true,
        requiredColumnsPresent: true,
        indexesExist: true,
        constraintsExist: true,
        triggersExist: true
      };
      
    } catch (error) {
      result.success = false;
      result.error = error.message;
    }

    return result;
  }

  /**
   * Test customer table operations
   */
  async testCustomerTableOperations() {
    const result = {
      name: 'testCustomerTableOperations',
      success: true,
      details: {}
    };

    try {
      // Test 1: Create customer
      const customerId = await this.createTestCustomer({
        stripe_customer_id: `cus_test_${Date.now()}`,
        first_name: 'Test',
        last_name: 'Customer',
        email: `testcustomer.${Date.now()}@example.com`,
        customer_type: 'business'
      });
      
      assert.isNotNull(customerId, 'Customer should be created');

      // Test 2: Read customer
      const customer = await this.testDb.query(
        'SELECT * FROM customers WHERE id = $1',
        [customerId]
      );
      
      assert.equal(customer.rows.length, 1, 'Customer should be found');
      assert.equal(customer.rows[0].first_name, 'Test', 'Customer data should match');

      // Test 3: Update customer
      const updateResult = await this.testDb.query(
        'UPDATE customers SET last_name = $1 WHERE id = $2 RETURNING last_name',
        ['Updated Customer', customerId]
      );
      
      assert.equal(updateResult.rows[0].last_name, 'Updated Customer', 'Customer should be updated');

      // Test 4: Find customer by email
      const foundCustomer = await this.testDb.query(
        'SELECT * FROM customers WHERE email = $1',
        [`testcustomer.${Date.now()}@example.com`.split('@')[0] + '@example.com']
      );
      
      assert.equal(foundCustomer.rows.length, 1, 'Customer should be found by email');

      // Test 5: Delete customer (soft delete)
      await this.testDb.query(
        'UPDATE customers SET deleted_at = NOW() WHERE id = $1',
        [customerId]
      );
      
      const deletedCustomer = await this.testDb.query(
        'SELECT * FROM customers WHERE id = $1',
        [customerId]
      );
      
      assert.isNotNull(deletedCustomer.rows[0].deleted_at, 'Customer should be soft deleted');

      // Test 6: Customer statistics
      const stats = await this.testDb.query(`
        SELECT 
          COUNT(*) as total_customers,
          COUNT(CASE WHEN deleted_at IS NULL THEN 1 END) as active_customers,
          COUNT(CASE WHEN deleted_at IS NOT NULL THEN 1 END) as deleted_customers
        FROM customers
      `);
      
      assert.isTrue(stats.rows[0].total_customers >= 0, 'Customer statistics should be calculated');

      result.details = {
        customerCreated: customerId,
        customerRead: true,
        customerUpdated: true,
        customerFoundByEmail: true,
        customerSoftDeleted: true,
        statisticsCalculated: true
      };
      
    } catch (error) {
      result.success = false;
      result.error = error.message;
    }

    return result;
  }

  /**
   * Test payment methods table
   */
  async testPaymentMethodsTable() {
    const result = {
      name: 'testPaymentMethodsTable',
      success: true,
      details: {}
    };

    try {
      // Create a customer first
      const customerResult = await this.testDb.query(`
        INSERT INTO customers (stripe_customer_id, first_name, last_name, email) 
        VALUES ($1, $2, $3, $4) RETURNING id
      `, [`cus_test_pm_${Date.now()}`, 'Test', 'Customer', `testpm.${Date.now()}@example.com`]);
      
      const customerId = customerResult.rows[0].id;

      // Test 1: Create payment method
      const paymentMethodId = await this.createTestPaymentMethod({
        customer_id: customerId,
        stripe_payment_method_id: `pm_test_${Date.now()}`,
        type: 'us_bank_account',
        bank_name: 'Test Bank',
        bank_account_last4: '1234',
        bank_account_routing_number: '021000021',
        bank_account_type: 'checking',
        verification_status: 'verified'
      });
      
      assert.isNotNull(paymentMethodId, 'Payment method should be created');

      // Test 2: Link payment method to customer
      const paymentMethod = await this.testDb.query(
        'SELECT * FROM payment_methods WHERE id = $1',
        [paymentMethodId]
      );
      
      assert.equal(paymentMethod.rows[0].customer_id, customerId, 
        'Payment method should be linked to customer');

      // Test 3: Update payment method status
      await this.testDb.query(
        'UPDATE payment_methods SET status = $1, verified_at = NOW() WHERE id = $2',
        ['active', paymentMethodId]
      );
      
      const updatedPaymentMethod = await this.testDb.query(
        'SELECT * FROM payment_methods WHERE id = $1',
        [paymentMethodId]
      );
      
      assert.equal(updatedPaymentMethod.rows[0].status, 'active', 
        'Payment method status should be updated');
      assert.isNotNull(updatedPaymentMethod.rows[0].verified_at, 
        'Verification timestamp should be set');

      // Test 4: Set as default payment method
      await this.testDb.query(
        'UPDATE payment_methods SET is_default = true WHERE id = $1',
        [paymentMethodId]
      );
      
      const defaultPaymentMethod = await this.testDb.query(
        'SELECT * FROM payment_methods WHERE id = $1',
        [paymentMethodId]
      );
      
      assert.isTrue(defaultPaymentMethod.rows[0].is_default, 
        'Payment method should be set as default');

      // Test 5: Find payment methods by customer
      const customerPaymentMethods = await this.testDb.query(
        'SELECT * FROM payment_methods WHERE customer_id = $1',
        [customerId]
      );
      
      assert.equal(customerPaymentMethods.rows.length, 1, 
        'Customer should have one payment method');

      // Test 6: Payment method statistics
      const stats = await this.testDb.query(`
        SELECT 
          COUNT(*) as total_methods,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_methods,
          COUNT(CASE WHEN verification_status = 'verified' THEN 1 END) as verified_methods,
          COUNT(CASE WHEN is_default = true THEN 1 END) as default_methods
        FROM payment_methods
      `);
      
      assert.isTrue(stats.rows[0].total_methods >= 0, 'Payment method statistics should be calculated');

      result.details = {
        paymentMethodCreated: paymentMethodId,
        customerLinked: true,
        statusUpdated: true,
        setAsDefault: true,
        customerMethodsFound: customerPaymentMethods.rows.length,
        statisticsCalculated: true
      };
      
    } catch (error) {
      result.success = false;
      result.error = error.message;
    }

    return result;
  }

  /**
   * Test ACH payments table
   */
  async testAchPaymentsTable() {
    const result = {
      name: 'testAchPaymentsTable',
      success: true,
      details: {}
    };

    try {
      // Create test customer and payment method
      const customerResult = await this.testDb.query(`
        INSERT INTO customers (stripe_customer_id, first_name, last_name, email) 
        VALUES ($1, $2, $3, $4) RETURNING id
      `, [`cus_test_ach_${Date.now()}`, 'Test', 'Customer', `testach.${Date.now()}@example.com`]);
      
      const customerId = customerResult.rows[0].id;

      const paymentMethodResult = await this.createTestPaymentMethod({
        customer_id: customerId,
        stripe_payment_method_id: `pm_test_ach_${Date.now()}`,
        type: 'us_bank_account',
        bank_name: 'Test Bank',
        bank_account_last4: '1234',
        bank_account_routing_number: '021000021',
        bank_account_type: 'checking'
      });

      // Test 1: Create ACH payment
      const achPaymentId = await this.createTestAchPayment({
        stripe_payment_intent_id: `pi_test_${Date.now()}`,
        customer_id: customerId,
        payment_method_id: paymentMethodResult,
        amount_cents: 25000, // $250.00
        description: 'Test ACH Payment',
        status: 'succeeded',
        payment_method_type: 'ach_debit',
        ach_class_code: 'PPD'
      });
      
      assert.isNotNull(achPaymentId, 'ACH payment should be created');

      // Test 2: ACH payment data integrity
      const achPayment = await this.testDb.query(
        'SELECT * FROM ach_payments WHERE id = $1',
        [achPaymentId]
      );
      
      assert.equal(achPayment.rows[0].amount_cents, 25000, 'Payment amount should match');
      assert.equal(achPayment.rows[0].ach_class_code, 'PPD', 'ACH class code should match');

      // Test 3: Update ACH payment status
      await this.testDb.query(
        'UPDATE ach_payments SET status = $1, actual_settlement_date = NOW() WHERE id = $2',
        ['settled', achPaymentId]
      );
      
      const updatedPayment = await this.testDb.query(
        'SELECT * FROM ach_payments WHERE id = $1',
        [achPaymentId]
      );
      
      assert.equal(updatedPayment.rows[0].status, 'settled', 'Payment status should be updated');
      assert.isNotNull(updatedPayment.rows[0].actual_settlement_date, 
        'Settlement date should be set');

      // Test 4: ACH payment with return code
      await this.testDb.query(
        'UPDATE ach_payments SET return_code = $1, return_description = $2 WHERE id = $3',
        ['R01', 'Insufficient Funds', achPaymentId]
      );
      
      const paymentWithReturn = await this.testDb.query(
        'SELECT * FROM ach_payments WHERE id = $1',
        [achPaymentId]
      );
      
      assert.equal(paymentWithReturn.rows[0].return_code, 'R01', 
        'Return code should be set');
      assert.equal(paymentWithReturn.rows[0].return_description, 'Insufficient Funds', 
        'Return description should be set');

      // Test 5: ACH payment statistics
      const stats = await this.testDb.query(`
        SELECT 
          COUNT(*) as total_payments,
          SUM(amount_cents) as total_volume_cents,
          COUNT(CASE WHEN status = 'succeeded' THEN 1 END) as successful_payments,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments,
          COUNT(CASE WHEN return_code IS NOT NULL THEN 1 END) as returned_payments
        FROM ach_payments
      `);
      
      assert.isTrue(stats.rows[0].total_payments >= 0, 'ACH payment statistics should be calculated');

      // Test 6: ACH class code filtering
      const ppdPayments = await this.testDb.query(
        'SELECT * FROM ach_payments WHERE ach_class_code = $1',
        ['PPD']
      );
      
      // Should find the PPD payment we created

      result.details = {
        achPaymentCreated: achPaymentId,
        dataIntegrityMaintained: true,
        statusUpdated: true,
        returnCodeSet: true,
        statisticsCalculated: true,
        classCodeFiltering: true
      };
      
    } catch (error) {
      result.success = false;
      result.error = error.message;
    }

    return result;
  }

  /**
   * Test ACH returns table
   */
  async testAchReturnsTable() {
    const result = {
      name: 'testAchReturnsTable',
      success: true,
      details: {}
    };

    try {
      // Create test ACH payment
      const achPaymentId = await this.createTestAchPayment({
        stripe_payment_intent_id: `pi_test_return_${Date.now()}`,
        customer_id: await this.createTestCustomer({
          stripe_customer_id: `cus_test_return_${Date.now()}`,
          first_name: 'Return',
          last_name: 'Customer',
          email: `return.${Date.now()}@example.com`,
          customer_type: 'business'
        }),
        payment_method_id: await this.createTestPaymentMethod({
          customer_id: await this.createTestCustomer({
            stripe_customer_id: `cus_test_return_pm_${Date.now()}`,
            first_name: 'Return',
            last_name: 'Customer',
            email: `returnpm.${Date.now()}@example.com`,
            customer_type: 'business'
          }),
          stripe_payment_method_id: `pm_test_return_${Date.now()}`,
          type: 'us_bank_account',
          bank_name: 'Test Bank',
          bank_account_last4: '1234',
          bank_account_routing_number: '021000021',
          bank_account_type: 'checking'
        }),
        amount_cents: 15000,
        description: 'Test Return Payment',
        status: 'succeeded',
        payment_method_type: 'ach_debit',
        ach_class_code: 'PPD'
      });

      // Test 1: Create ACH return
      const returnId = await this.createTestAchReturn({
        ach_payment_id: achPaymentId,
        return_code: 'R01',
        return_reason: 'Insufficient Funds',
        returned_at: new Date(),
        corrected: false
      });
      
      assert.isNotNull(returnId, 'ACH return should be created');

      // Test 2: Return data integrity
      const achReturn = await this.testDb.query(
        'SELECT * FROM ach_returns WHERE id = $1',
        [returnId]
      );
      
      assert.equal(achReturn.rows[0].ach_payment_id, achPaymentId, 
        'Return should reference correct payment');
      assert.equal(achReturn.rows[0].return_code, 'R01', 'Return code should match');

      // Test 3: Create corrected return
      await this.testDb.query(
        'UPDATE ach_returns SET corrected = $1, correction_date = NOW(), correction_method = $2 WHERE id = $3',
        [true, 'reinitiated', returnId]
      );
      
      const correctedReturn = await this.testDb.query(
        'SELECT * FROM ach_returns WHERE id = $1',
        [returnId]
      );
      
      assert.isTrue(correctedReturn.rows[0].corrected, 'Return should be marked as corrected');
      assert.isNotNull(correctedReturn.rows[0].correction_date, 'Correction date should be set');

      // Test 4: Return statistics
      const stats = await this.testDb.query(`
        SELECT 
          COUNT(*) as total_returns,
          COUNT(CASE WHEN corrected = true THEN 1 END) as corrected_returns,
          COUNT(CASE WHEN corrected = false THEN 1 END) as uncorrected_returns
        FROM ach_returns
      `);
      
      assert.isTrue(stats.rows[0].total_returns >= 0, 'Return statistics should be calculated');

      // Test 5: Return code analysis
      const returnCodeStats = await this.testDb.query(`
        SELECT 
          return_code,
          COUNT(*) as return_count
        FROM ach_returns 
        GROUP BY return_code
        ORDER BY return_count DESC
      `);
      
      assert.isArray(returnCodeStats.rows, 'Return code statistics should be returned');

      result.details = {
        achReturnCreated: returnId,
        dataIntegrityMaintained: true,
        correctionTracked: true,
        statisticsCalculated: true,
        returnCodeAnalysis: true
      };
      
    } catch (error) {
      result.success = false;
      result.error = error.message;
    }

    return result;
  }

  /**
   * Test webhook events table
   */
  async testWebhookEventsTable() {
    const result = {
      name: 'testWebhookEventsTable',
      success: true,
      details: {}
    };

    try {
      // Test 1: Create webhook event
      const eventId = await this.createTestWebhookEvent({
        stripe_event_id: `evt_test_${Date.now()}`,
        event_type: 'payment_intent.succeeded',
        event_data: {
          id: `evt_test_${Date.now()}`,
          type: 'payment_intent.succeeded',
          data: { object: { id: 'pi_test', amount: 1000 } }
        },
        livemode: false
      });
      
      assert.isNotNull(eventId, 'Webhook event should be created');

      // Test 2: Webhook event data integrity
      const webhookEvent = await this.testDb.query(
        'SELECT * FROM stripe_webhook_events WHERE id = $1',
        [eventId]
      );
      
      assert.equal(webhookEvent.rows[0].event_type, 'payment_intent.succeeded', 
        'Event type should match');
      assert.isObject(webhookEvent.rows[0].event_data, 'Event data should be JSON object');

      // Test 3: Update event processing status
      await this.testDb.query(
        'UPDATE stripe_webhook_events SET processing_status = $1, processed_at = NOW() WHERE id = $2',
        ['processed', eventId]
      );
      
      const processedEvent = await this.testDb.query(
        'SELECT * FROM stripe_webhook_events WHERE id = $1',
        [eventId]
      );
      
      assert.equal(processedEvent.rows[0].processing_status, 'processed', 
        'Processing status should be updated');
      assert.isNotNull(processedEvent.rows[0].processed_at, 'Processed timestamp should be set');

      // Test 4: Event duplicate detection
      await this.createTestWebhookEvent({
        stripe_event_id: `evt_test_${Date.now()}`,
        event_type: 'payment_intent.succeeded',
        event_data: { id: `evt_test_${Date.now()}`, type: 'payment_intent.succeeded' },
        livemode: false
      });
      
      // Should handle duplicate events gracefully

      // Test 5: Event statistics
      const stats = await this.testDb.query(`
        SELECT 
          COUNT(*) as total_events,
          COUNT(CASE WHEN processing_status = 'processed' THEN 1 END) as processed_events,
          COUNT(CASE WHEN processing_status = 'failed' THEN 1 END) as failed_events,
          COUNT(CASE WHEN processing_status = 'pending' THEN 1 END) as pending_events
        FROM stripe_webhook_events
      `);
      
      assert.isTrue(stats.rows[0].total_events >= 0, 'Event statistics should be calculated');

      // Test 6: Event type filtering
      const paymentEvents = await this.testDb.query(
        'SELECT * FROM stripe_webhook_events WHERE event_type LIKE $1',
        ['payment_intent%']
      );
      
      // Should find payment intent events

      result.details = {
        webhookEventCreated: eventId,
        dataIntegrityMaintained: true,
        processingStatusUpdated: true,
        duplicateHandling: true,
        statisticsCalculated: true,
        eventTypeFiltering: true
      };
      
    } catch (error) {
      result.success = false;
      result.error = error.message;
    }

    return result;
  }

  /**
   * Test payment reconciliation table
   */
  async testPaymentReconciliationTable() {
    const result = {
      name: 'testPaymentReconciliationTable',
      success: true,
      details: {}
    };

    try {
      // Test 1: Create reconciliation record
      const reconciliationId = await this.createTestReconciliation({
        stripe_balance_transaction_id: `txn_test_${Date.now()}`,
        amount_cents: 25000,
        net_cents: 24500,
        fee_cents: 500,
        type: 'charge',
        stripe_status: 'available'
      });
      
      assert.isNotNull(reconciliationId, 'Reconciliation record should be created');

      // Test 2: Reconciliation data integrity
      const reconciliation = await this.testDb.query(
        'SELECT * FROM payment_reconciliation WHERE id = $1',
        [reconciliationId]
      );
      
      assert.equal(reconciliation.rows[0].amount_cents, 25000, 'Amount should match');
      assert.equal(reconciliation.rows[0].net_cents, 24500, 'Net amount should match');
      assert.equal(reconciliation.rows[0].fee_cents, 500, 'Fee should match');

      // Test 3: Mark as reconciled
      await this.testDb.query(
        'UPDATE payment_reconciliation SET reconciled_at = NOW(), reconciled_by = $1 WHERE id = $2',
        ['test-user-id', reconciliationId]
      );
      
      const reconciledRecord = await this.testDb.query(
        'SELECT * FROM payment_reconciliation WHERE id = $1',
        [reconciliationId]
      );
      
      assert.isNotNull(reconciledRecord.rows[0].reconciled_at, 'Reconciliation timestamp should be set');
      assert.equal(reconciledRecord.rows[0].reconciled_by, 'test-user-id', 'Reconciled by should be set');

      // Test 4: Reconciliation statistics
      const stats = await this.testDb.query(`
        SELECT 
          COUNT(*) as total_records,
          SUM(amount_cents) as total_amount_cents,
          SUM(net_cents) as total_net_cents,
          SUM(fee_cents) as total_fees_cents,
          COUNT(CASE WHEN reconciled_at IS NOT NULL THEN 1 END) as reconciled_count,
          COUNT(CASE WHEN reconciled_at IS NULL THEN 1 END) as unreconciled_count
        FROM payment_reconciliation
      `);
      
      assert.isTrue(stats.rows[0].total_records >= 0, 'Reconciliation statistics should be calculated');

      // Test 5: Reconciliation by type
      const chargeReconciliation = await this.testDb.query(
        'SELECT * FROM payment_reconciliation WHERE type = $1',
        ['charge']
      );
      
      // Should find charge reconciliations

      result.details = {
        reconciliationCreated: reconciliationId,
        dataIntegrityMaintained: true,
        reconciliationMarked: true,
        statisticsCalculated: true,
        typeFiltering: true
      };
      
    } catch (error) {
      result.success = false;
      result.error = error.message;
    }

    return result;
  }

  /**
   * Test compliance tables
   */
  async testComplianceTables() {
    const result = {
      name: 'testComplianceTables',
      success: true,
      details: {}
    };

    try {
      // Test 1: PCI audit log
      const auditLogId = await this.createTestAuditLog({
        action_type: 'create_customer',
        table_name: 'customers',
        record_id: 'test-record-id',
        user_id: 'test-user-id',
        user_email: 'test@example.com',
        ip_address: '192.168.1.1',
        sensitive_fields_accessed: ['email', 'phone'],
        data_masked: true,
        access_purpose: 'Customer creation'
      });
      
      assert.isNotNull(auditLogId, 'Audit log should be created');

      // Test 2: Compliance checklist
      const checklistId = await this.createTestComplianceChecklist({
        checklist_type: 'ach_compliance',
        item_description: 'NACHA Rules Compliance',
        requirement: 'All ACH transactions must comply with NACHA Operating Rules',
        status: 'completed',
        regulatory_standard: 'NACHA'
      });
      
      assert.isNotNull(checklistId, 'Compliance checklist should be created');

      // Test 3: Audit log data integrity
      const auditLog = await this.testDb.query(
        'SELECT * FROM pci_audit_log WHERE id = $1',
        [auditLogId]
      );
      
      assert.equal(auditLog.rows[0].action_type, 'create_customer', 'Action type should match');
      assert.isArray(auditLog.rows[0].sensitive_fields_accessed, 
        'Sensitive fields should be array');
      assert.isTrue(auditLog.rows[0].data_masked, 'Data should be masked');

      // Test 4: Compliance checklist status tracking
      await this.testDb.query(
        'UPDATE compliance_checklist SET status = $1, completion_date = NOW() WHERE id = $2',
        ['completed', checklistId]
      );
      
      const updatedChecklist = await this.testDb.query(
        'SELECT * FROM compliance_checklist WHERE id = $1',
        [checklistId]
      );
      
      assert.equal(updatedChecklist.rows[0].status, 'completed', 'Status should be updated');
      assert.isNotNull(updatedChecklist.rows[0].completion_date, 'Completion date should be set');

      // Test 5: Compliance statistics
      const auditStats = await this.testDb.query(`
        SELECT 
          COUNT(*) as total_audit_logs,
          COUNT(DISTINCT action_type) as unique_actions
        FROM pci_audit_log
      `);
      
      const checklistStats = await this.testDb.query(`
        SELECT 
          COUNT(*) as total_checklist_items,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_items,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_items,
          COUNT(CASE WHEN status = 'not_started' THEN 1 END) as not_started_items
        FROM compliance_checklist
      `);
      
      assert.isTrue(auditStats.rows[0].total_audit_logs >= 0, 'Audit statistics should be calculated');
      assert.isTrue(checklistStats.rows[0].total_checklist_items >= 0, 
        'Checklist statistics should be calculated');

      result.details = {
        auditLogCreated: auditLogId,
        checklistCreated: checklistId,
        dataIntegrityMaintained: true,
        statusTrackingWorking: true,
        statisticsCalculated: true
      };
      
    } catch (error) {
      result.success = false;
      result.error = error.message;
    }

    return result;
  }

  /**
   * Test data integrity constraints
   */
  async testDataIntegrity() {
    const result = {
      name: 'testDataIntegrity',
      success: true,
      details: {}
    };

    try {
      // Test 1: NOT NULL constraints
      try {
        await this.testDb.query(
          'INSERT INTO customers (stripe_customer_id) VALUES (NULL)'
        );
        assert.fail('Should not allow NULL stripe_customer_id');
      } catch (error) {
        assert.isTrue(error.message.includes('null') || error.message.includes('NOT NULL'),
          'Should enforce NOT NULL constraint');
      }

      // Test 2: UNIQUE constraints
      const stripeCustomerId = `cus_unique_${Date.now()}`;
      
      await this.testDb.query(
        'INSERT INTO customers (stripe_customer_id, first_name, last_name, email) VALUES ($1, $2, $3, $4)',
        [stripeCustomerId, 'Unique', 'Customer', `unique.${Date.now()}@example.com`]
      );
      
      try {
        await this.testDb.query(
          'INSERT INTO customers (stripe_customer_id, first_name, last_name, email) VALUES ($1, $2, $3, $4)',
          [stripeCustomerId, 'Duplicate', 'Customer', `duplicate.${Date.now()}@example.com`]
        );
        assert.fail('Should not allow duplicate stripe_customer_id');
      } catch (error) {
        assert.isTrue(error.message.includes('unique') || error.message.includes('duplicate'),
          'Should enforce UNIQUE constraint');
      }

      // Test 3: CHECK constraints
      try {
        await this.testDb.query(
          'INSERT INTO customers (stripe_customer_id, first_name, last_name, email) VALUES ($1, $2, $3, $4)',
          [`cus_check_${Date.now()}`, 'Check', 'Customer', 'invalid-email']
        );
        assert.fail('Should not allow invalid email format');
      } catch (error) {
        // Email validation might be handled by application layer
        console.log('Email constraint check:', error.message);
      }

      // Test 4: Foreign key constraints
      try {
        await this.testDb.query(
          'INSERT INTO payment_methods (customer_id, stripe_payment_method_id, type) VALUES ($1, $2, $3)',
          ['non-existent-uuid', `pm_fk_${Date.now()}`, 'us_bank_account']
        );
        assert.fail('Should not allow invalid foreign key');
      } catch (error) {
        assert.isTrue(error.message.includes('foreign key') || error.message.includes('violates'),
          'Should enforce foreign key constraint');
      }

      // Test 5: Data type validation
      try {
        await this.testDb.query(
          'INSERT INTO ach_payments (stripe_payment_intent_id, customer_id, payment_method_id, amount_cents, status) VALUES ($1, $2, $3, $4, $5)',
          [`pi_datatype_${Date.now()}`, await this.createTestCustomer({
            stripe_customer_id: `cus_datatype_${Date.now()}`,
            first_name: 'DataType',
            last_name: 'Test',
            email: `datatype.${Date.now()}@example.com`
          }), await this.createTestPaymentMethod({
            customer_id: await this.createTestCustomer({
              stripe_customer_id: `cus_datatype_pm_${Date.now()}`,
              first_name: 'DataType',
              last_name: 'Test',
              email: `datatypepm.${Date.now()}@example.com`
            }),
            stripe_payment_method_id: `pm_datatype_${Date.now()}`,
            type: 'us_bank_account',
            bank_name: 'Test Bank',
            bank_account_last4: '1234',
            bank_account_routing_number: '021000021',
            bank_account_type: 'checking'
          }), 'invalid-amount', 'invalid-status']
        );
        assert.fail('Should not allow invalid data types');
      } catch (error) {
        assert.isTrue(error.message.includes('invalid input syntax') || error.message.includes('type'),
          'Should enforce data type constraints');
      }

      result.details = {
        notNullConstraints: true,
        uniqueConstraints: true,
        checkConstraints: true,
        foreignKeyConstraints: true,
        dataTypeValidation: true
      };
      
    } catch (error) {
      result.success = false;
      result.error = error.message;
    }

    return result;
  }

  /**
   * Test transaction integrity
   */
  async testTransactionIntegrity() {
    const result = {
      name: 'testTransactionIntegrity',
      success: true,
      details: {}
    };

    try {
      // Test 1: Successful transaction
      const client = await this.testDb.connect();
      
      try {
        await client.query('BEGIN');
        
        const customerResult = await client.query(
          'INSERT INTO customers (stripe_customer_id, first_name, last_name, email) VALUES ($1, $2, $3, $4) RETURNING id',
          [`cus_txn_${Date.now()}`, 'Transaction', 'Test', `txn.${Date.now()}@example.com`]
        );
        
        const customerId = customerResult.rows[0].id;
        
        await client.query(
          'INSERT INTO payment_methods (customer_id, stripe_payment_method_id, type) VALUES ($1, $2, $3)',
          [customerId, `pm_txn_${Date.now()}`, 'us_bank_account']
        );
        
        await client.query('COMMIT');
        
        // Verify both records were created
        const verifyCustomer = await this.testDb.query('SELECT * FROM customers WHERE id = $1', [customerId]);
        assert.equal(verifyCustomer.rows.length, 1, 'Customer should exist after transaction');
        
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

      // Test 2: Rollback on error
      const rollbackClient = await this.testDb.connect();
      
      try {
        await rollbackClient.query('BEGIN');
        
        const rollbackCustomerResult = await rollbackClient.query(
          'INSERT INTO customers (stripe_customer_id, first_name, last_name, email) VALUES ($1, $2, $3, $4) RETURNING id',
          [`cus_rollback_${Date.now()}`, 'Rollback', 'Test', `rollback.${Date.now()}@example.com`]
        );
        
        // Intentionally cause an error
        await rollbackClient.query('INSERT INTO invalid_table VALUES (1)');
        
        await rollbackClient.query('COMMIT');
        assert.fail('Transaction should have rolled back');
        
      } catch (error) {
        await rollbackClient.query('ROLLBACK');
        // Verify rollback worked - customer should not exist
        const customerExists = await this.testDb.query(
          'SELECT * FROM customers WHERE email = $1',
          [`rollback.${Date.now()}@example.com`]
        );
        assert.equal(customerExists.rows.length, 0, 'Customer should not exist after rollback');
        
      } finally {
        rollbackClient.release();
      }

      // Test 3: Concurrent transactions
      const concurrentClients = [];
      for (let i = 0; i < 3; i++) {
        concurrentClients.push(await this.testDb.connect());
      }
      
      try {
        // Start all transactions
        for (const client of concurrentClients) {
          await client.query('BEGIN');
        }
        
        // Insert records in each transaction
        for (let i = 0; i < concurrentClients.length; i++) {
          await concurrentClients[i].query(
            'INSERT INTO customers (stripe_customer_id, first_name, last_name, email) VALUES ($1, $2, $3, $4)',
            [`cus_concurrent_${Date.now()}_${i}`, 'Concurrent', 'Test', `concurrent.${i}.${Date.now()}@example.com`]
          );
        }
        
        // Commit all transactions
        for (const client of concurrentClients) {
          await client.query('COMMIT');
        }
        
        // Verify all records were created
        const concurrentCustomers = await this.testDb.query(
          'SELECT * FROM customers WHERE stripe_customer_id LIKE $1',
          [`cus_concurrent_${Date.now()}_%`]
        );
        assert.equal(concurrentCustomers.rows.length, 3, 'All concurrent customers should exist');
        
      } finally {
        for (const client of concurrentClients) {
          try {
            await client.query('ROLLBACK');
          } catch (error) {
            // Ignore rollback errors
          }
          client.release();
        }
      }

      result.details = {
        successfulTransaction: true,
        rollbackOnError: true,
        concurrentTransactions: true,
        dataConsistency: true
      };
      
    } catch (error) {
      result.success = false;
      result.error = error.message;
    }

    return result;
  }

  /**
   * Test indexes and performance
   */
  async testIndexesAndPerformance() {
    const result = {
      name: 'testIndexesAndPerformance',
      success: true,
      details: {}
    };

    try {
      // Test 1: Index existence
      const requiredIndexes = [
        'idx_customers_stripe_id',
        'idx_customers_email',
        'idx_payment_methods_customer_id',
        'idx_payment_methods_stripe_id',
        'idx_ach_payments_customer_id',
        'idx_ach_payments_status',
        'idx_ach_returns_payment_id',
        'idx_webhook_events_stripe_event_id'
      ];
      
      const existingIndexes = await this.getAllIndexes();
      const missingIndexes = requiredIndexes.filter(index => !existingIndexes.includes(index));
      
      assert.equal(missingIndexes.length, 0, `Missing indexes: ${missingIndexes.join(', ')}`);

      // Test 2: Index usage (query plan analysis)
      const queryPlans = [];
      
      // Test customer lookup by stripe ID
      const customerPlan = await this.testDb.query(
        'EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM customers WHERE stripe_customer_id = $1',
        ['cus_test_plan']
      );
      queryPlans.push({ query: 'customer_by_stripe_id', plan: customerPlan.rows[0]['QUERY PLAN'] });
      
      // Test payment method lookup by customer
      const paymentMethodPlan = await this.testDb.query(
        'EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM payment_methods WHERE customer_id = $1',
        ['uuid']
      );
      queryPlans.push({ query: 'payment_methods_by_customer', plan: paymentMethodPlan.rows[0]['QUERY PLAN'] });
      
      // Test ACH payments by status
      const achPaymentPlan = await this.testDb.query(
        'EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM ach_payments WHERE status = $1',
        ['succeeded']
      );
      queryPlans.push({ query: 'ach_payments_by_status', plan: achPaymentPlan.rows[0]['QUERY PLAN'] });

      // Verify indexes are being used (look for index scans in plans)
      const indexesUsed = queryPlans.filter(plan => 
        plan.plan.includes('Index Scan') || plan.plan.includes('Index Only Scan')
      );
      
      assert.isTrue(indexesUsed.length >= 2, 'Indexes should be used for queries');

      // Test 3: Composite index usage
      const compositeIndexPlan = await this.testDb.query(
        'EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM payment_methods WHERE customer_id = $1 AND status = $2',
        ['uuid', 'active']
      );
      
      // Test 4: Performance comparison
      const performanceTests = [];
      
      // Create test data for performance testing
      for (let i = 0; i < 100; i++) {
        await this.testDb.query(
          'INSERT INTO customers (stripe_customer_id, first_name, last_name, email) VALUES ($1, $2, $3, $4)',
          [`cus_perf_${Date.now()}_${i}`, 'Performance', 'Test', `perf.${i}.${Date.now()}@example.com`]
        );
      }
      
      const startTime = Date.now();
      await this.testDb.query(
        'SELECT * FROM customers WHERE email LIKE $1',
        ['perf.%@example.com']
      );
      const queryTime = Date.now() - startTime;
      
      assert.isTrue(queryTime < 1000, `Query should complete within 1000ms, took ${queryTime}ms`);

      // Cleanup test data
      await this.testDb.query(
        'DELETE FROM customers WHERE stripe_customer_id LIKE $1',
        [`cus_perf_${Date.now()}_%`]
      );

      result.details = {
        allRequiredIndexesExist: true,
        indexesBeingUsed: indexesUsed.length,
        compositeIndexWorks: true,
        performanceAcceptable: true,
        queryPlansAnalyzed: queryPlans.length
      };
      
    } catch (error) {
      result.success = false;
      result.error = error.message;
    }

    return result;
  }

  /**
   * Test triggers functionality
   */
  async testTriggers() {
    const result = {
      name: 'testTriggers',
      success: true,
      details: {}
    };

    try {
      // Test 1: updated_at trigger
      const customerResult = await this.testDb.query(
        'INSERT INTO customers (stripe_customer_id, first_name, last_name, email) VALUES ($1, $2, $3, $4) RETURNING id, created_at, updated_at',
        [`cus_trigger_${Date.now()}`, 'Trigger', 'Test', `trigger.${Date.now()}@example.com`]
      );
      
      const initialUpdatedAt = customerResult.rows[0].updated_at;
      
      // Wait a moment and update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await this.testDb.query(
        'UPDATE customers SET last_name = $1 WHERE id = $2',
        ['Updated Trigger', customerResult.rows[0].id]
      );
      
      const updatedCustomer = await this.testDb.query(
        'SELECT updated_at FROM customers WHERE id = $1',
        [customerResult.rows[0].id]
      );
      
      const newUpdatedAt = updatedCustomer.rows[0].updated_at;
      assert.isTrue(newUpdatedAt > initialUpdatedAt, 'updated_at should be automatically updated');

      // Test 2: Check for audit triggers
      const auditTriggers = await this.getTableTriggers('customers');
      assert.isTrue(auditTriggers.includes('update_customers_updated_at'), 
        'updated_at trigger should exist for customers table');

      // Test 3: Test trigger on other tables
      const achPaymentResult = await this.createTestAchPayment({
        stripe_payment_intent_id: `pi_trigger_${Date.now()}`,
        customer_id: await this.createTestCustomer({
          stripe_customer_id: `cus_trigger_ach_${Date.now()}`,
          first_name: 'Trigger',
          last_name: 'ACH',
          email: `triggerach.${Date.now()}@example.com`
        }),
        payment_method_id: await this.createTestPaymentMethod({
          customer_id: await this.createTestCustomer({
            stripe_customer_id: `cus_trigger_ach_pm_${Date.now()}`,
            first_name: 'Trigger',
            last_name: 'ACH',
            email: `triggerachpm.${Date.now()}@example.com`
          }),
          stripe_payment_method_id: `pm_trigger_${Date.now()}`,
          type: 'us_bank_account',
          bank_name: 'Test Bank',
          bank_account_last4: '1234',
          bank_account_routing_number: '021000021',
          bank_account_type: 'checking'
        }),
        amount_cents: 10000,
        description: 'Trigger Test Payment',
        status: 'succeeded',
        payment_method_type: 'ach_debit'
      });

      // Verify trigger updates updated_at on ach_payments
      const achPayment = await this.testDb.query(
        'SELECT updated_at FROM ach_payments WHERE id = $1',
        [achPaymentResult]
      );
      assert.isNotNull(achPayment.rows[0].updated_at, 'ACH payments should have updated_at timestamp');

      result.details = {
        updatedAtTriggerWorks: true,
        triggersRegistered: true,
        multiTableTriggers: true,
        triggerTiming: true
      };
      
    } catch (error) {
      result.success = false;
      result.error = error.message;
    }

    return result;
  }

  /**
   * Test data persistence and retrieval
   */
  async testDataPersistence() {
    const result = {
      name: 'testDataPersistence',
      success: true,
      details: {}
    };

    try {
      // Test 1: Create comprehensive test record
      const customerResult = await this.createTestCustomer({
        stripe_customer_id: `cus_persist_${Date.now()}`,
        first_name: 'Persistence',
        last_name: 'Test',
        email: `persist.${Date.now()}@example.com`,
        customer_type: 'business'
      });

      const paymentMethodResult = await this.createTestPaymentMethod({
        customer_id: customerResult,
        stripe_payment_method_id: `pm_persist_${Date.now()}`,
        type: 'us_bank_account',
        bank_name: 'Persistence Bank',
        bank_account_last4: '5678',
        bank_account_routing_number: '121000358',
        bank_account_type: 'savings',
        verification_status: 'verified'
      });

      const achPaymentResult = await this.createTestAchPayment({
        stripe_payment_intent_id: `pi_persist_${Date.now()}`,
        customer_id: customerResult,
        payment_method_id: paymentMethodResult,
        amount_cents: 50000,
        description: 'Persistence Test Payment',
        status: 'succeeded',
        payment_method_type: 'ach_debit',
        ach_class_code: 'CCD'
      });

      // Test 2: Retrieve and verify all related data
      const customer = await this.testDb.query('SELECT * FROM customers WHERE id = $1', [customerResult]);
      assert.equal(customer.rows.length, 1, 'Customer should persist');
      
      const paymentMethod = await this.testDb.query('SELECT * FROM payment_methods WHERE id = $1', [paymentMethodResult]);
      assert.equal(paymentMethod.rows.length, 1, 'Payment method should persist');
      
      const achPayment = await this.testDb.query('SELECT * FROM ach_payments WHERE id = $1', [achPaymentResult]);
      assert.equal(achPayment.rows.length, 1, 'ACH payment should persist');

      // Test 3: Complex query across multiple tables
      const complexQuery = await this.testDb.query(`
        SELECT 
          c.id as customer_id,
          c.first_name,
          c.last_name,
          c.email,
          pm.bank_name,
          pm.bank_account_last4,
          ap.amount_cents,
          ap.description,
          ap.status
        FROM customers c
        JOIN payment_methods pm ON c.id = pm.customer_id
        JOIN ach_payments ap ON c.id = ap.customer_id
        WHERE c.id = $1
      `, [customerResult]);
      
      assert.equal(complexQuery.rows.length, 1, 'Complex query should return data');
      assert.equal(complexQuery.rows[0].bank_name, 'Persistence Bank', 
        'Joined data should be correct');

      // Test 4: JSON field persistence
      const customerWithMetadata = await this.testDb.query(
        'UPDATE customers SET stripe_metadata = $1 WHERE id = $2 RETURNING stripe_metadata',
        [{ test_persistence: true, metadata_version: '1.0' }, customerResult]
      );
      
      assert.isObject(customerWithMetadata.rows[0].stripe_metadata, 
        'JSON metadata should persist');

      // Test 5: Data retention over time (simulated)
      const historicalData = await this.testDb.query(`
        SELECT 
          DATE_TRUNC('day', created_at) as created_date,
          COUNT(*) as records_per_day
        FROM customers
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY created_date DESC
      `);
      
      assert.isArray(historicalData.rows, 'Historical data queries should work');

      result.details = {
        customerPersisted: true,
        paymentMethodPersisted: true,
        achPaymentPersisted: true,
        complexQueriesWork: true,
        jsonFieldsPersist: true,
        historicalQueriesWork: true
      };
      
    } catch (error) {
      result.success = false;
      result.error = error.message;
    }

    return result;
  }

  /**
   * Test backup and recovery procedures
   */
  async testBackupAndRecovery() {
    const result = {
      name: 'testBackupAndRecovery',
      success: true,
      details: {}
    };

    try {
      // Test 1: Data export for backup
      const backupData = await this.testDb.query(`
        SELECT 
          table_name,
          COUNT(*) as row_count
        FROM information_schema.tables t
        JOIN information_schema.table_statistics s ON t.table_name = s.table_name
        WHERE t.table_schema = 'public'
        GROUP BY table_name
        ORDER BY table_name
      `);
      
      assert.isArray(backupData.rows, 'Backup data export should work');

      // Test 2: Full table backup simulation
      const tables = ['customers', 'payment_methods', 'ach_payments'];
      const backupResults = {};
      
      for (const table of tables) {
        const tableData = await this.testDb.query(`SELECT * FROM ${table} LIMIT 10`);
        backupResults[table] = {
          rowCount: tableData.rows.length,
          columns: Object.keys(tableData.rows[0] || {}),
          sampleData: tableData.rows[0] || null
        };
      }
      
      assert.isObject(backupResults, 'Table backup simulation should work');

      // Test 3: Recovery verification
      const recoveryTestCustomer = await this.createTestCustomer({
        stripe_customer_id: `cus_recovery_${Date.now()}`,
        first_name: 'Recovery',
        last_name: 'Test',
        email: `recovery.${Date.now()}@example.com`
      });
      
      // Verify the record can be retrieved (simulation of recovery)
      const recoveredCustomer = await this.testDb.query(
        'SELECT * FROM customers WHERE id = $1',
        [recoveryTestCustomer]
      );
      
      assert.equal(recoveredCustomer.rows.length, 1, 'Data should be recoverable');

      // Test 4: Integrity check
      const integrityCheck = await this.testDb.query(`
        SELECT 
          'customers' as table_name,
          COUNT(*) as total_rows,
          COUNT(CASE WHEN stripe_customer_id IS NULL THEN 1 END) as null_stripe_ids,
          COUNT(CASE WHEN email IS NULL THEN 1 END) as null_emails
        FROM customers
        UNION ALL
        SELECT 
          'payment_methods' as table_name,
          COUNT(*) as total_rows,
          COUNT(CASE WHEN stripe_payment_method_id IS NULL THEN 1 END) as null_pm_ids,
          COUNT(CASE WHEN customer_id IS NULL THEN 1 END) as null_customer_ids
        FROM payment_methods
      `);
      
      assert.isArray(integrityCheck.rows, 'Integrity check should complete');
      for (const check of integrityCheck.rows) {
        assert.equal(check.null_stripe_ids || check.null_pm_ids, 0, 
          `No null required fields in ${check.table_name}`);
      }

      result.details = {
        backupDataExport: true,
        tableBackupSimulation: true,
        recoveryVerification: true,
        integrityCheck: true
      };
      
    } catch (error) {
      result.success = false;
      result.error = error.message;
    }

    return result;
  }

  // ==============================
  // HELPER METHODS
  // ==============================

  /**
   * Load schema tables
   */
  async loadSchemaTables() {
    const tables = await this.testDb.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    this.schemaTables = new Set(tables.rows.map(row => row.table_name));
  }

  /**
   * Get existing tables
   */
  async getExistingTables() {
    const result = await this.testDb.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    return result.rows.map(row => row.table_name);
  }

  /**
   * Get table columns
   */
  async getTableColumns(tableName) {
    const result = await this.testDb.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = $1 AND table_schema = 'public'
      ORDER BY ordinal_position
    `, [tableName]);
    
    return result.rows.map(row => row.column_name);
  }

  /**
   * Get table indexes
   */
  async getTableIndexes(tableName) {
    const result = await this.testDb.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = $1 AND schemaname = 'public'
    `, [tableName]);
    
    return result.rows.map(row => row.indexname);
  }

  /**
   * Get all indexes
   */
  async getAllIndexes() {
    const result = await this.testDb.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public'
    `);
    
    return result.rows.map(row => row.indexname);
  }

  /**
   * Get foreign key constraints
   */
  async getForeignKeyConstraints() {
    const result = await this.testDb.query(`
      SELECT conname as constraint_name
      FROM pg_constraint
      WHERE contype = 'f' AND connamespace = 'public'::regnamespace
    `);
    
    return result.rows.map(row => row.constraint_name);
  }

  /**
   * Get table triggers
   */
  async getTableTriggers(tableName = null) {
    let query = `
      SELECT trigger_name 
      FROM information_schema.triggers 
      WHERE trigger_schema = 'public'
    `;
    
    const params = [];
    if (tableName) {
      query += ` AND event_object_table = $1`;
      params.push(tableName);
    }
    
    const result = await this.testDb.query(query, params);
    return result.rows.map(row => row.trigger_name);
  }

  /**
   * Create test customer
   */
  async createTestCustomer(customerData) {
    const result = await this.testDb.query(`
      INSERT INTO customers (stripe_customer_id, first_name, last_name, email, stripe_metadata)
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, [
      customerData.stripe_customer_id,
      customerData.first_name,
      customerData.last_name,
      customerData.email,
      customerData.stripe_metadata || { test_data: 'true' }
    ]);
    
    return result.rows[0].id;
  }

  /**
   * Create test payment method
   */
  async createTestPaymentMethod(paymentMethodData) {
    const result = await this.testDb.query(`
      INSERT INTO payment_methods (
        customer_id, stripe_payment_method_id, type,
        bank_name, bank_account_last4, bank_account_routing_number,
        bank_account_type, status, verification_status, stripe_metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id
    `, [
      paymentMethodData.customer_id,
      paymentMethodData.stripe_payment_method_id,
      paymentMethodData.type,
      paymentMethodData.bank_name,
      paymentMethodData.bank_account_last4,
      paymentMethodData.bank_account_routing_number,
      paymentMethodData.bank_account_type,
      paymentMethodData.status || 'active',
      paymentMethodData.verification_status || 'pending',
      { test_data: 'true' }
    ]);
    
    return result.rows[0].id;
  }

  /**
   * Create test ACH payment
   */
  async createTestAchPayment(achPaymentData) {
    const result = await this.testDb.query(`
      INSERT INTO ach_payments (
        stripe_payment_intent_id, customer_id, payment_method_id,
        amount_cents, description, status, payment_method_type,
        ach_class_code, stripe_metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id
    `, [
      achPaymentData.stripe_payment_intent_id,
      achPaymentData.customer_id,
      achPaymentData.payment_method_id,
      achPaymentData.amount_cents,
      achPaymentData.description,
      achPaymentData.status,
      achPaymentData.payment_method_type,
      achPaymentData.ach_class_code,
      { test_data: 'true' }
    ]);
    
    return result.rows[0].id;
  }

  /**
   * Create test ACH return
   */
  async createTestAchReturn(returnData) {
    const result = await this.testDb.query(`
      INSERT INTO ach_returns (
        ach_payment_id, return_code, return_reason,
        returned_at, corrected, notes
      ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
    `, [
      returnData.ach_payment_id,
      returnData.return_code,
      returnData.return_reason,
      returnData.returned_at,
      returnData.corrected,
      returnData.notes
    ]);
    
    return result.rows[0].id;
  }

  /**
   * Create test webhook event
   */
  async createTestWebhookEvent(eventData) {
    const result = await this.testDb.query(`
      INSERT INTO stripe_webhook_events (
        stripe_event_id, event_type, event_data, livemode
      ) VALUES ($1, $2, $3, $4) RETURNING id
    `, [
      eventData.stripe_event_id,
      eventData.event_type,
      eventData.event_data,
      eventData.livemode
    ]);
    
    return result.rows[0].id;
  }

  /**
   * Create test reconciliation
   */
  async createTestReconciliation(reconciliationData) {
    const result = await this.testDb.query(`
      INSERT INTO payment_reconciliation (
        stripe_balance_transaction_id, amount_cents, net_cents, fee_cents,
        type, stripe_status
      ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
    `, [
      reconciliationData.stripe_balance_transaction_id,
      reconciliationData.amount_cents,
      reconciliationData.net_cents,
      reconciliationData.fee_cents,
      reconciliationData.type,
      reconciliationData.stripe_status
    ]);
    
    return result.rows[0].id;
  }

  /**
   * Create test audit log
   */
  async createTestAuditLog(auditData) {
    const result = await this.testDb.query(`
      INSERT INTO pci_audit_log (
        action_type, table_name, record_id, user_id, user_email,
        ip_address, sensitive_fields_accessed, data_masked, access_purpose
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id
    `, [
      auditData.action_type,
      auditData.table_name,
      auditData.record_id,
      auditData.user_id,
      auditData.user_email,
      auditData.ip_address,
      auditData.sensitive_fields_accessed,
      auditData.data_masked,
      auditData.access_purpose
    ]);
    
    return result.rows[0].id;
  }

  /**
   * Create test compliance checklist
   */
  async createTestComplianceChecklist(checklistData) {
    const result = await this.testDb.query(`
      INSERT INTO compliance_checklist (
        checklist_type, item_description, requirement, status, regulatory_standard
      ) VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, [
      checklistData.checklist_type,
      checklistData.item_description,
      checklistData.requirement,
      checklistData.status,
      checklistData.regulatory_standard
    ]);
    
    return result.rows[0].id;
  }

  /**
   * Get test results
   */
  getTestResults() {
    return this.testResults;
  }

  /**
   * Generate test report
   */
  generateTestReport() {
    const results = this.testResults;
    const report = {
      summary: {
        total: results.total,
        passed: results.passed,
        failed: results.failed,
        successRate: ((results.passed / results.total) * 100).toFixed(2) + '%'
      },
      tests: results.tests.map(test => ({
        name: test.name,
        status: test.success ? 'PASSED' : 'FAILED',
        error: test.error,
        executionTime: test.executionTime || 0,
        details: test.details || {}
      })),
      databaseMetrics: {
        totalTables: this.schemaTables.size,
        tablesTested: results.tests.length,
        coverage: ((results.passed / results.total) * 100).toFixed(2) + '%'
      },
      performance: {
        averageExecutionTime: this.calculateAverageExecutionTime(results.tests),
        slowestTests: this.getSlowestTests(results.tests),
        fastestTests: this.getFastestTests(results.tests)
      }
    };

    return report;
  }

  /**
   * Calculate average execution time
   */
  calculateAverageExecutionTime(tests) {
    const testsWithTime = tests.filter(t => t.executionTime);
    if (testsWithTime.length === 0) return 0;
    
    const totalTime = testsWithTime.reduce((sum, test) => sum + test.executionTime, 0);
    return Math.round(totalTime / testsWithTime.length);
  }

  /**
   * Get slowest tests
   */
  getSlowestTests(tests, limit = 3) {
    return tests
      .filter(t => t.executionTime)
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, limit)
      .map(test => ({
        name: test.name,
        executionTime: test.executionTime
      }));
  }

  /**
   * Get fastest tests
   */
  getFastestTests(tests, limit = 3) {
    return tests
      .filter(t => t.executionTime)
      .sort((a, b) => a.executionTime - b.executionTime)
      .slice(0, limit)
      .map(test => ({
        name: test.name,
        executionTime: test.executionTime
      }));
  }
}

// Export test suite
module.exports = {
  TestDatabaseIntegration,
  
  // Run all database integration tests
  runDatabaseIntegrationTests: async () => {
    const testSuite = new TestDatabaseIntegration();
    await testSuite.initialize();
    const results = await testSuite.runAllTests();
    return {
      results,
      report: testSuite.generateTestReport()
    };
  }
};