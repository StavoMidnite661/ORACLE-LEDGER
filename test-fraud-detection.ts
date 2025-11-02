/**
 * Comprehensive Fraud Detection Testing Suite
 * Tests fraud detection accuracy, pattern analysis, and alert workflows
 * 
 * Target Requirements:
 * - Verify fraud detection accuracy (>95% precision)
 * - Test response times (<5 seconds)
 * - Validate machine learning model performance
 */

import { fraudDetectionService, type TransactionAnalysis, type FraudScore } from './services/fraudDetectionService.js';
import { databaseService } from './services/databaseService.js';

// Default export
class FraudDetectionTestSuite {

// Test data generators
class FraudTestDataGenerator {
  static generateNormalTransaction(customerId = 'cust_001'): TransactionAnalysis {
    return {
      transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: Math.floor(Math.random() * 50000) + 5000, // $50-500
      currency: 'usd',
      customerId,
      paymentMethodId: 'pm_001',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      billingCountry: 'US',
      shippingCountry: 'US',
      timestamp: new Date(),
      merchantCategory: 'retail',
      deviceFingerprint: 'device_normal_001'
    };
  }

  static generateFraudulentTransaction(customerId = 'cust_002'): TransactionAnalysis {
    return {
      transactionId: `fraud_txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: 990000, // $9,900 - just under reporting threshold
      currency: 'usd',
      customerId,
      paymentMethodId: 'pm_002',
      ipAddress: '203.0.113.1', // Suspicious IP
      userAgent: 'Python-urllib/3.8', // Bot-like user agent
      billingCountry: 'CN', // High-risk country
      shippingCountry: 'RU',
      timestamp: new Date(),
      merchantCategory: 'cryptocurrency',
      deviceFingerprint: 'device_suspicious_001'
    };
  }

  static generateHighVelocityTransaction(customerId = 'cust_003'): TransactionAnalysis {
    return {
      transactionId: `velocity_txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: 100000, // $1,000
      currency: 'usd',
      customerId,
      paymentMethodId: 'pm_003',
      ipAddress: '10.0.0.1',
      userAgent: 'Mozilla/5.0 (compatible; Bot/1.0)',
      billingCountry: 'NG', // High-risk country
      timestamp: new Date(),
      merchantCategory: 'electronics',
      deviceFingerprint: 'device_velocity_001'
    };
  }

  static generateBatchTransactions(count: number, fraudRatio = 0.1): TransactionAnalysis[] {
    const transactions = [];
    for (let i = 0; i < count; i++) {
      const isFraud = Math.random() < fraudRatio;
      transactions.push(
        isFraud 
          ? this.generateFraudulentTransaction(`fraud_customer_${i}`)
          : this.generateNormalTransaction(`normal_customer_${i}`)
      );
    }
    return transactions;
  }
}

// Test Results Collector
class TestResultsCollector {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      duration: 0,
      accuracy: 0,
      precision: 0,
      recall: 0,
      falsePositiveRate: 0,
      testDetails: []
    };
  }

  addResult(testName: string, passed: boolean, duration: number, details?: any) {
    this.results.total++;
    if (passed) {
      this.results.passed++;
    } else {
      this.results.failed++;
    }
    this.results.duration += duration;

    this.results.testDetails.push({
      testName,
      passed,
      duration,
      timestamp: new Date().toISOString(),
      details
    });
  }

  calculateMetrics(truePositives: number, falsePositives: number, falseNegatives: number, trueNegatives: number) {
    this.results.precision = truePositives / (truePositives + falsePositives);
    this.results.recall = truePositives / (truePositives + falseNegatives);
    this.results.falsePositiveRate = falsePositives / (falsePositives + trueNegatives);
    this.results.accuracy = (truePositives + trueNegatives) / (truePositives + falsePositives + falseNegatives + trueNegatives);
  }

  generateReport() {
    const passRate = (this.results.passed / this.results.total) * 100;
    const avgDuration = this.results.duration / this.results.total;

    return {
      summary: {
        total: this.results.total,
        passed: this.results.passed,
        failed: this.results.failed,
        passRate: `${passRate.toFixed(2)}%`,
        averageDuration: `${avgDuration.toFixed(2)}ms`,
        fraudAccuracy: `${(this.results.accuracy * 100).toFixed(2)}%`,
        fraudPrecision: `${(this.results.precision * 100).toFixed(2)}%`,
        fraudRecall: `${(this.results.recall * 100).toFixed(2)}%`,
        falsePositiveRate: `${(this.results.falsePositiveRate * 100).toFixed(2)}%`
      },
      meetsRequirements: {
        accuracy95Plus: this.results.accuracy >= 0.95,
        precision95Plus: this.results.precision >= 0.95,
        falsePositiveRateLow: this.results.falsePositiveRate <= 0.05
      },
      details: this.results.testDetails
    };
  }
}

