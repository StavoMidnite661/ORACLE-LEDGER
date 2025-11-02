/**
 * ORACLE-LEDGER Alert Management and Notification System
 * Multi-channel alerting with escalation workflows
 * Updated: 2025-11-02
 */

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  source: string;
  status: 'open' | 'acknowledged' | 'investigating' | 'resolved' | 'closed';
  assignedTo?: string;
  assignedTeam?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  metadata: Record<string, any>;
  tags: string[];
  escalationLevel: number;
  autoResolve: boolean;
  resolution?: string;
  evidence: string[];
  relatedEvents: string[];
}

export interface AlertChannel {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'webhook' | 'slack' | 'teams' | 'pagerduty' | 'in_app';
  enabled: boolean;
  config: Record<string, any>;
  filters: {
    severities: string[];
    categories: string[];
    sources: string[];
  };
  cooldown: number; // minutes between alerts
  lastSent?: Date;
}

export interface EscalationPolicy {
  id: string;
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  steps: EscalationStep[];
  enabled: boolean;
}

export interface EscalationStep {
  order: number;
  delay: number; // minutes
  channels: string[]; // channel IDs
  recipients: string[];
  actions: string[];
}

export interface OnCallSchedule {
  id: string;
  name: string;
  timezone: string;
  shifts: OnCallShift[];
  rotations: RotationRule[];
}

export interface OnCallShift {
  id: string;
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  daysOfWeek: number[]; // 0-6, Sunday = 0
  assignee: string;
  role: string;
}

export interface RotationRule {
  id: string;
  schedule: string; // daily, weekly, monthly
  primaryRotation: string[]; // user IDs
  backupRotation?: string[];
  autoRotation: boolean;
}

export interface AlertCorrelation {
  id: string;
  masterAlertId: string;
  relatedAlertIds: string[];
  correlationType: 'duplicate' | 'cascading' | 'related' | 'same_source';
  confidence: number; // 0-1
  createdAt: Date;
}

export interface AlertMetrics {
  timestamp: Date;
  totalAlerts: number;
  openAlerts: number;
  resolvedAlerts: number;
  acknowledgedAlerts: number;
  averageResolutionTime: number;
  escalationRate: number;
  falsePositiveRate: number;
  channelDeliveryRate: Record<string, number>;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  channel: string;
  subject: string;
  body: string;
  variables: string[];
  html?: string;
}

export class AlertManagementService {
  private alerts: Map<string, Alert> = new Map();
  private channels: Map<string, AlertChannel> = new Map();
  private escalationPolicies: Map<string, EscalationPolicy> = new Map();
  private onCallSchedules: Map<string, OnCallSchedule> = new Map();
  private correlations: Map<string, AlertCorrelation> = new Map();
  private templates: Map<string, NotificationTemplate> = new Map();
  private alertMetrics: AlertMetrics[] = [];
  
  private readonly MAX_ALERTS = 50000;
  private readonly ALERT_COOLDOWN = 5; // minutes
  private readonly WEBHOOK_SECRET = process.env.ALERT_WEBHOOK_SECRET || '';
  private readonly EMAIL_SERVICE_CONFIG = {
    smtpHost: process.env.SMTP_HOST || 'localhost',
    smtpPort: parseInt(process.env.SMTP_PORT || '587'),
    username: process.env.SMTP_USERNAME || '',
    password: process.env.SMTP_PASSWORD || '',
    fromAddress: process.env.ALERT_FROM_EMAIL || 'alerts@oracle-ledger.com'
  };

  constructor() {
    this.initializeDefaultChannels();
    this.initializeDefaultEscalationPolicies();
    this.initializeDefaultTemplates();
    this.initializeOnCallSchedules();
    this.startAlertProcessing();
  }

