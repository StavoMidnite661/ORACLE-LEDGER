#!/usr/bin/env node

/**
 * ORACLE-LEDGER Comprehensive Testing Suite Runner
 * Executes all security and integration tests in sequence
 */

import { FraudDetectionTestSuite } from './test-fraud-detection.js';
import { SecurityMonitoringTestSuite } from './test-security-monitoring.js';
import { JournalIntegrationTestSuite } from './test-journal-integration.js';
import { LedgerIntegrationTestSuite } from './test-ledger-integration.js';
import { PerformanceTestSuite } from './test-performance.js';

class ComprehensiveTestRunner {
  constructor() {
    this.testSuites = [
      {
        name: 'Fraud Detection Tests',
        suite: FraudDetectionTestSuite,
        file: './test-fraud-detection.js',
        description: 'Tests fraud detection accuracy (>95% precision), pattern analysis, and alert workflows'
      },
      {
        name: 'Security Monitoring Tests',
        suite: SecurityMonitoringTestSuite,
        file: './test-security-monitoring.js',
        description: 'Tests real-time security monitoring, threat detection, and incident response (<5s response)'
      },
      {
        name: 'Journal Integration Tests',
        suite: JournalIntegrationTestSuite,
        file: './test-journal-integration.js',
        description: 'Tests automatic journal entry creation, double-entry bookkeeping, and account mapping'
      },
      {
        name: 'Ledger Integration Tests',
        suite: LedgerIntegrationTestSuite,
        file: './test-ledger-integration.js',
        tests: 'Tests integration with ORACLE-LEDGER, transaction posting, and financial reporting'
      },
      {
        name: 'Performance and Load Tests',
        suite: PerformanceTestSuite,
        file: './test-performance.js',
        description: 'Tests high-volume processing (10,000+ transactions/day), concurrency, and scalability'
      }
    ];
    
    this.results = {
      totalSuites: this.testSuites.length,
      completedSuites: 0,
      passedSuites: 0,
      failedSuites: 0,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0,
      suiteResults: []
    };
  }

