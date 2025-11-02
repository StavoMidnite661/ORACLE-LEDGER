/**
 * Reconciliation Service - Banking reconciliation and exception handling for Stripe transactions
 * 
 * This service provides:
 * - Stripe balance transaction matching
 * - ACH return processing and adjustments
 * - Direct deposit reconciliation
 * - Manual reconciliation tools
 * - Automated matching algorithms
 * - Exception handling and reporting
 */

import { databaseService } from './databaseService';
import type { JournalEntry } from '../types';

export interface StripeBalanceTransaction {
  id: string;
  amount: number;
  currency: string;
  description?: string;
  fee: number;
  net: number;
  status: 'pending' | 'available' | 'failed';
  type: 'charge' | 'refund' | 'adjustment' | 'transfer' | 'payment' | 'payout' | 'refund';
  created: number;
  available_on: number;
  source: string;
}

export interface ACHTransaction {
  id: string;
  amount: number;
  currency: string;
  created: number;
  status: 'pending' | 'succeeded' | 'failed';
  failure_code?: string;
  failure_message?: string;
  description?: string;
  customer?: string;
  source: string;
}

export interface DirectDepositTransaction {
  id: string;
  amount: number;
  currency: string;
  created: number;
  status: 'pending' | 'succeeded' | 'failed';
  description: string;
  employee: {
    id: string;
    name: string;
  };
}

export interface ReconciliationMatch {
  stripeTransactionId: string;
  journalEntryId?: string;
  amount: number;
  date: string;
  confidence: number; // 0-100, confidence in the match
  matchType: 'exact' | 'fuzzy' | 'manual';
  differences: {
    amount?: number;
    date?: number; // days difference
    description?: number; // similarity score
  };
}

export interface ReconciliationException {
  id: string;
  type: 'unmatched_transaction' | 'amount_mismatch' | 'date_mismatch' | 'duplicate' | 'missing_entry';
  severity: 'low' | 'medium' | 'high' | 'critical';
  stripeTransactionId: string;
  journalEntryId?: string;
  amount: number;
  date: string;
  description: string;
  suggestedAction?: 'create_entry' | 'adjust_entry' | 'ignore' | 'manual_review';
  resolutionNotes?: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface ReconciliationReport {
  period: string;
  totalTransactions: number;
  matchedTransactions: number;
  unmatchedTransactions: number;
  totalAmount: number;
  matchedAmount: number;
  unmatchedAmount: number;
  exceptions: ReconciliationException[];
  reconciliationRate: number; // percentage
  generatedAt: string;
}

export class ReconciliationService {
  private readonly MATCH_THRESHOLDS = {
    EXACT_AMOUNT: 0.01, // $0.01 tolerance for exact matches
    DATE_TOLERANCE: 3, // 3 days tolerance
    FUZZY_DESCRIPTION_THRESHOLD: 0.8, // 80% similarity for description
  };

