import { ethers } from 'ethers';

// Standard ERC-20 + Consul Credits Minimal ABI
const CONSUL_CREDITS_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Signer;
  private consulCreditsWrapper: ethers.Contract;

  constructor() {
    const rpcUrl = process.env.RPC_URL || process.env.ETHEREUM_RPC_URL;
    const privateKey = process.env.PRIVATE_KEY || process.env.SignerPrivateKey; // Fallback to other common env var names
    const contractAddress = process.env.CONSUL_CREDITS_WRAPPER_ADDRESS || process.env.CONSUL_CREDITS_CONTRACT;

    if (!rpcUrl) {
      console.warn('⚠️ BlockchainService: RPC_URL not found in environment. Service disabled.');
      // Initialize with dummy values to prevent immediate crash, but methods will fail
      this.provider = new ethers.JsonRpcProvider('http://localhost:8545');
      this.signer = ethers.Wallet.createRandom(this.provider);
      this.consulCreditsWrapper = new ethers.Contract(ethers.ZeroAddress, CONSUL_CREDITS_ABI, this.provider);
      return;
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    if (!privateKey) {
      console.warn('⚠️ BlockchainService: PRIVATE_KEY not found. Read-only mode.');
      this.signer = ethers.Wallet.createRandom(this.provider); // Random wallet for read-only
    } else {
      this.signer = new ethers.Wallet(privateKey, this.provider);
    }

    if (!contractAddress) {
       console.error('❌ BlockchainService: CONSUL_CREDITS_CONTRACT address not found.');
       // Fallback to avoid crash, but calls will fail
       this.consulCreditsWrapper = new ethers.Contract(ethers.ZeroAddress, CONSUL_CREDITS_ABI, this.signer);
    } else {
       this.consulCreditsWrapper = new ethers.Contract(contractAddress, CONSUL_CREDITS_ABI, this.signer);
    }
  }

  async getConsulCreditsBalance(address: string): Promise<string> {
    if (this.consulCreditsWrapper.target === ethers.ZeroAddress) {
        throw new Error('BlockchainService not properly initialized (Missing Contract Address)');
    }
    try {
      const balance = await this.consulCreditsWrapper.balanceOf(address);
      return ethers.formatEther(balance);
    } catch (error) {
       console.error('Error fetching balance:', error);
       return '0.0';
    }
  }

  async transferConsulCredits(to: string, amount: string): Promise<ethers.TransactionResponse> {
     if (this.consulCreditsWrapper.target === ethers.ZeroAddress) {
        throw new Error('BlockchainService not properly initialized (Missing Contract Address)');
    }
    const amountInWei = ethers.parseEther(amount);
    return this.consulCreditsWrapper.transfer(to, amountInWei);
  }

  async getTransactionReceipt(txHash: string): Promise<ethers.TransactionReceipt | null> {
    return this.provider.getTransactionReceipt(txHash);
  }
}

export const blockchainService = new BlockchainService();
