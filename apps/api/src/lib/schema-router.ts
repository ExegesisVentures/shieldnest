/**
 * Schema Router - Ensures correct database schema usage
 * Prevents mix-ups between MVP and Development schemas
 */

export interface SchemaConfig {
  name: string;
  searchPath: string;
  environment: string;
  allowedOperations: string[];
  description: string;
}

export const SCHEMA_CONFIGS: Record<string, SchemaConfig> = {
  mvp: {
    name: 'mvp_production',
    searchPath: 'mvp_production',
    environment: 'mvp',
    allowedOperations: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
    description: 'Clean MVP production schema for users'
  },
  development: {
    name: 'public,dev',
    searchPath: 'public,dev',
    environment: 'development',
    allowedOperations: ['ALL'],
    description: 'Full development schema with all features'
  },
  production: {
    name: 'public',
    searchPath: 'public',
    environment: 'production',
    allowedOperations: ['ALL'],
    description: 'Full production schema'
  }
};

export class SchemaRouter {
  private currentSchema: SchemaConfig;

  constructor() {
    this.currentSchema = this.detectSchema();
  }

  private detectSchema(): SchemaConfig {
    const env = process.env.ENVIRONMENT || 'development';
    const schemaName = process.env.DATABASE_SCHEMA;
    const mvpMode = process.env.MVP_MODE === 'true';

    // Determine schema based on environment variables
    if (mvpMode || env === 'mvp') {
      return SCHEMA_CONFIGS.mvp;
    } else if (env === 'development') {
      return SCHEMA_CONFIGS.development;
    } else {
      return SCHEMA_CONFIGS.production;
    }
  }

  public getCurrentSchema(): SchemaConfig {
    return this.currentSchema;
  }

  public getDatabaseUrl(): string {
    const baseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL;
    
    if (!baseUrl) {
      throw new Error('Database URL not configured');
    }

    // If it's already a full postgres URL, modify the search_path
    if (baseUrl.startsWith('postgresql://')) {
      const url = new URL(baseUrl);
      url.searchParams.set('search_path', this.currentSchema.searchPath);
      return url.toString();
    }

    // For Supabase URLs, we'll handle schema routing in the client
    return baseUrl;
  }

  public validateOperation(operation: string): boolean {
    const allowedOps = this.currentSchema.allowedOperations;
    
    if (allowedOps.includes('ALL')) {
      return true;
    }

    const upperOp = operation.toUpperCase();
    return allowedOps.some(op => upperOp.startsWith(op));
  }

  public getSchemaPrefix(): string {
    if (this.currentSchema.name === 'mvp_production') {
      return 'mvp_production.';
    }
    return ''; // Default to public schema
  }

  public logSchemaUsage(operation: string, table?: string): void {
    console.log(`🗄️ Schema: ${this.currentSchema.name} | Operation: ${operation}${table ? ` | Table: ${table}` : ''}`);
  }

  public validateSchemaAccess(): void {
    const gitBranch = process.env.GIT_BRANCH || 'unknown';
    const environment = process.env.ENVIRONMENT || 'unknown';

    console.log('🔍 Schema Access Validation:');
    console.log(`   Environment: ${environment}`);
    console.log(`   Git Branch: ${gitBranch}`);
    console.log(`   Schema: ${this.currentSchema.name}`);
    console.log(`   Description: ${this.currentSchema.description}`);

    // Validate branch permissions
    if (this.currentSchema.name === 'mvp_production' && gitBranch !== 'mvp-production') {
      console.warn(`⚠️ Warning: Using MVP schema from non-MVP branch (${gitBranch})`);
    }

    if (this.currentSchema.name !== 'mvp_production' && gitBranch === 'mvp-production') {
      console.warn(`⚠️ Warning: Using development schema from MVP branch`);
    }
  }
}

// Global schema router instance
export const schemaRouter = new SchemaRouter();

// Middleware for Express.js
export function schemaMiddleware(req: any, res: any, next: any) {
  // Add schema info to request
  req.schema = schemaRouter.getCurrentSchema();
  req.schemaRouter = schemaRouter;

  // Log schema usage
  schemaRouter.logSchemaUsage(req.method, req.path);

  next();
}

// Helper function for database queries
export function buildQuery(baseQuery: string, table: string): string {
  const prefix = schemaRouter.getSchemaPrefix();
  
  // Replace table references with schema-prefixed versions
  if (prefix && !baseQuery.includes(prefix)) {
    return baseQuery.replace(new RegExp(`\\b${table}\\b`, 'g'), `${prefix}${table}`);
  }
  
  return baseQuery;
}

// Environment validation
export function validateEnvironment(): void {
  const requiredVars = ['ENVIRONMENT', 'DATABASE_SCHEMA', 'SUPABASE_URL'];
  const missing = requiredVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  schemaRouter.validateSchemaAccess();
}
