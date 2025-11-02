/**
 * Regulatory Management Service
 * 
 * Manages regulatory requirements, compliance tracking, and regulatory change management
 * for ORACLE-LEDGER compliance dashboard integration with Stripe.
 * 
 * Features:
 * - Regulatory requirement tracking across multiple jurisdictions
 * - Regulatory change management and impact assessment
 * - Compliance deadline monitoring
 * - Regulatory calendar management
 * - Compliance gap identification and remediation tracking
 * - Regulatory reporting and documentation
 */

import { complianceHealthService } from './complianceHealthService';

// Types and Interfaces
export interface RegulatoryRequirement {
  id: string;
  code: string;
  title: string;
  description: string;
  jurisdiction: string; // EU, US, UK, Global, etc.
  category: string; // Payment Processing, Data Protection, Financial Reporting, etc.
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Active' | 'Pending' | 'Deprecated' | 'Under Review';
  effectiveDate: string;
  lastUpdated: string;
  nextReviewDate: string;
  complianceLevel: number; // 0-100 percentage
  requirements: RegulatorySubRequirement[];
  documentation: RegulatoryDocument[];
  tags: string[];
  relatedRequirements: string[];
  authority: string; // Regulatory body
}

export interface RegulatorySubRequirement {
  id: string;
  requirementId: string;
  title: string;
  description: string;
  type: 'Documentation' | 'Process' | 'Technical' | 'Administrative';
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Non-Compliant';
  assignedTo?: string;
  dueDate?: string;
  completionDate?: string;
  evidence: RegulatoryEvidence[];
  dependencies: string[];
}

export interface RegulatoryDocument {
  id: string;
  requirementId: string;
  title: string;
  type: 'Policy' | 'Procedure' | 'Evidence' | 'Guidance' | 'Template';
  url?: string;
  version: string;
  status: 'Draft' | 'Review' | 'Approved' | 'Archived';
  lastModified: string;
  modifiedBy: string;
  description?: string;
}

export interface RegulatoryEvidence {
  id: string;
  requirementId: string;
  subRequirementId?: string;
  title: string;
  type: 'Document' | 'Record' | 'Audit' | 'Configuration' | 'Process';
  source: string;
  status: 'Pending' | 'Verified' | 'Expired' | 'Invalid';
  uploadDate: string;
  expiryDate?: string;
  verificationDate?: string;
  verifiedBy?: string;
  description?: string;
  tags: string[];
}

export interface RegulatoryChange {
  id: string;
  requirementId?: string;
  changeType: 'New' | 'Amendment' | 'Repeal' | 'Clarification';
  title: string;
  description: string;
  impactLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  affectedRequirements: string[];
  announcementDate: string;
  effectiveDate: string;
  complianceDeadline?: string;
  status: 'Proposed' | 'Published' | 'Implemented' | 'Reviewed';
  impactAssessment: ChangeImpactAssessment;
  actionRequired: RegulatoryAction[];
  relatedDocuments: string[];
  source: string;
  jurisdiction: string;
}

export interface ChangeImpactAssessment {
  overallImpact: 'Critical' | 'High' | 'Medium' | 'Low';
  businessImpact: string;
  technicalImpact: string;
  resourceRequirements: {
    people: number;
    time: string;
    cost: string;
  };
  riskFactors: string[];
  implementationComplexity: 'Very High' | 'High' | 'Medium' | 'Low';
  timelineFeasibility: 'Very Low' | 'Low' | 'Medium' | 'High';
  dependencies: string[];
  recommendations: string[];
}

export interface RegulatoryAction {
  id: string;
  changeId: string;
  title: string;
  description: string;
  type: 'Policy Update' | 'Process Change' | 'Technical Implementation' | 'Training' | 'Documentation';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'In Progress' | 'Completed' | 'Blocked';
  assignedTo?: string;
  dueDate: string;
  completedDate?: string;
  dependencies: string[];
  estimatedEffort: string;
  actualEffort?: string;
  evidence: RegulatoryEvidence[];
  notes?: string;
}

export interface ComplianceGap {
  id: string;
  requirementId: string;
  title: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Accepted';
  identifiedDate: string;
  targetResolutionDate: string;
  actualResolutionDate?: string;
  assignedTo?: string;
  remediationSteps: string[];
  evidence: RegulatoryEvidence[];
  riskLevel: number;
  businessImpact: string;
  dependencies: string[];
  relatedGaps: string[];
}

