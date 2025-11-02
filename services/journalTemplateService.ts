/**
 * Journal Entry Templates and Mappings Service
 * 
 * This service provides:
 * - ACH payment entry templates
 * - Stripe fee allocation rules
 * - Payroll entry templates
 * - Return and correction entry templates
 * - Customer payment application rules
 */

export interface JournalEntryTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  accountMappings: TemplateAccountMapping[];
  validationRules: TemplateValidationRules;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateAccountMapping {
  accountId: number;
  accountName: string;
  accountType: string;
  entryType: 'DEBIT' | 'CREDIT';
  amountType: 'fixed' | 'variable' | 'percentage';
  defaultAmount?: number;
  description: string;
  isRequired: boolean;
}

export interface TemplateValidationRules {
  requiredFields: string[];
  amountValidation?: {
    min?: number;
    max?: number;
    precision?: number;
  };
  businessRules?: BusinessRule[];
  conditionalLogic?: ConditionalRule[];
}

export interface BusinessRule {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'not_in';
  value: any;
  errorMessage: string;
}

export interface ConditionalRule {
  condition: {
    field: string;
    operator: string;
    value: any;
  };
  action: 'add_line' | 'remove_line' | 'modify_line' | 'require_field' | 'validate_amount';
  target?: string;
  value?: any;
}

export interface StripeAccountMapping {
  stripeAccountType: string;
  stripeAccountName: string;
  accountId: number;
  accountName: string;
  description: string;
  isActive: boolean;
}

export interface JournalEntryRule {
  id: string;
  name: string;
  templateId: string;
  triggerCondition: TriggerCondition;
  processingSteps: ProcessingStep[];
  errorHandling: ErrorHandlingRule;
}

export interface TriggerCondition {
  source: string[];
  transactionType: string[];
  amountRange?: {
    min: number;
    max: number;
  };
  customConditions?: string[];
}

export interface ProcessingStep {
  step: number;
  action: string;
  parameters: Record<string, any>;
  condition?: string;
}

export interface ErrorHandlingRule {
  onError: 'stop' | 'continue' | 'retry' | 'manual_review';
  maxRetries?: number;
  retryDelay?: number;
  fallbackAction?: string;
  notification?: string[];
}

