import type { NextApiRequest, NextApiResponse } from 'next';
import plaid from 'plaid';
import { AuditLogger } from '../../../core/audit/auditLogger';

const audit = AuditLogger.getInstance();

const client = new plaid.Client({
  clientID: process.env.PLAID_CLIENT_ID!,
  secret: process.env.PLAID_SECRET!,
  env: plaid.environments[process.env.PLAID_ENV! as keyof typeof plaid.environments],
  options: { version: '2020-09-14' }
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verify webhook
  if (!verifyPlaidWebhook(req)) {
    await audit.logSecurityEvent('PLAID_WEBHOOK_INVALID', {
      ip: req.socket.remoteAddress
    });
    return res.status(401).json({ error: 'Invalid webhook' });
  }

  const event = req.body;
  try {
    switch (event.webhook_type) {
      case 'TRANSACTIONS':
        await handleTransactionEvent(event);
        break;
      case 'ITEM':
        await handleItemEvent(event);
        break;
      case 'AUTH':
        await handleAuthEvent(event);
        break;
      default:
        console.log(`Unhandled Plaid event: ${event.webhook_type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    await audit.logSecurityEvent('PLAID_WEBHOOK_ERROR', {
      error: error.message
    });
    res.status(500).json({ error: 'Processing failed' });
  }
}

async function handleTransactionEvent(event: any) {
  if (event.webhook_code === 'SYNC_UPDATES_AVAILABLE') {
    const { added, modified, removed } = await client.getTransactionsUpdates(
      event.item_id,
      event.new_transactions
    );

    // Process payment transactions
    for (const tx of added) {
      if (tx.payment_meta && tx.payment_meta.invoice_id) {
        await fetch(`${process.env.API_BASE_URL}/invoices/${tx.payment_meta.invoice_id}/pay`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Secret': process.env.INTERNAL_WEBHOOK_SECRET!
          },
          body: JSON.stringify({
            paymentMethod: 'bank',
            transactionId: tx.transaction_id,
            amount: tx.amount,
            currency: 'USD'
          })
        });

        await audit.logEvent({
          eventType: 'BANK_PAYMENT_RECEIVED',
          invoiceId: tx.payment_meta.invoice_id,
          metadata: {
            amount: tx.amount,
            bank: tx.name
          }
        });
      }
    }
  }
}

async function handleItemEvent(event: any) {
  if (event.webhook_code === 'ERROR') {
    await audit.logSecurityEvent('PLAID_ITEM_ERROR', {
      itemId: event.item_id,
      error: event.error.error_message
    });
  }
}

async function handleAuthEvent(event: any) {
  if (event.webhook_code === 'AUTOMATICALLY_VERIFIED') {
    await audit.logEvent({
      eventType: 'BANK_ACCOUNT_VERIFIED',
      userId: event.item_id,
      metadata: {
        accountId: event.account_id
      }
    });
  }
}

function verifyPlaidWebhook(req: NextApiRequest): boolean {
  const signature = req.headers['plaid-verification'] as string;
  // Actual verification requires comparing with PLAID_SIGNING_KEY
  return !!signature; // Simplified for example
}