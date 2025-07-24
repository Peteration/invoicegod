import { ethers } from 'ethers';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { validate } from 'multicoin-address-validator';
import axios from 'axios';
import { createHmac } from 'crypto';

const PAYMENT_SECRET = process.env.PAYMENT_HMAC_SECRET!;

interface PaymentRequest {
  chain: 'ETH' | 'SOL' | 'USDC';
  amount: number;
  recipient: string;
  invoiceId: string;
}

export async function processCryptoPayment(payment: PaymentRequest) {
  // Address validation
  if (!validate(payment.recipient, payment.chain.toLowerCase())) {
    throw new Error(`Invalid ${payment.chain} address`);
  }

  // Anti-collision HMAC
  const hmac = createHmac('sha256', PAYMENT_SECRET);
  hmac.update(`${payment.invoiceId}-${Date.now()}`);
  const paymentId = hmac.digest('hex');

  try {
    switch (payment.chain) {
      case 'ETH':
        return await processETHPayment(payment, paymentId);
      case 'SOL':
        return await processSOLPayment(payment, paymentId);
      case 'USDC':
        return await processUSDCPayment(payment, paymentId);
      default:
        throw new Error('Unsupported chain');
    }
  } catch (error) {
    console.error(`Payment failed: ${error}`);
    throw new Error('Payment processing error');
  }
}

async function processETHPayment(payment: PaymentRequest, paymentId: string) {
  const provider = new ethers.providers.AlchemyProvider(
    'goerli',
    process.env.ALCHEMY_API_KEY
  );
  const wallet = new ethers.Wallet(process.env.ETH_PAYMENT_KEY!, provider);
  
  const tx = await wallet.sendTransaction({
    to: payment.recipient,
    value: ethers.utils.parseEther(payment.amount.toString()),
    nonce: await provider.getTransactionCount(wallet.address, 'latest'),
    gasLimit: 21000,
  });

  return { paymentId, txHash: tx.hash, explorer: `https://goerli.etherscan.io/tx/${tx.hash}` };
}

async function processSOLPayment(payment: PaymentRequest, paymentId: string) {
  const connection = new Connection(process.env.SOLANA_RPC_URL!);
  const fromKeypair = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(process.env.SOL_PAYMENT_KEY!))
  );

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: fromKeypair.publicKey,
      toPubkey: new PublicKey(payment.recipient),
      lamports: Math.floor(payment.amount * LAMPORTS_PER_SOL)
    })
  );

  const txHash = await connection.sendTransaction(transaction, [fromKeypair]);
  return { paymentId, txHash, explorer: `https://explorer.solana.com/tx/${txHash}` };
}

async function processUSDCPayment(payment: PaymentRequest, paymentId: string) {
  const response = await axios.post(
    'https://api.circle.com/v1/payments',
    {
      source: { type: 'wallet', id: process.env.CIRCLE_WALLET_ID },
      destination: { type: 'blockchain', address: payment.recipient },
      amount: { amount: payment.amount.toFixed(6), currency: 'USD' },
      idempotencyKey: paymentId
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.CIRCLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return { 
    paymentId, 
    txHash: response.data.payment.txHash,
    explorer: `https://www.circle.com/en/usdc-multichain/transaction/${response.data.payment.txHash}`
  };
}