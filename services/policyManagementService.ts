/**
 * Policy Management Service
 * 
 * Manages the complete lifecycle of compliance policies including creation, versioning,
 * approval workflows, and integration with regulatory requirements for ORACLE-LEDGER
 * Stripe integration compliance dashboard.
 * 
 * Features:
 * - Policy creation and lifecycle management
 * - Version control and approval workflows
 * - Policy categorization and tagging
 * - Impact analysis and change tracking
 * - Policy enforcement monitoring
 * - Integration with regulatory requirements
 * - Policy library and search functionality
 */

import { regulatoryManagementService, RegulatoryRequirement } from './regulatoryManagementService';

// Types and Interfaces
export interface CompliancePolicy {
  id: string;
  title: string;
  description: string;
  category: 'Data Protection' | 'Security' | 'Financial Controls' | 'Operational' | 'HR' | 'Legal';
  status: 'Draft' | 'Under Review' | 'Approved' | 'Active' | 'Suspended' | 'Archived';
  version: string;
  type: 'Policy' | 'Procedure' | 'Guideline' | 'Standard' | 'Code of Conduct';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  owner: string;
  department: string;
  effectiveDate: string;
  expiryDate?: string;
  lastReviewDate: string;
  nextReviewDate: string;
  approvalWorkflow: ApprovalWorkflowStep[];
  content: PolicyContent;
  requirements: PolicyRequirementMapping[];
  stakeholders: PolicyStakeholder[];
  attachments: PolicyAttachment[];
  tags: string[];
  relatedPolicies: string[];
  complianceMetrics: PolicyComplianceMetrics;
  history: PolicyVersion[];
  auditTrail: PolicyAuditEntry[];
  keywords: string[];
  language: string;
  confidentialityLevel: 'Public' | 'Internal' | 'Confidential' | 'Restricted';
}

export interface PolicyContent {
  executiveSummary: string;
  purpose: string;
  scope: string;
  definitions: Array<{
    term: string;
    definition: string;
  }>;
  policyStatement: string;
  procedures: Array<{
    title: string;
    steps: string[];
    responsibleParty: string;
  }>;
  responsibilities: Array<{
    role: string;
    responsibilities: string[];
  }>;
  enforcement: string;
  exceptions: string;
  relatedDocuments: string[];
  appendices: Array<{
    title: string;
    content: string;
  }>;
}

export interface ApprovalWorkflowStep {
  id: string;
  stepNumber: number;
  stepName: string;
  approver: string;
  approverRole: string;
  status: 'Pending' | 'In Progress' | 'Approved' | 'Rejected' | 'Delegated';
  comments?: string;
  approvalDate?: string;
  dueDate: string;
  escalation?: {
    escalated: boolean;
    escalatedTo?: string;
    escalationDate?: string;
  };
}

export interface PolicyRequirementMapping {
  requirementId: string;
  requirementCode: string;
  requirementTitle: string;
  mappingType: 'Direct' | 'Indirect' | 'Supporting' | 'Reference';
  complianceLevel: number; // 0-100 percentage
  evidence: PolicyEvidence[];
  lastAssessmentDate: string;
  nextAssessmentDate: string;
  gaps: PolicyGap[];
}

export interface PolicyEvidence {
  id: string;
  requirementId: string;
  title: string;
  type: 'Document' | 'Process' | 'Configuration' | 'Record' | 'Audit';
  source: string;
  status: 'Pending' | 'Verified' | 'Expired' | 'Invalid';
  uploadDate: string;
  verificationDate?: string;
  verifiedBy?: string;
  expiryDate?: string;
  description?: string;
  url?: string;
}

export interface PolicyGap {
  id: string;
  policyId: string;
  requirementId: string;
  title: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Accepted';
  identifiedDate: string;
  targetResolutionDate: string;
  resolutionDate?: string;
  assignedTo?: string;
  remediationPlan: string;
  riskLevel: number;
}

export interface PolicyStakeholder {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  involvementType: 'Owner' | 'Approver' | 'Reviewer' | 'Implementer' | 'Affected';
  notificationPreferences: {
    updates: boolean;
    reviews: boolean;
    changes: boolean;
  };
  lastEngagementDate?: string;
}

export interface PolicyAttachment {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  uploadDate: string;
  uploadedBy: string;
  description?: string;
  category: 'Template' | 'Reference' | 'Evidence' | 'Supporting' | 'Legal';
  url?: string;
  version?: string;
}

export interface PolicyComplianceMetrics {
  overallScore: number; // 0-100
  implementationScore: number;
  effectivenessScore: number;
  complianceScore: number;
  lastCalculated: string;
  trendDirection: 'Improving' | 'Stable' | 'Declining';
  metrics: {
    totalRequirements: number;
    implementedRequirements: number;
    compliantRequirements: number;
    outstandingGaps: number;
    overdueReviews: number;
  };
  kpis: Array<{
    name: string;
    value: number;
    target: number;
    unit: string;
    trend: 'Up' | 'Down' | 'Stable';
  }>;
}

