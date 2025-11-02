/**
 * Risk Assessment Service - Risk management for ORACLE-LEDGER Stripe integration
 * 
 * This service provides:
 * - Customer risk profiling and scoring
 * - Transaction risk assessment and classification
 * - Business rule engine for risk-based decisions
 * - Risk threshold management and alerts
 * - Blacklist and whitelist management
 * - Geographic and demographic risk analysis
 * - Historical transaction pattern analysis
 * - Automated risk-based action triggers
 */

import { databaseService } from './databaseService';
import type { Customer, AchPayment, PaymentMethod } from '../shared/schema';
import { eq, and, gte, lte, desc, inArray, count } from 'drizzle-orm';

// Risk assessment configuration
export interface RiskAssessmentConfig {
  customerRiskTiers: {
    low: { min: number; max: number };
    medium: { min: number; max: number };
    high: { min: number; max: number };
    critical: { min: number; max: number };
  };
  transactionThresholds: {
    small: number;
    medium: number;
    large: number;
    veryLarge: number;
  };
  behavioralThresholds: {
    newCustomerDays: number;
    frequentTransactionDays: number;
    volumeVarianceThreshold: number;
  };
  geographicRiskWeights: Record<string, number>;
  industryRiskWeights: Record<string, number>;
}

// Customer risk profile
export interface CustomerRiskProfile {
  customerId: string;
  riskScore: number; // 0-1000
  riskTier: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: {
    demographicRisk: number;
    behavioralRisk: number;
    transactionRisk: number;
    geographicRisk: number;
    complianceRisk: number;
  };
  riskHistory: {
    lastAssessmentDate: Date;
    previousRiskScores: number[];
    riskScoreTrend: 'increasing' | 'decreasing' | 'stable';
    significantChanges: Array<{
      date: Date;
      oldScore: number;
      newScore: number;
      reason: string;
    }>;
  };
  limits: {
    dailyTransactionLimit: number;
    monthlyTransactionLimit: number;
    singleTransactionLimit: number;
    velocityLimitPerHour: number;
    velocityLimitPerDay: number;
  };
  status: 'active' | 'monitored' | 'restricted' | 'suspended';
  lastUpdated: Date;
}

// Transaction risk assessment
export interface TransactionRiskAssessment {
  transactionId: string;
  customerId: string;
  riskScore: number;
  riskCategory: 'low' | 'medium' | 'high' | 'critical';
  assessmentFactors: {
    customerRiskTier: number;
    transactionAmount: number;
    transactionType: string;
    merchantCategory: string;
    geographicRisk: number;
    timeRisk: number;
    behavioralAnomaly: number;
    complianceFlags: string[];
  };
  recommendedActions: RiskAction[];
  requiresManualReview: boolean;
  autoBlockThreshold: number;
  assessmentDate: Date;
}

// Risk-based actions
export interface RiskAction {
  type: 'block' | 'manual_review' | 'additional_verification' | 'accept' | 'decline' | 'require_know_your_customer';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  automatic: boolean;
  triggers?: string[];
  conditions?: Record<string, any>;
}

// Business rule definition
export interface BusinessRule {
  id: string;
  name: string;
  description: string;
  category: 'transaction' | 'customer' | 'compliance' | 'fraud';
  conditions: Array<{
    field: string;
    operator: 'equals' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'contains';
    value: any;
  }>;
  actions: RiskAction[];
  priority: number;
  active: boolean;
  createdDate: Date;
  lastModified: Date;
  executionCount: number;
  lastExecuted?: Date;
}

// Blacklist and whitelist management
export interface RiskListEntry {
  id: string;
  type: 'blacklist' | 'whitelist' | 'watchlist';
  category: 'customer' | 'ip_address' | 'device' | 'bank_account' | 'geographic' | 'merchant';
  identifier: string;
  reason: string;
  addedBy: string;
  addedDate: Date;
  expirationDate?: Date;
  riskScore: number;
  autoBlock: boolean;
  notes?: string;
  lastActivity?: Date;
}

// Geographic risk assessment
export interface GeographicRiskProfile {
  country: string;
  region: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number; // 0-100
  factors: {
    economicStability: number;
    politicalStability: number;
    corruptionIndex: number;
    financialRegulations: number;
    sanctionsRisk: number;
    fraudPrevalence: number;
  };
  lastUpdated: Date;
  dataSource: string;
}

