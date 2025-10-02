import { Request, Response, NextFunction } from 'express';
import { SecureLogger } from '@/utils/security';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

/**
 * Zero Trust Security Middleware
 * Implements defense-in-depth security principles
 */

// Rate limiting configurations for different endpoints
export const createRateLimit = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: { success: false, error: message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      SecureLogger.logSecure('warn', 'Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        userAgent: req.get('User-Agent')
      });
      res.status(429).json({ success: false, error: message });
    }
  });
};

// Different rate limits for different endpoint types
export const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts
  'Too many authentication attempts, please try again later'
);

export const apiRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests
  'Too many API requests, please try again later'
);

export const strictRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  10, // 10 requests
  'Too many requests to sensitive endpoint, please try again later'
);

/**
 * Security headers middleware using Helmet
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://cucnmhpguyynfknmxrtt.supabase.co"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding for wallet connections
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

/**
 * Request validation middleware
 */
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  // Log all requests for security monitoring
  SecureLogger.logSecure('info', 'API Request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    origin: req.get('Origin'),
    referer: req.get('Referer')
  });

  // Validate content type for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
      SecureLogger.logSecure('warn', 'Invalid content type', {
        contentType,
        method: req.method,
        path: req.path,
        ip: req.ip
      });
      return res.status(400).json({
        success: false,
        error: 'Content-Type must be application/json'
      });
    }
  }

  // Validate request size (already handled by express.json limit, but log large requests)
  const contentLength = req.get('Content-Length');
  if (contentLength && parseInt(contentLength) > 1024 * 1024) { // 1MB
    SecureLogger.logSecure('warn', 'Large request detected', {
      contentLength,
      path: req.path,
      ip: req.ip
    });
  }

  next();
};

/**
 * CORS configuration for zero trust
 */
export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Get frontend URL from environment variable
    const frontendUrl = process.env.FRONTEND_URL;
    
    // Define allowed origins based on environment
    const allowedOrigins = process.env.NODE_ENV === 'production' 
      ? [
          frontendUrl,
          'https://*.vercel.app' // Allow all Vercel preview deployments
        ].filter(Boolean) // Remove undefined values
      : [
          'http://localhost:3000',
          'http://localhost:3003',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:3003',
          frontendUrl
        ].filter(Boolean);

    // Check if origin matches allowed origins (including wildcard for Vercel)
    const isAllowed = allowedOrigins.some(allowed => {
      if (!allowed) return false;
      if (allowed === origin) return true;
      // Support wildcard domains like *.vercel.app
      if (allowed.includes('*')) {
        const domain = allowed.replace('https://*.', '').replace('*.', '');
        return origin.endsWith(domain);
      }
      return false;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      SecureLogger.logSecure('warn', 'CORS violation', { origin, allowedOrigins });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // 24 hours
};

/**
 * Input sanitization middleware
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Recursively sanitize object
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      // Remove potentially dangerous characters
      return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+\s*=/gi, '')
                .trim();
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitize(obj[key]);
        }
      }
      return sanitized;
    }
    
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  
  if (req.query) {
    req.query = sanitize(req.query);
  }

  next();
};

/**
 * API versioning middleware
 */
export const apiVersion = (version: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    req.apiVersion = version;
    res.setHeader('API-Version', version);
    next();
  };
};

/**
 * Request timeout middleware
 */
export const requestTimeout = (timeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        SecureLogger.logSecure('warn', 'Request timeout', {
          path: req.path,
          method: req.method,
          ip: req.ip,
          timeout: timeoutMs
        });
        res.status(408).json({
          success: false,
          error: 'Request timeout'
        });
      }
    }, timeoutMs);

    res.on('finish', () => {
      clearTimeout(timeout);
    });

    next();
  };
};

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      apiVersion?: string;
    }
  }
}
