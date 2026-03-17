/**
 * ORACLE-LEDGER Card Payment Processing with Fee Tracking Integration
 * Updated: 2025-11-02
 * Includes comprehensive fee calculation and tracking for credit/debit cards
 */

import Stripe from 'stripe';
import { feeTrackingService, FeeCalculationRequest, FeeBreakdown } from './feeTrackingService.js';

export interface CardPaymentRequest {
  amount: number; // in dollars
  currency?: string;
  description: string;
  customerId?: string;
  paymentMethodId: string;
  cardType?: 'debit' | 'credit' | 'prepaid';
  customerType?: 'business' | 'consumer';
  riskLevel?: 'low' | 'medium' | 'high';
  processingLocation?: 'domestic' | 'international';
  captureMethod?: 'automatic' | 'manual';
  receiptEmail?: string;
  metadata?: { [key: string]: string };
}

export interface CardPaymentResult {
  success: boolean;
  stripeChargeId?: string;
  stripePaymentIntentId?: string;
  feeBreakdown: FeeBreakdown;
  feeAllocation: any;
  journalEntryId?: string;
  error?: string;
  receiptUrl?: string;
  disputeId?: string;
}

export interface CardRefundRequest {
  paymentIntentId: string;
  amount?: number; // Partial refund amount in dollars
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
  reverseTransfer?: boolean;
  refundApplicationFee?: boolean;
}

export interface CardDisputeResult {
  success: boolean;
  disputeId?: string;
  feeAdjustment?: number;
  error?: string;
}

export interface CardReconciliationData {
  stripeBalanceTransactionId: string;
  paymentIntentId: string;
  amount: number;
  fee: number;
  netAmount: number;
  applicationFee?: number;
  status: 'succeeded' | 'failed' | 'pending';
  processedDate: Date;
}

export class CardPaymentService {
  private stripe: Stripe;
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly DISPUTE_THRESHOLD_DAYS = 7;

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
   * Process card payment with comprehensive fee tracking
   */
  async processCardPayment(request: CardPaymentRequest): Promise<CardPaymentResult> {
    try {
      // Step 1: Calculate fees before processing
      const feeCalculationRequest: FeeCalculationRequest = {
        paymentType: 'CARD',
        amountCents: Math.round(request.amount * 100),
        customerType: request.customerType || 'consumer',
        volumeTier: 'medium', // Would be determined by customer history/volume
        riskLevel: request.riskLevel || 'low',
        processingLocation: request.processingLocation || 'domestic',
        cardType: request.cardType || 'credit'
      };

      const feeBreakdown = feeTrackingService.calculateFees(feeCalculationRequest);

      // Step 2: Create payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(request.amount * 100),
        currency: request.currency || 'usd',
        payment_method_types: ['card'],
        payment_method: request.paymentMethodId,
        customer: request.customerId,
        description: request.description,
        confirmation_method: 'manual',
        confirm: request.captureMethod === 'automatic',
        capture_method: request.captureMethod === 'manual' ? 'manual' : 'automatic',
        receipt_email: request.receiptEmail,
        metadata: {
          type: 'card_payment',
          card_type: request.cardType || 'credit',
          customer_type: request.customerType || 'consumer',
          risk_level: request.riskLevel || 'low',
          processing_location: request.processingLocation || 'domestic',
          // Fee tracking metadata
          processing_fee_cents: feeBreakdown.processingFee.toString(),
          stripe_fee_cents: feeBreakdown.stripeFee.toString(),
          bank_fee_cents: feeBreakdown.bankFee.toString(),
          total_fee_cents: feeBreakdown.totalFee.toString(),
          effective_rate: feeBreakdown.effectiveRate.toString(),
          ...request.metadata
        }
      });

      // Step 3: Save payment record with fee tracking
      const paymentRecord = await this.saveCardPaymentRecord({
        stripeChargeId: typeof paymentIntent.latest_charge === 'string' ? paymentIntent.latest_charge : paymentIntent.latest_charge?.id,
        stripePaymentIntentId: paymentIntent.id,
        amountCents: Math.round(request.amount * 100),
        description: request.description,
        customerId: request.customerId,
        paymentMethodId: request.paymentMethodId,
        cardType: request.cardType || 'credit',
        status: paymentIntent.status,
        feeBreakdown,
        captureMethod: request.captureMethod || 'automatic'
      });

