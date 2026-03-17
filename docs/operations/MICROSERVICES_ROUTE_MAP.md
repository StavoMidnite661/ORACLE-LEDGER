# Microservices Route Map

This document maps the existing endpoints in `server/api.ts` to their future destination services.

## 1. Auth Service
*Responsible for User Identity, Roles, and Permissions.*
- Middleware: `authenticateRequest`, `requireRole`
- (Future) `POST /api/auth/login`
- (Future) `POST /api/auth/refresh`

## 2. Ledger Core Service
*Responsible for the fundamental accounting entities.*
- `GET /api/employees`
- `POST /api/employees`
- `PUT /api/employees/:id`
- `GET /api/journal-entries`
- `POST /api/journal-entries`
- `GET /api/vendors`
- `POST /api/vendors`
- `GET /api/company-cards`
- `POST /api/company-cards`
- `PUT /api/company-cards/:id`
- `GET /api/card-transactions`
- `POST /api/card-transactions`
- `GET /api/purchase-orders`
- `POST /api/purchase-orders`
- `GET /api/invoices`
- `POST /api/invoices`
- `PUT /api/invoices/:id`

## 3. Blockchain Bridge Service
*Responsible for on-chain interactions and syncing.*
- `GET /api/consul-credits-transactions`
- `POST /api/consul-credits-transactions`
- `GET /api/consul-credits/config`
- `POST /api/consul-credits/config`

## 4. Payment Gateway Service
*Responsible for all Stripe interactions (In/Out).*
- `POST /api/stripe/customers`
- `GET /api/stripe/customers`
- `GET /api/stripe/customers/:id`
- `PUT /api/stripe/customers/:id`
- `DELETE /api/stripe/customers/:id`
- `POST /api/stripe/customers/:id/payment-methods`
- `GET /api/stripe/customers/:id/payment-methods`
- `POST /api/stripe/customers/:id/payment-methods/:methodId/default`
- `POST /api/stripe/ach/setup-intents`
- `POST /api/stripe/ach/payment-intents`
- `GET /api/stripe/ach/payment-intents`
- `GET /api/stripe/ach/payment-intents/:id`
- `POST /api/stripe/ach/payment-intents/:id/confirm`
- `POST /api/stripe/ach/payment-intents/:id/cancel`
- `GET /api/stripe/ach/returns`
- `POST /api/stripe/ach/returns/:id/correct`
- `GET /api/stripe/ach/reconciliation`
- `POST /api/stripe/direct-deposits/recipients`
- `GET /api/stripe/direct-deposits/recipients`
- `GET /api/stripe/direct-deposits/recipients/:id`
- `PUT /api/stripe/direct-deposits/recipients/:id`
- `POST /api/stripe/direct-deposits/recipients/:id/verification`
- `POST /api/stripe/direct-deposits/bank-accounts`
- `GET /api/stripe/direct-deposits/bank-accounts/:recipientId`
- `POST /api/stripe/direct-deposits/payouts`
- `GET /api/stripe/direct-deposits/payouts`
- `GET /api/stripe/direct-deposits/payouts/:id`
- `GET /api/stripe/reconciliation/payments` (Could also be in Ledger, but tightly coupled to Stripe)

## 5. Risk & Compliance Service
*Responsible for Audit Logs, PCI checks, and Regulatory Reporting.*
- `POST /api/stripe/audit/pci-log`
- `GET /api/stripe/audit/pci-logs`
- `POST /api/stripe/compliance/checklist`
- `GET /api/stripe/compliance/checklist`
- `PUT /api/stripe/compliance/checklist/:id`
- `GET /api/stripe/compliance/report`

---

**Next Steps:**
1. Create the `services/` directory structure.
2. Setup the API Gateway in `server/gateway.ts`.
3. Migrate "Risk & Compliance" service first as a pilot.
