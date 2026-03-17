async function runStripePayroll() {
  console.log('--- Starting Stripe Payroll Mock Execution ---');
  const API_URL = 'http://localhost:3002/api';

  try {
    // 1. Simulate Stripe Payroll
    console.log('\n[1] Creating Payroll Journal Entry...');
    const payrollRes = await fetch(`${API_URL}/stripe/journal/payroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User-ID': 'system', 'X-User-Email': 'system@localhost' },
      body: JSON.stringify({
        employeeId: 'EMP-001',
        employeeName: 'Sarah Johnson',
        grossAmount: 5000,
        netAmount: 3800,
        taxAmount: 1200,
        bankRoutingNumber: '021000021',
        bankAccountLast4: '1234',
        payPeriod: 'Q3-2025',
        payrollDate: new Date().toISOString().split('T')[0]
      })
    });
    
    const payrollData = await payrollRes.json();
    console.log('Payroll Response:', JSON.stringify(payrollData, null, 2));

    if (payrollData.success) {
      console.log('✅ Payroll Journal Entry successfully created.');
    } else {
      console.error('❌ Failed to create Payroll Journal Entry.');
    }

    // 2. Simulate Vendor Payment (Bills Received)
    console.log('\n[2] Creating Vendor Payment Journal Entry...');
    const vendorPaymentRes = await fetch(`${API_URL}/stripe/journal/vendor-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User-ID': 'system', 'X-User-Email': 'system@localhost' },
      body: JSON.stringify({
        vendorId: 'VEN-001',
        vendorName: 'Amazon Web Services',
        invoiceNumber: 'INV-AWS-10492',
        amount: 1250.00,
        paymentMethod: 'ACH',
        bankAccountLast4: '9999',
        description: 'Monthly cloud infrastructure costs'
      })
    });

    const vendorData = await vendorPaymentRes.json();
    console.log('Vendor Payment Response:', JSON.stringify(vendorData, null, 2));

    if (vendorData.success) {
      console.log('✅ Vendor Payment Journal Entry successfully created.');
    } else {
      console.error('❌ Failed to create Vendor Payment Journal Entry.');
    }

  } catch (error) {
    console.error('Execution Error:', error);
  }
}

runStripePayroll();