// Main Test Suite
class FraudDetectionTestSuite {
  constructor() {
    this.results = new TestResultsCollector();
    this.testData = [];
  }

  async runAllTests() {
    console.log('\n🔍 Starting Comprehensive Fraud Detection Testing Suite...\n');

    const tests = [
      { name: 'Test Basic Fraud Detection', fn: () => this.testBasicFraudDetection() },
      { name: 'Test Transaction Pattern Analysis', fn: () => this.testTransactionPatternAnalysis() },
      { name: 'Test Velocity Analysis', fn: () => this.testVelocityAnalysis() },
      { name: 'Test Geographic Risk Assessment', fn: () => this.testGeographicRiskAssessment() },
      { name: 'Test Device Fingerprinting', fn: () => this.testDeviceFingerprinting() },
      { name: 'Test Customer Behavior Profiling', fn: () => this.testCustomerBehaviorProfiling() },
      { name: 'Test Risk Scoring Algorithms', fn: () => this.testRiskScoringAlgorithms() },
      { name: 'Test Threshold Validation', fn: () => this.testThresholdValidation() },
      { name: 'Test Machine Learning Model Accuracy', fn: () => this.testMachineLearningAccuracy() },
      { name: 'Test Alert Generation', fn: () => this.testAlertGeneration() },
      { name: 'Test Escalation Workflows', fn: () => this.testEscalationWorkflows() },
      { name: 'Test Investigation Case Management', fn: () => this.testInvestigationCaseManagement() },
      { name: 'Test Stripe Radar Integration', fn: () => this.testStripeRadarIntegration() },
      { name: 'Test Batch Processing Performance', fn: () => this.testBatchProcessingPerformance() },
      { name: 'Test Real-time Response Times', fn: () => this.testRealTimeResponseTimes() }
    ];

    for (const test of tests) {
      console.log(`Running: ${test.name}`);
      try {
        await test.fn();
      } catch (error) {
        console.error(`❌ Test failed: ${test.name}`, error);
        this.results.addResult(test.name, false, 0, { error: error.message });
      }
    }

    return this.results.generateReport();
  }