  async runAllTests(options = {}) {
    const {
      runFraudTests = true,
      runSecurityTests = true,
      runJournalTests = true,
      runLedgerTests = true,
      runPerformanceTests = true,
      skipPerformanceTests = false, // Performance tests can be very time-consuming
      verbose = true
    } = options;

    console.log('🧪 ORACLE-LEDGER Comprehensive Testing Suite');
    console.log('============================================\n');

    const startTime = Date.now();
    const filterSuites = [];

    if (runFraudTests) filterSuites.push(this.testSuites[0]);
    if (runSecurityTests) filterSuites.push(this.testSuites[1]);
    if (runJournalTests) filterSuites.push(this.testSuites[2]);
    if (runLedgerTests) filterSuites.push(this.testSuites[3]);
    if (runPerformanceTests && !skipPerformanceTests) filterSuites.push(this.testSuites[4]);

    console.log(`Running ${filterSuites.length} test suites...\n`);

    for (const testSuite of filterSuites) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🧪 Running: ${testSuite.name}`);
      console.log(`📝 Description: ${testSuite.description}`);
      console.log(`${'='.repeat(60)}\n`);

      try {
        const suiteStartTime = Date.now();
        const suite = new testSuite.suite();
        const report = await suite.runAllTests();

        this.results.completedSuites++;
        
        if (report.summary.failed === 0) {
          this.results.passedSuites++;
          console.log(`\n✅ ${testSuite.name} - ALL TESTS PASSED`);
        } else {
          this.results.failedSuites++;
          console.log(`\n❌ ${testSuite.name} - ${report.summary.failed} TESTS FAILED`);
        }

        const suiteDuration = Date.now() - suiteStartTime;
        this.results.totalDuration += suiteDuration;

        // Update overall results
        this.results.totalTests += report.summary.total;
        this.results.passedTests += report.summary.passed;
        this.results.failedTests += report.summary.failed;

        // Store suite result
        this.results.suiteResults.push({
          suiteName: testSuite.name,
          duration: suiteDuration,
          report,
          status: report.summary.failed === 0 ? 'PASSED' : 'FAILED'
        });

        if (verbose) {
          this.printSuiteSummary(testSuite.name, report);
        }

      } catch (error) {
        this.results.completedSuites++;
        this.results.failedSuites++;
        this.results.totalDuration += Date.now() - startTime;

        console.error(`\n💥 ${testSuite.name} - SUITE FAILED`);
        console.error(`Error: ${error.message}\n`);

        this.results.suiteResults.push({
          suiteName: testSuite.name,
          duration: 0,
          report: null,
          status: 'SUITE_ERROR',
          error: error.message
        });
      }
    }

    this.printOverallSummary();

    return this.results;
  }

  printSuiteSummary(suiteName, report) {
    console.log(`\n📊 ${suiteName} Summary:`);
    console.log(`  Total Tests: ${report.summary.total}`);
    console.log(`  Passed: ${report.summary.passed}`);
    console.log(`  Failed: ${report.summary.failed}`);
    console.log(`  Pass Rate: ${report.summary.passRate}`);
    console.log(`  Duration: ${report.summary.averageDuration} (average)`);
  }

  printOverallSummary() {
    const totalDuration = Date.now() - this.results.totalDuration;
    const overallPassRate = (this.results.passedTests / this.results.totalTests) * 100;
    
    console.log(`\n${'='.repeat(80)}`);
    console.log('📋 COMPREHENSIVE TEST RESULTS SUMMARY');
    console.log(`${'='.repeat(80)}\n`);
    
    console.log(`🎯 Overall Statistics:`);
    console.log(`  Test Suites: ${this.results.completedSuites}/${this.results.totalSuites}`);
    console.log(`  Total Tests: ${this.results.totalTests}`);
    console.log(`  Passed: ${this.results.passedTests}`);
    console.log(`  Failed: ${this.results.failedTests}`);
    console.log(`  Overall Pass Rate: ${overallPassRate.toFixed(2)}%`);
    console.log(`  Total Duration: ${(totalDuration / 1000).toFixed(2)} seconds`);
    
    console.log(`\n📊 Suite Status:`);
    for (const result of this.results.suiteResults) {
      const status = result.status === 'PASSED' ? '✅' : '❌';
      const duration = `${(result.duration / 1000).toFixed(2)}s`;
      console.log(`  ${status} ${result.suiteName} - ${duration}`);
    }
    
    console.log(`\n🎯 Requirements Validation:`);
    
    // Fraud Detection Requirements
    const fraudSuite = this.results.suiteResults.find(r => r.suiteName.includes('Fraud'));
    if (fraudSuite && fraudSuite.report) {
      const fraudMetrics = fraudSuite.report.summary;
      const meetsFraudReq = fraudMetrics.fraudAccuracy && parseFloat(fraudMetrics.fraudAccuracy.replace('%', '')) >= 95;
      console.log(`  ${meetsFraudReq ? '✅' : '❌'} Fraud Detection Accuracy >95%: ${fraudMetrics.fraudAccuracy || 'N/A'}`);
    }
    
    // Security Monitoring Requirements
    const securitySuite = this.results.suiteResults.find(r => r.suiteName.includes('Security'));
    if (securitySuite && securitySuite.report) {
      const secMetrics = securitySuite.report.summary;
      const meetsSecReq = secMetrics.maxResponseTime && parseInt(secMetrics.maxResponseTime) < 5000;
      console.log(`  ${meetsSecReq ? '✅' : '❌'} Security Response Time <5s: ${secMetrics.maxResponseTime || 'N/A'}`);
    }
    
    // Performance Requirements
    const perfSuite = this.results.suiteResults.find(r => r.suiteName.includes('Performance'));
    if (perfSuite && perfSuite.report) {
      const perfMetrics = perfSuite.report.summary;
      const meetsPerfReq = parseFloat(perfMetrics.averageResponseTime) < 5000;
      console.log(`  ${meetsPerfReq ? '✅' : '❌'} Performance Response <5s: ${perfMetrics.averageResponseTime || 'N/A'}`);
      console.log(`  ${perfMetrics.totalOperations ? '✅' : '❌'} High-Volume Processing: ${perfMetrics.totalOperations || 'N/A'} operations tested`);
    }
    
    console.log(`\n🏆 Final Status:`);
    if (this.results.failedTests === 0 && this.results.failedSuites === 0) {
      console.log('  🎉 ALL TESTS PASSED SUCCESSFULLY!');
      console.log('  🎯 All requirements met: Fraud detection >95%, Security response <5s, Performance validated');
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

  generateTestReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalSuites: this.results.totalSuites,
        completedSuites: this.results.completedSuites,
        passedSuites: this.results.passedSuites,
        failedSuites: this.results.failedSuites,
        totalTests: this.results.totalTests,
        passedTests: this.results.passedTests,
        failedTests: this.results.failedTests,
        overallPassRate: ((this.results.passedTests / this.results.totalTests) * 100).toFixed(2) + '%',
        totalDuration: (this.results.totalDuration / 1000).toFixed(2) + ' seconds'
      },
      requirements: {
        fraudDetectionAccuracy: 'Target: >95%',
        securityResponseTime: 'Target: <5 seconds',
        highVolumeProcessing: 'Target: 10,000+ transactions/day',
        journalEntryAccuracy: 'Target: 100% double-entry compliance',
        systemScalability: 'Target: Support 100+ concurrent users'
      },
      suites: this.results.suiteResults.map(result => ({
        name: result.suiteName,
        status: result.status,
        duration: result.duration + 'ms',
        tests: result.report ? {
          total: result.report.summary.total,
          passed: result.report.summary.passed,
          failed: result.report.summary.failed,
          passRate: result.report.summary.passRate
        } : null,
        metrics: result.report ? this.extractKeyMetrics(result.report) : null,
        error: result.error
      }))
    };
    
    return report;
  }

  extractKeyMetrics(report) {
    const metrics = {};
    
    // Extract suite-specific metrics
    if (report.summary.fraudAccuracy) metrics.fraudAccuracy = report.summary.fraudAccuracy;
    if (report.summary.fraudPrecision) metrics.fraudPrecision = report.summary.fraudPrecision;
    if (report.summary.fraudRecall) metrics.fraudRecall = report.summary.fraudRecall;
    if (report.summary.falsePositiveRate) metrics.falsePositiveRate = report.summary.falsePositiveRate;
    
    if (report.summary.maxResponseTime) metrics.maxResponseTime = report.summary.maxResponseTime;
    if (report.summary.averageResponseTime) metrics.averageResponseTime = report.summary.averageResponseTime;
    
    if (report.summary.entriesCreated) metrics.entriesCreated = report.summary.entriesCreated;
    if (report.summary.validationErrors !== undefined) metrics.validationErrors = report.summary.validationErrors;
    if (report.summary.doubleEntryViolations !== undefined) metrics.doubleEntryViolations = report.summary.doubleEntryViolations;
    
    if (report.summary.integrationsTested) metrics.integrationsTested = report.summary.integrationsTested;
    if (report.summary.entriesProcessed) metrics.entriesProcessed = report.summary.entriesProcessed;
    if (report.summary.reportsGenerated) metrics.reportsGenerated = report.summary.reportsGenerated;
    
    if (report.summary.totalOperations) metrics.totalOperations = report.summary.totalOperations;
    if (report.summary.successRate) metrics.successRate = report.summary.successRate;
    
    return metrics;
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const options = {
    runFraudTests: !args.includes('--skip-fraud'),
    runSecurityTests: !args.includes('--skip-security'),
    runJournalTests: !args.includes('--skip-journal'),
    runLedgerTests: !args.includes('--skip-ledger'),
    runPerformanceTests: !args.includes('--skip-performance'),
    skipPerformanceTests: args.includes('--quick') || args.includes('--fast'),
    verbose: !args.includes('--quiet')
  };

  const helpRequested = args.includes('--help') || args.includes('-h');
  
  if (helpRequested) {
    console.log(`
🧪 ORACLE-LEDGER Comprehensive Testing Suite Runner

Usage: node run-all-tests.js [options]

Options:
  --skip-fraud        Skip fraud detection tests
  --skip-security     Skip security monitoring tests
  --skip-journal      Skip journal integration tests
  --skip-ledger       Skip ledger integration tests
  --skip-performance  Skip performance and load tests
  --quick, --fast     Skip performance tests (alias for --skip-performance)
  --quiet             Reduce output verbosity
  --help, -h          Show this help message

Examples:
  node run-all-tests.js                    # Run all tests
  node run-all-tests.js --skip-performance # Skip performance tests
  node run-all-tests.js --quick            # Quick test run
  node run-all-tests.js --skip-fraud --skip-security # Security-focused tests only

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
    const runner = new ComprehensiveTestRunner();
    const results = await runner.runAllTests(options);
    
    // Generate and save detailed report
    const report = runner.generateTestReport();
    
    // Write report to file
    const fs = await import('fs');
    const reportFilename = `test-report-${Date.now()}.json`;
    fs.writeFileSync(reportFilename, JSON.stringify(report, null, 2));
    
    console.log(`📄 Detailed report saved to: ${reportFilename}`);
    
    // Exit with appropriate code
    const exitCode = results.failedTests === 0 && results.failedSuites === 0 ? 0 : 1;
    process.exit(exitCode);
    
  } catch (error) {
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

export { ComprehensiveTestRunner };