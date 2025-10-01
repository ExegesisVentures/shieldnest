import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { SecurityHeaders, SecureLogger, SecurityValidator } from '@/utils/security';
import { config } from '@/lib/config';

/**
 * Modular security middleware for the Roll NFT API
 * File: apps/api/src/middleware/security.ts
 */

/**
 * Apply security headers to all responses
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  SecurityHeaders.applyToResponse(res);
  next();
};

/**
 * Enhanced rate limiting for authentication endpoints
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 100 : 5, // More attempts in development
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again in 15 minutes.',
    retryAfter: 15 * 60 // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use IP + endpoint for more granular rate limiting
    return SecurityValidator.generateRateLimitKey(req.ip, req.path);
  },
  handler: (req, res) => {
    SecureLogger.logSecure('warn', 'Rate limit exceeded for auth endpoint', {
      ip: req.ip,
      path: req.path,
      userAgent: req.get('User-Agent')
    });
    
    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts. Please try again in 15 minutes.',
      retryAfter: 15 * 60
    });
  }
});

/**
 * General API rate limiting
 */
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    error: 'Too many requests. Please try again later.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return SecurityValidator.generateRateLimitKey(req.ip, 'api');
  }
});

/**
 * Strict rate limiting for sensitive operations
 */
export const sensitiveOperationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Only 3 sensitive operations per hour
  message: {
    success: false,
    error: 'Too many sensitive operations. Please try again in 1 hour.',
    retryAfter: 60 * 60
  },
  keyGenerator: (req) => {
    return SecurityValidator.generateRateLimitKey(req.ip, 'sensitive');
  }
});

/**
 * Input validation and sanitization middleware
 */
export const validateAndSanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Sanitize string inputs in body
    if (req.body && typeof req.body === 'object') {
      for (const key in req.body) {
        if (typeof req.body[key] === 'string') {
          req.body[key] = SecurityValidator.sanitizeInput(req.body[key]);
        }
      }
    }

    // Validate email if present
    if (req.body?.email && !SecurityValidator.isValidEmail(req.body.email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Validate Coreum address if present
    if (req.body?.address && !SecurityValidator.isValidCoreumAddress(req.body.address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Coreum address format'
      });
    }

    next();
  } catch (error) {
    SecureLogger.logSecure('error', 'Input validation error', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(400).json({
      success: false,
      error: 'Invalid input data'
    });
  }
};

/**
 * Request logging middleware with security considerations
 */
export const secureRequestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Only log in development or if compliance logging is enabled
  if (config.server.nodeEnv === 'development' || config.observability.enableComplianceLogging) {
    SecureLogger.logSecure('info', 'API Request', {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
  }

  // Log response time and status
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    if (config.server.nodeEnv === 'development' || config.observability.enableComplianceLogging) {
      SecureLogger.logSecure('info', 'API Response', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip
      });
    }
  });

  next();
};

/**
 * CORS configuration with security considerations
 */
export const secureCorsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is allowed
    const allowedOrigins = [
      config.server.frontendUrl,
      'http://localhost:3000',
      'https://localhost:3000'
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      SecureLogger.logSecure('warn', 'CORS violation', { origin, allowedOrigins });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count'],
  optionsSuccessStatus: 200,
  maxAge: 86400 // 24 hours
};

/**
 * Content Security Policy middleware
 */
export const contentSecurityPolicy = (req: Request, res: Response, next: NextFunction) => {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'", // Consider removing unsafe-inline in production
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https://cucnmhpguyynfknmxrtt.supabase.co https://full-node.mainnet-1.coreum.dev",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');

  res.setHeader('Content-Security-Policy', csp);
  next();
};

/**
 * Body size limit middleware
 */
export const bodySizeLimit = (req: Request, res: Response, next: NextFunction) => {
  const contentLength = parseInt(req.get('content-length') || '0', 10);
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (contentLength > maxSize) {
    return res.status(413).json({
      success: false,
      error: 'Request body too large'
    });
  }

  next();
};

/**
 * Security middleware factory for different endpoint types
 */
export class SecurityMiddlewareFactory {
  /**
   * Get security middleware stack for public endpoints
   */
  static getPublicMiddleware() {
    return [
      securityHeaders,
      contentSecurityPolicy,
      bodySizeLimit,
      apiRateLimit,
      validateAndSanitizeInput,
      secureRequestLogger
    ];
  }

  /**
   * Get security middleware stack for authentication endpoints
   */
  static getAuthMiddleware() {
    return [
      securityHeaders,
      contentSecurityPolicy,
      bodySizeLimit,
      authRateLimit,
      validateAndSanitizeInput,
      secureRequestLogger
    ];
  }

  /**
   * Get security middleware stack for sensitive operations
   */
  static getSensitiveMiddleware() {
    return [
      securityHeaders,
      contentSecurityPolicy,
      bodySizeLimit,
      sensitiveOperationRateLimit,
      validateAndSanitizeInput,
      secureRequestLogger
    ];
  }
}
