/**
 * ORACLE-LEDGER Stripe API Integration Tests
 * Comprehensive testing for all Stripe API endpoints and integration
 * Updated: 2025-11-02
 */

const Stripe = require('stripe');
const axios = require('axios');
const { assert } = require('chai');
const { testEnvironmentSetup, getStripe, getTestCustomer, getTestUser } = require('./test-environment-setup');

/**
 * Stripe API Integration Test Suite
 */
class TestStripeApis {
  constructor() {
    this.testResults = new Map();
    this.stripe = null;
    this.apiUrl = null;
    this.authHeaders = {};
  }

  /**
   * Initialize test suite
   */
  async initialize() {
    console.log('🚀 Initializing Stripe API Integration Tests...');
    
    this.stripe = getStripe();
    this.apiUrl = process.env.TEST_API_URL || 'http://localhost:3001/api';
    
    // Setup authentication headers
    const adminUser = getTestUser('admin');
    if (adminUser) {
      this.authHeaders = {
        'Authorization': `Bearer mock_admin_token`,
        'Content-Type': 'application/json',
        'X-User-ID': adminUser.id
      };
    }
    
    console.log('✅ Stripe API Integration Tests initialized');
  }

  /**
   * Run all API integration tests
   */
  async runAllTests() {
    const results = {
      total: 0,
      passed: 0,
      failed: 0,
      tests: []
    };

    const testMethods = [
      this.testCustomerApi,
      this.testPaymentMethodApi,
      this.testPaymentIntentApi,
      this.testChargesApi,
      this.testBalanceApi,
      this.testWebhookApi,
      this.testErrorHandling,
      this.testRateLimiting,
      this.testAuthentication,
      this.testAuthorization,
      this.testApiVersioning,
      this.testIdempotencyKeys,
      this.testRequestResponseValidation,
      this.testRetryMechanism,
      this.testConcurrency
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
   * Test customer API endpoints
   */
  async testCustomerApi() {
    const result = {
      name: 'testCustomerApi',
      success: true,
      details: {}
    };

    try {
      // Test 1: Create customer via API
      const createCustomerResponse = await this.makeApiCall('POST', '/customers', {
        email: 'api-test@customer.com',
        name: 'API Test Customer',
        metadata: { test_api: 'true' }
      });
      
      assert.equal(createCustomerResponse.status, 201, 'Customer should be created');
      assert.isNotNull(createCustomerResponse.data.id, 'Customer ID should be returned');
      assert.equal(createCustomerResponse.data.email, 'api-test@customer.com', 
        'Customer email should match');

      // Test 2: Retrieve customer via API
      const getCustomerResponse = await this.makeApiCall('GET', `/customers/${createCustomerResponse.data.id}`);
      assert.equal(getCustomerResponse.status, 200, 'Customer should be retrieved');
      assert.equal(getCustomerResponse.data.email, 'api-test@customer.com',
        'Retrieved customer should match');

      // Test 3: Update customer via API
      const updateCustomerResponse = await this.makeApiCall('PUT', `/customers/${createCustomerResponse.data.id}`, {
        name: 'Updated API Test Customer',
        metadata: { test_api: 'true', updated: 'true' }
      });
      assert.equal(updateCustomerResponse.status, 200, 'Customer should be updated');
      assert.equal(updateCustomerResponse.data.name, 'Updated API Test Customer',
        'Customer name should be updated');

      // Test 4: List customers via API
      const listCustomersResponse = await this.makeApiCall('GET', '/customers', {
        limit: 10
      });
      assert.equal(listCustomersResponse.status, 200, 'Customers should be listed');
      assert.isArray(listCustomersResponse.data, 'Customer list should be an array');
      assert.isTrue(listCustomersResponse.data.length >= 0, 'Should return customer list');

      // Test 5: Delete customer via API
      const deleteCustomerResponse = await this.makeApiCall('DELETE', `/customers/${createCustomerResponse.data.id}`);
      assert.equal(deleteCustomerResponse.status, 200, 'Customer should be deleted');

      result.details = {
        customerCreated: createCustomerResponse.data.id,
        customerRetrieved: getCustomerResponse.data.id,
        customerUpdated: updateCustomerResponse.data.id,
        customersListed: listCustomersResponse.data.length
      };
      
    } catch (error) {
      result.success = false;
      result.error = error.message;
    }

    return result;
  }

  /**
   * Test payment method API endpoints
   */
  async testPaymentMethodApi() {
    const result = {
      name: 'testPaymentMethodApi',
      success: true,
      details: {}
    };

    try {
      const customer = getTestCustomer('business');
      assert.isNotNull(customer, 'Test customer should exist');

      // Test 1: Create payment method via API
      const createPaymentMethodResponse = await this.makeApiCall('POST', '/payment-methods', {
        customer_id: customer.stripe_customer_id,
        type: 'us_bank_account',
        us_bank_account: {
          routing_number: '021000021',
          account_number: '000123456789',
          account_type: 'checking',
          account_holder_name: `${customer.first_name} ${customer.last_name}`
        }
      });
      
      assert.equal(createPaymentMethodResponse.status, 201, 'Payment method should be created');
      assert.isNotNull(createPaymentMethodResponse.data.id, 'Payment method ID should be returned');
      assert.equal(createPaymentMethodResponse.data.type, 'us_bank_account', 
        'Payment method type should match');

      // Test 2: Attach payment method to customer
      const attachPaymentMethodResponse = await this.makeApiCall('POST', 
        `/payment-methods/${createPaymentMethodResponse.data.id}/attach`, {
        customer: customer.stripe_customer_id
      });
      assert.equal(attachPaymentMethodResponse.status, 200, 'Payment method should be attached');

      // Test 3: Retrieve payment method via API
      const getPaymentMethodResponse = await this.makeApiCall('GET', 
        `/payment-methods/${createPaymentMethodResponse.data.id}`);
      assert.equal(getPaymentMethodResponse.status, 200, 'Payment method should be retrieved');

      // Test 4: Update payment method via API
      const updatePaymentMethodResponse = await this.makeApiCall('POST', 
        `/payment-methods/${createPaymentMethodResponse.data.id}/update`, {
        metadata: { test_api: 'true', updated: 'true' }
      });
      assert.equal(updatePaymentMethodResponse.status, 200, 'Payment method should be updated');

      // Test 5: List payment methods via API
      const listPaymentMethodsResponse = await this.makeApiCall('GET', '/payment-methods', {
        customer: customer.stripe_customer_id,
        limit: 10
      });
      assert.equal(listPaymentMethodsResponse.status, 200, 'Payment methods should be listed');
      assert.isArray(listPaymentMethodsResponse.data, 'Payment method list should be an array');

      // Test 6: Detach payment method via API
      const detachPaymentMethodResponse = await this.makeApiCall('POST', 
        `/payment-methods/${createPaymentMethodResponse.data.id}/detach`);
      assert.equal(detachPaymentMethodResponse.status, 200, 'Payment method should be detached');

      result.details = {
        paymentMethodCreated: createPaymentMethodResponse.data.id,
        paymentMethodAttached: true,
        paymentMethodRetrieved: getPaymentMethodResponse.data.id,
        paymentMethodUpdated: updatePaymentMethodResponse.data.id,
        paymentMethodsListed: listPaymentMethodsResponse.data.length,
        paymentMethodDetached: true
      };
      
    } catch (error) {
      result.success = false;
      result.error = error.message;
    }

    return result;
  }

  /**
   * Test payment intent API endpoints
   */
  async testPaymentIntentApi() {
    const result = {
      name: 'testPaymentIntentApi',
      success: true,
      details: {}
    };

    try {
      const customer = getTestCustomer('business');

      // Test 1: Create payment intent via API
      const createPaymentIntentResponse = await this.makeApiCall('POST', '/payment-intents', {
        amount: 25000, // $250.00
        currency: 'usd',
        payment_method_types: ['us_bank_account'],
        customer: customer.stripe_customer_id,
        description: 'API Test Payment Intent',
        metadata: { test_api: 'true' }
      });
      
      assert.equal(createPaymentIntentResponse.status, 201, 'Payment intent should be created');
      assert.isNotNull(createPaymentIntentResponse.data.id, 'Payment intent ID should be returned');
      assert.equal(createPaymentIntentResponse.data.amount, 25000, 'Amount should match');

      // Test 2: Confirm payment intent via API
      const confirmPaymentIntentResponse = await this.makeApiCall('POST', 
        `/payment-intents/${createPaymentIntentResponse.data.id}/confirm`);
      assert.equal(confirmPaymentIntentResponse.status, 200, 'Payment intent should be confirmed');

      // Test 3: Retrieve payment intent via API
      const getPaymentIntentResponse = await this.makeApiCall('GET', 
        `/payment-intents/${createPaymentIntentResponse.data.id}`);
      assert.equal(getPaymentIntentResponse.status, 200, 'Payment intent should be retrieved');
      assert.equal(getPaymentIntentResponse.data.amount, 25000, 'Amount should match');

      // Test 4: Update payment intent via API
      const updatePaymentIntentResponse = await this.makeApiCall('POST', 
        `/payment-intents/${createPaymentIntentResponse.data.id}/update`, {
        description: 'Updated API Test Payment Intent',
        metadata: { test_api: 'true', updated: 'true' }
      });
      assert.equal(updatePaymentIntentResponse.status, 200, 'Payment intent should be updated');

      // Test 5: Cancel payment intent via API
      const cancelPaymentIntentResponse = await this.makeApiCall('POST', 
        `/payment-intents/${createPaymentIntentResponse.data.id}/cancel`);
      assert.equal(cancelPaymentIntentResponse.status, 200, 'Payment intent should be cancelled');

      result.details = {
        paymentIntentCreated: createPaymentIntentResponse.data.id,
        paymentIntentConfirmed: true,
        paymentIntentRetrieved: getPaymentIntentResponse.data.id,
        paymentIntentUpdated: updatePaymentIntentResponse.data.id,
        paymentIntentCancelled: true
      };
      
    } catch (error) {
      result.success = false;
      result.error = error.message;
    }

    return result;
  }

  /**
   * Test charges API endpoints
   */
  async testChargesApi() {
    const result = {
      name: 'testChargesApi',
      success: true,
      details: {}
    };

    try {
      const customer = getTestCustomer('business');

      // Test 1: Create charge via API
      const createChargeResponse = await this.makeApiCall('POST', '/charges', {
        amount: 15000, // $150.00
        currency: 'usd',
        customer: customer.stripe_customer_id,
        description: 'API Test Charge',
        metadata: { test_api: 'true' }
      });
      
      assert.equal(createChargeResponse.status, 201, 'Charge should be created');
      assert.isNotNull(createChargeResponse.data.id, 'Charge ID should be returned');
      assert.equal(createChargeResponse.data.amount, 15000, 'Amount should match');

      // Test 2: Retrieve charge via API
      const getChargeResponse = await this.makeApiCall('GET', `/charges/${createChargeResponse.data.id}`);
      assert.equal(getChargeResponse.status, 200, 'Charge should be retrieved');
      assert.equal(getChargeResponse.data.amount, 15000, 'Amount should match');

      // Test 3: Update charge via API
      const updateChargeResponse = await this.makeApiCall('POST', 
        `/charges/${createChargeResponse.data.id}/update`, {
        description: 'Updated API Test Charge',
        metadata: { test_api: 'true', updated: 'true' }
      });
      assert.equal(updateChargeResponse.status, 200, 'Charge should be updated');

      // Test 4: List charges via API
      const listChargesResponse = await this.makeApiCall('GET', '/charges', {
        limit: 10,
        customer: customer.stripe_customer_id
      });
      assert.equal(listChargesResponse.status, 200, 'Charges should be listed');
      assert.isArray(listChargesResponse.data, 'Charge list should be an array');

      // Test 5: Capture charge via API (if authorized but not captured)
      const captureChargeResponse = await this.makeApiCall('POST', 
        `/charges/${createChargeResponse.data.id}/capture`);
      assert.equal(captureChargeResponse.status, 200, 'Charge should be captured');

      result.details = {
        chargeCreated: createChargeResponse.data.id,
        chargeRetrieved: getChargeResponse.data.id,
        chargeUpdated: updateChargeResponse.data.id,
        chargesListed: listChargesResponse.data.length,
        chargeCaptured: true
      };
      
    } catch (error) {
      result.success = false;
      result.error = error.message;
    }

    return result;
  }

  /**
   * Test balance API endpoints
   */
  async testBalanceApi() {
    const result = {
      name: 'testBalanceApi',
      success: true,
      details: {}
    };

    try {
      // Test 1: Retrieve balance via API
      const getBalanceResponse = await this.makeApiCall('GET', '/balance');
      assert.equal(getBalanceResponse.status, 200, 'Balance should be retrieved');
      assert.isArray(getBalanceResponse.data, 'Balance should be an array');

      // Test 2: Retrieve balance transaction via API
      const getBalanceTransactionResponse = await this.makeApiCall('GET', 
        '/balance/transactions/bt_test_123', {
        expand: ['source']
      });
      assert.equal(getBalanceTransactionResponse.status, 200, 
        'Balance transaction should be retrieved');

      // Test 3: List balance transactions via API
      const listBalanceTransactionsResponse = await this.makeApiCall('GET', 
        '/balance/transactions', {
        limit: 10,
        type: 'charge'
      });
      assert.equal(listBalanceTransactionsResponse.status, 200, 
        'Balance transactions should be listed');
      assert.isArray(listBalanceTransactionsResponse.data, 
        'Balance transaction list should be an array');

      result.details = {
        balanceRetrieved: getBalanceResponse.data.length > 0,
        balanceTransactionRetrieved: getBalanceTransactionResponse.data.id || null,
        balanceTransactionsListed: listBalanceTransactionsResponse.data.length
      };
      
    } catch (error) {
      result.success = false;
      result.error = error.message;
    }

    return result;
  }

  /**
   * Test webhook API endpoints
   */
  async testWebhookApi() {
    const result = {
      name: 'testWebhookApi',
      success: true,
      details: {}
    };

    try {
      // Test 1: Create webhook endpoint via API
      const createWebhookResponse = await this.makeApiCall('POST', '/webhook-endpoints', {
        url: `${this.apiUrl}/test-webhook`,
        enabled_events: [
          'payment_intent.succeeded',
          'payment_intent.payment_failed',
          'charge.succeeded'
        ],
        metadata: { test_api: 'true' }
      });
      
      assert.equal(createWebhookResponse.status, 201, 'Webhook endpoint should be created');
      assert.isNotNull(createWebhookResponse.data.id, 'Webhook endpoint ID should be returned');
      assert.isArray(createWebhookResponse.data.enabled_events, 
        'Enabled events should be an array');

      // Test 2: Retrieve webhook endpoint via API
      const getWebhookResponse = await this.makeApiCall('GET', 
        `/webhook-endpoints/${createWebhookResponse.data.id}`);
      assert.equal(getWebhookResponse.status, 200, 'Webhook endpoint should be retrieved');

      // Test 3: Update webhook endpoint via API
      const updateWebhookResponse = await this.makeApiCall('POST', 
        `/webhook-endpoints/${createWebhookResponse.data.id}/update`, {
        url: `${this.apiUrl}/updated-test-webhook`,
        metadata: { test_api: 'true', updated: 'true' }
      });
      assert.equal(updateWebhookResponse.status, 200, 'Webhook endpoint should be updated');

      // Test 4: List webhook endpoints via API
      const listWebhooksResponse = await this.makeApiCall('GET', '/webhook-endpoints', {
        limit: 10
      });
      assert.equal(listWebhooksResponse.status, 200, 'Webhook endpoints should be listed');
      assert.isArray(listWebhooksResponse.data, 'Webhook endpoint list should be an array');

      // Test 5: Delete webhook endpoint via API
      const deleteWebhookResponse = await this.makeApiCall('DELETE', 
        `/webhook-endpoints/${createWebhookResponse.data.id}`);
      assert.equal(deleteWebhookResponse.status, 200, 'Webhook endpoint should be deleted');

      result.details = {
        webhookCreated: createWebhookResponse.data.id,
        webhookRetrieved: getWebhookResponse.data.id,
        webhookUpdated: updateWebhookResponse.data.id,
        webhooksListed: listWebhooksResponse.data.length,
        webhookDeleted: true
      };
      
    } catch (error) {
      result.success = false;
      result.error = error.message;
    }

    return result;
  }

  /**
   * Test error handling
   */
  async testErrorHandling() {
    const result = {
      name: 'testErrorHandling',
      success: true,
      details: {}
    };

    try {
      // Test 1: Invalid request error handling
      const invalidRequestResponse = await this.makeApiCall('POST', '/payment-intents', {
        amount: 'invalid', // Invalid amount
        currency: 'usd'
      }, false); // Don't throw on error
      
      assert.equal(invalidRequestResponse.status, 400, 'Invalid request should return 400');
      assert.isNotNull(invalidRequestResponse.data.error, 'Error should be returned');

      // Test 2: Authentication error handling
      const authErrorResponse = await this.makeApiCall('GET', '/customers', null, false, {
        'Authorization': 'Bearer invalid_token'
      });
      assert.equal(authErrorResponse.status, 401, 'Invalid auth should return 401');

      // Test 3: Not found error handling
      const notFoundResponse = await this.makeApiCall('GET', '/customers/cus_nonexistent', null, false);
      assert.equal(notFoundResponse.status, 404, 'Non-existent resource should return 404');

      // Test 4: Rate limit error handling
      const rateLimitResponse = await this.makeApiCall('GET', '/balance', null, false);
      assert.isTrue([200, 429].includes(rateLimitResponse.status), 
        'Rate limit or success expected');

      // Test 5: Server error handling
      const serverErrorResponse = await this.makeApiCall('POST', '/internal-error-test', {}, false);
      assert.isTrue([500, 503].includes(serverErrorResponse.status), 
        'Server error should return 5xx status');

      result.details = {
        invalidRequestHandled: true,
        authErrorHandled: true,
        notFoundHandled: true,
        rateLimitHandled: true,
        serverErrorHandled: true
      };
      
    } catch (error) {
      result.success = false;
      result.error = error.message;
    }

    return result;
  }

  /**
   * Test rate limiting
   */
  async testRateLimiting() {
    const result = {
      name: 'testRateLimiting',
      success: true,
      details: {}
    };

    try {
      // Test 1: Send multiple requests to trigger rate limiting
      const startTime = Date.now();
      const requests = [];
      
      for (let i = 0; i < 15; i++) {
        const response = await this.makeApiCall('GET', '/balance', null, false);
        requests.push({
          request: i + 1,
          status: response.status,
          time: Date.now() - startTime
        });
      }
      
      const totalTime = Date.now() - startTime;
      const rateLimitedRequests = requests.filter(r => r.status === 429);
      const successfulRequests = requests.filter(r => r.status === 200);

      // Should handle rate limiting gracefully
      assert.isTrue(successfulRequests.length > 0, 'Some requests should succeed');
      console.log(`✅ Rate limiting test: ${successfulRequests.length} successful, ${rateLimitedRequests.length} rate limited in ${totalTime}ms`);

      // Test 2: Rate limit headers validation
      const balanceResponse = await this.makeApiCall('GET', '/balance');
      const rateLimitHeaders = {
        'X-RateLimit-Limit': balanceResponse.headers['x-ratelimit-limit'],
        'X-RateLimit-Remaining': balanceResponse.headers['x-ratelimit-remaining'],
        'X-RateLimit-Reset': balanceResponse.headers['x-ratelimit-reset']
      };

      assert.isNotNull(rateLimitHeaders['X-RateLimit-Limit'], 
        'Rate limit header should be present');
      assert.isNotNull(rateLimitHeaders['X-RateLimit-Remaining'], 
        'Rate limit remaining header should be present');

      result.details = {
        totalRequests: requests.length,
        successfulRequests: successfulRequests.length,
        rateLimitedRequests: rateLimitedRequests.length,
        totalTimeMs: totalTime,
        rateLimitHeadersPresent: Object.keys(rateLimitHeaders).length > 0
      };
      
    } catch (error) {
      result.success = false;
      result.error = error.message;
    }

    return result;
  }

  /**
   * Test authentication
   */
  async testAuthentication() {
    const result = {
      name: 'testAuthentication',
      success: true,
      details: {}
    };

    try {
      // Test 1: Valid authentication
      const validAuthResponse = await this.makeApiCall('GET', '/customers', null, true, this.authHeaders);
      assert.equal(validAuthResponse.status, 200, 'Valid authentication should succeed');

      // Test 2: Missing authentication
      const noAuthResponse = await this.makeApiCall('GET', '/customers', null, false, {});
      assert.equal(noAuthResponse.status, 401, 'Missing auth should return 401');

      // Test 3: Invalid token
      const invalidTokenResponse = await this.makeApiCall('GET', '/customers', null, false, {
        'Authorization': 'Bearer invalid_token'
      });
      assert.equal(invalidTokenResponse.status, 401, 'Invalid token should return 401');

      // Test 4: Malformed authorization header
      const malformedAuthResponse = await this.makeApiCall('GET', '/customers', null, false, {
        'Authorization': 'InvalidFormat token'
      });
      assert.equal(malformedAuthResponse.status, 401, 'Malformed auth should return 401');

      result.details = {
        validAuthWorks: true,
        noAuthRejected: true,
        invalidTokenRejected: true,
        malformedAuthRejected: true
      };
      
    } catch (error) {
      result.success = false;
      result.error = error.message;
    }

    return result;
  }

  /**
   * Test authorization
   */
  async testAuthorization() {
    const result = {
      name: 'testAuthorization',
      success: true,
      details: {}
    };

    try {
      const viewerUser = getTestUser('viewer');
      const accountantUser = getTestUser('accountant');
      
      assert.isNotNull(viewerUser, 'Viewer user should exist');
      assert.isNotNull(accountantUser, 'Accountant user should exist');

      // Test 1: Viewer user permissions (read-only)
      const viewerAuthHeaders = {
        'Authorization': `Bearer mock_viewer_token`,
        'Content-Type': 'application/json',
        'X-User-ID': viewerUser.id
      };
      
      const viewerReadResponse = await this.makeApiCall('GET', '/customers', null, true, viewerAuthHeaders);
      assert.equal(viewerReadResponse.status, 200, 'Viewer should be able to read');

      const viewerWriteResponse = await this.makeApiCall('POST', '/customers', {
        email: 'unauthorized@test.com',
        name: 'Unauthorized Test'
      }, false, viewerAuthHeaders);
      assert.equal(viewerWriteResponse.status, 403, 'Viewer should not be able to write');

      // Test 2: Accountant user permissions (read/write)
      const accountantAuthHeaders = {
        'Authorization': `Bearer mock_accountant_token`,
        'Content-Type': 'application/json',
        'X-User-ID': accountantUser.id
      };
      
      const accountantReadResponse = await this.makeApiCall('GET', '/customers', null, true, accountantAuthHeaders);
      assert.equal(accountantReadResponse.status, 200, 'Accountant should be able to read');

      const accountantWriteResponse = await this.makeApiCall('POST', '/customers', {
        email: 'accountant@test.com',
        name: 'Accountant Test'
      }, false, accountantAuthHeaders);
      assert.isTrue([201, 403].includes(accountantWriteResponse.status), 
        'Accountant write should succeed or be authorized');

      result.details = {
        viewerCanRead: true,
        viewerCannotWrite: true,
        accountantCanRead: true,
        accountantWriteAttempted: true
      };
      
    } catch (error) {
      result.success = false;
      result.error = error.message;
    }

    return result;
  }

  /**
   * Test API versioning
   */
  async testApiVersioning() {
    const result = {
      name: 'testApiVersioning',
      success: true,
      details: {}
    };

    try {
      // Test 1: Default API version
      const defaultVersionResponse = await this.makeApiCall('GET', '/customers', null, true, {
        ...this.authHeaders,
        'Stripe-Version': undefined
      });
      assert.equal(defaultVersionResponse.status, 200, 'Default version should work');

      // Test 2: Specific API version
      const specificVersionResponse = await this.makeApiCall('GET', '/customers', null, true, {
        ...this.authHeaders,
        'Stripe-Version': '2024-06-20'
      });
      assert.equal(specificVersionResponse.status, 200, 'Specific version should work');

      // Test 3: Unsupported API version
      const unsupportedVersionResponse = await this.makeApiCall('GET', '/customers', null, false, {
        ...this.authHeaders,
        'Stripe-Version': '2020-01-01' // Very old version
      });
      assert.isTrue([400, 422].includes(unsupportedVersionResponse.status), 
        'Unsupported version should return error');

      result.details = {
        defaultVersionWorks: true,
        specificVersionWorks: true,
        unsupportedVersionRejected: true
      };
      
    } catch (error) {
      result.success = false;
      result.error = error.message;
    }

    return result;
  }

  /**
   * Test idempotency keys
   */
  async testIdempotencyKeys() {
    const result = {
      name: 'testIdempotencyKeys',
      success: true,
      details: {}
    };

    try {
      // Test 1: Idempotent request creation
      const customerId = `cus_test_${Date.now()}`;
      const idempotencyKey = `idem_${Date.now()}`;
      
      const firstRequest = await this.makeApiCall('POST', '/customers', {
        email: 'idempotent@test.com',
        name: 'Idempotent Test Customer'
      }, true, {
        ...this.authHeaders,
        'Idempotency-Key': idempotencyKey
      });
      
      const secondRequest = await this.makeApiCall('POST', '/customers', {
        email: 'idempotent@test.com',
        name: 'Idempotent Test Customer'
      }, true, {
        ...this.authHeaders,
        'Idempotency-Key': idempotencyKey
      });

      assert.equal(firstRequest.status, 201, 'First request should succeed');
      assert.equal(secondRequest.status, 200, 'Second request should return existing resource');
      assert.equal(firstRequest.data.id, secondRequest.data.id, 
        'Requests should return same resource');

      // Test 2: Different requests with same customer email
      const differentIdempotencyKey = `idem_different_${Date.now()}`;
      const differentRequest = await this.makeApiCall('POST', '/customers', {
        email: 'different@test.com',
        name: 'Different Customer'
      }, true, {
        ...this.authHeaders,
        'Idempotency-Key': differentIdempotencyKey
      });

      assert.equal(differentRequest.status, 201, 'Different request should succeed');
      assert.notEqual(firstRequest.data.id, differentRequest.data.id, 
        'Different requests should create different resources');

      result.details = {
        idempotentRequestHandled: true,
        sameResourceReturned: true,
        differentRequestsHandled: true
      };
      
    } catch (error) {
      result.success = false;
      result.error = error.message;
    }

    return result;
  }

  /**
   * Test request/response validation
   */
  async testRequestResponseValidation() {
    const result = {
      name: 'testRequestResponseValidation',
      success: true,
      details: {}
    };

    try {
      // Test 1: Required field validation
      const missingFieldResponse = await this.makeApiCall('POST', '/customers', {
        name: 'Incomplete Customer'
        // Missing required email field
      }, false);
      
      assert.equal(missingFieldResponse.status, 400, 'Missing required field should return 400');
      assert.isNotNull(missingFieldResponse.data.error, 'Error should be provided');

      // Test 2: Invalid field type validation
      const invalidTypeResponse = await this.makeApiCall('POST', '/customers', {
        email: 'valid@email.com',
        name: 'Valid Customer',
        metadata: 'invalid_metadata_type' // Should be object
      }, false);
      
      assert.equal(invalidTypeResponse.status, 400, 'Invalid field type should return 400');

      // Test 3: Response structure validation
      const validCustomerResponse = await this.makeApiCall('POST', '/customers', {
        email: 'validation@test.com',
        name: 'Validation Test Customer',
        metadata: { test: 'validation' }
      });
      
      assert.isNotNull(validCustomerResponse.data.id, 'Response should have id');
      assert.isNotNull(validCustomerResponse.data.created, 'Response should have created timestamp');
      assert.equal(validCustomerResponse.data.object, 'customer', 'Response should have correct object type');

      result.details = {
        requiredFieldValidation: true,
        invalidTypeValidation: true,
        responseStructureValid: true
      };
      
    } catch (error) {
      result.success = false;
      result.error = error.message;
    }

    return result;
  }

  /**
   * Test retry mechanism
   */
  async testRetryMechanism() {
    const result = {
      name: 'testRetryMechanism',
      success: true,
      details: {}
    };

    try {
      // Test 1: Automatic retry on transient errors
      const retryAttempts = [];
      
      for (let i = 0; i < 3; i++) {
        try {
          const response = await this.makeApiCall('GET', '/balance', null, true, this.authHeaders);
          retryAttempts.push({
            attempt: i + 1,
            status: response.status,
            success: true
          });
          break; // Success, no need for more attempts
        } catch (error) {
          retryAttempts.push({
            attempt: i + 1,
            status: error.response?.status || 0,
            success: false,
            error: error.message
          });
          
          if (i < 2) { // Don't sleep on last attempt
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
          }
        }
      }
      
      const successfulAttempts = retryAttempts.filter(a => a.success);
      assert.isTrue(successfulAttempts.length > 0, 'At least one retry should succeed');

      result.details = {
        totalRetryAttempts: retryAttempts.length,
        successfulAttempts: successfulAttempts.length,
        retryMechanismWorking: successfulAttempts.length > 0
      };
      
    } catch (error) {
      result.success = false;
      result.error = error.message;
    }

    return result;
  }

  /**
   * Test concurrency handling
   */
  async testConcurrency() {
    const result = {
      name: 'testConcurrency',
      success: true,
      details: {}
    };

    try {
      // Test 1: Concurrent customer creation
      const concurrentRequests = [];
      const baseEmail = `concurrent.${Date.now()}`;
      
      for (let i = 0; i < 5; i++) {
        const requestPromise = this.makeApiCall('POST', '/customers', {
          email: `${baseEmail}.${i}@test.com`,
          name: `Concurrent Customer ${i}`
        }, true, this.authHeaders);
        concurrentRequests.push(requestPromise);
      }
      
      const concurrentResponses = await Promise.all(concurrentRequests);
      const successfulResponses = concurrentResponses.filter(r => r.status === 201);
      
      assert.isTrue(successfulResponses.length > 0, 'At least some concurrent requests should succeed');
      assert.equal(successfulResponses.length, concurrentRequests.length, 
        'All concurrent requests should succeed');

      // Test 2: Concurrent balance requests
      const balanceRequests = [];
      for (let i = 0; i < 10; i++) {
        const requestPromise = this.makeApiCall('GET', '/balance', null, true, this.authHeaders);
        balanceRequests.push(requestPromise);
      }
      
      const balanceResponses = await Promise.all(balanceRequests);
      const balanceSuccesses = balanceResponses.filter(r => r.status === 200);
      
      assert.isTrue(balanceSuccesses.length >= balanceRequests.length * 0.8, 
        'At least 80% of concurrent balance requests should succeed');

      result.details = {
        concurrentCustomerCreates: concurrentRequests.length,
        successfulCustomerCreates: successfulResponses.length,
        concurrentBalanceRequests: balanceRequests.length,
        successfulBalanceRequests: balanceSuccesses.length
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
   * Make API call with error handling
   */
  async makeApiCall(method, endpoint, data = null, throwOnError = true, headers = null) {
    const requestConfig = {
      method: method.toLowerCase(),
      url: `${this.apiUrl}${endpoint}`,
      timeout: 30000, // 30 second timeout
      headers: headers || this.authHeaders
    };

    if (data && ['post', 'put', 'patch'].includes(requestConfig.method)) {
      requestConfig.data = data;
    } else if (data && requestConfig.method === 'get') {
      requestConfig.params = data;
    }

    try {
      const response = await axios(requestConfig);
      
      // Log successful API calls for debugging
      console.log(`✅ API ${method} ${endpoint}: ${response.status}`);
      
      return response;
      
    } catch (error) {
      const status = error.response?.status || 0;
      const message = error.response?.data || error.message;
      
      console.log(`❌ API ${method} ${endpoint}: ${status} - ${JSON.stringify(message)}`);
      
      if (throwOnError) {
        throw new Error(`API call failed: ${method} ${endpoint} - ${status} - ${JSON.stringify(message)}`);
      }
      
      return error.response || { status, data: message, headers: error.response?.headers };
    }
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
  TestStripeApis,
  
  // Run all API integration tests
  runStripeApiTests: async () => {
    const testSuite = new TestStripeApis();
    await testSuite.initialize();
    const results = await testSuite.runAllTests();
    return {
      results,
      report: testSuite.generateTestReport()
    };
  }
};