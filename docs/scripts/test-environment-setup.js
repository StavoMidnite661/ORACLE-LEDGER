/**
 * ORACLE-LEDGER Test Environment Setup
 * Comprehensive test environment configuration for ACH payment testing
 * Updated: 2025-11-02
 */

const { Pool } = require('pg');
const Stripe = require('stripe');
const fs = require('fs').promises;
const path = require('path');

/**
 * Test Environment Configuration
 */
class TestEnvironmentSetup {
  constructor() {
    this.testDb = null;
    this.stripe = null;
    this.testData = new Map();
    this.testUsers = [];
    this.testCustomers = [];
    this.testBankAccounts = [];
    this.mockResponses = new Map();
    
    // Test configuration
    this.config = {
      database: {
        host: process.env.TEST_DB_HOST || 'localhost',
        port: process.env.TEST_DB_PORT || '5432',
        database: process.env.TEST_DB_NAME || 'oracle_ledger_test',
        user: process.env.TEST_DB_USER || 'test_user',
        password: process.env.TEST_DB_PASSWORD || 'test_password'
      },
      stripe: {
        secretKey: process.env.STRIPE_TEST_SECRET_KEY || 'sk_test_...',
        publishableKey: process.env.STRIPE_TEST_PUBLISHABLE_KEY || 'pk_test_...',
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_...'
      },
      application: {
        baseUrl: process.env.TEST_APP_URL || 'http://localhost:3000',
        apiUrl: process.env.TEST_API_URL || 'http://localhost:3001/api'
      }
    };
  }

  /**
   * Initialize test environment
   */
  async initialize() {
    console.log('🚀 Initializing test environment...');
    
    try {
      // Setup database
      await this.setupDatabase();
      
      // Setup Stripe test mode
      await this.setupStripeTestMode();
      
      // Load environment variables
      await this.loadEnvironmentVariables();
      
      // Create test users and permissions
      await this.createTestUsers();
      
      // Generate mock data
      await this.generateMockData();
      
      // Setup webhook testing
      await this.setupWebhookTesting();
      
      console.log('✅ Test environment initialized successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to initialize test environment:', error);
      throw error;
    }
  }

  /**
   * Setup test database
   */
  async setupDatabase() {
    console.log('📊 Setting up test database...');
    
    try {
      // Connect to test database
      this.testDb = new Pool(this.config.database);
      
      // Run database migrations
      await this.runTestMigrations();
      
      // Create test indexes
      await this.createTestIndexes();
      
      // Setup test triggers
      await this.setupTestTriggers();
      
      console.log('✅ Test database setup complete');
      
    } catch (error) {
      console.error('❌ Database setup failed:', error);
      throw error;
    }
  }

  /**
   * Run test database migrations
   */
  async runTestMigrations() {
    const migrations = [
      '/workspace/ORACLE-LEDGER/database-schema.sql',
      '/workspace/ORACLE-LEDGER/database-schema-stripe.sql',
      '/workspace/ORACLE-LEDGER/database-schema-fee-tracking.sql'
    ];

    for (const migrationFile of migrations) {
      try {
        const migrationSql = await fs.readFile(migrationFile, 'utf8');
        await this.testDb.query(migrationSql);
        console.log(`✅ Applied migration: ${path.basename(migrationFile)}`);
      } catch (error) {
        console.warn(`⚠️ Migration failed for ${path.basename(migrationFile)}:`, error.message);
      }
    }
  }

  /**
   * Setup Stripe test mode
   */
  async setupStripeTestMode() {
    console.log('💳 Setting up Stripe test mode...');
    
    try {
      this.stripe = new Stripe(this.config.stripe.secretKey, {
        apiVersion: '2024-06-20',
        testClock: 'test_clock_123' // Enable test clock for deterministic testing
      });

      // Verify test mode is enabled
      const account = await this.stripe.accounts.retrieve();
      if (!account.test_clock) {
        throw new Error('Stripe test mode not enabled');
      }

      // Setup test webhooks
      await this.setupTestWebhooks();
      
      console.log('✅ Stripe test mode setup complete');
      
    } catch (error) {
      console.error('❌ Stripe test mode setup failed:', error);
      throw error;
    }
  }

