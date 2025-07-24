import { createHmac } from 'crypto';
import { NextApiRequest, NextApiResponse } from 'next';

const CLEARBIT_SECRET = process.env.CLEARBIT_HMAC_SECRET!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Validate input
  const email = req.body.email?.toString().trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Invalid email" });
  }

  try {
    // HMAC verification
    const hmac = createHmac('sha256', CLEARBIT_SECRET);
    hmac.update(email);
    const verifiedEmail = `${hmac.digest('hex')}@secured.invoicegod.com`;

    // Proxy request to Clearbit
    const domain = email.split('@')[1];
    const clearbitRes = await fetch(
      `https://company.clearbit.com/v2/companies/find?domain=${domain}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.CLEARBIT_API_KEY}`,
          'Content-Type': 'application/json',
          'X-Forwarded-Email': verifiedEmail // Privacy protection
        }
      }
    );

    if (!clearbitRes.ok) throw new Error("Clearbit API error");

    const data = await clearbitRes.json();
    
    // Sanitize response
    const safeData = {
      name: data.name || '',
      legalName: data.legalName || '',
      domain: data.domain || '',
      category: data.category?.name || '',
    };

    res.status(200).json(safeData);
  } catch (error) {
    console.error("Client scanner error:", error);
    res.status(500).json({ error: "Secure scanning failed" });
  }
}