  /**
   * Initialize default notification channels
   */
  private initializeDefaultChannels(): void {
    const defaultChannels: AlertChannel[] = [
      {
        id: 'email-security',
        name: 'Security Team Email',
        type: 'email',
        enabled: true,
        config: {
          recipients: ['security@oracle-ledger.com'],
          ...this.EMAIL_SERVICE_CONFIG
        },
        filters: {
          severities: ['high', 'critical'],
          categories: ['security', 'threat_detection'],
          sources: ['security_monitoring']
        },
        cooldown: 2
      },
      {
        id: 'slack-security',
        name: 'Security Slack Channel',
        type: 'slack',
        enabled: true,
        config: {
          webhookUrl: process.env.SLACK_WEBHOOK_URL || '',
          channel: '#security-alerts',
          username: 'Oracle Ledger Security Bot'
        },
        filters: {
          severities: ['medium', 'high', 'critical'],
          categories: ['security', 'compliance'],
          sources: ['security_monitoring', 'compliance_monitoring']
        },
        cooldown: 1
      },
      {
        id: 'sms-critical',
        name: 'Critical SMS Alerts',
        type: 'sms',
        enabled: true,
        config: {
          provider: 'twilio',
          accountSid: process.env.TWILIO_ACCOUNT_SID || '',
          authToken: process.env.TWILIO_AUTH_TOKEN || '',
          fromNumber: process.env.TWILIO_PHONE_NUMBER || '',
          recipients: ['+1234567890', '+1987654321'] // Security on-call numbers
        },
        filters: {
          severities: ['critical'],
          categories: ['security', 'system'],
          sources: ['security_monitoring']
        },
        cooldown: 10
      },
      {
        id: 'webhook-pagerduty',
        name: 'PagerDuty Integration',
        type: 'pagerduty',
        enabled: true,
        config: {
          integrationKey: process.env.PAGERDUTY_INTEGRATION_KEY || '',
          serviceId: process.env.PAGERDUTY_SERVICE_ID || ''
        },
        filters: {
          severities: ['critical'],
          categories: ['security', 'system', 'infrastructure'],
          sources: ['security_monitoring', 'system_monitoring']
        },
        cooldown: 5
      },
      {
        id: 'in-app',
        name: 'In-App Notifications',
        type: 'in_app',
        enabled: true,
        config: {
          retentionDays: 30,
          maxPerUser: 100
        },
        filters: {
          severities: ['low', 'medium', 'high', 'critical'],
          categories: ['*'], // All categories
          sources: ['*'] // All sources
        },
        cooldown: 0
      }
    ];

    defaultChannels.forEach(channel => {
      this.channels.set(channel.id, channel);
    });
  }

  /**
   * Initialize default escalation policies
   */
  private initializeDefaultEscalationPolicies(): void {
    const defaultPolicies: EscalationPolicy[] = [
      {
        id: 'critical-escalation',
        name: 'Critical Alert Escalation',
        severity: 'critical',
        enabled: true,
        steps: [
          {
            order: 1,
            delay: 0,
            channels: ['sms-critical', 'slack-security'],
            recipients: ['security-primary'],
            actions: ['NOTIFY_PRIMARY', 'CREATE_INCIDENT']
          },
          {
            order: 2,
            delay: 15,
            channels: ['email-security'],
            recipients: ['security-team', 'management'],
            actions: ['ESCALATE_TO_TEAM', 'NOTIFY_MANAGEMENT']
          },
          {
            order: 3,
            delay: 30,
            channels: ['webhook-pagerduty'],
            recipients: ['on-call-engineer', 'incident-commander'],
            actions: ['PAGE_ON_CALL', 'ACTIVATE_INCIDENT_RESPONSE']
          }
        ]
      },
      {
        id: 'high-escalation',
        name: 'High Severity Alert Escalation',
        severity: 'high',
        enabled: true,
        steps: [
          {
            order: 1,
            delay: 0,
            channels: ['slack-security', 'in-app'],
            recipients: ['security-team'],
            actions: ['NOTIFY_TEAM']
          },
          {
            order: 2,
            delay: 60,
            channels: ['email-security'],
            recipients: ['security-manager'],
            actions: ['ESCALATE_TO_MANAGER']
          }
        ]
      },
      {
        id: 'medium-escalation',
        name: 'Medium Severity Alert Escalation',
        severity: 'medium',
        enabled: true,
        steps: [
          {
            order: 1,
            delay: 0,
            channels: ['in-app'],
            recipients: ['operations-team'],
            actions: ['NOTIFY_TEAM']
          },
          {
            order: 2,
            delay: 240,
            channels: ['email-security'],
            recipients: ['operations-manager'],
            actions: ['ESCALATE_IF_UNRESOLVED']
          }
        ]
      }
    ];

    defaultPolicies.forEach(policy => {
      this.escalationPolicies.set(policy.id, policy);
    });
  }