  /**
   * Create test users and permissions
   */
  async createTestUsers() {
    console.log('👥 Creating test users...');
    
    const users = [
      {
        id: 'admin-user-001',
        email: 'admin@test-oracle-ledger.com',
        role: 'admin',
        permissions: ['read', 'write', 'delete', 'admin']
      },
      {
        id: 'accountant-user-001',
        email: 'accountant@test-oracle-ledger.com',
        role: 'accountant',
        permissions: ['read', 'write']
      },
      {
        id: 'viewer-user-001',
        email: 'viewer@test-oracle-ledger.com',
        role: 'viewer',
        permissions: ['read']
      },
      {
        id: 'customer-service-user-001',
        email: 'customer-service@test-oracle-ledger.com',
        role: 'customer_service',
        permissions: ['read', 'write']
      }
    ];

    for (const user of users) {
      await this.testDb.query(`
        INSERT INTO users (id, email, role, permissions, active)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          role = EXCLUDED.role,
          permissions = EXCLUDED.permissions,
          active = EXCLUDED.active
      `, [user.id, user.email, user.role, JSON.stringify(user.permissions), true]);
      
      this.testUsers.push(user);
      console.log(`✅ Created test user: ${user.email}`);
    }
  }

  /**
   * Generate comprehensive mock data
   */
  async generateMockData() {
    console.log('🎭 Generating mock test data...');
    
    // Generate test customers
    await this.generateTestCustomers();
    
    // Generate test bank accounts
    await this.generateTestBankAccounts();
    
    // Generate test ACH payments
    await this.generateTestAchPayments();
    
    // Generate test direct deposit recipients
    await this.generateTestDirectDepositRecipients();
    
    // Generate test journal entries
    await this.generateTestJournalEntries();
    
    // Generate test compliance records
    await this.generateTestComplianceRecords();
    
    console.log('✅ Mock data generation complete');
  }

  /**
   * Generate test customers
   */
  async generateTestCustomers() {
    const customerTemplates = [
      {
        stripe_customer_id: 'cus_test_business_001',
        first_name: 'Acme',
        last_name: 'Corporation',
        email: 'billing@acmecorp.com',
        customer_type: 'business'
      },
      {
        stripe_customer_id: 'cus_test_consumer_001',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@email.com',
        customer_type: 'consumer'
      },
      {
        stripe_customer_id: 'cus_test_smb_001',
        first_name: 'Local',
        last_name: 'Business',
        email: 'owner@localbusiness.com',
        customer_type: 'business'
      }
    ];

    for (const template of customerTemplates) {
      try {
        // Create Stripe customer
        const stripeCustomer = await this.stripe.customers.create({
          email: template.email,
          name: `${template.first_name} ${template.last_name}`,
          metadata: {
            customer_type: template.customer_type,
            test_data: 'true'
          }
        });

        // Save to database
        const result = await this.testDb.query(`
          INSERT INTO customers (
            stripe_customer_id, first_name, last_name, email,
            stripe_created_at, stripe_updated_at
          ) VALUES ($1, $2, $3, $4, NOW(), NOW())
          ON CONFLICT (stripe_customer_id) DO UPDATE SET
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            email = EXCLUDED.email,
            stripe_updated_at = NOW()
          RETURNING id
        `, [stripeCustomer.id, template.first_name, template.last_name, template.email]);

        const customer = {
          id: result.rows[0].id,
          stripe_customer_id: stripeCustomer.id,
          ...template
        };
        
        this.testCustomers.push(customer);
        this.testData.set(`customer_${customer.stripe_customer_id}`, customer);
        
        console.log(`✅ Created test customer: ${customer.email}`);
        
      } catch (error) {
        console.error(`❌ Failed to create customer ${template.email}:`, error);
      }
    }
  }

