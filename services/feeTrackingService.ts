/**
 * ORACLE-LEDGER Stripe Fee Tracking Service
 * Comprehensive fee calculation and tracking for all payment types
 * Updated: 2025-11-02
 */

export interface FeeCalculationRequest {
  paymentType: 'ACH_DEBIT' | 'ACH_CREDIT' | 'CARD' | 'DIRECT_DEPOSIT';
  amountCents: number;
  customerType?: 'business' | 'consumer';
  volumeTier?: 'low' | 'medium' | 'high' | 'enterprise';
  riskLevel?: 'low' | 'medium' | 'high';
  processingLocation?: 'domestic' | 'international';
  cardType?: 'debit' | 'credit' | 'prepaid';
}

export interface FeeBreakdown {
  processingFee: number;
  achFee: number;
  stripeFee: number;
  bankFee: number;
  verificationFee: number;
  payoutFee: number;
  totalFee: number;
  effectiveRate: number;
  breakdown: {
    baseRate: number;
    percentageRate: number;
    flatFees: number;
    caps: {
      achCap: number;
      maxFee: number;
    };
  };
}

export interface FeeAllocation {
  paymentId: string;
  feeEntries: FeeEntry[];
  journalEntryId?: string;
  totalAllocated: number;
  createdAt: Date;
}

export interface FeeEntry {
  accountId: string;
  accountName: string;
  feeType: string;
  amount: number;
  description: string;
  source: string;
}

export interface MonthlyFeeReport {
  month: string;
  year: number;
  totalVolume: number;
  totalFees: number;
  feesByType: {
    achDebit: number;
    achCredit: number;
    cardProcessing: number;
    directDeposit: number;
    verification: number;
  };
  feesByCategory: {
    processing: number;
    bank: number;
    stripe: number;
    compliance: number;
  };
  optimizationMetrics: {
    costPerTransaction: number;
    effectiveRate: number;
    volumeDiscounts: number;
    potentialSavings: number;
  };
}

export interface FeeOptimizationRecommendation {
  id: string;
  type: 'ACH_ROUTING' | 'VOLUME_DISCOUNT' | 'RATE_NEGOTIATION' | 'PROCESSING_OPTIMIZATION';
  title: string;
  description: string;
  potentialSavings: number;
  implementationCost: number;
  roi: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timeframe: string;
  requirements: string[];
}

export interface FeeComplianceRecord {
  id: string;
  transactionId: string;
  feeType: string;
  amount: number;
  calculationMethod: string;
  regulatoryRequirement: string;
  complianceStatus: 'compliant' | 'non_compliant' | 'pending_review';
  auditTrail: {
    calculatedBy: string;
    calculatedAt: Date;
    validatedBy?: string;
    validatedAt?: Date;
    approvedBy?: string;
    approvedAt?: Date;
  };
}