  /**
   * Initialize default notification templates
   */
  private initializeDefaultTemplates(): void {
    const defaultTemplates: NotificationTemplate[] = [
      {
        id: 'critical-security-email',
        name: 'Critical Security Alert Email',
        channel: 'email',
        subject: '🚨 CRITICAL SECURITY ALERT: {{title}}',
        body: `
SECURITY ALERT - CRITICAL

Title: {{title}}
Description: {{description}}
Severity: {{severity}}
Category: {{category}}
Source: {{source}}
Time: {{timestamp}}

Immediate action required.

Metadata:
{{#each metadata}}
- {{@key}}: {{this}}
{{/each}}

Oracle Ledger Security Team
        `,
        variables: ['title', 'description', 'severity', 'category', 'source', 'timestamp', 'metadata']
      },
      {
        id: 'slack-security-alert',
        name: 'Security Alert Slack Message',
        channel: 'slack',
        subject: '',
        body: `
🚨 *{{severity}} Security Alert*

*Title:* {{title}}
*Description:* {{description}}
*Category:* {{category}}
*Time:* {{timestamp}}

{{#if metadata}}
*Details:*
{{#each metadata}}
• {{@key}}: {{this}}
{{/each}}
{{/if}}

@channel Immediate attention required.
        `,
        variables: ['title', 'description', 'severity', 'category', 'timestamp', 'metadata']
      },
      {
        id: 'sms-critical',
        name: 'Critical SMS Alert',
        channel: 'sms',
        subject: '',
        body: 'CRITICAL ALERT: {{title}} - {{description}} - Immediate action required',
        variables: ['title', 'description']
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  /**
   * Initialize on-call schedules
   */
  private initializeOnCallSchedules(): void {
    const securitySchedule: OnCallSchedule = {
      id: 'security-primary',
      name: 'Security Team Primary On-Call',
      timezone: 'UTC',
      shifts: [
        {
          id: 'primary-day',
          startTime: '08:00',
          endTime: '20:00',
          daysOfWeek: [1, 2, 3, 4, 5], // Monday-Friday
          assignee: 'security-analyst-1',
          role: 'Primary Security Analyst'
        },
        {
          id: 'primary-night',
          startTime: '20:00',
          endTime: '08:00',
          daysOfWeek: [1, 2, 3, 4, 5], // Monday-Friday
          assignee: 'security-analyst-2',
          role: 'Night Security Analyst'
        },
        {
          id: 'weekend',
          startTime: '00:00',
          endTime: '23:59',
          daysOfWeek: [6, 0], // Saturday-Sunday
          assignee: 'security-oncall',
          role: 'Weekend Security On-Call'
        }
      ],
      rotations: [
        {
          id: 'weekly-rotation',
          schedule: 'weekly',
          primaryRotation: ['security-analyst-1', 'security-analyst-2'],
          backupRotation: ['security-manager'],
          autoRotation: true
        }
      ]
    };

    this.onCallSchedules.set(securitySchedule.id, securitySchedule);
  }

  /**
   * Start alert processing and escalation
   */
  private startAlertProcessing(): void {
    // Process alert escalations every minute
    setInterval(() => this.processEscalations(), 60000);
    
    // Clean up old alerts every hour
    setInterval(() => this.cleanupOldAlerts(), 3600000);
    
    // Calculate metrics every 5 minutes
    setInterval(() => this.calculateMetrics(), 300000);

    console.log('Alert management system started');
  }

  /**
   * Create new alert
   */
  async createAlert(alertData: {
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: string;
    source: string;
    metadata?: Record<string, any>;
    autoResolve?: boolean;
    tags?: string[];
    relatedEvents?: string[];
  }): Promise<string> {
    // Check for duplicate alerts
    const existingAlert = this.findDuplicateAlert(alertData);
    if (existingAlert) {
      await this.correlateAlerts(existingAlert.id, alertData);
      return existingAlert.id;
    }

    const alert: Alert = {
      id: this.generateAlertId(),
      ...alertData,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'open',
      metadata: alertData.metadata || {},
      tags: alertData.tags || [],
      escalationLevel: 0,
      autoResolve: alertData.autoResolve !== false,
      evidence: [],
      relatedEvents: alertData.relatedEvents || []
    };

    // Store alert
    this.alerts.set(alert.id, alert);
    
    // Maintain alert history size
    if (this.alerts.size > this.MAX_ALERTS) {
      const oldestId = this.alerts.keys().next().value;
      this.alerts.delete(oldestId);
    }

    // Send notifications
    await this.sendAlertNotifications(alert);

    // Start auto-resolution timer if applicable
    if (alert.autoResolve) {
      setTimeout(() => this.processAutoResolve(alert.id), 30 * 60 * 1000); // 30 minutes
    }

    // Start escalation timer
    this.startEscalationTimer(alert.id);

    console.log(`Alert created: ${alert.id} - ${alert.title}`);
    return alert.id;
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string, acknowledgedBy: string, notes?: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert not found: ${alertId}`);
    }

    if (alert.status !== 'open') {
      throw new Error(`Cannot acknowledge alert in status: ${alert.status}`);
    }

    alert.status = 'acknowledged';
    alert.assignedTo = acknowledgedBy;
    alert.updatedAt = new Date();

    if (notes) {
      alert.metadata.acknowledgmentNotes = notes;
      alert.metadata.acknowledgedBy = acknowledgedBy;
      alert.metadata.acknowledgedAt = new Date().toISOString();
    }

    // Stop escalation timer
    this.stopEscalationTimer(alertId);

    // Send acknowledgment notifications
    await this.sendAlertNotifications(alert, 'acknowledgment');

    console.log(`Alert acknowledged: ${alertId} by ${acknowledgedBy}`);
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId: string, resolvedBy: string, resolution?: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert not found: ${alertId}`);
    }

    alert.status = 'resolved';
    alert.resolvedAt = new Date();
    alert.updatedAt = new Date();
    alert.resolution = resolution || 'Resolved';

    if (resolution) {
      alert.metadata.resolution = resolution;
      alert.metadata.resolvedBy = resolvedBy;
      alert.metadata.resolvedAt = new Date().toISOString();
    }

    // Stop escalation timer
    this.stopEscalationTimer(alertId);

    // Send resolution notifications
    await this.sendAlertNotifications(alert, 'resolution');

    console.log(`Alert resolved: ${alertId} by ${resolvedBy}`);
  }

  /**
   * Escalate alert
   */
  async escalateAlert(alertId: string, escalationData: {
    reason: string;
    escalatedBy: string;
    targetLevel?: number;
    customChannels?: string[];
  }): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert not found: ${alertId}`);
    }

    alert.escalationLevel++;
    alert.updatedAt = new Date();

    if (escalationData.reason) {
      alert.metadata.escalationReason = escalationData.reason;
      alert.metadata.escalatedBy = escalationData.escalatedBy;
      alert.metadata.escalatedAt = new Date().toISOString();
    }

    // Get escalation policy for this severity
    const policy = this.escalationPolicies.get(`${alert.severity}-escalation`);
    if (policy && alert.escalationLevel <= policy.steps.length) {
      const escalationStep = policy.steps[alert.escalationLevel - 1];
      await this.executeEscalationStep(alert, escalationStep);
    }

    // Send escalation notifications
    await this.sendAlertNotifications(alert, 'escalation');

    console.log(`Alert escalated: ${alertId} to level ${alert.escalationLevel}`);
  }

  /**
   * Get alert by ID
   */
  getAlert(alertId: string): Alert | undefined {
    return this.alerts.get(alertId);
  }

  /**
   * Get alerts with filtering
   */
  getAlerts(filters?: {
    status?: string;
    severity?: string;
    category?: string;
    source?: string;
    assignedTo?: string;
    timeRange?: { start: Date; end: Date };
    limit?: number;
    offset?: number;
  }): Alert[] {
    let alerts = Array.from(this.alerts.values());

    if (filters) {
      if (filters.status) {
        alerts = alerts.filter(a => a.status === filters.status);
      }
      if (filters.severity) {
        alerts = alerts.filter(a => a.severity === filters.severity);
      }
      if (filters.category) {
        alerts = alerts.filter(a => a.category === filters.category);
      }
      if (filters.source) {
        alerts = alerts.filter(a => a.source === filters.source);
      }
      if (filters.assignedTo) {
        alerts = alerts.filter(a => a.assignedTo === filters.assignedTo);
      }
      if (filters.timeRange) {
        alerts = alerts.filter(a => 
          a.createdAt >= filters.timeRange!.start && 
          a.createdAt <= filters.timeRange!.end
        );
      }
    }

    // Sort by creation date (newest first)
    alerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.createdAt);

    // Apply pagination
    if (filters?.offset !== undefined || filters?.limit !== undefined) {
      const offset = filters.offset || 0;
      const limit = filters.limit || 50;
      alerts = alerts.slice(offset, offset + limit);
    }

    return alerts;
  }

  /**
   * Get alert metrics
   */
  getAlertMetrics(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): AlertMetrics | undefined {
    return this.alertMetrics[this.alertMetrics.length - 1];
  }

  /**
   * Create custom notification channel
   */
  async createChannel(channelData: Omit<AlertChannel, 'id'>): Promise<string> {
    const channel: AlertChannel = {
      id: this.generateChannelId(),
      ...channelData
    };

    this.channels.set(channel.id, channel);
    return channel.id;
  }

  /**
   * Update notification channel
   */
  async updateChannel(channelId: string, updates: Partial<AlertChannel>): Promise<void> {
    const channel = this.channels.get(channelId);
    if (!channel) {
      throw new Error(`Channel not found: ${channelId}`);
    }

    Object.assign(channel, updates);
  }

  /**
   * Send emergency notification
   */
  async sendEmergencyNotification(data: {
    title: string;
    description: string;
    ruleId?: string;
    events?: string[];
  }): Promise<void> {
    const emergencyAlert = await this.createAlert({
      title: `EMERGENCY: ${data.title}`,
      description: data.description,
      severity: 'critical',
      category: 'emergency',
      source: 'emergency_system',
      metadata: {
        ruleId: data.ruleId,
        relatedEvents: data.events,
        emergencyType: 'immediate_response_required'
      },
      autoResolve: false,
      tags: ['emergency', 'immediate_response']
    });

    // Force immediate delivery through all critical channels
    const criticalChannels = Array.from(this.channels.values())
      .filter(c => c.enabled && c.filters.severities.includes('critical'));

    for (const channel of criticalChannels) {
      await this.sendToChannel(channel, emergencyAlert, 'emergency');
    }

    console.log(`Emergency notification sent: ${emergencyAlert}`);
  }

  // ==============================
  // PRIVATE HELPER METHODS
  // ==============================

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateChannelId(): string {
    return `channel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private findDuplicateAlert(alertData: any): Alert | undefined {
    const recentAlerts = Array.from(this.alerts.values())
      .filter(alert => 
        alert.status === 'open' &&
        alert.title === alertData.title &&
        alert.category === alertData.category &&
        Math.abs(alert.createdAt.getTime() - Date.now()) < (this.ALERT_COOLDOWN * 60 * 1000)
      );

    return recentAlerts.length > 0 ? recentAlerts[0] : undefined;
  }

  private async correlateAlerts(existingAlertId: string, newAlertData: any): Promise<void> {
    const correlation: AlertCorrelation = {
      id: this.generateCorrelationId(),
      masterAlertId: existingAlertId,
      relatedAlertIds: [],
      correlationType: 'duplicate',
      confidence: 0.9,
      createdAt: new Date()
    };

    this.correlations.set(correlation.id, correlation);

    // Update existing alert metadata
    const existingAlert = this.alerts.get(existingAlertId);
    if (existingAlert) {
      existingAlert.relatedEvents.push(...(newAlertData.relatedEvents || []));
      existingAlert.metadata.duplicateCount = (existingAlert.metadata.duplicateCount || 0) + 1;
      existingAlert.updatedAt = new Date();
    }
  }

  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async sendAlertNotifications(alert: Alert, eventType: 'creation' | 'acknowledgment' | 'escalation' | 'resolution' = 'creation'): Promise<void> {
    const eligibleChannels = Array.from(this.channels.values())
      .filter(channel => 
        channel.enabled &&
        channel.filters.severities.includes(alert.severity) &&
        channel.filters.categories.includes(alert.category) &&
        this.checkCooldown(channel)
      );

    for (const channel of eligibleChannels) {
      try {
        await this.sendToChannel(channel, alert, eventType);
      } catch (error) {
        console.error(`Failed to send alert to channel ${channel.id}:`, error);
      }
    }
  }

  private checkCooldown(channel: AlertChannel): boolean {
    if (channel.cooldown === 0) return true;
    
    const lastSent = channel.lastSent;
    if (!lastSent) return true;

    const cooldownMs = channel.cooldown * 60 * 1000;
    return Date.now() - lastSent.getTime() > cooldownMs;
  }

  private async sendToChannel(channel: AlertChannel, alert: Alert, eventType: string): Promise<void> {
    switch (channel.type) {
      case 'email':
        await this.sendEmailNotification(channel, alert);
        break;
      case 'slack':
        await this.sendSlackNotification(channel, alert);
        break;
      case 'sms':
        await this.sendSMSNotification(channel, alert);
        break;
      case 'webhook':
        await this.sendWebhookNotification(channel, alert);
        break;
      case 'pagerduty':
        await this.sendPagerDutyNotification(channel, alert);
        break;
      case 'in_app':
        await this.sendInAppNotification(channel, alert);
        break;
    }

    channel.lastSent = new Date();
  }

  private async sendEmailNotification(channel: AlertChannel, alert: Alert): Promise<void> {
    // In production, would use actual email service (SendGrid, AWS SES, etc.)
    console.log(`Sending email alert ${alert.id} to ${channel.config.recipients.join(', ')}`);
    
    // Mock email sending
    const emailData = {
      to: channel.config.recipients,
      from: channel.config.fromAddress || this.EMAIL_SERVICE_CONFIG.fromAddress,
      subject: this.replaceTemplateVariables(channel.config.subject || '{{title}}', alert),
      body: this.replaceTemplateVariables(channel.config.body || alert.description, alert),
      html: this.generateHTMLContent(alert)
    };

    console.log('Email sent:', emailData);
  }

  private async sendSlackNotification(channel: AlertChannel, alert: Alert): Promise<void> {
    // In production, would use actual Slack API
    console.log(`Sending Slack alert ${alert.id} to ${channel.config.channel}`);
    
    const slackMessage = {
      channel: channel.config.channel,
      username: channel.config.username || 'Oracle Ledger Alert Bot',
      text: this.replaceTemplateVariables(channel.config.body, alert),
      attachments: [
        {
          color: this.getSeverityColor(alert.severity),
          title: alert.title,
          text: alert.description,
          fields: [
            { title: 'Severity', value: alert.severity, short: true },
            { title: 'Category', value: alert.category, short: true },
            { title: 'Source', value: alert.source, short: true },
            { title: 'Time', value: alert.createdAt.toISOString(), short: true }
          ]
        }
      ]
    };

    console.log('Slack message sent:', slackMessage);
  }

  private async sendSMSNotification(channel: AlertChannel, alert: Alert): Promise<void> {
    // In production, would use actual SMS service (Twilio, AWS SNS, etc.)
    console.log(`Sending SMS alert ${alert.id} to ${channel.config.recipients.join(', ')}`);
    
    const smsData = {
      to: channel.config.recipients,
      from: channel.config.fromNumber,
      body: this.replaceTemplateVariables(channel.config.body, alert)
    };

    console.log('SMS sent:', smsData);
  }

  private async sendWebhookNotification(channel: AlertChannel, alert: Alert): Promise<void> {
    // In production, would make actual HTTP request to webhook
    console.log(`Sending webhook alert ${alert.id} to ${channel.config.webhookUrl}`);
    
    const webhookData = {
      alert: alert,
      channel: channel.id,
      timestamp: new Date().toISOString()
    };

    console.log('Webhook sent:', webhookData);
  }

  private async sendPagerDutyNotification(channel: AlertChannel, alert: Alert): Promise<void> {
    // In production, would use actual PagerDuty API
    console.log(`Sending PagerDuty alert ${alert.id} to service ${channel.config.serviceId}`);
    
    const pagerDutyData = {
      routing_key: channel.config.integrationKey,
      event_action: 'trigger',
      dedup_key: alert.id,
      payload: {
        summary: alert.title,
        source: alert.source,
        severity: this.mapSeverityToPagerDuty(alert.severity),
        custom_details: alert.metadata
      }
    };

    console.log('PagerDuty event sent:', pagerDutyData);
  }

  private async sendInAppNotification(channel: AlertChannel, alert: Alert): Promise<void> {
    // In production, would store in database and push to connected clients
    console.log(`Sending in-app notification ${alert.id}`);
    
    const notification = {
      id: this.generateNotificationId(),
      alertId: alert.id,
      userId: 'current_user', // Would be determined based on channel config
      title: alert.title,
      message: alert.description,
      severity: alert.severity,
      timestamp: new Date(),
      read: false
    };

    console.log('In-app notification sent:', notification);
  }

  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private replaceTemplateVariables(template: string, alert: Alert): string {
    let result = template;
    
    // Replace basic variables
    result = result.replace(/\{\{title\}\}/g, alert.title);
    result = result.replace(/\{\{description\}\}/g, alert.description);
    result = result.replace(/\{\{severity\}\}/g, alert.severity);
    result = result.replace(/\{\{category\}\}/g, alert.category);
    result = result.replace(/\{\{source\}\}/g, alert.source);
    result = result.replace(/\{\{timestamp\}\}/g, alert.createdAt.toISOString());

    // Replace metadata variables
    Object.entries(alert.metadata).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, String(value));
    });

    return result;
  }

  private generateHTMLContent(alert: Alert): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${this.getSeverityColor(alert.severity)};">${alert.title}</h2>
        <p><strong>Severity:</strong> <span style="color: ${this.getSeverityColor(alert.severity)};">${alert.severity.toUpperCase()}</span></p>
        <p><strong>Category:</strong> ${alert.category}</p>
        <p><strong>Source:</strong> ${alert.source}</p>
        <p><strong>Time:</strong> ${alert.createdAt.toISOString()}</p>
        <p><strong>Description:</strong></p>
        <div style="background-color: #f5f5f5; padding: 10px; border-left: 4px solid ${this.getSeverityColor(alert.severity)};">
          ${alert.description}
        </div>
      </div>
    `;
  }

  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#d97706';
      case 'low': return '#16a34a';
      default: return '#6b7280';
    }
  }

  private mapSeverityToPagerDuty(severity: string): string {
    switch (severity) {
      case 'critical': return 'critical';
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'info';
    }
  }

  private startEscalationTimer(alertId: string): void {
    // Implementation would start escalation timer
    // For now, just log the timer start
    console.log(`Started escalation timer for alert: ${alertId}`);
  }

  private stopEscalationTimer(alertId: string): void {
    // Implementation would stop escalation timer
    console.log(`Stopped escalation timer for alert: ${alertId}`);
  }

  private async processEscalations(): Promise<void> {
    const openAlerts = Array.from(this.alerts.values())
      .filter(alert => alert.status === 'open' || alert.status === 'acknowledged');

    for (const alert of openAlerts) {
      const policy = this.escalationPolicies.get(`${alert.severity}-escalation`);
      if (!policy || alert.escalationLevel >= policy.steps.length) continue;

      const nextStep = policy.steps[alert.escalationLevel];
      const escalationDelay = nextStep.delay * 60 * 1000; // Convert to milliseconds
      const timeSinceLastUpdate = Date.now() - alert.updatedAt.getTime();

      if (timeSinceLastUpdate >= escalationDelay) {
        await this.escalateAlert(alert.id, {
          reason: `Scheduled escalation to level ${alert.escalationLevel + 1}`,
          escalatedBy: 'alert_system'
        });
      }
    }
  }

  private async executeEscalationStep(alert: Alert, step: EscalationStep): Promise<void> {
    for (const channelId of step.channels) {
      const channel = this.channels.get(channelId);
      if (channel && channel.enabled) {
        await this.sendToChannel(channel, alert, 'escalation');
      }
    }

    // Execute actions
    for (const action of step.actions) {
      await this.executeEscalationAction(alert, action, step);
    }
  }

  private async executeEscalationAction(alert: Alert, action: string, step: EscalationStep): Promise<void> {
    switch (action) {
      case 'NOTIFY_PRIMARY':
        console.log(`Notifying primary responder for alert ${alert.id}`);
        break;
      case 'CREATE_INCIDENT':
        console.log(`Creating incident for alert ${alert.id}`);
        break;
      case 'ESCALATE_TO_TEAM':
        console.log(`Escalating to team for alert ${alert.id}`);
        break;
      case 'PAGE_ON_CALL':
        console.log(`Paging on-call for alert ${alert.id}`);
        break;
      default:
        console.log(`Unknown escalation action: ${action}`);
    }
  }

  private async processAutoResolve(alertId: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.status !== 'open') return;

    // Check if alert conditions are still met
    // For now, auto-resolve if no new related events in 30 minutes
    const timeSinceUpdate = Date.now() - alert.updatedAt.getTime();
    if (timeSinceUpdate > 30 * 60 * 1000) {
      await this.resolveAlert(alertId, 'alert_system', 'Auto-resolved after timeout');
      console.log(`Auto-resolved alert: ${alertId}`);
    }
  }

  private cleanupOldAlerts(): void {
    const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days
    
    const oldAlertIds = Array.from(this.alerts.entries())
      .filter(([_, alert]) => alert.resolvedAt && alert.resolvedAt.getTime() < cutoff)
      .map(([id]) => id);

    for (const id of oldAlertIds) {
      this.alerts.delete(id);
    }

    console.log(`Cleaned up ${oldAlertIds.length} old resolved alerts`);
  }

  private calculateMetrics(): void {
    const now = new Date();
    const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours
    
    const recentAlerts = Array.from(this.alerts.values())
      .filter(alert => alert.createdAt >= cutoff);

    const metrics: AlertMetrics = {
      timestamp: now,
      totalAlerts: recentAlerts.length,
      openAlerts: recentAlerts.filter(a => a.status === 'open' || a.status === 'acknowledged').length,
      resolvedAlerts: recentAlerts.filter(a => a.status === 'resolved' || a.status === 'closed').length,
      acknowledgedAlerts: recentAlerts.filter(a => a.status === 'acknowledged').length,
      averageResolutionTime: this.calculateAverageResolutionTime(recentAlerts),
      escalationRate: this.calculateEscalationRate(recentAlerts),
      falsePositiveRate: this.calculateFalsePositiveRate(recentAlerts),
      channelDeliveryRate: this.calculateChannelDeliveryRates()
    };

    this.alertMetrics.push(metrics);
    
    // Maintain metrics history
    if (this.alertMetrics.length > 1000) {
      this.alertMetrics.shift();
    }
  }

  private calculateAverageResolutionTime(alerts: Alert[]): number {
    const resolvedAlerts = alerts.filter(a => a.resolvedAt);
    if (resolvedAlerts.length === 0) return 0;

    const totalTime = resolvedAlerts.reduce((sum, alert) => {
      return sum + (alert.resolvedAt!.getTime() - alert.createdAt.getTime());
    }, 0);

    return totalTime / resolvedAlerts.length / (1000 * 60 * 60); // Return in hours
  }

  private calculateEscalationRate(alerts: Alert[]): number {
    const escalatedAlerts = alerts.filter(a => a.escalationLevel > 0);
    return alerts.length > 0 ? (escalatedAlerts.length / alerts.length) * 100 : 0;
  }

  private calculateFalsePositiveRate(alerts: Alert[]): number {
    // Mock calculation - in production would track user feedback
    const resolvedAlerts = alerts.filter(a => a.status === 'resolved');
    const potentialFalsePositives = resolvedAlerts.filter(a => 
      a.metadata.falsePositive === true || 
      (a.resolution && a.resolution.toLowerCase().includes('false positive'))
    );
    
    return resolvedAlerts.length > 0 ? (potentialFalsePositives.length / resolvedAlerts.length) * 100 : 0;
  }

  private calculateChannelDeliveryRates(): Record<string, number> {
    const rates: Record<string, number> = {};
    
    for (const [id, channel] of this.channels.entries()) {
      // Mock calculation - in production would track actual delivery success
      rates[id] = Math.random() * 100; // 0-100% success rate
    }

    return rates;
  }

  private async getAPIUsageStats(): Promise<Record<string, any>> {
    // Mock implementation
    return {
      totalRequests: 10000,
      blockedRequests: 150,
      errorRate: 2.5,
      averageResponseTime: 150
    };
  }
}

// Export singleton instance
export const alertManagementService = new AlertManagementService();/**
 * Alert Management Service Interface
 */

export interface AlertChannel {
  id: string;
  type: 'EMAIL' | 'SMS' | 'WEBHOOK' | 'SLACK' | 'TEAMS';
  configuration: Record<string, any>;
  active: boolean;
}

export interface AlertTemplate {
  id: string;
  name: string;
  channel: AlertChannel['type'];
  subject: string;
  body: string;
  variables: string[];
}

export interface AlertDelivery {
  id: string;
  alertId: string;
  channelId: string;
  recipient: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
  sentAt?: Date;
  deliveredAt?: Date;
  error?: string;
  retryCount: number;
}

export class AlertManagementService {
  private channels: Map<string, AlertChannel> = new Map();
  private templates: Map<string, AlertTemplate> = new Map();
  private deliveries: AlertDelivery[] = [];

  constructor() {
    this.initializeDefaultChannels();
    this.initializeDefaultTemplates();
  }

  private initializeDefaultChannels() {
    const emailChannel: AlertChannel = {
      id: 'email_primary',
      type: 'EMAIL',
      configuration: {
        smtpServer: 'smtp.company.com',
        port: 587,
        username: 'alerts@company.com'
      },
      active: true
    };

    const slackChannel: AlertChannel = {
      id: 'slack_security',
      type: 'SLACK',
      configuration: {
        webhookUrl: 'https://hooks.slack.com/...',
        channel: '#security-alerts'
      },
      active: true
    };

    this.channels.set(emailChannel.id, emailChannel);
    this.channels.set(slackChannel.id, slackChannel);
  }

  private initializeDefaultTemplates() {
    const securityAlertTemplate: AlertTemplate = {
      id: 'security_alert',
      name: 'Security Alert',
      channel: 'EMAIL',
      subject: 'Security Alert: {{severity}} - {{eventType}}',
      body: `
        Security Alert Details:
        - Event Type: {{eventType}}
        - Severity: {{severity}}
        - Timestamp: {{timestamp}}
        - Description: {{description}}
        
        Please review and take appropriate action.
      `,
      variables: ['eventType', 'severity', 'timestamp', 'description']
    };

    this.templates.set(securityAlertTemplate.id, securityAlertTemplate);
  }

  async sendAlert(templateId: string, data: Record<string, any>, recipients: string[]): Promise<string[]> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const activeChannels = Array.from(this.channels.values())
      .filter(channel => channel.active && channel.type === template.channel);

    const deliveryIds: string[] = [];

    for (const channel of activeChannels) {
      for (const recipient of recipients) {
        const delivery = await this.deliverAlert(template, data, recipient, channel);
        deliveryIds.push(delivery.id);
      }
    }

    return deliveryIds;
  }

  private async deliverAlert(template: AlertTemplate, data: Record<string, any>, 
                           recipient: string, channel: AlertChannel): Promise<AlertDelivery> {
    const delivery: AlertDelivery = {
      id: `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      alertId: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      channelId: channel.id,
      recipient,
      status: 'PENDING',
      sentAt: new Date(),
      retryCount: 0
    };

    // Simulate alert delivery
    try {
      await this.simulateDelivery(channel, template, data, recipient);
      delivery.status = 'DELIVERED';
      delivery.deliveredAt = new Date();
    } catch (error) {
      delivery.status = 'FAILED';
      delivery.error = error.message;
    }

    this.deliveries.push(delivery);
    return delivery;
  }

  private async simulateDelivery(channel: AlertChannel, template: AlertTemplate, 
                                data: Record<string, any>, recipient: string): Promise<void> {
    // Mock delivery simulation
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 100));

    // Simulate occasional failures
    if (Math.random() < 0.05) { // 5% failure rate
      throw new Error('Delivery failed');
    }
  }

  async getDeliveryStatus(deliveryId: string): Promise<AlertDelivery | null> {
    return this.deliveries.find(d => d.id === deliveryId) || null;
  }

  async getMetrics(): Promise<any> {
    const total = this.deliveries.length;
    const delivered = this.deliveries.filter(d => d.status === 'DELIVERED').length;
    const failed = this.deliveries.filter(d => d.status === 'FAILED').length;
    
    return {
      totalDeliveries: total,
      delivered,
      failed,
      successRate: total > 0 ? (delivered / total) * 100 : 0,
      averageDeliveryTime: this.calculateAverageDeliveryTime(),
      activeChannels: Array.from(this.channels.values()).filter(c => c.active).length
    };
  }

  private calculateAverageDeliveryTime(): number {
    const completed = this.deliveries.filter(d => d.deliveredAt);
    if (completed.length === 0) return 0;

    const totalTime = completed.reduce((sum, delivery) => {
      return sum + (delivery.deliveredAt!.getTime() - delivery.sentAt!.getTime());
    }, 0);

    return totalTime / completed.length;
  }

  async retryFailedDelivery(deliveryId: string): Promise<boolean> {
    const delivery = this.deliveries.find(d => d.id === deliveryId);
    if (!delivery || delivery.status !== 'FAILED') {
      return false;
    }

    const channel = this.channels.get(delivery.channelId);
    if (!channel) {
      return false;
    }

    delivery.retryCount++;
    delivery.status = 'PENDING';

    try {
      await this.simulateDelivery(channel, this.templates.get('security_alert')!, {}, delivery.recipient);
      delivery.status = 'DELIVERED';
      delivery.deliveredAt = new Date();
      return true;
    } catch (error) {
      delivery.status = 'FAILED';
      delivery.error = error.message;
      return false;
    }
  }

  async createCustomAlert(templateId: string, recipients: string[], customData: Record<string, any>): Promise<string[]> {
    return this.sendAlert(templateId, customData, recipients);
  }

  async getAllDeliveries(timeframe?: { start: Date; end: Date }): Promise<AlertDelivery[]> {
    let deliveries = this.deliveries;
    
    if (timeframe) {
      deliveries = deliveries.filter(d => 
        d.sentAt >= timeframe.start && d.sentAt <= timeframe.end
      );
    }

    return deliveries;
  }
}

export const alertManagementService = new AlertManagementService();