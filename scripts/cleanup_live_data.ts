
import { db } from "../server/db.js";
import { sql } from "drizzle-orm";

async function clearLiveData() {
  console.log("⚠️  STARTING LIVE DATA CLEANUP...");
  console.log("This will permanently delete all transactional and entity data.");
  console.log("Preserving: Chart of Accounts, Consul Config, Compliance Standards.");

  try {
    // Transactional Tables (Order doesn't verify matter with CASCADE, but good for clarity)
    const tablesToTruncate = [
      // Stripe / Payments
      "ach_returns",
      "ach_payments",
      "direct_deposit_payouts",
      "direct_deposit_bank_accounts",
      "direct_deposit_recipients",
      "payment_methods",
      "customers",
      "stripe_webhook_events",
      "payment_reconciliation",
      "stripe_payment_reconciliation",
      "ach_processing_log",
      "stripe_account_mappings",

      // Core Accounting
      "journal_lines",
      "journal_entries",
      "invoices",
      "purchase_order_items",
      "purchase_orders",

      // Entities
      "employees",
      "vendors",
      "card_transactions",
      "card_reveal_audit",
      "company_cards",

      // Logs & Audits
      "system_logs",
      "pci_audit_log",
      "compliance_checklist",
      "compliance_health_scores",
      "compliance_gaps",
      "regulatory_changes",
      "regulatory_requirements",
      
      // Blockchain
      "consul_credits_transactions",
    ];

    // Execute Truncate
    for (const table of tablesToTruncate) {
        console.log(`Clearing ${table}...`);
        await db.execute(sql.raw(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE;`));
    }

    console.log("✅  SUCCESS: Live demo data cleared.");
    console.log("Run 'npm run dev' to restart the clean application.");
    process.exit(0);
  } catch (error) {
    console.error("❌  ERROR: Failed to clear data.", error);
    process.exit(1);
  }
}

clearLiveData();
