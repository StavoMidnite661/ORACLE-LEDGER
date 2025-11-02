-- SOVRCVLT ORACLE-LEDGER Database Schema
-- PostgreSQL 16+ Compatible
-- Double-Entry General Ledger System

-- Create ENUMS
CREATE TYPE entity AS ENUM ('LLC', 'Trust');
CREATE TYPE account_type AS ENUM ('Asset', 'Liability', 'Equity', 'Income', 'Expense');
CREATE TYPE line_type AS ENUM ('DEBIT', 'CREDIT');
CREATE TYPE payment_method AS ENUM ('ACH', 'Wire', 'Crypto');
CREATE TYPE card_type AS ENUM ('Virtual', 'Physical', 'Fleet', 'Gas');
CREATE TYPE card_provider AS ENUM ('Visa', 'Mastercard', 'Amex', 'Discover');
CREATE TYPE spend_category AS ENUM ('Fuel', 'Office', 'Travel', 'Software', 'Hardware', 'Other');
CREATE TYPE vendor_category AS ENUM ('Software', 'Hardware', 'Services', 'Supplies', 'Professional', 'Other');
CREATE TYPE status AS ENUM ('Active', 'Inactive', 'Pending', 'Posted', 'Draft', 'Approved', 'Fulfilled', 'Paid', 'Issued', 'Overdue');

-- Chart of Accounts
CREATE TABLE accounts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type account_type NOT NULL,
  entity entity NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Journal Entries (Double-Entry Bookkeeping)
CREATE TABLE journal_entries (
  id VARCHAR(50) PRIMARY KEY,
  date VARCHAR(10) NOT NULL,
  description TEXT NOT NULL,
  source VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Posted',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE journal_lines (
  id SERIAL PRIMARY KEY,
  journal_entry_id VARCHAR(50) NOT NULL,
  account_id INTEGER NOT NULL,
  type line_type NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id),
  FOREIGN KEY (account_id) REFERENCES accounts(id)
);