export interface FeeVarianceAlert {
  id: string;
  type: 'threshold_exceeded' | 'unusual_pattern' | 'compliance_risk' | 'cost_increase';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  currentValue: number;
  expectedValue: number;
  variance: number;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface FeeDisputeRecord {
  id: string;
  feeTransactionId: string;
  disputeType: 'duplicate_charge' | 'incorrect_calculation' | 'unauthorized_fee' | 'processing_error';
  status: 'open' | 'under_review' | 'resolved' | 'escalated';
  amount: number;
  reason: string;
  evidence: string[];
  stripeDisputeId?: string;
  resolution?: {
    outcome: 'accepted' | 'rejected' | 'partial_refund' | 'refunded';
    amount: number;
    refundDate?: Date;
    notes: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export class FeeTrackingService {
  private readonly ACH_FEE_CENTS = 80; // $0.80 per ACH transaction
  private readonly ACH_FEE_CAP_CENTS = 500; // $5.00 cap per transaction
  private readonly STRIPE_CARD_RATE = 0.029; // 2.9% + $0.30
  private readonly STRIPE_CARD_FIXED_FEE_CENTS = 30; // $0.30 per card transaction
  private readonly DIRECT_DEPOSIT_BASE_FEE_CENTS = 100; // $1.00 base
  private readonly VERIFICATION_FEE_CENTS = 50; // $0.50 per verification
  private readonly BANK_VERIFICATION_FEE_CENTS = 200; // $2.00 for bank verification

  private readonly ACCOUNT_MAPPINGS = {
    'ACH_FEE_EXPENSE': 6500, // Account ID for ACH fee expenses
    'CARD_PROCESSING_FEE_EXPENSE': 6510, // Card processing fee expenses
    'STRIPE_FEE_EXPENSE': 6520, // Stripe platform fees
    'BANK_FEE_EXPENSE': 6530, // Banking fees
    'PAYOUT_FEE_EXPENSE': 6540, // Payout fees
    'VERIFICATION_FEE_EXPENSE': 6550, // Verification fees
    'COMPLIANCE_FEE_EXPENSE': 6560, // Compliance fees
    'FEE_ADJUSTMENT_INCOME': 4500, // Fee adjustment income (negative expense)
  };

  /**
   * Calculate comprehensive fees for a payment transaction
   */
  calculateFees(request: FeeCalculationRequest): FeeBreakdown {
    let processingFee = 0;
    let achFee = 0;
    let stripeFee = 0;
    let bankFee = 0;
    let verificationFee = 0;
    let payoutFee = 0;

    switch (request.paymentType) {
      case 'ACH_DEBIT':
        achFee = Math.min(this.ACH_FEE_CENTS, this.ACH_FEE_CAP_CENTS);
        
        // Volume-based ACH pricing
        if (request.volumeTier === 'high' || request.volumeTier === 'enterprise') {
          achFee = Math.round(achFee * 0.85); // 15% discount for high volume
        } else if (request.volumeTier === 'medium') {
          achFee = Math.round(achFee * 0.92); // 8% discount for medium volume
        }
        
        // Risk-based adjustments
        if (request.riskLevel === 'high') {
          achFee = Math.round(achFee * 1.25); // 25% surcharge for high risk
        }
        
        processingFee = achFee;
        bankFee = 25; // $0.25 per ACH transaction
        break;

      case 'ACH_CREDIT':
        achFee = Math.min(Math.round(this.ACH_FEE_CENTS * 0.6), this.ACH_FEE_CAP_CENTS);
        processingFee = achFee;
        bankFee = 20; // $0.20 for ACH credit
        break;

      case 'CARD':
        stripeFee = Math.round(request.amountCents * this.STRIPE_CARD_RATE) + this.STRIPE_CARD_FIXED_FEE_CENTS;
        
        // Apply volume discounts for cards
        if (request.volumeTier === 'high' || request.volumeTier === 'enterprise') {
          stripeFee = Math.round(stripeFee * 0.90); // 10% discount
        } else if (request.volumeTier === 'medium') {
          stripeFee = Math.round(stripeFee * 0.95); // 5% discount
        }
        
        // Card type adjustments
        if (request.cardType === 'debit') {
          stripeFee = Math.round(stripeFee * 0.85); // 15% discount for debit
        }
        
        // Risk level adjustments
        if (request.riskLevel === 'high') {
          stripeFee = Math.round(stripeFee * 1.15); // 15% surcharge
        }
        
        processingFee = stripeFee;
        bankFee = 10; // $0.10 interchange clearing
        break;

      case 'DIRECT_DEPOSIT':
        payoutFee = this.DIRECT_DEPOSIT_BASE_FEE_CENTS;
        if (request.amountCents > 1000000) { // > $10,000
          payoutFee = Math.round(payoutFee * 1.5);
        }
        processingFee = payoutFee;
        verificationFee = this.VERIFICATION_FEE_CENTS;
        bankFee = 75; // $0.75 for direct deposit processing
        break;
    }

    const totalFee = processingFee + bankFee + verificationFee + payoutFee;
    const effectiveRate = (totalFee / request.amountCents) * 100;

    return {
      processingFee,
      achFee,
      stripeFee,
      bankFee,
      verificationFee,
      payoutFee,
      totalFee,
      effectiveRate,
      breakdown: {
        baseRate: this.getBaseRate(request),
        percentageRate: this.getPercentageRate(request),
        flatFees: processingFee,
        caps: {
          achCap: this.ACH_FEE_CAP_CENTS,
          maxFee: Math.round(request.amountCents * 0.05) // 5% maximum fee cap
        }
      }
    };
  }

  /**
   * Create fee allocation entries for journal entries
   */
  createFeeAllocation(paymentId: string, feeBreakdown: FeeBreakdown, request: FeeCalculationRequest): FeeAllocation {
    const feeEntries: FeeEntry[] = [];

    // Map fees to appropriate expense accounts
    if (feeBreakdown.achFee > 0) {
      feeEntries.push({
        accountId: this.ACCOUNT_MAPPINGS['ACH_FEE_EXPENSE'].toString(),
        accountName: 'ACH Fee Expense',
        feeType: 'ACH Processing Fee',
        amount: feeBreakdown.achFee,
        description: 'ACH transaction processing fee',
        source: 'NACHA'
      });
    }

    if (feeBreakdown.stripeFee > 0) {
      feeEntries.push({
        accountId: this.ACCOUNT_MAPPINGS['CARD_PROCESSING_FEE_EXPENSE'].toString(),
        accountName: 'Card Processing Fee Expense',
        feeType: 'Card Processing Fee',
        amount: feeBreakdown.stripeFee,
        description: 'Credit/debit card processing fee',
        source: 'Stripe'
      });

      // Split Stripe fees between platform fee and processing fee
      feeEntries.push({
        accountId: this.ACCOUNT_MAPPINGS['STRIPE_FEE_EXPENSE'].toString(),
        accountName: 'Stripe Platform Fee Expense',
        feeType: 'Platform Fee',
        amount: Math.round(feeBreakdown.stripeFee * 0.3),
        description: 'Stripe platform and infrastructure fee',
        source: 'Stripe'
      });
    }

    if (feeBreakdown.bankFee > 0) {
      feeEntries.push({
        accountId: this.ACCOUNT_MAPPINGS['BANK_FEE_EXPENSE'].toString(),
        accountName: 'Bank Fee Expense',
        feeType: 'Banking Fee',
        amount: feeBreakdown.bankFee,
        description: 'Banking and clearing fees',
        source: 'Bank'
      });
    }

    if (feeBreakdown.payoutFee > 0) {
      feeEntries.push({
        accountId: this.ACCOUNT_MAPPINGS['PAYOUT_FEE_EXPENSE'].toString(),
        accountName: 'Payout Fee Expense',
        feeType: 'Payout Fee',
        amount: feeBreakdown.payoutFee,
        description: 'Direct deposit payout fee',
        source: 'Payroll'
      });
    }

    if (feeBreakdown.verificationFee > 0) {
      feeEntries.push({
        accountId: this.ACCOUNT_MAPPINGS['VERIFICATION_FEE_EXPENSE'].toString(),
        accountName: 'Verification Fee Expense',
        feeType: 'Verification Fee',
        amount: feeBreakdown.verificationFee,
        description: 'Account verification fee',
        source: 'Compliance'
      });
    }

    // Apply volume discounts as negative fees (income)
    const volumeDiscount = this.calculateVolumeDiscount(request);
    if (volumeDiscount > 0) {
      feeEntries.push({
        accountId: this.ACCOUNT_MAPPINGS['FEE_ADJUSTMENT_INCOME'].toString(),
        accountName: 'Fee Adjustment Income',
        feeType: 'Volume Discount',
        amount: -volumeDiscount,
        description: 'Volume-based fee discount',
        source: 'Discount'
      });
    }

    return {
      paymentId,
      feeEntries,
      totalAllocated: feeEntries.reduce((sum, entry) => sum + entry.amount, 0),
      createdAt: new Date()
    };
  }

  /**
   * Generate monthly fee report
   */
  async generateMonthlyReport(month: number, year: number): Promise<MonthlyFeeReport> {
    // This would query the actual database
    // For now, returning mock data structure
    const mockReport: MonthlyFeeReport = {
      month: month.toString(),
      year,
      totalVolume: 125000000, // $1,250,000
      totalFees: 875000, // $8,750
      feesByType: {
        achDebit: 450000, // $4,500
        achCredit: 125000, // $1,250
        cardProcessing: 225000, // $2,250
        directDeposit: 75000, // $750
        verification: 0
      },
      feesByCategory: {
        processing: 525000, // $5,250
        bank: 175000, // $1,750
        stripe: 140000, // $1,400
        compliance: 35000 // $350
      },
      optimizationMetrics: {
        costPerTransaction: 175, // $1.75
        effectiveRate: 0.7, // 0.7%
        volumeDiscounts: 0,
        potentialSavings: 52500 // $525
      }
    };

    return mockReport;
  }

  /**
   * Generate fee optimization recommendations
   */
  generateOptimizationRecommendations(currentFees: MonthlyFeeReport): FeeOptimizationRecommendation[] {
    const recommendations: FeeOptimizationRecommendation[] = [];

    // ACH routing optimization
    if (currentFees.feesByType.cardProcessing > currentFees.feesByType.achDebit * 1.5) {
      recommendations.push({
        id: 'ach-routing-1',
        type: 'ACH_ROUTING',
        title: 'Optimize Payment Method Routing',
        description: 'Route high-value transactions through ACH instead of cards to reduce processing costs',
        potentialSavings: Math.round(currentFees.feesByType.cardProcessing * 0.4),
        implementationCost: 5000,
        roi: 8.5,
        priority: 'high',
        timeframe: '2-4 weeks',
        requirements: ['Customer consent for ACH routing', 'Updated payment forms', 'Process changes']
      });
    }

    // Volume discount negotiation
    if (currentFees.totalVolume > 100000000) { // > $1M monthly
      recommendations.push({
        id: 'volume-discount-1',
        type: 'VOLUME_DISCOUNT',
        title: 'Negotiate Volume-Based Discounts',
        description: 'Based on current volume ($1.25M/month), negotiate enterprise pricing tiers',
        potentialSavings: currentFees.optimizationMetrics.potentialSavings,
        implementationCost: 0,
        roi: Infinity,
        priority: 'critical',
        timeframe: '1-2 weeks',
        requirements: ['Contract renegotiation', 'Account manager engagement']
      });
    }

    // Direct deposit optimization
    if (currentFees.feesByType.directDeposit > 100000) { // > $1,000 in fees
      recommendations.push({
        id: 'dd-optimization-1',
        type: 'PROCESSING_OPTIMIZATION',
        title: 'Optimize Direct Deposit Processing',
        description: 'Bundle direct deposits to reduce per-transaction fees',
        potentialSavings: Math.round(currentFees.feesByType.directDeposit * 0.3),
        implementationCost: 2500,
        roi: 4.2,
        priority: 'medium',
        timeframe: '3-6 weeks',
        requirements: ['Payroll system updates', 'Employee notification', 'Schedule changes']
      });
    }

    return recommendations;
  }

  /**
   * Create compliance record for fee calculations
   */
  createComplianceRecord(
    transactionId: string,
    feeType: string,
    amount: number,
    calculationMethod: string,
    regulatoryRequirement: string
  ): FeeComplianceRecord {
    return {
      id: `compliance-${transactionId}-${Date.now()}`,
      transactionId,
      feeType,
      amount,
      calculationMethod,
      regulatoryRequirement,
      complianceStatus: 'compliant',
      auditTrail: {
        calculatedBy: 'system',
        calculatedAt: new Date(),
        validatedBy: undefined,
        validatedAt: undefined,
        approvedBy: undefined,
        approvedAt: undefined
      }
    };
  }

  /**
   * Track fee variance and alert on anomalies
   */
  checkFeeVariance(
    currentFees: FeeBreakdown,
    historicalAverages: { [key: string]: number },
    thresholds: { [key: string]: number }
  ): FeeVarianceAlert[] {
    const alerts: FeeVarianceAlert[] = [];

    // Check for unusual fee increases
    if (currentFees.totalFee > (historicalAverages.totalFee || 0) * 1.2) {
      alerts.push({
        id: `variance-${Date.now()}`,
        type: 'unusual_pattern',
        severity: 'medium',
        message: 'Total fees 20% above historical average',
        currentValue: currentFees.totalFee,
        expectedValue: historicalAverages.totalFee || 0,
        variance: currentFees.totalFee - (historicalAverages.totalFee || 0),
        timestamp: new Date(),
        resolved: false
      });
    }

    // Check effective rate variance
    if (currentFees.effectiveRate > (historicalAverages.effectiveRate || 0) * 1.15) {
      alerts.push({
        id: `variance-rate-${Date.now()}`,
        type: 'cost_increase',
        severity: 'high',
        message: 'Effective fee rate increased by more than 15%',
        currentValue: currentFees.effectiveRate,
        expectedValue: historicalAverages.effectiveRate || 0,
        variance: currentFees.effectiveRate - (historicalAverages.effectiveRate || 0),
        timestamp: new Date(),
        resolved: false
      });
    }

    return alerts;
  }

  /**
   * Create fee dispute record
   */
  createFeeDispute(
    feeTransactionId: string,
    disputeType: FeeDisputeRecord['disputeType'],
    amount: number,
    reason: string,
    evidence: string[] = []
  ): FeeDisputeRecord {
    return {
      id: `dispute-${feeTransactionId}-${Date.now()}`,
      feeTransactionId,
      disputeType,
      status: 'open',
      amount,
      reason,
      evidence,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Validate fee calculations for compliance
   */
  validateFeeCalculation(feeBreakdown: FeeBreakdown, request: FeeCalculationRequest): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate ACH fee caps
    if (request.paymentType === 'ACH_DEBIT' && feeBreakdown.achFee > this.ACH_FEE_CAP_CENTS) {
      errors.push(`ACH fee exceeds cap of $${(this.ACH_FEE_CAP_CENTS / 100).toFixed(2)}`);
    }

    // Validate effective rate bounds
    if (feeBreakdown.effectiveRate > 5) {
      warnings.push('Effective fee rate exceeds 5% - review for optimization opportunities');
    }

    if (feeBreakdown.effectiveRate < 0.1) {
      warnings.push('Effective fee rate below 0.1% - verify calculation accuracy');
    }

    // Validate fee components sum
    const expectedTotal = feeBreakdown.processingFee + feeBreakdown.bankFee + feeBreakdown.verificationFee + feeBreakdown.payoutFee;
    if (Math.abs(expectedTotal - feeBreakdown.totalFee) > 1) {
      errors.push('Fee components do not sum to total fee');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get base rate for fee calculation
   */
  private getBaseRate(request: FeeCalculationRequest): number {
    switch (request.paymentType) {
      case 'ACH_DEBIT':
      case 'ACH_CREDIT':
        return this.ACH_FEE_CENTS;
      case 'CARD':
        return this.STRIPE_CARD_FIXED_FEE_CENTS;
      case 'DIRECT_DEPOSIT':
        return this.DIRECT_DEPOSIT_BASE_FEE_CENTS;
      default:
        return 0;
    }
  }

  /**
   * Get percentage rate for fee calculation
   */
  private getPercentageRate(request: FeeCalculationRequest): number {
    switch (request.paymentType) {
      case 'CARD':
        return this.STRIPE_CARD_RATE;
      default:
        return 0;
    }
  }

  /**
   * Calculate volume discount
   */
  private calculateVolumeDiscount(request: FeeCalculationRequest): number {
    let discount = 0;
    
    switch (request.volumeTier) {
      case 'enterprise':
        discount = 0.15; // 15%
        break;
      case 'high':
        discount = 0.10; // 10%
        break;
      case 'medium':
        discount = 0.05; // 5%
        break;
      default:
        discount = 0;
    }

    return Math.round(discount * request.amountCents * 0.01); // Assume 1% of volume as fee base
  }

  /**
   * Export fee data for reporting
   */
  exportFeeData(startDate: Date, endDate: Date, format: 'csv' | 'json' | 'pdf'): string {
    // Implementation would generate formatted export
    // This is a placeholder for the export functionality
    const data = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      transactions: [],
      summary: {},
      generatedAt: new Date().toISOString()
    };

    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'csv':
        return 'Transaction ID,Date,Type,Amount,Fee Amount,Effective Rate\n';
      case 'pdf':
        return 'PDF export would be generated here';
      default:
        return JSON.stringify(data);
    }
  }
}

// Export singleton instance
export const feeTrackingService = new FeeTrackingService();