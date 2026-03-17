# Stripe Integration Summary

**Microservice:** Payment Service (`payment-service`)
**Port:** 3005
**Wrapper:** `services/cardPaymentService.ts`

## Overview

The Payment Service handles all interactions with the Stripe API, including:

- **ACH Payments:** Direct bank transfers.
- **Card Payments:** Credit/Debit processing.
- **Reconciliation:** Matching Stripe transactions to Ledger Journal Entries.

## Configuration

Ensure `.env` contains:

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## Implemented Components

### 1. StripePaymentsView.tsx

**Main Stripe Payments Dashboard**

- **Location**: `/workspace/ORACLE-LEDGER/views/StripePaymentsView.tsx`
- **Features**:
  - Dashboard layout with tabs for different payment types
  - ACH payments management and processing
  - Direct deposit (payroll) functionality
  - KPI metrics for payment volume and success rates

### 2. StripeSettingsView.tsx

**Stripe Configuration Management**

- **Location**: `/workspace/ORACLE-LEDGER/views/StripeSettingsView.tsx`
- **Features**:
  - API key management (admin only)
  - Webhook endpoint configuration

### 3. StripeComplianceView.tsx

**Compliance Management Interface**

- **Location**: `/workspace/ORACLE-LEDGER/views/StripeComplianceView.tsx`
- **Features**:
  - Compliance checklist management
  - PCI DSS audit log viewer with filtering

### 4. StripeReportsView.tsx

**Comprehensive Reporting System**

- **Location**: `/workspace/ORACLE-LEDGER/views/StripeReportsView.tsx`
- **Features**:
  - Payment reports and analytics
  - Financial reconciliation reports

## Design Principles

### Role-Based Access Control

- **Admin Functions**: API key management restricted to admins
- **Audit Logging**: All sensitive operations logged via `risk-service`.

## Technical Notes

- **Microservice Routing**: processed via Gateway (`/api/payment`).
- **Data Persistence**: Transactions stored in PostgreSQL `payment_intents` table.
