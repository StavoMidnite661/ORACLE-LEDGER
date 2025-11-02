/**
 * Compliance Training Service
 * 
 * Manages comprehensive compliance training and certification programs for ORACLE-LEDGER
 * Stripe integration with tracking, analytics, and integration with regulatory requirements.
 * 
 * Features:
 * - Training program lifecycle management
 * - Course creation and content management
 * - Progress tracking and analytics
 * - Certification and assessment management
 * - Integration with regulatory requirements
 * - Training compliance reporting
 * - Automated scheduling and reminders
 * - Performance analytics and insights
 */

import { regulatoryManagementService } from './regulatoryManagementService';
import { policyManagementService } from './policyManagementService';

// Types and Interfaces
export interface TrainingProgram {
  id: string;
  title: string;
  description: string;
  category: 'Data Protection' | 'Security' | 'Financial Controls' | 'Operational' | 'HR' | 'Legal' | 'General';
  type: 'Onboarding' | 'Annual' | 'Role-Specific' | 'Regulatory' | 'Policy Update' | 'Incident Response';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Draft' | 'Active' | 'Paused' | 'Archived';
  version: string;
  effectiveDate: string;
  expiryDate?: string;
  duration: number; // in minutes
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  format: 'Online' | 'Instructor-Led' | 'Hybrid' | 'Self-Paced' | 'Assessment Only';
  language: string;
  estimatedCost: number;
  prerequisites: string[];
  objectives: string[];
  targetAudience: TargetAudience[];
  course: TrainingCourse;
  assessment: TrainingAssessment;
  requirements: ProgramRequirementMapping[];
  analytics: ProgramAnalytics;
  metadata: ProgramMetadata;
  createdBy: string;
  createdDate: string;
  lastUpdated: string;
  nextReviewDate: string;
}

export interface TargetAudience {
  department: string;
  role: string;
  level: 'All Levels' | 'Junior' | 'Mid-Level' | 'Senior' | 'Management' | 'Executive';
  mandatory: boolean;
  autoEnroll: boolean;
}

export interface TrainingCourse {
  id: string;
  modules: TrainingModule[];
  resources: TrainingResource[];
  interactiveElements: InteractiveElement[];
  completionCriteria: CompletionCriteria;
  accessibility: AccessibilityOptions;
  customBranding: {
    logo?: string;
    colors: {
      primary: string;
      secondary: string;
    };
    font: string;
  };
}

export interface TrainingModule {
  id: string;
  title: string;
  description: string;
  order: number;
  duration: number; // minutes
  type: 'Video' | 'Interactive' | 'Reading' | 'Simulation' | 'Quiz' | 'Case Study';
  content: ModuleContent;
  resources: ModuleResource[];
  assessment?: ModuleAssessment;
  prerequisites: string[];
}

export interface ModuleContent {
  video?: {
    url: string;
    duration: number;
    transcript: string;
    captions: boolean;
    quality: '720p' | '1080p' | '4K';
  };
  slides?: {
    slideCount: number;
    format: 'PowerPoint' | 'PDF' | 'HTML';
    url: string;
  };
  text?: {
    content: string;
    format: 'HTML' | 'Markdown' | 'Plain Text';
    wordCount: number;
  };
  interactive?: {
    type: 'Drag Drop' | 'Hotspot' | 'Timeline' | 'Branching';
    scenarios: Array<{
      title: string;
      content: string;
      choices: Array<{
        text: string;
        correct: boolean;
        feedback: string;
      }>;
    }>;
  };
  simulation?: {
    type: 'System Demo' | 'Process Walkthrough' | 'Incident Response';
    scenarios: Array<{
      name: string;
      description: string;
      steps: SimulationStep[];
    }>;
  };
}

export interface ModuleResource {
  id: string;
  title: string;
  type: 'Document' | 'Video' | 'Link' | 'Tool' | 'Template';
  url?: string;
  description: string;
  downloadable: boolean;
  external: boolean;
}

export interface ModuleAssessment {
  type: 'Quiz' | 'Scenario' | 'Practical' | 'Project';
  questions: AssessmentQuestion[];
  passingScore: number;
  maxAttempts: number;
  timeLimit?: number; // minutes
  randomization: boolean;
  feedback: {
    immediate: boolean;
    detailed: boolean;
    showCorrectAnswers: boolean;
  };
}

export interface AssessmentQuestion {
  id: string;
  type: 'Multiple Choice' | 'True/False' | 'Short Answer' | 'Essay' | 'Drag Drop' | 'Matching';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  points: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  media?: {
    type: 'image' | 'video' | 'audio';
    url: string;
    altText?: string;
  };
}

export interface TrainingResource {
  id: string;
  title: string;
  type: 'Guide' | 'Checklist' | 'Template' | 'Tool' | 'Reference' | 'Policy Document';
  url?: string;
  description: string;
  category: string;
  tags: string[];
  downloadCount: number;
  lastUpdated: string;
  version: string;
}

export interface InteractiveElement {
  id: string;
  type: 'Quiz' | 'Poll' | 'Discussion' | 'Assignment' | 'Simulation';
  title: string;
  description: string;
  configuration: any;
  required: boolean;
  points: number;
}

export interface CompletionCriteria {
  minimumScore: number;
  requiredModules: string[];
  requiredAssessments: string[];
  timeRequirement: number; // minutes
  participationRequirement: {
    discussionPosts: number;
    assignments: number;
  };
}

