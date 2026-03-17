# 🏦 Oracle Ledger - Microservices Architecture

> Blockchain-integrated ledger system migrated to a distributed microservices architecture for enhanced scalability and resilience.

## 📍 Project Location
- **Root Path:** `D:\SOVR_Development_Holdings_LLC\SOVR_Ledger\Projects\ORACLE-LEDGER-main (1)\ORACLE-LEDGER-main`
- **Frontend Entry:** `index.tsx` (React + Vite)
- **Legacy Monolith:** `server/api.ts` (Now handles Auth & Core Ledger)

## 🏗️ Microservices Ecosystem
| Service | Directory | Port | Description |
|---------|-----------|------|-------------|
| **Legacy Monolith** | `server/` | 3001 | Auth, User Management, Core Ledger functionality. |
| **API Gateway** | `microservices/gateway/` | 3002 | Entry point for external requests, routing to internal services. |
| **Risk & Compliance** | `microservices/risk-compliance/` | 3003 | Transaction verification, KYC checks, AML logic. |
| **Blockchain Bridge** | `microservices/blockchain-bridge/` | 3004 | Polygon/Base mainnet interaction, event listening. |
| **Payment Gateway** | `microservices/payment-gateway/` | 3005 | Payout logic, external payment processor integrations. |
| **Bank Connector** | `microservices/bank-connector/` | 3007 | Integration with traditional banking rails (MICR/ACH). |

## 🛠️ Infrastructure & Stack
- **Languages:** TypeScript (Strict), Solidity (Smart Contracts).
- **Frontend:** React (v19), Vite, Tailwind CSS (v4).
- **Backend:** Node.js, Express (v5).
- **Database:** PostgreSQL (Neon) via **Drizzle ORM**.
- **Blockchain:** Hardhat, Ethers.js, Web3.js.

## ⚡ Key Commands
- `npm run dev:all`: Starts Frontend + Backend + Gateway + Risk + Blockchain + Payment + Bank.
- `npm run dev:full`: Starts only Frontend and Backend (Monolith).
- `npm run compile-contracts`: Compiles Hardhat contracts.

## 📝 Recent Migration Notes
- Monolith (`server/api.ts`) has been slimmed down to focus on Core Ledger.
- Logic from `api.ts` has been migrated to `microservices/`.
- Backend logs are stored in the project root: `bank.log`, `blockchain.log`, `gateway.log`, etc.

---
**Status:** ⏸️ **Services Stopped** | **Ready for Activation**