export class RiskAssessmentService {
  private config: RiskAssessmentConfig;
  private customerRiskProfiles: Map<string, CustomerRiskProfile> = new Map();
  private businessRules: Map<string, BusinessRule> = new Map();
  private riskLists: Map<string, RiskListEntry[]> = new Map();
  private geographicRiskProfiles: Map<string, GeographicRiskProfile> = new Map();

  constructor() {
    this.config = this.initializeConfig();
    this.initializeBusinessRules();
    this.initializeGeographicRiskProfiles();
  }

  /**
   * Assess customer risk profile
   */
  async assessCustomerRisk(customerId: string): Promise<CustomerRiskProfile> {
    try {
      // Check if we have a recent profile
      let profile = this.customerRiskProfiles.get(customerId);
      if (profile && this.isProfileRecent(profile)) {
        return profile;
      }

      // Get customer data
      const customer = await this.getCustomerData(customerId);
      if (!customer) {
        throw new Error(`Customer not found: ${customerId}`);
      }

      // Calculate risk factors
      const demographicRisk = await this.calculateDemographicRisk(customer);
      const behavioralRisk = await this.calculateBehavioralRisk(customerId);
      const transactionRisk = await this.calculateTransactionRisk(customerId);
      const geographicRisk = await this.calculateGeographicRisk(customer);
      const complianceRisk = await this.calculateComplianceRisk(customerId);

      // Calculate overall risk score
      const riskScore = this.calculateOverallRiskScore({
        demographicRisk,
        behavioralRisk,
        transactionRisk,
        geographicRisk,
        complianceRisk
      });

      const riskTier = this.determineRiskTier(riskScore);
      const limits = this.calculateRiskLimits(riskTier);
      const status = this.determineCustomerStatus(riskTier);

      // Get risk history
      const riskHistory = await this.getRiskHistory(customerId);

      // Create or update profile
      profile = {
        customerId,
        riskScore,
        riskTier,
        riskFactors: {
          demographicRisk,
          behavioralRisk,
          transactionRisk,
          geographicRisk,
          complianceRisk
        },
        riskHistory,
        limits,
        status,
        lastUpdated: new Date()
      };

      this.customerRiskProfiles.set(customerId, profile);

      // Save to database
      await this.saveCustomerRiskProfile(profile);

      // Log risk assessment
      await this.logRiskAssessment('CUSTOMER', customerId, riskScore, profile.riskFactors);

      return profile;
    } catch (error) {
      console.error('Error assessing customer risk:', error);
      throw new Error(`Customer risk assessment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Assess transaction risk
   */
  async assessTransactionRisk(transactionData: {
    transactionId: string;
    customerId: string;
    amount: number;
    currency: string;
    merchantCategory: string;
    paymentMethodId: string;
    ipAddress: string;
    billingCountry: string;
    timestamp: Date;
  }): Promise<TransactionRiskAssessment> {
    try {
      // Get customer risk profile
      const customerProfile = await this.assessCustomerRisk(transactionData.customerId);

      // Check risk lists
      const listFlags = await this.checkRiskLists(transactionData);

      // Calculate assessment factors
      const assessmentFactors = {
        customerRiskTier: customerProfile.riskScore / 100, // Normalize to 0-1
        transactionAmount: this.normalizeTransactionAmount(transactionData.amount),
        transactionType: transactionData.merchantCategory,
        merchantCategory: this.getMerchantCategoryRisk(transactionData.merchantCategory),
        geographicRisk: await this.getGeographicRiskScore(transactionData.billingCountry),
        timeRisk: this.calculateTimeRisk(transactionData.timestamp),
        behavioralAnomaly: await this.calculateBehavioralAnomaly(transactionData.customerId, transactionData),
        complianceFlags: listFlags.complianceFlags
      };

      // Calculate transaction risk score
      const riskScore = this.calculateTransactionRiskScore(assessmentFactors, listFlags);

      const riskCategory = this.determineRiskCategory(riskScore);
      const recommendedActions = this.determineRecommendedActions(riskScore, assessmentFactors, listFlags);
      const requiresManualReview = riskScore >= this.config.customerRiskTiers.high.min;
      const autoBlockThreshold = this.config.customerRiskTiers.critical.min;

      const assessment: TransactionRiskAssessment = {
        transactionId: transactionData.transactionId,
        customerId: transactionData.customerId,
        riskScore,
        riskCategory,
        assessmentFactors,
        recommendedActions,
        requiresManualReview,
        autoBlockThreshold,
        assessmentDate: new Date()
      };

      // Execute business rules
      const ruleActions = await this.executeBusinessRules(transactionData, assessment);
      assessment.recommendedActions.push(...ruleActions);

      // Log transaction risk assessment
      await this.logRiskAssessment('TRANSACTION', transactionData.transactionId, riskScore, assessmentFactors);

      return assessment;
    } catch (error) {
      console.error('Error assessing transaction risk:', error);
      throw new Error(`Transaction risk assessment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute business rules engine
   */
  async executeBusinessRules(
    transactionData: any,
    riskAssessment: TransactionRiskAssessment
  ): Promise<RiskAction[]> {
    const triggeredActions: RiskAction[] = [];

    try {
      for (const rule of this.businessRules.values()) {
        if (!rule.active) continue;

        let ruleMatches = true;
        
        // Check all conditions
        for (const condition of rule.conditions) {
          if (!this.evaluateCondition(condition, transactionData, riskAssessment)) {
            ruleMatches = false;
            break;
          }
        }

        if (ruleMatches) {
          triggeredActions.push(...rule.actions);
          rule.executionCount++;
          rule.lastExecuted = new Date();

          // Log rule execution
          await this.logBusinessRuleExecution(rule.id, transactionData.transactionId, true);
        }
      }

      // Sort actions by priority
      triggeredActions.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

    } catch (error) {
      console.error('Error executing business rules:', error);
    }

    return triggeredActions;
  }

  /**
   * Evaluate business rule condition
   */
  private evaluateCondition(condition: BusinessRule['conditions'][0], transactionData: any, riskAssessment: TransactionRiskAssessment): boolean {
    const fieldValue = this.getFieldValue(condition.field, transactionData, riskAssessment);
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'greater_than':
        return fieldValue > condition.value;
      case 'less_than':
        return fieldValue < condition.value;
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());
      default:
        return false;
    }
  }

  /**
   * Get field value for business rule evaluation
   */
  private getFieldValue(field: string, transactionData: any, riskAssessment: TransactionRiskAssessment): any {
    const fieldParts = field.split('.');
    let value: any;

    if (fieldParts[0] === 'transaction') {
      value = transactionData;
    } else if (fieldParts[0] === 'risk') {
      value = riskAssessment;
    } else {
      value = { [fieldParts[0]]: transactionData[fieldParts[0]] };
    }

    for (const part of fieldParts.slice(1)) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Check risk lists (blacklist, whitelist, watchlist)
   */
  private async checkRiskLists(transactionData: any): Promise<{
    isBlacklisted: boolean;
    isWhitelisted: boolean;
    isWatchlisted: boolean;
    complianceFlags: string[];
  }> {
    const result = {
      isBlacklisted: false,
      isWhitelisted: false,
      isWatchlisted: false,
      complianceFlags: [] as string[]
    };

    try {
      // Check customer blacklist/whitelist
      const customerEntries = this.riskLists.get('customer') || [];
      const customerEntry = customerEntries.find(entry => 
        entry.identifier === transactionData.customerId &&
        (!entry.expirationDate || entry.expirationDate > new Date())
      );

      if (customerEntry) {
        if (customerEntry.type === 'blacklist') {
          result.isBlacklisted = true;
          result.complianceFlags.push('CUSTOMER_BLACKLISTED');
        } else if (customerEntry.type === 'whitelist') {
          result.isWhitelisted = true;
        } else if (customerEntry.type === 'watchlist') {
          result.isWatchlisted = true;
          result.complianceFlags.push('CUSTOMER_WATCHLISTED');
        }
      }

      // Check IP address lists
      const ipEntries = this.riskLists.get('ip_address') || [];
      const ipEntry = ipEntries.find(entry => 
        entry.identifier === transactionData.ipAddress &&
        (!entry.expirationDate || entry.expirationDate > new Date())
      );

      if (ipEntry) {
        if (ipEntry.type === 'blacklist') {
          result.isBlacklisted = true;
          result.complianceFlags.push('IP_BLACKLISTED');
        } else if (ipEntry.type === 'watchlist') {
          result.isWatchlisted = true;
          result.complianceFlags.push('IP_WATCHLISTED');
        }
      }

      // Check geographic restrictions
      const geoEntries = this.riskLists.get('geographic') || [];
      const geoEntry = geoEntries.find(entry => 
        entry.identifier === transactionData.billingCountry &&
        (!entry.expirationDate || entry.expirationDate > new Date())
      );

      if (geoEntry && geoEntry.type === 'blacklist') {
        result.isBlacklisted = true;
        result.complianceFlags.push('GEOGRAPHIC_BLOCKED');
      }

    } catch (error) {
      console.error('Error checking risk lists:', error);
    }

    return result;
  }

  /**
   * Calculate demographic risk
   */
  private async calculateDemographicRisk(customer: Customer): Promise<number> {
    let riskScore = 0;

    try {
      // Age-based risk (if available in customer data)
      // Industry risk assessment
      // Business type risk
      // Credit score risk (if available)
      
      // Default risk based on customer type
      if (customer.email) {
        // Check for suspicious email patterns
        const emailDomain = customer.email.split('@')[1];
        if (this.isHighRiskEmailDomain(emailDomain)) {
          riskScore += 30;
        }
      }

    } catch (error) {
      console.error('Error calculating demographic risk:', error);
    }

    return Math.min(100, riskScore);
  }

  /**
   * Calculate behavioral risk
   */
  private async calculateBehavioralRisk(customerId: string): Promise<number> {
    let riskScore = 0;

    try {
      const transactions = await databaseService.getDb()
        .select()
        .from(schema.achPayments)
        .where(eq(schema.achPayments.customerId, customerId))
        .orderBy(desc(schema.achPayments.createdAt))
        .limit(50);

      if (transactions.length === 0) {
        return 0; // New customer
      }

      // Calculate transaction consistency
      const amounts = transactions.map(tx => parseFloat(tx.amountCents || '0'));
      const averageAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
      const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - averageAmount, 2), 0) / amounts.length;
      
      // High variance indicates inconsistent behavior
      if (variance > Math.pow(averageAmount * 0.5, 2)) {
        riskScore += 25;
      }

      // Check transaction timing patterns
      const hours = transactions.map(tx => tx.createdAt.getHours());
      const hourVariance = this.calculateVariance(hours);
      
      if (hourVariance > 100) { // High variance in timing
        riskScore += 15;
      }

      // Check return rate
      const returnCount = transactions.filter(tx => tx.status === 'failed').length;
      const returnRate = returnCount / transactions.length;
      
      if (returnRate > 0.1) { // More than 10% returns
        riskScore += Math.min(50, returnRate * 200);
      }

    } catch (error) {
      console.error('Error calculating behavioral risk:', error);
    }

    return Math.min(100, riskScore);
  }

