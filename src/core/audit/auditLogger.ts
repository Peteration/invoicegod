import { createSecureApiClient } from '../../lib/api';
import { encryptData } from '../security/crypto';

type AuditEvent = {
  eventType: string;
  userId?: string;
  invoiceId?: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
};

export class AuditLogger {
  private static instance: AuditLogger;
  private api = createSecureApiClient();

  private constructor() {}

  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  async logEvent(event: AuditEvent): Promise<boolean> {
    try {
      const secureEvent = {
        ...event,
        timestamp: new Date().toISOString(),
        // Encrypt sensitive metadata
        metadata: event.metadata ? 
          await encryptData(JSON.stringify(event.metadata)) : 
          undefined
      };

      await this.api.post('/v1/audit/logs', secureEvent);
      return true;
    } catch (error) {
      console.error('Audit logging failed:', error);
      return false;
    }
  }

  // High-priority security events
  async logSecurityEvent(
    eventType: string, 
    details: Record<string, unknown>
  ) {
    await this.logEvent({
      eventType: `SECURITY_${eventType}`,
      metadata: details
    });
    
    // Immediate alert for critical events
    if (eventType.includes('FRAUD')) {
      await this.sendSecurityAlert(eventType, details);
    }
  }

  private async sendSecurityAlert(
    eventType: string,
    details: Record<string, unknown>
  ) {
    await fetch(process.env.SECURITY_WEBHOOK!, {
      method: 'POST',
      body: JSON.stringify({
        event: eventType,
        details,
        timestamp: new Date().toISOString()
      })
    });
  }
}