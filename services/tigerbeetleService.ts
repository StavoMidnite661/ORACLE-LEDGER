/**
 * TigerBeetle Service
 * 
 * Provides high-performance ledger capabilities for the ORACLE LEDGER.
 * Mirroring constants from val-core for ecosystem-wide consistency.
 */

import { createClient, Client, Account, Transfer, CreateAccountsError, CreateTransfersError } from 'tigerbeetle-node';

// Configuration
const TB_CLUSTER_ID = BigInt(process.env.TB_CLUSTER_ID || '0');
const TB_ADDRESSES = (process.env.TB_ADDRESSES || '3000').split(',').map(s => s.trim());

// Ledger IDs (Consistent with val-core)
export const LEDGER_IDS = {
  USD: 1,
  EUR: 2,
  GBP: 3,
  ETH: 100,
  USDC: 101,
  USDT: 102,
  BTC: 103,
  SOVR: 999,
  sFIAT: 998,
  GROCERY_OBLIGATION: 1001,
  UTILITY_OBLIGATION: 1002,
  FUEL_OBLIGATION: 1003,
} as const;

// Account Codes (Consistent with val-core)
export const ACCOUNT_CODES = {
  USER: 1,
  MERCHANT: 2,
  TREASURY: 3,
  ESCROW: 4,
  FEE_POOL: 5,
  ANCHOR: 6,
  SYSTEM_BUFFER: 7,
} as const;

// Transfer Codes (Consistent with val-core)
export const TRANSFER_CODES = {
  DEPOSIT: 1,
  WITHDRAWAL: 2,
  PAYMENT: 3,
  COUNTER_TRANSFER: 4,
  FEE: 5,
  ANCHOR_AUTHORIZATION: 10,
  ANCHOR_FULFILLMENT: 11,
  ANCHOR_EXPIRY: 12,
  ESCROW_LOCK: 20,
  ESCROW_RELEASE: 21,
  ESCROW_VOID: 22,
  CLEARING: 30,
  CLEARING_CORRECTION: 31,
} as const;

export class TigerBeetleService {
  private static instance: TigerBeetleService;
  private client: Client;

  private constructor() {
    console.log(`[TigerBeetle] Initializing client for addresses: ${TB_ADDRESSES.join(', ')}`);
    this.client = createClient({
      cluster_id: TB_CLUSTER_ID,
      replica_addresses: TB_ADDRESSES,
    });
  }

  /**
   * Singleton accessor
   */
  public static getInstance(): TigerBeetleService {
    if (!TigerBeetleService.instance) {
      TigerBeetleService.instance = new TigerBeetleService();
    }
    return TigerBeetleService.instance;
  }

  /**
   * Create accounts in TigerBeetle
   */
  async createAccounts(accounts: Account[]): Promise<CreateAccountsError[]> {
    return await this.client.createAccounts(accounts);
  }

  /**
   * Create transfers in TigerBeetle
   */
  async createTransfers(transfers: Transfer[]): Promise<CreateTransfersError[]> {
    return await this.client.createTransfers(transfers);
  }

  /**
   * Lookup accounts by ID
   */
  async lookupAccounts(accountIds: bigint[]): Promise<Account[]> {
    return await this.client.lookupAccounts(accountIds);
  }

  /**
   * Lookup transfers by ID
   */
  async lookupTransfers(transferIds: bigint[]): Promise<Transfer[]> {
    return await this.client.lookupTransfers(transferIds);
  }

  /**
   * Helper to get a simple balance for an account
   */
  async getBalance(accountId: bigint): Promise<{ debits: bigint; credits: bigint; balance: bigint }> {
    const accounts = await this.client.lookupAccounts([accountId]);
    if (accounts.length === 0) {
      throw new Error(`Account ${accountId} not found`);
    }
    const acc = accounts[0];
    return {
      debits: acc.debits_posted,
      credits: acc.credits_posted,
      balance: acc.credits_posted - acc.debits_posted
    };
  }
  
  /**
   * Close the client connection
   */
  async destroy(): Promise<void> {
    await this.client.destroy();
  }
}

// Export a getter for the singleton instance
export const getTigerBeetle = () => TigerBeetleService.getInstance();
