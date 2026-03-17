# Oracle Ledger (Project ORACLE-LEDGER)

> **Status:** Maintenance / Migration Source | **Environment:** Docker Microservices
> **Gateway:** Port 3002 | **Ledger Core:** Port 3001 | **Database:** PostgreSQL (5432)

---

## 🏛️ Project Overview

**Oracle Ledger** is the legacy financial backbone of the SOVR ecosystem, now containerized into a microservices architecture. It handles core ledger operations, compliance auditing, and blockchain integration (Base Mainnet).

### 🧩 Microservices Architecture

| Service             | Container Name    | Host Port | Internal Port | Description                                                          |
| :------------------ | :---------------- | :-------- | :------------ | :------------------------------------------------------------------- |
| **Gateway**         | `gateway`         | `3002`    | `3002`        | API Gateway routing requests to downstream services.                 |
| **Ledger Core**     | `ledger-core`     | `3001`    | `3001`        | **Legacy Monolith.** Handles Auth, User mgmt, and Core Ledger logic. |
| **Risk Service**    | `risk-service`    | `3003`    | `3003`        | PCI Audit logging, fraud detection, and compliance checklists.       |
| **Chain Service**   | `chain-service`   | `3004`    | `3004`        | **Base Mainnet** integration. Handles RPC proxy and Consul Credits.  |
| **Payment Service** | `payment-service` | `3005`    | `3005`        | Stripe integration (ACH, Cards) and payment reconciliation.          |
| **Database**        | `db`              | `5432`    | `5432`        | PostgreSQL 16. Persistent storage for all services.                  |

---

## 🚀 Getting Started

### Prerequisites

- **Docker Desktop** (with Docker Compose v2)
- **Node.js 20+** (for local tooling only)
- **Stripe Keys:** Ensure `.env` contains valid Live/Test keys.

### 🛠️ Installation & Run

1.  **Clone/Navigate:**

    ```bash
    cd "Projects/ORACLE-LEDGER-main (1)/ORACLE-LEDGER-main"
    ```

2.  **Start Services:**

    ```bash
    docker compose up --build -d
    ```

    _This builds all 5 services and initializes the database schema automatically._

3.  **Verify Status:**

    ```bash
    docker compose ps
    ```

    _All services should be `Up (healthy)`._

4.  **Access the Dashboard:**
    - Open your browser to **[http://localhost:5000](http://localhost:5000)** (served via Vite proxy or Gateway).

---

## 🎮 System Console & Diagnostics

The application includes a built-in **System Console** for real-time diagnostics and control.

- **Toggle:** Press `Ctrl + \`` (Control + Backtick) or click the console icon in the top-right header.
- **Features:**
  - **Live Logs:** View real-time logs from the frontend and backend.
  - **Mock Mode:** Toggle "Virtualization" to switch between Live Backend data and local Mock data.
  - **Network Status:** Monitor RPC connection health (Base Mainnet).

> **Note on RPC Rate Limiting:** The `chain-service` connects to the public Base Mainnet RPC. You may see `429 Too Many Requests` errors in the console. This is expected on the public endpoint. Use **Mock Mode** for UI testing if this occurs.

---

## 🤖 AI Agent Integration

This workspace is governed by specific AI protocols defined in `GEMINI.md`.

- **Network & Security Guardian:** Oversees network diagnostics, security protocols, and connectivity debugging.
- **FINTECH Architect:** Manages financial system design, smart contract architecture, and payment rail integration.

---

## 📂 Project Structure

```
ORACLE-LEDGER-main/
├── docker-compose.yml    # Service orchestration
├── database-schema.sql   # PostgreSQL schema (auto-applied)
├── server/               # Ledger Core (Legacy Monolith) source
├── microservices/        # New microservices (Gateway, Risk, Chain, Payment)
├── src/                  # React Frontend
├── docs/                 # Documentation & Archives
└── README.md             # This file
```

---

## ⚠️ Troubleshooting

- **500 Internal Server Error (Logging):** Fixed by adding `system_logs` table. If verified, run `docker compose down -v` and restart to reset DB.
- **Port Conflicts:** Ensure local `node` processes or `postgres` services are NOT running on ports 3001-3005 or 5432 before starting Docker.
