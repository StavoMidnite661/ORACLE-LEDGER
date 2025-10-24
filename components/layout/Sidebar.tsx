
import React from 'react';
import { View } from '../../types';
import { NavItem } from './NavItem';
import { 
    DashboardIcon, JournalIcon, ChartOfAccountsIcon, PurchaseOrdersIcon, 
    ARIcon, APIcon, VendorPaymentsIcon, VendorManagementIcon, 
    CardManagementIcon, ConsulCreditsIcon, PayrollIcon, SettingsIcon, 
    UserManualIcon, TermsIcon 
} from '../../components/shared/Icons';

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  openTermsModal: () => void;
  openManualModal: () => void;
}

const mainViews = [
    { id: View.Dashboard, label: 'Dashboard', icon: <DashboardIcon /> },
    { id: View.Journal, label: 'Journal Entries', icon: <JournalIcon /> },
    { id: View.ChartOfAccounts, label: 'Chart of Accounts', icon: <ChartOfAccountsIcon /> },
    { id: View.PurchaseOrders, label: 'Purchase Orders', icon: <PurchaseOrdersIcon /> },
    { id: View.AccountsReceivable, label: 'Accounts Receivable', icon: <ARIcon /> },
    { id: View.AccountsPayable, label: 'Accounts Payable', icon: <APIcon /> },
    { id: View.VendorPayments, label: 'Vendor Payments', icon: <VendorPaymentsIcon /> },
    { id: View.VendorManagement, label: 'Vendor Management', icon: <VendorManagementIcon /> },
    { id: View.CardManagement, label: 'Company Cards', icon: <CardManagementIcon /> },
    { id: View.ConsulCredits, label: 'Consul Credits', icon: <ConsulCreditsIcon /> },
    { id: View.Payroll, label: 'Payroll', icon: <PayrollIcon /> },
    { id: View.Settings, label: 'Settings', icon: <SettingsIcon /> },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, openTermsModal, openManualModal }) => {
  return (
    <div className="bg-sov-dark-alt w-64 flex flex-col p-4 border-r border-gray-700">
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-sov-light tracking-wider">ORACLE-LEDGER</h1>
                <p className="text-xs text-sov-light-alt">SOVRCVLT-OS</p>
            </div>
            <nav className="space-y-2">
                {mainViews.map((view) => (
                    <NavItem 
                        key={view.id} 
                        label={view.label} 
                        icon={view.icon}
                        isActive={activeView === view.id}
                        onClick={() => setActiveView(view.id)}
                    />
                ))}
            </nav>
        </div>
        <div className="space-y-2 mt-auto">
            <NavItem label="User Manual" icon={<UserManualIcon />} onClick={openManualModal} />
            <NavItem label="Terms & Conditions" icon={<TermsIcon />} onClick={openTermsModal} />
        </div>
    </div>
  );
};