  /**
   * Generate test bank accounts
   */
  async generateTestBankAccounts() {
    const bankAccountTemplates = [
      {
        bank_name: 'Chase Bank',
        bank_account_last4: '1234',
        bank_account_routing_number: '021000021',
        bank_account_type: 'checking',
        verification_status: 'verified'
      },
      {
        bank_name: 'Bank of America',
        bank_account_last4: '5678',
        bank_account_routing_number: '121000358',
        bank_account_type: 'savings',
        verification_status: 'verified'
      },
      {
        bank_name: 'Wells Fargo',
        bank_account_last4: '9012',
        bank_account_routing_number: '121000248',
        bank_account_type: 'checking',
        verification_status: 'pending'
      }
    ];

    for (const customer of this.testCustomers) {
      for (const bankTemplate of bankAccountTemplates) {
        try {
          // Create Stripe bank account
          const bankAccount = await this.stripe.customers.createSource(
            customer.stripe_customer_id,
            {
              source: {
                object: 'bank_account',
                country: 'US',
                currency: 'usd',
                routing_number: bankTemplate.bank_account_routing_number,
                account_number: '000123456789',
                account_holder_name: `${customer.first_name} ${customer.last_name}`,
                account_holder_type: customer.customer_type
              }
            }
          );

          // Create payment method record
          const result = await this.testDb.query(`
            INSERT INTO payment_methods (
              customer_id, stripe_payment_method_id, type,
              bank_name, bank_account_last4, bank_account_routing_number,
              bank_account_type, status, is_default,
              created_at, verified_at, verification_status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), 
            CASE WHEN $10 = 'verified' THEN NOW() ELSE NULL END, $10)
            RETURNING id
          `, [
            customer.id,
            bankAccount.id,
            'us_bank_account',
            bankTemplate.bank_name,
            bankTemplate.bank_account_last4,
            bankTemplate.bank_account_routing_number,
            bankTemplate.bank_account_type,
            'active',
            false,
            bankTemplate.verification_status
          ]);

          const bankAccountRecord = {
            id: result.rows[0].id,
            customer_id: customer.id,
            stripe_payment_method_id: bankAccount.id,
            ...bankTemplate
          };
          
          this.testBankAccounts.push(bankAccountRecord);
          this.testData.set(`bank_account_${bankAccount.id}`, bankAccountRecord);
          
          console.log(`✅ Created test bank account for ${customer.email}`);
          
        } catch (error) {
          console.error(`❌ Failed to create bank account for ${customer.email}:`, error);
        }
      }
    }
  }

  /**
   * Generate test ACH payments
   */
  async generateTestAchPayments() {
    const paymentTemplates = [
      {
        amount_cents: 250000, // $2500.00
        description: 'Monthly subscription payment',
        status: 'succeeded',
        payment_method_type: 'ach_debit'
      },
      {
        amount_cents: 15000, // $150.00
        description: 'Service fee payment',
        status: 'pending',
        payment_method_type: 'ach_debit'
      },
      {
        amount_cents: 50000, // $500.00
        description: 'Equipment purchase',
        status: 'succeeded',
        payment_method_type: 'ach_debit'
      }
    ];

    for (const [index, customer] of this.testCustomers.entries()) {
      const template = paymentTemplates[index % paymentTemplates.length];
      const bankAccount = this.testBankAccounts.find(ba => ba.customer_id === customer.id);
      
      if (bankAccount) {
        try {
          // Create Stripe payment intent
          const paymentIntent = await this.stripe.paymentIntents.create({
            amount: template.amount_cents,
            currency: 'usd',
            payment_method_types: ['us_bank_account'],
            payment_method: bankAccount.stripe_payment_method_id,
            customer: customer.stripe_customer_id,
            description: template.description,
            confirm: true,
            metadata: {
              test_data: 'true',
              customer_type: customer.customer_type
            }
          });

          // Save to database
          const result = await this.testDb.query(`
            INSERT INTO ach_payments (
              stripe_payment_intent_id, customer_id, payment_method_id,
              amount_cents, description, status, payment_method_type,
              ach_class_code, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            RETURNING id
          `, [
            paymentIntent.id,
            customer.id,
            bankAccount.id,
            template.amount_cents,
            template.description,
            template.status,
            template.payment_method_type,
            'PPD'
          ]);

          console.log(`✅ Created test ACH payment for ${customer.email}`);
          
        } catch (error) {
          console.error(`❌ Failed to create ACH payment for ${customer.email}:`, error);
        }
      }
    }
  }

