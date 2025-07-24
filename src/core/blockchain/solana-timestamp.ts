import { Connection, Keypair, Transaction, SystemProgram } from '@solana/web3.js';
import { createHash } from 'crypto';
import base58 from 'bs58';

const SOLANA_RPC = process.env.SOLANA_DEVNET_URL!;

export async function timestampInvoice(invoiceData: string) {
  // Create content hash
  const sha256 = createHash('sha256');
  sha256.update(invoiceData);
  const invoiceHash = sha256.digest();
  
  // Initialize secure connection
  const connection = new Connection(SOLANA_RPC, 'confirmed');
  const payer = Keypair.fromSecretKey(
    base58.decode(process.env.SOLANA_PAYER_SECRET!)
  );

  // Create transaction
  const transaction = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: Keypair.generate().publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(44),
      space: 44,
      programId: SystemProgram.programId,
    })
  );

  // Sign and send
  const signature = await connection.sendTransaction(
    transaction,
    [payer],
    { skipPreflight: false, preflightCommitment: 'confirmed' }
  );

  // Wait for confirmation
  await connection.confirmTransaction(signature, 'confirmed');
  
  return {
    transactionId: signature,
    invoiceHash: invoiceHash.toString('hex'),
    explorerLink: `https://explorer.solana.com/tx/${signature}?cluster=devnet`
  };
}