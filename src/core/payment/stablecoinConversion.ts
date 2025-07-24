import { ethers } from 'ethers';
import { Currency } from '../types';
import { AuditLogger } from '../audit/auditLogger';

const STABLECOIN_ADDRESSES: Record<string, string> = {
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7'
};

const STABLECOIN_ABI = [
  'function balanceOf(address account) external view returns (uint256)',
  'function transfer(address recipient, uint256 amount) external returns (bool)',
  'function approve(address spender, uint256 amount) external returns (bool)'
];

const UNISWAP_ROUTER = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
const UNISWAP_ABI = [
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'
];

export class StablecoinConverter {
  private provider: ethers.providers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private audit = AuditLogger.getInstance();

  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
    this.wallet = new ethers.Wallet(process.env.CONVERSION_SIGNER_KEY!, this.provider);
  }

  async convertToStablecoin(
    amount: string,
    fromCurrency: Currency,
    toCurrency: 'USDC' | 'DAI' | 'USDT',
    recipient: string,
    invoiceId: string
  ): Promise<string> {
    try {
      let txHash: string;

      if (fromCurrency === 'ETH') {
        txHash = await this.convertEthToStablecoin(amount, toCurrency, recipient);
      } else {
        txHash = await this.convertTokenToStablecoin(amount, fromCurrency, toCurrency, recipient);
      }

      await this.audit.logEvent({
        eventType: 'STABLECOIN_CONVERSION',
        invoiceId,
        metadata: {
          fromCurrency,
          toCurrency,
          amount,
          txHash
        }
      });

      return txHash;
    } catch (error) {
      await this.audit.logSecurityEvent('CONVERSION_FAILED', {
        invoiceId,
        error: error.message
      });
      throw error;
    }
  }

  private async convertEthToStablecoin(
    amount: string,
    toCurrency: 'USDC' | 'DAI' | 'USDT',
    recipient: string
  ): Promise<string> {
    const uniswap = new ethers.Contract(UNISWAP_ROUTER, UNISWAP_ABI, this.wallet);
    const amountOutMin = this.calculateMinAmountOut(amount, 'ETH', toCurrency);

    const tx = await uniswap.swapExactETHForTokens(
      amountOutMin,
      [
        '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
        STABLECOIN_ADDRESSES[toCurrency]
      ],
      recipient,
      Math.floor(Date.now() / 1000) + 60 * 20, // 20 minute deadline
      { value: ethers.utils.parseEther(amount) }
    );

    return tx.hash;
  }

  private async convertTokenToStablecoin(
    amount: string,
    fromCurrency: Currency,
    toCurrency: 'USDC' | 'DAI' | 'USDT',
    recipient: string
  ): Promise<string> {
    const token = new ethers.Contract(STABLECOIN_ADDRESSES[fromCurrency], STABLECOIN_ABI, this.wallet);
    const uniswap = new ethers.Contract(UNISWAP_ROUTER, UNISWAP_ABI, this.wallet);

    // Approve Uniswap to spend tokens
    const approveTx = await token.approve(
      UNISWAP_ROUTER,
      ethers.utils.parseUnits(amount, this.getDecimals(fromCurrency))
    );
    await approveTx.wait();

    // Execute swap
    const amountOutMin = this.calculateMinAmountOut(amount, fromCurrency, toCurrency);
    const swapTx = await uniswap.swapExactTokensForTokens(
      ethers.utils.parseUnits(amount, this.getDecimals(fromCurrency)),
      amountOutMin,
      [
        STABLECOIN_ADDRESSES[fromCurrency],
        '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
        STABLECOIN_ADDRESSES[toCurrency]
      ],
      recipient,
      Math.floor(Date.now() / 1000) + 60 * 20 // 20 minute deadline
    );

    return swapTx.hash;
  }

  private calculateMinAmountOut(
    amount: string,
    fromCurrency: Currency,
    toCurrency: 'USDC' | 'DAI' | 'USDT'
  ): ethers.BigNumber {
    // In production, fetch from price oracle with 1% slippage
    const amountIn = parseFloat(amount);
    let amountOut = amountIn; // 1:1 for demo
    
    if (fromCurrency === 'ETH') {
      amountOut = amountIn * 1800; // Example ETH price
    }
    
    return ethers.utils.parseUnits(
      (amountOut * 0.99).toFixed(6), // 1% slippage
      this.getDecimals(toCurrency)
    );
  }

  private getDecimals(currency: string): number {
    return currency === 'USDT' ? 6 : 18;
  }
}