export interface RegulatoryReportingPeriod {
  id: string;
  name: string;
  type: 'Monthly' | 'Quarterly' | 'Annually' | 'Ad-hoc';
  startDate: string;
  endDate: string;
  reportingDeadline: string;
  status: 'Planning' | 'In Progress' | 'Submitted' | 'Accepted' | 'Rejected';
  submittedDate?: string;
  acceptedDate?: string;
  requirements: string[];
  evidenceFiles: string[];
  notes?: string;
}

// Service Class
export class RegulatoryManagementService {
  private requirements: RegulatoryRequirement[] = [];
  private changes: RegulatoryChange[] = [];
  private gaps: ComplianceGap[] = [];
  private reportingPeriods: RegulatoryReportingPeriod[] = [];

  constructor() {
    this.initializeMockData();
  }

  /**
   * Initialize mock data for development and demonstration
   */
  private initializeMockData(): void {
    // Mock regulatory requirements
    this.requirements = [
      {
        id: 'req-pci-dss-4.0',
        code: 'PCI-DSS v4.0',
        title: 'Payment Card Industry Data Security Standard',
        description: 'Requirements for organizations that handle credit card information',
        jurisdiction: 'Global',
        category: 'Payment Processing',
        priority: 'Critical',
        status: 'Active',
        effectiveDate: '2022-03-31',
        lastUpdated: '2024-10-15',
        nextReviewDate: '2025-03-31',
        complianceLevel: 94.2,
        requirements: [
          {
            id: 'sub-req-pci-1',
            requirementId: 'req-pci-dss-4.0',
            title: 'Install and maintain firewall configuration',
            description: 'Firewall rules must restrict connections between untrusted networks and any system component in the cardholder data environment',
            type: 'Technical',
            status: 'Completed',
            dueDate: '2024-09-30',
            completionDate: '2024-09-25',
            evidence: [],
            dependencies: []
          }
        ],
        documentation: [],
        tags: ['PCI', 'Payment Security', 'Cardholder Data'],
        relatedRequirements: ['req-gdpr-32'],
        authority: 'PCI Security Standards Council'
      },
      {
        id: 'req-gdpr-32',
        code: 'GDPR Art. 32',
        title: 'Security of processing',
        description: 'Taking into account the state of the art, the costs of implementation and the nature, scope, context and purposes of processing as well as the risk of varying likelihood and severity for the rights and freedoms of natural persons, the controller and the processor shall implement appropriate technical and organisational measures to ensure a level of security appropriate to the risk',
        jurisdiction: 'EU',
        category: 'Data Protection',
        priority: 'Critical',
        status: 'Active',
        effectiveDate: '2018-05-25',
        lastUpdated: '2024-11-01',
        nextReviewDate: '2025-05-25',
        complianceLevel: 87.5,
        requirements: [
          {
            id: 'sub-req-gdpr-1',
            requirementId: 'req-gdpr-32',
            title: 'Implement encryption of personal data',
            description: 'Personal data should be encrypted both at rest and in transit',
            type: 'Technical',
            status: 'In Progress',
            assignedTo: 'security-team',
            dueDate: '2024-12-31',
            evidence: [],
            dependencies: []
          }
        ],
        documentation: [],
        tags: ['GDPR', 'Data Protection', 'Encryption'],
        relatedRequirements: ['req-pci-dss-4.0'],
        authority: 'European Data Protection Board'
      },
      {
        id: 'req-ccpa-1798.100',
        code: 'CCPA §1798.100',
        title: 'Consumer right to know about personal information collected',
        description: 'A consumer shall have the right to request that a business that collects personal information about the consumer disclose to the consumer the categories and specific pieces of personal information it has collected',
        jurisdiction: 'US-CA',
        category: 'Data Protection',
        priority: 'High',
        status: 'Active',
        effectiveDate: '2020-01-01',
        lastUpdated: '2024-09-20',
        nextReviewDate: '2025-01-01',
        complianceLevel: 91.3,
        requirements: [
          {
            id: 'sub-req-ccpa-1',
            requirementId: 'req-ccpa-1798.100',
            title: 'Implement data discovery and cataloging',
            description: 'System to identify and catalog all personal information collected',
            type: 'Process',
            status: 'Completed',
            dueDate: '2024-08-31',
            completionDate: '2024-08-28',
            evidence: [],
            dependencies: []
          }
        ],
        documentation: [],
        tags: ['CCPA', 'California', 'Consumer Rights'],
        relatedRequirements: ['req-gdpr-32'],
        authority: 'California Attorney General'
      }
    ];

    // Mock regulatory changes
    this.changes = [
      {
        id: 'change-pci-dss-4.1',
        changeType: 'Amendment',
        title: 'PCI DSS v4.1 Additional Requirements',
        description: 'Additional requirements for e-commerce and cloud environments',
        impactLevel: 'High',
        affectedRequirements: ['req-pci-dss-4.0'],
        announcementDate: '2024-10-01',
        effectiveDate: '2025-03-31',
        complianceDeadline: '2025-03-31',
        status: 'Implemented',
        impactAssessment: {
          overallImpact: 'High',
          businessImpact: 'Requires updates to e-commerce payment processing and cloud infrastructure',
          technicalImpact: 'Additional encryption and tokenization requirements',
          resourceRequirements: {
            people: 3,
            time: '6 months',
            cost: '$150,000'
          },
          riskFactors: ['Payment processing disruption', 'Technical debt accumulation'],
          implementationComplexity: 'Medium',
          timelineFeasibility: 'High',
          dependencies: ['Cloud security upgrade', 'Payment gateway updates'],
          recommendations: ['Phased implementation approach', 'Comprehensive testing protocol']
        },
        actionRequired: [],
        relatedDocuments: ['pci-dss-4.1-guidance.pdf'],
        source: 'PCI Security Standards Council',
        jurisdiction: 'Global'
      }
    ];

    // Mock compliance gaps
    this.gaps = [
      {
        id: 'gap-001',
        requirementId: 'req-gdpr-32',
        title: 'Incomplete encryption for data in transit',
        description: 'Some legacy API endpoints do not implement TLS 1.3',
        severity: 'Medium',
        status: 'In Progress',
        identifiedDate: '2024-10-15',
        targetResolutionDate: '2024-12-15',
        assignedTo: 'api-team',
        remediationSteps: [
          'Audit all API endpoints for TLS configuration',
          'Update legacy endpoints to support TLS 1.3',
          'Implement certificate rotation automation'
        ],
        evidence: [],
        riskLevel: 6.5,
        businessImpact: 'Potential GDPR compliance violation and data exposure risk',
        dependencies: ['Certificate infrastructure upgrade'],
        relatedGaps: []
      }
    ];

    // Mock reporting periods
    this.reportingPeriods = [
      {
        id: 'period-q4-2024',
        name: 'Q4 2024 Regulatory Compliance Report',
        type: 'Quarterly',
        startDate: '2024-10-01',
        endDate: '2024-12-31',
        reportingDeadline: '2025-01-31',
        status: 'Planning',
        requirements: ['req-pci-dss-4.0', 'req-gdpr-32', 'req-ccpa-1798.100'],
        evidenceFiles: ['pci-audit-q4-2024.pdf', 'gdpr-compliance-report.pdf'],
        notes: 'Quarterly compliance assessment for PCI DSS and data protection regulations'
      }
    ];
  }