  /**
   * Calculate transaction risk
   */
  private async calculateTransactionRisk(customerId: string): Promise<number> {
    let riskScore = 0;

    try {
      const transactions = await databaseService.getDb()
        .select()
        .from(schema.achPayments)
        .where(eq(schema.achPayments.customerId, customerId));

      if (transactions.length === 0) {
        return 0;
      }

      // Volume-based risk
      const totalVolume = transactions.reduce((sum, tx) => sum + parseFloat(tx.amountCents || '0'), 0);
      if (totalVolume > 10000000) { // $100,000
        riskScore += 20;
      }

      // Frequency-based risk
      const daysActive = (Date.now() - transactions[transactions.length - 1].createdAt.getTime()) / (1000 * 60 * 60 * 24);
      const dailyFrequency = transactions.length / Math.max(1, daysActive);
      
      if (dailyFrequency > 10) { // More than 10 transactions per day
        riskScore += 30;
      }

      // Amount-based risk
      const amounts = transactions.map(tx => parseFloat(tx.amountCents || '0'));
      const maxAmount = Math.max(...amounts);
      if (maxAmount > 5000000) { // $50,000
        riskScore += 25;
      }

    } catch (error) {
      console.error('Error calculating transaction risk:', error);
    }

    return Math.min(100, riskScore);
  }

