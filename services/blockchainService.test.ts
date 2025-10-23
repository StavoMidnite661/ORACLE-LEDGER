
import { blockchainService } from './blockchainService';

describe('BlockchainService', () => {
  it('should get the Consul Credits balance', async () => {
    const balance = await blockchainService.getConsulCreditsBalance('0x742d35Cc6634C0532925a3b844Bc454e4438f44e');
    expect(balance).toBeDefined();
  });

  it('should transfer Consul Credits', async () => {
    const tx = await blockchainService.transferConsulCredits('0x742d35Cc6634C0532925a3b844Bc454e4438f44e', '100');
    expect(tx.hash).toBeDefined();
  });
});
