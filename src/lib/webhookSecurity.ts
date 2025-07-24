import { createHmac } from 'crypto';
import { IncomingMessage } from 'http';

export function verifySignature(req: IncomingMessage): boolean {
  const signature = req.headers['x-invoicegod-signature'];
  if (!signature) return false;

  const hmac = createHmac('sha256', process.env.WEBHOOK_SECRET!);
  const rawBody = (req as any).rawBody || '';
  hmac.update(rawBody);

  const calculatedSignature = `sha256=${hmac.digest('hex')}`;
  return signature === calculatedSignature;
}

export function validateWebhookOrigin(req: IncomingMessage): boolean {
  const allowedIps = [
    '52.31.139.75',  // Stripe Europe
    '52.28.192.241', // Stripe US
    '35.190.0.0/16'  // Google Cloud
  ];

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  return allowedIps.some(allowedIp => 
    ip?.includes(allowedIp) || 
    isIpInRange(ip, allowedIp)
  );
}

function isIpInRange(ip: string, range: string): boolean {
  // Implement CIDR range checking
  return false; // Simplified for brevity
}