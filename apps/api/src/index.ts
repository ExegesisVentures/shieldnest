import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from '@/lib/config';
import { prisma } from '@/lib/db';
import { 
  SecurityMiddlewareFactory, 
  secureCorsOptions,
  securityHeaders
} from '@/middleware/security';
import { EnvironmentValidator, SecureLogger } from '@/utils/security';
import { 
  securityHeaders as zeroTrustHeaders,
  corsOptions as zeroTrustCors,
  validateRequest,
  sanitizeInput,
  apiVersion,
  requestTimeout,
  apiRateLimit
} from '@/middleware/zero-trust';

// Routes
import authRoutes from '@/routes/auth';
import tmaRoutes from '@/routes/tma';
import pmaRoutes from '@/routes/pma';
import rewardsRoutes from '@/routes/rewards';
import stakingRoutes from '@/routes/staking';
import adminRoutes from '@/routes/admin';
import convertRoutes from '@/routes/convert';
import mintRoutes from '@/routes/mint';
import balancesRoutes from '@/routes/balances';
import usersRoutes from '@/routes/users';
import profileRoutes from '@/routes/profile';
import tokensRoutes from '@/routes/tokens';
import poolsRoutes from '@/routes/pools';

const app: Application = express();

// Validate security configuration on startup
const securityValidation = EnvironmentValidator.validateSecurityConfig();
if (!securityValidation.isValid) {
  console.error('❌ Security configuration validation failed:');
  securityValidation.errors.forEach(error => console.error(`  - ${error}`));
  
  // In serverless environments, throw an error instead of exiting
  if (process.env.VERCEL === '1') {
    throw new Error('Security configuration validation failed: ' + securityValidation.errors.join(', '));
  } else {
    process.exit(1);
  }
}

// Zero Trust Security Middleware Stack
app.use(zeroTrustHeaders); // Enhanced security headers
app.use(cors(zeroTrustCors)); // Strict CORS policy
app.use(requestTimeout(30000)); // 30 second timeout
app.use(validateRequest); // Request validation
app.use(sanitizeInput); // Input sanitization
app.use(apiVersion('v1')); // API versioning
app.use(apiRateLimit); // General rate limiting

// Apply legacy security middleware for compatibility
app.use(SecurityMiddlewareFactory.getPublicMiddleware());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      success: true,
      message: 'Roll NFT Dashboard API is healthy',
      timestamp: new Date().toISOString(),
      environment: config.server.nodeEnv,
      version: '1.0.0'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      error: 'Service unavailable',
      timestamp: new Date().toISOString()
    });
  }
});

// API routes with appropriate security middleware
// Note: Auth routes already have auth-specific rate limiting applied in SecurityMiddlewareFactory
app.use('/api/auth', authRoutes);
app.use('/api/admin', SecurityMiddlewareFactory.getSensitiveMiddleware(), adminRoutes);
app.use('/api/tma', tmaRoutes);
app.use('/api/pma', pmaRoutes);
app.use('/api/rewards', rewardsRoutes);
app.use('/api/staking', stakingRoutes);
app.use('/api/convert', convertRoutes);
app.use('/api/mint', mintRoutes);
app.use('/api/balances', balancesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/tokens', tokensRoutes);
app.use('/api/pools', poolsRoutes);

// Config endpoint (for development)
app.get('/api/config', (req, res) => {
  res.json({
    success: true,
    data: {
      chainId: config.chainId,
      contracts: config.contracts,
      pricing: config.pricing,
      supply: config.supply,
      rewards: config.rewards,
      accessGating: config.accessGating,
      marketplaceFees: config.marketplaceFees
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  SecureLogger.logSecure('error', 'Unhandled server error', {
    error: error.message,
    stack: config.server.nodeEnv === 'development' ? error.stack : undefined,
    path: req.path,
    method: req.method,
    ip: req.ip
  });
  
  res.status(error.status || 500).json({
    success: false,
    error: config.server.nodeEnv === 'development' 
      ? error.message 
      : 'Internal server error'
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Only start server if not in Vercel serverless environment
// When deployed to Vercel, the export is used directly
if (process.env.VERCEL !== '1') {
  const PORT = config.server.port;

  app.listen(PORT, () => {
    console.log(`🚀 Roll NFT Dashboard API server running on port ${PORT}`);
    console.log(`📡 Environment: ${config.server.nodeEnv}`);
    console.log(`🔗 Frontend URL: ${config.server.frontendUrl}`);
    console.log(`💾 Database: Connected to Supabase`);
    console.log(`⛓️  Chain: ${config.chainId}`);
    console.log(`📝 Health check: http://localhost:${PORT}/health`);
    
    // Configuration validation warnings
    if (config.databaseUrl.includes('localhost')) {
      console.warn('⚠️  WARNING: Database URL points to localhost - should use Supabase!');
    }
    if (!config.databaseUrl.includes('cucnmhpguyynfknmxrtt.supabase.co')) {
      console.warn('⚠️  WARNING: Database URL does not match expected Supabase project!');
    }
    if (config.server.frontendUrl !== 'http://localhost:3000') {
      console.warn('⚠️  WARNING: Frontend URL does not match expected localhost:3000!');
    }
  });
} else {
  console.log('🚀 Roll NFT Dashboard API running in Vercel serverless mode');
  console.log(`📡 Environment: ${config.server.nodeEnv}`);
  console.log(`🔗 Frontend URL: ${config.server.frontendUrl}`);
}

export default app;
