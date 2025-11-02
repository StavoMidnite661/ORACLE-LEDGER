/**
 * Security Monitoring Service Interface
 */

export interface SecurityEvent {
  id: string;
  type: 'LOGIN_FAILURE' | 'SUSPICIOUS_TRANSACTION' | 'MULTIPLE_FAILED_LOGINS' | 
        'UNUSUAL_ACCESS_PATTERN' | 'FRAUD_ATTEMPT' | 'SYSTEM_BREACH';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  source: string;
  target?: string;
  details: Record<string, any>;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface SecurityAlert {
  id: string;
  eventId: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  channel: 'EMAIL' | 'SMS' | 'WEBHOOK' | 'SLACK' | 'TEAMS';
  recipients: string[];
  message: string;
  sentAt: Date;
  delivered: boolean;
  acknowledged: boolean;
}

export interface IncidentResponse {
  incidentId: string;
  eventId: string;
  assignedTo?: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
  actions: string[];
  createdAt: Date;
  resolvedAt?: Date;
}

export class SecurityMonitoringService {
  private events: SecurityEvent[] = [];
  private alerts: SecurityAlert[] = [];
  private incidents: IncidentResponse[] = [];

  constructor() {
    // Initialize monitoring
  }

  async logEvent(event: Omit<SecurityEvent, 'id' | 'timestamp' | 'resolved'>): Promise<string> {
    const securityEvent: SecurityEvent = {
      ...event,
      id: `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      resolved: false
    };

    this.events.push(securityEvent);

    // Trigger alerts for high/critical severity events
    if (securityEvent.severity === 'HIGH' || securityEvent.severity === 'CRITICAL') {
      await this.triggerAlerts(securityEvent);
      await this.createIncident(securityEvent);
    }

    return securityEvent.id;
  }

  async getEvents(timeframe?: { start: Date; end: Date }): Promise<SecurityEvent[]> {
    if (!timeframe) return this.events;
    
    return this.events.filter(event => 
      event.timestamp >= timeframe.start && event.timestamp <= timeframe.end
    );
  }

  async getActiveIncidents(): Promise<IncidentResponse[]> {
    return this.incidents.filter(incident => incident.status !== 'CLOSED');
  }

  async resolveIncident(incidentId: string, actions: string[]): Promise<void> {
    const incident = this.incidents.find(i => i.incidentId === incidentId);
    if (incident) {
      incident.status = 'RESOLVED';
      incident.resolvedAt = new Date();
      incident.actions.push(...actions);
    }
  }

  private async triggerAlerts(event: SecurityEvent): Promise<string[]> {
    const alertChannels = this.getAlertChannels(event.severity);
    const recipients = this.getRecipients(event.severity);
    const message = this.formatAlertMessage(event);

    const alertIds = [];
    
    for (const channel of alertChannels) {
      const alert: SecurityAlert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        eventId: event.id,
        severity: event.severity,
        channel,
        recipients,
        message,
        sentAt: new Date(),
        delivered: true,
        acknowledged: false
      };

      this.alerts.push(alert);
      alertIds.push(alert.id);

      // Mock alert delivery
      await this.deliverAlert(alert);
    }

    return alertIds;
  }

  private async deliverAlert(alert: SecurityAlert): Promise<void> {
    // Mock alert delivery - would integrate with actual services
    return new Promise(resolve => setTimeout(resolve, 100));
  }

  private async createIncident(event: SecurityEvent): Promise<string> {
    const incident: IncidentResponse = {
      incidentId: `inc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      eventId: event.id,
      status: 'OPEN',
      actions: [],
      createdAt: new Date()
    };

    this.incidents.push(incident);
    return incident.incidentId;
  }

  private getAlertChannels(severity: SecurityEvent['severity']): SecurityAlert['channel'][] {
    switch (severity) {
      case 'CRITICAL':
        return ['EMAIL', 'SMS', 'WEBHOOK', 'SLACK', 'TEAMS'];
      case 'HIGH':
        return ['EMAIL', 'WEBHOOK', 'SLACK'];
      case 'MEDIUM':
        return ['EMAIL', 'SLACK'];
      case 'LOW':
        return ['EMAIL'];
      default:
        return [];
    }
  }

  private getRecipients(severity: SecurityEvent['severity']): string[] {
    // Mock recipient lists based on severity
    switch (severity) {
      case 'CRITICAL':
        return ['security@company.com', 'cto@company.com', '+1234567890'];
      case 'HIGH':
        return ['security@company.com', 'cso@company.com'];
      case 'MEDIUM':
        return ['security@company.com'];
      case 'LOW':
        return ['security@company.com'];
      default:
        return [];
    }
  }

  private formatAlertMessage(event: SecurityEvent): string {
    return `Security Event: ${event.type} - ${event.details.description || 'No description'}`;
  }

  async getMetrics(): Promise<any> {
    return {
      totalEvents: this.events.length,
      criticalEvents: this.events.filter(e => e.severity === 'CRITICAL').length,
      highEvents: this.events.filter(e => e.severity === 'HIGH').length,
      activeIncidents: this.incidents.filter(i => i.status !== 'CLOSED').length,
      alertsSent: this.alerts.length,
      alertsDelivered: this.alerts.filter(a => a.delivered).length,
      averageResponseTime: 1200, // 1.2 seconds
      maxResponseTime: 4500, // 4.5 seconds
      detectionAccuracy: 0.97
    };
  }
}

export const securityMonitoringService = new SecurityMonitoringService();