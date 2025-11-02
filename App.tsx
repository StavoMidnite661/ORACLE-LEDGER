
import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './views/DashboardView';
import { JournalView } from './views/JournalView';
import { ChartOfAccountsView } from './views/ChartOfAccountsView';
import { PurchaseOrdersView } from './views/PurchaseOrdersView';
import { AccountsReceivableView } from './views/AccountsReceivableView';
import { AccountsPayableView } from './views/AccountsPayableView';
import { VendorPaymentsView } from './views/VendorPaymentsView';
import { VendorManagementView } from './views/VendorManagementView';
import { CardManagementView } from './views/CardManagementView';
import { ConsulCreditsView } from './views/ConsulCreditsView';
import { StripePaymentsView } from './views/StripePaymentsView';
import { StripeSettingsView } from './views/StripeSettingsView';
import { StripeComplianceView } from './views/StripeComplianceView';
import { StripeReportsView } from './views/StripeReportsView';
import { PayrollView } from './views/PayrollView';
import { SettingsView } from './views/SettingsView';
import { mockConfig, mockSupportedTokens, mockTransactions, mockStats } from './mockData';
import { mockJournalEntries, mockPurchaseOrders, mockInvoices, mockEmployees, mockVendors, mockCompanyCards, mockCardTransactions } from './constants';
import type { JournalEntry, PurchaseOrder, Invoice, Employee, Vendor, CompanyCard, CardTransaction, ConsulCreditsConfig, SupportedToken, ConsulCreditsTransaction, ConsulCreditsStats } from './types';
import { View } from './types';
import { Modal } from './components/shared/Modal';
import { consulCreditsService } from './services/consulCreditsService';
import { apiService } from './services/apiService';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>(View.Dashboard);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [arInvoices, setArInvoices] = useState<Invoice[]>([]);
  const [apInvoices, setApInvoices] = useState<Invoice[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [companyCards, setCompanyCards] = useState<CompanyCard[]>([]);
  const [cardTransactions, setCardTransactions] = useState<CardTransaction[]>([]);
  const [consulCreditsConfig, setConsulCreditsConfig] = useState<ConsulCreditsConfig | null>(mockConfig);
  const [supportedTokens, setSupportedTokens] = useState<SupportedToken[]>(mockSupportedTokens);
  const [consulCreditsTransactions, setConsulCreditsTransactions] = useState<ConsulCreditsTransaction[]>(mockTransactions);
  const [consulCreditsStats, setConsulCreditsStats] = useState<ConsulCreditsStats | null>(mockStats);
  const [useMockData, setUseMockData] = useState(true);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [contractAddress, setContractAddress] = useState('0x742d35Cc6634C0532925a3b844Bc454e4438f44e');

  const intercompanyPayableBalance = useMemo(() => {
    return journalEntries.reduce((balance, entry) => {
      const payableLine = entry.lines.find(line => line.accountId === 2200);
      if (payableLine) {
        if (payableLine.type === 'CREDIT') return balance + payableLine.amount;
        if (payableLine.type === 'DEBIT') return balance - payableLine.amount;
      }
      return balance;
    }, 0);
  }, [journalEntries]);

  const addJournalEntry = async (entry: Omit<JournalEntry, 'id' | 'date'>) => {
    if (useMockData) return;
    try {
      const newEntry = await apiService.addJournalEntry(entry);
      setJournalEntries(prev => [newEntry, ...prev]);
    } catch (err) { setError('Failed to add journal entry'); }
  };

  const addPurchaseOrder = async (entry: Omit<PurchaseOrder, 'id' | 'date'>) => {
    if (useMockData) return;
    try {
      const newOrder = await apiService.addPurchaseOrder(entry);
      setPurchaseOrders(prev => [newOrder, ...prev]);
    } catch (err) { setError('Failed to add purchase order'); }
  };

  const addArInvoice = async (entry: Omit<Invoice, 'id' | 'issueDate' | 'type'>) => {
    if (useMockData) return;
    try {
      const newInvoice = await apiService.addInvoice({ ...entry, type: 'AR' });
      setArInvoices(prev => [newInvoice, ...prev]);
    } catch (err) { setError('Failed to add AR invoice'); }
  };

  const addApInvoice = async (entry: Omit<Invoice, 'id' | 'issueDate' | 'type'>) => {
    if (useMockData) return;
    try {
      const newInvoice = await apiService.addInvoice({ ...entry, type: 'AP' });
      setApInvoices(prev => [newInvoice, ...prev]);
    } catch (err) { setError('Failed to add AP invoice'); }
  };

  const updateApInvoiceStatus = async (invoiceId: string, status: Invoice['status']) => {
    if (useMockData) return;
    try {
      const updatedInvoice = await apiService.updateInvoiceStatus(invoiceId, status);
      setApInvoices(prev => prev.map(inv => (inv.id === invoiceId ? updatedInvoice : inv)));
    } catch (err) { setError('Failed to update AP invoice status'); }
  };

  const addEmployee = async (entry: Omit<Employee, 'id'>) => {
    if (useMockData) return;
    try {
      const newEmployee = await apiService.addEmployee(entry);
      setEmployees(prev => [newEmployee, ...prev]);
    } catch (err) { setError('Failed to add employee'); }
  };

  const updateEmployee = async (updatedEmployee: Employee) => {
    if (useMockData) return;
    try {
      const updated = await apiService.updateEmployee(updatedEmployee);
      setEmployees(prev => prev.map(emp => (emp.id === updatedEmployee.id ? updated : emp)));
    } catch (err) { setError('Failed to update employee'); }
  };

  const addVendor = async (entry: Omit<Vendor, 'id' | 'createdDate'>) => {
    if (useMockData) return;
    try {
      const newVendor = await apiService.addVendor(entry);
      setVendors(prev => [newVendor, ...prev]);
    } catch (err) { setError('Failed to add vendor'); }
  };

  const updateVendor = (vendorId: string, updates: Partial<Vendor>) => {
    if (useMockData) return;
    setVendors(prev => prev.map(vendor => (vendor.id === vendorId ? { ...vendor, ...updates } : vendor)));
  };

  const addCompanyCard = async (entry: Omit<CompanyCard, 'id' | 'issueDate' | 'spentThisMonth' | 'spentThisQuarter' | 'spentThisYear' | 'lastActivity'>) => {
    if (useMockData) return;
    try {
      const cardWithDefaults = { ...entry, issueDate: new Date().toISOString().split('T')[0], spentThisMonth: 0, spentThisQuarter: 0, spentThisYear: 0, lastActivity: undefined };
      const newCard = await apiService.addCompanyCard(cardWithDefaults);
      setCompanyCards(prev => [newCard, ...prev]);
    } catch (err) { setError('Failed to add company card'); }
  };

  const updateCompanyCard = async (cardId: string, updates: Partial<CompanyCard>) => {
    if (useMockData) return;
    try {
      const fullCard = companyCards.find(card => card.id === cardId);
      if (!fullCard) throw new Error('Card not found');
      const updatedCard = await apiService.updateCompanyCard({ ...fullCard, ...updates });
      setCompanyCards(prev => prev.map(card => (card.id === cardId ? updatedCard : card)));
    } catch (err) { setError('Failed to update company card'); }
  };

  const updateConsulCreditsConfig = (updates: Partial<ConsulCreditsConfig>) => {
    setConsulCreditsConfig(prev => prev ? ({ ...prev, ...updates }) : null);
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      if (useMockData) {
        setJournalEntries(mockJournalEntries);
        setPurchaseOrders(mockPurchaseOrders);
        setArInvoices(mockInvoices.filter(inv => inv.type === 'AR'));
        setApInvoices(mockInvoices.filter(inv => inv.type === 'AP'));
        setEmployees(mockEmployees);
        setVendors(mockVendors);
        setCompanyCards(mockCompanyCards);
        setCardTransactions(mockCardTransactions);
        setConsulCreditsConfig(mockConfig);
        setSupportedTokens(mockSupportedTokens);
        setConsulCreditsTransactions(mockTransactions);
        setConsulCreditsStats(mockStats);
      } else {
        try {
          const [journalData, poData, invoiceData, employeeData, vendorData, cardData, cardTransactionData, consulCreditsConfigData, consulCreditsTransactionsData] = await Promise.all([
            apiService.getJournalEntries(),
            apiService.getPurchaseOrders(),
            apiService.getInvoices(),
            apiService.getEmployees(),
            apiService.getVendors(),
            apiService.getCompanyCards(),
            apiService.getCardTransactions(),
            apiService.getConsulCreditsConfig(),
            apiService.getConsulCreditsTransactions(),
          ]);
          setJournalEntries(journalData);
          setPurchaseOrders(poData);
          setArInvoices(invoiceData.filter(inv => inv.type === 'AR'));
          setApInvoices(invoiceData.filter(inv => inv.type === 'AP'));
          setEmployees(employeeData);
          setVendors(vendorData);
          setCompanyCards(cardData);
          setCardTransactions(cardTransactionData);
          setConsulCreditsConfig(consulCreditsConfigData);
          setConsulCreditsTransactions(consulCreditsTransactionsData);
          
          if (consulCreditsConfigData) {
            await consulCreditsService.initialize(consulCreditsConfigData);
            const stats = await consulCreditsService.getContractStats();
            setConsulCreditsStats(stats);
            // TODO: Get supported tokens from service if needed
          }
        } catch (err) {
          setError('Failed to load application data.');
        }
      }
      setIsLoading(false);
    };
    loadData();
  }, [useMockData]);

  const renderView = () => {
    if (isLoading) return <div>Loading...</div>;
    if (error) return <div className="text-red-500">Error: {error}</div>;

    switch (activeView) {
      case View.Dashboard: return <DashboardView 
        journalEntries={journalEntries} 
        addJournalEntry={addJournalEntry} 
        purchaseOrders={purchaseOrders} 
        arInvoices={arInvoices} 
        apInvoices={apInvoices} 
        intercompanyPayableBalance={intercompanyPayableBalance}
        stripeCustomers={[]}
        achPayments={[]}
        directDepositPayouts={[]}
      />;
      case View.Journal: return <JournalView journalEntries={journalEntries} addJournalEntry={addJournalEntry} />;
      case View.ChartOfAccounts: return <ChartOfAccountsView journalEntries={journalEntries} />;
      case View.PurchaseOrders: return <PurchaseOrdersView purchaseOrders={purchaseOrders} addPurchaseOrder={addPurchaseOrder} />;
      case View.AccountsReceivable: return <AccountsReceivableView invoices={arInvoices} addInvoice={addArInvoice} />;
      case View.AccountsPayable: return <AccountsPayableView invoices={apInvoices} addInvoice={addApInvoice} />;
      case View.VendorPayments: return <VendorPaymentsView invoices={apInvoices} updateInvoiceStatus={updateApInvoiceStatus} addJournalEntry={addJournalEntry} />;
      case View.VendorManagement: return <VendorManagementView vendors={vendors} addVendor={addVendor} updateVendor={updateVendor} />;
      case View.CardManagement: return <CardManagementView cards={companyCards} transactions={cardTransactions} addCard={addCompanyCard} updateCard={updateCompanyCard} />;
      case View.ConsulCredits: return consulCreditsConfig && consulCreditsStats ? <ConsulCreditsView config={consulCreditsConfig} supportedTokens={supportedTokens} transactions={consulCreditsTransactions} stats={consulCreditsStats} updateConfig={updateConsulCreditsConfig} /> : <div>Loading Consul Credits data...</div>;
      case View.StripePayments: return <StripePaymentsView />;
      case View.StripeSettings: return <StripeSettingsView />;
      case View.StripeCompliance: return <StripeComplianceView />;
      case View.StripeReports: return <StripeReportsView />;
      case View.Payroll: return <PayrollView employees={employees} addEmployee={addEmployee} updateEmployee={updateEmployee} addJournalEntry={addJournalEntry} />;
      case View.Settings: return <SettingsView contractAddress={contractAddress} setContractAddress={setContractAddress} />;
      default: return <DashboardView 
        journalEntries={journalEntries} 
        addJournalEntry={addJournalEntry} 
        purchaseOrders={purchaseOrders} 
        arInvoices={arInvoices} 
        apInvoices={apInvoices} 
        intercompanyPayableBalance={intercompanyPayableBalance}
        stripeCustomers={[]}
        achPayments={[]}
        directDepositPayouts={[]}
      />;
    }
  };

  const currentViewName = useMemo(() => {
    const viewName = Object.keys(View).find(key => View[key as keyof typeof View] === activeView);
    return viewName ? viewName.replace(/([A-Z])/g, ' $1').trim() : 'Dashboard';
  }, [activeView]);

  return (
    <div className="flex bg-sov-dark text-sov-light">
      <Sidebar activeView={activeView} setActiveView={setActiveView} openTermsModal={() => setIsTermsModalOpen(true)} openManualModal={() => setIsManualModalOpen(true)} />
      <div className="flex-1 flex flex-col overflow-hidden h-screen">
        <Header currentViewName={currentViewName} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-sov-dark p-6">
          <div className="mb-4 flex justify-between items-center">
            <span className="text-lg font-semibold">{currentViewName}</span>
          </div>
          {renderView()}
        </main>
      </div>
      <Modal isOpen={isTermsModalOpen} onClose={() => setIsTermsModalOpen(false)} title="Terms & Conditions">
        <div className="prose prose-invert text-sov-light max-h-96 overflow-y-auto">{/* ... */ }</div>
      </Modal>
      <Modal isOpen={isManualModalOpen} onClose={() => setIsManualModalOpen(false)} title="User Manual">
        <div className="prose prose-invert text-sov-light max-h-96 overflow-y-auto">{/* ... */ }</div>
      </Modal>
    </div>
  );
};

export default App;
