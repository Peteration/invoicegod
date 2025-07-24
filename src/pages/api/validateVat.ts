import type { NextApiRequest, NextApiResponse } from 'next';
import VAT from 'eu-vat';
import { createRateLimiter } from '../../lib/rateLimiter';

const limiter = createRateLimiter({
  maxRequests: 5,
  windowMs: 60 * 1000 
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    await limiter.check(res, 5, 'CACHE_TOKEN'); // 5 requests per minute

    const { vatNumber } = req.query;
    
    if (!vatNumber || typeof vatNumber !== 'string') {
      return res.status(400).json({ error: 'Invalid VAT number format' });
    }

    // Clean input
    const cleanVat = vatNumber.toUpperCase().replace(/\s+/g, '');

    // Validate format first
    if (!/^EU[A-Z]{2}[0-9A-Z]{8,12}$/.test(cleanVat)) {
      return res.status(400).json({ valid: false, error: 'Invalid format' });
    }

    // Remove EU prefix for validation library
    const result = await VAT.validate(cleanVat.replace('EU', ''));

    // Return sanitized response
    res.status(200).json({
      valid: result.valid,
      company: result.valid ? {
        name: result.name || '',
        address: result.address || ''
      } : null
    });
    
  } catch (error) {
    if (error instanceof Error && error.message === 'Rate limit exceeded') {
      return res.status(429).json({ error: 'Too many requests' });
    }
    
    console.error('VAT validation error:', error);
    res.status(500).json({ error: 'Validation service unavailable' });
  }
}