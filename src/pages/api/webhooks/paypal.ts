import type { NextApiRequest, NextApiResponse } from 'next';
import paypal from '@paypal/checkout-server-sdk';
import { AuditLogger } from '../../../core/audit/auditLogger';

const audit = AuditLogger.getInstance();
const environment = new paypal.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID!,
  process.env.PAYPAL_SECRET!
);
const client = new paypal.core.PayPalHttpClient(environment);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verify webhook signature
  if (!verifyPayPalSignature(req)) {
    await audit.logSecurityEvent('PAYPAL_WEBHOOK_INVALID', {
      ip: req.socket.remoteAddress
    });
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = req.body;
  try {
    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await handlePaymentCapture(event);
        break;
      case 'PAYMENT.CAPTURE.DENIED':
        await handlePaymentDenied(event);
        break;
      case 'PAYMENT.CAPTURE.REFUNDED':
        await handlePaymentRefund(event);
        break;
      default:
        console.log(`Unhandled PayPal event: ${event.event_type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    await audit.logSecurityEvent('PAYPAL_WEBHOOK_ERROR', {
      error: error.message
    });
    res.status(500).json({ error: 'Processing failed' });
  }
}

async function handlePaymentCapture(event: any) {
  const invoiceId = event.resource.invoice_id;
  const amount = event.resource.amount.value;
  const currency = event.resource.amount.currency_code;

  await fetch(`${process.env.API_BASE_URL}/invoices/${invoiceId}/pay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Secret': process.env.INTERNAL_WEBHOOK_SECRET!
    },
    body: JSON.stringify({
      paymentMethod: 'paypal',
      transactionId: event.resource.id,
      amount,
      currency
    })
  });

  await audit.logEvent({
    eventType: 'PAYPAL_PAYMENT_RECEIVED',
    invoiceId,
    metadata: {
      amount,
      currency,
      payer: event.resource.payer.email_address
    }
  });
}

async function handlePaymentDenied(event: any) {
  const invoiceId = event.resource.invoice_id;
  
  await fetch(`${process.env.API_BASE_URL}/invoices/${invoiceId}/payment-failed`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Secret': process.env.INTERNAL_WEBHOOK_SECRET!
    },
    body: JSON.stringify({
      paymentMethod: 'paypal',
      reason: event.resource.reason
    })
  });

  await audit.logEvent({
    eventType: 'PAYPAL_PAYMENT_DENIED',
    invoiceId,
    metadata: {
      reason: event.resource.reason
    }
  });
}

async function handlePaymentRefund(event: any) {
  const invoiceId = event.resource.invoice_id;
  
  await fetch(`${process.env.API_BASE_URL}/invoices/${invoiceId}/refund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Secret': process.env.INTERNAL_WEBHOOK_SECRET!
    },
    body: JSON.stringify({
      paymentMethod: 'paypal',
      amount: event.resource.amount.value,
      currency: event.resource.amount.currency_code
    })
  });

  await audit.logEvent({
    eventType: 'PAYPAL_REFUND_PROCESSED',
    invoiceId,
    metadata: {
      amount: event.resource.amount.value,
      currency: event.resource.amount.currency_code
    }
  });
}

function verifyPayPalSignature(req: NextApiRequest): boolean {
  // Implementation depends on PayPal's webhook verification SDK
  return true; // Simplified for example
}