  /**
   * Calculate geographic risk
   */
  private async calculateGeographicRisk(customer: Customer): Promise<number> {
    try {
      // For now, assume US-based customers have low risk
      // In production, would use actual geographic data
      return 10; // Low risk default
    } catch (error) {
      console.error('Error calculating geographic risk:', error);
      return 0;
    }
  }

  /**
   * Calculate compliance risk
   */
  private async calculateComplianceRisk(customerId: string): Promise<number> {
    let riskScore = 0;

    try {
      // Check for KYC/AML compliance flags
      const complianceFlags = await this.checkComplianceFlags(customerId);
      
      if (complianceFlags.kycMissing) riskScore += 30;
      if (complianceFlags.amlFlags) riskScore += 40;
      if (complianceFlags.sanctionsMatch) riskScore += 50;
      if (complianceFlags.pepMatch) riskScore += 35;

    } catch (error) {
      console.error('Error calculating compliance risk:', error);
    }

    return Math.min(100, riskScore);
  }

  /**
   * Check compliance flags
   */
  private async checkComplianceFlags(customerId: string): Promise<{
    kycMissing: boolean;
    amlFlags: boolean;
    sanctionsMatch: boolean;
    pepMatch: boolean;
  }> {
    // Mock implementation - would integrate with actual compliance systems
    return {
      kycMissing: false,
      amlFlags: false,
      sanctionsMatch: false,
      pepMatch: false
    };
  }