      // Step 4: Create fee allocation
      const feeAllocation = feeTrackingService.createFeeAllocation(
        paymentRecord.id,
        feeBreakdown,
        feeCalculationRequest
      );

      // Step 5: Create compliance records
      const complianceRecord = feeTrackingService.createComplianceRecord(
        paymentRecord.id,
        'Card Processing Fee',
        feeBreakdown.stripeFee,
        `Card processing with ${(feeBreakdown.breakdown.percentageRate * 100).toFixed(1)}% rate + $${(feeBreakdown.breakdown.baseRate / 100).toFixed(2)} fixed`,
        'PCI DSS Compliance Requirements'
      );

      // Step 6: Create journal entries for fee allocation
      const journalEntryId = await this.createCardFeeJournalEntries(paymentRecord.id, feeAllocation);

      // Step 7: Check for fee variance alerts
      const historicalAverages = await this.getHistoricalFeeAverages('CARD');
      const varianceAlerts = feeTrackingService.checkFeeVariance(
        feeBreakdown,
        historicalAverages,
        { 
          totalFee: Math.round(request.amount * 100 * 0.05), // 5% of amount
          effectiveRate: 0.05 // 5% threshold
        }
      );

      if (varianceAlerts.length > 0) {
        await this.saveVarianceAlerts(varianceAlerts);
      }

      // Step 8: Send receipt if email provided
      let receiptUrl: string | undefined;
      // In newer Stripe versions, we would need to retrieve the charge to get the receipt_url
      // or expand 'latest_charge' during creation. For now, we'll gracefully handle it.
      if (request.receiptEmail && paymentIntent.latest_charge) {
        try {
          const chargeId = typeof paymentIntent.latest_charge === 'string' ? paymentIntent.latest_charge : paymentIntent.latest_charge.id;
          const charge = await this.stripe.charges.retrieve(chargeId);
          receiptUrl = charge.receipt_url || undefined;
        } catch (e) {
          console.warn('Failed to retrieve receipt URL:', e);
        }
      }

