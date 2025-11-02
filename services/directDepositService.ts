/**
 * ORACLE-LEDGER Direct Deposit Service with Fee Tracking Integration
 * Updated: 2025-11-02
 * Includes comprehensive fee calculation and tracking for payroll direct deposits
 */

import Stripe from 'stripe';
import { feeTrackingService, FeeCalculationRequest, FeeBreakdown } from './feeTrackingService';

export interface DirectDepositRequest {
  recipientId: string; // Stripe Connect account ID
  employeeId?: string; // Internal employee ID
  amount: number; // in dollars
  currency?: string;
  description: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  bankAccountId: string;
  scheduledDate?: string;
  purpose?: 'salary' | 'bonus' | 'reimbursement' | 'contractor_payment';
}

export interface DirectDepositResult {
  success: boolean;
  stripePayoutId?: string;
  directDepositId?: string;
  feeBreakdown: FeeBreakdown;
  feeAllocation: any;
  journalEntryId?: string;
  error?: string;
  estimatedArrivalDate?: string;
}

export interface DirectDepositBatchRequest {
  deposits: DirectDepositRequest[];
  batchDescription: string;
  scheduledDate: string;
  payPeriodStart: string;
  payPeriodEnd: string;
}

export interface DirectDepositBatchResult {
  success: boolean;
  batchId?: string;
  successfulDeposits: number;
  failedDeposits: DirectDepositResult[];
  totalAmount: number;
  totalFees: number;
  processingTime: number;
}

export interface DirectDepositAdjustmentRequest {
  directDepositId: string;
  adjustmentType: 'correction' | 'supplement' | 'reversal';
  amount: number;
  reason: string;
  effectiveDate: string;
}

export interface DirectDepositReconciliationData {
  stripePayoutId: string;
  directDepositId: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: 'in_transit' | 'paid' | 'failed' | 'canceled';
  arrivalDate: Date;
  bankAccount: string;
}

export class DirectDepositService {
  private stripe: Stripe;
  private readonly BATCH_SIZE_LIMIT = 100;
  private readonly MAX_RETRY_ATTEMPTS = 3;

