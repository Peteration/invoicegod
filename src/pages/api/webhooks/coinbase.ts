import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { AuditLogger } from '../../../core/audit/auditLogger';

const audit = AuditLogger.getInstance();

interface CoinbaseEvent {
  id: string;
  type: string;
  data: {
    id: string;
    code: string;
    metadata: {
      invoiceId: string;
    };
    payments: Array<{
      value: {
        local: {
          amount: string;
          currency: string;
        };
      };
      network: string;
      transaction_id: string;
    }>;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verify webhook signature
  const rawBody = JSON.stringify(req.body);
  const signature = req.headers['x-cc-webhook-signature'] as string;
  const secret = process.env.COINBASE_WEBHOOK_SECRET!;

  const hmac = crypto.createHmac('sha256', secret);
  const computedSignature = hmac.update(rawBody).digest('hex');

  if (computedSignature !== signature) {
    await audit.logSecurityEvent('COINBASE_WEBHOOK_INVALID_SIGNATURE', {
      ip: req.socket.remoteAddress
    });
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event: CoinbaseEvent = req.body;

  try {
    switch (event.type) {
      case 'charge:confirmed':
        await handleConfirmedPayment(event.data);
        break;
      case 'charge:failed':
        await handleFailedPayment(event.data);
        break;
      case 'charge:delayed':
        await handleDelayedPayment(event.data);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    await audit.logSecurityEvent('COINBASE_WEBHOOK_ERROR', {
      error: error.message,
      eventId: event.id
    });
    res.status(500).json({ error: 'Processing failed' });
  }
}

async function handleConfirmedPayment(data: CoinbaseEvent['data']) {
  const invoiceId = data.metadata.invoiceId;
  const payment = data.payments[0];

  await fetch(`${process.env.API_BASE_URL}/invoices/${invoiceId}/pay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Secret': process.env.INTERNAL_WEBHOOK_SECRET!
    },
    body: JSON.stringify({
      paymentMethod: 'coinbase',
      transactionId: payment.transaction_id,
      amount: payment.value.local.amount,
      currency: payment.value.local.currency,
      network: payment.network
    })
  });

  await audit.logEvent({
    eventType: 'COINBASE_PAYMENT_CONFIRMED',
    invoiceId,
    metadata: {
      amount: payment.value.local.amount,
      currency: payment.value.local.currency,
      transactionId: payment.transaction_id
    }
  });
}

async function handleFailedPayment(data: CoinbaseEvent['data']) {
  const invoiceId = data.metadata.invoiceId;

  await fetch(`${process.env.API_BASE_URL}/invoices/${invoiceId}/payment-failed`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Secret': process.env.INTERNAL_WEBHOOK_SECRET!
    },
    body: JSON.stringify({
      paymentMethod: 'coinbase',
      invoiceId
    })
  });

  await audit.logEvent({
    eventType: 'COINBASE_PAYMENT_FAILED',
    invoiceId,
    metadata: {
      code: data.code
    }
  });
}

async function handleDelayedPayment(data: CoinbaseEvent['data']) {
  const invoiceId = data.metadata.invoiceId;

  await audit.logEvent({
    eventType: 'COINBASE_PAYMENT_DELAYED',
    invoiceId,
    metadata: {
      code: data.code
    }
  });
}