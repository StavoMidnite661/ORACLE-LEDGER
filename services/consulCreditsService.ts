import { ethers } from 'ethers';
import type { 
  ConsulCreditsConfig, 
  SupportedToken, 
  ConsulCreditsTransaction, 
  ConsulCreditsBalance,
  ConsulCreditsStats,
  JournalEntry,
  AuditEvent
} from '../types';

// ConsulCreditsWrapper contract ABI - key functions only
const CONSUL_CREDITS_ABI = [
  // View functions
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function isTokenSupported(address token) view returns (bool)",
  "function supportedTokens(address token) view returns (uint256)",
  "function getExchangeRate(address token) view returns (uint256)",
  "function calculateConsulCredits(address token, uint256 tokenAmount) view returns (uint256)",
  "function calculateTokenAmount(address token, uint256 consulCreditsAmount) view returns (uint256)",
  "function getTokenReserves(address token) view returns (uint256)",
  "function oracleIntegrator() view returns (address)",
  
  // Write functions
  "function depositToken(address token, uint256 tokenAmount, string memory ledgerReference)",
  "function withdrawToken(address token, uint256 consulCreditsAmount, string memory ledgerReference)",
  "function oracleMint(address to, uint256 amount, string memory ledgerReference)",
  "function oracleBurn(address from, uint256 amount, string memory ledgerReference)",
  
  // Events
  "event TokenDeposited(address indexed user, address indexed token, uint256 tokenAmount, uint256 consulCreditsIssued, uint256 exchangeRate, string indexed ledgerReference)",
  "event TokenWithdrawn(address indexed user, address indexed token, uint256 consulCreditsBurned, uint256 tokenAmount, uint256 exchangeRate, string indexed ledgerReference)",
  "event ExchangeRateUpdated(address indexed token, uint256 oldRate, uint256 newRate)",
];

// Standard ERC-20 ABI for token interactions
const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
];

export class ConsulCreditsService {
  private provider: ethers.Provider | null = null;
  private contract: ethers.Contract | null = null;
  private config: ConsulCreditsConfig | null = null;
  private eventListeners: Map<string, any> = new Map();
  private processedTransactions: Set<string> = new Set(); // For deduplication

  constructor() {
    // Initialize with default config if available
    this.loadConfig();
  }

  /**
   * Initialize the service with blockchain configuration
   */
  async initialize(config: ConsulCreditsConfig): Promise<void> {
    try {
      console.log('Starting initialization with config:', config);
      this.config = config;
      
      console.log('Creating provider with RPC URL:', config.rpcUrl);
      // Create provider
      this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
      
      console.log('Testing provider connection...');
      // Test provider connection
      const network = await this.provider.getNetwork();
      console.log('Connected to network:', network);
      
      console.log('Creating contract instance with address:', config.contractAddress);
      // Create contract instance
      this.contract = new ethers.Contract(
        config.contractAddress,
        CONSUL_CREDITS_ABI,
        this.provider
      );

      console.log('Verifying contract...');
      // Verify contract is deployed and accessible
      await this.verifyContract();
      
      console.log('ConsulCreditsService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ConsulCreditsService:', error);
      console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
      throw error;
    }
  }

  /**
   * Verify the contract is deployed and responsive
   */
  private async verifyContract(): Promise<void> {
    if (!this.contract) throw new Error('Contract not initialized');
    
    try {
      // Test contract call
      await this.contract.totalSupply();
    } catch (error) {
      throw new Error(`Contract verification failed: ${error}`);
    }
  }

  /**
   * Get supported tokens and their configuration
   */
  async getSupportedTokens(tokenAddresses: string[]): Promise<SupportedToken[]> {
    if (!this.contract) throw new Error('Service not initialized');

    const tokens: SupportedToken[] = [];

    for (const address of tokenAddresses) {
      try {
        const isSupported = await this.contract.isTokenSupported(address);
        if (!isSupported) continue;

        const exchangeRate = await this.contract.getExchangeRate(address);
        
        // Get token details
        const tokenContract = new ethers.Contract(address, ERC20_ABI, this.provider);
        const [name, symbol, decimals] = await Promise.all([
          tokenContract.name(),
          tokenContract.symbol(),
          tokenContract.decimals()
        ]);

        tokens.push({
          address,
          symbol,
          name,
          decimals,
          exchangeRate: exchangeRate.toString(),
          isActive: true,
          totalDeposited: '0', // Would need to track from events
          totalWithdrawn: '0'  // Would need to track from events
        });
      } catch (error) {
        console.warn(`Failed to get details for token ${address}:`, error);
      }
    }

    return tokens;
  }