  constructor() {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY is required');
    }
    this.stripe = new Stripe(stripeKey, {
      apiVersion: '2024-06-20',
    });
  }

  /**
   * Process individual direct deposit with fee tracking
   */
  async processDirectDeposit(request: DirectDepositRequest): Promise<DirectDepositResult> {
    try {
      // Step 1: Calculate fees before processing
      const feeCalculationRequest: FeeCalculationRequest = {
        paymentType: 'DIRECT_DEPOSIT',
        amountCents: Math.round(request.amount * 100),
        customerType: 'business', // Direct deposits are business-to-employee
        volumeTier: 'medium', // Would be determined by company size
        riskLevel: 'low', // Direct deposits typically low risk
        processingLocation: 'domestic'
      };

      const feeBreakdown = feeTrackingService.calculateFees(feeCalculationRequest);

      // Step 2: Verify recipient account is ready
      const recipient = await this.verifyRecipientAccount(request.recipientId);
      if (!recipient) {
        throw new Error('Recipient account not found or not enabled for payouts');
      }

      // Step 3: Create payout via Stripe Connect
      const payout = await this.stripe.payouts.create(
        {
          amount: Math.round(request.amount * 100),
          currency: request.currency || 'usd',
          method: 'standard',
          description: request.description,
          arrival_date: request.scheduledDate ? 
            Math.floor(new Date(request.scheduledDate).getTime() / 1000) : 
            undefined,
          metadata: {
            recipient_id: request.recipientId,
            employee_id: request.employeeId || '',
            purpose: request.purpose || 'salary',
            pay_period_start: request.payPeriodStart,
            pay_period_end: request.payPeriodEnd,
            // Fee tracking metadata
            processing_fee_cents: feeBreakdown.processingFee.toString(),
            payout_fee_cents: feeBreakdown.payoutFee.toString(),
            verification_fee_cents: feeBreakdown.verificationFee.toString(),
            bank_fee_cents: feeBreakdown.bankFee.toString(),
            total_fee_cents: feeBreakdown.totalFee.toString(),
            effective_rate: feeBreakdown.effectiveRate.toString()
          }
        },
        {
          stripeAccount: request.recipientId
        }
      );

      // Step 4: Save direct deposit record with fee tracking
      const directDeposit = await this.saveDirectDepositRecord({
        stripePayoutId: payout.id,
        recipientId: request.recipientId,
        employeeId: request.employeeId,
        amountCents: Math.round(request.amount * 100),
        description: request.description,
        payPeriodStart: request.payPeriodStart,
        payPeriodEnd: request.payPeriodEnd,
        bankAccountId: request.bankAccountId,
        scheduledDate: request.scheduledDate,
        purpose: request.purpose || 'salary',
        status: payout.status,
        feeBreakdown,
        estimatedArrivalDate: payout.arrival_date ? 
          new Date(payout.arrival_date * 1000).toISOString() : 
          undefined
      });

      // Step 5: Create fee allocation
      const feeAllocation = feeTrackingService.createFeeAllocation(
        directDeposit.id,
        feeBreakdown,
        feeCalculationRequest
      );

      // Step 6: Create compliance records
      const complianceRecord = feeTrackingService.createComplianceRecord(
        directDeposit.id,
        'Direct Deposit Payout Fee',
        feeBreakdown.payoutFee,
        'Direct deposit processing with base fee plus amount-based adjustment',
        'Banking Regulations - Direct Deposit Processing'
      );

      // Step 7: Create journal entries for fee allocation
      const journalEntryId = await this.createDirectDepositFeeJournalEntries(
        directDeposit.id, 
        feeAllocation
      );

      // Step 8: Check for fee variance alerts
      const historicalAverages = await this.getHistoricalFeeAverages('DIRECT_DEPOSIT');
      const varianceAlerts = feeTrackingService.checkFeeVariance(
        feeBreakdown,
        historicalAverages,
        { 
          totalFee: Math.round(request.amount * 100 * 0.02), // 2% of amount
          effectiveRate: 0.02 // 2% threshold
        }
      );

      if (varianceAlerts.length > 0) {
        await this.saveVarianceAlerts(varianceAlerts);
      }

      return {
        success: true,
        stripePayoutId: payout.id,
        directDepositId: directDeposit.id,
        feeBreakdown,
        feeAllocation,
        journalEntryId,
        estimatedArrivalDate: payout.arrival_date ? 
          new Date(payout.arrival_date * 1000).toISOString() : 
          undefined
      };

    } catch (error) {
      console.error('Direct deposit processing failed:', error);
      
      await this.logProcessingError('DIRECT_DEPOSIT_FAILED', {
        request,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        feeBreakdown: {
          processingFee: 0,
          achFee: 0,
          stripeFee: 0,
          bankFee: 0,
          verificationFee: 0,
          payoutFee: 0,
          totalFee: 0,
          effectiveRate: 0,
          breakdown: {
            baseRate: 0,
            percentageRate: 0,
            flatFees: 0,
            caps: { achCap: 0, maxFee: 0 }
          }
        },
        feeAllocation: { feeEntries: [], totalAllocated: 0 },
        error: error instanceof Error ? error.message : 'Direct deposit processing failed'
      };
    }
  }

  /**
   * Process batch direct deposits with optimized fee calculation
   */
  async processDirectDepositBatch(request: DirectDepositBatchRequest): Promise<DirectDepositBatchResult> {
    const startTime = Date.now();
    let successfulDeposits = 0;
    const failedDeposits: DirectDepositResult[] = [];
    let totalAmount = 0;
    let totalFees = 0;

    try {
      // Validate batch size
      if (request.deposits.length > this.BATCH_SIZE_LIMIT) {
        throw new Error(`Batch size exceeds limit of ${this.BATCH_SIZE_LIMIT}`);
      }

      // Calculate batch-level volume discounts
      const totalBatchAmount = request.deposits.reduce((sum, deposit) => sum + deposit.amount, 0);
      const volumeTier = this.determineVolumeTier(totalBatchAmount);

      // Process each deposit in the batch
      for (const deposit of request.deposits) {
        try {
          const result = await this.processDirectDeposit({
            ...deposit,
            // Apply batch-level volume tier
          });

          if (result.success) {
            successfulDeposits++;
            totalAmount += deposit.amount;
            totalFees += result.feeBreakdown.totalFee;
          } else {
            failedDeposits.push(result);
          }
        } catch (error) {
          failedDeposits.push({
            success: false,
            feeBreakdown: {
              processingFee: 0,
              achFee: 0,
              stripeFee: 0,
              bankFee: 0,
              verificationFee: 0,
              payoutFee: 0,
              totalFee: 0,
              effectiveRate: 0,
              breakdown: {
                baseRate: 0,
                percentageRate: 0,
                flatFees: 0,
                caps: { achCap: 0, maxFee: 0 }
              }
            },
            feeAllocation: { feeEntries: [], totalAllocated: 0 },
            error: error instanceof Error ? error.message : 'Batch processing error'
          });
        }
      }

      // Save batch record
      const batchId = await this.saveBatchRecord({
        deposits: request.deposits,
        batchDescription: request.batchDescription,
        scheduledDate: request.scheduledDate,
        successfulDeposits,
        failedDeposits: failedDeposits.length,
        totalAmount,
        totalFees,
        processingTime: Date.now() - startTime
      });

      return {
        success: successfulDeposits > 0,
        batchId,
        successfulDeposits,
        failedDeposits,
        totalAmount,
        totalFees,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('Direct deposit batch processing failed:', error);
      return {
        success: false,
        successfulDeposits,
        failedDeposits,
        totalAmount,
        totalFees,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Process direct deposit adjustments
   */
  async processDirectDepositAdjustment(request: DirectDepositAdjustmentRequest): Promise<{
    success: boolean;
    adjustmentId?: string;
    newDepositId?: string;
    feeAdjustment?: number;
    error?: string;
  }> {
    try {
      // Step 1: Get the original direct deposit
      const originalDeposit = await this.getDirectDepositById(request.directDepositId);
      if (!originalDeposit) {
        throw new Error('Original direct deposit not found');
      }

      // Step 2: Calculate adjustment fees
      const adjustmentFee = this.calculateAdjustmentFee(request.adjustmentType, request.amount);

      if (request.adjustmentType === 'reversal') {
        // Create reversal (negative amount)
        const reversalResult = await this.processDirectDeposit({
          recipientId: originalDeposit.recipientId,
          employeeId: originalDeposit.employeeId,
          amount: -request.amount,
          description: `Reversal: ${request.reason}`,
          payPeriodStart: originalDeposit.payPeriodStart,
          payPeriodEnd: originalDeposit.payPeriodEnd,
          bankAccountId: originalDeposit.bankAccountId,
          purpose: 'reversal'
        });

        return {
          success: reversalResult.success,
          adjustmentId: `adjustment_${Date.now()}`,
          feeAdjustment: reversalResult.feeBreakdown.totalFee,
          error: reversalResult.error
        };

      } else {
        // Create supplemental payment (positive adjustment)
        const adjustmentResult = await this.processDirectDeposit({
          recipientId: originalDeposit.recipientId,
          employeeId: originalDeposit.employeeId,
          amount: request.amount,
          description: `Adjustment: ${request.reason}`,
          payPeriodStart: originalDeposit.payPeriodStart,
          payPeriodEnd: originalDeposit.payPeriodEnd,
          bankAccountId: originalDeposit.bankAccountId,
          purpose: 'supplement'
        });

        return {
          success: adjustmentResult.success,
          adjustmentId: `adjustment_${Date.now()}`,
          newDepositId: adjustmentResult.directDepositId,
          feeAdjustment: adjustmentResult.feeBreakdown.totalFee,
          error: adjustmentResult.error
        };
      }

    } catch (error) {
      console.error('Direct deposit adjustment failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Adjustment processing failed'
      };
    }
  }

  /**
   * Reconcile direct deposits with Stripe payouts
   */
  async reconcileDirectDeposits(): Promise<DirectDepositReconciliationData[]> {
    try {
      const payouts = await this.stripe.payouts.list({
        limit: 100,
        arrival_date: {
          gte: Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000)
        }
      });

      const reconciliations: DirectDepositReconciliationData[] = [];

      for (const payout of payouts.data) {
        if (payout.metadata?.recipient_id) {
          const reconciliation = await this.processDirectDepositReconciliation(payout);
          if (reconciliation) {
            reconciliations.push(reconciliation);
          }
        }
      }

      return reconciliations;

    } catch (error) {
      console.error('Direct deposit reconciliation failed:', error);
      throw error;
    }
  }

  /**
   * Get direct deposit statistics for reporting
   */
  async getDirectDepositStats(startDate: Date, endDate: Date): Promise<{
    totalDeposits: number;
    totalVolume: number;
    totalFees: number;
    averageDeposit: number;
    averageFee: number;
    successRate: number;
    processingTime: number;
    feeByType: { [key: string]: number };
    purposeBreakdown: { [key: string]: { count: number; volume: number; fees: number } };
  }> {
    // Mock data - would query database
    return {
      totalDeposits: 892,
      totalVolume: 125000000, // $1,250,000
      totalFees: 89200, // $892.00
      averageDeposit: 140134, // $1,401.34
      averageFee: 100, // $1.00
      successRate: 99.2,
      processingTime: 2.3, // 2.3 days average
      feeByType: {
        payoutFees: 53400, // $534.00
        bankFees: 22300, // $223.00
        verificationFees: 8900, // $89.00
        complianceFees: 4600 // $46.00
      },
      purposeBreakdown: {
        salary: { count: 756, volume: 118000000, fees: 75600 },
        bonus: { count: 89, volume: 4450000, fees: 8900 },
        reimbursement: { count: 34, volume: 1850000, fees: 3400 },
        contractor_payment: { count: 13, volume: 650000, fees: 1300 }
      }
    };
  }

  // ==============================
  // PRIVATE HELPER METHODS
  // ==============================

  private async verifyRecipientAccount(recipientId: string): Promise<any> {
    try {
      const account = await this.stripe.accounts.retrieve(recipientId);
      return account.payouts_enabled ? account : null;
    } catch (error) {
      console.error('Recipient account verification failed:', error);
      return null;
    }
  }

  private async saveDirectDepositRecord(data: any): Promise<any> {
    return {
      id: `dd_${Date.now()}`,
      ...data,
      created_at: new Date(),
      updated_at: new Date()
    };
  }

  private async saveBatchRecord(data: any): Promise<string> {
    console.log('Saving batch record:', data);
    return `batch_${Date.now()}`;
  }

  private async getDirectDepositById(id: string): Promise<any> {
    // Database lookup
    return null;
  }

  private determineVolumeTier(totalAmount: number): 'low' | 'medium' | 'high' | 'enterprise' {
    if (totalAmount >= 1000000) return 'enterprise'; // >= $10,000
    if (totalAmount >= 500000) return 'high'; // >= $5,000
    if (totalAmount >= 100000) return 'medium'; // >= $1,000
    return 'low';
  }

  private calculateAdjustmentFee(adjustmentType: string, amount: number): number {
    const baseFee = 100; // $1.00 base fee
    
    switch (adjustmentType) {
      case 'correction':
        return baseFee;
      case 'supplement':
        return Math.round(baseFee * 1.2); // 20% surcharge for supplements
      case 'reversal':
        return Math.round(baseFee * 1.5); // 50% surcharge for reversals
      default:
        return baseFee;
    }
  }

  private async createDirectDepositFeeJournalEntries(directDepositId: string, feeAllocation: any): Promise<string> {
    // Create journal entries for direct deposit fee allocation
    return `journal_${Date.now()}`;
  }

  private async processDirectDepositReconciliation(payout: Stripe.Payout): Promise<DirectDepositReconciliationData | null> {
    try {
      const directDepositId = payout.metadata?.direct_deposit_id;
      if (!directDepositId) return null;

      const reconciliation: DirectDepositReconciliationData = {
        stripePayoutId: payout.id,
        directDepositId,
        amount: payout.amount,
        fee: payout.fee || 0,
        netAmount: payout.amount - (payout.fee || 0),
        status: payout.status as any,
        arrivalDate: new Date(payout.arrival_date * 1000),
        bankAccount: payout.destination || 'unknown'
      };

      await this.saveDirectDepositReconciliationRecord(reconciliation);
      return reconciliation;

    } catch (error) {
      console.error('Direct deposit reconciliation processing failed:', error);
      return null;
    }
  }

  private async saveDirectDepositReconciliationRecord(reconciliation: DirectDepositReconciliationData): Promise<void> {
    console.log('Saving direct deposit reconciliation:', reconciliation);
  }

  private async getHistoricalFeeAverages(paymentType: string): Promise<{ [key: string]: number }> {
    return {
      totalFee: 100, // $1.00
      effectiveRate: 0.007 // 0.7%
    };
  }

  private async saveVarianceAlerts(alerts: any[]): Promise<void> {
    for (const alert of alerts) {
      console.log('Direct deposit fee variance alert:', alert.message);
    }
  }

  private async logProcessingError(errorType: string, data: any): Promise<void> {
    console.error(`${errorType}:`, data);
  }
}

// Export singleton instance
export const directDepositService = new DirectDepositService();