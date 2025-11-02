import React, { useState, useEffect } from 'react';
import type { Employee, DirectDepositRecipient, DirectDepositBankAccount, UserRole } from '../../types';

interface DirectDepositSetupProps {
  employeeId?: string;
  onComplete?: (recipientId: string) => void;
  currentUserRole: UserRole;
}

export const DirectDepositSetup: React.FC<DirectDepositSetupProps> = ({
  employeeId,
  onComplete,
  currentUserRole,
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [recipient, setRecipient] = useState<Partial<DirectDepositRecipient>>({});
  const [bankAccounts, setBankAccounts] = useState<Partial<DirectDepositBankAccount>[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [kycDocuments, setKycDocuments] = useState<File[]>([]);
  const [stripeAccountId, setStripeAccountId] = useState<string>('');
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'failed'>('pending');
  const [error, setError] = useState<string>('');

  const totalSteps = 5;

  useEffect(() => {
    loadEmployees();
    if (employeeId) {
      loadEmployeeData(employeeId);
    }
  }, [employeeId]);

  const loadEmployees = async () => {
    try {
      // Load from API
      setEmployees([]);
    } catch (err) {
      console.error('Error loading employees:', err);
    }
  };

  const loadEmployeeData = async (empId: string) => {
    try {
      setLoading(true);
      // Load employee data and existing recipient setup
    } catch (err) {
      console.error('Error loading employee data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployee(employee);
    setRecipient({
      firstName: employee.name.split(' ')[0],
      lastName: employee.name.split(' ').slice(1).join(' '),
      email: `${employee.id.toLowerCase()}@company.com`,
      employeeId: employee.id,
      verificationStatus: 'pending',
      verificationRequired: true,
    });
  };

  const createStripeConnectAccount = async () => {
    if (!selectedEmployee) return;

    setLoading(true);
    setError('');

    try {
      // Create Stripe Connect account
      const response = await fetch('/api/stripe/connect/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'express',
          country: 'US',
          email: recipient.email,
          metadata: {
            employeeId: selectedEmployee.id,
            employeeName: selectedEmployee.name,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to create Stripe Connect account');

      const { accountId } = await response.json();
      setStripeAccountId(accountId);
      setCurrentStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const submitVerificationDocuments = async () => {
    if (!stripeAccountId || kycDocuments.length === 0) {
      setError('Please upload required verification documents');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('accountId', stripeAccountId);
      kycDocuments.forEach((file, index) => {
        formData.append(`document_${index}`, file);
      });

      const response = await fetch('/api/stripe/connect/verification', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to submit verification documents');

      setCurrentStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit documents');
    } finally {
      setLoading(false);
    }
  };

  const addBankAccount = () => {
    if (bankAccounts.length >= 5) {
      setError('Maximum 5 bank accounts allowed');
      return;
    }

    setBankAccounts([
      ...bankAccounts,
      {
        accountHolderName: `${recipient.firstName} ${recipient.lastName}`,
        accountType: 'checking',
        currency: 'USD',
        status: 'pending',
        isVerified: false,
        isDefault: bankAccounts.length === 0,
      },
    ]);
  };

  const updateBankAccount = (index: number, field: string, value: any) => {
    const updated = [...bankAccounts];
    updated[index] = { ...updated[index], [field]: value };
    setBankAccounts(updated);
  };

  const connectBankAccountWithStripe = async (index: number) => {
    const account = bankAccounts[index];
    if (!stripeAccountId || !account.routingNumber || !account.accountNumberLast4) {
      setError('Please fill in all bank account details');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/stripe/connect/accounts/${stripeAccountId}/bank-accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routing_number: account.routingNumber,
          account_number: account.accountNumberLast4,
          account_holder_name: account.accountHolderName,
          account_holder_type: 'individual',
          type: account.accountType,
        }),
      });

      if (!response.ok) throw new Error('Failed to connect bank account');

      const { bankAccountId } = await response.json();
      updatedBankAccounts(index, 'stripeBankAccountId', bankAccountId);
      setCurrentStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect bank account');
    } finally {
      setLoading(false);
    }
  };

  const completeSetup = async () => {
    if (!selectedEmployee || !stripeAccountId) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/direct-deposit/recipients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stripeAccountId,
          employeeId: selectedEmployee.id,
          firstName: recipient.firstName,
          lastName: recipient.lastName,
          email: recipient.email,
          phone: recipient.phone,
          verificationStatus: 'pending',
          bankAccounts: bankAccounts.map(bank => ({
            stripeBankAccountId: bank.stripeBankAccountId,
            accountHolderName: bank.accountHolderName,
            bankName: bank.bankName,
            routingNumber: bank.routingNumber,
            accountNumberLast4: bank.accountNumberLast4,
            accountType: bank.accountType,
            isDefault: bank.isDefault,
          })),
        }),
      });

      if (!response.ok) throw new Error('Failed to complete setup');

      const { id } = await response.json();
      setCurrentStep(5);
      onComplete?.(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete setup');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setKycDocuments(files);
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div key={i} className="flex items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              i + 1 <= currentStep
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {i + 1}
          </div>
          {i < totalSteps - 1 && (
            <div
              className={`w-full h-1 mx-2 ${
                i + 1 < currentStep ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderEmployeeSelection = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Select Employee</h3>
      {currentUserRole === 'Admin' || currentUserRole === 'Finance' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {employees.map((emp) => (
            <div
              key={emp.id}
              onClick={() => handleEmployeeSelect(emp)}
              className={`p-4 border rounded-lg cursor-pointer hover:border-blue-500 ${
                selectedEmployee?.id === emp.id ? 'border-blue-500 bg-blue-50' : ''
              }`}
            >
              <p className="font-semibold">{emp.name}</p>
              <p className="text-sm text-gray-600">ID: {emp.id}</p>
              <p className="text-sm text-gray-600">
                Salary: ${emp.annualSalary.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p>Setting up direct deposit for: {selectedEmployee?.name}</p>
        </div>
      )}
    </div>
  );

  const renderStripeAccountCreation = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Create Stripe Connect Account</h3>
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          This will create a Stripe Connect Express account for the employee to receive direct deposits.
        </p>
      </div>
      <button
        onClick={createStripeConnectAccount}
        disabled={loading}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? 'Creating Account...' : 'Create Stripe Connect Account'}
      </button>
    </div>
  );

  const renderKYCVerification = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">KYC/AML Verification</h3>
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold mb-2">Required Documents:</h4>
        <ul className="list-disc list-inside text-sm space-y-1">
          <li>Government-issued photo ID (Driver's License, Passport, or State ID)</li>
          <li>Social Security Card or W-2 form</li>
          <li>Proof of address (Utility bill or Bank statement)</li>
        </ul>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">
          Upload Verification Documents
        </label>
        <input
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>
      {kycDocuments.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Uploaded Files:</p>
          {kycDocuments.map((file, index) => (
            <p key={index} className="text-sm text-gray-600">
              {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </p>
          ))}
        </div>
      )}
      <button
        onClick={submitVerificationDocuments}
        disabled={loading || kycDocuments.length === 0}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? 'Submitting...' : 'Submit for Verification'}
      </button>
    </div>
  );

  const renderBankAccountSetup = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Bank Account Setup</h3>
        <button
          onClick={addBankAccount}
          disabled={bankAccounts.length >= 5}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 text-sm"
        >
          Add Account ({bankAccounts.length}/5)
        </button>
      </div>
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          Add up to 5 bank accounts for direct deposit. The first account will be set as default.
        </p>
      </div>
      {bankAccounts.map((account, index) => (
        <div key={index} className="p-4 border rounded-lg space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold">
              Account {index + 1} {account.isDefault && '(Default)'}
            </h4>
            <button
              onClick={() => setBankAccounts(bankAccounts.filter((_, i) => i !== index))}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Remove
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Bank Name</label>
              <input
                type="text"
                value={account.bankName || ''}
                onChange={(e) => updateBankAccount(index, 'bankName', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Chase Bank"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Account Type</label>
              <select
                value={account.accountType || 'checking'}
                onChange={(e) => updateBankAccount(index, 'accountType', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Routing Number</label>
              <input
                type="text"
                value={account.routingNumber || ''}
                onChange={(e) => updateBankAccount(index, 'routingNumber', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="021000021"
                maxLength={9}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Account Number (Last 4)</label>
              <input
                type="text"
                value={account.accountNumberLast4 || ''}
                onChange={(e) => updateBankAccount(index, 'accountNumberLast4', e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="1234"
                maxLength={4}
              />
            </div>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id={`default-${index}`}
              checked={account.isDefault}
              onChange={(e) => {
                const updated = bankAccounts.map((acc, i) => ({
                  ...acc,
                  isDefault: i === index ? e.target.checked : false,
                }));
                setBankAccounts(updated);
              }}
              className="mr-2"
            />
            <label htmlFor={`default-${index}`} className="text-sm">
              Set as default account
            </label>
          </div>
        </div>
      ))}
      {bankAccounts.length > 0 && (
        <button
          onClick={() => connectBankAccountWithStripe(0)}
          disabled={loading}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Connecting...' : 'Connect to Stripe'}
        </button>
      )}
    </div>
  );

  const renderCompletion = () => (
    <div className="text-center space-y-4">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <svg
          className="w-10 h-10 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <h3 className="text-2xl font-bold text-green-600">Setup Complete!</h3>
      <p className="text-gray-600">
        Direct deposit setup is complete. Verification may take 1-2 business days.
      </p>
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-left">
        <h4 className="font-semibold mb-2">Next Steps:</h4>
        <ul className="list-disc list-inside text-sm space-y-1 text-blue-800">
          <li>Verification documents are being reviewed</li>
          <li>You'll receive an email once verification is complete</li>
          <li>Bank accounts will be verified automatically</li>
          <li>Direct deposit can be used for next payroll cycle</li>
        </ul>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Direct Deposit Setup</h2>
        <p className="text-gray-600">
          Set up direct deposit for employees using Stripe Connect
        </p>
      </div>

      {renderStepIndicator()}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="min-h-[400px]">
        {currentStep === 1 && renderEmployeeSelection()}
        {currentStep === 2 && renderStripeAccountCreation()}
        {currentStep === 3 && renderKYCVerification()}
        {currentStep === 4 && renderBankAccountSetup()}
        {currentStep === 5 && renderCompletion()}
      </div>

      {currentStep > 1 && currentStep < totalSteps && (
        <div className="flex justify-between mt-6">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Back
          </button>
        </div>
      )}
    </div>
  );
};

export default DirectDepositSetup;