export interface PolicyVersion {
  version: string;
  changeDate: string;
  changedBy: string;
  changeType: 'Creation' | 'Minor Update' | 'Major Update' | 'Reformat' | 'Review Update';
  changeDescription: string;
  reason: string;
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: string;
  approvedDate?: string;
  changes: PolicyChange[];
  reviewCycle?: string;
}

export interface PolicyChange {
  section: string;
  type: 'Added' | 'Modified' | 'Removed' | 'Moved';
  description: string;
  oldValue?: string;
  newValue?: string;
  impact: 'None' | 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface PolicyAuditEntry {
  id: string;
  policyId: string;
  version: string;
  action: 'Created' | 'Updated' | 'Reviewed' | 'Approved' | 'Published' | 'Archived' | 'Suspended';
  performedBy: string;
  timestamp: string;
  details: string;
  previousValue?: string;
  newValue?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface PolicyReviewSchedule {
  id: string;
  policyId: string;
  reviewFrequency: 'Monthly' | 'Quarterly' | 'Semi-Annually' | 'Annually' | 'Bi-Annually';
  nextReviewDate: string;
  lastReviewDate: string;
  reviewer: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Overdue';
  reviewNotes?: string;
  completionDate?: string;
  nextSteps?: string[];
}

export interface PolicyImpactAnalysis {
  policyId: string;
  analysisDate: string;
  impactType: 'Regulatory' | 'Operational' | 'Technical' | 'Financial' | 'Reputational';
  impactLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  description: string;
  affectedAreas: string[];
  stakeholders: string[];
  recommendations: string[];
  implementationEffort: 'Very High' | 'High' | 'Medium' | 'Low';
  riskFactors: string[];
  mitigationStrategies: string[];
  timeline: string;
  budget?: string;
}

export interface PolicyException {
  id: string;
  policyId: string;
  title: string;
  description: string;
  requestedBy: string;
  requestDate: string;
  justification: string;
  riskLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'Approved' | 'Rejected' | 'Expired';
  approvedBy?: string;
  approvalDate?: string;
  expiryDate?: string;
  conditions: string[];
  monitoringRequired: boolean;
  reviewDate?: string;
}

// Service Class
export class PolicyManagementService {
  private policies: CompliancePolicy[] = [];
  private reviewSchedules: PolicyReviewSchedule[] = [];
  private impactAnalyses: PolicyImpactAnalysis[] = [];
  private exceptions: PolicyException[] = [];

  constructor() {
    this.initializeMockData();
  }

  /**
   * Initialize mock data for development and demonstration
   */
  private initializeMockData(): void {
    this.policies = [
      {
        id: 'policy-dp-001',
        title: 'Data Protection and Privacy Policy',
        description: 'Comprehensive policy governing the collection, processing, storage, and protection of personal data across all ORACLE-LEDGER systems and operations',
        category: 'Data Protection',
        status: 'Active',
        version: '3.2.1',
        type: 'Policy',
        priority: 'Critical',
        owner: 'Chief Privacy Officer',
        department: 'Legal & Compliance',
        effectiveDate: '2024-01-15',
        lastReviewDate: '2024-09-15',
        nextReviewDate: '2025-01-15',
        approvalWorkflow: [
          {
            id: 'step-1',
            stepNumber: 1,
            stepName: 'Legal Review',
            approver: 'legal-team@oracleledger.com',
            approverRole: 'Legal Team',
            status: 'Approved',
            approvalDate: '2024-01-10',
            dueDate: '2024-01-12'
          },
          {
            id: 'step-2',
            stepNumber: 2,
            stepName: 'Compliance Approval',
            approver: 'compliance-team@oracleledger.com',
            approverRole: 'Compliance Team',
            status: 'Approved',
            approvalDate: '2024-01-12',
            dueDate: '2024-01-14'
          }
        ],
        content: {
          executiveSummary: 'This policy establishes the framework for protecting personal data in compliance with GDPR, CCPA, and other applicable privacy regulations.',
          purpose: 'To ensure the lawful, fair, and transparent processing of personal data while maintaining the highest standards of privacy protection.',
          scope: 'All personal data processed by ORACLE-LEDGER, including customer data, employee data, and third-party data.',
          definitions: [
            { term: 'Personal Data', definition: 'Any information relating to an identified or identifiable natural person' },
            { term: 'Processing', definition: 'Any operation performed on personal data' }
          ],
          policyStatement: 'ORACLE-LEDGER is committed to protecting the privacy and personal data of all individuals.',
          procedures: [
            {
              title: 'Data Collection Procedures',
              steps: [
                'Obtain explicit consent before collecting personal data',
                'Implement data minimization principles',
                'Ensure data accuracy and currency'
              ],
              responsibleParty: 'Data Controllers'
            }
          ],
          responsibilities: [
            {
              role: 'Data Protection Officer',
              responsibilities: ['Monitor compliance', 'Handle data subject requests', 'Conduct privacy impact assessments']
            }
          ],
          enforcement: 'Non-compliance may result in disciplinary action and regulatory penalties.',
          exceptions: 'Emergency situations requiring immediate data processing for life safety',
          relatedDocuments: ['Data Subject Rights Procedures', 'Privacy Impact Assessment Template'],
          appendices: []
        },
        requirements: [
          {
            requirementId: 'req-gdpr-32',
            requirementCode: 'GDPR Art. 32',
            requirementTitle: 'Security of processing',
            mappingType: 'Direct',
            complianceLevel: 87.5,
            evidence: [],
            lastAssessmentDate: '2024-10-01',
            nextAssessmentDate: '2025-01-01',
            gaps: []
          }
        ],
        stakeholders: [
          {
            id: 'stakeholder-1',
            name: 'Sarah Johnson',
            email: 'sarah.johnson@oracleledger.com',
            role: 'Chief Privacy Officer',
            department: 'Legal & Compliance',
            involvementType: 'Owner',
            notificationPreferences: {
              updates: true,
              reviews: true,
              changes: true
            },
            lastEngagementDate: '2024-10-15'
          }
        ],
        attachments: [],
        tags: ['GDPR', 'Privacy', 'Data Protection', 'Compliance'],
        relatedPolicies: ['policy-security-001', 'policy-retention-001'],
        complianceMetrics: {
          overallScore: 89.2,
          implementationScore: 85.0,
          effectivenessScore: 92.5,
          complianceScore: 90.0,
          lastCalculated: '2024-11-01',
          trendDirection: 'Improving',
          metrics: {
            totalRequirements: 12,
            implementedRequirements: 10,
            compliantRequirements: 9,
            outstandingGaps: 3,
            overdueReviews: 0
          },
          kpis: [
            { name: 'Data Subject Requests Response Time', value: 24, target: 30, unit: 'hours', trend: 'Up' },
            { name: 'Privacy Impact Assessments Completed', value: 95, target: 100, unit: 'percentage', trend: 'Stable' }
          ]
        },
        history: [
          {
            version: '3.2.1',
            changeDate: '2024-09-15',
            changedBy: 'Sarah Johnson',
            changeType: 'Minor Update',
            changeDescription: 'Updated data retention periods and added new data subject rights procedures',
            reason: 'GDPR compliance update and operational improvement',
            approvalStatus: 'Approved',
            approvedBy: 'Chief Compliance Officer',
            approvedDate: '2024-09-20',
            changes: [
              {
                section: 'Data Retention',
                type: 'Modified',
                description: 'Updated retention periods for different data categories',
                oldValue: '7 years for financial records',
                newValue: '5 years for financial records',
                impact: 'Medium'
              }
            ]
          }
        ],
        auditTrail: [],
        keywords: ['privacy', 'data protection', 'GDPR', 'personal data', 'consent'],
        language: 'en',
        confidentialityLevel: 'Internal'
      },
      {
        id: 'policy-sec-001',
        title: 'Information Security Policy',
        description: 'Comprehensive security framework protecting ORACLE-LEDGER information assets from threats and vulnerabilities',
        category: 'Security',
        status: 'Active',
        version: '2.1.0',
        type: 'Policy',
        priority: 'Critical',
        owner: 'Chief Information Security Officer',
        department: 'IT Security',
        effectiveDate: '2024-03-01',
        lastReviewDate: '2024-08-01',
        nextReviewDate: '2025-03-01',
        approvalWorkflow: [],
        content: {
          executiveSummary: 'This policy establishes the security framework for protecting information assets and maintaining the confidentiality, integrity, and availability of data.',
          purpose: 'To protect information assets from unauthorized access, disclosure, modification, or destruction.',
          scope: 'All information assets, systems, and networks within ORACLE-LEDGER infrastructure.',
          definitions: [
            { term: 'Information Asset', definition: 'Any information valuable to the organization' },
            { term: 'Access Control', definition: 'Mechanisms to regulate who can access what resources' }
          ],
          policyStatement: 'ORACLE-LEDGER maintains a robust security posture to protect all information assets.',
          procedures: [
            {
              title: 'Access Control Procedures',
              steps: [
                'Implement role-based access control',
                'Regular access reviews and recertification',
                'Multi-factor authentication for critical systems'
              ],
              responsibleParty: 'IT Security Team'
            }
          ],
          responsibilities: [
            {
              role: 'All Employees',
              responsibilities: ['Protect credentials', 'Report security incidents', 'Follow security procedures']
            }
          ],
          enforcement: 'Security violations may result in immediate access termination and disciplinary action.',
          exceptions: 'Emergency access procedures for critical business continuity',
          relatedDocuments: ['Incident Response Plan', 'Security Awareness Training'],
          appendices: []
        },
        requirements: [
          {
            requirementId: 'req-pci-dss-4.0',
            requirementCode: 'PCI-DSS v4.0',
            requirementTitle: 'Payment Card Industry Data Security Standard',
            mappingType: 'Direct',
            complianceLevel: 94.2,
            evidence: [],
            lastAssessmentDate: '2024-10-01',
            nextAssessmentDate: '2025-01-01',
            gaps: []
          }
        ],
        stakeholders: [],
        attachments: [],
        tags: ['Security', 'Access Control', 'PCI-DSS', 'Information Security'],
        relatedPolicies: ['policy-dp-001'],
        complianceMetrics: {
          overallScore: 92.8,
          implementationScore: 90.0,
          effectivenessScore: 95.0,
          complianceScore: 93.5,
          lastCalculated: '2024-11-01',
          trendDirection: 'Stable',
          metrics: {
            totalRequirements: 8,
            implementedRequirements: 7,
            compliantRequirements: 6,
            outstandingGaps: 2,
            overdueReviews: 1
          },
          kpis: [
            { name: 'Security Incidents', value: 2, target: 5, unit: 'count', trend: 'Down' },
            { name: 'Access Review Completion', value: 88, target: 95, unit: 'percentage', trend: 'Up' }
          ]
        },
        history: [],
        auditTrail: [],
        keywords: ['security', 'access control', 'authentication', 'authorization'],
        language: 'en',
        confidentialityLevel: 'Confidential'
      }
    ];

    this.reviewSchedules = [
      {
        id: 'review-001',
        policyId: 'policy-dp-001',
        reviewFrequency: 'Annually',
        nextReviewDate: '2025-01-15',
        lastReviewDate: '2024-09-15',
        reviewer: 'Sarah Johnson',
        status: 'Scheduled'
      }
    ];

    this.impactAnalyses = [
      {
        policyId: 'policy-dp-001',
        analysisDate: '2024-10-01',
        impactType: 'Regulatory',
        impactLevel: 'High',
        description: 'New GDPR updates may require policy modifications',
        affectedAreas: ['Legal & Compliance', 'Data Processing', 'Customer Service'],
        stakeholders: ['Chief Privacy Officer', 'Legal Team', 'Data Controllers'],
        recommendations: ['Conduct impact assessment', 'Update procedures', 'Train staff'],
        implementationEffort: 'Medium',
        riskFactors: ['Regulatory penalties', 'Compliance gaps', 'Operational disruption'],
        mitigationStrategies: ['Phased implementation', 'Regular monitoring', 'Stakeholder engagement'],
        timeline: '3 months',
        budget: '$50,000'
      }
    ];
  }

  /**
   * Get all policies with filtering and pagination
   */
  async getPolicies(options?: {
    category?: string;
    status?: string;
    type?: string;
    owner?: string;
    search?: string;
    tags?: string[];
    page?: number;
    limit?: number;
  }): Promise<{
    policies: CompliancePolicy[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    let filteredPolicies = [...this.policies];

    // Apply filters
    if (options?.category) {
      filteredPolicies = filteredPolicies.filter(policy => policy.category === options.category);
    }

    if (options?.status) {
      filteredPolicies = filteredPolicies.filter(policy => policy.status === options.status);
    }

    if (options?.type) {
      filteredPolicies = filteredPolicies.filter(policy => policy.type === options.type);
    }

    if (options?.owner) {
      filteredPolicies = filteredPolicies.filter(policy => policy.owner === options.owner);
    }

    if (options?.search) {
      const searchLower = options.search.toLowerCase();
      filteredPolicies = filteredPolicies.filter(policy =>
        policy.title.toLowerCase().includes(searchLower) ||
        policy.description.toLowerCase().includes(searchLower) ||
        policy.keywords.some(keyword => keyword.toLowerCase().includes(searchLower))
      );
    }

    if (options?.tags && options.tags.length > 0) {
      filteredPolicies = filteredPolicies.filter(policy =>
        options.tags!.some(tag => policy.tags.includes(tag))
      );
    }

    // Sort by last updated
    filteredPolicies.sort((a, b) => 
      new Date(b.lastReviewDate).getTime() - new Date(a.lastReviewDate).getTime()
    );

    // Pagination
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPolicies = filteredPolicies.slice(startIndex, endIndex);

    return {
      policies: paginatedPolicies,
      total: filteredPolicies.length,
      page,
      totalPages: Math.ceil(filteredPolicies.length / limit)
    };
  }

  /**
   * Get policy by ID
   */
  async getPolicyById(id: string): Promise<CompliancePolicy | null> {
    return this.policies.find(policy => policy.id === id) || null;
  }

  /**
   * Create new policy
   */
  async createPolicy(policy: Omit<CompliancePolicy, 'id' | 'history' | 'auditTrail'>): Promise<CompliancePolicy> {
    const newPolicy: CompliancePolicy = {
      ...policy,
      id: this.generateId('policy'),
      history: [
        {
          version: policy.version,
          changeDate: new Date().toISOString().split('T')[0],
          changedBy: policy.owner,
          changeType: 'Creation',
          changeDescription: 'Initial policy creation',
          reason: 'New policy requirement',
          approvalStatus: policy.status === 'Draft' ? 'Pending' : 'Approved',
          changes: []
        }
      ],
      auditTrail: [
        {
          id: this.generateId('audit'),
          policyId: this.generateId('policy'),
          version: policy.version,
          action: 'Created',
          performedBy: policy.owner,
          timestamp: new Date().toISOString(),
          details: 'Policy created'
        }
      ]
    };

    this.policies.push(newPolicy);
    return newPolicy;
  }

  /**
   * Update policy
   */
  async updatePolicy(id: string, updates: Partial<CompliancePolicy>): Promise<CompliancePolicy | null> {
    const index = this.policies.findIndex(policy => policy.id === id);
    if (index === -1) return null;

    const existingPolicy = this.policies[index];
    const updatedPolicy = {
      ...existingPolicy,
      ...updates,
      version: updates.version || existingPolicy.version
    };

    // Add to history if version changed
    if (updates.version && updates.version !== existingPolicy.version) {
      updatedPolicy.history = [
        ...existingPolicy.history,
        {
          version: updates.version,
          changeDate: new Date().toISOString().split('T')[0],
          changedBy: updates.owner || existingPolicy.owner,
          changeType: 'Minor Update',
          changeDescription: 'Policy updated',
          reason: 'Regular review and update',
          approvalStatus: 'Pending',
          changes: []
        }
      ];
    }

    // Add audit trail entry
    updatedPolicy.auditTrail = [
      ...existingPolicy.auditTrail,
      {
        id: this.generateId('audit'),
        policyId: id,
        version: updatedPolicy.version,
        action: 'Updated',
        performedBy: updates.owner || existingPolicy.owner,
        timestamp: new Date().toISOString(),
        details: 'Policy updated'
      }
    ];

    this.policies[index] = updatedPolicy;
    return updatedPolicy;
  }

  /**
   * Get policy compliance overview
   */
  async getPolicyComplianceOverview(): Promise<{
    summary: {
      totalPolicies: number;
      activePolicies: number;
      averageComplianceScore: number;
      overdueReviews: number;
      criticalGaps: number;
    };
    byCategory: Array<{
      category: string;
      policyCount: number;
      averageScore: number;
      activeCount: number;
    }>;
    upcomingReviews: Array<{
      policyId: string;
      policyTitle: string;
      reviewDate: string;
      priority: string;
      status: string;
    }>;
    topPerformingPolicies: Array<{
      id: string;
      title: string;
      score: number;
      trend: string;
    }>;
    complianceTrends: Array<{
      month: string;
      averageScore: number;
      policyCount: number;
    }>;
  }> {
    const activePolicies = this.policies.filter(policy => policy.status === 'Active');
    const averageCompliance = activePolicies.length > 0 
      ? activePolicies.reduce((sum, policy) => sum + policy.complianceMetrics.overallScore, 0) / activePolicies.length 
      : 0;

    const overdueReviews = this.policies.filter(policy => 
      policy.nextReviewDate < new Date().toISOString().split('T')[0]
    ).length;

    // Get critical gaps from requirements mapping
    const criticalGaps = this.policies.reduce((total, policy) => {
      return total + policy.requirements.reduce((reqTotal, req) => {
        return reqTotal + req.gaps.filter(gap => gap.severity === 'Critical').length;
      }, 0);
    }, 0);

    // Group by category
    const categoryGroups = activePolicies.reduce((acc, policy) => {
      if (!acc[policy.category]) {
        acc[policy.category] = { policies: [], scores: [] };
      }
      acc[policy.category].policies.push(policy);
      acc[policy.category].scores.push(policy.complianceMetrics.overallScore);
      return acc;
    }, {} as Record<string, { policies: CompliancePolicy[], scores: number[] }>);

    const byCategory = Object.entries(categoryGroups).map(([category, data]) => ({
      category,
      policyCount: data.policies.length,
      averageScore: data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length,
      activeCount: data.policies.filter(p => p.status === 'Active').length
    }));

    // Upcoming reviews (next 30 days)
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const upcomingReviews = this.policies
      .filter(policy => policy.nextReviewDate <= thirtyDaysFromNow && policy.nextReviewDate >= new Date().toISOString().split('T')[0])
      .map(policy => ({
        policyId: policy.id,
        policyTitle: policy.title,
        reviewDate: policy.nextReviewDate,
        priority: policy.priority,
        status: 'Scheduled'
      }))
      .sort((a, b) => new Date(a.reviewDate).getTime() - new Date(b.reviewDate).getTime());

    // Top performing policies
    const topPerformingPolicies = activePolicies
      .sort((a, b) => b.complianceMetrics.overallScore - a.complianceMetrics.overallScore)
      .slice(0, 5)
      .map(policy => ({
        id: policy.id,
        title: policy.title,
        score: policy.complianceMetrics.overallScore,
        trend: policy.complianceMetrics.trendDirection
      }));

    // Mock compliance trends (last 6 months)
    const complianceTrends = [
      { month: '2024-06', averageScore: 85.2, policyCount: activePolicies.length },
      { month: '2024-07', averageScore: 87.1, policyCount: activePolicies.length },
      { month: '2024-08', averageScore: 88.9, policyCount: activePolicies.length },
      { month: '2024-09', averageScore: 89.5, policyCount: activePolicies.length },
      { month: '2024-10', averageScore: 90.8, policyCount: activePolicies.length },
      { month: '2024-11', averageScore: 91.2, policyCount: activePolicies.length }
    ];

    return {
      summary: {
        totalPolicies: this.policies.length,
        activePolicies: activePolicies.length,
        averageComplianceScore: Math.round(averageCompliance * 10) / 10,
        overdueReviews,
        criticalGaps
      },
      byCategory,
      upcomingReviews,
      topPerformingPolicies,
      complianceTrends
    };
  }

  /**
   * Analyze policy impact
   */
  async analyzePolicyImpact(policyId: string): Promise<PolicyImpactAnalysis | null> {
    const policy = this.policies.find(p => p.id === policyId);
    if (!policy) return null;

    // Check if impact analysis exists
    let existingAnalysis = this.impactAnalyses.find(analysis => analysis.policyId === policyId);
    
    if (existingAnalysis) {
      return existingAnalysis;
    }

    // Generate new impact analysis based on policy characteristics
    const impactLevel = policy.priority === 'Critical' ? 'Critical' : 
                       policy.priority === 'High' ? 'High' : 'Medium';

    const implementationEffort = policy.requirements.length > 10 ? 'High' : 
                                policy.requirements.length > 5 ? 'Medium' : 'Low';

    const newAnalysis: PolicyImpactAnalysis = {
      policyId,
      analysisDate: new Date().toISOString().split('T')[0],
      impactType: 'Regulatory',
      impactLevel,
      description: `Impact analysis for ${policy.title} covering regulatory, operational, and technical implications`,
      affectedAreas: [policy.department, 'Legal & Compliance', 'IT Security'],
      stakeholders: policy.stakeholders.map(s => s.name),
      recommendations: [
        'Conduct stakeholder consultation',
        'Implement phased rollout approach',
        'Monitor compliance metrics closely'
      ],
      implementationEffort,
      riskFactors: [
        'Implementation timeline constraints',
        'Stakeholder resistance',
        'Resource availability'
      ],
      mitigationStrategies: [
        'Clear communication plan',
        'Executive sponsorship',
        'Regular progress monitoring'
      ],
      timeline: implementationEffort === 'High' ? '6 months' : 
               implementationEffort === 'Medium' ? '3 months' : '1 month',
      budget: implementationEffort === 'High' ? '$100,000' : 
             implementationEffort === 'Medium' ? '$50,000' : '$25,000'
    };

    this.impactAnalyses.push(newAnalysis);
    return newAnalysis;
  }

  /**
   * Get policy approval workflow status
   */
  async getPolicyApprovalWorkflow(policyId: string): Promise<{
    policy: CompliancePolicy;
    workflowStatus: {
      totalSteps: number;
      completedSteps: number;
      currentStep: number;
      status: 'Pending' | 'In Progress' | 'Approved' | 'Rejected';
      timeline: Array<{
        step: number;
        name: string;
        approver: string;
        status: string;
        date?: string;
        comments?: string;
      }>;
    };
    nextActions: string[];
    estimatedCompletion?: string;
  }> {
    const policy = this.policies.find(p => p.id === policyId);
    if (!policy) {
      throw new Error('Policy not found');
    }

    const workflow = policy.approvalWorkflow;
    const completedSteps = workflow.filter(step => step.status === 'Approved').length;
    const currentStep = workflow.find(step => step.status === 'Pending')?.stepNumber || workflow.length + 1;
    const totalSteps = workflow.length;

    let status: 'Pending' | 'In Progress' | 'Approved' | 'Rejected';
    if (workflow.some(step => step.status === 'Rejected')) {
      status = 'Rejected';
    } else if (completedSteps === totalSteps) {
      status = 'Approved';
    } else if (completedSteps > 0) {
      status = 'In Progress';
    } else {
      status = 'Pending';
    }

    const timeline = workflow.map(step => ({
      step: step.stepNumber,
      name: step.stepName,
      approver: step.approver,
      status: step.status,
      date: step.approvalDate,
      comments: step.comments
    }));

    // Estimate completion (assume 2 business days per pending step)
    const pendingSteps = workflow.filter(step => step.status === 'Pending').length;
    const estimatedCompletion = pendingSteps > 0 
      ? new Date(Date.now() + pendingSteps * 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      : undefined;

    const nextActions = workflow
      .filter(step => step.status === 'Pending')
      .map(step => `Awaiting approval from ${step.approver} for ${step.stepName}`);

    return {
      policy,
      workflowStatus: {
        totalSteps,
        completedSteps,
        currentStep,
        status,
        timeline
      },
      nextActions,
      estimatedCompletion
    };
  }

  /**
   * Create policy exception
   */
  async createPolicyException(exception: Omit<PolicyException, 'id' | 'status'>): Promise<PolicyException> {
    const newException: PolicyException = {
      ...exception,
      id: this.generateId('exception'),
      status: 'Pending'
    };

    this.exceptions.push(newException);
    return newException;
  }

  /**
   * Get policy exceptions
   */
  async getPolicyExceptions(options?: {
    policyId?: string;
    status?: string;
    riskLevel?: string;
  }): Promise<PolicyException[]> {
    let filteredExceptions = [...this.exceptions];

    if (options?.policyId) {
      filteredExceptions = filteredExceptions.filter(exc => exc.policyId === options.policyId);
    }

    if (options?.status) {
      filteredExceptions = filteredExceptions.filter(exc => exc.status === options.status);
    }

    if (options?.riskLevel) {
      filteredExceptions = filteredExceptions.filter(exc => exc.riskLevel === options.riskLevel);
    }

    return filteredExceptions.sort((a, b) => 
      new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()
    );
  }

  /**
   * Generate policy compliance report
   */
  async generatePolicyComplianceReport(options: {
    startDate: string;
    endDate: string;
    categories?: string[];
    includeExceptions?: boolean;
    includeGaps?: boolean;
  }): Promise<{
    reportId: string;
    generatedDate: string;
    period: string;
    summary: {
      totalPolicies: number;
      compliantPolicies: number;
      averageComplianceScore: number;
      overdueReviews: number;
      activeExceptions: number;
      criticalGaps: number;
    };
    byCategory: Array<{
      category: string;
      policyCount: number;
      compliantCount: number;
      averageScore: number;
    }>;
    policyDetails: Array<{
      id: string;
      title: string;
      category: string;
      version: string;
      status: string;
      complianceScore: number;
      nextReviewDate: string;
      complianceLevel: string;
    }>;
    exceptions?: Array<{
      id: string;
      policyTitle: string;
      riskLevel: string;
      status: string;
      expiryDate: string;
    }>;
    gaps?: Array<{
      id: string;
      policyTitle: string;
      requirementTitle: string;
      severity: string;
      status: string;
      targetResolutionDate: string;
    }>;
    recommendations: string[];
  }> {
    const { startDate, endDate, categories, includeExceptions, includeGaps } = options;

    // Filter policies for the report period
    const reportPolicies = this.policies.filter(policy => {
      const effectiveDate = new Date(policy.effectiveDate);
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      const inPeriod = effectiveDate >= start && effectiveDate <= end;
      const matchesCategory = !categories || categories.includes(policy.category);
      
      return inPeriod && matchesCategory && policy.status === 'Active';
    });

    const compliantPolicies = reportPolicies.filter(policy => 
      policy.complianceMetrics.overallScore >= 80
    ).length;

    const averageScore = reportPolicies.length > 0
      ? reportPolicies.reduce((sum, policy) => sum + policy.complianceMetrics.overallScore, 0) / reportPolicies.length
      : 0;

    const overdueReviews = reportPolicies.filter(policy => 
      policy.nextReviewDate < new Date().toISOString().split('T')[0]
    ).length;

    const activeExceptions = this.exceptions.filter(exc => exc.status === 'Approved').length;

    // Calculate critical gaps
    const criticalGaps = reportPolicies.reduce((total, policy) => {
      return total + policy.requirements.reduce((reqTotal, req) => {
        return reqTotal + req.gaps.filter(gap => gap.severity === 'Critical' && gap.status === 'Open').length;
      }, 0);
    }, 0);

    // Group by category
    const categoryGroups = reportPolicies.reduce((acc, policy) => {
      if (!acc[policy.category]) {
        acc[policy.category] = { policies: [], compliantPolicies: [] };
      }
      acc[policy.category].policies.push(policy);
      if (policy.complianceMetrics.overallScore >= 80) {
        acc[policy.category].compliantPolicies.push(policy);
      }
      return acc;
    }, {} as Record<string, { policies: CompliancePolicy[], compliantPolicies: CompliancePolicy[] }>);

    const byCategory = Object.entries(categoryGroups).map(([category, data]) => ({
      category,
      policyCount: data.policies.length,
      compliantCount: data.compliantPolicies.length,
      averageScore: data.policies.reduce((sum, policy) => sum + policy.complianceMetrics.overallScore, 0) / data.policies.length
    }));

    const policyDetails = reportPolicies.map(policy => ({
      id: policy.id,
      title: policy.title,
      category: policy.category,
      version: policy.version,
      status: policy.status,
      complianceScore: policy.complianceMetrics.overallScore,
      nextReviewDate: policy.nextReviewDate,
      complianceLevel: policy.complianceMetrics.overallScore >= 90 ? 'Excellent' : 
                     policy.complianceMetrics.overallScore >= 80 ? 'Good' : 
                     policy.complianceMetrics.overallScore >= 70 ? 'Fair' : 'Poor'
    }));

    const report: any = {
      reportId: this.generateId('policy-report'),
      generatedDate: new Date().toISOString(),
      period: `${startDate} to ${endDate}`,
      summary: {
        totalPolicies: reportPolicies.length,
        compliantPolicies,
        averageComplianceScore: Math.round(averageScore * 10) / 10,
        overdueReviews,
        activeExceptions,
        criticalGaps
      },
      byCategory,
      policyDetails,
      recommendations: this.generatePolicyRecommendations(averageScore, overdueReviews, criticalGaps, activeExceptions)
    };

    if (includeExceptions) {
      report.exceptions = this.exceptions
        .filter(exc => {
          const requestDate = new Date(exc.requestDate);
          const start = new Date(startDate);
          const end = new Date(endDate);
          return requestDate >= start && requestDate <= end;
        })
        .map(exc => {
          const policy = this.policies.find(p => p.id === exc.policyId);
          return {
            id: exc.id,
            policyTitle: policy?.title || 'Unknown Policy',
            riskLevel: exc.riskLevel,
            status: exc.status,
            expiryDate: exc.expiryDate || 'No expiry'
          };
        });
    }

    if (includeGaps) {
      const allGaps = reportPolicies.flatMap(policy => 
        policy.requirements.flatMap(req => req.gaps)
      );

      report.gaps = allGaps
        .filter(gap => {
          const identifiedDate = new Date(gap.identifiedDate);
          const start = new Date(startDate);
          const end = new Date(endDate);
          return identifiedDate >= start && identifiedDate <= end;
        })
        .map(gap => {
          const policy = reportPolicies.find(p => p.requirements.some(r => r.gaps.some(g => g.id === gap.id)));
          return {
            id: gap.id,
            policyTitle: policy?.title || 'Unknown Policy',
            requirementTitle: 'Requirement', // Simplified for demo
            severity: gap.severity,
            status: gap.status,
            targetResolutionDate: gap.targetResolutionDate
          };
        });
    }

    return report;
  }

  /**
   * Generate policy recommendations
   */
  private generatePolicyRecommendations(
    averageScore: number,
    overdueReviews: number,
    criticalGaps: number,
    activeExceptions: number
  ): string[] {
    const recommendations: string[] = [];

    if (averageScore < 80) {
      recommendations.push('Overall policy compliance score is below target - review and strengthen implementation');
      recommendations.push('Conduct comprehensive policy effectiveness assessment');
      recommendations.push('Implement automated compliance monitoring and reporting');
    } else if (averageScore < 90) {
      recommendations.push('Focus on improving policy compliance scores to reach excellence target');
      recommendations.push('Enhance policy training and awareness programs');
    } else {
      recommendations.push('Maintain current policy compliance levels with regular monitoring');
      recommendations.push('Consider policy optimization and efficiency improvements');
    }

    if (overdueReviews > 0) {
      recommendations.push(`Address ${overdueReviews} overdue policy reviews immediately`);
      recommendations.push('Implement automated review scheduling and reminders');
    }

    if (criticalGaps > 0) {
      recommendations.push(`Remediate ${criticalGaps} critical policy compliance gaps`);
      recommendations.push('Conduct gap analysis and develop remediation plans');
    }

    if (activeExceptions > 0) {
      recommendations.push(`Review and manage ${activeExceptions} active policy exceptions`);
      recommendations.push('Ensure proper exception monitoring and renewal processes');
    }

    recommendations.push('Continue regular policy training and awareness programs');
    recommendations.push('Maintain up-to-date policy documentation and evidence');

    return recommendations;
  }

  /**
   * Utility method to generate unique IDs
   */
  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const policyManagementService = new PolicyManagementService();