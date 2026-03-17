# API Gateway Documentation

**Service:** Gateway
**Port:** 3002
**Base URL:** `http://localhost:3002`

## 🚦 Routing Logic

The Gateway uses `http-proxy-middleware` to route requests to the appropriate internal microservice based on the path prefix.

| Prefix            | Target Service  | Internal URL                  | Description                           |
| :---------------- | :-------------- | :---------------------------- | :------------------------------------ |
| `/api/auth`       | Ledger Core     | `http://ledger-core:3001`     | Login, Registration, Session checks.  |
| `/api/employees`  | Ledger Core     | `http://ledger-core:3001`     | Employee integration.                 |
| `/api/vendors`    | Ledger Core     | `http://ledger-core:3001`     | Vendor management.                    |
| `/api/journal`    | Ledger Core     | `http://ledger-core:3001`     | Journal entries.                      |
| `/api/risk`       | Risk Service    | `http://risk-service:3003`    | PCI logs, Fraud checks.               |
| `/api/compliance` | Risk Service    | `http://risk-service:3003`    | Compliance dashboards.                |
| `/api/chain`      | Chain Service   | `http://chain-service:3004`   | Blockchain data.                      |
| `/api/rpc`        | Chain Service   | `http://chain-service:3004`   | **Critical:** Base Mainnet RPC Proxy. |
| `/api/payment`    | Payment Service | `http://payment-service:3005` | Stripe wrappers.                      |
| `/api/stripe`     | Payment Service | `http://payment-service:3005` | Direct Stripe webhooks.               |

## 🔒 Authentication

Currently, the Gateway acts primarily as a **Router**. Authentication logic (session validation) is handled by the **Ledger Core**.

- Future State: The Gateway will handle JWT verification before passing requests downstream.

## 🛠️ Health Checks

You can verify the Gateway status:

```bash
curl http://localhost:3002/health
```

**Response:**

```json
{ "status": "OK", "service": "API Gateway" }
```
