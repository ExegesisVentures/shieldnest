# 🎯 Roll NFT Dashboard

A secure, enterprise-grade NFT dashboard built with Next.js, Express, and Supabase, implementing zero trust architecture and comprehensive security measures.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Server    │    │   Database      │
│   (Next.js)     │◄──►│   (Express)     │◄──►│   (Supabase)    │
│   Port 3000     │    │   Port 3001     │    │   PostgreSQL    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Supabase account
- Vercel account (for deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/ExegesisVentures/roll2.git
   cd roll2
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   # API Environment
   cp apps/api/env.template apps/api/.env
   # Edit apps/api/.env with your values
   
   # Web Environment  
   cp apps/web/env.template apps/web/.env
   # Edit apps/web/.env with your values
   ```

4. **Start development servers**
   ```bash
   # Terminal 1 - API Server
   cd apps/api && pnpm dev
   
   # Terminal 2 - Web Application
   cd apps/web && pnpm dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - API: http://localhost:3001
   - Health Check: http://localhost:3001/health

## 🔒 Security Features

### Zero Trust Architecture
- **API Gateway**: Secure external API communication
- **Rate Limiting**: Multiple tiers (auth, API, sensitive operations)
- **Input Sanitization**: Comprehensive input validation
- **Request Validation**: Content-type and size validation
- **Security Headers**: Enhanced headers via Helmet
- **CORS Policy**: Strict origin validation

### Database Security
- **Row Level Security (RLS)**: User data isolation
- **Service Role Access**: Backend-only privileged operations
- **Parameterized Queries**: SQL injection prevention
- **Connection Pooling**: Secure connection management

### Authentication & Authorization
- **JWT Tokens**: Secure token-based authentication
- **Wallet Authentication**: Coreum wallet signature verification
- **Multi-factor Support**: Email + wallet authentication
- **Session Management**: Secure session handling

### Environment Security
- **No Secrets in Code**: All secrets via environment variables
- **Environment Isolation**: Separate dev/staging/prod
- **Template Files**: Secure environment setup
- **Key Rotation**: Regular secret rotation support

## 📁 Project Structure

```
roll2/
├── apps/
│   ├── api/                    # Express API server
│   │   ├── src/
│   │   │   ├── middleware/     # Security & auth middleware
│   │   │   ├── routes/         # API endpoints
│   │   │   ├── services/       # Business logic
│   │   │   ├── utils/          # Utilities
│   │   │   └── types/          # TypeScript types
│   │   ├── env.template        # Environment template
│   │   └── vercel.json         # Vercel deployment config
│   └── web/                    # Next.js frontend
│       ├── src/
│       │   ├── components/     # React components
│       │   ├── pages/          # Next.js pages
│       │   ├── hooks/          # Custom hooks
│       │   ├── contexts/       # React contexts
│       │   └── utils/          # Frontend utilities
│       ├── env.template        # Environment template
│       └── vercel.json         # Vercel deployment config
├── supabase/
│   └── rls_setup.sql          # Database security policies
├── scripts/
│   └── security-audit.js      # Security audit script
├── .github/
│   └── workflows/
│       └── deploy.yml         # CI/CD pipeline
└── docs/
    ├── DEPLOYMENT_GUIDE.md    # Deployment instructions
    └── SECURITY_IMPLEMENTATION.md # Security documentation
```

## 🛠️ Development

### Available Scripts

```bash
# Install dependencies
pnpm install

# Development
pnpm dev                    # Start both API and web in dev mode
cd apps/api && pnpm dev     # Start API server only
cd apps/web && pnpm dev     # Start web app only

# Building
pnpm build                  # Build both applications
cd apps/api && pnpm build   # Build API only
cd apps/web && pnpm build   # Build web only

# Testing
pnpm test                   # Run all tests
pnpm lint                   # Lint all code
pnpm type-check            # TypeScript type checking

# Security
node scripts/security-audit.js  # Run security audit
```

### Code Quality

- **TypeScript**: Strict type checking
- **ESLint**: Code linting with security rules
- **Prettier**: Code formatting
- **Husky**: Git hooks for quality checks

## 🚀 Deployment

### Automated Deployment (Recommended)

The project includes GitHub Actions for automated deployment:

1. **Push to `develop`**: Deploys to staging environment
2. **Push to `main`**: Deploys to production environment

### Manual Deployment

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

### Environment Setup

1. **Supabase Setup**
   - Create main project
   - Create development branch
   - Apply RLS policies from `supabase/rls_setup.sql`

2. **Vercel Setup**
   - Create API project (apps/api)
   - Create Web project (apps/web)
   - Configure environment variables

3. **GitHub Secrets**
   - Add all required secrets for CI/CD
   - Configure branch protection rules

## 🔐 Security

### Security Audit

Run the security audit before deployment:

```bash
node scripts/security-audit.js
```

### Security Checklist

- [ ] No `.env` files committed
- [ ] All secrets in environment variables
- [ ] RLS policies applied to database
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] Dependencies audited
- [ ] File permissions secure

### Reporting Security Issues

Please report security vulnerabilities to: security@rollnft.com

## 📚 Documentation

- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Complete deployment instructions
- [Security Implementation](SECURITY_IMPLEMENTATION.md) - Security architecture details
- [Developer Notes](DEVELOPER_NOTES.md) - Development best practices
- [API Documentation](apps/api/README.md) - API endpoints and usage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run security audit: `node scripts/security-audit.js`
5. Run tests: `pnpm test`
6. Submit a pull request

### Development Guidelines

- Follow the senior developer principles in `DEVELOPER_NOTES.md`
- Implement proper error handling
- Add comprehensive tests
- Update documentation
- Run security checks

## 📊 Monitoring

### Health Checks

- **API Health**: `GET /health`
- **Database**: Connection verification
- **Environment**: Configuration validation

### Logging

- **Security Events**: Authentication, authorization, errors
- **Performance**: Request timing, database queries
- **Errors**: Comprehensive error tracking

## 🔧 Configuration

### Environment Variables

#### API Server
```bash
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
JWT_SECRET=...
MAGIC_LINK_SECRET=...
```

#### Web Application
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

See `env.template` files for complete configuration options.

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify DATABASE_URL is correct
   - Check Supabase project status
   - Ensure RLS policies are applied

2. **Authentication Failures**
   - Verify Supabase keys match
   - Check JWT secret configuration
   - Ensure user exists in database

3. **CORS Errors**
   - Verify frontend URL in API config
   - Check CORS middleware configuration
   - Ensure domains are whitelisted

### Debug Commands

```bash
# Check API health
curl http://localhost:3001/health

# Test database connection
psql "your_database_url" -c "SELECT 1;"

# View logs
cd apps/api && pnpm logs
cd apps/web && pnpm logs
```

## 📄 License

This project is proprietary and confidential. All rights reserved.

## 📞 Support

- **Technical Issues**: Create an issue on GitHub
- **Security Issues**: security@rollnft.com
- **General Questions**: support@rollnft.com

---

**Built with ❤️ by the Roll NFT Team**

Last Updated: October 1, 2025