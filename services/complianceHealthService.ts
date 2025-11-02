/**
 * ORACLE-LEDGER Compliance Health Service
 * Comprehensive compliance health scoring and monitoring system
 * Updated: 2025-11-02
 */

import { db } from '../server/db';
import { complianceChecklist, pciAuditLog, feeComplianceRecords } from '../shared/schema';
import { and, eq, gte, lte, desc, count } from 'drizzle-orm';

export interface ComplianceHealthScore {
  overallScore: number;
  breakdown: {
    pciCompliance: number;
    nachaCompliance: number;
    amlCompliance: number;
    soxCompliance: number;
    bankingRegulations: number;
  };
  components: {
    requirementCompletion: number;
    auditTrailCompleteness: number;
    policyCompliance: number;
    trainingCompletion: number;
    riskManagement: number;
  };
  trends: {
    score: number;
    date: Date;
    period: 'daily' | 'weekly' | 'monthly';
  }[];
  lastUpdated: Date;
}

export interface ComplianceKPI {
  metric: string;
  value: number;
  target: number;
  trend: 'up' | 'down' | 'stable';
  unit: string;
  status: 'exceeds_target' | 'near_target' | 'below_target';
  category: 'efficiency' | 'effectiveness' | 'compliance' | 'risk';
}

export interface ComplianceHealthAlert {
  id: string;
  type: 'degradation' | 'violation' | 'threshold_breach';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedComponent: string;
  currentValue: number;
  thresholdValue: number;
  recommendation: string;
  createdAt: Date;
}

export interface ComplianceHealthTrend {
  date: Date;
  overallScore: number;
  pciCompliance: number;
  nachaCompliance: number;
  amlCompliance: number;
  soxCompliance: number;
  bankingRegulations: number;
}

export class ComplianceHealthService {
  private readonly SCORING_WEIGHTS = {
    requirementCompletion: 0.25,
    auditTrailCompleteness: 0.20,
    policyCompliance: 0.20,
    trainingCompletion: 0.15,
    riskManagement: 0.20
  };

  private readonly COMPLIANCE_THRESHOLDS = {
    EXCELLENT: 95,
    GOOD: 85,
    ACCEPTABLE: 75,
    NEEDS_IMPROVEMENT: 65,
    CRITICAL: 50
  };

  private readonly KPI_TARGETS = {
    assessmentTime: { target: 15, unit: 'days', betterDirection: 'down' },
    policyUpdateFrequency: { target: 4, unit: 'per month', betterDirection: 'up' },
    trainingCompletionRate: { target: 90, unit: '%', betterDirection: 'up' },
    auditFindingResolution: { target: 7, unit: 'days avg', betterDirection: 'down' },
    regulatoryChangeResponse: { target: 3, unit: 'days avg', betterDirection: 'down' },
    complianceScore: { target: 95, unit: '%', betterDirection: 'up' }
  };

