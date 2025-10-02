import { NextApiRequest, NextApiResponse } from 'next';
import { config } from './config';
import { prisma } from './db';
import { AuthenticatedRequest, JwtPayload } from './types';
import { SecureTokenManager, SecureLogger, SecurityHeaders } from './security';

/**
 * Middleware wrapper for Next.js API routes
 */
export type ApiHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void>;
export type AuthenticatedApiHandler = (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>;

/**
 * CORS middleware for serverless functions
 */
export const corsMiddleware = (req: NextApiRequest, res: NextApiResponse) => {
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'https://roll-nft-dashboard.vercel.app'
  ];

  const origin = req.headers.origin;
  
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  
  return false;
};

/**
 * Apply security headers to response
 */
export const securityMiddleware = (req: NextApiRequest, res: NextApiResponse) => {
  SecurityHeaders.applyToResponse(res);
};

/**
 * Authentication middleware for protected routes
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: NextApiResponse
): Promise<boolean> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      SecureLogger.logSecure('warn', 'Authentication failed: Missing or invalid authorization header', {
        ip: req.socket.remoteAddress,
        path: req.url
      });
      res.status(401).json({
        success: false,
        error: 'Missing or invalid authorization header'
      });
      return false;
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      SecureLogger.logSecure('warn', 'Authentication failed: No token provided', {
        ip: req.socket.remoteAddress,
        path: req.url
      });
      res.status(401).json({
        success: false,
        error: 'No token provided'
      });
      return false;
    }
    
    const decoded = SecureTokenManager.verifyJWT<JwtPayload>(token);
    console.log('🔐 [DEBUG] JWT decoded successfully:', {
      userId: decoded.userId,
      walletId: decoded.walletId,
      purpose: decoded.purpose
    });

    // Get user from database
    console.log('🗄️ [DEBUG] Fetching user from database:', { userId: decoded.userId });
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
    
    console.log('🗄️ [DEBUG] User database query result:', {
      userFound: !!user,
      userId: user?.id,
      userEmail: user?.email,
      walletCount: user?.wallets?.length || 0,
      tmaConsentCount: user?.tmaConsents?.length || 0
    });

    if (!user) {
      SecureLogger.logSecure('warn', 'Authentication failed: User not found', {
        userId: decoded.userId,
        ip: req.socket.remoteAddress,
        path: req.url
      });
      res.status(401).json({
        success: false,
        error: 'User not found'
      });
      return false;
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
      path: req.url
    });
    
    return true;
  } catch (error) {
    SecureLogger.logSecure('error', 'Authentication error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.socket.remoteAddress,
      path: req.url
    });
    
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
    return false;
  }
};

/**
 * Require TMA middleware
 */
export const requireTMA = async (
  req: AuthenticatedRequest,
  res: NextApiResponse
): Promise<boolean> => {
  try {
    if (!config.accessGating.requireTma) {
      return true;
    }

    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return false;
    }

    // Check if user has signed current TMA version
    const currentTMA = await prisma.tMA.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    if (!currentTMA) {
      res.status(500).json({
        success: false,
        error: 'No active TMA found'
      });
      return false;
    }

    const tmaConsent = await prisma.tMAConsent.findFirst({
      where: {
        userId: req.user.id,
        version: currentTMA.version
      }
    });

    if (!tmaConsent) {
      res.status(403).json({
        success: false,
        error: 'TMA signature required',
        data: {
          requiresTMA: true,
          tmaVersion: currentTMA.version,
          tmaHash: currentTMA.hash
        }
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error('TMA verification error:', error);
    res.status(500).json({
      success: false,
      error: 'TMA verification failed'
    });
    return false;
  }
};

/**
 * Require wallet middleware
 */
export const requireWallet = (
  req: AuthenticatedRequest,
  res: NextApiResponse
): boolean => {
  if (!req.wallet) {
    res.status(400).json({
      success: false,
      error: 'Wallet connection required'
    });
    return false;
  }
  return true;
};

/**
 * Compose middleware with API handler
 */
export const withMiddleware = (
  handler: ApiHandler,
  middlewares: Array<(req: NextApiRequest, res: NextApiResponse) => Promise<boolean> | boolean | void> = []
) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Always apply CORS
      if (corsMiddleware(req, res)) {
        return; // Was OPTIONS request
      }

      // Always apply security headers
      securityMiddleware(req, res);

      // Run additional middlewares
      for (const middleware of middlewares) {
        const result = await middleware(req, res);
        if (result === false) {
          return; // Middleware rejected request
        }
      }

      // Run the actual handler
      await handler(req, res);
    } catch (error) {
      console.error('API Error:', error);
      
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: config.server.nodeEnv === 'development' 
            ? (error instanceof Error ? error.message : 'Internal server error')
            : 'Internal server error'
        });
      }
    }
  };
};

/**
 * Compose authenticated middleware with API handler
 */
export const withAuth = (handler: AuthenticatedApiHandler) => {
  return withMiddleware(handler as ApiHandler, [authenticate]);
};

