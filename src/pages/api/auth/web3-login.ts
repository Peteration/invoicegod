import type { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';
import jwt from 'jsonwebtoken';
import { UserModel } from '../../../core/database/models';
import { AuditLogger } from '../../../core/audit/auditLogger';

const audit = AuditLogger.getInstance();

interface Web3LoginRequest {
  address: string;
  signature: string;
  nonce: string;
}

interface Web3LoginResponse {
  token?: string;
  user?: any;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Web3LoginResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { address, signature, nonce }: Web3LoginRequest = req.body;

  try {
    // Verify signature
    const signerAddr = ethers.utils.verifyMessage(
      `InvoiceGod Authentication: ${nonce}`,
      signature
    );

    if (signerAddr.toLowerCase() !== address.toLowerCase()) {
      await audit.logSecurityEvent('WEB3_LOGIN_FAILURE', {
        reason: 'Address mismatch',
        clientAddress: address,
        recoveredAddress: signerAddr
      });
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Find or create user
    let user = await UserModel.findOne({ walletAddress: address.toLowerCase() });

    if (!user) {
      user = await UserModel.create({
        walletAddress: address.toLowerCase(),
        nonce: Math.floor(Math.random() * 1000000).toString(),
        createdAt: new Date()
      });
    } else {
      // Rotate nonce after successful login
      user.nonce = Math.floor(Math.random() * 1000000).toString();
      await user.save();
    }

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user._id,
        address: user.walletAddress
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    await audit.logEvent({
      eventType: 'WEB3_LOGIN_SUCCESS',
      userId: user._id,
      metadata: { address }
    });

    return res.status(200).json({
      token,
      user: {
        id: user._id,
        address: user.walletAddress,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    await audit.logSecurityEvent('WEB3_LOGIN_ERROR', {
      error: error.message,
      address
    });
    return res.status(500).json({ error: 'Authentication failed' });
  }
}