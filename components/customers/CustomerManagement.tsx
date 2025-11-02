import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Edit, Eye, Trash2, Filter, Download, Users, DollarSign, TrendingUp, Activity } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Select } from '@/components/shared/Select';
import { Modal } from '@/components/shared/Modal';
import { KpiCard } from '@/components/shared/KpiCard';
import { Table } from '@/components/shared/Table';
import { Badge } from '@/components/shared/Badge';

interface Customer {
  id: string;
  stripeCustomerId?: string;
  oracleLedgerId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  status: 'active' | 'inactive' | 'suspended';
  totalRevenue: number;
  paymentCount: number;
  lastPayment?: string;
  createdAt: string;
  updatedAt: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  metadata?: Record<string, any>;
}

interface CustomerFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  status: 'active' | 'inactive' | 'suspended';
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

const CustomerManagement: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'suspended'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [formData, setFormData] = useState<CustomerFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    status: 'active',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'US',
    },
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    const mockCustomers: Customer[] = [
      {
        id: '1',
        stripeCustomerId: 'cus_1234567890',
        oracleLedgerId: 'OL-2024-001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1 (555) 123-4567',
        company: 'Acme Corporation',
        status: 'active',
        totalRevenue: 15000.00,
        paymentCount: 24,
        lastPayment: '2024-10-15T10:30:00Z',
        createdAt: '2024-01-15T09:00:00Z',
        updatedAt: '2024-10-15T10:30:00Z',
        address: {
          line1: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US',
        },
      },
      {
        id: '2',
        stripeCustomerId: 'cus_0987654321',
        oracleLedgerId: 'OL-2024-002',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+1 (555) 987-6543',
        status: 'active',
        totalRevenue: 8750.00,
        paymentCount: 12,
        lastPayment: '2024-10-20T14:45:00Z',
        createdAt: '2024-02-20T11:30:00Z',
        updatedAt: '2024-10-20T14:45:00Z',
        address: {
          line1: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          postalCode: '90210',
          country: 'US',
        },
      },
    ];

    setTimeout(() => {
      setCustomers(mockCustomers);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      const matchesSearch = 
        customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.oracleLedgerId?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [customers, searchTerm, statusFilter]);

  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCustomers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

  // Statistics
  const stats = useMemo(() => {
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.status === 'active').length;
    const totalRevenue = customers.reduce((sum, c) => sum + c.totalRevenue, 0);
    const avgRevenue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

    return {
      totalCustomers,
      activeCustomers,
      totalRevenue,
      avgRevenue,
    };
  }, [customers]);

  const validateForm = (data: CustomerFormData): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!data.firstName.trim()) errors.firstName = 'First name is required';
    if (!data.lastName.trim()) errors.lastName = 'Last name is required';
    if (!data.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(data.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!data.address.line1.trim()) errors.addressLine1 = 'Address is required';
    if (!data.address.city.trim()) errors.addressCity = 'City is required';
    if (!data.address.state.trim()) errors.addressState = 'State is required';
    if (!data.address.postalCode.trim()) errors.addressPostalCode = 'Postal code is required';

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setIsSubmitting(false);
      return;
    }

    try {
      // Here you would integrate with your API
      console.log('Submitting customer data:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh customers list
      // In real implementation, you would fetch from API
      console.log('Customer saved successfully');
      
      setShowCreateModal(false);
      setShowEditModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving customer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      status: 'active',
      address: {
        line1: '',
        line2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'US',
      },
    });
    setFormErrors({});
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone || '',
      company: customer.company || '',
      status: customer.status,
      address: customer.address || {
        line1: '',
        line2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'US',
      },
    });
    setShowEditModal(true);
  };

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDetailsModal(true);
  };

  const handleDelete = async (customerId: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;

    try {
      console.log('Deleting customer:', customerId);
      // Here you would make API call to delete customer
      setCustomers(prev => prev.filter(c => c.id !== customerId));
    } catch (error) {
      console.error('Error deleting customer:', error);
    }
  };

  const handleStatusChange = async (customerId: string, newStatus: 'active' | 'inactive' | 'suspended') => {
    try {
      console.log('Updating customer status:', customerId, newStatus);
      // Here you would make API call to update status
      setCustomers(prev => prev.map(c => 
        c.id === customerId ? { ...c, status: newStatus, updatedAt: new Date().toISOString() } : c
      ));
    } catch (error) {
      console.error('Error updating customer status:', error);
    }
  };

  const exportCustomers = () => {
    const csvContent = [
      ['ID', 'First Name', 'Last Name', 'Email', 'Company', 'Status', 'Total Revenue', 'Payment Count'],
      ...filteredCustomers.map(customer => [
        customer.id,
        customer.firstName,
        customer.lastName,
        customer.email,
        customer.company || '',
        customer.status,
        customer.totalRevenue.toString(),
        customer.paymentCount.toString(),
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const CustomerForm = ({ mode }: { mode: 'create' | 'edit' }) => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            First Name *
          </label>
          <Input
            type="text"
            value={formData.firstName}
            onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
            placeholder="Enter first name"
            className={formErrors.firstName ? 'border-red-500' : ''}
          />
          {formErrors.firstName && (
            <p className="mt-1 text-sm text-red-600">{formErrors.firstName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Last Name *
          </label>
          <Input
            type="text"
            value={formData.lastName}
            onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
            placeholder="Enter last name"
            className={formErrors.lastName ? 'border-red-500' : ''}
          />
          {formErrors.lastName && (
            <p className="mt-1 text-sm text-red-600">{formErrors.lastName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email *
          </label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="Enter email address"
            className={formErrors.email ? 'border-red-500' : ''}
          />
          {formErrors.email && (
            <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone
          </label>
          <Input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="Enter phone number"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company
          </label>
          <Input
            type="text"
            value={formData.company}
            onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
            placeholder="Enter company name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status *
          </label>
          <Select
            value={formData.status}
            onChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </Select>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Address Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Street Address *
            </label>
            <Input
              type="text"
              value={formData.address.line1}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                address: { ...prev.address, line1: e.target.value }
              }))}
              placeholder="Enter street address"
              className={formErrors.addressLine1 ? 'border-red-500' : ''}
            />
            {formErrors.addressLine1 && (
              <p className="mt-1 text-sm text-red-600">{formErrors.addressLine1}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City *
            </label>
            <Input
              type="text"
              value={formData.address.city}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                address: { ...prev.address, city: e.target.value }
              }))}
              placeholder="Enter city"
              className={formErrors.addressCity ? 'border-red-500' : ''}
            />
            {formErrors.addressCity && (
              <p className="mt-1 text-sm text-red-600">{formErrors.addressCity}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State *
            </label>
            <Input
              type="text"
              value={formData.address.state}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                address: { ...prev.address, state: e.target.value }
              }))}
              placeholder="Enter state"
              className={formErrors.addressState ? 'border-red-500' : ''}
            />
            {formErrors.addressState && (
              <p className="mt-1 text-sm text-red-600">{formErrors.addressState}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Postal Code *
            </label>
            <Input
              type="text"
              value={formData.address.postalCode}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                address: { ...prev.address, postalCode: e.target.value }
              }))}
              placeholder="Enter postal code"
              className={formErrors.addressPostalCode ? 'border-red-500' : ''}
            />
            {formErrors.addressPostalCode && (
              <p className="mt-1 text-sm text-red-600">{formErrors.addressPostalCode}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country *
            </label>
            <Select
              value={formData.address.country}
              onChange={(value) => setFormData(prev => ({
                ...prev,
                address: { ...prev.address, country: value }
              }))}
            >
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="GB">United Kingdom</option>
              <option value="AU">Australia</option>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (mode === 'create') setShowCreateModal(false);
            else setShowEditModal(false);
            resetForm();
          }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Customer' : 'Update Customer'}
        </Button>
      </div>
    </form>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-gray-600">Manage customer information and payment relationships</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Total Customers"
          value={stats.totalCustomers.toString()}
          icon={<Users className="h-6 w-6" />}
          trend={+12}
        />
        <KpiCard
          title="Active Customers"
          value={stats.activeCustomers.toString()}
          icon={<Activity className="h-6 w-6" />}
          trend={+8}
        />
        <KpiCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={<DollarSign className="h-6 w-6" />}
          trend={+15}
        />
        <KpiCard
          title="Avg Revenue"
          value={formatCurrency(stats.avgRevenue)}
          icon={<TrendingUp className="h-6 w-6" />}
          trend={+5}
        />
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search customers by name, email, company, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Select
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as any)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </Select>
            <Button
              variant="outline"
              onClick={exportCustomers}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Revenue
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payments
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Payment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedCustomers.map((customer) => (
              <tr key={customer.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {customer.firstName} {customer.lastName}
                    </div>
                    {customer.company && (
                      <div className="text-sm text-gray-500">{customer.company}</div>
                    )}
                    <div className="text-xs text-gray-400">
                      {customer.oracleLedgerId}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm text-gray-900">{customer.email}</div>
                    {customer.phone && (
                      <div className="text-sm text-gray-500">{customer.phone}</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Select
                    value={customer.status}
                    onChange={(value) => handleStatusChange(customer.id, value as any)}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </Select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(customer.totalRevenue)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {customer.paymentCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {customer.lastPayment ? formatDate(customer.lastPayment) : 'Never'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(customer)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(customer)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(customer.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredCustomers.length)} of {filteredCustomers.length} results
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="flex items-center px-3 text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create Customer Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Create New Customer"
        size="lg"
      >
        <CustomerForm mode="create" />
      </Modal>

      {/* Edit Customer Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          resetForm();
        }}
        title="Edit Customer"
        size="lg"
      >
        <CustomerForm mode="edit" />
      </Modal>

      {/* Customer Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedCustomer(null);
        }}
        title="Customer Details"
        size="lg"
      >
        {selectedCustomer && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Contact Information</h3>
                <div className="space-y-2">
                  <p><strong>Name:</strong> {selectedCustomer.firstName} {selectedCustomer.lastName}</p>
                  <p><strong>Email:</strong> {selectedCustomer.email}</p>
                  {selectedCustomer.phone && (
                    <p><strong>Phone:</strong> {selectedCustomer.phone}</p>
                  )}
                  {selectedCustomer.company && (
                    <p><strong>Company:</strong> {selectedCustomer.company}</p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Account Information</h3>
                <div className="space-y-2">
                  <p><strong>ORACLE-LEDGER ID:</strong> {selectedCustomer.oracleLedgerId || 'Not linked'}</p>
                  <p><strong>Stripe Customer ID:</strong> {selectedCustomer.stripeCustomerId || 'Not linked'}</p>
                  <p><strong>Status:</strong> 
                    <Badge className={`ml-2 ${getStatusColor(selectedCustomer.status)}`}>
                      {selectedCustomer.status}
                    </Badge>
                  </p>
                  <p><strong>Created:</strong> {formatDate(selectedCustomer.createdAt)}</p>
                  <p><strong>Last Updated:</strong> {formatDate(selectedCustomer.updatedAt)}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Payment Statistics</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(selectedCustomer.totalRevenue)}</div>
                  <div className="text-sm text-gray-600">Total Revenue</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{selectedCustomer.paymentCount}</div>
                  <div className="text-sm text-gray-600">Total Payments</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {selectedCustomer.paymentCount > 0 ? formatCurrency(selectedCustomer.totalRevenue / selectedCustomer.paymentCount) : '$0.00'}
                  </div>
                  <div className="text-sm text-gray-600">Avg Payment</div>
                </div>
              </div>
            </div>

            {selectedCustomer.address && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Address</h3>
                <div className="text-gray-600">
                  <p>{selectedCustomer.address.line1}</p>
                  {selectedCustomer.address.line2 && <p>{selectedCustomer.address.line2}</p>}
                  <p>{selectedCustomer.address.city}, {selectedCustomer.address.state} {selectedCustomer.address.postalCode}</p>
                  <p>{selectedCustomer.address.country}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CustomerManagement;