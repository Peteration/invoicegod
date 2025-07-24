export type PaymentMethod = {
  type: 'credit_card' | 'crypto' | 'paypal' | 'bank_transfer' | 'local_payment';
  details: CreditCardDetails | CryptoDetails | BankDetails | PayPalDetails;
};

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  processedAmount: number;
  currency: string;
  fee?: number;
  estimatedSettlement?: Date;
}

interface CreditCardDetails {
  number: string;
  expMonth: number;
  expYear: number;
  cvc: string;
  name: string;
}

interface CryptoDetails {
  currency: 'BTC' | 'ETH' | 'USDC' | 'SOL';
  walletAddress: string;
}

interface BankDetails {
  accountId: string;
  routingNumber?: string;
  accountNumber?: string;
  processorToken?: string;
}

interface PayPalDetails {
  email: string;
}