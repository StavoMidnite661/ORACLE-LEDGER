# 🎼 Orchestration Plan

## Task

Adopt the Network & Security Guardian persona to fix the database configuration issue and correct the UI label (Base Mainnet). Then, try the Stripe payroll and issue a journal entry for bills received.

## Phase 1: Investigation & Planning (project-planner)

- [x] Check the DB config using `scripts/check_db_config.ts`. (DB is correctly set to Base Mainnet)
- [ ] Investigate why frontend UI still shows "SEPOLIA TESTNET". This involves finding hardcoded values in `constants.ts` or checking the API proxy routing.
- [ ] Fix the frontend / API wiring to correctly display "Base Mainnet".
- [ ] Identify where the Stripe payroll and journal entry logic lives (`services/apiService.ts` has `createPayrollEntry`), and write a script or use the UI to execute it.

## Verification

- Load UI to confirm the label correctly says "Base Mainnet".
- Run the payroll entry and check `journal_entries` DB or API to verify it was posted successfully.
