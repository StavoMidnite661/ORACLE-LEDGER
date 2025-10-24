
import React from 'react';

const createIcon = (path: React.ReactNode) => () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    {path}
  </svg>
);

export const DashboardIcon = createIcon(
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
  />
);

export const JournalIcon = createIcon(
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="M12 6.253v11.494m-9-5.747h18"
  />
);

export const ChartOfAccountsIcon = createIcon(
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="M9 17v-2m3 2v-4m3 4v-6m-9 4h12M3 7h18M5 7h14v10H5z"
  />
);

export const PurchaseOrdersIcon = createIcon(
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="M3 10h18M3 14h18M10 3v18"
  />
);

export const ARIcon = createIcon(
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="M13 17h8m0 0V9m0 8l-8-8m0 8h-3a2 2 0 01-2-2V9a2 2 0 012-2h3m-3 8v-8m-3 8H3"
  />
);

export const APIcon = createIcon(
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="M11 3h8m0 0v8m0-8l-8 8M3 11h8m0 0v8m0-8L3 3m8 8H3"
  />
);

export const VendorPaymentsIcon = createIcon(
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
  />
);

export const VendorManagementIcon = createIcon(
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
  />
);

export const CardManagementIcon = createIcon(
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
  />
);

export const ConsulCreditsIcon = createIcon(
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="M9 8l3 5m0 0l3-5m-3 5v4m-3-5h6m-6 3h6m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
  />
);

export const PayrollIcon = createIcon(
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm-9-7h6m-6 4h6m4-8v4l-2-2 2-2z"
  />
);

export const SettingsIcon = createIcon(
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z"
  />
);

export const UserManualIcon = createIcon(
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v11.494m-9-5.747h18" />
);

export const TermsIcon = createIcon(
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
);