  /**
   * Calculate consul credits for token deposit
   */
  async calculateConsulCredits(tokenAddress: string, tokenAmount: string): Promise<string> {
    if (!this.contract) throw new Error('Service not initialized');

    const amount = ethers.parseUnits(tokenAmount, 18);
    const consulCredits = await this.contract.calculateConsulCredits(tokenAddress, amount);
    return ethers.formatUnits(consulCredits, 18);
  }

  /**
   * Calculate token amount for consul credits withdrawal
   */
  async calculateTokenAmount(tokenAddress: string, consulCreditsAmount: string): Promise<string> {
    if (!this.contract) throw new Error('Service not initialized');

    const amount = ethers.parseUnits(consulCreditsAmount, 18);
    const tokenAmount = await this.contract.calculateTokenAmount(tokenAddress, amount);
    return ethers.formatUnits(tokenAmount, 18);
  }

  /**
   * Get user's consul credits balance
   */
  async getUserBalance(userAddress: string): Promise<string> {
    if (!this.contract) throw new Error('Service not initialized');

    const balance = await this.contract.balanceOf(userAddress);
    return ethers.formatUnits(balance, 18);
  }

  /**
   * Get contract statistics
   */
  async getContractStats(): Promise<ConsulCreditsStats> {
    if (!this.contract) throw new Error('Service not initialized');

    const totalSupply = await this.contract.totalSupply();

    // This would typically require additional tracking or event parsing
    return {
      totalSupply: ethers.formatUnits(totalSupply, 18),
      totalUniqueHolders: 0, // Would need to track from events
      totalTransactions: 0,  // Would need to track from events
      supportedTokensCount: 0, // Would need to track supported tokens
      contractReserves: []   // Would need to query each supported token
    };
  }

  /**
   * Oracle Ledger Integration - Mint consul credits for off-chain operations
   */
  async oracleMint(
    toAddress: string, 
    amount: string, 
    ledgerReference: string,
    signerPrivateKey: string
  ): Promise<string> {
    if (!this.contract || !this.provider) throw new Error('Service not initialized');

    // Create signer from private key
    const signer = new ethers.Wallet(signerPrivateKey, this.provider);
    const contractWithSigner = this.contract.connect(signer);

    const amountWei = ethers.parseUnits(amount, 18);
    
    const tx = await contractWithSigner['oracleMint'](toAddress, amountWei, ledgerReference);
    await tx.wait();
    
    return tx.hash;
  }

  /**
   * Oracle Ledger Integration - Burn consul credits for off-chain operations
   */
  async oracleBurn(
    fromAddress: string, 
    amount: string, 
    ledgerReference: string,
    signerPrivateKey: string
  ): Promise<string> {
    if (!this.contract || !this.provider) throw new Error('Service not initialized');

    const signer = new ethers.Wallet(signerPrivateKey, this.provider);
    const contractWithSigner = this.contract.connect(signer);

    const amountWei = ethers.parseUnits(amount, 18);
    
    const tx = await contractWithSigner['oracleBurn'](fromAddress, amountWei, ledgerReference);
    await tx.wait();
    
    return tx.hash;
  }

