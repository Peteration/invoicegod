import type { NextApiRequest, NextApiResponse } from 'next';
import { createSecureApiClient } from '../../../../lib/api';
import { generatePDFReceipt } from '../../../../core/pdf/receiptGenerator';
import { verifySignature } from '../../../../lib/webhookSecurity';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verify API signature
  if (!verifySignature(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;
  const api = createSecureApiClient(req.headers.authorization);

  try {
    // Fetch invoice data
    const invoiceRes = await api.get(`/invoices/${id}`);
    const invoice = invoiceRes.data;

    // Generate PDF receipt
    const pdfBuffer = await generatePDFReceipt(invoice);

    // Set headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=InvoiceGod_Receipt_${invoice.id}.pdf`
    );

    // Send PDF
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Receipt generation failed:', error);
    return res.status(500).json({ error: 'Failed to generate receipt' });
  }
}