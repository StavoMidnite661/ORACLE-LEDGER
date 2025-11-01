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

-- Indexes for Performance
CREATE INDEX idx_journal_lines_entry ON journal_lines(journal_entry_id);
CREATE INDEX idx_journal_lines_account ON journal_lines(account_id);
CREATE INDEX idx_card_transactions_card ON card_transactions(card_id);
CREATE INDEX idx_card_transactions_date ON card_transactions(transaction_date);
CREATE INDEX idx_po_items_po ON purchase_order_items(purchase_order_id);
CREATE INDEX idx_consul_tx_hash ON consul_credits_transactions(tx_hash);
CREATE INDEX idx_consul_status ON consul_credits_transactions(status);
CREATE INDEX idx_card_reveal_card ON card_reveal_audit(card_id);