  /**
   * Get all regulatory requirements with filtering and pagination
   */
  async getRequirements(options?: {
    jurisdiction?: string;
    category?: string;
    priority?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    requirements: RegulatoryRequirement[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    let filteredRequirements = [...this.requirements];

    // Apply filters
    if (options?.jurisdiction) {
      filteredRequirements = filteredRequirements.filter(req => 
        req.jurisdiction.toLowerCase().includes(options.jurisdiction!.toLowerCase())
      );
    }

    if (options?.category) {
      filteredRequirements = filteredRequirements.filter(req => 
        req.category.toLowerCase().includes(options.category!.toLowerCase())
      );
    }

    if (options?.priority) {
      filteredRequirements = filteredRequirements.filter(req => req.priority === options.priority);
    }

    if (options?.status) {
      filteredRequirements = filteredRequirements.filter(req => req.status === options.status);
    }

    if (options?.search) {
      const searchLower = options.search.toLowerCase();
      filteredRequirements = filteredRequirements.filter(req =>
        req.title.toLowerCase().includes(searchLower) ||
        req.description.toLowerCase().includes(searchLower) ||
        req.code.toLowerCase().includes(searchLower)
      );
    }

    // Pagination
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedRequirements = filteredRequirements.slice(startIndex, endIndex);

    return {
      requirements: paginatedRequirements,
      total: filteredRequirements.length,
      page,
      totalPages: Math.ceil(filteredRequirements.length / limit)
    };
  }

  /**
   * Get regulatory requirement by ID
   */
  async getRequirementById(id: string): Promise<RegulatoryRequirement | null> {
    return this.requirements.find(req => req.id === id) || null;
  }

  /**
   * Create new regulatory requirement
   */
  async createRequirement(requirement: Omit<RegulatoryRequirement, 'id'>): Promise<RegulatoryRequirement> {
    const newRequirement: RegulatoryRequirement = {
      ...requirement,
      id: this.generateId('req')
    };
    
    this.requirements.push(newRequirement);
    return newRequirement;
  }

  /**
   * Update regulatory requirement
   */
  async updateRequirement(id: string, updates: Partial<RegulatoryRequirement>): Promise<RegulatoryRequirement | null> {
    const index = this.requirements.findIndex(req => req.id === id);
    if (index === -1) return null;

    this.requirements[index] = {
      ...this.requirements[index],
      ...updates,
      lastUpdated: new Date().toISOString()
    };

    return this.requirements[index];
  }

  /**
   * Get regulatory changes with filtering
   */
  async getChanges(options?: {
    status?: string;
    impactLevel?: string;
    jurisdiction?: string;
    changeType?: string;
  }): Promise<RegulatoryChange[]> {
    let filteredChanges = [...this.changes];

    if (options?.status) {
      filteredChanges = filteredChanges.filter(change => change.status === options.status);
    }

    if (options?.impactLevel) {
      filteredChanges = filteredChanges.filter(change => change.impactLevel === options.impactLevel);
    }

    if (options?.jurisdiction) {
      filteredChanges = filteredChanges.filter(change => change.jurisdiction === options.jurisdiction);
    }

    if (options?.changeType) {
      filteredChanges = filteredChanges.filter(change => change.changeType === options.changeType);
    }

    return filteredChanges.sort((a, b) => 
      new Date(b.announcementDate).getTime() - new Date(a.announcementDate).getTime()
    );
  }

  /**
   * Assess impact of regulatory change
   */
  async assessChangeImpact(change: RegulatoryChange): Promise<ChangeImpactAssessment> {
    const impactedRequirements = this.requirements.filter(req => 
      change.affectedRequirements.includes(req.id)
    );

    const avgComplianceLevel = impactedRequirements.reduce((sum, req) => sum + req.complianceLevel, 0) / impactedRequirements.length;
    
    let overallImpact: ChangeImpactAssessment['overallImpact'];
    let implementationComplexity: ChangeImpactAssessment['implementationComplexity'];
    let timelineFeasibility: ChangeImpactAssessment['timelineFeasibility'];

    if (avgComplianceLevel < 60 || change.impactLevel === 'Critical') {
      overallImpact = 'Critical';
      implementationComplexity = 'Very High';
      timelineFeasibility = 'Very Low';
    } else if (avgComplianceLevel < 80 || change.impactLevel === 'High') {
      overallImpact = 'High';
      implementationComplexity = 'High';
      timelineFeasibility = 'Low';
    } else if (avgComplianceLevel < 90 || change.impactLevel === 'Medium') {
      overallImpact = 'Medium';
      implementationComplexity = 'Medium';
      timelineFeasibility = 'Medium';
    } else {
      overallImpact = 'Low';
      implementationComplexity = 'Low';
      timelineFeasibility = 'High';
    }

    return {
      overallImpact,
      businessImpact: `Affects ${impactedRequirements.length} regulatory requirements with average compliance level of ${avgComplianceLevel.toFixed(1)}%`,
      technicalImpact: 'Requires technical implementation across multiple system components',
      resourceRequirements: {
        people: Math.max(1, Math.ceil(impactedRequirements.length / 3)),
        time: change.impactLevel === 'Critical' ? '12 months' : change.impactLevel === 'High' ? '6 months' : '3 months',
        cost: change.impactLevel === 'Critical' ? '$500,000' : change.impactLevel === 'High' ? '$250,000' : '$100,000'
      },
      riskFactors: ['Implementation delays', 'Compliance gaps', 'Business disruption'],
      implementationComplexity,
      timelineFeasibility,
      dependencies: ['Infrastructure upgrades', 'Process documentation', 'Staff training'],
      recommendations: [
        'Conduct thorough impact assessment',
        'Develop implementation roadmap',
        'Engage stakeholders early',
        'Plan for contingencies'
      ]
    };
  }

  /**
   * Get compliance gaps
   */
  async getComplianceGaps(options?: {
    severity?: string;
    status?: string;
    requirementId?: string;
  }): Promise<ComplianceGap[]> {
    let filteredGaps = [...this.gaps];

    if (options?.severity) {
      filteredGaps = filteredGaps.filter(gap => gap.severity === options.severity);
    }

    if (options?.status) {
      filteredGaps = filteredGaps.filter(gap => gap.status === options.status);
    }

    if (options?.requirementId) {
      filteredGaps = filteredGaps.filter(gap => gap.requirementId === options.requirementId);
    }

    return filteredGaps.sort((a, b) => {
      const severityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * Create compliance gap remediation plan
   */
  async createGapRemediationPlan(gapId: string): Promise<{
    gap: ComplianceGap;
    remediationPlan: {
      phases: Array<{
        name: string;
        description: string;
        tasks: string[];
        timeline: string;
        resources: string[];
      }>;
      totalTimeline: string;
      estimatedCost: string;
      riskMitigation: string[];
    };
  }> {
    const gap = this.gaps.find(g => g.id === gapId);
    if (!gap) {
      throw new Error('Compliance gap not found');
    }

    const timeline = gap.severity === 'Critical' ? '1-2 weeks' : 
                    gap.severity === 'High' ? '2-4 weeks' : 
                    gap.severity === 'Medium' ? '1-2 months' : '2-3 months';

    const cost = gap.severity === 'Critical' ? '$50,000' : 
                gap.severity === 'High' ? '$25,000' : 
                gap.severity === 'Medium' ? '$10,000' : '$5,000';

    return {
      gap,
      remediationPlan: {
        phases: [
          {
            name: 'Assessment & Planning',
            description: 'Conduct detailed assessment and create remediation plan',
            tasks: gap.remediationSteps.slice(0, Math.ceil(gap.remediationSteps.length / 3)),
            timeline: timeline.split('-')[0],
            resources: ['Security team', 'Compliance officer', 'Technical leads']
          },
          {
            name: 'Implementation',
            description: 'Execute remediation activities',
            tasks: gap.remediationSteps.slice(Math.ceil(gap.remediationSteps.length / 3), Math.ceil(2 * gap.remediationSteps.length / 3)),
            timeline: timeline.split('-')[0],
            resources: ['Development team', 'Infrastructure team', 'Security team']
          },
          {
            name: 'Validation & Closure',
            description: 'Validate remediation and close gap',
            tasks: gap.remediationSteps.slice(Math.ceil(2 * gap.remediationSteps.length / 3)),
            timeline: '1 week',
            resources: ['Compliance team', 'Audit team', 'Stakeholders']
          }
        ],
        totalTimeline: timeline,
        estimatedCost: cost,
        riskMitigation: [
          'Regular progress monitoring',
          'Risk assessment checkpoints',
          'Stakeholder communication plan',
          'Contingency planning'
        ]
      }
    };
  }

  /**
   * Get regulatory reporting periods
   */
  async getReportingPeriods(options?: {
    status?: string;
    type?: string;
  }): Promise<RegulatoryReportingPeriod[]> {
    let filteredPeriods = [...this.reportingPeriods];

    if (options?.status) {
      filteredPeriods = filteredPeriods.filter(period => period.status === options.status);
    }

    if (options?.type) {
      filteredPeriods = filteredPeriods.filter(period => period.type === options.type);
    }

    return filteredPeriods.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }

  /**
   * Generate regulatory compliance report
   */
  async generateComplianceReport(options: {
    startDate: string;
    endDate: string;
    jurisdictions?: string[];
    requirements?: string[];
    includeGaps?: boolean;
    includeChanges?: boolean;
  }): Promise<{
    reportId: string;
    generatedDate: string;
    period: string;
    summary: {
      totalRequirements: number;
      activeRequirements: number;
      averageComplianceLevel: number;
      criticalGaps: number;
      recentChanges: number;
    };
    requirements: Array<{
      id: string;
      code: string;
      title: string;
      complianceLevel: number;
      status: string;
      nextAction?: string;
    }>;
    gaps?: Array<{
      id: string;
      title: string;
      severity: string;
      status: string;
      targetResolutionDate: string;
    }>;
    changes?: Array<{
      id: string;
      title: string;
      impactLevel: string;
      effectiveDate: string;
    }>;
    recommendations: string[];
    nextReviewDate: string;
  }> {
    const { startDate, endDate, jurisdictions, requirements, includeGaps, includeChanges } = options;

    // Filter requirements for the report period
    const reportRequirements = this.requirements.filter(req => {
      const effectiveDate = new Date(req.effectiveDate);
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      const inPeriod = effectiveDate >= start && effectiveDate <= end;
      const matchesJurisdiction = !jurisdictions || jurisdictions.includes(req.jurisdiction);
      const matchesRequirements = !requirements || requirements.includes(req.id);
      
      return inPeriod && matchesJurisdiction && matchesRequirements;
    });

    const activeRequirements = reportRequirements.filter(req => req.status === 'Active');
    const averageComplianceLevel = activeRequirements.length > 0 
      ? activeRequirements.reduce((sum, req) => sum + req.complianceLevel, 0) / activeRequirements.length 
      : 0;

    const criticalGaps = this.gaps.filter(gap => gap.severity === 'Critical' && gap.status !== 'Resolved').length;
    const recentChanges = this.changes.filter(change => {
      const announcementDate = new Date(change.announcementDate);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return announcementDate >= start && announcementDate <= end;
    }).length;

    const report: any = {
      reportId: this.generateId('report'),
      generatedDate: new Date().toISOString(),
      period: `${startDate} to ${endDate}`,
      summary: {
        totalRequirements: reportRequirements.length,
        activeRequirements: activeRequirements.length,
        averageComplianceLevel: Math.round(averageComplianceLevel * 10) / 10,
        criticalGaps,
        recentChanges
      },
      requirements: reportRequirements.map(req => ({
        id: req.id,
        code: req.code,
        title: req.title,
        complianceLevel: req.complianceLevel,
        status: req.status,
        nextAction: req.nextReviewDate > new Date().toISOString() ? 'Review required' : undefined
      })),
      recommendations: this.generateComplianceRecommendations(averageComplianceLevel, criticalGaps, recentChanges),
      nextReviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 90 days from now
    };

    if (includeGaps) {
      report.gaps = this.gaps
        .filter(gap => {
          const identifiedDate = new Date(gap.identifiedDate);
          const start = new Date(startDate);
          const end = new Date(endDate);
          return identifiedDate >= start && identifiedDate <= end;
        })
        .map(gap => ({
          id: gap.id,
          title: gap.title,
          severity: gap.severity,
          status: gap.status,
          targetResolutionDate: gap.targetResolutionDate
        }));
    }

    if (includeChanges) {
      report.changes = this.changes
        .filter(change => {
          const announcementDate = new Date(change.announcementDate);
          const start = new Date(startDate);
          const end = new Date(endDate);
          return announcementDate >= start && announcementDate <= end;
        })
        .map(change => ({
          id: change.id,
          title: change.title,
          impactLevel: change.impactLevel,
          effectiveDate: change.effectiveDate
        }));
    }

    return report;
  }

  /**
   * Generate compliance recommendations based on current status
   */
  private generateComplianceRecommendations(
    complianceLevel: number, 
    criticalGaps: number, 
    recentChanges: number
  ): string[] {
    const recommendations: string[] = [];

    if (complianceLevel < 70) {
      recommendations.push('Immediate action required: Overall compliance level is below acceptable threshold');
      recommendations.push('Conduct comprehensive compliance audit and gap analysis');
      recommendations.push('Allocate additional resources to high-priority compliance initiatives');
    } else if (complianceLevel < 85) {
      recommendations.push('Focus on improving compliance scores for medium-priority requirements');
      recommendations.push('Implement automated compliance monitoring and reporting');
    } else {
      recommendations.push('Maintain current compliance levels with regular monitoring');
      recommendations.push('Consider pursuing compliance excellence certifications');
    }

    if (criticalGaps > 0) {
      recommendations.push(`Address ${criticalGaps} critical compliance gaps immediately`);
      recommendations.push('Implement risk-based prioritization for gap remediation');
    }

    if (recentChanges > 0) {
      recommendations.push(`Monitor ${recentChanges} recent regulatory changes for implementation requirements`);
      recommendations.push('Update compliance processes to accommodate new regulatory requirements');
    }

    recommendations.push('Continue regular compliance training and awareness programs');
    recommendations.push('Maintain up-to-date documentation and evidence repositories');

    return recommendations;
  }

  /**
   * Get regulatory calendar with upcoming deadlines and milestones
   */
  async getRegulatoryCalendar(options?: {
    startDate?: string;
    endDate?: string;
    types?: string[];
  }): Promise<{
    events: Array<{
      id: string;
      title: string;
      type: 'Deadline' | 'Review' | 'Effective Date' | 'Reporting';
      date: string;
      description: string;
      priority: string;
      relatedRequirements: string[];
      status: string;
    }>;
    summary: {
      totalEvents: number;
      upcomingDeadlines: number;
      overdueEvents: number;
      criticalEvents: number;
    };
  }> {
    const startDate = options?.startDate || new Date().toISOString().split('T')[0];
    const endDate = options?.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const events: any[] = [];

    // Add requirement review dates
    this.requirements.forEach(req => {
      if (req.nextReviewDate >= startDate && req.nextReviewDate <= endDate) {
        events.push({
          id: `review-${req.id}`,
          title: `${req.code} - Review Due`,
          type: 'Review',
          date: req.nextReviewDate,
          description: `Review and update ${req.title}`,
          priority: req.priority,
          relatedRequirements: [req.id],
          status: req.nextReviewDate < new Date().toISOString().split('T')[0] ? 'Overdue' : 'Upcoming'
        });
      }
    });

    // Add change effective dates
    this.changes.forEach(change => {
      if (change.effectiveDate >= startDate && change.effectiveDate <= endDate) {
        events.push({
          id: `change-${change.id}`,
          title: change.title,
          type: 'Effective Date',
          date: change.effectiveDate,
          description: change.description,
          priority: change.impactLevel,
          relatedRequirements: change.affectedRequirements,
          status: change.effectiveDate < new Date().toISOString().split('T')[0] ? 'Implemented' : 'Upcoming'
        });
      }
    });

    // Add reporting deadlines
    this.reportingPeriods.forEach(period => {
      if (period.reportingDeadline >= startDate && period.reportingDeadline <= endDate) {
        events.push({
          id: `report-${period.id}`,
          title: `${period.name} - Due`,
          type: 'Reporting',
          date: period.reportingDeadline,
          description: period.notes || `Submit ${period.type.toLowerCase()} regulatory compliance report`,
          priority: period.status === 'Rejected' ? 'Critical' : 'High',
          relatedRequirements: period.requirements,
          status: period.reportingDeadline < new Date().toISOString().split('T')[0] ? 'Overdue' : 'Upcoming'
        });
      }
    });

    // Sort events by date
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const now = new Date().toISOString().split('T')[0];
    const summary = {
      totalEvents: events.length,
      upcomingDeadlines: events.filter(e => e.type === 'Deadline' && e.date >= now).length,
      overdueEvents: events.filter(e => e.date < now && e.status !== 'Implemented').length,
      criticalEvents: events.filter(e => e.priority === 'Critical').length
    };

    return { events, summary };
  }

  /**
   * Utility method to generate unique IDs
   */
  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get compliance dashboard overview
   */
  async getComplianceOverview(): Promise<{
    summary: {
      totalRequirements: number;
      activeRequirements: number;
      averageComplianceLevel: number;
      criticalGaps: number;
      overdueReviews: number;
      recentChanges: number;
    };
    byJurisdiction: Array<{
      jurisdiction: string;
      requirementCount: number;
      averageCompliance: number;
      criticalGaps: number;
    }>;
    byCategory: Array<{
      category: string;
      requirementCount: number;
      averageCompliance: number;
    }>;
    recentActivity: Array<{
      id: string;
      type: 'Requirement' | 'Gap' | 'Change' | 'Report';
      title: string;
      date: string;
      status: string;
    }>;
    riskAssessment: {
      overallRisk: 'Low' | 'Medium' | 'High' | 'Critical';
      riskFactors: string[];
      mitigationProgress: number;
      keyConcerns: string[];
    };
  }> {
    const activeRequirements = this.requirements.filter(req => req.status === 'Active');
    const averageCompliance = activeRequirements.length > 0 
      ? activeRequirements.reduce((sum, req) => sum + req.complianceLevel, 0) / activeRequirements.length 
      : 0;

    const criticalGaps = this.gaps.filter(gap => gap.severity === 'Critical' && gap.status !== 'Resolved').length;
    const overdueReviews = this.requirements.filter(req => 
      req.nextReviewDate < new Date().toISOString().split('T')[0]
    ).length;

    const recentChanges = this.changes.filter(change => {
      const announcementDate = new Date(change.announcementDate);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return announcementDate >= thirtyDaysAgo;
    }).length;

    // Group by jurisdiction
    const jurisdictionGroups = activeRequirements.reduce((acc, req) => {
      if (!acc[req.jurisdiction]) {
        acc[req.jurisdiction] = { requirements: [], gaps: [] };
      }
      acc[req.jurisdiction].requirements.push(req);
      acc[req.jurisdiction].gaps.push(...this.gaps.filter(gap => gap.requirementId === req.id && gap.severity === 'Critical'));
      return acc;
    }, {} as Record<string, { requirements: RegulatoryRequirement[], gaps: ComplianceGap[] }>);

    const byJurisdiction = Object.entries(jurisdictionGroups).map(([jurisdiction, data]) => ({
      jurisdiction,
      requirementCount: data.requirements.length,
      averageCompliance: data.requirements.reduce((sum, req) => sum + req.complianceLevel, 0) / data.requirements.length,
      criticalGaps: data.gaps.length
    }));

    // Group by category
    const categoryGroups = activeRequirements.reduce((acc, req) => {
      if (!acc[req.category]) {
        acc[req.category] = [];
      }
      acc[req.category].push(req);
      return acc;
    }, {} as Record<string, RegulatoryRequirement[]>);

    const byCategory = Object.entries(categoryGroups).map(([category, requirements]) => ({
      category,
      requirementCount: requirements.length,
      averageCompliance: requirements.reduce((sum, req) => sum + req.complianceLevel, 0) / requirements.length
    }));

    // Recent activity
    const recentActivity: any[] = [
      ...this.requirements.slice(-3).map(req => ({
        id: req.id,
        type: 'Requirement' as const,
        title: `Updated: ${req.code}`,
        date: req.lastUpdated,
        status: req.status
      })),
      ...this.changes.slice(-3).map(change => ({
        id: change.id,
        type: 'Change' as const,
        title: change.title,
        date: change.announcementDate,
        status: change.status
      })),
      ...this.gaps.slice(-3).map(gap => ({
        id: gap.id,
        type: 'Gap' as const,
        title: gap.title,
        date: gap.identifiedDate,
        status: gap.status
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

    // Risk assessment
    const riskScore = (criticalGaps * 10) + (overdueReviews * 5) + (recentChanges * 3) + Math.max(0, (100 - averageCompliance) / 2);
    let overallRisk: 'Low' | 'Medium' | 'High' | 'Critical';
    if (riskScore >= 50) overallRisk = 'Critical';
    else if (riskScore >= 30) overallRisk = 'High';
    else if (riskScore >= 15) overallRisk = 'Medium';
    else overallRisk = 'Low';

    return {
      summary: {
        totalRequirements: this.requirements.length,
        activeRequirements: activeRequirements.length,
        averageComplianceLevel: Math.round(averageCompliance * 10) / 10,
        criticalGaps,
        overdueReviews,
        recentChanges
      },
      byJurisdiction,
      byCategory,
      recentActivity,
      riskAssessment: {
        overallRisk,
        riskFactors: [
          'Critical compliance gaps require immediate attention',
          'Overdue reviews indicate potential compliance drift',
          'Recent regulatory changes may impact current processes'
        ],
        mitigationProgress: Math.round((averageCompliance / 100) * 100),
        keyConcerns: [
          `${criticalGaps} critical gaps need immediate remediation`,
          `${overdueReviews} requirements are overdue for review`,
          `Recent regulatory changes require impact assessment`
        ]
      }
    };
  }
}

// Export singleton instance
export const regulatoryManagementService = new RegulatoryManagementService();