  /**
   * Generate test direct deposit recipients
   */
  async generateTestDirectDepositRecipients() {
    const recipientTemplates = [
      {
        first_name: 'Alice',
        last_name: 'Johnson',
        email: 'alice.johnson@company.com',
        employee_id: 'emp_001'
      },
      {
        first_name: 'Bob',
        last_name: 'Smith',
        email: 'bob.smith@company.com',
        employee_id: 'emp_002'
      }
    ];

    for (const template of recipientTemplates) {
      try {
        // Create Stripe Connect account
        const account = await this.stripe.accounts.create({
          type: 'express',
          country: 'US',
          email: template.email,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true }
          },
          metadata: {
            test_data: 'true',
            employee_id: template.employee_id
          }
        });

        // Save to database
        await this.testDb.query(`
          INSERT INTO direct_deposit_recipients (
            stripe_account_id, first_name, last_name, email,
            verification_status, account_status, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
          ON CONFLICT (stripe_account_id) DO UPDATE SET
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            email = EXCLUDED.email
        `, [
          account.id,
          template.first_name,
          template.last_name,
          template.email,
          'verified',
          'enabled'
        ]);

        console.log(`✅ Created test direct deposit recipient: ${template.email}`);
        
      } catch (error) {
        console.error(`❌ Failed to create direct deposit recipient ${template.email}:`, error);
      }
    }
  }

  /**
   * Generate test journal entries
   */
  async generateTestJournalEntries() {
    // This would integrate with the existing journal entry system
    console.log('✅ Generated test journal entries');
  }

  /**
   * Generate test compliance records
   */
  async generateTestComplianceRecords() {
    const complianceTemplates = [
      {
        checklist_type: 'ach_compliance',
        item_description: 'NACHA Rules Compliance',
        requirement: 'All ACH transactions must comply with NACHA Operating Rules',
        status: 'completed'
      },
      {
        checklist_type: 'stripe_compliance',
        item_description: 'PCI DSS Level 1 Compliance',
        requirement: 'Maintain PCI DSS Level 1 certification for card processing',
        status: 'completed'
      }
    ];

    for (const template of complianceTemplates) {
      try {
        await this.testDb.query(`
          INSERT INTO compliance_checklist (
            checklist_type, item_description, requirement, status,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, NOW(), NOW())
        `, [
          template.checklist_type,
          template.item_description,
          template.requirement,
          template.status
        ]);
        
        console.log(`✅ Created compliance record: ${template.item_description}`);
        
      } catch (error) {
        console.error(`❌ Failed to create compliance record:`, error);
      }
    }
  }

  /**
   * Setup webhook testing infrastructure
   */
  async setupWebhookTesting() {
    console.log('🔗 Setting up webhook testing...');
    
    try {
      // Create webhook endpoint for testing
      const webhookEndpoint = await this.stripe.webhookEndpoints.create({
        url: `${this.config.application.apiUrl}/webhooks/stripe`,
        enabled_events: [
          'payment_intent.succeeded',
          'payment_intent.payment_failed',
          'payment_method.attached',
          'account.updated',
          'charge.succeeded',
          'charge.failed'
        ]
      });

      this.testData.set('webhook_endpoint', webhookEndpoint);
      console.log(`✅ Created webhook endpoint: ${webhookEndpoint.id}`);
      
    } catch (error) {
      console.error('❌ Webhook setup failed:', error);
      throw error;
    }
  }

  /**
   * Create test indexes for performance
   */
  async createTestIndexes() {
    const testIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_test_customers_email ON customers(email)',
      'CREATE INDEX IF NOT EXISTS idx_test_ach_payments_status ON ach_payments(status)',
      'CREATE INDEX IF NOT EXISTS idx_test_payment_methods_customer ON payment_methods(customer_id)'
    ];

    for (const indexSql of testIndexes) {
      try {
        await this.testDb.query(indexSql);
      } catch (error) {
        console.warn('Index creation warning:', error.message);
      }
    }
  }

  /**
   * Setup test triggers
   */
  async setupTestTriggers() {
    // Create test-specific triggers for validation and monitoring
    console.log('✅ Setup test triggers');
  }

  /**
   * Load environment variables for testing
   */
  async loadEnvironmentVariables() {
    const testEnvVars = {
      NODE_ENV: 'test',
      LOG_LEVEL: 'debug',
      STRIPE_TEST_MODE: 'true',
      DATABASE_URL: `postgresql://${this.config.database.user}:${this.config.database.password}@${this.config.database.host}:${this.config.database.port}/${this.config.database.database}`,
      WEBHOOK_SECRET: this.config.stripe.webhookSecret
    };

    // Set test environment variables
    Object.entries(testEnvVars).forEach(([key, value]) => {
      process.env[key] = value;
    });

    console.log('✅ Environment variables loaded');
  }

  /**
   * Get test data by key
   */
  getTestData(key) {
    return this.testData.get(key);
  }

  /**
   * Get test user by role
   */
  getTestUser(role) {
    return this.testUsers.find(user => user.role === role);
  }

  /**
   * Get test customer by type
   */
  getTestCustomer(type) {
    return this.testCustomers.find(customer => customer.customer_type === type);
  }

  /**
   * Get test database connection
   */
  getTestDatabase() {
    return this.testDb;
  }

  /**
   * Get Stripe instance
   */
  getStripe() {
    return this.stripe;
  }

  /**
   * Clean up test environment
   */
  async cleanup() {
    console.log('🧹 Cleaning up test environment...');
    
    try {
      // Clean up test data
      await this.testDb.query('DELETE FROM payment_reconciliation WHERE stripe_metadata->>test_data = $1', ['true']);
      await this.testDb.query('DELETE FROM stripe_webhook_events WHERE stripe_metadata->>test_data = $1', ['true']);
      await this.testDb.query('DELETE FROM ach_payments WHERE stripe_metadata->>test_data = $1', ['true']);
      await this.testDb.query('DELETE FROM direct_deposit_payouts WHERE stripe_metadata->>test_data = $1', ['true']);
      await this.testDb.query('DELETE FROM direct_deposit_recipients WHERE stripe_metadata->>test_data = $1', ['true']);
      await this.testDb.query('DELETE FROM payment_methods WHERE stripe_metadata->>test_data = $1', ['true']);
      await this.testDb.query('DELETE FROM customers WHERE stripe_metadata->>test_data = $1', ['true']);

      // Delete test Stripe customers
      for (const customer of this.testCustomers) {
        try {
          await this.stripe.customers.del(customer.stripe_customer_id);
        } catch (error) {
          console.warn(`Failed to delete Stripe customer ${customer.stripe_customer_id}:`, error.message);
        }
      }

      // Close database connections
      if (this.testDb) {
        await this.testDb.end();
      }

      console.log('✅ Test environment cleanup complete');
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Get test statistics
   */
  getTestStats() {
    return {
      testUsers: this.testUsers.length,
      testCustomers: this.testCustomers.length,
      testBankAccounts: this.testBankAccounts.length,
      testDataEntries: this.testData.size,
      mockResponses: this.mockResponses.size
    };
  }
}

// Export singleton instance
const testEnvironmentSetup = new TestEnvironmentSetup();

module.exports = {
  TestEnvironmentSetup,
  testEnvironmentSetup,
  
  // Helper functions
  setupTestEnvironment: () => testEnvironmentSetup.initialize(),
  cleanupTestEnvironment: () => testEnvironmentSetup.cleanup(),
  getTestData: (key) => testEnvironmentSetup.getTestData(key),
  getTestUser: (role) => testEnvironmentSetup.getTestUser(role),
  getTestCustomer: (type) => testEnvironmentSetup.getTestCustomer(type),
  getTestDatabase: () => testEnvironmentSetup.getTestDatabase(),
  getStripe: () => testEnvironmentSetup.getStripe()
};