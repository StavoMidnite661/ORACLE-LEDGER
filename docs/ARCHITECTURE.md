# Oracle Ledger Architecture

> **Status:** Active | **Type:** Microservices (Docker)

## 🏗️ High-Level Overview

The Oracle Ledger has been migrated from a monolithic Node.js application to a containerized microservices architecture. This ensures isolation, scalability, and easier maintenance of distinct business logic domains.

```mermaid
graph TD
    User[User / Frontier UI] -->|HTTP/WebSocket| Gateway[Gateway (3002)]

    subgraph Docker Network [oracle-net]
        Gateway -->|/api/auth, /api/ledger| Core[Ledger Core (3001)]
        Gateway -->|/api/risk| Risk[Risk Service (3003)]
        Gateway -->|/api/chain| Chain[Chain Service (3004)]
        Gateway -->|/api/payment| Payment[Payment Service (3005)]

        Core --> DB[(PostgreSQL 5432)]
        Risk --> DB
        Chain --> DB
        Payment --> DB
    end

    Chain -->|JSON-RPC| Base[Base Mainnet]
    Payment -->|Messaging/API| Stripe[Stripe]
```

## 🧩 Microservices

### 1. Gateway (`gateway`)

- **Port:** 3002
- **Role:** Central entry point. Routes traffic based on URL path prefixes.
- **Tech:** Express.js, `http-proxy-middleware`.

### 2. Ledger Core (`ledger-core`)

- **Port:** 3001
- **Role:** The "Legacy Monolith" container.
- **Responsibilities:**
  - User Authentication (Passport.js).
  - Core Ledger Logic (Journal Entries, Accounts).
  - Employee & Vendor Management.

### 3. Risk Service (`risk-service`)

- **Port:** 3003
- **Role:** Compliance & Security.
- **Responsibilities:**
  - PCI Audit Logging.
  - Fraud Detection Logic.
  - Compliance Checklists.

### 4. Chain Service (`chain-service`)

- **Port:** 3004
- **Role:** Blockchain Integration.
- **Responsibilities:**
  - **Base Mainnet RPC Proxy:** Routes frontend calls to the blockchain to avoid CORS/Rate-limiting on the client.
  - **Consul Credits:** Tracks `usdSOVR` on-chain data.

### 5. Payment Service (`payment-service`)

- **Port:** 3005
- **Role:** Fiat Messaging & Gateway Verification.
- **Responsibilities:**
  - Stripe API Gateway Messaging.
  - ACH & Card Settlement Recording.
  - Payment Reconciliation.

## 💾 Database Schema

The system uses a shared **PostgreSQL 16** database.

- **ORM:** Drizzle ORM.
- **Schema:** Defined in `shared/schema.ts`.
- **Migration:** Auto-applied via `database-schema.sql` on container startup.
