import Twilio from 'twilio';
import { AuditLogger } from '../audit/auditLogger';

const client = Twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
const audit = AuditLogger.getInstance();

type SMSPayload = {
  to: string;
  body: string;
  invoiceId?: string;
  userId?: string;
};

export class SMSAlertService {
  static async send(payload: SMSPayload): Promise<boolean> {
    try {
      const response = await client.messages.create({
        body: payload.body,
        from: process.env.TWILIO_PHONE_NUMBER!,
        to: this.normalizePhoneNumber(payload.to)
      });

      await audit.logEvent({
        eventType: 'SMS_SENT',
        userId: payload.userId,
        invoiceId: payload.invoiceId,
        metadata: {
          to: payload.to,
          sid: response.sid
        }
      });

      return true;
    } catch (error) {
      await audit.logSecurityEvent('SMS_FAILURE', {
        error: error.message,
        payload
      });
      return false;
    }
  }

  private static normalizePhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let normalized = phone.replace(/\D/g, '');

    // Add country code if missing
    if (!normalized.startsWith('+') && !normalized.startsWith('1')) {
      normalized = `1${normalized}`; // Default to US
    }

    return `+${normalized}`;
  }

  static async sendPaymentAlert(
    invoiceId: string,
    amount: number,
    currency: string,
    phone: string,
    userId: string
  ): Promise<void> {
    const body = `InvoiceGod: Payment of ${formatCurrency(amount, currency)} received for invoice ${invoiceId}`;
    await this.send({ to: phone, body, invoiceId, userId });
  }

  static async sendReminder(
    invoiceId: string,
    amount: number,
    currency: string,
    phone: string,
    userId: string
  ): Promise<void> {
    const body = `InvoiceGod: Friendly reminder for invoice ${invoiceId} (${formatCurrency(amount, currency)}) due soon`;
    await this.send({ to: phone, body, invoiceId, userId });
  }
}