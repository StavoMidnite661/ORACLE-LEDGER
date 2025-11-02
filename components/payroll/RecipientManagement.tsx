import React, { useState, useEffect } from 'react';
import type { DirectDepositRecipient, UserRole } from '../../types';

interface RecipientManagementProps {
  currentUserRole: UserRole;
}

export const RecipientManagement: React.FC<RecipientManagementProps> = ({
  currentUserRole,
}) => {
  const [recipients, setRecipients] = useState<DirectDepositRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRecipient, setSelectedRecipient] = useState<DirectDepositRecipient | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadRecipients();
  }, []);

  const loadRecipients = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/direct-deposit/recipients');
      if (!response.ok) throw new Error('Failed to load recipients');
      const data = await response.json();
      setRecipients(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recipients');
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async (recipientId: string) => {
    try {
      const response = await fetch(`/api/direct-deposit/recipients/${recipientId}/resend-verification`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to resend verification');
      alert('Verification email sent successfully');
    } catch (err) {
      alert('Failed to resend verification');
    }
  };

  const suspendRecipient = async (recipientId: string) => {
    if (!confirm('Are you sure you want to suspend this recipient?')) return;

    try {
      const response = await fetch(`/api/direct-deposit/recipients/${recipientId}/suspend`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to suspend recipient');
      loadRecipients();
    } catch (err) {
      alert('Failed to suspend recipient');
    }
  };

  const activateRecipient = async (recipientId: string) => {
    try {
      const response = await fetch(`/api/direct-deposit/recipients/${recipientId}/activate`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to activate recipient');
      loadRecipients();
    } catch (err) {
      alert('Failed to activate recipient');
    }
  };

  const filteredRecipients = recipients.filter((recipient) => {
    const matchesSearch =
      recipient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipient.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      recipient.verificationStatus === statusFilter ||
      recipient.kycStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string, type: 'verification' | 'kyc') => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-semibold';
    const colorMap = {
      verified: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`${baseClasses} ${colorMap[status as keyof typeof colorMap] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)} {type}
      </span>
    );
  };

  const getAccountStatusBadge = (recipient: DirectDepositRecipient) => {
    if (!recipient.payoutsEnabled) {
      return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">Restricted</span>;
    }
    if (recipient.transfersEnabled && recipient.chargesEnabled) {
      return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">Active</span>;
    }
    return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">Pending</span>;
  };

  const renderRecipientDetails = () => {
    if (!selectedRecipient) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">
                {selectedRecipient.firstName} {selectedRecipient.lastName}
              </h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <section>
              <h4 className="text-lg font-semibold mb-3">Basic Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Employee ID</label>
                  <p className="font-medium">{selectedRecipient.employeeId || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Email</label>
                  <p className="font-medium">{selectedRecipient.email}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Phone</label>
                  <p className="font-medium">{selectedRecipient.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Date of Birth</label>
                  <p className="font-medium">{selectedRecipient.dateOfBirth || 'N/A'}</p>
                </div>
              </div>
            </section>

            {/* Verification Status */}
            <section>
              <h4 className="text-lg font-semibold mb-3">Verification Status</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Verification Status</label>
                  <div className="mt-1">
                    {getStatusBadge(selectedRecipient.verificationStatus, 'verification')}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-600">KYC Status</label>
                  <div className="mt-1">
                    {getStatusBadge(selectedRecipient.kycStatus || 'pending', 'kyc')}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Due Date</label>
                  <p className="font-medium">{selectedRecipient.verificationDueDate || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Account Status</label>
                  <div className="mt-1">{getAccountStatusBadge(selectedRecipient)}</div>
                </div>
              </div>
            </section>

            {/* Stripe Connect Details */}
            <section>
              <h4 className="text-lg font-semibold mb-3">Stripe Connect Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Account ID</label>
                  <p className="font-medium text-sm">{selectedRecipient.stripeAccountId}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Charges Enabled</label>
                  <p className="font-medium">{selectedRecipient.chargesEnabled ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Transfers Enabled</label>
                  <p className="font-medium">{selectedRecipient.transfersEnabled ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Payouts Enabled</label>
                  <p className="font-medium">{selectedRecipient.payoutsEnabled ? 'Yes' : 'No'}</p>
                </div>
              </div>
              {selectedRecipient.verificationFieldsNeeded && (
                <div className="mt-4">
                  <label className="text-sm text-gray-600">Verification Fields Needed</label>
                  <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                    {JSON.stringify(JSON.parse(selectedRecipient.verificationFieldsNeeded), null, 2)}
                  </pre>
                </div>
              )}
            </section>

            {/* Compliance */}
            <section>
              <h4 className="text-lg font-semibold mb-3">Compliance Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">SSN Last 4</label>
                  <p className="font-medium">***-**-{selectedRecipient.ssnLast4 || '****'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Created</label>
                  <p className="font-medium">{new Date(selectedRecipient.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Last Updated</label>
                  <p className="font-medium">{new Date(selectedRecipient.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </section>
          </div>

          {(currentUserRole === 'Admin' || currentUserRole === 'Finance') && (
            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => resendVerification(selectedRecipient.id)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Resend Verification
              </button>
              {!selectedRecipient.payoutsEnabled ? (
                <button
                  onClick={() => activateRecipient(selectedRecipient.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Activate
                </button>
              ) : (
                <button
                  onClick={() => suspendRecipient(selectedRecipient.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Suspend
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading recipients...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Direct Deposit Recipients</h2>
        {(currentUserRole === 'Admin' || currentUserRole === 'Finance') && (
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Add New Recipient
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name, email, or employee ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">All Statuses</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-lg shadow border">
          <div className="text-sm text-gray-600">Total Recipients</div>
          <div className="text-2xl font-bold">{recipients.length}</div>
        </div>
        <div className="p-4 bg-white rounded-lg shadow border">
          <div className="text-sm text-gray-600">Verified</div>
          <div className="text-2xl font-bold text-green-600">
            {recipients.filter((r) => r.verificationStatus === 'verified').length}
          </div>
        </div>
        <div className="p-4 bg-white rounded-lg shadow border">
          <div className="text-sm text-gray-600">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">
            {recipients.filter((r) => r.verificationStatus === 'pending').length}
          </div>
        </div>
        <div className="p-4 bg-white rounded-lg shadow border">
          <div className="text-sm text-gray-600">Active</div>
          <div className="text-2xl font-bold text-blue-600">
            {recipients.filter((r) => r.payoutsEnabled).length}
          </div>
        </div>
      </div>

      {/* Recipients Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Verification
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                KYC Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Account
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRecipients.map((recipient) => (
              <tr key={recipient.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="font-medium text-gray-900">
                      {recipient.firstName} {recipient.lastName}
                    </div>
                    <div className="text-sm text-gray-500">
                      ID: {recipient.employeeId || 'N/A'}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{recipient.email}</div>
                  <div className="text-sm text-gray-500">{recipient.phone || 'No phone'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(recipient.verificationStatus, 'verification')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(recipient.kycStatus || 'pending', 'kyc')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getAccountStatusBadge(recipient)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(recipient.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => {
                      setSelectedRecipient(recipient);
                      setShowDetails(true);
                    }}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    View Details
                  </button>
                  {(currentUserRole === 'Admin' || currentUserRole === 'Finance') && (
                    <>
                      <button
                        onClick={() => resendVerification(recipient.id)}
                        className="text-yellow-600 hover:text-yellow-900 mr-3"
                      >
                        Resend
                      </button>
                      {!recipient.payoutsEnabled ? (
                        <button
                          onClick={() => activateRecipient(recipient.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Activate
                        </button>
                      ) : (
                        <button
                          onClick={() => suspendRecipient(recipient.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Suspend
                        </button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredRecipients.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No recipients found matching your criteria</p>
          </div>
        )}
      </div>

      {renderRecipientDetails()}
    </div>
  );
};

export default RecipientManagement;
