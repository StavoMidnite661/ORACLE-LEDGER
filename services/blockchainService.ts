
import { ethers } from 'ethers';
import { ConsulCreditsWrapper } from '../contracts/ConsulCreditsWrapper.sol';

class BlockchainService {
  private provider: ethers.providers.JsonRpcProvider;
  private signer: ethers.Wallet;
  private consulCreditsWrapper: ConsulCreditsWrapper;

  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    this.signer = new ethers.Wallet(process.env.PRIVATE_KEY as string, this.provider);
    this.consulCreditsWrapper = new ConsulCreditsWrapper(process.env.CONSUL_CREDITS_WRAPPER_ADDRESS as string, this.signer);
  }

  async getConsulCreditsBalance(address: string): Promise<string> {
    const balance = await this.consulCreditsWrapper.balanceOf(address);
    return ethers.utils.formatEther(balance);
  }

  async transferConsulCredits(to: string, amount: string): Promise<ethers.providers.TransactionResponse> {
    const amountInWei = ethers.utils.parseEther(amount);
    return this.consulCreditsWrapper.transfer(to, amountInWei);
  }

  async getTransactionReceipt(txHash: string): Promise<ethers.providers.TransactionReceipt> {
    return this.provider.getTransactionReceipt(txHash);
  }
}

export const blockchainService = new BlockchainService();
