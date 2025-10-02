/**
 * Admin Middleware for Serverless Functions
 * File: apps/web/src/lib/api-shared/admin-middleware.ts
 */

import { NextApiResponse } from 'next';
import { AuthenticatedRequest } from './types';

// Simple admin check - in production, this should be more robust
export const requireAdmin = (
  req: AuthenticatedRequest,
  res: NextApiResponse
): boolean => {
  // For now, check if user email contains "admin" or specific admin emails
  // In production, you'd have proper admin role management
  const adminEmails = [
    'admin@roll-nft.com',
    'mj@roll-nft.com', // Add your admin email
    // Add more admin emails as needed
  ];

  // Also check admin wallet addresses
  const adminWallets = [
    'core1eg7rdhf8mz8dhkxq6r2dtfkxkyds3330gkkfkj', // Your specified admin wallet
  ];
  
  const userEmail = req.user?.email;
  const userWallets = req.user?.wallets?.map(w => w.address) || [];
  
  const isAdminEmail = userEmail && adminEmails.includes(userEmail);
  const isAdminWallet = userWallets.some(address => adminWallets.includes(address));
  
  if (!isAdminEmail && !isAdminWallet) {
    res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
    return false;
  }
  
  return true;
};

