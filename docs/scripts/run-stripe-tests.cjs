const { runStripeApiTests } = require('./test-stripe-apis.cjs');

console.log('Starting Stripe API Tests...');

(async () => {
  try {
    const { results } = await runStripeApiTests();
    console.log('\n--- Test Summary ---');
    console.log(`Passed: ${results.passed}`);
    console.log(`Failed: ${results.failed}`);
    console.log(`Total: ${results.total}`);
    
    if (results.failed > 0) {
      console.log('Detailed Failures:', JSON.stringify(results.tests.filter(t => !t.success), null, 2));
    }
    
    process.exit(results.failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test Execution Error:', err);
    process.exit(1);
  }
})();