-- Employee Management
CREATE TABLE employees (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  annual_salary NUMERIC(15, 2) NOT NULL,
  bank_routing_number VARCHAR(9),
  bank_account_number VARCHAR(20),
  payment_method payment_method DEFAULT 'ACH',
  tax_id VARCHAR(11),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Vendor Management
CREATE TABLE vendors (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  payment_terms VARCHAR(100) NOT NULL,
  bank_account_number VARCHAR(20),
  bank_routing_number VARCHAR(9),
  tax_id VARCHAR(20) NOT NULL,
  status status NOT NULL DEFAULT 'Active',
  category vendor_category NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Company Card Management
CREATE TABLE company_cards (
  id VARCHAR(50) PRIMARY KEY,
  last4 VARCHAR(4) NOT NULL,
  provider_token_id VARCHAR(255),
  card_type card_type NOT NULL,
  card_provider card_provider NOT NULL,
  assigned_to VARCHAR(255),
  spending_limit_daily NUMERIC(15, 2),
  spending_limit_monthly NUMERIC(15, 2),
  spending_limit_transaction NUMERIC(15, 2),
  status VARCHAR(20) NOT NULL DEFAULT 'Active',
  issue_date VARCHAR(10) NOT NULL,
  expiry_date VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Card Transactions
CREATE TABLE card_transactions (
  id VARCHAR(50) PRIMARY KEY,
  card_id VARCHAR(50) NOT NULL,
  merchant_name VARCHAR(255) NOT NULL,
  merchant_category spend_category NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  transaction_date VARCHAR(10) NOT NULL,
  posting_date VARCHAR(10) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(20) NOT NULL,
  location VARCHAR(255),
  accounting_code VARCHAR(20),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (card_id) REFERENCES company_cards(id)
);

-- Purchase Orders
CREATE TABLE purchase_orders (
  id VARCHAR(50) PRIMARY KEY,
  vendor VARCHAR(255) NOT NULL,
  date VARCHAR(10) NOT NULL,
  total_amount NUMERIC(15, 2) NOT NULL,
  status status NOT NULL DEFAULT 'Draft',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE purchase_order_items (
  id SERIAL PRIMARY KEY,
  purchase_order_id VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id)
);

-- Invoices (AR/AP)
CREATE TABLE invoices (
  id VARCHAR(50) PRIMARY KEY,
  type VARCHAR(2) NOT NULL, -- 'AR' or 'AP'
  counterparty VARCHAR(255) NOT NULL,
  issue_date VARCHAR(10) NOT NULL,
  due_date VARCHAR(10) NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  status status NOT NULL DEFAULT 'Issued',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Consul Credits (Blockchain Integration)
CREATE TABLE consul_credits_transactions (
  id VARCHAR(50) PRIMARY KEY,
  tx_hash VARCHAR(66) NOT NULL,
  block_number INTEGER NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  event_type VARCHAR(20) NOT NULL,
  user_address VARCHAR(42) NOT NULL,
  token_address VARCHAR(42) NOT NULL,
  token_symbol VARCHAR(10) NOT NULL,
  token_amount VARCHAR(50) NOT NULL,
  consul_credits_amount VARCHAR(50) NOT NULL,
  exchange_rate VARCHAR(50) NOT NULL,
  ledger_reference VARCHAR(50),
  journal_entry_id VARCHAR(50),
  confirmations INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id)
);

-- Card Reveal Audit Trail
CREATE TABLE card_reveal_audit (
  id SERIAL PRIMARY KEY,
  card_id VARCHAR(50) NOT NULL,
  revealed_by VARCHAR(255) NOT NULL,
  reason TEXT NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (card_id) REFERENCES company_cards(id)
);

-- Consul Credits Configuration
CREATE TABLE consul_credits_config (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
  contract_address VARCHAR(42) NOT NULL,
  network_name VARCHAR(100) NOT NULL,
  chain_id INTEGER NOT NULL,
  rpc_url TEXT NOT NULL,
  oracle_integrator_address VARCHAR(42) NOT NULL,
  confirmations_required INTEGER NOT NULL DEFAULT 3,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ==============================
-- STRIPE PAYMENT PROCESSING ACCOUNTS
-- ==============================

-- Insert Stripe-related asset accounts
INSERT INTO accounts (id, name, type, entity, created_at) VALUES
(1050, 'ACH-Settlement-Account', 'Asset', 'LLC', NOW()),
(1060, 'Stripe-Clearing-Account', 'Asset', 'LLC', NOW())
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  entity = EXCLUDED.entity;

-- Insert Stripe-related liability accounts
INSERT INTO accounts (id, name, type, entity, created_at) VALUES
(2180, 'Direct-Deposit-Liabilities', 'Liability', 'LLC', NOW())
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  entity = EXCLUDED.entity;

-- Insert Stripe-related expense accounts
INSERT INTO accounts (id, name, type, entity, created_at) VALUES
(6150, 'ACH-Processing-Fees', 'Expense', 'LLC', NOW()),
(6160, 'Stripe-Processing-Fees', 'Expense', 'LLC', NOW()),
(6170, 'Bank-Charges-Expense', 'Expense', 'LLC', NOW()),
(6180, 'Payment-Card-Fees', 'Expense', 'LLC', NOW())
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  entity = EXCLUDED.entity;

-- Stripe account mappings table
CREATE TABLE IF NOT EXISTS stripe_account_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_account_type VARCHAR(100) NOT NULL UNIQUE,
    account_id INTEGER NOT NULL,
    description TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (account_id) REFERENCES accounts(id)
);

-- Insert Stripe account type mappings
INSERT INTO stripe_account_mappings (stripe_account_type, account_id, description) VALUES
('ACH_SETTLEMENT_ACCOUNT', 1050, 'Asset account for incoming ACH payments from customers'),
('STRIPE_CLEARING_ACCOUNT', 1060, 'Asset account for Stripe balance and pending payouts'),
('ACH_PROCESSING_FEES', 6150, 'Expense account for ACH transaction processing fees'),
('STRIPE_PROCESSING_FEES', 6160, 'Expense account for Stripe payment processing fees'),
('DIRECT_DEPOSIT_LIABILITIES', 2180, 'Liability account for employee direct deposit payables'),
('BANK_CHARGES_EXPENSE', 6170, 'Expense account for general banking fees and charges'),
('PAYMENT_CARD_FEES', 6180, 'Expense account for credit/debit card processing fees')
ON CONFLICT (stripe_account_type) DO UPDATE SET 
  account_id = EXCLUDED.account_id,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Stripe payment reconciliation table
CREATE TABLE IF NOT EXISTS stripe_payment_reconciliation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_balance_transaction_id VARCHAR(255) UNIQUE,
    amount_cents BIGINT NOT NULL,
    fee_cents BIGINT DEFAULT 0,
    net_cents BIGINT NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    transaction_type VARCHAR(50) NOT NULL,
    stripe_created TIMESTAMP WITH TIME ZONE,
    available_on TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    account_id INTEGER NOT NULL,
    journal_entry_id VARCHAR(50),
    reconciled_at TIMESTAMP WITH TIME ZONE,
    reconciled_by VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id)
);

-- ACH processing log table
CREATE TABLE IF NOT EXISTS ach_processing_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ach_payment_id UUID,
    stripe_charge_id VARCHAR(255),
    processing_fee_cents BIGINT NOT NULL,
    processing_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    account_id INTEGER NOT NULL,
    journal_entry_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id)
);

-- ==============================
-- INDEXES FOR PERFORMANCE
-- ==============================

-- Original indexes
CREATE INDEX idx_journal_lines_entry ON journal_lines(journal_entry_id);
CREATE INDEX idx_journal_lines_account ON journal_lines(account_id);
CREATE INDEX idx_card_transactions_card ON card_transactions(card_id);
CREATE INDEX idx_card_transactions_date ON card_transactions(transaction_date);
CREATE INDEX idx_po_items_po ON purchase_order_items(purchase_order_id);
CREATE INDEX idx_consul_tx_hash ON consul_credits_transactions(tx_hash);
CREATE INDEX idx_consul_status ON consul_credits_transactions(status);
CREATE INDEX idx_card_reveal_card ON card_reveal_audit(card_id);

-- Stripe indexes
CREATE INDEX idx_stripe_account_mappings_type ON stripe_account_mappings(stripe_account_type);
CREATE INDEX idx_stripe_account_mappings_account ON stripe_account_mappings(account_id);
CREATE INDEX idx_stripe_reconciliation_stripe_id ON stripe_payment_reconciliation(stripe_balance_transaction_id);
CREATE INDEX idx_stripe_reconciliation_account ON stripe_payment_reconciliation(account_id);
CREATE INDEX idx_stripe_reconciliation_status ON stripe_payment_reconciliation(status);
CREATE INDEX idx_ach_processing_account ON ach_processing_log(account_id);
CREATE INDEX idx_ach_processing_date ON ach_processing_log(processing_date);

-- ==============================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ==============================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_stripe_account_mappings_updated_at 
    BEFORE UPDATE ON stripe_account_mappings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stripe_payment_reconciliation_updated_at 
    BEFORE UPDATE ON stripe_payment_reconciliation
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