export interface AccessibilityOptions {
  subtitles: boolean;
  transcripts: boolean;
  screenReaderCompatible: boolean;
  keyboardNavigation: boolean;
  highContrast: boolean;
  fontSize: boolean;
  colorBlindFriendly: boolean;
}

export interface TrainingAssessment {
  id: string;
  type: 'Pre-Assessment' | 'Post-Assessment' | 'Final Assessment' | 'Certification';
  title: string;
  description: string;
  timeLimit?: number;
  passingScore: number;
  maxAttempts: number;
  questions: AssessmentQuestion[];
  randomizeQuestions: boolean;
  showResults: 'immediate' | 'after_submission' | 'manual_review';
  certificateTemplate?: CertificateTemplate;
}

export interface CertificateTemplate {
  id: string;
  title: string;
  template: string;
  fields: Array<{
    name: string;
    source: 'user_data' | 'course_data' | 'system_data';
    format?: string;
  }>;
  signature?: {
    required: boolean;
    type: 'Digital' | 'Physical';
  };
}

export interface ProgramRequirementMapping {
  requirementId: string;
  requirementCode: string;
  requirementTitle: string;
  mappingType: 'Direct' | 'Supporting' | 'Reference' | 'Assessment';
  complianceWeight: number; // 0-100 percentage
  evidence: ProgramEvidence[];
  lastAssessment: string;
  nextAssessment: string;
}

export interface ProgramEvidence {
  id: string;
  requirementId: string;
  type: 'Completion Certificate' | 'Assessment Score' | 'Attendance Record' | 'Training Record';
  source: string;
  status: 'Pending' | 'Verified' | 'Expired';
  uploadDate: string;
  verificationDate?: string;
  verifiedBy?: string;
  expiryDate?: string;
  description?: string;
}

export interface ProgramAnalytics {
  enrollmentCount: number;
  completionRate: number;
  averageScore: number;
  averageTimeToComplete: number;
  dropOffRate: number;
  satisfactionScore: number;
  effectivenessRating: number;
  lastCalculated: string;
  trends: {
    enrollmentTrend: 'increasing' | 'stable' | 'decreasing';
    completionTrend: 'improving' | 'stable' | 'declining';
    satisfactionTrend: 'improving' | 'stable' | 'declining';
  };
  metrics: {
    totalParticipants: number;
    completedParticipants: number;
    passedAssessments: number;
    failedAssessments: number;
    averageAttempts: number;
  };
  demographics: {
    byDepartment: Array<{
      department: string;
      enrolled: number;
      completed: number;
      completionRate: number;
    }>;
    byRole: Array<{
      role: string;
      enrolled: number;
      completed: number;
      completionRate: number;
    }>;
    byLevel: Array<{
      level: string;
      enrolled: number;
      completed: number;
      completionRate: number;
    }>;
  };
}

export interface ProgramMetadata {
  version: string;
  language: string;
  tags: string[];
  customFields: Record<string, any>;
  relatedPrograms: string[];
  prerequisites: string[];
  estimatedCost: number;
  actualCost?: number;
  instructor?: string;
  supportContact: string;
}

export interface TrainingEnrollment {
  id: string;
  userId: string;
  programId: string;
  enrollmentDate: string;
  status: 'Enrolled' | 'In Progress' | 'Completed' | 'Failed' | 'Expired' | 'Withdrawn';
  progress: EnrollmentProgress;
  assessmentResults: AssessmentResult[];
  certificate?: TrainingCertificate;
  completionDate?: string;
  dueDate?: string;
  assignedBy?: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  tags: string[];
  notes?: string;
  lastActivity: string;
  timeSpent: number; // minutes
  attempts: number;
}

export interface EnrollmentProgress {
  overallPercentage: number;
  modulesCompleted: number;
  totalModules: number;
  assessmentsCompleted: number;
  totalAssessments: number;
  timeSpent: number; // minutes
  lastAccessed: string;
  bookmarkPosition?: string;
  moduleProgress: Array<{
    moduleId: string;
    completed: boolean;
    score?: number;
    timeSpent: number;
    attempts: number;
    lastAccessed: string;
    bookmark?: string;
  }>;
}

export interface AssessmentResult {
  assessmentId: string;
  assessmentTitle: string;
  attempt: number;
  score: number;
  maximumScore: number;
  percentage: number;
  passed: boolean;
  timeSpent: number; // minutes
  attemptedAt: string;
  answers: QuestionAnswer[];
  feedback?: string;
}

export interface QuestionAnswer {
  questionId: string;
  question: string;
  userAnswer: string | string[];
  correctAnswer: string | string[];
  correct: boolean;
  pointsEarned: number;
  pointsPossible: number;
  timeSpent: number; // seconds
}

export interface TrainingCertificate {
  id: string;
  programId: string;
  userId: string;
  title: string;
  issuedDate: string;
  expiryDate?: string;
  certificateNumber: string;
  verificationCode: string;
  template: string;
  metadata: CertificateMetadata;
  digitalSignature?: {
    signed: boolean;
    signedBy?: string;
    signedAt?: string;
  };
}

export interface CertificateMetadata {
  version: string;
  issuer: string;
  instructor?: string;
  score: number;
  completionDate: string;
  validityPeriod?: number; // months
  requirements: string[];
  verificationUrl?: string;
}

