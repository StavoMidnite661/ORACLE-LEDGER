import React, { useState, useEffect } from 'react';
import type {
  DirectDepositRecipient,
  DirectDepositBankAccount,
  DirectDepositPayout,
  UserRole,
} from '../../types';

interface EmployeeDirectDepositStatusProps {
  employeeId: string;
  currentUserRole: UserRole;
}

export const EmployeeDirectDepositStatus: React.FC<EmployeeDirectDepositStatusProps> = ({
  employeeId,
  currentUserRole,
}) => {
  const [recipient, setRecipient] = useState<DirectDepositRecipient | null>(null);
  const [bankAccounts, setBankAccounts] = useState<DirectDepositBankAccount[]>([]);
  const [payouts, setPayouts] = useState<DirectDepositPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showAddAccountForm, setShowAddAccountForm] = useState(false);
  const [newAccount, setNewAccount] = useState({
    bankName: '',
    routingNumber: '',
    accountNumber: '',
    accountType: 'checking' as 'checking' | 'savings',
  });

  useEffect(() => {
    loadEmployeeData();
  }, [employeeId]);

  const loadEmployeeData = async () => {
    try {
      setLoading(true);
      const [recipientRes, payoutsRes] = await Promise.all([
        fetch(`/api/direct-deposit/recipients?employeeId=${employeeId}`),
        fetch(`/api/direct-deposit/payouts?employeeId=${employeeId}`),
      ]);

      if (!recipientRes.ok || !payoutsRes.ok) {
        throw new Error('Failed to load data');
      }

      const recipientsData = await recipientRes.json();
      const payoutsData = await payoutsRes.json();

      if (recipientsData.length === 0) {
        setError('No direct deposit setup found for this employee');
        return;
      }

      const recipientData = recipientsData[0];
      setRecipient(recipientData);

      // Load bank accounts
      const accountsRes = await fetch(
        `/api/direct-deposit/recipients/${recipientData.id}/bank-accounts`
      );
      if (accountsRes.ok) {
        const accountsData = await accountsRes.json();
        setBankAccounts(accountsData);
      }

      setPayouts(payoutsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load employee data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBankAccount = async () => {
    if (!recipient || !newAccount.bankName || !newAccount.routingNumber || !newAccount.accountNumber) {
      setError('Please fill in all required fields');
      return;
    }

    if (bankAccounts.length >= 5) {
      setError('Maximum 5 bank accounts allowed');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create external bank account in Stripe
      const response = await fetch(
        `/api/stripe/connect/accounts/${recipient.stripeAccountId}/bank-accounts`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            routing_number: newAccount.routingNumber,
            account_number: newAccount.accountNumber,
            account_holder_name: `${recipient.firstName} ${recipient.lastName}`,
            account_holder_type: 'individual',
            type: newAccount.accountType,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to connect bank account');

      const { bankAccountId } = await response.json();

      // Save to database
      const dbResponse = await fetch('/api/direct-deposit/bank-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: recipient.id,
          stripeBankAccountId: bankAccountId,
          accountHolderName: `${recipient.firstName} ${recipient.lastName}`,
          bankName: newAccount.bankName,
          routingNumber: newAccount.routingNumber,
          accountNumberLast4: newAccount.accountNumber.slice(-4),
          accountType: newAccount.accountType,
          isDefault: bankAccounts.length === 0,
        }),
      });

      if (!dbResponse.ok) throw new Error('Failed to save bank account');

      setShowAddAccountForm(false);
      setNewAccount({
        bankName: '',
        routingNumber: '',
        accountNumber: '',
        accountType: 'checking',
      });
      loadEmployeeData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add bank account');
    } finally {
      setLoading(false);
    }
  };

  const requestVerificationUpdate = async () => {
    try {
      const response = await fetch(
        `/api/direct-deposit/recipients/${recipient!.id}/request-verification`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) throw new Error('Failed to request verification update');

      alert('Verification update requested. You will receive an email once processed.');
      loadEmployeeData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request verification update');
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-semibold';
    const colorMap: Record<string, string> = {
      verified: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      verification_failed: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`${baseClasses} ${colorMap[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
      </span>
    );
  };

  const getAccountTypeIcon = (type: string) => {
    return type === 'checking' ? '💳' : '🏦';
  };

  const getPayoutStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-semibold';
    const colorMap: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_transit: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`${baseClasses} ${colorMap[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
      </span>
    );
  };

  if (loading && !recipient) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading your direct deposit information...</div>
      </div>
    );
  }

  if (error && !recipient) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
          <p>{error}</p>
          {(currentUserRole === 'Admin' || currentUserRole === 'Finance') && (
            <button
              onClick={() => window.location.href = '/payroll/setup'}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Set Up Direct Deposit
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!recipient) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-2">My Direct Deposit</h2>
        <p className="text-gray-600">
          View and manage your direct deposit setup and payment history
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Profile and Verification Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600">Name</label>
              <p className="font-medium">
                {recipient.firstName} {recipient.lastName}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Email</label>
              <p className="font-medium">{recipient.email}</p>
            </div>
            {recipient.phone && (
              <div>
                <label className="text-sm text-gray-600">Phone</label>
                <p className="font-medium">{recipient.phone}</p>
              </div>
            )}
            <div>
              <label className="text-sm text-gray-600">Employee ID</label>
              <p className="font-medium">{recipient.employeeId || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Verification Status</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600 block mb-2">Identity Verification</label>
              <div className="flex items-center justify-between">
                {getStatusBadge(recipient.verificationStatus)}
                {recipient.verificationStatus === 'pending' && (
                  <button
                    onClick={requestVerificationUpdate}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Check Status
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-2">KYC Verification</label>
              <div className="flex items-center">
                {getStatusBadge(recipient.kycStatus || 'pending')}
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-2">Bank Accounts</label>
              <div className="flex items-center justify-between">
                <span className="text-sm">
                  {bankAccounts.filter((acc) => acc.isVerified).length} of {bankAccounts.length} verified
                </span>
                {recipient.verificationStatus === 'pending' && (
                  <span className="text-yellow-600 text-sm">Verification pending</span>
                )}
              </div>
            </div>
            {recipient.verificationDueDate && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                <strong>Verification Due:</strong> {new Date(recipient.verificationDueDate).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bank Accounts */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Bank Accounts</h3>
            <button
              onClick={() => setShowAddAccountForm(true)}
              disabled={bankAccounts.length >= 5 || recipient.verificationStatus !== 'verified'}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-sm"
            >
              Add Account ({bankAccounts.length}/5)
            </button>
          </div>
        </div>
        <div className="p-6">
          {bankAccounts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No bank accounts configured</p>
              {recipient.verificationStatus === 'verified' && (
                <button
                  onClick={() => setShowAddAccountForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add First Account
                </button>
              )}
              {recipient.verificationStatus !== 'verified' && (
                <p className="text-sm text-gray-500">
                  Complete verification to add bank accounts
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bankAccounts.map((account) => (
                <div key={account.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{getAccountTypeIcon(account.accountType)}</span>
                      <div>
                        <h4 className="font-semibold">{account.bankName}</h4>
                        {account.isDefault && (
                          <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                    </div>
                    {getStatusBadge(account.status)}
                  </div>
                  <div className="mt-3 space-y-1 text-sm">
                    <div className="text-gray-600">
                      Account Type: <span className="font-medium capitalize">{account.accountType}</span>
                    </div>
                    <div className="text-gray-600">
                      Account Number: <span className="font-medium">****{account.accountNumberLast4}</span>
                    </div>
                    <div className="text-gray-600">
                      Verification:{' '}
                      <span className="font-medium">
                        {account.isVerified ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                    {account.verifiedAt && (
                      <div className="text-gray-600 text-xs">
                        Verified: {new Date(account.verifiedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Bank Account Modal */}
      {showAddAccountForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold">Add Bank Account</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Bank Name *</label>
                <input
                  type="text"
                  value={newAccount.bankName}
                  onChange={(e) => setNewAccount({ ...newAccount, bankName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Chase Bank"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Account Type *</label>
                <select
                  value={newAccount.accountType}
                  onChange={(e) =>
                    setNewAccount({ ...newAccount, accountType: e.target.value as 'checking' | 'savings' })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Routing Number *</label>
                <input
                  type="text"
                  value={newAccount.routingNumber}
                  onChange={(e) =>
                    setNewAccount({
                      ...newAccount,
                      routingNumber: e.target.value.replace(/\D/g, '').slice(0, 9),
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="021000021"
                  maxLength={9}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Account Number *</label>
                <input
                  type="text"
                  value={newAccount.accountNumber}
                  onChange={(e) =>
                    setNewAccount({
                      ...newAccount,
                      accountNumber: e.target.value.replace(/\D/g, ''),
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="1234567890"
                />
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Your account will be verified securely through Stripe. Only the last 4 digits will be stored.
                </p>
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddAccountForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAddBankAccount}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Adding...' : 'Add Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deposit History */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Deposit History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payouts.map((payout) => (
                <tr key={payout.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {payout.actualPayoutDate
                      ? new Date(payout.actualPayoutDate).toLocaleDateString()
                      : new Date(payout.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    ${(parseInt(payout.amountCents) / 100).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getPayoutStatusBadge(payout.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payout.description || 'Payroll Deposit'}
                    {payout.payPeriodStart && payout.payPeriodEnd && (
                      <div className="text-xs text-gray-400">
                        Period: {new Date(payout.payPeriodStart).toLocaleDateString()} -{' '}
                        {new Date(payout.payPeriodEnd).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {payouts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No deposit history available</p>
            </div>
          )}
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">Need Help?</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>
            <strong>Verification Issues:</strong> If your verification is pending or failed, contact HR or
            IT support.
          </p>
          <p>
            <strong>Bank Account Changes:</strong> You can add up to 5 bank accounts. Changes may take 1-2
            business days to process.
          </p>
          <p>
            <strong>Missing Deposits:</strong> Contact payroll department if you don't see an expected
            deposit.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDirectDepositStatus;
