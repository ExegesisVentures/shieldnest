# ShieldNest Documentation

Welcome to ShieldNest - A comprehensive DeFi platform built on Cosmos ecosystem.

## Project Structure

```
shieldnest/
├── apps/
│   └── web/                 # Next.js web application
├── services/
│   └── agents/              # Multi-agent orchestrator service
├── packages/
│   └── shared/              # Shared types and utilities
├── docs/                    # Documentation
└── tokens/                  # Token icons and assets
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm 8+

### Installation

```bash
# Install dependencies for all workspaces
npm install

# Start development server
npm run dev
```

### Development

```bash
# Run all services in development mode
npm run dev

# Build all packages
npm run build

# Run linting
npm run lint

# Run tests
npm run test
```

## Architecture

- **Web App**: Next.js application with TypeScript
- **Shared Package**: Common types and utilities
- **Agent Service**: Multi-agent orchestrator for AI-powered features
- **Monorepo**: Managed with Turborepo for efficient builds

## Contributing

Please read our contributing guidelines before submitting pull requests.
