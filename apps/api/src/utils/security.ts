import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { config } from '@/lib/config';

/**
 * Security utilities module for cryptographic operations and secure data handling
 * File: apps/api/src/utils/security.ts
 */

export interface SecureTokenPayload {
  userId: string;
  walletId?: string;
  email?: string;
  purpose: string;
  iat?: number;
  exp?: number;
}

export interface JwtOptions {
  expiresIn?: string | number;
  issuer?: string;
  audience?: string;
}

/**
 * Token generation and verification utilities
 */
export class SecureTokenManager {
  /**
   * Generate a secure JWT token with the given payload
   */
  static generateJWT(payload: SecureTokenPayload, options: JwtOptions = {}): string {
    const defaultOptions: JwtOptions = {
      expiresIn: '7d',
      issuer: 'roll-nft-api',
      audience: 'roll-nft-dashboard'
    };

    const mergedOptions = { ...defaultOptions, ...options };
    
    return jwt.sign(payload, config.auth.jwtSecret, mergedOptions);
  }

  /**
   * Verify and decode a JWT token
   */
  static verifyJWT<T extends SecureTokenPayload>(token: string): T {
    try {
      return jwt.verify(token, config.auth.jwtSecret) as T;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error(`Invalid token: ${error.message}`);
      }
      throw new Error('Token verification failed');
    }
  }

  /**
   * Generate a secure magic link token
   */
  static generateMagicLinkToken(payload: SecureTokenPayload): string {
    const magicPayload = {
      ...payload,
      purpose: 'magic-link'
    };

    return jwt.sign(magicPayload, config.auth.magicLinkSecret, {
      expiresIn: '15m',
      issuer: 'roll-nft-api'
    });
  }

  /**
   * Verify a magic link token
   */
  static verifyMagicLinkToken<T extends SecureTokenPayload>(token: string): T {
    try {
      const decoded = jwt.verify(token, config.auth.magicLinkSecret) as T;
      
      if (decoded.purpose !== 'magic-link') {
        throw new Error('Invalid token purpose');
      }
      
      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error(`Invalid magic link token: ${error.message}`);
      }
      throw new Error('Magic link token verification failed');
    }
  }
}

/**
 * Cryptographic utilities for secure operations
 */
export class CryptoUtils {
  /**
   * Generate a cryptographically secure random string
   */
  static generateSecureRandom(bytes: number = 32): string {
    return crypto.randomBytes(bytes).toString('hex');
  }

  /**
   * Generate a secure session ID
   */
  static generateSessionId(): string {
    return this.generateSecureRandom(16);
  }

  /**
   * Generate a secure nonce for wallet signatures
   */
  static generateNonce(): string {
    return this.generateSecureRandom(16);
  }

  /**
   * Hash a password using a secure algorithm
   */
  static async hashPassword(password: string): Promise<string> {
    const bcrypt = await import('bcryptjs');
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify a password against its hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    const bcrypt = await import('bcryptjs');
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate a secure API key
   */
  static generateApiKey(): string {
    const prefix = 'rn_'; // roll-nft prefix
    const key = this.generateSecureRandom(24);
    return `${prefix}${key}`;
  }
}

/**
 * Input sanitization and validation utilities
 */
export class SecurityValidator {
  /**
   * Sanitize user input to prevent XSS
   */
  static sanitizeInput(input: string): string {
    if (typeof input !== 'string') {
      throw new Error('Input must be a string');
    }

    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate Coreum address format
   */
  static isValidCoreumAddress(address: string): boolean {
    // Coreum addresses start with 'core' and are bech32 encoded
    const coreumRegex = /^core[a-z0-9]{39}$/;
    return coreumRegex.test(address);
  }

  /**
   * Validate UUID format
   */
  static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Rate limit key generator for consistent rate limiting
   */
  static generateRateLimitKey(ip: string, endpoint: string): string {
    return `rate_limit:${ip}:${endpoint}`;
  }
}

/**
 * Security headers configuration
 */
export class SecurityHeaders {
  /**
   * Get security headers for Express responses
   */
  static getSecurityHeaders() {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
    };
  }

  /**
   * Apply security headers to response
   */
  static applyToResponse(res: any) {
    const headers = this.getSecurityHeaders();
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
  }
}

/**
 * Secure logging utilities that prevent sensitive data exposure
 */
export class SecureLogger {
  /**
   * Log data while masking sensitive information
   */
  static logSecure(level: 'info' | 'warn' | 'error', message: string, data?: any) {
    const sanitizedData = data ? this.sanitizeLogData(data) : undefined;
    
    // Only log in development or if explicitly enabled
    if (config.server.nodeEnv === 'development' || config.observability.enableComplianceLogging) {
      console[level](`[${new Date().toISOString()}] ${message}`, sanitizedData);
    }
  }

  /**
   * Sanitize log data to remove sensitive information
   */
  private static sanitizeLogData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sanitized = { ...data };
    const sensitiveKeys = [
      'password', 'token', 'secret', 'key', 'auth', 'authorization',
      'privateKey', 'mnemonic', 'seed', 'jwt', 'cookie'
    ];

    for (const key in sanitized) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitizeLogData(sanitized[key]);
      }
    }

    return sanitized;
  }
}

/**
 * Environment validation utilities
 */
export class EnvironmentValidator {
  /**
   * Validate that required environment variables are set and secure
   */
  static validateSecurityConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check JWT secret strength
    if (!config.auth.jwtSecret || config.auth.jwtSecret.length < 64) {
      errors.push('JWT_SECRET must be at least 64 characters long');
    }

    // Check Magic Link secret strength
    if (!config.auth.magicLinkSecret || config.auth.magicLinkSecret.length < 64) {
      errors.push('MAGIC_LINK_SECRET must be at least 64 characters long');
    }

    // Check for placeholder values
    if (config.auth.jwtSecret.includes('your_jwt_secret_here')) {
      errors.push('JWT_SECRET contains placeholder value - replace with secure secret');
    }

    if (config.auth.magicLinkSecret.includes('your_magic_link_secret_here')) {
      errors.push('MAGIC_LINK_SECRET contains placeholder value - replace with secure secret');
    }

    // Check database URL security
    if (config.databaseUrl.includes('localhost') && config.server.nodeEnv === 'production') {
      errors.push('DATABASE_URL should not use localhost in production');
    }

    // Check Oracle key presence (warning, not error as it might be optional)
    if (config.oracle.privateKey.includes('your_oracle_signing_key')) {
      console.warn('⚠️  Oracle private key contains placeholder value');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
