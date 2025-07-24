import { Invoice, Client } from '../../types';
import { encryptData, decryptData } from '../security/crypto';
import { createSecureApiClient } from '../../lib/api';

const DATA_RETENTION_DAYS = 365;
const EU_COUNTRIES = new Set(['AT','BE','BG','CY','CZ','DE','DK','EE','ES','FI','FR','GR','HR','HU','IE','IT','LT','LU','LV','MT','NL','PL','PT','RO','SE','SI','SK']);

export class GDPRService {
  private api = createSecureApiClient();

  async processInvoice(invoice: Invoice): Promise<Invoice> {
    // Anonymize if client is from EU
    if (this.isEUResident(invoice.client.country)) {
      return this.anonymizeInvoice(invoice);
    }
    return invoice;
  }

  async deleteUserData(userId: string): Promise<boolean> {
    try {
      // Pseudonymize instead of hard delete
      await this.api.patch(`/users/${userId}`, {
        email: `deleted-${userId}@invoicegod.com`,
        name: 'Deleted User',
        vatNumber: null,
        billingAddress: null
      });
      
      return true;
    } catch (error) {
      console.error('GDPR deletion failed:', error);
      return false;
    }
  }

  private isEUResident(countryCode: string): boolean {
    return EU_COUNTRIES.has(countryCode);
  }

  private async anonymizeInvoice(invoice: Invoice): Promise<Invoice> {
    const encrypted = await encryptData(JSON.stringify(invoice));
    
    return {
      ...invoice,
      client: {
        ...invoice.client,
        name: 'REDACTED (EU)',
        email: `redacted-${invoice.id}@invoicegod.com`,
        address: 'REDACTED',
        vatNumber: invoice.client.vatNumber ? 'REDACTED' : undefined
      },
      meta: {
        ...invoice.meta,
        gdprProtected: true,
        encryptedData: encrypted.toString('base64'),
        retentionDays: DATA_RETENTION_DAYS
      }
    };
  }

  async recoverInvoice(invoiceId: string): Promise<Invoice | null> {
    const response = await this.api.get(`/invoices/${invoiceId}`);
    if (response.data.meta?.gdprProtected) {
      const decrypted = await decryptData(
        Buffer.from(response.data.meta.encryptedData, 'base64')
      );
      return JSON.parse(decrypted);
    }
    return response.data;
  }
}