export class JournalTemplateService {
  private templates: Map<string, JournalEntryTemplate> = new Map();
  private rules: Map<string, JournalEntryRule> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
    this.initializeDefaultRules();
  }

  /**
   * Initialize default journal entry templates
   */
  private initializeDefaultTemplates(): void {
    // ACH Payment Template
    this.templates.set('ACH_PAYMENT', {
      id: 'ACH_PAYMENT',
      name: 'ACH Payment Entry',
      category: 'Customer Payments',
      description: 'Standard ACH payment entry for customer payments received via Stripe',
      accountMappings: [
        {
          accountId: 1001,
          accountName: 'Stripe Balance',
          accountType: 'Asset',
          entryType: 'DEBIT',
          amountType: 'variable',
          description: 'Amount received in Stripe account',
          isRequired: true,
        },
        {
          accountId: 1201,
          accountName: 'Customer Payments Receivable',
          accountType: 'Asset',
          entryType: 'CREDIT',
          amountType: 'variable',
          description: 'Customer payment applied',
          isRequired: true,
        },
        {
          accountId: 5101,
          accountName: 'Stripe Fee Expense',
          accountType: 'Expense',
          entryType: 'DEBIT',
          amountType: 'variable',
          description: 'Processing fee charged by Stripe',
          isRequired: false,
        },
      ],
      validationRules: {
        requiredFields: ['amount', 'customerId', 'bankAccountLast4'],
        amountValidation: {
          min: 0.01,
          max: 100000,
          precision: 2,
        },
        businessRules: [
          {
            field: 'status',
            operator: 'in',
            value: ['pending', 'succeeded', 'failed'],
            errorMessage: 'Invalid payment status',
          },
        ],
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Stripe Fee Allocation Template
    this.templates.set('STRIPE_FEES', {
      id: 'STRIPE_FEES',
      name: 'Stripe Fee Allocation',
      category: 'Fee Processing',
      description: 'Allocation of Stripe processing fees to appropriate expense accounts',
      accountMappings: [
        {
          accountId: 1001,
          accountName: 'Stripe Balance',
          accountType: 'Asset',
          entryType: 'DEBIT',
          amountType: 'variable',
          description: 'Net amount after fees',
          isRequired: true,
        },
        {
          accountId: 5101,
          accountName: 'Stripe Fee Expense',
          accountType: 'Expense',
          entryType: 'DEBIT',
          amountType: 'variable',
          description: 'Processing fee expense',
          isRequired: true,
        },
        {
          accountId: 1201,
          accountName: 'Customer Payments Receivable',
          accountType: 'Asset',
          entryType: 'CREDIT',
          amountType: 'variable',
          description: 'Gross payment amount',
          isRequired: true,
        },
      ],
      validationRules: {
        requiredFields: ['amount', 'feeAmount', 'netAmount'],
        amountValidation: {
          min: 0,
          max: 100000,
          precision: 2,
        },
        businessRules: [
          {
            field: 'feeAmount',
            operator: 'less_than',
            value: 'amount',
            errorMessage: 'Fee amount cannot exceed transaction amount',
          },
        ],
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Payroll Template
    this.templates.set('PAYROLL', {
      id: 'PAYROLL',
      name: 'Payroll Entry',
      category: 'Payroll',
      description: 'Direct deposit payroll processing entry',
      accountMappings: [
        {
          accountId: 5201,
          accountName: 'Payroll Expense',
          accountType: 'Expense',
          entryType: 'DEBIT',
          amountType: 'variable',
          description: 'Gross payroll amount',
          isRequired: true,
        },
        {
          accountId: 5202,
          accountName: 'Payroll Tax Expense',
          accountType: 'Expense',
          entryType: 'DEBIT',
          amountType: 'variable',
          description: 'Employer tax expense',
          isRequired: true,
        },
        {
          accountId: 2201,
          accountName: 'Employee Taxes Payable',
          accountType: 'Liability',
          entryType: 'CREDIT',
          amountType: 'variable',
          description: 'Employee withholding taxes',
          isRequired: true,
        },
        {
          accountId: 2202,
          accountName: 'Payroll Taxes Payable',
          accountType: 'Liability',
          entryType: 'CREDIT',
          amountType: 'variable',
          description: 'Employer payroll taxes',
          isRequired: true,
        },
        {
          accountId: 2102,
          accountName: 'Direct Deposit Payable',
          accountType: 'Liability',
          entryType: 'CREDIT',
          amountType: 'variable',
          description: 'Net payroll to be deposited',
          isRequired: true,
        },
      ],
      validationRules: {
        requiredFields: ['employeeId', 'grossAmount', 'netAmount', 'taxAmount'],
        amountValidation: {
          min: 0,
          max: 500000,
          precision: 2,
        },
        businessRules: [
          {
            field: 'netAmount',
            operator: 'less_than',
            value: 'grossAmount',
            errorMessage: 'Net amount cannot exceed gross amount',
          },
          {
            field: 'taxAmount',
            operator: 'greater_than',
            value: 0,
            errorMessage: 'Tax amount must be positive',
          },
        ],
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // ACH Return Template
    this.templates.set('ACH_RETURN', {
      id: 'ACH_RETURN',
      name: 'ACH Return Entry',
      category: 'Returns',
      description: 'Processing ACH payment returns and associated fees',
      accountMappings: [
        {
          accountId: 1201,
          accountName: 'Customer Payments Receivable',
          accountType: 'Asset',
          entryType: 'CREDIT',
          amountType: 'variable',
          description: 'Reverse original payment',
          isRequired: true,
        },
        {
          accountId: 1101,
          accountName: 'ACH Receivable',
          accountType: 'Asset',
          entryType: 'DEBIT',
          amountType: 'variable',
          description: 'Amount to be recovered from customer',
          isRequired: true,
        },
        {
          accountId: 5102,
          accountName: 'Return Fee Expense',
          accountType: 'Expense',
          entryType: 'DEBIT',
          amountType: 'variable',
          description: 'Return processing fee',
          isRequired: true,
        },
        {
          accountId: 2103,
          accountName: 'Return Fees Payable',
          accountType: 'Liability',
          entryType: 'CREDIT',
          amountType: 'variable',
          description: 'Return fee liability',
          isRequired: true,
        },
      ],
      validationRules: {
        requiredFields: ['amount', 'returnCode', 'customerId'],
        amountValidation: {
          min: 0.01,
          max: 100000,
          precision: 2,
        },
        businessRules: [
          {
            field: 'returnCode',
            operator: 'in',
            value: ['R01', 'R02', 'R03', 'R04', 'R05', 'R06', 'R07', 'R08', 'R09', 'R10'],
            errorMessage: 'Invalid ACH return code',
          },
        ],
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Customer Payment Application Template
    this.templates.set('CUSTOMER_PAYMENT', {
      id: 'CUSTOMER_PAYMENT',
      name: 'Customer Payment Application',
      category: 'Accounts Receivable',
      description: 'Application of customer payments to outstanding invoices',
      accountMappings: [
        {
          accountId: 1201,
          accountName: 'Customer Payments Receivable',
          accountType: 'Asset',
          entryType: 'DEBIT',
          amountType: 'variable',
          description: 'Payment received from customer',
          isRequired: true,
        },
        {
          accountId: 1001,
          accountName: 'Stripe Balance',
          accountType: 'Asset',
          entryType: 'CREDIT',
          amountType: 'variable',
          description: 'Amount deposited to Stripe',
          isRequired: true,
        },
        {
          accountId: 2301,
          accountName: 'Customer Credits',
          accountType: 'Liability',
          entryType: 'CREDIT',
          amountType: 'variable',
          description: 'Customer discount/credit applied',
          isRequired: false,
        },
      ],
      validationRules: {
        requiredFields: ['customerId', 'invoiceIds', 'paymentAmount'],
        amountValidation: {
          min: 0.01,
          max: 100000,
          precision: 2,
        },
        businessRules: [
          {
            field: 'invoiceIds',
            operator: 'not_in',
            value: [null, undefined, ''],
            errorMessage: 'At least one invoice must be specified',
          },
        ],
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Initialize default processing rules
   */
  private initializeDefaultRules(): void {
    // ACH Payment Processing Rule
    this.rules.set('ACH_PAYMENT_PROCESSING', {
      id: 'ACH_PAYMENT_PROCESSING',
      name: 'ACH Payment Processing',
      templateId: 'ACH_PAYMENT',
      triggerCondition: {
        source: ['NACHA', 'Stripe'],
        transactionType: ['ach_credit_transfer', 'ach_debit'],
        amountRange: {
          min: 0.01,
          max: 100000,
        },
      },
      processingSteps: [
        {
          step: 1,
          action: 'validate_data',
          parameters: {
            requiredFields: ['amount', 'customerId', 'bankAccountLast4'],
          },
        },
        {
          step: 2,
          action: 'calculate_fees',
          parameters: {
            feeType: 'ach',
            feePercentage: 0.008,
            fixedFee: 0.30,
          },
        },
        {
          step: 3,
          action: 'create_journal_entry',
          parameters: {
            template: 'ACH_PAYMENT',
            autoPost: true,
          },
        },
      ],
      errorHandling: {
        onError: 'manual_review',
        maxRetries: 3,
        retryDelay: 5000,
        fallbackAction: 'create_exception',
        notification: ['admin', 'accounting'],
      },
    });

    // Stripe Fee Allocation Rule
    this.rules.set('STRIPE_FEE_ALLOCATION', {
      id: 'STRIPE_FEE_ALLOCATION',
      name: 'Stripe Fee Allocation',
      templateId: 'STRIPE_FEES',
      triggerCondition: {
        source: ['Stripe'],
        transactionType: ['charge', 'refund'],
      },
      processingSteps: [
        {
          step: 1,
          action: 'extract_fee_data',
          parameters: {
            feeField: 'fee',
            netField: 'net',
          },
        },
        {
          step: 2,
          action: 'create_journal_entry',
          parameters: {
            template: 'STRIPE_FEES',
            autoPost: true,
          },
        },
      ],
      errorHandling: {
        onError: 'retry',
        maxRetries: 2,
        retryDelay: 3000,
        fallbackAction: 'log_error',
        notification: ['accounting'],
      },
    });

    // Payroll Processing Rule
    this.rules.set('PAYROLL_PROCESSING', {
      id: 'PAYROLL_PROCESSING',
      name: 'Payroll Processing',
      templateId: 'PAYROLL',
      triggerCondition: {
        source: ['Payroll', 'HR'],
        transactionType: ['direct_deposit'],
      },
      processingSteps: [
        {
          step: 1,
          action: 'validate_employee_data',
          parameters: {
            requiredFields: ['employeeId', 'bankRoutingNumber', 'bankAccountLast4'],
          },
        },
        {
          step: 2,
          action: 'calculate_taxes',
          parameters: {
            taxCalculationMethod: 'employee_specific',
          },
        },
        {
          step: 3,
          action: 'create_journal_entry',
          parameters: {
            template: 'PAYROLL',
            autoPost: true,
          },
        },
      ],
      errorHandling: {
        onError: 'manual_review',
        maxRetries: 0,
        fallbackAction: 'create_payroll_exception',
        notification: ['hr', 'payroll', 'accounting'],
      },
    });
  }

  /**
   * Get all journal entry templates
   */
  getAllTemplates(): JournalEntryTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId: string): JournalEntryTemplate | null {
    return this.templates.get(templateId) || null;
  }

  /**
   * Create new template
   */
  createTemplate(template: Omit<JournalEntryTemplate, 'id' | 'createdAt' | 'updatedAt'>): JournalEntryTemplate {
    const newTemplate: JournalEntryTemplate = {
      ...template,
      id: `TPL-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.templates.set(newTemplate.id, newTemplate);
    return newTemplate;
  }

  /**
   * Update existing template
   */
  updateTemplate(templateId: string, updates: Partial<JournalEntryTemplate>): JournalEntryTemplate | null {
    const existing = this.templates.get(templateId);
    if (!existing) {
      return null;
    }

    const updated: JournalEntryTemplate = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.templates.set(templateId, updated);
    return updated;
  }

  /**
   * Delete template
   */
  deleteTemplate(templateId: string): boolean {
    return this.templates.delete(templateId);
  }

  /**
   * Get all processing rules
   */
  getAllRules(): JournalEntryRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get rule by ID
   */
  getRule(ruleId: string): JournalEntryRule | null {
    return this.rules.get(ruleId) || null;
  }

  /**
   * Create new processing rule
   */
  createRule(rule: Omit<JournalEntryRule, 'id'>): JournalEntryRule {
    const newRule: JournalEntryRule = {
      ...rule,
      id: `RULE-${Date.now()}`,
    };

    this.rules.set(newRule.id, newRule);
    return newRule;
  }

  /**
   * Update existing rule
   */
  updateRule(ruleId: string, updates: Partial<JournalEntryRule>): JournalEntryRule | null {
    const existing = this.rules.get(ruleId);
    if (!existing) {
      return null;
    }

    const updated: JournalEntryRule = {
      ...existing,
      ...updates,
    };

    this.rules.set(ruleId, updated);
    return updated;
  }

  /**
   * Delete rule
   */
  deleteRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  /**
   * Find applicable templates based on transaction data
   */
  findApplicableTemplates(transactionData: any): JournalEntryTemplate[] {
    const applicable: JournalEntryTemplate[] = [];

    for (const template of this.templates.values()) {
      if (!template.isActive) continue;

      // Check if transaction meets template requirements
      if (this.validateTemplateForTransaction(template, transactionData)) {
        applicable.push(template);
      }
    }

    return applicable;
  }

  /**
   * Validate if template is applicable to transaction data
   */
  private validateTemplateForTransaction(template: JournalEntryTemplate, transactionData: any): boolean {
    const rules = template.validationRules;

    // Check required fields
    for (const field of rules.requiredFields) {
      if (!(field in transactionData) || transactionData[field] === null || transactionData[field] === undefined) {
        return false;
      }
    }

    // Check business rules
    if (rules.businessRules) {
      for (const rule of rules.businessRules) {
        if (!this.evaluateBusinessRule(transactionData[rule.field], rule.operator, rule.value)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Evaluate business rule
   */
  private evaluateBusinessRule(fieldValue: any, operator: string, ruleValue: any): boolean {
    switch (operator) {
      case 'equals':
        return fieldValue === ruleValue;
      case 'not_equals':
        return fieldValue !== ruleValue;
      case 'greater_than':
        return fieldValue > ruleValue;
      case 'less_than':
        return fieldValue < ruleValue;
      case 'contains':
        return String(fieldValue).includes(String(ruleValue));
      case 'in':
        return Array.isArray(ruleValue) && ruleValue.includes(fieldValue);
      case 'not_in':
        return Array.isArray(ruleValue) && !ruleValue.includes(fieldValue);
      default:
        return false;
    }
  }

  /**
   * Get default Stripe account mappings
   */
  getDefaultStripeAccountMappings(): StripeAccountMapping[] {
    return [
      {
        stripeAccountType: 'balance',
        stripeAccountName: 'Stripe Balance',
        accountId: 1001,
        accountName: 'Stripe Balance',
        description: 'Main Stripe account balance',
        isActive: true,
      },
      {
        stripeAccountType: 'customer_payments',
        stripeAccountName: 'Customer Payments',
        accountId: 1201,
        accountName: 'Customer Payments Receivable',
        description: 'Customer payment tracking',
        isActive: true,
      },
      {
        stripeAccountType: 'fee_expense',
        stripeAccountName: 'Stripe Fee Expense',
        accountId: 5101,
        accountName: 'Stripe Fee Expense',
        description: 'Stripe processing fees',
        isActive: true,
      },
      {
        stripeAccountType: 'ach_settlement',
        stripeAccountName: 'ACH Settlement',
        accountId: 1202,
        accountName: 'ACH Settlement Account',
        description: 'ACH transaction settlement',
        isActive: true,
      },
      {
        stripeAccountType: 'return_fees',
        stripeAccountName: 'Return Fees',
        accountId: 5102,
        accountName: 'Return Fee Expense',
        description: 'ACH return processing fees',
        isActive: true,
      },
    ];
  }

  /**
   * Generate template preview for transaction data
   */
  generateTemplatePreview(templateId: string, transactionData: any): {
    template: JournalEntryTemplate;
    previewLines: Array<{
      accountId: number;
      accountName: string;
      entryType: 'DEBIT' | 'CREDIT';
      amount: number;
      description: string;
    }>;
    validationResults: {
      isValid: boolean;
      errors: string[];
      warnings: string[];
    };
  } | null {
    const template = this.templates.get(templateId);
    if (!template) {
      return null;
    }

    const previewLines = this.generatePreviewLines(template, transactionData);
    const validationResults = this.validateTransactionData(template, transactionData);

    return {
      template,
      previewLines,
      validationResults,
    };
  }

  /**
   * Generate preview lines for template
   */
  private generatePreviewLines(template: JournalEntryTemplate, transactionData: any): Array<{
    accountId: number;
    accountName: string;
    entryType: 'DEBIT' | 'CREDIT';
    amount: number;
    description: string;
  }> {
    return template.accountMappings.map(mapping => ({
      accountId: mapping.accountId,
      accountName: mapping.accountName,
      entryType: mapping.entryType,
      amount: this.calculateAmount(mapping, transactionData),
      description: this.substituteVariables(mapping.description, transactionData),
    }));
  }

  /**
   * Calculate amount based on mapping rules
   */
  private calculateAmount(mapping: TemplateAccountMapping, transactionData: any): number {
    switch (mapping.amountType) {
      case 'fixed':
        return mapping.defaultAmount || 0;
      case 'variable':
        // Find matching field in transaction data
        const fieldMap: Record<string, string> = {
          'Customer Payments Receivable': 'amount',
          'Stripe Balance': 'netAmount',
          'Stripe Fee Expense': 'feeAmount',
          'ACH Receivable': 'amount',
          'Customer Credits': 'discountAmount',
          'Payroll Expense': 'grossAmount',
          'Payroll Tax Expense': 'taxAmount',
          'Employee Taxes Payable': 'employeeTaxAmount',
          'Payroll Taxes Payable': 'employerTaxAmount',
          'Direct Deposit Payable': 'netAmount',
          'Return Fee Expense': 'returnFeeAmount',
          'Return Fees Payable': 'returnFeeAmount',
        };

        const fieldName = fieldMap[mapping.accountName];
        if (fieldName && transactionData[fieldName]) {
          return parseFloat(transactionData[fieldName]) || 0;
        }
        return 0;
      case 'percentage':
        // Calculate percentage of base amount
        const percentage = mapping.defaultAmount || 0;
        const baseAmount = transactionData.amount || 0;
        return (baseAmount * percentage) / 100;
      default:
        return 0;
    }
  }

  /**
   * Substitute variables in description
   */
  private substituteVariables(description: string, transactionData: any): string {
    let processed = description;
    
    // Replace common variables
    const variables: Record<string, string> = {
      '{amount}': transactionData.amount ? `$${transactionData.amount.toFixed(2)}` : 'N/A',
      '{customerId}': transactionData.customerId || 'N/A',
      '{bankAccountLast4}': transactionData.bankAccountLast4 || 'N/A',
      '{employeeId}': transactionData.employeeId || 'N/A',
      '{employeeName}': transactionData.employeeName || 'N/A',
      '{payPeriod}': transactionData.payPeriod || 'N/A',
      '{returnCode}': transactionData.returnCode || 'N/A',
      '{date}': new Date().toISOString().split('T')[0],
    };

    for (const [variable, value] of Object.entries(variables)) {
      processed = processed.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), value);
    }

    return processed;
  }

  /**
   * Validate transaction data against template
   */
  private validateTransactionData(template: JournalEntryTemplate, transactionData: any): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const rules = template.validationRules;

    // Check required fields
    for (const field of rules.requiredFields) {
      if (!(field in transactionData) || transactionData[field] === null || transactionData[field] === undefined) {
        errors.push(`Required field missing: ${field}`);
      }
    }

    // Check amount validation
    if (rules.amountValidation) {
      const amount = transactionData.amount;
      if (amount !== undefined && amount !== null) {
        if (rules.amountValidation.min && amount < rules.amountValidation.min) {
          errors.push(`Amount ${amount} is below minimum ${rules.amountValidation.min}`);
        }
        if (rules.amountValidation.max && amount > rules.amountValidation.max) {
          errors.push(`Amount ${amount} exceeds maximum ${rules.amountValidation.max}`);
        }
      }
    }

    // Check business rules
    if (rules.businessRules) {
      for (const rule of rules.businessRules) {
        const fieldValue = transactionData[rule.field];
        if (!this.evaluateBusinessRule(fieldValue, rule.operator, rule.value)) {
          errors.push(rule.errorMessage);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Export templates to JSON
   */
  exportTemplates(): string {
    const exportData = {
      templates: this.getAllTemplates(),
      rules: this.getAllRules(),
      accountMappings: this.getDefaultStripeAccountMappings(),
      exportedAt: new Date().toISOString(),
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import templates from JSON
   */
  importTemplates(jsonData: string): { success: boolean; imported: number; errors: string[] } {
    try {
      const data = JSON.parse(jsonData);
      let imported = 0;
      const errors: string[] = [];

      if (data.templates && Array.isArray(data.templates)) {
        for (const template of data.templates) {
          try {
            this.templates.set(template.id, template);
            imported++;
          } catch (error) {
            errors.push(`Failed to import template ${template.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      if (data.rules && Array.isArray(data.rules)) {
        for (const rule of data.rules) {
          try {
            this.rules.set(rule.id, rule);
            imported++;
          } catch (error) {
            errors.push(`Failed to import rule ${rule.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      return {
        success: errors.length === 0,
        imported,
        errors,
      };
    } catch (error) {
      return {
        success: false,
        imported: 0,
        errors: [`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }
}

export const journalTemplateService = new JournalTemplateService();