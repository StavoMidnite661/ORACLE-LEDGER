import React, { useState, useEffect } from 'react';
import type { DirectDepositRecipient, DirectDepositBankAccount, UserRole } from '../../types';

interface BankAccountManagementProps {
  recipientId?: string;
  currentUserRole: UserRole;
}

export const BankAccountManagement: React.FC<BankAccountManagementProps> = ({
  recipientId,
  currentUserRole,
}) => {
  const [recipient, setRecipient] = useState<DirectDepositRecipient | null>(null);
  const [bankAccounts, setBankAccounts] = useState<DirectDepositBankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<DirectDepositBankAccount | null>(null);
  const [error, setError] = useState<string>('');
  const [newAccount, setNewAccount] = useState({
    bankName: '',
    routingNumber: '',
    accountNumber: '',
    accountType: 'checking' as 'checking' | 'savings',
    isDefault: false,
  });

  useEffect(() => {
    if (recipientId) {
      loadRecipientData(recipientId);
    }
  }, [recipientId]);

  const loadRecipientData = async (id: string) => {
    try {
      setLoading(true);
      const [recipientRes, accountsRes] = await Promise.all([
        fetch(`/api/direct-deposit/recipients/${id}`),
        fetch(`/api/direct-deposit/recipients/${id}/bank-accounts`),
      ]);

      if (!recipientRes.ok || !accountsRes.ok) {
        throw new Error('Failed to load data');
      }

      const recipientData = await recipientRes.json();
      const accountsData = await accountsRes.json();

      setRecipient(recipientData);
      setBankAccounts(accountsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async () => {
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
          isDefault: newAccount.isDefault || bankAccounts.length === 0,
        }),
      });

      if (!dbResponse.ok) throw new Error('Failed to save bank account');

      setShowAddForm(false);
      setNewAccount({
        bankName: '',
        routingNumber: '',
        accountNumber: '',
        accountType: 'checking',
        isDefault: false,
      });
      loadRecipientData(recipient.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add bank account');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (accountId: string) => {
    try {
      const response = await fetch(`/api/direct-deposit/bank-accounts/${accountId}/set-default`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to set default account');

      loadRecipientData(recipient!.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set default account');
    }
  };

  const handleRemoveAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to remove this bank account?')) return;

    try {
      const response = await fetch(`/api/direct-deposit/bank-accounts/${accountId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to remove bank account');

      loadRecipientData(recipient!.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove bank account');
    }
  };

  const handleVerifyAccount = async (accountId: string, method: 'instant' | 'micro') => {
    try {
      const response = await fetch(`/api/direct-deposit/bank-accounts/${accountId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method }),
      });

      if (!response.ok) throw new Error('Failed to initiate verification');

      alert(`Verification initiated via ${method}. Please check the account for verification amounts.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify account');
    }
  };

  const getAccountTypeIcon = (type: string) => {
    return type === 'checking' ? '💳' : '🏦';
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-semibold';
    const colorMap = {
      verified: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      verification_failed: 'bg-red-100 text-red-800',
      deleted: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`${baseClasses} ${colorMap[status as keyof typeof colorMap] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
      </span>
    );
  };

  if (loading && !recipient) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading bank accounts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Bank Account Management</h2>
          {recipient && (
            <p className="text-gray-600 mt-1">
              Managing bank accounts for {recipient.firstName} {recipient.lastName}
            </p>
          )}
        </div>
        {(currentUserRole === 'Admin' || currentUserRole === 'Finance' || currentUserRole === 'Finance') && recipient && (
          <button
            onClick={() => setShowAddForm(true)}
            disabled={bankAccounts.length >= 5}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            Add Bank Account ({bankAccounts.length}/5)
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-lg shadow border">
          <div className="text-sm text-gray-600">Total Accounts</div>
          <div className="text-2xl font-bold">{bankAccounts.length}</div>
        </div>
        <div className="p-4 bg-white rounded-lg shadow border">
          <div className="text-sm text-gray-600">Verified</div>
          <div className="text-2xl font-bold text-green-600">
            {bankAccounts.filter((a) => a.isVerified).length}
          </div>
        </div>
        <div className="p-4 bg-white rounded-lg shadow border">
          <div className="text-sm text-gray-600">Default Account</div>
          <div className="text-2xl font-bold text-blue-600">
            {bankAccounts.find((a) => a.isDefault) ? 'Set' : 'None'}
          </div>
        </div>
      </div>

      {/* Add Account Modal */}
      {showAddForm && recipient && (
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
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={newAccount.isDefault}
                  onChange={(e) => setNewAccount({ ...newAccount, isDefault: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="isDefault" className="text-sm">
                  Set as default account
                </label>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Account will be connected via Stripe Financial Connections for secure verification.
                </p>
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAccount}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Adding...' : 'Add Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bank Accounts List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {bankAccounts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No bank accounts configured</p>
            {(currentUserRole === 'Admin' || currentUserRole === 'Finance') && recipient && (
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add First Account
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {bankAccounts.map((account) => (
              <div key={account.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{getAccountTypeIcon(account.accountType)}</span>
                      <div>
                        <h3 className="text-lg font-semibold">{account.bankName}</h3>
                        {account.isDefault && (
                          <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Account Type:</span>
                        <span className="ml-2 font-medium capitalize">{account.accountType}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Account Number:</span>
                        <span className="ml-2 font-medium">****{account.accountNumberLast4}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Routing Number:</span>
                        <span className="ml-2 font-medium">{account.routingNumber}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Status:</span>
                        <span className="ml-2">{getStatusBadge(account.status)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Verification:</span>
                        <span className="ml-2 font-medium">
                          {account.isVerified ? 'Verified' : 'Not Verified'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Currency:</span>
                        <span className="ml-2 font-medium">{account.currency}</span>
                      </div>
                    </div>
                    {account.verifiedAt && (
                      <div className="mt-2 text-sm text-green-600">
                        Verified on {new Date(account.verifiedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col space-y-2 ml-4">
                    {!account.isVerified && (
                      <>
                        <button
                          onClick={() => handleVerifyAccount(account.id, 'instant')}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        >
                          Verify Instantly
                        </button>
                        <button
                          onClick={() => handleVerifyAccount(account.id, 'micro')}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          Micro Deposits
                        </button>
                      </>
                    )}
                    {!account.isDefault && (
                      <button
                        onClick={() => handleSetDefault(account.id)}
                        className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                      >
                        Set Default
                      </button>
                    )}
                    {(currentUserRole === 'Admin' || currentUserRole === 'Finance') && (
                      <button
                        onClick={() => handleRemoveAccount(account.id)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verification Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Verification Methods</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <div>
            <strong>Instant Verification:</strong> Uses Stripe Financial Connections to verify account details
            instantly with the bank. Most reliable method.
          </div>
          <div>
            <strong>Micro Deposits:</strong> Small deposits (less than $1) are made to the account. Verification
            is complete when you confirm the deposit amounts. Takes 1-2 business days.
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankAccountManagement;
