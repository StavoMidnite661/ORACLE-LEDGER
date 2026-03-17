/**
 * ORACLE-LEDGER Security Dashboard Components
 * Enterprise-grade security monitoring and alerting system
 * Updated: 2025-11-02
 */

export { default as SecurityOverview } from './SecurityOverview.js';
export { default as AlertDashboard } from './AlertDashboard.js';
export { default as ComplianceMonitor } from './ComplianceMonitor.js';
export { default as IncidentResponse } from './IncidentResponse.js';
export { default as SecurityMetricsComponent } from './SecurityMetrics.js';

// Service exports for direct usage
export { SecurityMonitoringService, securityMonitoringService } from '../../services/securityMonitoringService.js';
export { alertManagementService } from '../../services/alertManagementService.js';
export { securityComplianceService } from '../../services/securityComplianceService.js';

// Type exports
export type {
  SecurityEvent,
  ThreatDetectionRule,
  SecurityMetrics as MonitoringSecurityMetrics,
  AccessControlEvent,
  SystemHealthMetrics,
  AnomalyDetectionConfig
} from '../../services/securityMonitoringService.js';

export type { DashboardSecurityMetrics as SecurityMetrics } from './SecurityMetrics.js';

export type {
  Alert,
  AlertChannel,
  EscalationPolicy,
  OnCallSchedule,
  AlertCorrelation,
  AlertMetrics,
  NotificationTemplate
} from '../../services/alertManagementService.js';

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
} from '../../services/securityComplianceService.js';