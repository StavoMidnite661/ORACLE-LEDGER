import crypto from 'crypto';
import { db } from '../server/db.js';
import { journalEntries, type JournalEntry } from '../shared/schema.js';
import { eq, desc } from 'drizzle-orm';

/**
 * AuditService
 * Handles immutable audit trail logic (hashing and chaining).
 * Ported from Financial-Command-Center concepts.
 */
export class AuditService {
  /**
   * Calculate SHA-256 hash for a journal entry.
   */
  calculateHash(entry: Partial<JournalEntry>, previousHash: string = ''): string {
    const data = JSON.stringify({
      id: entry.id,
      date: entry.date,
      description: entry.description,
      source: entry.source,
      previousHash
    });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Sign a journal entry by calculating its hash and linking to the previous entry.
   */
  async signEntry(entryId: string) {
    return await db.transaction(async (tx) => {
      // Get the current entry
      const [entry] = await tx.select()
        .from(journalEntries)
        .where(eq(journalEntries.id, entryId));

      if (!entry) throw new Error('Entry not found');

      // Get the last signed entry's hash
      const [lastEntry] = await tx.select({ hash: journalEntries.hash })
        .from(journalEntries)
        .orderBy(desc(journalEntries.sequenceNumber))
        .limit(1);

      const previousHash = lastEntry?.hash || '0'.repeat(64);
      const hash = this.calculateHash(entry, previousHash);

      // Update the entry with audit metadata
      await tx.update(journalEntries)
        .set({
          hash,
          previousHash,
          status: 'Posted'
        })
        .where(eq(journalEntries.id, entryId));

      return hash;
    });
  }

  /**
   * Verify the integrity of the ledger chain.
   */
  async verifyChain() {
    const entries = await db.select()
      .from(journalEntries)
      .orderBy(journalEntries.sequenceNumber);

    let expectedPreviousHash = '0'.repeat(64);

    for (const entry of entries) {
      if (entry.previousHash !== expectedPreviousHash) {
        return { valid: false, failedAt: entry.id, reason: 'Previous hash mismatch' };
      }

      const currentHash = this.calculateHash(entry, entry.previousHash || '');
      if (entry.hash !== currentHash) {
        return { valid: false, failedAt: entry.id, reason: 'Hash corruption' };
      }

      expectedPreviousHash = entry.hash || '';
    }

    return { valid: true };
  }
}

export const auditService = new AuditService();
