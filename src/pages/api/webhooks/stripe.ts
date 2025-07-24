import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { verifySignature } from '../../../lib/webhookSecurity';
import { AuditLogger } from '../../../core/audit/auditLogger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-08-16',
  typescript: true
});

const audit = AuditLogger.getInstance();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verify Stripe signature
  const signature = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      (req as any).rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    await audit.logSecurityEvent('STRIPE_WEBHOOK_FAILURE', {
      error: err.message,
      ip: req.socket.remoteAddress
    });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle event types
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
      break;
    case 'charge.dispute.created':
      await handleDisputeCreated(event.data.object as Stripe.Dispute);
      break;
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.Invoice);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.status(200).json({ received: true });
}

async function handlePaymentSuccess(payment: Stripe.PaymentIntent) {
  const invoiceId = payment.metadata.invoiceId;
  if (!invoiceId) return;

  try {
    // Update invoice status
    await fetch(`${process.env.API_BASE_URL}/invoices/${invoiceId}/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': process.env.INTERNAL_WEBHOOK_SECRET!
      },
      body: JSON.stringify({
        paymentMethod: 'stripe',
        transactionId: payment.id,
        amount: payment.amount / 100, // Convert to dollars
        currency: payment.currency
      })
    });

    await audit.logEvent({
      eventType: 'PAYMENT_SUCCESS',
      invoiceId,
      metadata: {
        paymentId: payment.id,
        amount: payment.amount,
        currency: payment.currency
      }
    });
  } catch (error) {
    await audit.logSecurityEvent('PAYMENT_SYNC_FAILURE', {
      invoiceId,
      error: error.message
    });
  }
}

async function handleDisputeCreated(dispute: Stripe.Dispute) {
  const invoiceId = dispute.metadata?.invoiceId;
  if (!invoiceId) return;

  try {
    const resolutionService = new DisputeResolutionService();
    await resolutionService.processDispute({
      invoiceId,
      reason: dispute.reason || 'unknown',
      amount: dispute.amount / 100,
      currency: dispute.currency,
      raisedBy: dispute.evidence?.customer_email_address || 'unknown',
      counterparty: process.env.STRIPE_ACCOUNT_EMAIL!,
      evidence: [
        {
          type: 'stripe_dispute',
          content: dispute
        }
      ]
    });

    await audit.logEvent({
      eventType: 'DISPUTE_CREATED',
      invoiceId,
      metadata: {
        disputeId: dispute.id,
        reason: dispute.reason
      }
    });
  } catch (error) {
    await audit.logSecurityEvent('DISPUTE_HANDLING_FAILURE', {
      invoiceId,
      error: error.message
    });
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerEmail = invoice.customer_email;
  if (!customerEmail) return;

  try {
    await sendEmail({
      to: customerEmail,
      subject: 'Payment Failed',
      template: 'payment_failed',
      data: {
        invoiceId: invoice.id,
        amountDue: invoice.amount_due / 100,
        attemptCount: invoice.attempt_count
      }
    });

    await audit.logEvent({
      eventType: 'PAYMENT_FAILURE',
      metadata: {
        invoiceId: invoice.id,
        customer: customerEmail
      }
    });
  } catch (error) {
    console.error('Failed to send payment failure email:', error);
  }
}