  /**
   * Get merchant category risk score
   */
  private getMerchantCategoryRisk(category: string): number {
    const highRiskCategories = {
      'cryptocurrency': 80,
      'gambling': 90,
      'adult': 70,
      'electronics': 40,
      'clothing': 20,
      'food': 10,
      'utilities': 5
    };

    const normalizedCategory = category.toLowerCase();
    return highRiskCategories[normalizedCategory] || 20; // Default medium risk
  }

  /**
   * Get geographic risk score
   */
  private async getGeographicRiskScore(country: string): Promise<number> {
    const geoProfile = this.geographicRiskProfiles.get(country);
    return geoProfile ? geoProfile.riskScore : 20; // Default medium risk
  }

  /**
   * Calculate time-based risk
   */
  private calculateTimeRisk(timestamp: Date): number {
    const hour = timestamp.getHours();
    const dayOfWeek = timestamp.getDay();

    // Higher risk during late night/early morning hours
    if (hour >= 0 && hour <= 5) return 60;
    if (hour >= 22 || hour <= 6) return 40;

    // Higher risk on weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) return 30;

    return 10; // Normal business hours
  }

  /**
   * Calculate behavioral anomaly score
   */
  private async calculateBehavioralAnomaly(customerId: string, transactionData: any): Promise<number> {
    try {
      const profile = this.customerRiskProfiles.get(customerId);
      if (!profile) return 0;

      // Check if transaction amount is unusual
      const amountAnomaly = Math.abs(transactionData.amount - profile.riskFactors.behavioralRisk) / profile.riskFactors.behavioralRisk;
      
      return Math.min(100, amountAnomaly * 100);
    } catch (error) {
      console.error('Error calculating behavioral anomaly:', error);
      return 0;
    }
  }

  /**
   * Normalize transaction amount for risk calculation
   */
  private normalizeTransactionAmount(amount: number): number {
    if (amount <= this.config.transactionThresholds.small) return 0.1;
    if (amount <= this.config.transactionThresholds.medium) return 0.3;
    if (amount <= this.config.transactionThresholds.large) return 0.6;
    if (amount <= this.config.transactionThresholds.veryLarge) return 0.8;
    return 1.0;
  }

  /**
   * Calculate overall risk score
   */
  private calculateOverallRiskScore(factors: {
    demographicRisk: number;
    behavioralRisk: number;
    transactionRisk: number;
    geographicRisk: number;
    complianceRisk: number;
  }): number {
    const weights = {
      demographicRisk: 0.15,
      behavioralRisk: 0.25,
      transactionRisk: 0.30,
      geographicRisk: 0.15,
      complianceRisk: 0.15
    };

    const weightedScore = 
      factors.demographicRisk * weights.demographicRisk +
      factors.behavioralRisk * weights.behavioralRisk +
      factors.transactionRisk * weights.transactionRisk +
      factors.geographicRisk * weights.geographicRisk +
      factors.complianceRisk * weights.complianceRisk;

    return Math.round(weightedScore * 10); // Scale to 0-1000
  }

  /**
   * Determine risk tier
   */
  private determineRiskTier(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (riskScore >= this.config.customerRiskTiers.critical.min) return 'critical';
    if (riskScore >= this.config.customerRiskTiers.high.min) return 'high';
    if (riskScore >= this.config.customerRiskTiers.medium.min) return 'medium';
    return 'low';
  }

