// Stripe Dashboard Components Export
// Comprehensive dashboard and reporting components for ORACLE-LEDGER Stripe integration

export { StripeDashboard } from './StripeDashboard';
export { PaymentAnalytics } from './PaymentAnalytics';
export { ReconciliationDashboard } from './ReconciliationDashboard';
export { ComplianceDashboard } from './ComplianceDashboard';
export { WebhookStatus } from './WebhookStatus';
export { FeeAnalytics } from './FeeAnalytics';
export { FeeDashboard } from './FeeDashboard';

// Component metadata for easy integration
export const DASHBOARD_COMPONENTS = {
  STRIPE_DASHBOARD: {
    name: 'StripeDashboard',
    description: 'Main Stripe dashboard with key metrics, recent activity, and compliance status',
    features: [
      'Key metrics display (total payments, success rate, fees)',
      'Recent payment activity widget',
      'ACH vs Card payment breakdown',
      'Direct deposit recipient status',
      'Compliance status indicators',
      'Quick action buttons'
    ]
  },
  PAYMENT_ANALYTICS: {
    name: 'PaymentAnalytics',
    description: 'Advanced payment analytics with charts and trend analysis',
    features: [
      'Volume trends (daily, weekly, monthly)',
      'Success/failure rates by payment method',
      'Return analysis and trends',
      'Fee breakdown and optimization',
      'Geographic payment distribution',
      'Customer payment behavior analysis'
    ]
  },
  RECONCILIATION_DASHBOARD: {
    name: 'ReconciliationDashboard',
    description: 'Comprehensive reconciliation interface for payment matching',
    features: [
      'Unreconciled payments list',
      'Auto-reconciliation status',
      'Manual reconciliation tools',
      'Balance transaction matching',
      'Reconciliation reports and exports',
      'Exception handling and resolution'
    ]
  },
  COMPLIANCE_DASHBOARD: {
    name: 'ComplianceDashboard',
    description: 'Regulatory compliance monitoring and audit management',
    features: [
      'PCI compliance status tracking',
      'Audit log summary and analysis',
      'Compliance checklist progress',
      'Risk assessment indicators',
      'Regulatory reporting tools',
      'Alert notifications system'
    ]
  },
  WEBHOOK_STATUS: {
    name: 'WebhookStatus',
    description: 'Real-time Stripe webhook monitoring and debugging',
    features: [
      'Recent webhook events monitoring',
      'Processing status indicators',
      'Failed event retry options',
      'Event type breakdown',
      'Performance metrics tracking',
      'Debugging tools and utilities'
    ]
  },
  FEE_ANALYTICS: {
    name: 'FeeAnalytics',
    description: 'Comprehensive fee analytics with optimization recommendations',
    features: [
      'Fee breakdown by payment type and category',
      'Monthly fee trend analysis',
      'Cost optimization recommendations',
      'Variance alerts and monitoring',
      'Fee dispute management',
      'Compliance reporting and audit trails',
      'ROI analysis for fee optimization',
      'Export capabilities (CSV, PDF, Excel)'
    ]
  },
  FEE_DASHBOARD: {
    name: 'FeeDashboard',
    description: 'Executive fee management dashboard with KPI monitoring',
    features: [
      'Real-time fee KPIs and metrics',
      'Fee trend visualization',
      'Compliance status monitoring',
      'Optimization impact analysis',
      'Variance alert management',
      'Fee dispute tracking and resolution',
      'Quick action buttons for common tasks',
      'Interactive charts and filters'
    ]
  }
};

// Usage examples and integration notes
export const INTEGRATION_GUIDE = {
  setup: {
    imports: `import { StripeDashboard, PaymentAnalytics, ReconciliationDashboard, ComplianceDashboard, WebhookStatus, FeeAnalytics, FeeDashboard } from '@/components/dashboard';`,
    usage: `// Main dashboard page with fee analytics
function StripeDashboardPage() {
  return (
    <div className="space-y-6">
      <StripeDashboard />
      <PaymentAnalytics />
      <FeeDashboard />
      <FeeAnalytics />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReconciliationDashboard />
        <ComplianceDashboard />
      </div>
      <WebhookStatus />
    </div>
  );
}

// Fee-specific dashboard page
function FeeManagementPage() {
  return (
    <div className="space-y-6">
      <FeeDashboard />
      <FeeAnalytics />
    </div>
  );
}`
  },
  features: {
    realtime: 'Components support real-time data updates when connected to live APIs',
    responsive: 'All components are fully responsive and work on mobile devices',
    exportable: 'Built-in export functionality for reports and data',
    customizable: 'Props-based configuration for different use cases',
    accessible: 'WCAG compliant with proper ARIA labels and keyboard navigation'
  },
  data_sources: [
    'Stripe API for payment and customer data',
    'ORACLE-LEDGER database for journal entries',
    'Fee tracking service for comprehensive fee analytics',
    'Compliance monitoring systems',
    'Webhook event logs',
    'Reconciliation matching engine'
  ],
  fee_tracking_features: [
    'Comprehensive fee calculation across all payment types',
    'Real-time fee variance monitoring and alerts',
    'Automated compliance checking (NACHA, PCI DSS, SOX)',
    'Fee optimization recommendations with ROI analysis',
    'Complete audit trails for regulatory compliance',
    'Fee dispute management and resolution workflows',
    'Volume-based pricing optimization',
    'Risk-adjusted fee calculations'
  ]
};