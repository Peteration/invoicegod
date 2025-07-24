import plaid from 'plaid';
import { AuditLogger } from '../audit/auditLogger';
import { PaymentResult } from './paymentTypes';

const audit = AuditLogger.getInstance();

export class BankService {
  private client: plaid.Client;

  constructor() {
    this.client = new plaid.Client({
      clientID: process.env.PLAID_CLIENT_ID!,
      secret: process.env.PLAID_SECRET!,
      env: plaid.environments[process.env.PLAID_ENV! as keyof typeof plaid.environments],
      options: { version: '2020-09-14' }
    });
  }

  async processACH(
    amount: number,
    currency: string,
    details: {
      accountId: string;
      processorToken: string;
    },
    invoiceId: string
  ): Promise<PaymentResult> {
    try {
      const response = await this.client.processorBankTransferCreate(
        details.processorToken,
        'ach',
        'credit',
        amount.toFixed(2),
        'InvoiceGod Payment',
        {
          invoice_id: invoiceId
        }
      );

      await audit.logEvent({
        eventType: 'BANK_PAYMENT_INITIATED',
        invoiceId,
        metadata: {
          amount,
          currency,
          bankTransactionId: response.request_id
        }
      });

      return {
        success: true,
        transactionId: `ACH_${response.request_id}`,
        processedAmount: amount,
        currency
      };
    } catch (error) {
      await audit.logSecurityEvent('BANK_PAYMENT_FAILED', {
        invoiceId,
        error: error.message
      });
      throw error;
    }
  }

  async processRefund(
    transactionId: string,
    amount: number
  ): Promise<PaymentResult> {
    try {
      const requestId = transactionId.replace('ACH_', '');
      const response = await this.client.createBankTransferRefund(
        requestId,
        amount.toFixed(2)
      );

      await audit.logEvent({
        eventType: 'BANK_REFUND_PROCESSED',
        metadata: {
          originalTransaction: transactionId,
          amount,
          refundId: response.request_id
        }
      });

      return {
        success: true,
        transactionId: `ACH_REFUND_${response.request_id}`,
        processedAmount: amount,
        currency: 'USD'
      };
    } catch (error) {
      await audit.logSecurityEvent('BANK_REFUND_FAILED', {
        transactionId,
        error: error.message
      });
      throw error;
    }
  }

  async getLinkToken(userId: string): Promise<string> {
    const response = await this.client.createLinkToken({
      user: { client_user_id: userId },
      client_name: 'InvoiceGod',
      products: ['auth', 'transactions'],
      country_codes: ['US'],
      language: 'en'
    });

    return response.link_token;
  }
}