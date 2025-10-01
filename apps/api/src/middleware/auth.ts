import { Request, Response, NextFunction } from 'express';
import { config } from '@/lib/config';
import { prisma } from '@/lib/db';
import { AuthenticatedRequest, JwtPayload } from '@/types';
import { SecureTokenManager, SecureLogger } from '@/utils/security';

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      SecureLogger.logSecure('warn', 'Authentication failed: Missing or invalid authorization header', {
        ip: req.ip,
        path: req.path
      });
      return res.status(401).json({
        success: false,
        error: 'Missing or invalid authorization header'
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      SecureLogger.logSecure('warn', 'Authentication failed: No token provided', {
        ip: req.ip,
        path: req.path
      });
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }
    
    const decoded = SecureTokenManager.verifyJWT<JwtPayload>(token);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        wallets: true,
        tmaConsents: {
          where: { 
            tma: { isActive: true } 
          },
          include: { tma: true }
        }
      }
    });

    if (!user) {
      SecureLogger.logSecure('warn', 'Authentication failed: User not found', {
        userId: decoded.userId,
        ip: req.ip,
        path: req.path
      });
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    req.user = user;

    // If walletId is in token, add wallet to request
    if (decoded.walletId) {
      const wallet = user.wallets.find(w => w.id === decoded.walletId);
      if (wallet) {
        req.wallet = wallet;
      }
    }

    SecureLogger.logSecure('info', 'Authentication successful', {
      userId: user.id,
      path: req.path
    });
    next();
  } catch (error) {
    SecureLogger.logSecure('error', 'Authentication error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
      path: req.path
    });
    
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};

export const requireTMA = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!config.accessGating.requireTma) {
      return next();
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Check if user has signed current TMA version
    const currentTMA = await prisma.tMA.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    if (!currentTMA) {
      return res.status(500).json({
        success: false,
        error: 'No active TMA found'
      });
    }

    const tmaConsent = await prisma.tMAConsent.findFirst({
      where: {
        userId: req.user.id,
        version: currentTMA.version
      }
    });

    if (!tmaConsent) {
      return res.status(403).json({
        success: false,
        error: 'TMA signature required',
        data: {
          requiresTMA: true,
          tmaVersion: currentTMA.version,
          tmaHash: currentTMA.hash
        }
      });
    }

    next();
  } catch (error) {
    console.error('TMA verification error:', error);
    return res.status(500).json({
      success: false,
      error: 'TMA verification failed'
    });
  }
};

export const requireWallet = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.wallet) {
    return res.status(400).json({
      success: false,
      error: 'Wallet connection required'
    });
  }
  next();
};