  /**
   * Start listening for contract events
   */
  async startEventListening(
    onTokenDeposited: (event: ConsulCreditsTransaction) => Promise<void>,
    onTokenWithdrawn: (event: ConsulCreditsTransaction) => Promise<void>
  ): Promise<void> {
    if (!this.contract || !this.config) throw new Error('Service not initialized');

    // Listen for TokenDeposited events
    const depositListener = async (...args: any[]) => {
      const [user, token, tokenAmount, consulCreditsIssued, exchangeRate, ledgerReference, event] = args;
      
      const transactionId = `${event.transactionHash}-${event.logIndex}`;
      
      // Deduplicate based on transaction hash and log index
      if (this.processedTransactions.has(transactionId)) {
        console.log(`Transaction ${transactionId} already processed, skipping`);
        return;
      }
      
      this.processedTransactions.add(transactionId);
      
      const transaction: ConsulCreditsTransaction = {
        id: transactionId,
        txHash: event.transactionHash,
        blockNumber: event.blockNumber,
        timestamp: new Date().toISOString(), // Would get actual block timestamp
        eventType: 'DEPOSIT',
        userAddress: user,
        tokenAddress: token,
        tokenSymbol: '', // Would need to resolve
        tokenAmount: ethers.formatUnits(tokenAmount, 18),
        consulCreditsAmount: ethers.formatUnits(consulCreditsIssued, 18),
        exchangeRate: ethers.formatUnits(exchangeRate, 18),
        ledgerReference,
        confirmations: 0, // Would calculate
        status: 'PENDING'
      };

      await onTokenDeposited(transaction);
    };

    // Listen for TokenWithdrawn events
    const withdrawListener = async (...args: any[]) => {
      const [user, token, consulCreditsBurned, tokenAmount, exchangeRate, ledgerReference, event] = args;
      
      const transactionId = `${event.transactionHash}-${event.logIndex}`;
      
      // Deduplicate based on transaction hash and log index
      if (this.processedTransactions.has(transactionId)) {
        console.log(`Transaction ${transactionId} already processed, skipping`);
        return;
      }
      
      this.processedTransactions.add(transactionId);
      
      const transaction: ConsulCreditsTransaction = {
        id: transactionId,
        txHash: event.transactionHash,
        blockNumber: event.blockNumber,
        timestamp: new Date().toISOString(),
        eventType: 'WITHDRAW',
        userAddress: user,
        tokenAddress: token,
        tokenSymbol: '', // Would need to resolve
        tokenAmount: ethers.formatUnits(tokenAmount, 18),
        consulCreditsAmount: ethers.formatUnits(consulCreditsBurned, 18),
        exchangeRate: ethers.formatUnits(exchangeRate, 18),
        ledgerReference,
        confirmations: 0,
        status: 'PENDING'
      };

      await onTokenWithdrawn(transaction);
    };

    // Set up event listeners
    this.contract.on('TokenDeposited', depositListener);
    this.contract.on('TokenWithdrawn', withdrawListener);

    // Store listeners for cleanup
    this.eventListeners.set('TokenDeposited', depositListener);
    this.eventListeners.set('TokenWithdrawn', withdrawListener);

    console.log('Event listening started for ConsulCreditsWrapper contract');
  }

  /**
   * Stop event listening
   */
  stopEventListening(): void {
    if (!this.contract) return;

    for (const [eventName, listener] of this.eventListeners) {
      this.contract.off(eventName, listener);
    }
    
    this.eventListeners.clear();
    console.log('Event listening stopped');
  }

  /**
   * Create journal entry from consul credits transaction
   */
  createJournalEntryFromTransaction(
    transaction: ConsulCreditsTransaction,
    accountMapping: { consulCreditsAccount: number; tokenAccount: number; feeAccount?: number }
  ): Omit<JournalEntry, 'id'> {
    const isDeposit = transaction.eventType === 'DEPOSIT' || transaction.eventType === 'ORACLE_MINT';
    const description = isDeposit 
      ? `Consul Credits deposit: ${transaction.tokenSymbol} → Consul Credits`
      : `Consul Credits withdrawal: Consul Credits → ${transaction.tokenSymbol}`;

    return {
      date: transaction.timestamp.split('T')[0], // Extract date part
      description,
      source: 'CHAIN',
      status: transaction.status === 'CONFIRMED' ? 'Posted' : 'Pending',
      txHash: transaction.txHash,
      blockNumber: transaction.blockNumber,
      chainConfirmations: transaction.confirmations,
      lines: isDeposit ? [
        // Debit: Consul Credits (asset increase)
        { accountId: accountMapping.consulCreditsAccount, type: 'DEBIT', amount: parseFloat(transaction.consulCreditsAmount) },
        // Credit: Token deposit liability
        { accountId: accountMapping.tokenAccount, type: 'CREDIT', amount: parseFloat(transaction.consulCreditsAmount) }
      ] : [
        // Debit: Token withdrawal (reduce liability)
        { accountId: accountMapping.tokenAccount, type: 'DEBIT', amount: parseFloat(transaction.consulCreditsAmount) },
        // Credit: Consul Credits (asset decrease)
        { accountId: accountMapping.consulCreditsAccount, type: 'CREDIT', amount: parseFloat(transaction.consulCreditsAmount) }
      ]
    };
  }

  /**
   * Load configuration from environment or storage
   */
  private loadConfig(): void {
    // In a real implementation, this would load from environment variables or storage
    // For now, we'll use placeholder values
    this.config = null;
  }

  /**
   * Check if service is properly configured and initialized
   */
  isInitialized(): boolean {
    return !!(this.provider && this.contract && this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): ConsulCreditsConfig | null {
    return this.config;
  }
}

// Export singleton instance
export const consulCreditsService = new ConsulCreditsService();