  /**
   * Calculate risk limits based on tier
   */
  private calculateRiskLimits(riskTier: string): CustomerRiskProfile['limits'] {
    const limitsMap = {
      low: {
        dailyTransactionLimit: 10000000, // $100,000
        monthlyTransactionLimit: 100000000, // $1,000,000
        singleTransactionLimit: 5000000, // $50,000
        velocityLimitPerHour: 20,
        velocityLimitPerDay: 100
      },
      medium: {
        dailyTransactionLimit: 5000000, // $50,000
        monthlyTransactionLimit: 50000000, // $500,000
        singleTransactionLimit: 2500000, // $25,000
        velocityLimitPerHour: 10,
        velocityLimitPerDay: 50
      },
      high: {
        dailyTransactionLimit: 1000000, // $10,000
        monthlyTransactionLimit: 10000000, // $100,000
        singleTransactionLimit: 500000, // $5,000
        velocityLimitPerHour: 5,
        velocityLimitPerDay: 25
      },
      critical: {
        dailyTransactionLimit: 100000, // $1,000
        monthlyTransactionLimit: 1000000, // $10,000
        singleTransactionLimit: 50000, // $500
        velocityLimitPerHour: 2,
        velocityLimitPerDay: 10
      }
    };

    return limitsMap[riskTier as keyof typeof limitsMap];
  }

  /**
   * Determine customer status based on risk
   */
  private determineCustomerStatus(riskTier: string): CustomerRiskProfile['status'] {
    const statusMap = {
      low: 'active',
      medium: 'active',
      high: 'monitored',
      critical: 'suspended'
    };

    return statusMap[riskTier as keyof typeof statusMap];
  }

  /**
   * Determine transaction risk category
   */
  private determineRiskCategory(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (riskScore >= 80) return 'critical';
    if (riskScore >= 60) return 'high';
    if (riskScore >= 30) return 'medium';
    return 'low';
  }

  /**
   * Determine recommended actions
   */
  private determineRecommendedActions(
    riskScore: number,
    factors: TransactionRiskAssessment['assessmentFactors'],
    listFlags: any
  ): RiskAction[] {
    const actions: RiskAction[] = [];

    // Blacklist actions
    if (listFlags.isBlacklisted) {
      actions.push({
        type: 'block',
        priority: 'critical',
        description: 'Transaction blocked - customer/IP on blacklist',
        automatic: true
      });
    }

    // High risk score actions
    if (riskScore >= 80) {
      actions.push({
        type: 'block',
        priority: 'critical',
        description: 'Transaction blocked - critical risk score',
        automatic: true
      });
    } else if (riskScore >= 60) {
      actions.push({
        type: 'manual_review',
        priority: 'high',
        description: 'Manual review required - high risk score',
        automatic: false
      });
    } else if (riskScore >= 30) {
      actions.push({
        type: 'additional_verification',
        priority: 'medium',
        description: 'Additional verification required',
        automatic: true
      });
    }

    // Compliance flag actions
    if (listFlags.complianceFlags.length > 0) {
      actions.push({
        type: 'require_know_your_customer',
        priority: 'high',
        description: 'KYC verification required due to compliance flags',
        automatic: true
      });
    }

    return actions;
  }

  /**
   * Get customer data
   */
  private async getCustomerData(customerId: string): Promise<Customer | null> {
    try {
      const customers = await databaseService.getDb()
        .select()
        .from(schema.customers)
        .where(eq(schema.customers.id, customerId));

      return customers.length > 0 ? customers[0] : null;
    } catch (error) {
      console.error('Error getting customer data:', error);
      return null;
    }
  }

  /**
   * Get risk history
   */
  private async getRiskHistory(customerId: string): Promise<CustomerRiskProfile['riskHistory']> {
    // Mock implementation - would query actual risk assessment history
    return {
      lastAssessmentDate: new Date(),
      previousRiskScores: [],
      riskScoreTrend: 'stable',
      significantChanges: []
    };
  }

  /**
   * Check if profile is recent enough to use
   */
  private isProfileRecent(profile: CustomerRiskProfile): boolean {
    const hoursSinceUpdate = (Date.now() - profile.lastUpdated.getTime()) / (1000 * 60 * 60);
    return hoursSinceUpdate < 24; // Consider profile recent if less than 24 hours old
  }

  /**
   * Save customer risk profile
   */
  private async saveCustomerRiskProfile(profile: CustomerRiskProfile): Promise<void> {
    try {
      // In production, would save to database
      console.log('Saving customer risk profile:', profile.customerId, profile.riskScore);
    } catch (error) {
      console.error('Error saving customer risk profile:', error);
    }
  }

