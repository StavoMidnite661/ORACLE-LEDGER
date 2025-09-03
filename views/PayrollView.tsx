import React, { useState, useMemo } from 'react';
import type { Employee, JournalEntry } from '../types';
import { Modal } from '../components/shared/Modal';
import { PayrollStub } from '../components/payroll/PayrollStub';

interface PayrollViewProps {
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'date'>) => void;
}

type SortableKeys = keyof Employee | 'monthlyGross';
type SortConfig = { key: SortableKeys; direction: 'ascending' | 'descending' };

const SortIndicator: React.FC<{ direction?: 'ascending' | 'descending' }> = ({ direction }) => (
  <span className="inline-flex flex-col text-xs ml-2 opacity-50">
    <svg className={`h-2 w-2 ${direction === 'ascending' ? 'text-sov-light opacity-100' : 'text-sov-light-alt'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M10 3l-5 5h10l-5-5z"/></svg>
    <svg className={`h-2 w-2 ${direction === 'descending' ? 'text-sov-light opacity-100' : 'text-sov-light-alt'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M10 17l5-5H5l5 5z"/></svg>
  </span>
);

export const PayrollView: React.FC<PayrollViewProps> = ({ employees, addEmployee, addJournalEntry }) => {
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [isConfirmPayrollModalOpen, setIsConfirmPayrollModalOpen] = useState(false);
  const [selectedEmployeeForStub, setSelectedEmployeeForStub] = useState<Employee | null>(null);
  const [name, setName] = useState('');
  const [annualSalary, setAnnualSalary] = useState<number | ''>('');
  const [lastPayrollRun, setLastPayrollRun] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'name', direction: 'ascending' });

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
    addEmployee({ name, annualSalary });
    setIsAddEmployeeModalOpen(false);
    setName('');
    setAnnualSalary('');
  };

  const handleRunPayroll = () => {
    if (employees.length === 0) return;

    const totalGrossPay = employees.reduce((sum, emp) => sum + emp.annualSalary, 0) / 12;
    const totalDeductions = totalGrossPay * 0.20; // Simplified 20% deduction
    const totalNetPay = totalGrossPay - totalDeductions;

    // 1. Record Gross Payroll Expense
    addJournalEntry({
      description: 'Record monthly gross payroll expense',
      source: 'PAYROLL',
      status: 'Posted',
      lines: [
        { accountId: 6000, type: 'DEBIT', amount: totalGrossPay },
        { accountId: 2400, type: 'CREDIT', amount: totalGrossPay },
      ],
    });

    // 2. Transfer Net Pay to ACH Clearing
    addJournalEntry({
      description: 'Transfer net payroll to ACH clearing',
      source: 'PAYROLL',
      status: 'Posted',
      lines: [
        { accountId: 2400, type: 'DEBIT', amount: totalNetPay },
        { accountId: 2100, type: 'CREDIT', amount: totalNetPay },
      ],
    });
    
    setLastPayrollRun(`Successfully ran payroll for ${employees.length} employees. Gross: $${totalGrossPay.toFixed(2)}, Net: $${totalNetPay.toFixed(2)}.`);
    setIsConfirmPayrollModalOpen(false);
  };
  
  const handlePrint = () => {
    window.print();
  };


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700 flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-sov-light">Run Payroll</h3>
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
                    <p className="text-sov-light-alt">Execute the monthly payroll run to generate journal entries for all employees.</p>
                )}
            </div>
        </div>
      </div>

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
                <th className="p-3 text-right cursor-pointer" onClick={() => requestSort('annualSalary')}><div className="flex items-center justify-end">Annual Salary <SortIndicator direction={getSortDirection('annualSalary')} /></div></th>
                <th className="p-3 text-right cursor-pointer" onClick={() => requestSort('monthlyGross')}><div className="flex items-center justify-end">Monthly Gross Pay <SortIndicator direction={getSortDirection('monthlyGross')} /></div></th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedEmployees.map(emp => (
                <tr key={emp.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="p-3 font-mono text-sm">{emp.id}</td>
                  <td className="p-3">{emp.name}</td>
                  <td className="p-3 text-right font-mono">${emp.annualSalary.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono">${(emp.annualSalary / 12).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                  <td className="p-3 text-right">
                    <button 
                      onClick={() => setSelectedEmployeeForStub(emp)}
                      className="bg-sov-accent/20 text-sov-accent text-xs font-bold py-1 px-3 rounded-lg hover:bg-sov-accent/30 transition-colors">
                      View Stub
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
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-sov-light-alt">Employee Name</label>
            <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full bg-sov-dark border border-gray-600 rounded-md shadow-sm py-2 px-3 text-sov-light focus:outline-none focus:ring-sov-accent focus:border-sov-accent" />
          </div>
          <div>
            <label htmlFor="annualSalary" className="block text-sm font-medium text-sov-light-alt">Annual Salary</label>
            <input type="number" id="annualSalary" value={annualSalary} onChange={e => setAnnualSalary(e.target.valueAsNumber || '')} min="1" step="1" required className="mt-1 block w-full bg-sov-dark border border-gray-600 rounded-md shadow-sm py-2 px-3 text-sov-light focus:outline-none focus:ring-sov-accent focus:border-sov-accent" />
          </div>
          <div className="flex justify-end pt-4 space-x-2">
            <button type="button" onClick={() => setIsAddEmployeeModalOpen(false)} className="bg-sov-dark-alt border border-gray-600 text-sov-light font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors">Cancel</button>
            <button type="submit" className="bg-sov-accent text-sov-dark font-bold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors">Save Employee</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isConfirmPayrollModalOpen} onClose={() => setIsConfirmPayrollModalOpen(false)} title="Confirm Payroll Run">
        <div className="text-sov-light space-y-4">
            <p>Are you sure you want to run payroll for September 2025? This action cannot be undone.</p>
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