      return {
        success: true,
        stripeChargeId: typeof paymentIntent.latest_charge === 'string' ? paymentIntent.latest_charge : paymentIntent.latest_charge?.id,
        stripePaymentIntentId: paymentIntent.id,
        feeBreakdown,
        feeAllocation,
        journalEntryId,
        receiptUrl
      };

    } catch (error) {
      console.error('Card payment processing failed:', error);
      
      // Log error for monitoring
      await this.logProcessingError('CARD_PAYMENT_FAILED', {
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
        error: error instanceof Error ? error.message : 'Payment processing failed'
      };
    }
  }

  /**
   * Process card refund with fee adjustments
   */
  async processCardRefund(request: CardRefundRequest): Promise<{ success: boolean; refundId?: string; error?: string }> {
    try {
      // Step 1: Get the original payment and fee information
      const paymentIntent = await this.stripe.paymentIntents.retrieve(request.paymentIntentId);
      if (!paymentIntent) {
        throw new Error('Payment intent not found');
      }

      // Step 2: Calculate refund fees (Stripe charges refund fees in some cases)
      const refundAmount = request.amount ? Math.round(request.amount * 100) : paymentIntent.amount;
      const refundFee = this.calculateRefundFee(refundAmount, paymentIntent.amount);

      // Step 3: Process refund with Stripe
      const refund = await this.stripe.refunds.create({
        payment_intent: request.paymentIntentId,
        amount: refundAmount,
        reason: request.reason,
        reverse_transfer: request.reverseTransfer,
        refund_application_fee: request.refundApplicationFee,
        metadata: {
          refund_reason: request.reason || 'requested_by_customer',
          refund_fee_cents: refundFee.toString(),
          original_payment_id: paymentIntent.id
        }
      });

      // Step 4: Save refund record
      const refundRecord = await this.saveCardRefundRecord({
        stripeRefundId: refund.id,
        paymentIntentId: request.paymentIntentId,
        amountCents: refundAmount,
        feeAmountCents: refundFee,
        reason: request.reason || 'requested_by_customer',
        status: refund.status
      });

      // Step 5: Create fee reversal entries
      await this.createCardFeeReversalEntries(refundRecord.id, refundFee, paymentIntent.id);

      // Step 6: Update fee tracking records
      await this.updateFeeTrackingForRefund(paymentIntent.id, refundFee);

      return {
        success: true,
        refundId: refund.id
      };

    } catch (error) {
      console.error('Card refund processing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Refund processing failed'
      };
    }
  }

  /**
   * Handle card disputes with fee tracking
   */
  async handleCardDispute(paymentIntentId: string, disputeData: {
    reason: string;
    amount: number;
    evidence: string[];
  }): Promise<CardDisputeResult> {
    try {
      // Step 1: Get payment information
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      if (!paymentIntent) {
        throw new Error('Payment intent not found');
      }

      // Step 2: Calculate dispute fees and adjustments
      const disputeFee = this.calculateDisputeFee(paymentIntent.amount);
      const feeAdjustment = -disputeFee; // Negative for expense reversal

      // Step 3: Create dispute record
      const disputeRecord = await this.saveDisputeRecord({
        paymentIntentId,
        reason: disputeData.reason,
        amountCents: Math.round(disputeData.amount * 100),
        disputeFeeCents: disputeFee,
        evidenceFiles: disputeData.evidence,
        status: 'open'
      });

      // Step 4: Create fee dispute record in fee tracking
      const feeDispute = feeTrackingService.createFeeDispute(
        paymentIntentId,
        'processing_error',
        disputeFee,
        `Dispute fee for payment ${paymentIntentId}: ${disputeData.reason}`,
        disputeData.evidence
      );

      // Step 5: Create journal entries for dispute fee adjustment
      await this.createDisputeFeeAdjustmentEntries(
        paymentIntentId, 
        feeAdjustment, 
        disputeRecord.id,
        disputeData.reason
      );

      return {
        success: true,
        disputeId: disputeRecord.id,
        feeAdjustment
      };

    } catch (error) {
      console.error('Card dispute handling failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Dispute handling failed'
      };
    }
  }

  /**
   * Reconcile card payments with Stripe balance transactions
   */
  async reconcileCardPayments(): Promise<CardReconciliationData[]> {
    try {
      const balanceTransactions = await this.stripe.balanceTransactions.list({
        limit: 100,
        created: {
          gte: Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000)
        }
      });

      const reconciliations: CardReconciliationData[] = [];

      for (const transaction of balanceTransactions.data) {
        if (transaction.type === 'charge' && transaction.source) {
          const reconciliation = await this.processCardReconciliation(transaction);
          if (reconciliation) {
            reconciliations.push(reconciliation);
          }
        }
      }

      return reconciliations;

    } catch (error) {
      console.error('Card reconciliation failed:', error);
      throw error;
    }
  }

  /**
   * Get card payment statistics for reporting
   */
  async getCardPaymentStats(startDate: Date, endDate: Date): Promise<{
    totalPayments: number;
    totalVolume: number;
    totalFees: number;
    averageFee: number;
    successRate: number;
    disputeRate: number;
    refundRate: number;
    feeByType: { [key: string]: number };
    cardTypeBreakdown: { [key: string]: { count: number; volume: number; fees: number } };
  }> {
    // Mock data - would query database
    return {
      totalPayments: 5234,
      totalVolume: 412300000, // $4,123,000
      totalFees: 11956670, // $119,566.70 (2.9% + $0.30)
      averageFee: 2284, // $22.84
      successRate: 98.9,
      disputeRate: 0.3,
      refundRate: 1.2,
      feeByType: {
        stripeProcessing: 8379460, // $83,794.60
        bankFees: 418973, // $4,189.73
        compliance: 209486, // $2,094.86
        verification: 104743 // $1,047.43
      },
      cardTypeBreakdown: {
        credit: { count: 4187, volume: 329840000, fees: 9565360 },
        debit: { count: 1047, volume: 82460000, fees: 2391310 }
      }
    };
  }

  // ==============================
  // PRIVATE HELPER METHODS
  // ==============================

  private async saveCardPaymentRecord(data: any): Promise<any> {
    // Save to database with fee tracking integration
    return {
      id: `card_${Date.now()}`,
      ...data,
      created_at: new Date(),
      updated_at: new Date()
    };
  }

  private async saveCardRefundRecord(data: any): Promise<any> {
    return { id: `refund_${Date.now()}`, ...data };
  }

  private async saveDisputeRecord(data: any): Promise<any> {
    return { id: `dispute_${Date.now()}`, ...data };
  }

  private calculateRefundFee(refundAmount: number, originalAmount: number): number {
    // Stripe doesn't typically charge for refunds, but some cases might
    // Return fee calculation logic
    return 0; // No refund fees for most cases
  }

  private calculateDisputeFee(paymentAmount: number): number {
    // Dispute fee (often charged by card networks)
    const disputeFeePercent = 0.15; // 0.15% of transaction amount
    const disputeFeeFixed = 1500; // $15 fixed fee
    const maxDisputeFee = 2500; // $25 maximum

    const calculatedFee = Math.round((paymentAmount * disputeFeePercent) / 100) + disputeFeeFixed;
    return Math.min(calculatedFee, maxDisputeFee);
  }

  private async createCardFeeJournalEntries(paymentId: string, feeAllocation: any): Promise<string> {
    // Create journal entries for card fee allocation
    // Integrate with existing journal entry system
    return `journal_${Date.now()}`;
  }

  private async createCardFeeReversalEntries(refundId: string, feeAmount: number, originalPaymentId: string): Promise<void> {
    // Create journal entries for fee reversal on refund
    console.log('Creating fee reversal entries:', { refundId, feeAmount, originalPaymentId });
  }

  private async createDisputeFeeAdjustmentEntries(
    paymentId: string, 
    feeAdjustment: number, 
    disputeId: string, 
    reason: string
  ): Promise<void> {
    // Create journal entries for dispute fee adjustment
    console.log('Creating dispute fee adjustment:', { paymentId, feeAdjustment, disputeId, reason });
  }

  private async updateFeeTrackingForRefund(paymentId: string, refundFee: number): Promise<void> {
    // Update fee tracking records for refund
    console.log('Updating fee tracking for refund:', { paymentId, refundFee });
  }

  private async processCardReconciliation(transaction: Stripe.BalanceTransaction): Promise<CardReconciliationData | null> {
    try {
      const paymentIntentId = transaction.source as string;
      if (!paymentIntentId) return null;

      const reconciliation: CardReconciliationData = {
        stripeBalanceTransactionId: transaction.id,
        paymentIntentId,
        amount: transaction.amount,
        fee: transaction.fee,
        netAmount: transaction.net,
        applicationFee: (transaction as any).application_fee || 0,
        status: transaction.status as any,
        processedDate: new Date(transaction.created * 1000)
      };

      await this.saveCardReconciliationRecord(reconciliation);
      return reconciliation;

    } catch (error) {
      console.error('Card reconciliation processing failed:', error);
      return null;
    }
  }

  private async saveCardReconciliationRecord(reconciliation: CardReconciliationData): Promise<void> {
    console.log('Saving card reconciliation:', reconciliation);
  }

  private async getHistoricalFeeAverages(paymentType: string): Promise<{ [key: string]: number }> {
    // Get historical averages from database
    return {
      totalFee: 2284, // $22.84
      effectiveRate: 0.029 // 2.9%
    };
  }

  private async saveVarianceAlerts(alerts: any[]): Promise<void> {
    for (const alert of alerts) {
      console.log('Card fee variance alert:', alert.message);
    }
  }

  private async logProcessingError(errorType: string, data: any): Promise<void> {
    console.error(`${errorType}:`, data);
  }
}

// Export singleton instance
export const cardPaymentService = new CardPaymentService();