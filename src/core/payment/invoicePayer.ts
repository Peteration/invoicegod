import { PaymentMethod, PaymentResult } from './paymentTypes';
import { StripeService } from './stripeService';
import { CryptoProcessor } from './cryptoProcessor';
import { PayPalService } from './paypalService';
import { AuditLogger } from '../audit/auditLogger';
import { BankService } from './bankService';

const audit = AuditLogger.getInstance();

export class InvoicePayer {
  private stripe = new StripeService();
  private crypto = new CryptoProcessor();
  private paypal = new PayPalService();
  private bank = new BankService();

  async payInvoice(
    invoiceId: string,
    method: PaymentMethod,
    amount: number,
    currency: string,
    userIp: string
  ): Promise<PaymentResult> {
    try {
      let result: PaymentResult;

      switch (method.type) {
        case 'credit_card':
          result = await this.stripe.processCardPayment(
            amount,
            currency,
            method.details,
            userIp,
            invoiceId
          );
          break;
        case 'crypto':
          result = await this.crypto.processPayment(
            amount,
            currency,
            method.details,
            invoiceId
          );
          break;
        case 'paypal':
          result = await this.paypal.processPayment(
            amount,
            currency,
            invoiceId
          );
          break;
        case 'bank_transfer':
          result = await this.bank.processACH(
            amount,
            currency,
            method.details,
            invoiceId
          );
          break;
        default:
          throw new Error('Unsupported payment method');
      }

      await audit.logEvent({
        eventType: 'PAYMENT_PROCESSED',
        invoiceId,
        metadata: {
          method: method.type,
          amount,
          currency,
          transactionId: result.transactionId
        }
      });

      return result;
    } catch (error) {
      await audit.logSecurityEvent('PAYMENT_FAILED', {
        invoiceId,
        error: error.message,
        method: method.type
      });
      throw error;
    }
  }

  async refundPayment(
    invoiceId: string,
    transactionId: string,
    amount: number,
    currency: string,
    reason?: string
  ): Promise<PaymentResult> {
    try {
      // Determine payment method from original transaction
      const paymentMethod = await this.detectPaymentMethod(transactionId);
      let result: PaymentResult;

      switch (paymentMethod) {
        case 'stripe':
          result = await this.stripe.processRefund(transactionId, amount);
          break;
        case 'paypal':
          result = await this.paypal.processRefund(transactionId, amount);
          break;
        case 'crypto':
          result = await this.crypto.processRefund(transactionId, amount, currency);
          break;
        case 'bank':
          result = await this.bank.processRefund(transactionId, amount);
          break;
        default:
          throw new Error('Refund not supported for this payment method');
      }

      await audit.logEvent({
        eventType: 'PAYMENT_REFUNDED',
        invoiceId,
        metadata: {
          transactionId,
          amount,
          currency,
          reason
        }
      });

      return result;
    } catch (error) {
      await audit.logSecurityEvent('REFUND_FAILED', {
        invoiceId,
        error: error.message
      });
      throw error;
    }
  }

  private async detectPaymentMethod(transactionId: string): Promise<string> {
    if (transactionId.startsWith('ch_')) return 'stripe';
    if (transactionId.startsWith('PAY-')) return 'paypal';
    if (transactionId.startsWith('0x')) return 'crypto';
    if (transactionId.startsWith('ACH')) return 'bank';
    throw new Error('Unknown payment method');
  }
}