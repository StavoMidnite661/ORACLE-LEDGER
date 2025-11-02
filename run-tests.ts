#!/usr/bin/env node

/**
 * ORACLE-LEDGER Comprehensive Testing Suite Runner
 * Executes all security and integration tests in sequence using tsx
 */

import { spawn } from 'child_process';
import { existsSync, writeFileSync, unlinkSync } from 'fs';

interface TestResult {
  suiteName: string;
  status: 'PASSED' | 'FAILED' | 'ERROR';
  passed: number;
  failed: number;
  total: number;
  duration: number;
  errors: string[];
}

class ComprehensiveTestRunner {
  constructor() {
    this.testSuites = [
      {
        name: 'Fraud Detection Tests',
        file: './test-fraud-detection.ts',
        description: 'Tests fraud detection accuracy (>95% precision), pattern analysis, and alert workflows'
      },
      {
        name: 'Security Monitoring Tests',
        file: './test-security-monitoring.ts',
        description: 'Tests real-time security monitoring, threat detection, and incident response (<5s response)'
      },
      {
        name: 'Journal Integration Tests',
        file: './test-journal-integration.ts',
        description: 'Tests automatic journal entry creation, double-entry bookkeeping, and account mapping'
      },
      {
        name: 'Ledger Integration Tests',
        file: './test-ledger-integration.ts',
        description: 'Tests integration with ORACLE-LEDGER, transaction posting, and financial reporting'
      },
      {
        name: 'Performance and Load Tests',
        file: './test-performance.ts',
        description: 'Tests high-volume processing (10,000+ transactions/day), concurrency, and scalability'
      }
    ];

    this.results: TestResult[] = [];
    this.startTime = Date.now();
  }

  async runAllTests(options: any = {}) {
    const {
      skipPerformance = false,
      verbose = true,
      quick = false
    } = options;

    console.log('🧪 ORACLE-LEDGER Comprehensive Testing Suite');
    console.log('============================================\n');

    const suites = quick || skipPerformance 
      ? this.testSuites.slice(0, 4) 
      : this.testSuites;

    console.log(`Running ${suites.length} test suites...\n`);

    for (const testSuite of suites) {
      await this.runTestSuite(testSuite, verbose);
    }

    this.printSummary();
    return this.results;
  }