  /**
   * Log risk assessment
   */
  private async logRiskAssessment(
    type: 'CUSTOMER' | 'TRANSACTION',
    identifier: string,
    score: number,
    factors: any
  ): Promise<void> {
    try {
      const logData = {
        timestamp: new Date().toISOString(),
        type,
        identifier,
        score,
        factors,
        service: 'riskAssessmentService'
      };

      console.log('Risk Assessment Log:', JSON.stringify(logData, null, 2));
    } catch (error) {
      console.error('Failed to log risk assessment:', error);
    }
  }

  /**
   * Log business rule execution
   */
  private async logBusinessRuleExecution(ruleId: string, transactionId: string, matched: boolean): Promise<void> {
    try {
      const logData = {
        timestamp: new Date().toISOString(),
        ruleId,
        transactionId,
        matched,
        service: 'riskAssessmentService'
      };

      console.log('Business Rule Execution Log:', JSON.stringify(logData, null, 2));
    } catch (error) {
      console.error('Failed to log business rule execution:', error);
    }
  }

  /**
   * Check if email domain is high risk
   */
  private isHighRiskEmailDomain(domain: string): boolean {
    const highRiskDomains = [
      'tempmail.com',
      '10minutemail.com',
      'guerrillamail.com',
      'mailinator.com'
    ];

    return highRiskDomains.includes(domain.toLowerCase());
  }

  /**
   * Calculate variance for array of numbers
   */
  private calculateVariance(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
    
    return variance;
  }

  /**
   * Initialize risk assessment configuration
   */
  private initializeConfig(): RiskAssessmentConfig {
    return {
      customerRiskTiers: {
        low: { min: 0, max: 250 },
        medium: { min: 250, max: 500 },
        high: { min: 500, max: 750 },
        critical: { min: 750, max: 1000 }
      },
      transactionThresholds: {
        small: 100000, // $1,000
        medium: 1000000, // $10,000
        large: 10000000, // $100,000
        veryLarge: 100000000 // $1,000,000
      },
      behavioralThresholds: {
        newCustomerDays: 30,
        frequentTransactionDays: 7,
        volumeVarianceThreshold: 0.5
      },
      geographicRiskWeights: {
        'US': 0.1,
        'CA': 0.2,
        'GB': 0.15,
        'DE': 0.2,
        'CN': 0.8,
        'RU': 0.9
      },
      industryRiskWeights: {
        'retail': 0.3,
        'services': 0.2,
        'technology': 0.25,
        'finance': 0.5,
        'gambling': 0.9,
        'cryptocurrency': 0.8
      }
    };
  }

  /**
   * Initialize business rules
   */
  private initializeBusinessRules(): void {
    // High amount transaction rule
    this.businessRules.set('HIGH_AMOUNT', {
      id: 'HIGH_AMOUNT',
      name: 'High Amount Transaction',
      description: 'Flag transactions above $50,000',
      category: 'transaction',
      conditions: [{
        field: 'transaction.amount',
        operator: 'greater_than',
        value: 5000000
      }],
      actions: [{
        type: 'manual_review',
        priority: 'high',
        description: 'Manual review required for high amount transaction',
        automatic: false
      }],
      priority: 10,
      active: true,
      createdDate: new Date(),
      lastModified: new Date(),
      executionCount: 0
    });

    // New customer high amount rule
    this.businessRules.set('NEW_CUSTOMER_HIGH_AMOUNT', {
      id: 'NEW_CUSTOMER_HIGH_AMOUNT',
      name: 'New Customer High Amount',
      description: 'Flag high amount transactions from new customers',
      category: 'customer',
      conditions: [
        {
          field: 'risk.customerRiskTier',
          operator: 'less_than',
          value: 0.3
        },
        {
          field: 'transaction.amount',
          operator: 'greater_than',
          value: 1000000
        }
      ],
      actions: [{
        type: 'additional_verification',
        priority: 'high',
        description: 'Additional verification required for new customer high amount',
        automatic: true
      }],
      priority: 8,
      active: true,
      createdDate: new Date(),
      lastModified: new Date(),
      executionCount: 0
    });

    // International transaction rule
    this.businessRules.set('INTERNATIONAL_TRANSACTION', {
      id: 'INTERNATIONAL_TRANSACTION',
      name: 'International Transaction',
      description: 'Flag transactions from high-risk countries',
      category: 'compliance',
      conditions: [{
        field: 'risk.geographicRisk',
        operator: 'greater_than',
        value: 0.7
      }],
      actions: [{
        type: 'require_know_your_customer',
        priority: 'medium',
        description: 'KYC verification required for international transaction',
        automatic: true
      }],
      priority: 5,
      active: true,
      createdDate: new Date(),
      lastModified: new Date(),
      executionCount: 0
    });
  }

