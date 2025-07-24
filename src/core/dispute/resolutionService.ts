import { Dispute, Evidence, ResolutionOutcome } from './disputeTypes';
import { sendEmail } from '../notification/emailService';
import { createSecureApiClient } from '../../lib/api';
import { AuditLogger } from '../audit/auditLogger';

const EVIDENCE_THRESHOLD = 3; // Minimum pieces of evidence required
const AUTO_RESOLUTION_DAYS = 7; // Time before auto-resolution

export class DisputeResolutionService {
  private api = createSecureApiClient();
  private audit = AuditLogger.getInstance();

  async processDispute(dispute: Dispute): Promise<ResolutionOutcome> {
    // Validate dispute
    if (!dispute.invoiceId || !dispute.reason) {
      throw new Error('Invalid dispute: missing required fields');
    }

    // Check for existing resolution
    const existing = await this.getExistingResolution(dispute.invoiceId);
    if (existing) return existing;

    // Gather evidence
    const evidence = await this.gatherEvidence(dispute);
    if (evidence.length < EVIDENCE_THRESHOLD) {
      await this.requestAdditionalEvidence(dispute);
      return 'pending';
    }

    // Automated decision logic
    const decision = this.makeDecision(dispute, evidence);
    
    // Apply resolution
    await this.applyResolution(dispute, decision);

    // Notify parties
    await this.notifyParties(dispute, decision);

    // Audit log
    await this.audit.logEvent({
      eventType: 'DISPUTE_RESOLUTION',
      invoiceId: dispute.invoiceId,
      metadata: {
        decision,
        evidenceCount: evidence.length
      }
    });

    return decision;
  }

  private async getExistingResolution(invoiceId: string) {
    const response = await this.api.get(`/disputes/${invoiceId}`);
    return response.data?.resolution as ResolutionOutcome | null;
  }

  private async gatherEvidence(dispute: Dispute): Promise<Evidence[]> {
    const evidence: Evidence[] = [];
    
    // 1. Invoice data
    const invoice = await this.api.get(`/invoices/${dispute.invoiceId}`);
    evidence.push({
      type: 'invoice',
      content: invoice.data,
      weight: 0.4
    });

    // 2. Payment proof
    const payment = await this.api.get(`/payments/${invoice.data.paymentId}`);
    evidence.push({
      type: 'payment',
      content: payment.data,
      weight: 0.3
    });

    // 3. Communication history
    const comms = await this.api.get(`/communications?invoice=${dispute.invoiceId}`);
    evidence.push({
      type: 'communications',
      content: comms.data,
      weight: 0.2
    });

    // 4. Additional uploaded evidence
    if (dispute.evidence) {
      evidence.push(...dispute.evidence.map(e => ({
        type: 'user_upload',
        content: e,
        weight: 0.1
      })));
    }

    return evidence;
  }

  private async requestAdditionalEvidence(dispute: Dispute) {
    await sendEmail({
      to: dispute.raisedBy,
      subject: 'Additional Evidence Required',
      template: 'dispute_evidence_request',
      data: {
        invoiceId: dispute.invoiceId,
        deadline: new Date(Date.now() + AUTO_RESOLUTION_DAYS * 24 * 60 * 60 * 1000)
      }
    });

    await this.api.post(`/disputes/${dispute.invoiceId}/request_evidence`, {
      requestedAt: new Date().toISOString()
    });
  }

  private makeDecision(dispute: Dispute, evidence: Evidence[]): ResolutionOutcome {
    // Simple scoring mechanism (expand with ML in production)
    let score = 0;
    
    for (const e of evidence) {
      if (e.type === 'invoice') {
        if (e.content.status === 'paid') score += 40;
      }
      if (e.type === 'payment') {
        if (e.content.status === 'confirmed') score += 30;
      }
      if (e.type === 'user_upload') {
        score += 10 * e.weight;
      }
    }

    // Adjust based on dispute reason
    if (dispute.reason.includes('undelivered')) score -= 20;
    if (dispute.reason.includes('quality')) score -= 10;

    return score >= 60 ? 'seller_favor' : 'buyer_favor';
  }

  private async applyResolution(dispute: Dispute, decision: ResolutionOutcome) {
    if (decision === 'buyer_favor') {
      await this.api.post(`/payments/${dispute.invoiceId}/refund`, {
        amount: dispute.amount,
        reason: 'dispute_resolution'
      });
    }

    await this.api.patch(`/disputes/${dispute.invoiceId}`, {
      status: 'resolved',
      resolution: decision,
      resolvedAt: new Date().toISOString()
    });
  }

  private async notifyParties(dispute: Dispute, decision: ResolutionOutcome) {
    const template = decision === 'seller_favor' 
      ? 'dispute_resolved_seller' 
      : 'dispute_resolved_buyer';

    await sendEmail({
      to: dispute.raisedBy,
      subject: `Dispute Resolution: ${decision}`,
      template,
      data: { invoiceId: dispute.invoiceId }
    });

    await sendEmail({
      to: dispute.counterparty,
      subject: `Dispute Resolution: ${decision}`,
      template,
      data: { invoiceId: dispute.invoiceId }
    });
  }
}