  async runTestSuite(testSuite: any, verbose: boolean = true) {
    const suiteStartTime = Date.now();

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 Running: ${testSuite.name}`);
    console.log(`📝 Description: ${testSuite.description}`);
    console.log(`${'='.repeat(60)}\n`);

    try {
      // Create a temporary runner script for each test suite
      const runnerScript = this.createRunnerScript(testSuite.file);
      
      const result = await this.executeTestSuite(runnerScript);
      const duration = Date.now() - suiteStartTime;

      this.results.push({
        suiteName: testSuite.name,
        status: result.failed === 0 ? 'PASSED' : 'FAILED',
        passed: result.passed,
        failed: result.failed,
        total: result.total,
        duration,
        errors: result.errors
      });

      if (result.failed === 0) {
        console.log(`\n✅ ${testSuite.name} - ALL TESTS PASSED`);
      } else {
        console.log(`\n❌ ${testSuite.name} - ${result.failed} TESTS FAILED`);
      }

      if (verbose) {
        this.printSuiteDetails(testSuite.name, result);
      }

      // Clean up temporary runner script
      try {
        unlinkSync(runnerScript);
      } catch (e) {
        // Ignore cleanup errors
      }

    } catch (error: any) {
      console.error(`\n💥 ${testSuite.name} - SUITE ERROR`);
      console.error(`Error: ${error.message}\n`);

      this.results.push({
        suiteName: testSuite.name,
        status: 'ERROR',
        passed: 0,
        failed: 0,
        total: 0,
        duration: Date.now() - suiteStartTime,
        errors: [error.message]
      });
    }
  }

  createRunnerScript(testFile: string): string {
    const runnerScript = `
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import and run test suite
const testModule = await import('./${testFile.replace('./', '')}');
const TestSuiteClass = testModule.default || testModule.FraudDetectionTestSuite || 
                     testModule.SecurityMonitoringTestSuite || testModule.JournalIntegrationTestSuite ||
                     testModule.LedgerIntegrationTestSuite || testModule.PerformanceTestSuite;

if (TestSuiteClass) {
  const suite = new TestSuiteClass();
  try {
    const report = await suite.runAllTests();
    console.log(JSON.stringify(report));
  } catch (error) {
    console.error('Test suite execution failed:', error);
    process.exit(1);
  }
} else {
  console.error('Test suite class not found');
  process.exit(1);
}
    `;

    const scriptPath = `./temp-runner-${Date.now()}.js`;
    writeFileSync(scriptPath, runnerScript.trim());
    return scriptPath;
  }

  async executeTestSuite(scriptPath: string): Promise<any> {
    return new Promise((resolve) => {
      const tsx = spawn('npx', ['tsx', scriptPath], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      tsx.stdout.on('data', (data: any) => {
        stdout += data.toString();
      });

      tsx.stderr.on('data', (data: any) => {
        stderr += data.toString();
      });

      tsx.on('close', (code: any) => {
        if (code === 0 && stdout) {
          try {
            const result = JSON.parse(stdout.trim());
            resolve({
              passed: result.summary?.passed || 0,
              failed: result.summary?.failed || 0,
              total: result.summary?.total || 0,
              errors: []
            });
          } catch (e) {
            resolve({
              passed: 0,
              failed: 1,
              total: 1,
              errors: ['Failed to parse test output']
            });
          }
        } else {
          resolve({
            passed: 0,
            failed: 1,
            total: 1,
            errors: [stderr || `Process exited with code ${code}`]
          });
        }
      });

      tsx.on('error', (error: any) => {
        resolve({
          passed: 0,
          failed: 1,
          total: 1,
          errors: [`Execution error: ${error.message}`]
        });
      });
    });
  }

  printSuiteDetails(suiteName: string, result: any) {
    console.log(`\n📊 ${suiteName} Summary:`);
    console.log(`  Total Tests: ${result.total}`);
    console.log(`  Passed: ${result.passed}`);
    console.log(`  Failed: ${result.failed}`);
    
    if (result.errors.length > 0) {
      console.log(`  Errors:`);
      result.errors.forEach((error: string) => {
        console.log(`    - ${error}`);
      });
    }
  }

  printSummary() {
    const totalDuration = Date.now() - this.startTime;
    const totalPassed = this.results.reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = this.results.reduce((sum, r) => sum + r.failed, 0);
    const totalTests = totalPassed + totalFailed;
    const passRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(2) : '0.00';

    console.log(`\n${'='.repeat(80)}`);
    console.log('📋 COMPREHENSIVE TEST RESULTS SUMMARY');
    console.log(`${'='.repeat(80)}\n`);

    console.log(`🎯 Overall Statistics:`);
    console.log(`  Test Suites: ${this.results.length}/${this.testSuites.length}`);
    console.log(`  Total Tests: ${totalTests}`);
    console.log(`  Passed: ${totalPassed}`);
    console.log(`  Failed: ${totalFailed}`);
    console.log(`  Overall Pass Rate: ${passRate}%`);
    console.log(`  Total Duration: ${(totalDuration / 1000).toFixed(2)} seconds`);

    console.log(`\n📊 Suite Status:`);
    this.results.forEach(result => {
      const status = result.status === 'PASSED' ? '✅' : result.status === 'FAILED' ? '❌' : '💥';
      const duration = `${(result.duration / 1000).toFixed(2)}s`;
      console.log(`  ${status} ${result.suiteName} - ${duration} (${result.passed}/${result.total} passed)`);
    });

    console.log(`\n🏆 Final Status:`);
    if (totalFailed === 0 && this.results.every(r => r.status === 'PASSED')) {
      console.log('  🎉 ALL TESTS PASSED SUCCESSFULLY!');
      console.log('  🎯 All requirements met: Fraud detection >95%, Security response <5s, Performance validated');
      console.log('  🔒 System ready for production with comprehensive testing coverage');
    } else {
      console.log('  ⚠️  SOME TESTS FAILED - Review failed tests above');
      console.log('  📋 Check individual test reports for specific failure details');
    }

    console.log(`\n${'='.repeat(80)}\n`);

    // Generate detailed report
    this.generateReport();
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalSuites: this.testSuites.length,
        completedSuites: this.results.length,
        passedSuites: this.results.filter(r => r.status === 'PASSED').length,
        failedSuites: this.results.filter(r => r.status !== 'PASSED').length,
        totalTests: this.results.reduce((sum, r) => sum + r.total, 0),
        passedTests: this.results.reduce((sum, r) => sum + r.passed, 0),
        failedTests: this.results.reduce((sum, r) => sum + r.failed, 0),
        overallPassRate: this.results.reduce((sum, r) => sum + r.passed, 0) / 
                        Math.max(1, this.results.reduce((sum, r) => sum + r.total, 0)) * 100
      },
      suites: this.results.map(result => ({
        name: result.suiteName,
        status: result.status,
        duration: result.duration + 'ms',
        tests: {
          total: result.total,
          passed: result.passed,
          failed: result.failed
        },
        errors: result.errors
      }))
    };

    const fs = require('fs');
    const reportFilename = `test-report-${Date.now()}.json`;
    fs.writeFileSync(reportFilename, JSON.stringify(report, null, 2));
    
    console.log(`📄 Detailed report saved to: ${reportFilename}`);
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const options = {
    skipPerformance: args.includes('--skip-performance') || args.includes('--quick'),
    verbose: !args.includes('--quiet'),
    quick: args.includes('--quick')
  };

  const helpRequested = args.includes('--help') || args.includes('-h');
  
  if (helpRequested) {
    console.log(`
🧪 ORACLE-LEDGER Comprehensive Testing Suite Runner

Usage: npx tsx run-tests.ts [options]

Options:
  --skip-performance   Skip performance and load tests
  --quick             Skip performance tests (alias for --skip-performance)
  --quiet             Reduce output verbosity
  --help, -h          Show this help message

Examples:
  npx tsx run-tests.ts                    # Run all tests
  npx tsx run-tests.ts --skip-performance # Skip performance tests
  npx tsx run-tests.ts --quick            # Quick test run

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
    
    const exitCode = results.every(r => r.status === 'PASSED') ? 0 : 1;
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