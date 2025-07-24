import type { NextApiRequest, NextApiResponse } from 'next';
import { GDPRService } from '../../../core/compliance/gdprService';
import { createRateLimiter } from '../../../lib/rateLimiter';
import { verifySignature } from '../../../lib/webhookSecurity';

const limiter = createRateLimiter({
  maxRequests: 3, 
  windowMs: 24 * 60 * 60 * 1000 // 24 hours
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verify HMAC signature
  if (!verifySignature(req)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  try {
    await limiter.check(res, req.body.userId);

    const { userId, reason } = req.body;
    
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const gdpr = new GDPRService();
    const success = await gdpr.deleteUserData(userId);

    if (success) {
      // Log deletion event
      await fetch(process.env.AUDIT_LOG_WEBHOOK!, {
        method: 'POST',
        body: JSON.stringify({
          event: 'GDPR_DELETION',
          userId,
          reason,
          timestamp: new Date().toISOString()
        })
      });

      return res.status(200).json({ success: true });
    }

    return res.status(500).json({ error: 'Deletion failed' });
  } catch (error) {
    if (error instanceof Error && error.message === 'Rate limit exceeded') {
      return res.status(429).json({ error: 'Deletion quota exceeded' });
    }
    
    console.error('GDPR deletion error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}