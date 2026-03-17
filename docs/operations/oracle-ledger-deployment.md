# Task: Oracle Ledger Microservices Deployment

## 📋 Definition of Done
- [ ] Dockerized environment verified (PostgreSQL + 5 Services).
- [ ] Environment variables validated and secured.
- [ ] Database schema pushed and verified (`npm run db:push`).
- [ ] All 5 microservices healthy and reachable via Gateway (Port 3002).
- [ ] Frontend (Port 5000) successfully communicating with Gateway.
- [ ] Production build verified (`npm run build`).

## 🗺️ Roadmap
### Phase 1: Analysis (Completed)
- Mapped service dependencies and route maps.
- Verified `.env` and `package.json`.
- Identified existing migration state.

### Phase 2: Planning (Current)
- Define containerization strategy.
- Map networking and volumes.

### Phase 3: Solutioning (Next)
- Finalize Docker networking.
- Define startup sequence (DB -> Legacy -> Services -> Gateway).
- Set up health check scripts.

### Phase 4: Implementation
- Execute Docker build.
- Run database migrations.
- Verify end-to-end connectivity.

## ⚠️ Known Risks & Trade-offs
- **Live Keys:** `sk_live_...` in `.env`. High risk if not managed via secrets.
- **Service Sync:** Complex startup order may require retry logic in Gateway/Services.
- **Port Conflicts:** Ensure local 5432, 3001-3005 are clear.