export interface TrainingSchedule {
  id: string;
  programId: string;
  title: string;
  type: 'Instructor-Led' | 'Virtual Classroom' | 'Webinar' | 'Workshop';
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  timezone: string;
  location?: {
    type: 'Physical' | 'Virtual' | 'Hybrid';
    address?: string;
    room?: string;
    meetingUrl?: string;
  };
  instructor: string;
  capacity: number;
  enrolledCount: number;
  waitlistCount: number;
  status: 'Scheduled' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled';
  prerequisites: string[];
  materials: string[];
  registrationDeadline?: string;
  cancellationPolicy: string;
  reminderSettings: {
    enabled: boolean;
    daysBefore: number[];
    sendTo: 'participants' | 'instructor' | 'both';
  };
}

export interface TrainingAssignment {
  id: string;
  programId: string;
  title: string;
  description: string;
  type: 'Individual' | 'Group' | 'Project' | 'Case Study';
  dueDate: string;
  points: number;
  submissionType: 'File Upload' | 'Text Entry' | 'External Link' | 'Presentation';
  requirements: string[];
  rubric?: AssignmentRubric;
  peerReview?: {
    enabled: boolean;
    reviewCount: number;
  };
  status: 'Open' | 'Closed' | 'Graded';
}

export interface AssignmentRubric {
  criteria: Array<{
    name: string;
    description: string;
    levels: Array<{
      name: string;
      description: string;
      points: number;
    }>;
  }>;
}

export interface TrainingReminder {
  id: string;
  enrollmentId: string;
  type: 'Enrollment' | 'Deadline' | 'Assessment' | 'Completion' | 'Expiry';
  message: string;
  scheduledDate: string;
  sentDate?: string;
  status: 'Scheduled' | 'Sent' | 'Failed' | 'Cancelled';
  recipient: string;
  channel: 'Email' | 'SMS' | 'Push Notification' | 'In-App';
  priority: 'High' | 'Normal' | 'Low';
}

export interface TrainingAnalytics {
  overview: {
    totalPrograms: number;
    activeEnrollments: number;
    completedTrainings: number;
    averageCompletionTime: number;
    overallCompletionRate: number;
    certificationRate: number;
  };
  participation: {
    byDepartment: Array<{
      department: string;
      enrolled: number;
      completed: number;
      completionRate: number;
    }>;
    byRole: Array<{
      role: string;
      enrolled: number;
      completed: number;
      completionRate: number;
    }>;
    byProgram: Array<{
      programId: string;
      programTitle: string;
      enrolled: number;
      completed: number;
      completionRate: number;
      averageScore: number;
    }>;
  };
  effectiveness: {
    prePostAssessmentComparison: Array<{
      programId: string;
      programTitle: string;
      preAssessmentScore: number;
      postAssessmentScore: number;
      improvement: number;
    }>;
    knowledgeRetention: Array<{
      programId: string;
      immediateScore: number;
      followUpScore: number;
      retentionRate: number;
    }>;
    behaviorChange: Array<{
      metric: string;
      baseline: number;
      current: number;
      change: number;
    }>;
  };
  trends: {
    enrollmentTrend: Array<{
      month: string;
      enrollments: number;
      completions: number;
    }>;
    completionTrend: Array<{
      month: string;
      completionRate: number;
      averageScore: number;
    }>;
    satisfactionTrend: Array<{
      month: string;
      satisfactionScore: number;
      responseRate: number;
    }>;
  };
  compliance: {
    mandatoryTrainingCompliance: Array<{
      requirement: string;
      requiredCount: number;
      completedCount: number;
      complianceRate: number;
      overdueCount: number;
    }>;
    certificationStatus: Array<{
      programId: string;
      programTitle: string;
      totalCertificates: number;
      validCertificates: number;
      expiredCertificates: number;
      upcomingExpirations: number;
    }>;
  };
}

// Service Class
export class ComplianceTrainingService {
  private programs: TrainingProgram[] = [];
  private enrollments: TrainingEnrollment[] = [];
  private schedules: TrainingSchedule[] = [];
  private assignments: TrainingAssignment[] = [];
  private reminders: TrainingReminder[] = [];

  constructor() {
    this.initializeMockData();
  }

