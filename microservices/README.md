# Microservices Architecture

This directory contains the source code for the ORACLE-LEDGER microservices.

## Services

### 1. Gateway (`gateway/`)
The entry point for all client requests. It handles routing, basic rate limiting, and initial authentication checks before proxying requests to the appropriate service.

### 2. Auth Service (`auth-service/`)
Manages user identities, authentication (JWT), and authorization (RBAC).

### 3. Ledger Core (`ledger-core/`)
The heart of the accounting system. Manages Accounts, Journal Entries, Invoices, and general bookkeeping.

### 4. Payment Gateway (`payment-gateway/`)
Handles all external money movement. Integrates with Stripe for Credit Cards, ACH, and Direct Deposits.

### 5. Risk & Compliance (`risk-compliance/`)
The "Watchdog" service. Handles Fraud Detection, PCI Audit Logging, and Regulatory Compliance (NACHA/SOX) reporting.

### 6. Blockchain Bridge (`blockchain-bridge/`)
Connects the off-chain Ledger to the on-chain Consul Credits smart contract.

## Development

Each service is a self-contained Node.js/Express application.
To start the entire suite, use the `start-microservices.sh` script in the root directory (coming soon).