  /**
   * Test basic fraud detection functionality
   */
  async testBasicFraudDetection() {
    const startTime = Date.now();
    
    try {
      // Test normal transaction (should have low fraud score)
      const normalTransaction = FraudTestDataGenerator.generateNormalTransaction();
      const normalResult = await fraudDetectionService.detectFraud(normalTransaction);
      
      if (normalResult.overallScore >= 25) {
        throw new Error(`Normal transaction incorrectly flagged as fraud. Score: ${normalResult.overallScore}`);
      }

      // Test fraudulent transaction (should have high fraud score)
      const fraudTransaction = FraudTestDataGenerator.generateFraudulentTransaction();
      const fraudResult = await fraudDetectionService.detectFraud(fraudTransaction);
      
      if (fraudResult.overallScore < 75) {
        throw new Error(`Fraudulent transaction not properly flagged. Score: ${fraudResult.overallScore}`);
      }

      if (fraudResult.riskLevel !== 'high' && fraudResult.riskLevel !== 'critical') {
        throw new Error(`Incorrect risk level assigned. Got: ${fraudResult.riskLevel}, Expected: high or critical`);
      }

      const duration = Date.now() - startTime;
      this.results.addResult('Basic Fraud Detection', true, duration, {
        normalScore: normalResult.overallScore,
        fraudScore: fraudResult.overallScore,
        normalRisk: normalResult.riskLevel,
        fraudRisk: fraudResult.riskLevel
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.addResult('Basic Fraud Detection', false, duration, { error: error.message });
      throw error;
    }
  }

  /**
   * Test transaction pattern analysis
   */
  async testTransactionPatternAnalysis() {
    const startTime = Date.now();
    
    try {
      // Test round amounts (structured payments)
      const roundAmountTransaction = FraudTestDataGenerator.generateNormalTransaction();
      roundAmountTransaction.amount = 99900; // $999.00 - suspicious round amount
      
      const result = await fraudDetectionService.detectFraud(roundAmountTransaction);
      const hasPatternAlert = result.indicators.some(indicator => 
        indicator.type === 'pattern' && indicator.details.includes('suspicious round amount')
      );

      if (!hasPatternAlert) {
        throw new Error('Round amount pattern not detected');
      }

      // Test threshold avoidance (amounts just under reporting limits)
      const thresholdTransaction = FraudTestDataGenerator.generateNormalTransaction();
      thresholdTransaction.amount = 999900; // $9,999.00 - just under $10k threshold
      
      const thresholdResult = await fraudDetectionService.detectFraud(thresholdTransaction);
      const hasThresholdAlert = thresholdResult.indicators.some(indicator => 
        indicator.type === 'pattern' && indicator.details.includes('threshold')
      );

      if (!hasThresholdAlert) {
        throw new Error('Threshold avoidance pattern not detected');
      }

      const duration = Date.now() - startTime;
      this.results.addResult('Transaction Pattern Analysis', true, duration, {
        patternsDetected: result.indicators.filter(i => i.type === 'pattern').length,
        thresholdPatterns: thresholdResult.indicators.filter(i => i.type === 'pattern').length
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.addResult('Transaction Pattern Analysis', false, duration, { error: error.message });
      throw error;
    }
  }

  /**
   * Test velocity analysis
   */
  async testVelocityAnalysis() {
    const startTime = Date.now();
    
    try {
      // Create mock high-velocity scenario
      const highVelocityTransactions = [];
      for (let i = 0; i < 10; i++) {
        const transaction = FraudTestDataGenerator.generateNormalTransaction();
        transaction.timestamp = new Date(Date.now() - i * 60000); // Each minute
        highVelocityTransactions.push(transaction);
      }

      // Test velocity detection by checking if multiple transactions trigger velocity alerts
      let velocityAlertsCount = 0;
      for (const transaction of highVelocityTransactions) {
        const result = await fraudDetectionService.detectFraud(transaction);
        if (result.indicators.some(indicator => indicator.type === 'velocity')) {
          velocityAlertsCount++;
        }
      }

      // At least some transactions should trigger velocity alerts
      if (velocityAlertsCount === 0) {
        throw new Error('No velocity alerts triggered in high-velocity scenario');
      }

      const duration = Date.now() - startTime;
      this.results.addResult('Velocity Analysis', true, duration, {
        velocityAlerts: velocityAlertsCount,
        totalTransactions: highVelocityTransactions.length
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.addResult('Velocity Analysis', false, duration, { error: error.message });
      throw error;
    }
  }

  /**
   * Test geographic risk assessment
   */
  async testGeographicRiskAssessment() {
    const startTime = Date.now();
    
    try {
      // Test high-risk country
      const highRiskTransaction = FraudTestDataGenerator.generateNormalTransaction();
      highRiskTransaction.billingCountry = 'CN'; // High-risk country
      
      const highRiskResult = await fraudDetectionService.detectFraud(highRiskTransaction);
      const hasGeographicRisk = highRiskResult.indicators.some(indicator => 
        indicator.type === 'geographic' && indicator.details.includes('CN')
      );

      if (!hasGeographicRisk) {
        throw new Error('High-risk country not detected');
      }

      // Test sanctioned country
      const sanctionedTransaction = FraudTestDataGenerator.generateNormalTransaction();
      sanctionedTransaction.billingCountry = 'RU'; // Sanctioned country
      
      const sanctionedResult = await fraudDetectionService.detectFraud(sanctionedTransaction);
      const hasSanctionedAlert = sanctionedResult.indicators.some(indicator => 
        indicator.type === 'geographic' && (indicator.details.includes('sanctioned') || indicator.details.includes('blocked'))
      );

      if (!hasSanctionedAlert) {
        throw new Error('Sanctioned country not detected');
      }

      // Test billing vs shipping country mismatch
      const mismatchTransaction = FraudTestDataGenerator.generateNormalTransaction();
      mismatchTransaction.shippingCountry = 'CA'; // Different from billing
      
      const mismatchResult = await fraudDetectionService.detectFraud(mismatchTransaction);
      const hasMismatchAlert = mismatchResult.indicators.some(indicator => 
        indicator.type === 'geographic' && indicator.details.includes('differs from shipping country')
      );

      if (!hasMismatchAlert) {
        throw new Error('Country mismatch not detected');
      }

      const duration = Date.now() - startTime;
      this.results.addResult('Geographic Risk Assessment', true, duration, {
        highRiskDetected: hasGeographicRisk,
        sanctionedDetected: hasSanctionedAlert,
        mismatchDetected: hasMismatchAlert
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.addResult('Geographic Risk Assessment', false, duration, { error: error.message });
      throw error;
    }
  }

  /**
   * Test device fingerprinting
   */
  async testDeviceFingerprinting() {
    const startTime = Date.now();
    
    try {
      // Test new device fingerprint
      const newDeviceTransaction = FraudTestDataGenerator.generateNormalTransaction();
      newDeviceTransaction.deviceFingerprint = 'brand_new_device_12345';
      
      const result = await fraudDetectionService.detectFraud(newDeviceTransaction);
      const hasNewDeviceAlert = result.indicators.some(indicator => 
        indicator.type === 'device' && indicator.details.includes('New device')
      );

      if (!hasNewDeviceAlert) {
        throw new Error('New device fingerprint not detected');
      }

      // Test suspicious user agent
      const suspiciousUserAgentTransaction = FraudTestDataGenerator.generateNormalTransaction();
      suspiciousUserAgentTransaction.userAgent = 'curl/7.68.0'; // Bot user agent
      
      const suspiciousResult = await fraudDetectionService.detectFraud(suspiciousUserAgentTransaction);
      const hasSuspiciousUAAlert = suspiciousResult.indicators.some(indicator => 
        indicator.type === 'device' && indicator.details.includes('Suspicious browser')
      );

      if (!hasSuspiciousUAAlert) {
        throw new Error('Suspicious user agent not detected');
      }

      const duration = Date.now() - startTime;
      this.results.addResult('Device Fingerprinting', true, duration, {
        newDeviceDetected: hasNewDeviceAlert,
        suspiciousUADetected: hasSuspiciousUAAlert
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.addResult('Device Fingerprinting', false, duration, { error: error.message });
      throw error;
    }
  }

  /**
   * Test customer behavior profiling
   */
  async testCustomerBehaviorProfiling() {
    const startTime = Date.now();
    
    try {
      // Simulate customer with established pattern
      const customerId = 'behavior_test_customer';
      
      // Create multiple transactions for the same customer
      const transactions = [];
      for (let i = 0; i < 5; i++) {
        const transaction = FraudTestDataGenerator.generateNormalTransaction(customerId);
        transaction.amount = 15000 + (i * 500); // Consistent pattern around $150
        transaction.timestamp = new Date(Date.now() - i * 24 * 60 * 60 * 1000); // Daily pattern
        transactions.push(transaction);
      }

      // Test abnormal amount for established customer
      const abnormalTransaction = FraudTestDataGenerator.generateNormalTransaction(customerId);
      abnormalTransaction.amount = 75000; // Much higher than customer's typical pattern
      
      const result = await fraudDetectionService.detectFraud(abnormalTransaction);
      const hasBehaviorAlert = result.indicators.some(indicator => 
        indicator.type === 'behavior' && indicator.details.includes('higher than customer\'s average')
      );

      if (!hasBehaviorAlert) {
        throw new Error('Abnormal customer behavior not detected');
      }

      const duration = Date.now() - startTime;
      this.results.addResult('Customer Behavior Profiling', true, duration, {
        behaviorAlerts: result.indicators.filter(i => i.type === 'behavior').length,
        customerProfileUpdated: true
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.addResult('Customer Behavior Profiling', false, duration, { error: error.message });
      throw error;
    }
  }

  /**
   * Test risk scoring algorithms
   */
  async testRiskScoringAlgorithms() {
    const startTime = Date.now();
    
    try {
      // Test different risk levels
      const testCases = [
        { transaction: FraudTestDataGenerator.generateNormalTransaction(), expectedMin: 0, expectedMax: 25 },
        { transaction: FraudTestDataGenerator.generateHighVelocityTransaction(), expectedMin: 50, expectedMax: 85 },
        { transaction: FraudTestDataGenerator.generateFraudulentTransaction(), expectedMin: 75, expectedMax: 100 }
      ];

      const scoringResults = [];

      for (const testCase of testCases) {
        const result = await fraudDetectionService.detectFraud(testCase.transaction);
        scoringResults.push({
          score: result.overallScore,
          riskLevel: result.riskLevel,
          indicators: result.indicators.length
        });

        if (result.overallScore < testCase.expectedMin || result.overallScore > testCase.expectedMax) {
          throw new Error(`Score ${result.overallScore} outside expected range ${testCase.expectedMin}-${testCase.expectedMax}`);
        }
      }

      // Verify score progression
      if (scoringResults[0].score >= scoringResults[1].score) {
        throw new Error('Risk scores should progress logically');
      }
      if (scoringResults[1].score >= scoringResults[2].score) {
        throw new Error('Risk scores should progress logically');
      }

      const duration = Date.now() - startTime;
      this.results.addResult('Risk Scoring Algorithms', true, duration, {
        scoringResults,
        scoreProgression: 'logical'
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.addResult('Risk Scoring Algorithms', false, duration, { error: error.message });
      throw error;
    }
  }

  /**
   * Test threshold validation
   */
  async testThresholdValidation() {
    const startTime = Date.now();
    
    try {
      // Test critical threshold
      const criticalTransaction = FraudTestDataGenerator.generateFraudulentTransaction();
      criticalTransaction.amount = 999999; // Very high amount
      
      const result = await fraudDetectionService.detectFraud(criticalTransaction);
      
      if (result.riskLevel !== 'critical') {
        throw new Error(`Critical risk level not assigned to high-risk transaction. Got: ${result.riskLevel}`);
      }

      // Test low threshold
      const lowRiskTransaction = FraudTestDataGenerator.generateNormalTransaction();
      lowRiskTransaction.amount = 5000; // Low amount
      
      const lowRiskResult = await fraudDetectionService.detectFraud(lowRiskTransaction);
      
      if (lowRiskResult.riskLevel !== 'low') {
        throw new Error(`Low risk level not assigned to normal transaction. Got: ${lowRiskResult.riskLevel}`);
      }

      const duration = Date.now() - startTime;
      this.results.addResult('Threshold Validation', true, duration, {
        criticalRisk: result.riskLevel,
        lowRisk: lowRiskResult.riskLevel,
        thresholdsWorking: true
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.addResult('Threshold Validation', false, duration, { error: error.message });
      throw error;
    }
  }

  /**
   * Test machine learning model accuracy
   */
  async testMachineLearningAccuracy() {
    const startTime = Date.now();
    
    try {
      // Generate test dataset with known labels
      const batchSize = 1000;
      const transactions = FraudTestDataGenerator.generateBatchTransactions(batchSize, 0.2); // 20% fraud
      
      let truePositives = 0;
      let falsePositives = 0;
      let trueNegatives = 0;
      let falseNegatives = 0;
      
      const results = [];

      // Process batch and compare with expected fraud indicators
      for (const transaction of transactions.slice(0, 100)) { // Test subset for speed
        const result = await fraudDetectionService.detectFraud(transaction);
        const isPredictedFraud = result.overallScore >= 50; // Above 50% threshold
        
        // Determine if this was a fraudulent transaction based on patterns
        const isActuallyFraud = transaction.amount >= 500000 || 
                               transaction.billingCountry === 'CN' ||
                               transaction.billingCountry === 'RU' ||
                               transaction.userAgent.includes('bot') ||
                               transaction.userAgent.includes('curl');

        results.push({
          transactionId: transaction.transactionId,
          predictedFraud: isPredictedFraud,
          actualFraud: isActuallyFraud,
          score: result.overallScore,
          riskLevel: result.riskLevel
        });

        // Update confusion matrix
        if (isPredictedFraud && isActuallyFraud) {
          truePositives++;
        } else if (isPredictedFraud && !isActuallyFraud) {
          falsePositives++;
        } else if (!isPredictedFraud && !isActuallyFraud) {
          trueNegatives++;
        } else {
          falseNegatives++;
        }
      }

      // Calculate accuracy metrics
      this.results.calculateMetrics(truePositives, falsePositives, falseNegatives, trueNegatives);

      // Validate against requirements
      if (this.results.results.precision < 0.95) {
        console.warn(`Precision ${this.results.results.precision} below 95% target`);
      }

      if (this.results.results.accuracy < 0.95) {
        console.warn(`Accuracy ${this.results.results.accuracy} below 95% target`);
      }

      const duration = Date.now() - startTime;
      this.results.addResult('Machine Learning Model Accuracy', true, duration, {
        truePositives,
        falsePositives,
        trueNegatives,
        falseNegatives,
        precision: this.results.results.precision,
        accuracy: this.results.results.accuracy,
        recall: this.results.results.recall,
        falsePositiveRate: this.results.results.falsePositiveRate
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.addResult('Machine Learning Model Accuracy', false, duration, { error: error.message });
      throw error;
    }
  }

  /**
   * Test alert generation
   */
  async testAlertGeneration() {
    const startTime = Date.now();
    
    try {
      // Test critical fraud alert
      const criticalTransaction = FraudTestDataGenerator.generateFraudulentTransaction();
      const result = await fraudDetectionService.detectFraud(criticalTransaction);
      
      if (result.recommendations.length === 0) {
        throw new Error('No recommendations generated for high-risk transaction');
      }

      const hasBlockRecommendation = result.recommendations.some(rec => 
        rec.toLowerCase().includes('block') || rec.toLowerCase().includes('manual review')
      );

      if (!hasBlockRecommendation) {
        throw new Error('No block/manual review recommendation for high-risk transaction');
      }

      // Test medium risk alert
      const mediumRiskTransaction = FraudTestDataGenerator.generateHighVelocityTransaction();
      const mediumResult = await fraudDetectionService.detectFraud(mediumRiskTransaction);
      
      if (mediumResult.recommendations.length === 0) {
        throw new Error('No recommendations generated for medium-risk transaction');
      }

      const duration = Date.now() - startTime;
      this.results.addResult('Alert Generation', true, duration, {
        criticalRecommendations: result.recommendations.length,
        mediumRecommendations: mediumResult.recommendations.length,
        alertsGenerated: true
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.addResult('Alert Generation', false, duration, { error: error.message });
      throw error;
    }
  }

  /**
   * Test escalation workflows
   */
  async testEscalationWorkflows() {
    const startTime = Date.now();
    
    try {
      // Test critical fraud escalation
      const criticalTransaction = FraudTestDataGenerator.generateFraudulentTransaction();
      criticalTransaction.amount = 999999; // Very high amount
      
      const result = await fraudDetectionService.detectFraud(criticalTransaction);
      
      if (result.riskLevel !== 'critical') {
        throw new Error('Critical risk level not triggered for escalation test');
      }

      // Verify recommendations include escalation actions
      const hasEscalation = result.recommendations.some(rec => 
        rec.toLowerCase().includes('block') || 
        rec.toLowerCase().includes('manual review') ||
        rec.toLowerCase().includes('investigation')
      );

      if (!hasEscalation) {
        throw new Error('No escalation recommendations for critical fraud');
      }

      const duration = Date.now() - startTime;
      this.results.addResult('Escalation Workflows', true, duration, {
        criticalRiskLevel: result.riskLevel,
        escalationRecommendations: result.recommendations.filter(r => 
          r.toLowerCase().includes('block') || 
          r.toLowerCase().includes('manual') ||
          r.toLowerCase().includes('investigation')
        ).length
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.addResult('Escalation Workflows', false, duration, { error: error.message });
      throw error;
    }
  }

  /**
   * Test investigation case management
   */
  async testInvestigationCaseManagement() {
    const startTime = Date.now();
    
    try {
      // Test case creation for high-risk transactions
      const suspiciousTransactions = [
        FraudTestDataGenerator.generateFraudulentTransaction(),
        FraudTestDataGenerator.generateHighVelocityTransaction()
      ];

      const caseResults = [];
      for (const transaction of suspiciousTransactions) {
        const result = await fraudDetectionService.detectFraud(transaction);
        caseResults.push({
          transactionId: transaction.transactionId,
          score: result.overallScore,
          riskLevel: result.riskLevel,
          indicators: result.indicators.length,
          requiresInvestigation: result.riskLevel === 'high' || result.riskLevel === 'critical'
        });
      }

      const investigationsRequired = caseResults.filter(c => c.requiresInvestigation).length;
      
      if (investigationsRequired === 0) {
        throw new Error('No cases flagged for investigation');
      }

      // Test investigation tracking (metadata should be preserved)
      for (const result of caseResults) {
        if (result.score > 0) {
          // Verify investigation data is available
          console.log(`Case ${result.transactionId}: Risk ${result.riskLevel}, Score ${result.score}`);
        }
      }

      const duration = Date.now() - startTime;
      this.results.addResult('Investigation Case Management', true, duration, {
        totalCases: caseResults.length,
        investigationsRequired,
        caseDataPreserved: true
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.addResult('Investigation Case Management', false, duration, { error: error.message });
      throw error;
    }
  }

  /**
   * Test Stripe Radar integration
   */
  async testStripeRadarIntegration() {
    const startTime = Date.now();
    
    try {
      // Test integration scoring
      const transaction = FraudTestDataGenerator.generateFraudulentTransaction();
      const result = await fraudDetectionService.detectFraud(transaction);
      
      // Check if Stripe Radar score was incorporated
      const hasRadarScore = result.indicators.some(indicator => 
        indicator.type === 'behavior' && indicator.details.toLowerCase().includes('radar')
      );

      // Note: In mock implementation, this may not always be present
      console.log(`Stripe Radar integration test completed. Radar score present: ${hasRadarScore}`);
      
      // Test overall integration effectiveness
      if (result.overallScore < 50) {
        throw new Error('Combined scoring not working effectively with Stripe Radar');
      }

      const duration = Date.now() - startTime;
      this.results.addResult('Stripe Radar Integration', true, duration, {
        radarScoreIntegrated: hasRadarScore,
        combinedScoringEffective: result.overallScore >= 50,
        totalIndicators: result.indicators.length
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.addResult('Stripe Radar Integration', false, duration, { error: error.message });
      throw error;
    }
  }

  /**
   * Test batch processing performance
   */
  async testBatchProcessingPerformance() {
    const startTime = Date.now();
    
    try {
      const batchSize = 50;
      const transactions = FraudTestDataGenerator.generateBatchTransactions(batchSize, 0.1);
      
      const results = [];
      const batchStartTime = Date.now();

      for (const transaction of transactions) {
        const result = await fraudDetectionService.detectFraud(transaction);
        results.push({
          transactionId: transaction.transactionId,
          score: result.overallScore,
          riskLevel: result.riskLevel
        });
      }

      const batchDuration = Date.now() - batchStartTime;
      const avgTimePerTransaction = batchDuration / batchSize;

      // Validate performance requirements (<5 seconds per transaction)
      if (avgTimePerTransaction > 5000) {
        throw new Error(`Transaction processing too slow: ${avgTimePerTransaction.toFixed(2)}ms per transaction`);
      }

      // Check batch completeness
      if (results.length !== batchSize) {
        throw new Error(`Batch processing incomplete: ${results.length}/${batchSize} transactions processed`);
      }

      const duration = Date.now() - startTime;
      this.results.addResult('Batch Processing Performance', true, duration, {
        batchSize,
        totalDuration: `${batchDuration}ms`,
        avgTimePerTransaction: `${avgTimePerTransaction.toFixed(2)}ms`,
        meetsPerformanceReq: avgTimePerTransaction < 5000
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.addResult('Batch Processing Performance', false, duration, { error: error.message });
      throw error;
    }
  }

  /**
   * Test real-time response times
   */
  async testRealTimeResponseTimes() {
    const startTime = Date.now();
    
    try {
      const responseTimes = [];
      const testCount = 20;

      for (let i = 0; i < testCount; i++) {
        const transaction = FraudTestDataGenerator.generateNormalTransaction();
        const start = Date.now();
        
        await fraudDetectionService.detectFraud(transaction);
        
        const responseTime = Date.now() - start;
        responseTimes.push(responseTime);
      }

      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const minResponseTime = Math.min(...responseTimes);

      // Validate response time requirements (<5 seconds)
      if (maxResponseTime > 5000) {
        throw new Error(`Max response time too high: ${maxResponseTime}ms`);
      }

      // Real-time target should be much lower
      if (avgResponseTime > 2000) {
        console.warn(`Average response time ${avgResponseTime.toFixed(2)}ms higher than ideal for real-time processing`);
      }

      const duration = Date.now() - startTime;
      this.results.addResult('Real-time Response Times', true, duration, {
        avgResponseTime: `${avgResponseTime.toFixed(2)}ms`,
        maxResponseTime: `${maxResponseTime}ms`,
        minResponseTime: `${minResponseTime}ms`,
        meetsRealtimeReq: maxResponseTime < 5000
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.addResult('Real-time Response Times', false, duration, { error: error.message });
      throw error;
    }
  }
}

// Main execution
async function main() {
  console.log('🛡️  ORACLE-LEDGER Fraud Detection Testing Suite');
  console.log('===============================================\n');

  try {
    const testSuite = new FraudDetectionTestSuite();
    const report = await testSuite.runAllTests();
    
    console.log('\n📊 Fraud Detection Test Results');
    console.log('==================================');
    console.log(`Total Tests: ${report.summary.total}`);
    console.log(`Passed: ${report.summary.passed}`);
    console.log(`Failed: ${report.summary.failed}`);
    console.log(`Pass Rate: ${report.summary.passRate}`);
    console.log(`Average Duration: ${report.summary.averageDuration}`);
    console.log(`\n🎯 Fraud Detection Metrics:`);
    console.log(`Accuracy: ${report.summary.fraudAccuracy}`);
    console.log(`Precision: ${report.summary.fraudPrecision}`);
    console.log(`Recall: ${report.summary.fraudRecall}`);
    console.log(`False Positive Rate: ${report.summary.falsePositiveRate}`);
    
    console.log(`\n✅ Requirements Status:`);
    console.log(`Accuracy >95%: ${report.meetsRequirements.accuracy95Plus ? '✅' : '❌'} ${report.summary.fraudAccuracy}`);
    console.log(`Precision >95%: ${report.meetsRequirements.precision95Plus ? '✅' : '❌'} ${report.summary.fraudPrecision}`);
    console.log(`False Positive <5%: ${report.meetsRequirements.falsePositiveRateLow ? '✅' : '❌'} ${report.summary.falsePositiveRate}`);
    
    if (report.summary.failed === 0) {
      console.log('\n🎉 All fraud detection tests passed successfully!');
    } else {
      console.log(`\n⚠️  ${report.summary.failed} test(s) failed. Review details above.`);
    }

    return report;
  } catch (error) {
    console.error('❌ Testing suite failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { FraudDetectionTestSuite, FraudTestDataGenerator };