  /**
   * Initialize mock data for development and demonstration
   */
  private initializeMockData(): void {
    // Mock training programs
    this.programs = [
      {
        id: 'program-gdpr-001',
        title: 'GDPR Data Protection Fundamentals',
        description: 'Comprehensive training on GDPR requirements, data protection principles, and compliance obligations',
        category: 'Data Protection',
        type: 'Regulatory',
        priority: 'Critical',
        status: 'Active',
        version: '2.1.0',
        effectiveDate: '2024-01-01',
        duration: 120,
        difficulty: 'Intermediate',
        format: 'Online',
        language: 'en',
        estimatedCost: 50,
        prerequisites: [],
        objectives: [
          'Understand GDPR fundamental principles',
          'Learn data subject rights implementation',
          'Master data breach response procedures',
          'Apply privacy by design principles'
        ],
        targetAudience: [
          {
            department: 'All Departments',
            role: 'All Roles',
            level: 'All Levels',
            mandatory: true,
            autoEnroll: true
          }
        ],
        course: {
          id: 'course-gdpr-001',
          modules: [
            {
              id: 'module-1',
              title: 'GDPR Overview and Principles',
              description: 'Introduction to GDPR scope and fundamental principles',
              order: 1,
              duration: 30,
              type: 'Video',
              content: {
                video: {
                  url: 'https://example.com/gdpr-overview.mp4',
                  duration: 1800,
                  transcript: 'GDPR overview transcript...',
                  captions: true,
                  quality: '1080p'
                }
              },
              resources: [],
              prerequisites: []
            },
            {
              id: 'module-2',
              title: 'Data Subject Rights',
              description: 'Understanding and implementing data subject rights',
              order: 2,
              duration: 40,
              type: 'Interactive',
              content: {
                interactive: {
                  type: 'Branching',
                  scenarios: [
                    {
                      title: 'Data Access Request',
                      content: 'A customer requests access to their personal data...',
                      choices: [
                        { text: 'Provide all data within 30 days', correct: true, feedback: 'Correct' },
                        { text: 'Ignore the request', correct: false, feedback: 'Incorrect' }
                      ]
                    }
                  ]
                }
              },
              resources: [],
              prerequisites: ['module-1']
            }
          ],
          resources: [
            {
              id: 'resource-1',
              title: 'GDPR Quick Reference Guide',
              type: 'Guide',
              description: 'Quick reference for GDPR compliance',
              category: 'Reference',
              tags: ['GDPR', 'Data Protection'],
              downloadCount: 150,
              lastUpdated: '2024-10-01',
              version: '2.1'
            }
          ],
          interactiveElements: [],
          completionCriteria: {
            minimumScore: 80,
            requiredModules: ['module-1', 'module-2'],
            requiredAssessments: ['assessment-1'],
            timeRequirement: 120,
            participationRequirement: {
              discussionPosts: 0,
              assignments: 0
            }
          },
          accessibility: {
            subtitles: true,
            transcripts: true,
            screenReaderCompatible: true,
            keyboardNavigation: true,
            highContrast: true,
            fontSize: true,
            colorBlindFriendly: true
          },
          customBranding: {
            colors: {
              primary: '#1e40af',
              secondary: '#3b82f6'
            },
            font: 'Arial'
          }
        },
        assessment: {
          id: 'assessment-gdpr-001',
          type: 'Post-Assessment',
          title: 'GDPR Knowledge Assessment',
          description: 'Final assessment for GDPR training',
          passingScore: 80,
          maxAttempts: 3,
          questions: [
            {
              id: 'q1',
              type: 'Multiple Choice',
              question: 'What is the maximum time to respond to a data subject access request?',
              options: ['30 days', '60 days', '90 days', 'No limit'],
              correctAnswer: '30 days',
              explanation: 'GDPR requires response within one month of request',
              points: 1,
              difficulty: 'Easy',
              tags: ['Data Subject Rights']
            }
          ],
          randomizeQuestions: true,
          showResults: 'immediate'
        },
        requirements: [
          {
            requirementId: 'req-gdpr-32',
            requirementCode: 'GDPR Art. 32',
            requirementTitle: 'Security of processing',
            mappingType: 'Direct',
            complianceWeight: 100,
            evidence: [
              {
                id: 'evidence-1',
                requirementId: 'req-gdpr-32',
                type: 'Completion Certificate',
                source: 'program-gdpr-001',
                status: 'Verified',
                uploadDate: '2024-11-01',
                verificationDate: '2024-11-01',
                verifiedBy: 'Training System',
                description: 'GDPR training completion certificate'
              }
            ],
            lastAssessment: '2024-11-01',
            nextAssessment: '2025-11-01'
          }
        ],
        analytics: {
          enrollmentCount: 150,
          completionRate: 87.5,
          averageScore: 84.2,
          averageTimeToComplete: 115,
          dropOffRate: 12.5,
          satisfactionScore: 4.3,
          effectivenessRating: 4.1,
          lastCalculated: '2024-11-01',
          trends: {
            enrollmentTrend: 'increasing',
            completionTrend: 'improving',
            satisfactionTrend: 'stable'
          },
          metrics: {
            totalParticipants: 150,
            completedParticipants: 131,
            passedAssessments: 118,
            failedAssessments: 13,
            averageAttempts: 1.2
          },
          demographics: {
            byDepartment: [
              { department: 'Engineering', enrolled: 45, completed: 42, completionRate: 93.3 },
              { department: 'Sales', enrolled: 35, completed: 28, completionRate: 80.0 },
              { department: 'Marketing', enrolled: 30, completed: 26, completionRate: 86.7 }
            ],
            byRole: [
              { role: 'Developer', enrolled: 40, completed: 37, completionRate: 92.5 },
              { role: 'Manager', enrolled: 25, completed: 22, completionRate: 88.0 },
              { role: 'Analyst', enrolled: 35, completed: 30, completionRate: 85.7 }
            ],
            byLevel: [
              { level: 'Junior', enrolled: 50, completed: 45, completionRate: 90.0 },
              { level: 'Mid-Level', enrolled: 60, completed: 52, completionRate: 86.7 },
              { level: 'Senior', enrolled: 40, completed: 34, completionRate: 85.0 }
            ]
          }
        },
        metadata: {
          version: '2.1.0',
          language: 'en',
          tags: ['GDPR', 'Data Protection', 'Privacy', 'EU'],
          customFields: {
            regulatoryBody: 'European Data Protection Board',
            complianceStandard: 'GDPR'
          },
          relatedPrograms: ['program-ccpa-001', 'program-pci-dss-001'],
          prerequisites: [],
          estimatedCost: 50,
          instructor: 'Privacy Team',
          supportContact: 'training@oracleledger.com'
        },
        createdBy: 'Privacy Officer',
        createdDate: '2024-01-01',
        lastUpdated: '2024-10-15',
        nextReviewDate: '2025-01-01'
      }
    ];

    // Mock enrollments
    this.enrollments = [
      {
        id: 'enrollment-001',
        userId: 'user-123',
        programId: 'program-gdpr-001',
        enrollmentDate: '2024-10-15',
        status: 'In Progress',
        progress: {
          overallPercentage: 65,
          modulesCompleted: 1,
          totalModules: 2,
          assessmentsCompleted: 0,
          totalAssessments: 1,
          timeSpent: 75,
          lastAccessed: '2024-11-01',
          moduleProgress: [
            {
              moduleId: 'module-1',
              completed: true,
              score: 95,
              timeSpent: 35,
              attempts: 1,
              lastAccessed: '2024-10-16'
            },
            {
              moduleId: 'module-2',
              completed: false,
              timeSpent: 40,
              attempts: 1,
              lastAccessed: '2024-11-01'
            }
          ]
        },
        assessmentResults: [],
        dueDate: '2024-12-15',
        assignedBy: 'Compliance Officer',
        priority: 'High',
        tags: ['mandatory', 'regulatory'],
        lastActivity: '2024-11-01',
        timeSpent: 75,
        attempts: 0
      }
    ];

    // Mock schedules
    this.schedules = [
      {
        id: 'schedule-001',
        programId: 'program-gdpr-001',
        title: 'GDPR Training Workshop - November 2024',
        type: 'Virtual Classroom',
        startDate: '2024-11-15',
        endDate: '2024-11-15',
        startTime: '09:00',
        endTime: '11:00',
        timezone: 'UTC',
        location: {
          type: 'Virtual',
          meetingUrl: 'https://meet.oracleledger.com/gdpr-workshop'
        },
        instructor: 'Privacy Officer',
        capacity: 50,
        enrolledCount: 32,
        waitlistCount: 5,
        status: 'Scheduled',
        prerequisites: [],
        materials: ['GDPR Workshop Slides', 'Case Studies'],
        registrationDeadline: '2024-11-13',
        cancellationPolicy: 'Free cancellation up to 24 hours before',
        reminderSettings: {
          enabled: true,
          daysBefore: [7, 3, 1],
          sendTo: 'participants'
        }
      }
    ];
  }

