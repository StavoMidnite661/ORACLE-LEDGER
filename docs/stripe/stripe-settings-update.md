# Task: Implement "Update API Keys" Functionality

## 📋 Definition of Done
- [ ] "Update API Keys" modal renders a form with 3 fields: Publishable Key, Secret Key, Webhook Secret.
- [ ] Input validation enforces correct prefixes (`pk_`, `sk_`, `whsec_`).
- [ ] Submitting the form updates the local React state.
- [ ] Submitting the form sends a `POST` request to `/api/stripe/config`.
- [ ] Backend (`payment-gateway`) accepts and stores the configuration (in-memory).
- [ ] UI feedback (success/error toast) is displayed.

## 🗺️ Roadmap
### Phase 1: Analysis (Completed)
- Identified missing functionality in `StripeSettingsView.tsx`.
- Confirmed no existing endpoint for Stripe config.

### Phase 2: Planning (Current)
- Design the form UI.
- Define the API contract.

### Phase 3: Solutioning
- **Frontend:**
    - Component: `StripeApiKeyForm`.
    - State: `isLoading`, `error`, `success`.
- **Backend:**
    - Endpoint: `POST /config` (in `payment-gateway`).
    - Body: `{ publishableKey, secretKey, webhookSecret }`.

### Phase 4: Implementation
- Modify `microservices/payment-gateway/index.ts`.
- Update `views/StripeSettingsView.tsx`.
- Manual verification.

## ⚠️ Risks
- **Security:** Sending secret keys over the wire is sensitive. Ensure HTTPS (or localhost).
- **Persistence:** In-memory updates will be lost on restart. (Acceptable for this task).
