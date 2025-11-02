/**
 * ORACLE-LEDGER Security Dashboard Components
 * Enterprise-grade security monitoring and alerting system
 * Updated: 2025-11-02
 */

export { default as SecurityOverview } from './SecurityOverview';
export { default as AlertDashboard } from './AlertDashboard';
export { default as ComplianceMonitor } from './ComplianceMonitor';
export { default as IncidentResponse } from './IncidentResponse';
export { default as SecurityMetrics } from './SecurityMetrics';

// Service exports for direct usage
export { securityMonitoringService } from '../../services/securityMonitoringService';
export { alertManagementService } from '../../services/alertManagementService';
export { securityComplianceService } from '../../services/securityComplianceService';

// Type exports
export type {
  SecurityEvent,
  ThreatDetectionRule,
  SecurityMetrics,
  AccessControlEvent,
  SystemHealthMetrics,
  AnomalyDetectionConfig
} from '../../services/securityMonitoringService';

export type {
  Alert,
  AlertChannel,
  EscalationPolicy,
  OnCallSchedule,
  AlertCorrelation,
  AlertMetrics,
  NotificationTemplate
} from '../../services/alertManagementService';

export type {
  ComplianceControl,
  ComplianceTestResult,
  ComplianceEvidence,
  ComplianceRemediation,
  ComplianceStandard,
  ComplianceRequirement,
  VulnerabilityAssessment,
  VulnerabilityFinding,
  SecurityPolicy,
  PolicyException,
  ComplianceReport,
  ComplianceControlSummary,
  ComplianceMetrics
} from '../../services/securityComplianceService';