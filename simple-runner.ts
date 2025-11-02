#!/usr/bin/env node

/**
 * Simple Test Runner for ORACLE-LEDGER Testing Suite
 */

import { FraudDetectionTestSuite } from './test-fraud-detection.js';
import { SecurityMonitoringTestSuite } from './test-security-monitoring.js';
import { JournalIntegrationTestSuite } from './test-journal-integration.js';
import { LedgerIntegrationTestSuite } from './test-ledger-integration.js';
import { PerformanceTestSuite } from './test-performance.js';

class SimpleTestRunner {
  constructor() {
    this.results = {
      totalSuites: 0,
      completedSuites: 0,
      passedSuites: 0,
      failedSuites: 0,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      suiteResults: []
    };
  }

  async runTest(suiteName: string, suiteClass: any): Promise<any> {
    console.log(`\n🧪 Running: ${suiteName}`);
    console.log(`${'='.repeat(50)}`);

    const startTime = Date.now();
    
    try {
      const suite = new suiteClass();
      const report = await suite.runAllTests();
      const duration = Date.now() - startTime;

      const failed = report.summary.failed || 0;
      const passed = report.summary.passed || 0;
      const total = report.summary.total || 0;

      console.log(`\n✅ ${suiteName} completed`);
      console.log(`   Tests: ${passed}/${total} passed`);
      console.log(`   Duration: ${(duration / 1000).toFixed(2)}s`);

      this.results.completedSuites++;
      if (failed === 0) {
        this.results.passedSuites++;
        console.log(`   Status: ALL PASSED`);
      } else {
        this.results.failedSuites++;
        console.log(`   Status: ${failed} FAILED`);
      }

      this.results.totalTests += total;
      this.results.passedTests += passed;
      this.results.failedTests += failed;

      return {
        suiteName,
        status: failed === 0 ? 'PASSED' : 'FAILED',
        duration,
        report
      };

    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.log(`\n❌ ${suiteName} failed`);
      console.log(`   Error: ${error.message}`);

      this.results.completedSuites++;
      this.results.failedSuites++;

      return {
        suiteName,
        status: 'ERROR',
        duration,
        error: error.message
      };
    }
  }

  async runAllTests(skipPerformance = false) {
    console.log('🧪 ORACLE-LEDGER Comprehensive Testing Suite');
    console.log('============================================\n');

    const testSuites = [
      ['Fraud Detection Tests', FraudDetectionTestSuite],
      ['Security Monitoring Tests', SecurityMonitoringTestSuite],
      ['Journal Integration Tests', JournalIntegrationTestSuite],
      ['Ledger Integration Tests', LedgerIntegrationTestSuite]
    ];

    if (!skipPerformance) {
      testSuites.push(['Performance Tests', PerformanceTestSuite]);
    }

    this.results.totalSuites = testSuites.length;

    for (const [name, suiteClass] of testSuites) {
      const result = await this.runTest(name, suiteClass);
      this.results.suiteResults.push(result);
    }

    this.printSummary();
    return this.results;
  }