  /**
   * Initialize geographic risk profiles
   */
  private initializeGeographicRiskProfiles(): void {
    const profiles: Record<string, GeographicRiskProfile> = {
      'US': {
        country: 'US',
        region: 'North America',
        riskLevel: 'low',
        riskScore: 5,
        factors: {
          economicStability: 90,
          politicalStability: 85,
          corruptionIndex: 10,
          financialRegulations: 95,
          sanctionsRisk: 5,
          fraudPrevalence: 10
        },
        lastUpdated: new Date(),
        dataSource: 'World Bank, Transparency International'
      },
      'CN': {
        country: 'CN',
        region: 'Asia',
        riskLevel: 'high',
        riskScore: 75,
        factors: {
          economicStability: 70,
          politicalStability: 60,
          corruptionIndex: 40,
          financialRegulations: 65,
          sanctionsRisk: 60,
          fraudPrevalence: 70
        },
        lastUpdated: new Date(),
        dataSource: 'World Bank, Transparency International'
      },
      'RU': {
        country: 'RU',
        region: 'Europe/Asia',
        riskLevel: 'critical',
        riskScore: 90,
        factors: {
          economicStability: 40,
          politicalStability: 30,
          corruptionIndex: 60,
          financialRegulations: 40,
          sanctionsRisk: 95,
          fraudPrevalence: 80
        },
        lastUpdated: new Date(),
        dataSource: 'World Bank, Transparency International'
      }
    };

    for (const [country, profile] of Object.entries(profiles)) {
      this.geographicRiskProfiles.set(country, profile);
    }
  }

  /**
   * Add entry to risk list
   */
  async addRiskListEntry(entry: Omit<RiskListEntry, 'id' | 'addedDate'>): Promise<string> {
    const id = `risk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullEntry: RiskListEntry = {
      ...entry,
      id,
      addedDate: new Date()
    };

    const categoryEntries = this.riskLists.get(entry.category) || [];
    categoryEntries.push(fullEntry);
    this.riskLists.set(entry.category, categoryEntries);

    // Log risk list addition
    await this.logRiskListChange('ADD', fullEntry);

    return id;
  }

  /**
   * Remove entry from risk list
   */
  async removeRiskListEntry(entryId: string): Promise<void> {
    for (const [category, entries] of this.riskLists.entries()) {
      const index = entries.findIndex(entry => entry.id === entryId);
      if (index !== -1) {
        const removedEntry = entries.splice(index, 1)[0];
        this.riskLists.set(category, entries);
        
        // Log risk list removal
        await this.logRiskListChange('REMOVE', removedEntry);
        break;
      }
    }
  }

  /**
   * Get risk metrics
   */
  async getRiskMetrics(timeRange: { start: Date; end: Date }): Promise<{
    totalAssessments: number;
    highRiskCustomers: number;
    blockedTransactions: number;
    averageRiskScore: number;
    topRiskFactors: string[];
  }> {
    try {
      // Mock implementation - would query actual assessment logs
      return {
        totalAssessments: 5000,
        highRiskCustomers: 150,
        blockedTransactions: 45,
        averageRiskScore: 35.2,
        topRiskFactors: ['behavioral', 'transaction', 'geographic']
      };
    } catch (error) {
      console.error('Error getting risk metrics:', error);
      throw error;
    }
  }

  /**
   * Log risk list change
   */
  private async logRiskListChange(action: 'ADD' | 'REMOVE', entry: RiskListEntry): Promise<void> {
    try {
      const logData = {
        timestamp: new Date().toISOString(),
        action,
        entry,
        service: 'riskAssessmentService'
      };

      console.log('Risk List Change Log:', JSON.stringify(logData, null, 2));
    } catch (error) {
      console.error('Failed to log risk list change:', error);
    }
  }
}

export const riskAssessmentService = new RiskAssessmentService();