  /**
   * Perform automated reconciliation for Stripe transactions
   */
  async performAutomatedReconciliation(startDate: string, endDate: string): Promise<{
    matches: ReconciliationMatch[];
    exceptions: ReconciliationException[];
    report: ReconciliationReport;
  }> {
    try {
      console.log(`Starting automated reconciliation for period: ${startDate} to ${endDate}`);

      // Get Stripe transactions for the period
      const stripeTransactions = await this.getStripeTransactions(startDate, endDate);
      
      // Get existing journal entries for the period
      const journalEntries = await this.getJournalEntriesForPeriod(startDate, endDate);
      
      // Perform matching
      const matches = await this.performMatching(stripeTransactions, journalEntries);
      
      // Identify exceptions
      const exceptions = this.identifyExceptions(stripeTransactions, journalEntries, matches);
      
      // Generate report
      const report = this.generateReport(startDate, endDate, stripeTransactions, matches, exceptions);

      // Log reconciliation results
      await this.logReconciliationResults(report);

      return {
        matches,
        exceptions,
        report,
      };
    } catch (error) {
      console.error('Error during automated reconciliation:', error);
      throw new Error(`Automated reconciliation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Match Stripe balance transactions with journal entries
   */
  async matchStripeBalanceTransactions(stripeTransactions: StripeBalanceTransaction[], journalEntries: JournalEntry[]): Promise<ReconciliationMatch[]> {
    const matches: ReconciliationMatch[] = [];

    for (const stripeTx of stripeTransactions) {
      const potentialMatches = journalEntries.filter(entry => {
        const stripeAmount = Math.abs(stripeTx.amount) / 100; // Convert cents to dollars
        const entryAmount = Math.abs(this.getEntryAmount(entry));
        
        // Check if amounts match within tolerance
        const amountMatch = Math.abs(stripeAmount - entryAmount) <= this.MATCH_THRESHOLDS.EXACT_AMOUNT;
        
        // Check if dates are within tolerance
        const stripeDate = new Date(stripeTx.created * 1000).toISOString().split('T')[0];
        const dateMatch = Math.abs(new Date(stripeDate).getTime() - new Date(entry.date).getTime()) <= 
                         this.MATCH_THRESHOLDS.DATE_TOLERANCE * 24 * 60 * 60 * 1000;
        
        // Check if descriptions are similar
        const descriptionMatch = this.calculateDescriptionSimilarity(
          stripeTx.description || '',
          entry.description
        ) >= this.MATCH_THRESHOLDS.FUZZY_DESCRIPTION_THRESHOLD;

        return amountMatch && (dateMatch || descriptionMatch);
      });

      if (potentialMatches.length === 1) {
        // Exact match found
        matches.push({
          stripeTransactionId: stripeTx.id,
          journalEntryId: potentialMatches[0].id,
          amount: stripeTx.amount / 100,
          date: new Date(stripeTx.created * 1000).toISOString().split('T')[0],
          confidence: this.calculateMatchConfidence(stripeTx, potentialMatches[0]),
          matchType: 'exact',
          differences: {
            amount: Math.abs(stripeTx.amount / 100 - this.getEntryAmount(potentialMatches[0])),
          },
        });
      } else if (potentialMatches.length > 1) {
        // Multiple potential matches - mark for manual review
        matches.push({
          stripeTransactionId: stripeTx.id,
          amount: stripeTx.amount / 100,
          date: new Date(stripeTx.created * 1000).toISOString().split('T')[0],
          confidence: 50, // Lower confidence due to ambiguity
          matchType: 'manual',
          differences: {
            description: 0.5,
          },
        });
      }
    }

    return matches;
  }

  /**
   * Process ACH returns and create adjustment entries
   */
  async processACHRturns(returns: ACHTransaction[]): Promise<{
    createdEntries: JournalEntry[];
    exceptions: ReconciliationException[];
  }> {
    const createdEntries: JournalEntry[] = [];
    const exceptions: ReconciliationException[] = [];

    for (const achReturn of returns) {
      try {
        if (achReturn.status === 'failed' && achReturn.failure_code) {
          // Import stripeJournalService dynamically to avoid circular dependency
          const { stripeJournalService } = await import('./stripeJournalService');
          
          const returnData = {
            achTransactionId: achReturn.id,
            amount: Math.abs(achReturn.amount) / 100,
            currency: achReturn.currency,
            customerId: achReturn.customer,
            description: achReturn.description,
            created: achReturn.created,
            status: achReturn.status as 'pending' | 'succeeded' | 'failed',
            returnCode: achReturn.failure_code,
            returnDescription: achReturn.failure_message,
            bankAccountLast4: achReturn.source.split('_').pop()?.slice(-4) || 'N/A',
          };

          const journalEntry = await stripeJournalService.createACHReturnEntry(returnData);
          createdEntries.push(journalEntry);
        }
      } catch (error) {
        console.error(`Error processing ACH return ${achReturn.id}:`, error);
        
        exceptions.push({
          id: `EXC-${Date.now()}-${achReturn.id}`,
          type: 'missing_entry',
          severity: 'high',
          stripeTransactionId: achReturn.id,
          amount: Math.abs(achReturn.amount) / 100,
          date: new Date(achReturn.created * 1000).toISOString().split('T')[0],
          description: `Failed to process ACH return: ${achReturn.failure_message || 'Unknown error'}`,
          suggestedAction: 'manual_review',
          resolved: false,
        });
      }
    }

    return { createdEntries, exceptions };
  }

  /**
   * Reconcile direct deposit transactions
   */
  async reconcileDirectDeposits(deposits: DirectDepositTransaction[]): Promise<{
    matches: ReconciliationMatch[];
    exceptions: ReconciliationException[];
  }> {
    const matches: ReconciliationMatch[] = [];
    const exceptions: ReconciliationException[] = [];

    for (const deposit of deposits) {
      try {
        // Get payroll journal entries for this employee and period
        const payrollEntries = await this.getPayrollEntriesForEmployee(deposit.employee.id);
        
        // Find matching payroll entry
        const matchingEntry = payrollEntries.find(entry => {
          const entryAmount = Math.abs(this.getEntryAmount(entry));
          const depositAmount = Math.abs(deposit.amount) / 100;
          
          return Math.abs(entryAmount - depositAmount) <= this.MATCH_THRESHOLDS.EXACT_AMOUNT;
        });

        if (matchingEntry) {
          matches.push({
            stripeTransactionId: deposit.id,
            journalEntryId: matchingEntry.id,
            amount: deposit.amount / 100,
            date: new Date(deposit.created * 1000).toISOString().split('T')[0],
            confidence: 95,
            matchType: 'exact',
            differences: {
              amount: Math.abs(deposit.amount / 100 - this.getEntryAmount(matchingEntry)),
            },
          });
        } else {
          // Create exception for unmatched direct deposit
          exceptions.push({
            id: `EXC-DD-${Date.now()}-${deposit.id}`,
            type: 'unmatched_transaction',
            severity: 'medium',
            stripeTransactionId: deposit.id,
            amount: deposit.amount / 100,
            date: new Date(deposit.created * 1000).toISOString().split('T')[0],
            description: `Unmatched direct deposit for ${deposit.employee.name}`,
            suggestedAction: 'create_entry',
            resolved: false,
          });
        }
      } catch (error) {
        console.error(`Error reconciling direct deposit ${deposit.id}:`, error);
        
        exceptions.push({
          id: `EXC-DD-ERR-${Date.now()}-${deposit.id}`,
          type: 'missing_entry',
          severity: 'high',
          stripeTransactionId: deposit.id,
          amount: deposit.amount / 100,
          date: new Date(deposit.created * 1000).toISOString().split('T')[0],
          description: `Error processing direct deposit: ${error instanceof Error ? error.message : 'Unknown error'}`,
          suggestedAction: 'manual_review',
          resolved: false,
        });
      }
    }

    return { matches, exceptions };
  }

  /**
   * Perform manual reconciliation
   */
  async performManualReconciliation(stripeTransactionId: string, journalEntryId: string, notes?: string): Promise<void> {
    try {
      // Update reconciliation tracking (this would typically be stored in a reconciliation table)
      console.log(`Manual reconciliation: ${stripeTransactionId} matched with ${journalEntryId}`);
      
      if (notes) {
        console.log(`Reconciliation notes: ${notes}`);
      }

      // Log the manual reconciliation
      await this.logManualReconciliation(stripeTransactionId, journalEntryId, notes);
    } catch (error) {
      console.error('Error performing manual reconciliation:', error);
      throw new Error(`Manual reconciliation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get reconciliation exceptions for manual review
   */
  async getReconciliationExceptions(severity?: 'low' | 'medium' | 'high' | 'critical'): Promise<ReconciliationException[]> {
    // This would typically query a reconciliation_exceptions table
    // For now, returning mock data structure
    const exceptions: ReconciliationException[] = [];
    
    // TODO: Implement actual database query
    return exceptions;
  }

  /**
   * Resolve reconciliation exception
   */
  async resolveException(exceptionId: string, resolution: 'create_entry' | 'adjust_entry' | 'ignore' | 'manual_review', notes: string, resolvedBy: string): Promise<void> {
    try {
      // Update exception status in database
      const resolvedAt = new Date().toISOString();
      
      console.log(`Resolving exception ${exceptionId} with resolution: ${resolution}`);
      console.log(`Resolution notes: ${notes}`);
      console.log(`Resolved by: ${resolvedBy} at ${resolvedAt}`);

      // In production, this would update the reconciliation_exceptions table
      // await this.updateExceptionStatus(exceptionId, resolution, notes, resolvedBy, resolvedAt);
    } catch (error) {
      console.error('Error resolving exception:', error);
      throw new Error(`Failed to resolve exception: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate comprehensive reconciliation report
   */
  async generateReconciliationReport(startDate: string, endDate: string): Promise<ReconciliationReport> {
    try {
      const stripeTransactions = await this.getStripeTransactions(startDate, endDate);
      const journalEntries = await this.getJournalEntriesForPeriod(startDate, endDate);
      const matches = await this.performMatching(stripeTransactions, journalEntries);
      const exceptions = this.identifyExceptions(stripeTransactions, journalEntries, matches);

      return this.generateReport(startDate, endDate, stripeTransactions, matches, exceptions);
    } catch (error) {
      console.error('Error generating reconciliation report:', error);
      throw new Error(`Failed to generate reconciliation report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get Stripe transactions for reconciliation
   */
  private async getStripeTransactions(startDate: string, endDate: string): Promise<StripeBalanceTransaction[]> {
    // This would typically query the Stripe API or database
    // For now, returning empty array as this is a mock implementation
    return [];
  }

  /**
   * Get journal entries for a specific period
   */
  private async getJournalEntriesForPeriod(startDate: string, endDate: string): Promise<JournalEntry[]> {
    const allEntries = await databaseService.getJournalEntries();
    return allEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return entryDate >= start && entryDate <= end;
    });
  }

  /**
   * Get payroll entries for a specific employee
   */
  private async getPayrollEntriesForEmployee(employeeId: string): Promise<JournalEntry[]> {
    const allEntries = await databaseService.getJournalEntries();
    return allEntries.filter(entry => 
      entry.source === 'PAYROLL' && 
      entry.description.toLowerCase().includes(employeeId.toLowerCase())
    );
  }

  /**
   * Perform automated matching between Stripe transactions and journal entries
   */
  private async performMatching(stripeTransactions: StripeBalanceTransaction[], journalEntries: JournalEntry[]): Promise<ReconciliationMatch[]> {
    const allMatches: ReconciliationMatch[] = [];

    // Match Stripe balance transactions
    const balanceMatches = await this.matchStripeBalanceTransactions(
      stripeTransactions.filter(tx => tx.type === 'charge' || tx.type === 'refund'),
      journalEntries
    );
    allMatches.push(...balanceMatches);

    // TODO: Add matching for other transaction types (ACH, direct deposits, etc.)

    return allMatches;
  }

  /**
   * Identify reconciliation exceptions
   */
  private identifyExceptions(stripeTransactions: StripeBalanceTransaction[], journalEntries: JournalEntry[], matches: ReconciliationMatch[]): ReconciliationException[] {
    const exceptions: ReconciliationException[] = [];

    // Find unmatched Stripe transactions
    const matchedStripeIds = new Set(matches.map(match => match.stripeTransactionId));
    for (const stripeTx of stripeTransactions) {
      if (!matchedStripeIds.has(stripeTx.id)) {
        exceptions.push({
          id: `EXC-STRIPE-${stripeTx.id}`,
          type: 'unmatched_transaction',
          severity: this.calculateSeverity(stripeTx),
          stripeTransactionId: stripeTx.id,
          amount: Math.abs(stripeTx.amount) / 100,
          date: new Date(stripeTx.created * 1000).toISOString().split('T')[0],
          description: stripeTx.description || `Unmatched Stripe transaction: ${stripeTx.type}`,
          suggestedAction: 'create_entry',
          resolved: false,
        });
      }
    }

    // Find unmatched journal entries
    const matchedEntryIds = new Set(matches.map(match => match.journalEntryId).filter(id => id));
    for (const entry of journalEntries) {
      if (!matchedEntryIds.has(entry.id)) {
        exceptions.push({
          id: `EXC-JOURNAL-${entry.id}`,
          type: 'missing_entry',
          severity: 'medium',
          journalEntryId: entry.id,
          amount: Math.abs(this.getEntryAmount(entry)),
          date: entry.date,
          description: `Unmatched journal entry: ${entry.description}`,
          suggestedAction: 'manual_review',
          resolved: false,
        });
      }
    }

    return exceptions;
  }

  /**
   * Calculate match confidence score
   */
  private calculateMatchConfidence(stripeTx: StripeBalanceTransaction, journalEntry: JournalEntry): number {
    let confidence = 0;
    let factors = 0;

    // Amount match
    const stripeAmount = Math.abs(stripeTx.amount) / 100;
    const entryAmount = Math.abs(this.getEntryAmount(journalEntry));
    const amountDiff = Math.abs(stripeAmount - entryAmount);
    if (amountDiff <= this.MATCH_THRESHOLDS.EXACT_AMOUNT) {
      confidence += 40;
    }
    factors++;

    // Date match
    const stripeDate = new Date(stripeTx.created * 1000).toISOString().split('T')[0];
    const dateDiff = Math.abs(new Date(stripeDate).getTime() - new Date(journalEntry.date).getTime()) / (24 * 60 * 60 * 1000);
    if (dateDiff <= this.MATCH_THRESHOLDS.DATE_TOLERANCE) {
      confidence += 30;
    }
    factors++;

    // Description similarity
    const descriptionSimilarity = this.calculateDescriptionSimilarity(
      stripeTx.description || '',
      journalEntry.description
    );
    confidence += descriptionSimilarity * 30;
    factors++;

    return Math.round(confidence);
  }

  /**
   * Calculate description similarity using simple string matching
   */
  private calculateDescriptionSimilarity(desc1: string, desc2: string): number {
    if (!desc1 || !desc2) return 0;
    
    const words1 = desc1.toLowerCase().split(/\s+/);
    const words2 = desc2.toLowerCase().split(/\s+/);
    
    const commonWords = words1.filter(word => words2.includes(word));
    const totalWords = Math.max(words1.length, words2.length);
    
    return totalWords > 0 ? commonWords.length / totalWords : 0;
  }

  /**
   * Get the total amount from a journal entry
   */
  private getEntryAmount(entry: JournalEntry): number {
    return Math.abs(entry.lines.reduce((sum, line) => sum + line.amount, 0));
  }

  /**
   * Calculate severity based on transaction characteristics
   */
  private calculateSeverity(stripeTx: StripeBalanceTransaction): 'low' | 'medium' | 'high' | 'critical' {
    const amount = Math.abs(stripeTx.amount) / 100;
    
    if (amount > 10000) return 'critical';
    if (amount > 1000) return 'high';
    if (amount > 100) return 'medium';
    return 'low';
  }

  /**
   * Generate reconciliation report
   */
  private generateReport(startDate: string, endDate: string, stripeTransactions: StripeBalanceTransaction[], matches: ReconciliationMatch[], exceptions: ReconciliationException[]): ReconciliationReport {
    const totalTransactions = stripeTransactions.length;
    const matchedTransactions = matches.length;
    const unmatchedTransactions = totalTransactions - matchedTransactions;
    
    const totalAmount = stripeTransactions.reduce((sum, tx) => sum + Math.abs(tx.amount) / 100, 0);
    const matchedAmount = matches.reduce((sum, match) => sum + Math.abs(match.amount), 0);
    const unmatchedAmount = totalAmount - matchedAmount;
    
    const reconciliationRate = totalTransactions > 0 ? (matchedTransactions / totalTransactions) * 100 : 0;

    return {
      period: `${startDate} to ${endDate}`,
      totalTransactions,
      matchedTransactions,
      unmatchedTransactions,
      totalAmount,
      matchedAmount,
      unmatchedAmount,
      exceptions,
      reconciliationRate: Math.round(reconciliationRate * 100) / 100,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Log reconciliation results
   */
  private async logReconciliationResults(report: ReconciliationReport): Promise<void> {
    const logData = {
      timestamp: new Date().toISOString(),
      reconciliationReport: report,
      service: 'reconciliationService',
    };

    console.log('Reconciliation Results:', JSON.stringify(logData, null, 2));
  }

  /**
   * Log manual reconciliation
   */
  private async logManualReconciliation(stripeTransactionId: string, journalEntryId: string, notes?: string): Promise<void> {
    const logData = {
      timestamp: new Date().toISOString(),
      type: 'manual_reconciliation',
      stripeTransactionId,
      journalEntryId,
      notes,
      service: 'reconciliationService',
    };

    console.log('Manual Reconciliation Log:', JSON.stringify(logData, null, 2));
  }

  /**
   * Get reconciliation statistics
   */
  async getReconciliationStatistics(days: number = 30): Promise<{
    totalMatches: number;
    averageConfidence: number;
    exceptionRate: number;
    manualReconciliationRate: number;
  }> {
    // This would typically query historical reconciliation data
    // For now, returning mock data
    return {
      totalMatches: 0,
      averageConfidence: 0,
      exceptionRate: 0,
      manualReconciliationRate: 0,
    };
  }
}

export const reconciliationService = new ReconciliationService();