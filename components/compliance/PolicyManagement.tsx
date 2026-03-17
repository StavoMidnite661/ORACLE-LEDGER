import React, { useState } from 'react';

interface Policy {
  id: string;
  name: string;
  version: string;
  status: 'active' | 'draft' | 'review' | 'archived';
  lastReview: string;
  nextReview: string;
  owner: string;
  category: string;
  description: string;
  complianceStandards: string[];
  documentUrl?: string;
  revisionHistory: PolicyRevision[];
}

interface PolicyRevision {
  version: string;
  date: string;
  changes: string;
  author: string;
}

interface ComplianceTemplate {
  id: string;
  name: string;
  type: 'assessment' | 'review' | 'checklist';
  regulatoryStandard: string;
  description: string;
  lastUsed: string;
  usageCount: number;
  completionRate: number;
}

interface PolicyManagementProps {
  complianceTemplates: ComplianceTemplate[];
  policies: Policy[];
  className?: string;
}

export const PolicyManagement: React.FC<PolicyManagementProps> = ({
  complianceTemplates,
  policies,
  className = ''
}) => {
  const [selectedView, setSelectedView] = useState<'policies' | 'templates' | 'workflow'>('policies');
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-sov-green/20 text-sov-green';
      case 'draft': return 'bg-sov-gold/20 text-sov-gold';
      case 'review': return 'bg-sov-accent/20 text-sov-accent';
      case 'archived': return 'bg-gray-700 text-gray-300';
      default: return 'bg-gray-700 text-gray-300';
    }
  };

  const getComplianceStandardIcon = (standard: string) => {
    switch (standard) {
      case 'PCI_DSS': return '🔒';
      case 'NACHA': return '🏦';
      case 'AML': return '🛡️';
      case 'SOX': return '📊';
      case 'GDPR': return '🔐';
      default: return '📋';
    }
  };

  const isReviewOverdue = (nextReview: string) => {
    const reviewDate = new Date(nextReview);
    const today = new Date();
    return reviewDate < today;
  };

  const isReviewDueSoon = (nextReview: string) => {
    const reviewDate = new Date(nextReview);
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    return reviewDate >= today && reviewDate <= thirtyDaysFromNow;
  };

  const filteredPolicies = policies.filter(policy => {
    if (selectedCategory !== 'all' && policy.category !== selectedCategory) return false;
    if (selectedStatus !== 'all' && policy.status !== selectedStatus) return false;
    return true;
  });

  const policyStats = {
    total: policies.length,
    active: policies.filter(p => p.status === 'active').length,
    draft: policies.filter(p => p.status === 'draft').length,
    review: policies.filter(p => p.status === 'review').length,
    overdue: policies.filter(p => isReviewOverdue(p.nextReview)).length,
    dueSoon: policies.filter(p => isReviewDueSoon(p.nextReview)).length
  };

  const mockPolicyDetails: Policy = {
    id: 'policy-1',
    name: 'Data Protection Policy',
    version: '2.1',
    status: 'active',
    lastReview: '2024-10-15',
    nextReview: '2025-10-15',
    owner: 'Legal Team',
    category: 'Data Security',
    description: 'Comprehensive policy covering the protection, handling, and processing of personal and sensitive data in compliance with GDPR, CCPA, and other relevant regulations.',
    complianceStandards: ['GDPR', 'CCPA', 'SOX'],
    documentUrl: '/documents/data-protection-policy-v2.1.pdf',
    revisionHistory: [
      {
        version: '2.1',
        date: '2024-10-15',
        changes: 'Updated GDPR compliance sections and added CCPA requirements',
        author: 'Legal Team'
      },
      {
        version: '2.0',
        date: '2024-07-01',
        changes: 'Major revision for cloud data handling procedures',
        author: 'Privacy Officer'
      },
      {
        version: '1.9',
        date: '2024-04-15',
        changes: 'Minor updates to data breach notification procedures',
        author: 'Security Team'
      }
    ]
  };

  return (
    <div className={`bg-sov-dark-alt p-6 rounded-lg shadow-lg border border-gray-700 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-sov-light">Policy Management</h3>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-sov-accent text-sov-dark font-semibold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors"
          >
            Create Policy
          </button>
          <button className="bg-sov-dark-alt border border-gray-600 text-sov-light font-semibold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors">
            Import Policy
          </button>
        </div>
      </div>

      {/* Policy Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <div className="text-center p-3 bg-sov-dark rounded-lg border border-gray-700">
          <div className="text-2xl font-bold text-sov-light">{policyStats.total}</div>
          <div className="text-xs text-sov-light-alt">Total Policies</div>
        </div>
        <div className="text-center p-3 bg-sov-dark rounded-lg border border-gray-700">
          <div className="text-2xl font-bold text-sov-green">{policyStats.active}</div>
          <div className="text-xs text-sov-light-alt">Active</div>
        </div>
        <div className="text-center p-3 bg-sov-dark rounded-lg border border-gray-700">
          <div className="text-2xl font-bold text-sov-gold">{policyStats.draft}</div>
          <div className="text-xs text-sov-light-alt">Draft</div>
        </div>
        <div className="text-center p-3 bg-sov-dark rounded-lg border border-gray-700">
          <div className="text-2xl font-bold text-sov-accent">{policyStats.review}</div>
          <div className="text-xs text-sov-light-alt">In Review</div>
        </div>
        <div className="text-center p-3 bg-sov-dark rounded-lg border border-gray-700">
          <div className="text-2xl font-bold text-sov-red">{policyStats.overdue}</div>
          <div className="text-xs text-sov-light-alt">Review Overdue</div>
        </div>
        <div className="text-center p-3 bg-sov-dark rounded-lg border border-gray-700">
          <div className="text-2xl font-bold text-sov-gold">{policyStats.dueSoon}</div>
          <div className="text-xs text-sov-light-alt">Due Soon</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap border-b border-gray-700 mb-6">
        {[
          { key: 'policies', label: 'Policies', icon: '📋' },
          { key: 'templates', label: 'Templates', icon: '📄' },
          { key: 'workflow', label: 'Workflow', icon: '🔄' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setSelectedView(tab.key as any)}
            className={`flex items-center space-x-2 px-4 py-3 font-semibold transition-colors ${
              selectedView === tab.key
                ? 'text-sov-accent border-b-2 border-sov-accent bg-sov-dark/50'
                : 'text-sov-light-alt hover:text-sov-light hover:bg-sov-dark/25'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Policies Tab */}
      {selectedView === 'policies' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-sov-dark border border-gray-600 text-sov-light px-3 py-2 rounded-lg"
            >
              <option value="all">All Categories</option>
              <option value="Data Security">Data Security</option>
              <option value="Access Control">Access Control</option>
              <option value="Financial">Financial</option>
              <option value="HR">HR</option>
              <option value="Operations">Operations</option>
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-sov-dark border border-gray-600 text-sov-light px-3 py-2 rounded-lg"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="review">In Review</option>
              <option value="archived">Archived</option>
            </select>
            <input
              type="text"
              placeholder="Search policies..."
              className="bg-sov-dark border border-gray-600 text-sov-light px-3 py-2 rounded-lg flex-1 min-w-[200px]"
            />
          </div>

          {/* Policies List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredPolicies.map(policy => {
              const reviewOverdue = isReviewOverdue(policy.nextReview);
              const reviewDueSoon = isReviewDueSoon(policy.nextReview);
              
              return (
                <div 
                  key={policy.id} 
                  className={`p-4 bg-sov-dark rounded-lg border transition-all duration-200 ${
                    reviewOverdue ? 'border-sov-red bg-sov-red/5' :
                    reviewDueSoon ? 'border-sov-gold bg-sov-gold/5' :
                    'border-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold text-sov-light">{policy.name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(policy.status)}`}>
                          {policy.status}
                        </span>
                        {reviewOverdue && (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-sov-red/20 text-sov-red">
                            Overdue
                          </span>
                        )}
                        {reviewDueSoon && !reviewOverdue && (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-sov-gold/20 text-sov-gold">
                            Due Soon
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-sov-light-alt mb-2">Version {policy.version} • {policy.category}</p>
                      <div className="flex items-center space-x-1 text-xs text-sov-light-alt">
                        <span>Owner: {policy.owner}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-sov-light-alt">Last Review:</span>
                      <span className="text-sov-light font-semibold">
                        {new Date(policy.lastReview).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-sov-light-alt">Next Review:</span>
                      <span className={`font-semibold ${
                        reviewOverdue ? 'text-sov-red' :
                        reviewDueSoon ? 'text-sov-gold' : 'text-sov-light'
                      }`}>
                        {new Date(policy.nextReview).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 mb-4">
                    <span className="text-xs text-sov-light-alt">Compliance:</span>
                    {['PCI_DSS', 'NACHA', 'AML', 'SOX'].map(standard => (
                      <span key={standard} className="text-xs">
                        {getComplianceStandardIcon(standard)} {standard.replace('_', ' ')}
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => setSelectedPolicy(mockPolicyDetails)}
                      className="flex-1 bg-sov-accent/10 text-sov-accent font-semibold py-2 px-3 rounded-lg hover:bg-sov-accent/20 transition-colors text-sm"
                    >
                      View Details
                    </button>
                    <button className="bg-sov-dark-alt border border-gray-600 text-sov-light font-semibold py-2 px-3 rounded-lg hover:bg-gray-700 transition-colors text-sm">
                      Edit
                    </button>
                    <button className="bg-sov-dark-alt border border-gray-600 text-sov-light font-semibold py-2 px-3 rounded-lg hover:bg-gray-700 transition-colors text-sm">
                      📋
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {selectedView === 'templates' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-semibold text-sov-light">Compliance Report Templates</h4>
            <button className="bg-sov-accent text-sov-dark font-semibold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors">
              Create Template
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {complianceTemplates.map(template => (
              <div key={template.id} className="p-4 bg-sov-dark rounded-lg border border-gray-700">
                <div className="flex justify-between items-start mb-3">
                  <h5 className="font-semibold text-sov-light">{template.name}</h5>
                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-sov-accent/20 text-sov-accent">
                    {template.regulatoryStandard}
                  </span>
                </div>
                
                <p className="text-sm text-sov-light-alt mb-3">{template.description}</p>
                
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-sov-light-alt">Type:</span>
                    <span className="text-sov-light font-semibold capitalize">{template.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sov-light-alt">Usage Count:</span>
                    <span className="text-sov-light font-semibold">{template.usageCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sov-light-alt">Completion Rate:</span>
                    <span className="text-sov-light font-semibold">{template.completionRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sov-light-alt">Last Used:</span>
                    <span className="text-sov-light font-semibold">
                      {new Date(template.lastUsed).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                  <div 
                    className="bg-sov-accent h-2 rounded-full transition-all duration-500"
                    style={{ width: `${template.completionRate}%` }}
                  ></div>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 bg-sov-accent/10 text-sov-accent font-semibold py-2 px-3 rounded-lg hover:bg-sov-accent/20 transition-colors text-sm">
                    Use Template
                  </button>
                  <button className="bg-sov-dark-alt border border-gray-600 text-sov-light font-semibold py-2 px-3 rounded-lg hover:bg-gray-700 transition-colors text-sm">
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Workflow Tab */}
      {selectedView === 'workflow' && (
        <div className="space-y-6">
          <h4 className="text-lg font-semibold text-sov-light">Policy Workflow & Approval Process</h4>
          
          <div className="bg-sov-dark p-6 rounded-lg border border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-sov-gold/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">📝</span>
                </div>
                <h5 className="font-semibold text-sov-light mb-2">Draft Creation</h5>
                <p className="text-sm text-sov-light-alt">Policy author creates initial draft and assigns reviewers</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-sov-accent/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">👥</span>
                </div>
                <h5 className="font-semibold text-sov-light mb-2">Review & Approval</h5>
                <p className="text-sm text-sov-light-alt">Stakeholders review and provide feedback or approval</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-sov-green/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">✅</span>
                </div>
                <h5 className="font-semibold text-sov-light mb-2">Final Approval</h5>
                <p className="text-sm text-sov-light-alt">Final approval by compliance officer and legal team</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-sov-light/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🚀</span>
                </div>
                <h5 className="font-semibold text-sov-light mb-2">Publication</h5>
                <p className="text-sm text-sov-light-alt">Policy is published and distributed to relevant stakeholders</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-sov-dark p-4 rounded-lg border border-gray-700">
              <h5 className="font-semibold text-sov-light mb-4">Pending Approvals</h5>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-sov-gold/10 border border-sov-gold/20 rounded-lg">
                  <div>
                    <div className="font-semibold text-sov-light">Incident Response Plan</div>
                    <div className="text-sm text-sov-light-alt">Assigned to: Security Team • 3 days pending</div>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-sov-gold/20 text-sov-gold">
                    Review
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-sov-accent/10 border border-sov-accent/20 rounded-lg">
                  <div>
                    <div className="font-semibold text-sov-light">Vendor Management Policy</div>
                    <div className="text-sm text-sov-light-alt">Assigned to: Procurement Team • 1 day pending</div>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-sov-accent/20 text-sov-accent">
                    Review
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-sov-dark p-4 rounded-lg border border-gray-700">
              <h5 className="font-semibold text-sov-light mb-4">Recent Activity</h5>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-sov-green rounded-full"></div>
                  <div className="flex-1">
                    <div className="text-sm text-sov-light">Data Protection Policy v2.1 approved</div>
                    <div className="text-xs text-sov-light-alt">by Legal Team • 2 hours ago</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-sov-accent rounded-full"></div>
                  <div className="flex-1">
                    <div className="text-sm text-sov-light">Access Control Policy review requested</div>
                    <div className="text-xs text-sov-light-alt">by Security Team • 5 hours ago</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-sov-gold rounded-full"></div>
                  <div className="flex-1">
                    <div className="text-sm text-sov-light">New policy template created</div>
                    <div className="text-xs text-sov-light-alt">by Compliance Officer • 1 day ago</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Policy Details Modal */}
      {selectedPolicy && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-sov-dark-alt max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-lg border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold text-sov-light">{selectedPolicy.name}</h3>
                  <p className="text-sov-light-alt">Version {selectedPolicy.version} • {selectedPolicy.category}</p>
                </div>
                <button
                  onClick={() => setSelectedPolicy(null)}
                  className="text-sov-light hover:text-sov-light/80"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-sov-light mb-3">Policy Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-sov-light-alt">Status:</span>
                      <span className={`font-semibold ${getStatusColor(selectedPolicy.status)}`}>
                        {selectedPolicy.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sov-light-alt">Owner:</span>
                      <span className="text-sov-light font-semibold">{selectedPolicy.owner}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sov-light-alt">Last Review:</span>
                      <span className="text-sov-light font-semibold">
                        {new Date(selectedPolicy.lastReview).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sov-light-alt">Next Review:</span>
                      <span className="text-sov-light font-semibold">
                        {new Date(selectedPolicy.nextReview).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <h4 className="font-semibold text-sov-light mb-3 mt-6">Description</h4>
                  <p className="text-sm text-sov-light-alt">{selectedPolicy.description}</p>

                  <h4 className="font-semibold text-sov-light mb-3 mt-6">Compliance Standards</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPolicy.complianceStandards.map(standard => (
                      <span 
                        key={standard}
                        className="px-3 py-1 bg-sov-accent/20 text-sov-accent rounded-full text-sm font-semibold"
                      >
                        {getComplianceStandardIcon(standard)} {standard}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-sov-light mb-3">Revision History</h4>
                  <div className="space-y-3">
                    {selectedPolicy.revisionHistory.map((revision, index) => (
                      <div key={index} className="p-3 bg-sov-dark rounded-lg border border-gray-700">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold text-sov-light">Version {revision.version}</span>
                          <span className="text-sm text-sov-light-alt">
                            {new Date(revision.date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-sov-light-alt mb-1">{revision.changes}</p>
                        <p className="text-xs text-sov-light-alt">By: {revision.author}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-700">
                <button className="bg-sov-accent text-sov-dark font-semibold py-2 px-4 rounded-lg hover:bg-sov-accent-hover transition-colors">
                  Edit Policy
                </button>
                <button className="bg-sov-dark-alt border border-gray-600 text-sov-light font-semibold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors">
                  Download PDF
                </button>
                <button className="bg-sov-dark-alt border border-gray-600 text-sov-light font-semibold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors">
                  Request Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