  /**
   * Get all training programs with filtering
   */
  async getPrograms(options?: {
    category?: string;
    status?: string;
    type?: string;
    priority?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    programs: TrainingProgram[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    let filteredPrograms = [...this.programs];

    if (options?.category) {
      filteredPrograms = filteredPrograms.filter(program => program.category === options.category);
    }

    if (options?.status) {
      filteredPrograms = filteredPrograms.filter(program => program.status === options.status);
    }

    if (options?.type) {
      filteredPrograms = filteredPrograms.filter(program => program.type === options.type);
    }

    if (options?.priority) {
      filteredPrograms = filteredPrograms.filter(program => program.priority === options.priority);
    }

    if (options?.search) {
      const searchLower = options.search.toLowerCase();
      filteredPrograms = filteredPrograms.filter(program =>
        program.title.toLowerCase().includes(searchLower) ||
        program.description.toLowerCase().includes(searchLower) ||
        program.metadata.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Sort by last updated
    filteredPrograms.sort((a, b) => 
      new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    );

    // Pagination
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPrograms = filteredPrograms.slice(startIndex, endIndex);

    return {
      programs: paginatedPrograms,
      total: filteredPrograms.length,
      page,
      totalPages: Math.ceil(filteredPrograms.length / limit)
    };
  }

  /**
   * Get training program by ID
   */
  async getProgramById(id: string): Promise<TrainingProgram | null> {
    return this.programs.find(program => program.id === id) || null;
  }

  /**
   * Create new training program
   */
  async createProgram(program: Omit<TrainingProgram, 'id' | 'analytics' | 'createdDate' | 'lastUpdated'>): Promise<TrainingProgram> {
    const newProgram: TrainingProgram = {
      ...program,
      id: this.generateId('program'),
      analytics: {
        enrollmentCount: 0,
        completionRate: 0,
        averageScore: 0,
        averageTimeToComplete: 0,
        dropOffRate: 0,
        satisfactionScore: 0,
        effectivenessRating: 0,
        lastCalculated: new Date().toISOString(),
        trends: {
          enrollmentTrend: 'stable',
          completionTrend: 'stable',
          satisfactionTrend: 'stable'
        },
        metrics: {
          totalParticipants: 0,
          completedParticipants: 0,
          passedAssessments: 0,
          failedAssessments: 0,
          averageAttempts: 0
        },
        demographics: {
          byDepartment: [],
          byRole: [],
          byLevel: []
        }
      },
      createdDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    this.programs.push(newProgram);
    return newProgram;
  }

  /**
   * Enroll user in training program
   */
  async enrollUser(userId: string, programId: string, options?: {
    assignedBy?: string;
    dueDate?: string;
    priority?: 'Critical' | 'High' | 'Medium' | 'Low';
  }): Promise<TrainingEnrollment> {
    const program = this.programs.find(p => p.id === programId);
    if (!program) {
      throw new Error('Training program not found');
    }

    // Check if already enrolled
    const existingEnrollment = this.enrollments.find(e => e.userId === userId && e.programId === programId);
    if (existingEnrollment) {
      throw new Error('User already enrolled in this program');
    }

    const enrollment: TrainingEnrollment = {
      id: this.generateId('enrollment'),
      userId,
      programId,
      enrollmentDate: new Date().toISOString(),
      status: 'Enrolled',
      progress: {
        overallPercentage: 0,
        modulesCompleted: 0,
        totalModules: program.course.modules.length,
        assessmentsCompleted: 0,
        totalAssessments: 1,
        timeSpent: 0,
        lastAccessed: new Date().toISOString(),
        moduleProgress: program.course.modules.map(module => ({
          moduleId: module.id,
          completed: false,
          timeSpent: 0,
          attempts: 0,
          lastAccessed: ''
        }))
      },
      assessmentResults: [],
      dueDate: options?.dueDate,
      assignedBy: options?.assignedBy,
      priority: options?.priority || 'Medium',
      tags: [program.type.toLowerCase()],
      lastActivity: new Date().toISOString(),
      timeSpent: 0,
      attempts: 0
    };

    this.enrollments.push(enrollment);

    // Update program analytics
    program.analytics.enrollmentCount += 1;
    program.analytics.metrics.totalParticipants += 1;
    program.analytics.lastCalculated = new Date().toISOString();

    return enrollment;
  }

  /**
   * Get user enrollments
   */
  async getUserEnrollments(userId: string, options?: {
    status?: string;
    programId?: string;
  }): Promise<TrainingEnrollment[]> {
    let filteredEnrollments = this.enrollments.filter(enrollment => enrollment.userId === userId);

    if (options?.status) {
      filteredEnrollments = filteredEnrollments.filter(enrollment => enrollment.status === options.status);
    }

    if (options?.programId) {
      filteredEnrollments = filteredEnrollments.filter(enrollment => enrollment.programId === options.programId);
    }

    return filteredEnrollments.sort((a, b) => 
      new Date(b.enrollmentDate).getTime() - new Date(a.enrollmentDate).getTime()
    );
  }

  /**
   * Update enrollment progress
   */
  async updateEnrollmentProgress(enrollmentId: string, progress: {
    moduleId?: string;
    completed?: boolean;
    score?: number;
    timeSpent?: number;
    bookmark?: string;
  }): Promise<TrainingEnrollment | null> {
    const enrollment = this.enrollments.find(e => e.id === enrollmentId);
    if (!enrollment) return null;

    const moduleIndex = enrollment.progress.moduleProgress.findIndex(mp => mp.moduleId === progress.moduleId);
    if (moduleIndex !== -1 && progress.moduleId) {
      enrollment.progress.moduleProgress[moduleIndex] = {
        ...enrollment.progress.moduleProgress[moduleIndex],
        completed: progress.completed ?? enrollment.progress.moduleProgress[moduleIndex].completed,
        score: progress.score ?? enrollment.progress.moduleProgress[moduleIndex].score,
        timeSpent: (progress.timeSpent ?? 0) + enrollment.progress.moduleProgress[moduleIndex].timeSpent,
        attempts: enrollment.progress.moduleProgress[moduleIndex].attempts + 1,
        lastAccessed: new Date().toISOString(),
        bookmark: progress.bookmark
      };
    }

    // Recalculate overall progress
    const completedModules = enrollment.progress.moduleProgress.filter(mp => mp.completed).length;
    enrollment.progress.modulesCompleted = completedModules;
    enrollment.progress.overallPercentage = Math.round((completedModules / enrollment.progress.totalModules) * 100);
    enrollment.progress.timeSpent = enrollment.progress.moduleProgress.reduce((total, mp) => total + mp.timeSpent, 0);
    enrollment.progress.lastAccessed = new Date().toISOString();
    enrollment.lastActivity = new Date().toISOString();
    enrollment.timeSpent = enrollment.progress.timeSpent;

    // Update status based on progress
    if (enrollment.progress.overallPercentage === 100) {
      enrollment.status = 'Completed';
      enrollment.completionDate = new Date().toISOString();
    } else if (enrollment.progress.overallPercentage > 0) {
      enrollment.status = 'In Progress';
    }

    return enrollment;
  }

  /**
   * Get training analytics overview
   */
  async getTrainingAnalytics(): Promise<TrainingAnalytics> {
    const activeEnrollments = this.enrollments.filter(e => e.status === 'In Progress').length;
    const completedTrainings = this.enrollments.filter(e => e.status === 'Completed').length;
    const totalPrograms = this.programs.filter(p => p.status === 'Active').length;

    const overallCompletionRate = this.enrollments.length > 0 
      ? (completedTrainings / this.enrollments.length) * 100 
      : 0;

    const averageCompletionTime = this.enrollments
      .filter(e => e.completionDate)
      .reduce((total, e) => {
        const start = new Date(e.enrollmentDate);
        const end = new Date(e.completionDate!);
        return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24); // days
      }, 0) / Math.max(1, this.enrollments.filter(e => e.completionDate).length);

    // Group by department
    const departmentGroups = this.enrollments.reduce((acc, enrollment) => {
      // Mock department assignment for demo
      const department = enrollment.userId.includes('eng') ? 'Engineering' : 
                        enrollment.userId.includes('sales') ? 'Sales' : 'Marketing';
      
      if (!acc[department]) {
        acc[department] = { enrolled: 0, completed: 0 };
      }
      acc[department].enrolled += 1;
      if (enrollment.status === 'Completed') {
        acc[department].completed += 1;
      }
      return acc;
    }, {} as Record<string, { enrolled: number; completed: number }>);

    const byDepartment = Object.entries(departmentGroups).map(([department, data]) => ({
      department,
      enrolled: data.enrolled,
      completed: data.completed,
      completionRate: data.enrolled > 0 ? (data.completed / data.enrolled) * 100 : 0
    }));

    // Group by program
    const programGroups = this.enrollments.reduce((acc, enrollment) => {
      if (!acc[enrollment.programId]) {
        acc[enrollment.programId] = { enrolled: 0, completed: 0, scores: [] };
      }
      acc[enrollment.programId].enrolled += 1;
      if (enrollment.status === 'Completed') {
        acc[enrollment.programId].completed += 1;
      }
      // Mock average score calculation
      acc[enrollment.programId].scores.push(85); // Mock score
      return acc;
    }, {} as Record<string, { enrolled: number; completed: number; scores: number[] }>);

    const byProgram = Object.entries(programGroups).map(([programId, data]) => {
      const program = this.programs.find(p => p.id === programId);
      return {
        programId,
        programTitle: program?.title || 'Unknown Program',
        enrolled: data.enrolled,
        completed: data.completed,
        completionRate: data.enrolled > 0 ? (data.completed / data.enrolled) * 100 : 0,
        averageScore: data.scores.length > 0 ? data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length : 0
      };
    });

    return {
      overview: {
        totalPrograms,
        activeEnrollments,
        completedTrainings,
        averageCompletionTime: Math.round(averageCompletionTime),
        overallCompletionRate: Math.round(overallCompletionRate * 10) / 10,
        certificationRate: Math.round(overallCompletionRate * 0.8 * 10) / 10 // 80% of completions get certified
      },
      participation: {
        byDepartment,
        byRole: [], // Would need user role data
        byProgram
      },
      effectiveness: {
        prePostAssessmentComparison: this.programs.slice(0, 3).map(program => ({
          programId: program.id,
          programTitle: program.title,
          preAssessmentScore: 65,
          postAssessmentScore: 85,
          improvement: 20
        })),
        knowledgeRetention: this.programs.slice(0, 3).map(program => ({
          programId: program.id,
          immediateScore: 85,
          followUpScore: 78,
          retentionRate: 91.8
        })),
        behaviorChange: [
          { metric: 'Security Incidents', baseline: 10, current: 6, change: -40 },
          { metric: 'Compliance Violations', baseline: 5, current: 2, change: -60 }
        ]
      },
      trends: {
        enrollmentTrend: [
          { month: '2024-08', enrollments: 45, completions: 38 },
          { month: '2024-09', enrollments: 52, completions: 44 },
          { month: '2024-10', enrollments: 48, completions: 41 },
          { month: '2024-11', enrollments: 55, completions: 47 }
        ],
        completionTrend: [
          { month: '2024-08', completionRate: 84.4, averageScore: 82.1 },
          { month: '2024-09', completionRate: 84.6, averageScore: 83.5 },
          { month: '2024-10', completionRate: 85.4, averageScore: 84.2 },
          { month: '2024-11', completionRate: 85.5, averageScore: 84.7 }
        ],
        satisfactionTrend: [
          { month: '2024-08', satisfactionScore: 4.1, responseRate: 78 },
          { month: '2024-09', satisfactionScore: 4.2, responseRate: 81 },
          { month: '2024-10', satisfactionScore: 4.3, responseRate: 83 },
          { month: '2024-11', satisfactionScore: 4.3, responseRate: 85 }
        ]
      },
      compliance: {
        mandatoryTrainingCompliance: [
          {
            requirement: 'GDPR Training',
            requiredCount: 150,
            completedCount: 131,
            complianceRate: 87.3,
            overdueCount: 12
          },
          {
            requirement: 'PCI-DSS Training',
            requiredCount: 45,
            completedCount: 42,
            complianceRate: 93.3,
            overdueCount: 2
          }
        ],
        certificationStatus: [
          {
            programId: 'program-gdpr-001',
            programTitle: 'GDPR Data Protection Fundamentals',
            totalCertificates: 118,
            validCertificates: 115,
            expiredCertificates: 2,
            upcomingExpirations: 5
          }
        ]
      }
    };
  }

  /**
   * Generate training compliance report
   */
  async generateTrainingComplianceReport(options: {
    startDate: string;
    endDate: string;
    departments?: string[];
    programs?: string[];
  }): Promise<{
    reportId: string;
    generatedDate: string;
    period: string;
    summary: {
      totalEnrollments: number;
      completedTrainings: number;
      averageCompletionRate: number;
      mandatoryComplianceRate: number;
      certificationsIssued: number;
      overdueTrainings: number;
    };
    byDepartment: Array<{
      department: string;
      enrolled: number;
      completed: number;
      completionRate: number;
      complianceRate: number;
    }>;
    byProgram: Array<{
      programId: string;
      programTitle: string;
      category: string;
      enrolled: number;
      completed: number;
      completionRate: number;
      averageScore: number;
    }>;
    mandatoryTraining: Array<{
      requirement: string;
      requiredCount: number;
      completedCount: number;
      complianceRate: number;
      overdueCount: number;
      actionRequired: boolean;
    }>;
    recommendations: string[];
  }> {
    const { startDate, endDate, departments, programs } = options;

    const periodEnrollments = this.enrollments.filter(enrollment => {
      const enrollmentDate = new Date(enrollment.enrollmentDate);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return enrollmentDate >= start && enrollmentDate <= end;
    });

    const completedInPeriod = periodEnrollments.filter(e => e.status === 'Completed').length;
    const averageCompletionRate = periodEnrollments.length > 0 
      ? (completedInPeriod / periodEnrollments.length) * 100 
      : 0;

    // Mock compliance data
    const mandatoryComplianceRate = 87.3;
    const overdueTrainings = periodEnrollments.filter(e => 
      e.dueDate && new Date(e.dueDate) < new Date()
    ).length;

    // Group by department
    const departmentGroups = periodEnrollments.reduce((acc, enrollment) => {
      const department = enrollment.userId.includes('eng') ? 'Engineering' : 
                        enrollment.userId.includes('sales') ? 'Sales' : 'Marketing';
      
      if (!acc[department]) {
        acc[department] = { enrolled: 0, completed: 0 };
      }
      acc[department].enrolled += 1;
      if (enrollment.status === 'Completed') {
        acc[department].completed += 1;
      }
      return acc;
    }, {} as Record<string, { enrolled: number; completed: number }>);

    const byDepartment = Object.entries(departmentGroups).map(([department, data]) => ({
      department,
      enrolled: data.enrolled,
      completed: data.completed,
      completionRate: data.enrolled > 0 ? (data.completed / data.enrolled) * 100 : 0,
      complianceRate: data.enrolled > 0 ? (data.completed / data.enrolled) * 100 * 0.9 : 0 // Mock compliance rate
    }));

    // Group by program
    const programGroups = periodEnrollments.reduce((acc, enrollment) => {
      if (!acc[enrollment.programId]) {
        acc[enrollment.programId] = { enrolled: 0, completed: 0, scores: [] };
      }
      acc[enrollment.programId].enrolled += 1;
      if (enrollment.status === 'Completed') {
        acc[enrollment.programId].completed += 1;
      }
      acc[enrollment.programId].scores.push(85); // Mock score
      return acc;
    }, {} as Record<string, { enrolled: number; completed: number; scores: number[] }>);

    const byProgram = Object.entries(programGroups).map(([programId, data]) => {
      const program = this.programs.find(p => p.id === programId);
      return {
        programId,
        programTitle: program?.title || 'Unknown Program',
        category: program?.category || 'Unknown',
        enrolled: data.enrolled,
        completed: data.completed,
        completionRate: data.enrolled > 0 ? (data.completed / data.enrolled) * 100 : 0,
        averageScore: data.scores.length > 0 ? data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length : 0
      };
    });

    const recommendations = [
      'Increase completion rates through enhanced engagement strategies',
      'Implement automated reminders for overdue mandatory trainings',
      'Expand training coverage for underperforming departments',
      'Review and update training content based on assessment results'
    ];

    if (averageCompletionRate < 80) {
      recommendations.unshift('Immediate action required: Completion rate below acceptable threshold');
    }

    if (overdueTrainings > 0) {
      recommendations.push(`Address ${overdueTrainings} overdue training assignments`);
    }

    return {
      reportId: this.generateId('training-report'),
      generatedDate: new Date().toISOString(),
      period: `${startDate} to ${endDate}`,
      summary: {
        totalEnrollments: periodEnrollments.length,
        completedTrainings: completedInPeriod,
        averageCompletionRate: Math.round(averageCompletionRate * 10) / 10,
        mandatoryComplianceRate,
        certificationsIssued: Math.round(completedInPeriod * 0.8), // Mock 80% get certified
        overdueTrainings
      },
      byDepartment,
      byProgram,
      mandatoryTraining: [
        {
          requirement: 'GDPR Training',
          requiredCount: 150,
          completedCount: 131,
          complianceRate: 87.3,
          overdueCount: 12,
          actionRequired: true
        },
        {
          requirement: 'PCI-DSS Training',
          requiredCount: 45,
          completedCount: 42,
          complianceRate: 93.3,
          overdueCount: 2,
          actionRequired: false
        }
      ],
      recommendations
    };
  }

  /**
   * Get upcoming training schedules
   */
  async getUpcomingSchedules(days: number = 30): Promise<TrainingSchedule[]> {
    const cutoffDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    
    return this.schedules
      .filter(schedule => {
        const scheduleDate = new Date(schedule.startDate);
        return scheduleDate <= cutoffDate && schedule.status === 'Scheduled';
      })
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }

  /**
   * Create training schedule
   */
  async createSchedule(schedule: Omit<TrainingSchedule, 'id'>): Promise<TrainingSchedule> {
    const newSchedule: TrainingSchedule = {
      ...schedule,
      id: this.generateId('schedule')
    };

    this.schedules.push(newSchedule);
    return newSchedule;
  }

  /**
   * Utility method to generate unique IDs
   */
  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const complianceTrainingService = new ComplianceTrainingService();