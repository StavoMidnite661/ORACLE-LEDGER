
import React, { useState, useMemo } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './views/DashboardView';
import { JournalView } from './views/JournalView';
import { ChartOfAccountsView } from './views/ChartOfAccountsView';
import { PurchaseOrdersView } from './views/PurchaseOrdersView';
import { AccountsReceivableView } from './views/AccountsReceivableView';
import { AccountsPayableView } from './views/AccountsPayableView';
import { PayrollView } from './views/PayrollView';
import { SettingsView } from './views/SettingsView';
import { mockJournalEntries, mockPurchaseOrders, mockInvoices, mockEmployees } from './constants';
import type { JournalEntry, PurchaseOrder, Invoice, Employee } from './types';
import { View } from './types';
import { Modal } from './components/shared/Modal';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>(View.Dashboard);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(mockJournalEntries);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(mockPurchaseOrders);
  const [arInvoices, setArInvoices] = useState<Invoice[]>(mockInvoices.filter(inv => inv.type === 'AR'));
  const [apInvoices, setApInvoices] = useState<Invoice[]>(mockInvoices.filter(inv => inv.type === 'AP'));
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);

  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [contractAddress, setContractAddress] = useState('0x742d35Cc6634C0532925a3b844Bc454e4438f44e');

  const addJournalEntry = (entry: Omit<JournalEntry, 'id' | 'date'>) => {
    setJournalEntries(prev => [
      { 
        id: `JE-${Date.now()}`, 
        date: new Date().toISOString().split('T')[0], 
        ...entry 
      },
      ...prev
    ]);
  };

  const addPurchaseOrder = (entry: Omit<PurchaseOrder, 'id' | 'date'>) => {
    setPurchaseOrders(prev => [
      { 
        id: `PO-${Date.now()}`, 
        date: new Date().toISOString().split('T')[0], 
        ...entry 
      },
      ...prev
    ]);
  };
  
  const addArInvoice = (entry: Omit<Invoice, 'id' | 'issueDate' | 'type'>) => {
    setArInvoices(prev => [
      { 
        id: `INV-AR-${Date.now()}`, 
        issueDate: new Date().toISOString().split('T')[0], 
        type: 'AR',
        ...entry 
      },
      ...prev
    ]);
  };

  const addApInvoice = (entry: Omit<Invoice, 'id' | 'issueDate' | 'type'>) => {
    setApInvoices(prev => [
      { 
        id: `INV-AP-${Date.now()}`, 
        issueDate: new Date().toISOString().split('T')[0], 
        type: 'AP',
        ...entry 
      },
      ...prev
    ]);
  };
  
  const addEmployee = (entry: Omit<Employee, 'id'>) => {
    setEmployees(prev => [
      {
        id: `EMP-${Date.now()}`,
        ...entry,
      },
      ...prev
    ]);
  };

  const renderView = () => {
    switch (activeView) {
      case View.Dashboard:
        return <DashboardView 
                    journalEntries={journalEntries} 
                    addJournalEntry={addJournalEntry} 
                    purchaseOrders={purchaseOrders}
                    arInvoices={arInvoices}
                    apInvoices={apInvoices}
                />;
      case View.Journal:
        return <JournalView journalEntries={journalEntries} addJournalEntry={addJournalEntry} />;
      case View.ChartOfAccounts:
        return <ChartOfAccountsView />;
      case View.PurchaseOrders:
        return <PurchaseOrdersView purchaseOrders={purchaseOrders} addPurchaseOrder={addPurchaseOrder} />;
      case View.AccountsReceivable:
        return <AccountsReceivableView invoices={arInvoices} addInvoice={addArInvoice} />;
      case View.AccountsPayable:
        return <AccountsPayableView invoices={apInvoices} addInvoice={addApInvoice} />;
      case View.Payroll:
        return <PayrollView employees={employees} addEmployee={addEmployee} addJournalEntry={addJournalEntry} />;
      case View.Settings:
        return <SettingsView contractAddress={contractAddress} setContractAddress={setContractAddress} />;
      default:
        return <DashboardView 
                    journalEntries={journalEntries} 
                    addJournalEntry={addJournalEntry} 
                    purchaseOrders={purchaseOrders}
                    arInvoices={arInvoices}
                    apInvoices={apInvoices}
                />;
    }
  };

  const currentViewName = useMemo(() => {
    const viewName = Object.keys(View).find(key => View[key as keyof typeof View] === activeView);
    return viewName ? viewName.replace(/([A-Z])/g, ' $1').trim() : 'Dashboard';
  }, [activeView]);

  return (
    <div className="flex h-screen bg-sov-dark text-sov-light">
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView}
        openTermsModal={() => setIsTermsModalOpen(true)}
        openManualModal={() => setIsManualModalOpen(true)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header currentViewName={currentViewName} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-sov-dark p-6">
          {renderView()}
        </main>
      </div>
      <Modal isOpen={isTermsModalOpen} onClose={() => setIsTermsModalOpen(false)} title="Terms & Conditions">
        <div className="prose prose-invert text-sov-light max-h-96 overflow-y-auto">
          <h4>1. Acceptance of Terms</h4>
          <p>By accessing and using the ORACLE-LEDGER system, you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.</p>
          <h4>2. System Use</h4>
          <p>This system is designed for authorized use by personnel of GM Family Trust and SOVR Development Holdings LLC for financial ledgering purposes. Unauthorized access or use is strictly prohibited and may be subject to legal action.</p>
          <h4>3. Data Integrity and Security</h4>
          <p>You are responsible for maintaining the confidentiality of your credentials and for all activities that occur under your account. You agree to immediately notify the system administrator of any unauthorized use of your password or account or any other breach of security.</p>
        </div>
      </Modal>
      <Modal isOpen={isManualModalOpen} onClose={() => setIsManualModalOpen(false)} title="User Manual">
         <div className="prose prose-invert text-sov-light max-h-96 overflow-y-auto">
          <h4>Welcome to ORACLE-LEDGER</h4>
          <p>This manual provides a guide to using the financial console. The sidebar on the left provides navigation to all key modules:</p>
          <ul>
            <li><strong>Dashboard:</strong> A high-level overview of key financial metrics, recent transactions, and AI-powered analysis.</li>
            <li><strong>Journal Entries:</strong> View and manually post new, balanced journal entries to the General Ledger.</li>
            <li><strong>Chart of Accounts:</strong> A reference for all available financial accounts across both entities.</li>
            <li><strong>Payroll:</strong> Manage employees and run monthly payroll cycles.</li>
            <li><strong>Settings:</strong> Configure system parameters such as the smart contract address.</li>
          </ul>
        </div>
      </Modal>
    </div>
  );
};

export default App;