  /**
   * Calculate comprehensive compliance health score
   */
  async calculateHealthScore(dateRange?: { start: Date; end: Date }): Promise<ComplianceHealthScore> {
    try {
      const endDate = dateRange?.end || new Date();
      const startDate = dateRange?.start || new Date(endDate.getTime() - (30 * 24 * 60 * 60 * 1000)); // 30 days ago

      // Calculate component scores
      const requirementCompletion = await this.calculateRequirementCompletion(startDate, endDate);
      const auditTrailCompleteness = await this.calculateAuditTrailCompleteness(startDate, endDate);
      const policyCompliance = await this.calculatePolicyCompliance(startDate, endDate);
      const trainingCompletion = await this.calculateTrainingCompletion(startDate, endDate);
      const riskManagement = await this.calculateRiskManagementScore(startDate, endDate);

      // Calculate category-specific compliance scores
      const pciCompliance = await this.calculateStandardCompliance('PCI_DSS', startDate, endDate);
      const nachaCompliance = await this.calculateStandardCompliance('NACHA', startDate, endDate);
      const amlCompliance = await this.calculateStandardCompliance('AML', startDate, endDate);
      const soxCompliance = await this.calculateStandardCompliance('SOX', startDate, endDate);
      const bankingRegulations = await this.calculateStandardCompliance('BANKING_REGULATIONS', startDate, endDate);

      // Calculate overall score
      const overallScore = (
        requirementCompletion * this.SCORING_WEIGHTS.requirementCompletion +
        auditTrailCompleteness * this.SCORING_WEIGHTS.auditTrailCompleteness +
        policyCompliance * this.SCORING_WEIGHTS.policyCompliance +
        trainingCompletion * this.SCORING_WEIGHTS.trainingCompletion +
        riskManagement * this.SCORING_WEIGHTS.riskManagement
      );

      // Get trends
      const trends = await this.getHealthTrends(startDate, endDate);

      return {
        overallScore: Math.round(overallScore * 10) / 10,
        breakdown: {
          pciCompliance: Math.round(pciCompliance * 10) / 10,
          nachaCompliance: Math.round(nachaCompliance * 10) / 10,
          amlCompliance: Math.round(amlCompliance * 10) / 10,
          soxCompliance: Math.round(soxCompliance * 10) / 10,
          bankingRegulations: Math.round(bankingRegulations * 10) / 10
        },
        components: {
          requirementCompletion: Math.round(requirementCompletion * 10) / 10,
          auditTrailCompleteness: Math.round(auditTrailCompleteness * 10) / 10,
          policyCompliance: Math.round(policyCompliance * 10) / 10,
          trainingCompletion: Math.round(trainingCompletion * 10) / 10,
          riskManagement: Math.round(riskManagement * 10) / 10
        },
        trends,
        lastUpdated: new Date()
      };

    } catch (error) {
      console.error('Failed to calculate compliance health score:', error);
      throw new Error(`Health score calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate compliance KPIs
   */
  async generateComplianceKPIs(): Promise<ComplianceKPI[]> {
    try {
      const kpis: ComplianceKPI[] = [];

      // Assessment Time KPI
      const avgAssessmentTime = await this.calculateAverageAssessmentTime();
      kpis.push({
        metric: 'Average Assessment Time',
        value: avgAssessmentTime,
        target: this.KPI_TARGETS.assessmentTime.target,
        trend: avgAssessmentTime < this.KPI_TARGETS.assessmentTime.target ? 'down' : 'up',
        unit: this.KPI_TARGETS.assessmentTime.unit,
        status: avgAssessmentTime <= this.KPI_TARGETS.assessmentTime.target ? 'exceeds_target' : 
                avgAssessmentTime <= this.KPI_TARGETS.assessmentTime.target * 1.2 ? 'near_target' : 'below_target',
        category: 'efficiency'
      });

      // Policy Update Frequency KPI
      const policyUpdateFreq = await this.calculatePolicyUpdateFrequency();
      kpis.push({
        metric: 'Policy Update Frequency',
        value: policyUpdateFreq,
        target: this.KPI_TARGETS.policyUpdateFrequency.target,
        trend: policyUpdateFreq > this.KPI_TARGETS.policyUpdateFrequency.target ? 'up' : 'down',
        unit: this.KPI_TARGETS.policyUpdateFrequency.unit,
        status: policyUpdateFreq >= this.KPI_TARGETS.policyUpdateFrequency.target ? 'exceeds_target' : 
                policyUpdateFreq >= this.KPI_TARGETS.policyUpdateFrequency.target * 0.8 ? 'near_target' : 'below_target',
        category: 'effectiveness'
      });

      // Training Completion Rate KPI
      const trainingCompletionRate = await this.calculateTrainingCompletionRate();
      kpis.push({
        metric: 'Training Completion Rate',
        value: trainingCompletionRate,
        target: this.KPI_TARGETS.trainingCompletionRate.target,
        trend: trainingCompletionRate > this.KPI_TARGETS.trainingCompletionRate.target ? 'up' : 'down',
        unit: this.KPI_TARGETS.trainingCompletionRate.unit,
        status: trainingCompletionRate >= this.KPI_TARGETS.trainingCompletionRate.target ? 'exceeds_target' : 
                trainingCompletionRate >= this.KPI_TARGETS.trainingCompletionRate.target * 0.9 ? 'near_target' : 'below_target',
        category: 'compliance'
      });

      // Audit Finding Resolution KPI
      const auditResolutionTime = await this.calculateAverageAuditResolutionTime();
      kpis.push({
        metric: 'Audit Finding Resolution Time',
        value: auditResolutionTime,
        target: this.KPI_TARGETS.auditFindingResolution.target,
        trend: auditResolutionTime < this.KPI_TARGETS.auditFindingResolution.target ? 'down' : 'up',
        unit: this.KPI_TARGETS.auditFindingResolution.unit,
        status: auditResolutionTime <= this.KPI_TARGETS.auditFindingResolution.target ? 'exceeds_target' : 
                auditResolutionTime <= this.KPI_TARGETS.auditFindingResolution.target * 1.3 ? 'near_target' : 'below_target',
        category: 'efficiency'
      });

      // Regulatory Change Response KPI
      const responseTime = await this.calculateRegulatoryChangeResponseTime();
      kpis.push({
        metric: 'Regulatory Change Response Time',
        value: responseTime,
        target: this.KPI_TARGETS.regulatoryChangeResponse.target,
        trend: responseTime < this.KPI_TARGETS.regulatoryChangeResponse.target ? 'down' : 'up',
        unit: this.KPI_TARGETS.regulatoryChangeResponse.unit,
        status: responseTime <= this.KPI_TARGETS.regulatoryChangeResponse.target ? 'exceeds_target' : 
                responseTime <= this.KPI_TARGETS.regulatoryChangeResponse.target * 1.5 ? 'near_target' : 'below_target',
        category: 'efficiency'
      });

      // Overall Compliance Score KPI
      const healthScore = await this.calculateHealthScore();
      kpis.push({
        metric: 'Overall Compliance Score',
        value: healthScore.overallScore,
        target: this.KPI_TARGETS.complianceScore.target,
        trend: healthScore.overallScore > this.KPI_TARGETS.complianceScore.target ? 'up' : 'down',
        unit: this.KPI_TARGETS.complianceScore.unit,
        status: healthScore.overallScore >= this.KPI_TARGETS.complianceScore.target ? 'exceeds_target' : 
                healthScore.overallScore >= this.KPI_TARGETS.complianceScore.target * 0.95 ? 'near_target' : 'below_target',
        category: 'compliance'
      });

      return kpis;

    } catch (error) {
      console.error('Failed to generate compliance KPIs:', error);
      throw new Error(`KPI generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Monitor compliance health and generate alerts
   */
  async monitorComplianceHealth(): Promise<ComplianceHealthAlert[]> {
    try {
      const alerts: ComplianceHealthAlert[] = [];
      const currentHealth = await this.calculateHealthScore();

      // Check for score degradation
      const recentTrends = await this.getHealthTrends(
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        new Date()
      );

      if (recentTrends.length >= 2) {
        const currentScore = recentTrends[recentTrends.length - 1].overallScore;
        const previousScore = recentTrends[recentTrends.length - 2].overallScore;
        const scoreChange = currentScore - previousScore;

        if (scoreChange < -5) {
          alerts.push({
            id: `alert_degradation_${Date.now()}`,
            type: 'degradation',
            severity: Math.abs(scoreChange) > 10 ? 'critical' : 'high',
            title: 'Compliance Score Degradation',
            description: `Compliance health score decreased by ${Math.abs(scoreChange).toFixed(1)} points`,
            affectedComponent: 'overall',
            currentValue: currentScore,
            thresholdValue: previousScore,
            recommendation: 'Review recent changes and identify root cause of score degradation',
            createdAt: new Date()
          });
        }
      }

      // Check for component-specific issues
      for (const [component, score] of Object.entries(currentHealth.breakdown)) {
        if (score < this.COMPLIANCE_THRESHOLDS.NEEDS_IMPROVEMENT) {
          alerts.push({
            id: `alert_component_${component}_${Date.now()}`,
            type: 'threshold_breach',
            severity: score < this.COMPLIANCE_THRESHOLDS.CRITICAL ? 'critical' : 
                     score < this.COMPLIANCE_THRESHOLDS.NEEDS_IMPROVEMENT ? 'high' : 'medium',
            title: `${component.replace(/([A-Z])/g, ' $1')} Below Threshold`,
            description: `${component.replace(/([A-Z])/g, ' $1')} compliance score is ${score.toFixed(1)}%`,
            affectedComponent: component,
            currentValue: score,
            thresholdValue: this.COMPLIANCE_THRESHOLDS.ACCEPTABLE,
            recommendation: `Focus improvement efforts on ${component.replace(/([A-Z])/g, ' $1').toLowerCase()} compliance`,
            createdAt: new Date()
          });
        }
      }

      // Check for checklist completion issues
      const checklistStats = await this.getChecklistCompletionStats();
      if (checklistStats.overdueItems > 0) {
        alerts.push({
          id: `alert_checklist_overdue_${Date.now()}`,
          type: 'threshold_breach',
          severity: checklistStats.overdueItems > 10 ? 'high' : 'medium',
          title: 'Overdue Compliance Items',
          description: `${checklistStats.overdueItems} compliance checklist items are overdue`,
          affectedComponent: 'checklist',
          currentValue: checklistStats.overdueItems,
          thresholdValue: 0,
          recommendation: 'Prioritize completion of overdue compliance items',
          createdAt: new Date()
        });
      }

      return alerts;

    } catch (error) {
      console.error('Failed to monitor compliance health:', error);
      throw new Error(`Health monitoring failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get compliance health trends
   */
  async getHealthTrends(startDate: Date, endDate: Date): Promise<ComplianceHealthTrend[]> {
    try {
      // In a real implementation, this would query historical health score data
      // For now, we'll generate mock trend data
      const trends: ComplianceHealthTrend[] = [];
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      for (let i = 0; i <= daysDiff; i += 7) { // Weekly data points
        const date = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
        trends.push({
          date,
          overallScore: 90 + Math.random() * 10,
          pciCompliance: 95 + Math.random() * 5,
          nachaCompliance: 90 + Math.random() * 8,
          amlCompliance: 85 + Math.random() * 12,
          soxCompliance: 92 + Math.random() * 6,
          bankingRegulations: 88 + Math.random() * 10
        });
      }

      return trends;

    } catch (error) {
      console.error('Failed to get health trends:', error);
      throw new Error(`Trend analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate requirement completion percentage
   */
  private async calculateRequirementCompletion(startDate: Date, endDate: Date): Promise<number> {
    try {
      const [totalItems, completedItems] = await Promise.all([
        db.select({ count: count() }).from(complianceChecklist).where(
          and(
            gte(complianceChecklist.createdAt, startDate),
            lte(complianceChecklist.createdAt, endDate)
          )
        ),
        db.select({ count: count() }).from(complianceChecklist).where(
          and(
            eq(complianceChecklist.status, 'completed'),
            gte(complianceChecklist.createdAt, startDate),
            lte(complianceChecklist.createdAt, endDate)
          )
        )
      ]);

      const total = totalItems[0]?.count || 0;
      const completed = completedItems[0]?.count || 0;
      
      return total > 0 ? (completed / total) * 100 : 100;

    } catch (error) {
      console.error('Failed to calculate requirement completion:', error);
      return 0;
    }
  }

  /**
   * Calculate audit trail completeness
   */
  private async calculateAuditTrailCompleteness(startDate: Date, endDate: Date): Promise<number> {
    try {
      // Calculate percentage of transactions with complete audit trails
      // This would involve checking audit log completeness for various operations
      const auditEvents = await db.select({ count: count() }).from(pciAuditLog).where(
        and(
          gte(pciAuditLog.createdAt, startDate),
          lte(pciAuditLog.createdAt, endDate)
        )
      );

      // Mock calculation - in reality, this would be more sophisticated
      const expectedAuditEvents = 1000; // This would be calculated based on business operations
      const actualEvents = auditEvents[0]?.count || 0;
      
      return Math.min(100, (actualEvents / expectedAuditEvents) * 100);

    } catch (error) {
      console.error('Failed to calculate audit trail completeness:', error);
      return 0;
    }
  }

  /**
   * Calculate policy compliance score
   */
  private async calculatePolicyCompliance(startDate: Date, endDate: Date): Promise<number> {
    try {
      // This would check policy adherence across various business processes
      // Mock calculation for demonstration
      const policyReviewScore = 90;
      const policyAdherenceScore = 95;
      const policyUpdateScore = 85;
      
      return (policyReviewScore + policyAdherenceScore + policyUpdateScore) / 3;

    } catch (error) {
      console.error('Failed to calculate policy compliance:', error);
      return 0;
    }
  }

  /**
   * Calculate training completion score
   */
  private async calculateTrainingCompletion(startDate: Date, endDate: Date): Promise<number> {
    try {
      // Mock training completion data
      const requiredTraining = 156; // Total required training completions
      const completedTraining = 151; // Actual completions
      
      return (completedTraining / requiredTraining) * 100;

    } catch (error) {
      console.error('Failed to calculate training completion:', error);
      return 0;
    }
  }

  /**
   * Calculate risk management score
   */
  private async calculateRiskManagementScore(startDate: Date, endDate: Date): Promise<number> {
    try {
      // This would assess risk management framework effectiveness
      // Mock calculation for demonstration
      const riskAssessmentScore = 88;
      const mitigationScore = 92;
      const monitoringScore = 85;
      
      return (riskAssessmentScore + mitigationScore + monitoringScore) / 3;

    } catch (error) {
      console.error('Failed to calculate risk management score:', error);
      return 0;
    }
  }

  /**
   * Calculate compliance score for a specific regulatory standard
   */
  private async calculateStandardCompliance(
    standard: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<number> {
    try {
      // This would calculate compliance score for specific standards like PCI_DSS, NACHA, etc.
      // Mock implementation
      const baseScores: Record<string, number> = {
        'PCI_DSS': 98.5,
        'NACHA': 96.8,
        'AML': 92.1,
        'SOX': 95.3,
        'BANKING_REGULATIONS': 91.7
      };

      return baseScores[standard] || 85;

    } catch (error) {
      console.error(`Failed to calculate ${standard} compliance:`, error);
      return 0;
    }
  }

  /**
   * Calculate average assessment time
   */
  private async calculateAverageAssessmentTime(): Promise<number> {
    // Mock implementation
    return 12.5;
  }

  /**
   * Calculate policy update frequency
   */
  private async calculatePolicyUpdateFrequency(): Promise<number> {
    // Mock implementation
    return 4.2;
  }

  /**
   * Calculate training completion rate
   */
  private async calculateTrainingCompletionRate(): Promise<number> {
    // Mock implementation
    return 96.8;
  }

  /**
   * Calculate average audit resolution time
   */
  private async calculateAverageAuditResolutionTime(): Promise<number> {
    // Mock implementation
    return 8.3;
  }

  /**
   * Calculate regulatory change response time
   */
  private async calculateRegulatoryChangeResponseTime(): Promise<number> {
    // Mock implementation
    return 2.1;
  }

  /**
   * Get checklist completion statistics
   */
  private async getChecklistCompletionStats() {
    // Mock implementation
    return {
      totalItems: 48,
      completedItems: 45,
      inProgressItems: 2,
      overdueItems: 1
    };
  }
}

// Export singleton instance
export const complianceHealthService = new ComplianceHealthService();
