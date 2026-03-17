# Operations Guide

**System:** Oracle Ledger Microservices
**Environment:** Docker Compose

## 🚀 Docker Operations

### Start Services (Build & Detach)

```bash
docker compose up --build -d
```

_Use this when source code changes or after a fresh clone._

### View Logs

**All Services:**

```bash
docker compose logs -f
```

**Specific Service:**

```bash
docker compose logs -f ledger-core
docker compose logs -f gateway
```

### Stop Services

```bash
docker compose down
```

_To remove volumes (reset DB):_ `docker compose down -v`

---

## 🎮 System Console

Accessible via the Frontend (Port 5000/3002).

- **Toggle:** `Ctrl + \`` (Backtick)
- **Features:**
  - **Mock Mode:** Virtualizes data to test UI without backend.
  - **Live Mode:** Connects to real containers.

## 🛠️ Database Management

### Schema Updates

The schema is defined in `shared/schema.ts`.

- **Apply Changes:**
  1. Update `shared/schema.ts`.
  2. Run `npm run db:push` (if local) OR restart Docker container (auto-init).

### Manual SQL

Access the running database:

```bash
docker exec -it oracle-ledger-main-db-1 psql -U postgres -d ORACLE-LEDGER
```

## 🔍 Troubleshooting

### 500 Internal Server Error (Logs)

If `ledger-core` crashes on log flush:

1. Ensure `system_logs` table exists.
2. Run: `docker exec -i oracle-ledger-main-db-1 psql -U postgres -d ORACLE-LEDGER -c "SELECT * FROM system_logs LIMIT 1;"`
