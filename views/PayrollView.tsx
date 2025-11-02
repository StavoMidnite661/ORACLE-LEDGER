import React, { useState, useMemo } from 'react';
import type { Employee, JournalEntry, JournalEntryLine, DirectDepositPayout } from '../types';
import { Modal } from '../components/shared/Modal';
import { PayrollStub } from '../components/payroll/PayrollStub';

interface PayrollViewProps {
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  updateEmployee: (employee: Employee) => void;
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'date'>) => void;
  directDepositPayouts?: DirectDepositPayout[];
  onProcessDirectDeposit?: (employees: Employee[]) => void;
  onSetupStripeConnect?: (employee: Employee) => void;
}

type SortableKeys = keyof Employee | 'monthlyGross';
type SortConfig = { key: SortableKeys; direction: 'ascending' | 'descending' };

const SortIndicator: React.FC<{ direction?: 'ascending' | 'descending' }> = ({ direction }) => (
  <span className="inline-flex flex-col text-xs ml-2 opacity-50">
    <svg className={`h-2 w-2 ${direction === 'ascending' ? 'text-sov-light opacity-100' : 'text-sov-light-alt'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M10 3l-5 5h10l-5-5z"/></svg>
    <svg className={`h-2 w-2 ${direction === 'descending' ? 'text-sov-light opacity-100' : 'text-sov-light-alt'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M10 17l5-5H5l5 5z"/></svg>
  </span>
);

export const PayrollView: React.FC<PayrollViewProps> = ({ 
  employees, 
  addEmployee, 
  updateEmployee, 
  addJournalEntry,
  directDepositPayouts = [],
  onProcessDirectDeposit,
  onSetupStripeConnect
}) => {
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [isConfirmPayrollModalOpen, setIsConfirmPayrollModalOpen] = useState(false);
  const [selectedEmployeeForStub, setSelectedEmployeeForStub] = useState<Employee | null>(null);
  const [name, setName] = useState('');
  const [annualSalary, setAnnualSalary] = useState<number | ''>('');
  const [bankRoutingNumber, setBankRoutingNumber] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'ACH' | 'Wire' | 'Crypto'>('ACH');
  const [taxId, setTaxId] = useState('');
  const [payrollMethod, setPayrollMethod] = useState<'ACH' | 'Stripe Connect'>('Stripe Connect');
  
  const [selectedEmployeeForEdit, setSelectedEmployeeForEdit] = useState<Employee | null>(null);
  const [isEditEmployeeModalOpen, setIsEditEmployeeModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAnnualSalary, setEditAnnualSalary] = useState<number | ''>('');
  const [editBankRoutingNumber, setEditBankRoutingNumber] = useState('');
  const [editBankAccountNumber, setEditBankAccountNumber] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState<'ACH' | 'Wire' | 'Crypto'>('ACH');
  const [editTaxId, setEditTaxId] = useState('');
  
  const [lastPayrollRun, setLastPayrollRun] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'name', direction: 'ascending' });
  const [showDirectDepositStatus, setShowDirectDepositStatus] = useState(false);

  // Direct deposit tracking
  const directDepositMetrics = useMemo(() => {
    const pendingPayouts = directDepositPayouts.filter(payout => 
      payout.status === 'pending' || payout.status === 'in_transit'
    ).length;
    
    const completedPayouts = directDepositPayouts.filter(payout => 
      payout.status === 'paid'
    ).length;
    
    const failedPayouts = directDepositPayouts.filter(payout => 
      payout.status === 'failed'
    ).length;

    const totalVolume = directDepositPayouts
      .filter(payout => payout.status === 'paid')
      .reduce((sum, payout) => sum + payout.amountCents / 100, 0);

    return {
      pendingPayouts,
      completedPayouts,
      failedPayouts,
      totalVolume,
    };
  }, [directDepositPayouts]);

  const sortedEmployees = useMemo(() => {
    let sortableItems = [...employees];
    if (sortConfig !== null) {
        sortableItems.sort((a, b) => {
            const key = sortConfig.key;
            let aValue: any;
            let bValue: any;

            if (key === 'monthlyGross') {
                aValue = a.annualSalary / 12;
                bValue = b.annualSalary / 12;
            } else {
                aValue = a[key as keyof Employee];
                bValue = b[key as keyof Employee];
            }
            if (aValue < bValue) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
    }
    return sortableItems;
  }, [employees, sortConfig]);

  const requestSort = (key: SortableKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortDirection = (key: SortableKeys) => {
    if (!sortConfig || sortConfig.key !== key) return undefined;
    return sortConfig.direction;
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !annualSalary || annualSalary <= 0) return;
    
    addEmployee({ 
      name, 
      annualSalary: Number(annualSalary),
      bankRoutingNumber: bankRoutingNumber || undefined,
      bankAccountNumber: bankAccountNumber || undefined,
      paymentMethod,
      taxId: taxId || undefined
    });
    
    setIsAddEmployeeModalOpen(false);
    setName('');
    setAnnualSalary('');
    setBankRoutingNumber('');
    setBankAccountNumber('');
    setPaymentMethod('ACH');
    setTaxId('');
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployeeForEdit(employee);
    setEditName(employee.name);
    setEditAnnualSalary(employee.annualSalary);
    setEditBankRoutingNumber(employee.bankRoutingNumber || '');
    setEditBankAccountNumber(employee.bankAccountNumber || '');
    setEditPaymentMethod(employee.paymentMethod || 'ACH');
    setEditTaxId(employee.taxId || '');
    setIsEditEmployeeModalOpen(true);
  };

  const handleSaveEditEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeForEdit || !editName || !editAnnualSalary || Number(editAnnualSalary) <= 0) return;
    
    const updatedEmployee: Employee = {
      ...selectedEmployeeForEdit,
      name: editName,
      annualSalary: Number(editAnnualSalary),
      bankRoutingNumber: editBankRoutingNumber || undefined,
      bankAccountNumber: editBankAccountNumber || undefined,
      paymentMethod: editPaymentMethod,
      taxId: editTaxId || undefined
    };
    
    updateEmployee(updatedEmployee);
    
    setIsEditEmployeeModalOpen(false);
    setSelectedEmployeeForEdit(null);
    
    setEditName('');
    setEditAnnualSalary('');
    setEditBankRoutingNumber('');
    setEditBankAccountNumber('');
    setEditPaymentMethod('ACH');
    setEditTaxId('');
  };

  const handleRunPayroll = () => {
    if (employees.length === 0) return;

    const totalGrossPay = employees.reduce((sum, emp) => sum + emp.annualSalary, 0) / 12;
    const totalDeductions = totalGrossPay * 0.20; // Simplified 20% deduction
    const totalNetPay = totalGrossPay - totalDeductions;

    addJournalEntry({
      description: 'Record monthly gross payroll expense',
      source: 'PAYROLL',
      status: 'Posted',
      lines: [
        { accountId: 6000, type: 'DEBIT', amount: totalGrossPay },
        { accountId: 2400, type: 'CREDIT', amount: totalGrossPay },
      ],
    });

    const paymentData = employees.reduce((acc, emp) => {
        const netPay = (emp.annualSalary / 12) * 0.8;
        const method = emp.paymentMethod || 'ACH';
        
        let accountId: number;
        if (payrollMethod === 'Stripe Connect' && method === 'ACH') {
          accountId = 2110; // Stripe Connect payroll clearing
        } else {
          accountId = method === 'ACH' ? 2100 : method === 'Wire' ? 1000 : 1001;
        }
        
        const existing = acc.find(p => p.accountId === accountId);
        if (existing) {
            existing.amount += netPay;
        } else {
            acc.push({ accountId, amount: netPay, method });
        }
        return acc;
    }, [] as { accountId: number; amount: number; method: string }[]);

    const paymentLines: JournalEntryLine[] = paymentData.map(p => ({
        accountId: p.accountId,
        type: 'CREDIT',
        amount: p.amount,
    }));

    addJournalEntry({
        description: `Process payroll payments for ${employees.length} employees`,
        source: 'PAYROLL',
        status: 'Posted',
        lines: [
            { accountId: 2400, type: 'DEBIT', amount: totalNetPay },
            ...paymentLines,
        ],
    });
    
    // Process direct deposit if using Stripe Connect
    if (payrollMethod === 'Stripe Connect' && onProcessDirectDeposit) {
      onProcessDirectDeposit(employees);
    }
    
    const paymentSummary = paymentData.map(p => `${p.method}: $${p.amount.toFixed(2)}`).join(', ');
    const methodInfo = payrollMethod === 'Stripe Connect' ? ' via Stripe Connect' : '';

    setLastPayrollRun(`Successfully ran payroll for ${employees.length} employees. Gross: $${totalGrossPay.toFixed(2)}, Net: $${totalNetPay.toFixed(2)}. Payments${methodInfo}: ${paymentSummary}`);
    setIsConfirmPayrollModalOpen(false);
    setShowDirectDepositStatus(payrollMethod === 'Stripe Connect');
  };
  
  const handlePrint = () => {
    window.print();
  };


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700 flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-sov-light">Run Payroll</h3>
                  <div className="mt-2">
                    <label htmlFor="payrollMethod" className="block text-sm font-medium text-sov-light-alt mb-1">Payment Method</label>
                    <select 
                      id="payrollMethod" 
                      value={payrollMethod} 
                      onChange={(e) => setPayrollMethod(e.target.value as 'ACH' | 'Stripe Connect')}
                      className="bg-sov-dark border border-gray-600 rounded-md shadow-sm py-1 px-3 text-sov-light focus:outline-none focus:ring-sov-accent focus:border-sov-accent text-sm"
                    >
                      <option value="Stripe Connect">Stripe Connect (Recommended)</option>
                      <option value="ACH">Traditional ACH</option>
                    </select>
                  </div>
                </div>
                <button
                    onClick={() => setIsConfirmPayrollModalOpen(true)}
                    className="bg-sov-accent text-sov-dark font-bold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                    disabled={employees.length === 0}
                >
                    Run September 2025 Payroll
                </button>
            </div>
            <div className="flex-grow">
                {lastPayrollRun ? (
                    <div className="bg-sov-green/20 text-sov-green p-3 rounded-lg text-center font-semibold h-full flex items-center justify-center">
                        {lastPayrollRun}
                    </div>
                ) : (
                    <div className="space-y-2">
                      <p className="text-sov-light-alt">Execute the monthly payroll run to generate journal entries for all employees.</p>
                      {payrollMethod === 'Stripe Connect' && (
                        <div className="bg-sov-accent/10 text-sov-accent p-3 rounded-lg">
                          <p className="text-sm">
                            ✨ Using Stripe Connect provides enhanced direct deposit processing, automated compliance, and real-time payout tracking.
                          </p>
                        </div>
                      )}
                    </div>
                )}
            </div>
        </div>
      </div>

      {payrollMethod === 'Stripe Connect' && (
        <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-sov-light">Direct Deposit Status</h3>
            <button 
              onClick={() => setShowDirectDepositStatus(!showDirectDepositStatus)}
              className="text-sov-accent hover:text-sov-accent-hover transition-colors text-sm"
            >
              {showDirectDepositStatus ? 'Hide' : 'Show'} Details
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-sov-dark p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-sov-gold">{directDepositMetrics.pendingPayouts}</p>
              <p className="text-sm text-sov-light-alt">Pending Payouts</p>
            </div>
            <div className="bg-sov-dark p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-sov-green">{directDepositMetrics.completedPayouts}</p>
              <p className="text-sm text-sov-light-alt">Completed Payouts</p>
            </div>
            <div className="bg-sov-dark p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-sov-red">{directDepositMetrics.failedPayouts}</p>
              <p className="text-sm text-sov-light-alt">Failed Payouts</p>
            </div>
            <div className="bg-sov-dark p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-sov-accent">${directDepositMetrics.totalVolume.toLocaleString()}</p>
              <p className="text-sm text-sov-light-alt">Total Volume</p>
            </div>
          </div>

          {showDirectDepositStatus && directDepositPayouts.length > 0 && (
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-700">
                  <tr>
                    <th className="p-2 text-left">Employee</th>
                    <th className="p-2 text-right">Amount</th>
                    <th className="p-2 text-center">Status</th>
                    <th className="p-2 text-center">ETA</th>
                  </tr>
                </thead>
                <tbody>
                  {directDepositPayouts.map(payout => {
                    // Find employee by matching payout details (simplified)
                    const employee = employees.find(e => e.id === payout.recipientId) || 
                                   employees[0]; // Fallback to first employee for demo
                    
                    return (
                      <tr key={payout.id} className="border-b border-gray-800">
                        <td className="p-2">{employee?.name || 'Unknown'}</td>
                        <td className="p-2 text-right font-mono">${(payout.amountCents / 100).toLocaleString()}</td>
                        <td className="p-2 text-center">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            payout.status === 'paid' ? 'bg-sov-green/20 text-sov-green' :
                            payout.status === 'pending' ? 'bg-sov-gold/20 text-sov-gold' :
                            payout.status === 'failed' ? 'bg-sov-red/20 text-sov-red' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {payout.status}
                          </span>
                        </td>
                        <td className="p-2 text-center text-sov-light-alt">
                          {payout.estimatedArrivalDate ? 
                            new Date(payout.estimatedArrivalDate).toLocaleDateString() :
                            'N/A'
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-sov-light">Employee Management</h3>
          <button
            onClick={() => setIsAddEmployeeModalOpen(true)}
            className="bg-sov-accent text-sov-dark font-bold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors">
            Add Employee
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-gray-700">
              <tr>
                <th className="p-3 cursor-pointer" onClick={() => requestSort('id')}><div className="flex items-center">Employee ID <SortIndicator direction={getSortDirection('id')} /></div></th>
                <th className="p-3 cursor-pointer" onClick={() => requestSort('name')}><div className="flex items-center">Name <SortIndicator direction={getSortDirection('name')} /></div></th>
                <th className="p-3 text-center">Payment Method</th>
                <th className="p-3 text-center">Account Info</th>
                <th className="p-3 text-center">Stripe Connect</th>
                <th className="p-3 text-right cursor-pointer" onClick={() => requestSort('annualSalary')}><div className="flex items-center justify-end">Annual Salary <SortIndicator direction={getSortDirection('annualSalary')} /></div></th>
                <th className="p-3 text-right cursor-pointer" onClick={() => requestSort('monthlyGross')}><div className="flex items-center justify-end">Monthly Gross <SortIndicator direction={getSortDirection('monthlyGross')} /></div></th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedEmployees.map(emp => (
                <tr key={emp.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="p-3 font-mono text-sm">{emp.id}</td>
                  <td className="p-3">{emp.name}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      emp.paymentMethod === 'Wire' ? 'bg-orange-500/20 text-orange-400' :
                      emp.paymentMethod === 'Crypto' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {emp.paymentMethod || 'ACH'}
                    </span>
                  </td>
                  <td className="p-3 text-center text-sm">
                    {emp.bankAccountNumber ? 
                      <div>
                        <div>****{emp.bankAccountNumber.slice(-4)}</div>
                        {emp.bankRoutingNumber && (
                          <div className="text-xs text-sov-light-alt">
                            RT: ****{emp.bankRoutingNumber.slice(-4)}
                          </div>
                        )}
                      </div>
                    : 
                      <span className="text-sov-light-alt italic">Not set</span>
                    }
                  </td>
                  <td className="p-3 text-center">
                    {emp.bankAccountNumber && emp.bankRoutingNumber ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-sov-green/20 text-sov-green">
                        Ready
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-sov-red/20 text-sov-red">
                        Setup Required
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right font-mono">${emp.annualSalary.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono">${(emp.annualSalary / 12).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                  <td className="p-3 text-right space-x-2">
                    {!emp.bankAccountNumber && onSetupStripeConnect && (
                      <button 
                        onClick={() => onSetupStripeConnect(emp)}
                        className="bg-sov-accent/20 text-sov-accent text-xs font-bold py-1 px-2 rounded-lg hover:bg-sov-accent/30 transition-colors">
                        Setup Connect
                      </button>
                    )}
                    <button 
                      onClick={() => handleEditEmployee(emp)}
                      className="bg-sov-gold/20 text-sov-gold text-xs font-bold py-1 px-3 rounded-lg hover:bg-sov-gold/30 transition-colors">
                      Edit
                    </button>
                    <button 
                      onClick={() => setSelectedEmployeeForStub(emp)}
                      className="bg-sov-accent/20 text-sov-accent text-xs font-bold py-1 px-3 rounded-lg hover:bg-sov-accent/30 transition-colors">
                      Stub
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <Modal isOpen={isAddEmployeeModalOpen} onClose={() => setIsAddEmployeeModalOpen(false)} title="Add New Employee">
        <form onSubmit={handleAddEmployee} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-sov-light-alt">Employee Name</label>
              <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full bg-sov-dark border border-gray-600 rounded-md shadow-sm py-2 px-3 text-sov-light focus:outline-none focus:ring-sov-accent focus:border-sov-accent" />
            </div>
            <div>
              <label htmlFor="annualSalary" className="block text-sm font-medium text-sov-light-alt">Annual Salary</label>
              <input type="number" id="annualSalary" value={annualSalary} onChange={e => setAnnualSalary(e.target.valueAsNumber || '')} min="1" step="1" required className="mt-1 block w-full bg-sov-dark border border-gray-600 rounded-md shadow-sm py-2 px-3 text-sov-light focus:outline-none focus:ring-sov-accent focus:border-sov-accent" />
            </div>
          </div>
          <div>
            <label htmlFor="paymentMethod" className="block text-sm font-medium text-sov-light-alt">Payment Method</label>
            <select id="paymentMethod" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as 'ACH' | 'Wire' | 'Crypto')} className="mt-1 block w-full bg-sov-dark border border-gray-600 rounded-md shadow-sm py-2 px-3 text-sov-light focus:outline-none focus:ring-sov-accent focus:border-sov-accent">
              <option value="ACH">ACH Direct Deposit</option>
              <option value="Wire">Wire Transfer</option>
              <option value="Crypto">Cryptocurrency</option>
            </select>
          </div>
          {paymentMethod !== 'Crypto' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="bankRoutingNumber" className="block text-sm font-medium text-sov-light-alt">Bank Routing Number</label>
                <input type="text" id="bankRoutingNumber" value={bankRoutingNumber} onChange={e => setBankRoutingNumber(e.target.value)} className="mt-1 block w-full bg-sov-dark border border-gray-600 rounded-md shadow-sm py-2 px-3 text-sov-light focus:outline-none focus:ring-sov-accent focus:border-sov-accent" placeholder="9 digits" maxLength={9} />
              </div>
              <div>
                <label htmlFor="bankAccountNumber" className="block text-sm font-medium text-sov-light-alt">Bank Account Number</label>
                <input type="text" id="bankAccountNumber" value={bankAccountNumber} onChange={e => setBankAccountNumber(e.target.value)} className="mt-1 block w-full bg-sov-dark border border-gray-600 rounded-md shadow-sm py-2 px-3 text-sov-light focus:outline-none focus:ring-sov-accent focus:border-sov-accent" placeholder="Account number" />
              </div>
            </div>
          )}
          <div>
            <label htmlFor="taxId" className="block text-sm font-medium text-sov-light-alt">Tax ID / SSN</label>
            <input type="text" id="taxId" value={taxId} onChange={e => setTaxId(e.target.value)} className="mt-1 block w-full bg-sov-dark border border-gray-600 rounded-md shadow-sm py-2 px-3 text-sov-light focus:outline-none focus:ring-sov-accent focus:border-sov-accent" placeholder="XXX-XX-XXXX" />
          </div>
          <div className="flex justify-end pt-4 space-x-2">
            <button type="button" onClick={() => setIsAddEmployeeModalOpen(false)} className="bg-sov-dark-alt border border-gray-600 text-sov-light font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors">Cancel</button>
            <button type="submit" className="bg-sov-accent text-sov-dark font-bold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors">Save Employee</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isEditEmployeeModalOpen} onClose={() => setIsEditEmployeeModalOpen(false)} title="Edit Employee">
        <form onSubmit={handleSaveEditEmployee} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="editName" className="block text-sm font-medium text-sov-light-alt">Employee Name</label>
              <input type="text" id="editName" value={editName} onChange={e => setEditName(e.target.value)} required className="mt-1 block w-full bg-sov-dark border border-gray-600 rounded-md shadow-sm py-2 px-3 text-sov-light focus:outline-none focus:ring-sov-accent focus:border-sov-accent" />
            </div>
            <div>
              <label htmlFor="editAnnualSalary" className="block text-sm font-medium text-sov-light-alt">Annual Salary</label>
              <input type="number" id="editAnnualSalary" value={editAnnualSalary} onChange={e => setEditAnnualSalary(e.target.valueAsNumber || '')} min="1" step="1" required className="mt-1 block w-full bg-sov-dark border border-gray-600 rounded-md shadow-sm py-2 px-3 text-sov-light focus:outline-none focus:ring-sov-accent focus:border-sov-accent" />
            </div>
          </div>
          <div>
            <label htmlFor="editPaymentMethod" className="block text-sm font-medium text-sov-light-alt">Payment Method</label>
            <select id="editPaymentMethod" value={editPaymentMethod} onChange={e => setEditPaymentMethod(e.target.value as 'ACH' | 'Wire' | 'Crypto')} className="mt-1 block w-full bg-sov-dark border border-gray-600 rounded-md shadow-sm py-2 px-3 text-sov-light focus:outline-none focus:ring-sov-accent focus:border-sov-accent">
              <option value="ACH">ACH Direct Deposit</option>
              <option value="Wire">Wire Transfer</option>
              <option value="Crypto">Cryptocurrency</option>
            </select>
          </div>
          {editPaymentMethod !== 'Crypto' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="editBankRoutingNumber" className="block text-sm font-medium text-sov-light-alt">Bank Routing Number</label>
                <input type="text" id="editBankRoutingNumber" value={editBankRoutingNumber} onChange={e => setEditBankRoutingNumber(e.target.value)} className="mt-1 block w-full bg-sov-dark border border-gray-600 rounded-md shadow-sm py-2 px-3 text-sov-light focus:outline-none focus:ring-sov-accent focus:border-sov-accent" placeholder="9 digits" maxLength={9} />
              </div>
              <div>
                <label htmlFor="editBankAccountNumber" className="block text-sm font-medium text-sov-light-alt">Bank Account Number</label>
                <input type="text" id="editBankAccountNumber" value={editBankAccountNumber} onChange={e => setEditBankAccountNumber(e.target.value)} className="mt-1 block w-full bg-sov-dark border border-gray-600 rounded-md shadow-sm py-2 px-3 text-sov-light focus:outline-none focus:ring-sov-accent focus:border-sov-accent" placeholder="Account number" />
              </div>
            </div>
          )}
          <div>
            <label htmlFor="editTaxId" className="block text-sm font-medium text-sov-light-alt">Tax ID / SSN</label>
            <input type="text" id="editTaxId" value={editTaxId} onChange={e => setEditTaxId(e.target.value)} className="mt-1 block w-full bg-sov-dark border border-gray-600 rounded-md shadow-sm py-2 px-3 text-sov-light focus:outline-none focus:ring-sov-accent focus:border-sov-accent" placeholder="XXX-XX-XXXX" />
          </div>
          <div className="flex justify-end pt-4 space-x-2">
            <button type="button" onClick={() => setIsEditEmployeeModalOpen(false)} className="bg-sov-dark-alt border border-gray-600 text-sov-light font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors">Cancel</button>
            <button type="submit" className="bg-sov-accent text-sov-dark font-bold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors">Update Employee</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isConfirmPayrollModalOpen} onClose={() => setIsConfirmPayrollModalOpen(false)} title="Confirm Payroll Run">
        <div className="text-sov-light space-y-4">
            <p>Are you sure you want to run payroll for September 2025? This action cannot be undone.</p>
            
            {payrollMethod === 'Stripe Connect' && (
              <div className="bg-sov-accent/10 text-sov-accent p-4 rounded-lg border border-sov-accent/30">
                <h4 className="font-semibold mb-2">Stripe Connect Processing</h4>
                <ul className="text-sm space-y-1">
                  <li>• Direct deposit processing via Stripe Connect</li>
                  <li>• Automated compliance and verification</li>
                  <li>• Real-time payout tracking</li>
                  <li>• Enhanced security and fraud protection</li>
                </ul>
              </div>
            )}
            
            <div className="bg-sov-dark p-4 rounded-lg border border-gray-600">
              <h4 className="font-semibold mb-2">Payroll Summary</h4>
              <div className="text-sm space-y-1">
                <p>Employees: {employees.length}</p>
                <p>Estimated Gross: ${employees.reduce((sum, emp) => sum + emp.annualSalary, 0) / 12}</p>
                <p>Estimated Net: ${employees.reduce((sum, emp) => sum + (emp.annualSalary * 0.8 / 12), 0)}</p>
                <p>Payment Method: {payrollMethod}</p>
              </div>
            </div>
            
            <div className="flex justify-end pt-4 space-x-2">
                <button type="button" onClick={() => setIsConfirmPayrollModalOpen(false)} className="bg-sov-dark-alt border border-gray-600 text-sov-light font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors">Cancel</button>
                <button onClick={handleRunPayroll} className="bg-sov-accent text-sov-dark font-bold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors">Run Payroll</button>
            </div>
        </div>
      </Modal>

       <Modal isOpen={!!selectedEmployeeForStub} onClose={() => setSelectedEmployeeForStub(null)} title={`Pay Statement for ${selectedEmployeeForStub?.name}`}>
        {selectedEmployeeForStub && (
            <div id="payroll-stub-printable">
                <PayrollStub
                    employee={selectedEmployeeForStub}
                    payPeriod="09/01/2025 - 09/30/2025"
                    payDate="09/30/2025"
                />
            </div>
        )}
        <div className="flex justify-end pt-4 space-x-2 mt-4 border-t border-gray-600">
            <p className="text-sm text-sov-light-alt mr-auto self-center">
              Tip: Use "Save as PDF" in the print dialog to download.
            </p>
            <button type="button" onClick={() => setSelectedEmployeeForStub(null)} className="bg-sov-dark-alt border border-gray-600 text-sov-light font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors">Close</button>
            <button onClick={handlePrint} className="bg-sov-accent text-sov-dark font-bold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors">Print / Download</button>
        </div>
      </Modal>
    </div>
  );
};