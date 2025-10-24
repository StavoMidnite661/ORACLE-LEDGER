
import type { 
  ConsulCreditsConfig, 
  SupportedToken, 
  ConsulCreditsTransaction, 
  ConsulCreditsStats 
} from './types';

export const mockConfig: ConsulCreditsConfig = {
  isEnabled: true,
  networkName: 'Sepolia Testnet',
  chainId: 11155111,
  contractAddress: '0x1234567890123456789012345678901234567890',
  rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID',
  oracleIntegratorAddress: '0x0987654321098765432109876543210987654321',
  confirmationsRequired: 3,
};

export const mockSupportedTokens: SupportedToken[] = [
  {
    name: 'USD Coin',
    symbol: 'USDC',
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    decimals: 6,
    exchangeRate: '1.00',
    isActive: true,
    totalDeposited: '50000000000',
    totalWithdrawn: '10000000000',
  },
  {
    name: 'Tether',
    symbol: 'USDT',
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    decimals: 6,
    exchangeRate: '1.00',
    isActive: true,
    totalDeposited: '25000000000',
    totalWithdrawn: '5000000000',
  },
  {
    name: 'Wrapped Ether',
    symbol: 'WETH',
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    decimals: 18,
    exchangeRate: '3500.00',
    isActive: false,
    totalDeposited: '10000000000000000000', // 10 WETH
    totalWithdrawn: '2000000000000000000', // 2 WETH
  },
];

export const mockTransactions: ConsulCreditsTransaction[] = [
  {
    id: '1',
    txHash: '0xabc123...',
    eventType: 'DEPOSIT',
    tokenSymbol: 'USDC',
    tokenAmount: '1000000000', // 1000 USDC
    consulCreditsAmount: '1000.00',
    userAddress: '0xuser1...',
    status: 'CONFIRMED',
    blockNumber: 123456,
    timestamp: new Date().toISOString(),
    ledgerReference: 'JOURNAL-101',
    journalEntryId: 'JE-001',
    tokenAddress: '',
    exchangeRate: '',
    confirmations: 0
  },
  {
    id: '2',
    txHash: '0xdef456...',
    eventType: 'WITHDRAW',
    tokenSymbol: 'USDT',
    tokenAmount: '500000000', // 500 USDT
    consulCreditsAmount: '500.00',
    userAddress: '0xuser2...',
    status: 'PENDING',
    blockNumber: 123457,
    timestamp: new Date().toISOString(),
    ledgerReference: 'JOURNAL-102',
    journalEntryId: 'JE-002',
    tokenAddress: '',
    exchangeRate: '',
    confirmations: 0
  },
  {
    id: '3',
    txHash: '0xghi789...',
    eventType: 'ORACLE_MINT',
    tokenSymbol: 'N/A',
    tokenAmount: '0',
    consulCreditsAmount: '250.00',
    userAddress: '0xoracle...',
    status: 'CONFIRMED',
    blockNumber: 123458,
    timestamp: new Date().toISOString(),
    ledgerReference: 'JOURNAL-103',
    journalEntryId: 'JE-003',
    tokenAddress: '',
    exchangeRate: '',
    confirmations: 0
  },
  {
    id: '4',
    txHash: '0xjkl012...',
    eventType: 'DEPOSIT',
    tokenSymbol: 'WETH',
    tokenAmount: '1000000000000000000', // 1 WETH
    consulCreditsAmount: '3500.00',
    userAddress: '0xuser3...',
    status: 'FAILED',
    blockNumber: 123459,
    timestamp: new Date().toISOString(),
    ledgerReference: 'JOURNAL-104',
    journalEntryId: 'JE-004',
    tokenAddress: '',
    exchangeRate: '',
    confirmations: 0
  },
];

export const mockStats: ConsulCreditsStats = {
  totalSupply: '100000.00',
  totalValueLockedUSD: '98000.00',
  activeUsers: 150,
};