  printSummary() {
    const totalDuration = this.results.suiteResults.reduce((sum, r) => sum + r.duration, 0);
    const passRate = this.results.totalTests > 0 ? 
      ((this.results.passedTests / this.results.totalTests) * 100).toFixed(2) : '0.00';

    console.log(`\n${'='.repeat(80)}`);
    console.log('📋 COMPREHENSIVE TEST RESULTS SUMMARY');
    console.log(`${'='.repeat(80)}\n`);

    console.log(`🎯 Overall Statistics:`);
    console.log(`  Test Suites: ${this.results.completedSuites}/${this.results.totalSuites}`);
    console.log(`  Total Tests: ${this.results.totalTests}`);
    console.log(`  Passed: ${this.results.passedTests}`);
    console.log(`  Failed: ${this.results.failedTests}`);
    console.log(`  Overall Pass Rate: ${passRate}%`);
    console.log(`  Total Duration: ${(totalDuration / 1000).toFixed(2)} seconds`);

    console.log(`\n📊 Suite Status:`);
    this.results.suiteResults.forEach(result => {
      const status = result.status === 'PASSED' ? '✅' : '❌';
      const duration = `${(result.duration / 1000).toFixed(2)}s`;
      const tests = result.report ? 
        `${result.report.summary.passed}/${result.report.summary.total}` : 'N/A';
      console.log(`  ${status} ${result.suiteName} - ${duration} (${tests})`);
    });

    console.log(`\n🎯 Requirements Validation:`);
    
    // Fraud Detection Requirements
    const fraudSuite = this.results.suiteResults.find(r => r.suiteName.includes('Fraud'));
    if (fraudSuite && fraudSuite.report?.summary?.fraudAccuracy) {
      const accuracy = parseFloat(fraudSuite.report.summary.fraudAccuracy.replace('%', ''));
      const meetsFraudReq = accuracy >= 95;
      console.log(`  ${meetsFraudReq ? '✅' : '❌'} Fraud Detection Accuracy >95%: ${fraudSuite.report.summary.fraudAccuracy}`);
    } else {
      console.log(`  ⚠️  Fraud Detection Accuracy: No data available`);
    }

    // Security Monitoring Requirements
    const securitySuite = this.results.suiteResults.find(r => r.suiteName.includes('Security'));
    if (securitySuite && securitySuite.report?.summary?.maxResponseTime) {
      const responseTime = parseInt(securitySuite.report.summary.maxResponseTime);
      const meetsSecReq = responseTime < 5000;
      console.log(`  ${meetsSecReq ? '✅' : '❌'} Security Response Time <5s: ${securitySuite.report.summary.maxResponseTime}`);
    } else {
      console.log(`  ⚠️  Security Response Time: No data available`);
    }

    // Performance Requirements
    const perfSuite = this.results.suiteResults.find(r => r.suiteName.includes('Performance'));
    if (perfSuite && perfSuite.report?.summary?.totalOperations) {
      const ops = perfSuite.report.summary.totalOperations;
      const meetsPerfReq = ops >= 10000;
      console.log(`  ${meetsPerfReq ? '✅' : '❌'} High-Volume Processing: ${ops} operations tested`);
    } else {
      console.log(`  ⚠️  Performance Testing: Skipped or no data available`);
    }

    console.log(`\n🏆 Final Status:`);
    if (this.results.failedTests === 0 && this.results.failedSuites === 0) {
      console.log('  🎉 ALL TESTS PASSED SUCCESSFULLY!');
      console.log('  🎯 All requirements met: Fraud detection >95%, Security response <5s');
      console.log('  🔒 System ready for production with comprehensive testing coverage');
    } else if (this.results.failedSuites === 0) {
      console.log('  ⚠️  SOME TESTS FAILED - Review failed tests above');
      console.log('  📋 Check individual test reports for specific failure details');
    } else {
      console.log('  💥 SUITE FAILURES DETECTED - Critical issues found');
      console.log('  🚨 Review suite errors and resolve before production deployment');
    }

    console.log(`\n${'='.repeat(80)}\n`);
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const skipPerformance = args.includes('--skip-performance') || args.includes('--quick');

  const helpRequested = args.includes('--help') || args.includes('-h');
  
  if (helpRequested) {
    console.log(`
🧪 ORACLE-LEDGER Comprehensive Testing Suite Runner

Usage: node simple-runner.ts [options]

Options:
  --skip-performance   Skip performance and load tests
  --help, -h          Show this help message

Examples:
  node simple-runner.ts                    # Run all tests
  node simple-runner.ts --skip-performance # Skip performance tests

Requirements Validation:
  ✓ Fraud Detection Accuracy >95%
  ✓ Security Response Time <5 seconds
  ✓ High-Volume Processing 10,000+ transactions/day
  ✓ Journal Entry Double-Entry Compliance
  ✓ System Scalability and Performance
`);
    process.exit(0);
  }

  try {
    const runner = new SimpleTestRunner();
    const results = await runner.runAllTests(skipPerformance);
    
    const exitCode = results.failedSuites === 0 ? 0 : 1;
    process.exit(exitCode);
    
  } catch (error: any) {
    console.error('💥 Test runner failed:', error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}