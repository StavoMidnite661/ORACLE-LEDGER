import { db } from '../server/db.js';
import { journalEntries, journalLines, accounts, organizations } from '../shared/schema.js';
import { eq, and } from 'drizzle-orm';

/**
 * MultiTenantLedgerService
 * Wraps core ledger logic to provide tenant scoping.
 */
export class MultiTenantLedgerService {
  /**
   * Fetch accounts scoped to a specific organization.
   */
  async getAccountsByOrg(organizationId: number) {
    return await db.select()
      .from(accounts)
      .where(eq(accounts.organizationId, organizationId));
  }

  /**
   * Fetch journal entries with their lines, scoped by account organization.
   */
  async getJournalEntriesByOrg(organizationId: number) {
    // Note: In a real multi-tenant system, we might add organizationId directly to journalEntries.
    // For now, we filter through the accounts linked in the lines for minimal schema changes.
    return await db.query.journalEntries.findMany({
      where: (entries, { exists }) => exists(
        db.select()
          .from(journalLines)
          .innerJoin(accounts, eq(journalLines.accountId, accounts.id))
          .where(and(
            eq(journalLines.journalEntryId, entries.id),
            eq(accounts.organizationId, organizationId)
          ))
      ),
      with: {
        lines: true
      }
    });
  }

  /**
   * Create a new organization (Tenant).
   */
  async createOrganization(name: string, type: string, taxId?: string) {
    return await db.insert(organizations)
      .values({ name, type, taxId })
      .returning();
  }
}

export const multiTenantLedgerService = new MultiTenantLedgerService();
