/** @type {import('next').NextConfig} */
const nextConfig = {
  // Experimental features for Next.js 15
  experimental: {
    optimizeCss: false, // Disable CSS optimization that can cause HMR issues
    scrollRestoration: false,
    // Disable problematic features in development that cause HMR conflicts
    ...(process.env.NODE_ENV === 'development' && {
      disableOptimizedLoading: true, // Disable optimized loading in dev
    })
  },

  // Turbopack configuration (moved from experimental.turbo)
  turbopack: {
    rules: {},
    // Disable problematic HMR features
    ...(process.env.NODE_ENV === 'development' && {
      resolveExtensions: ['.tsx', '.ts', '.js', '.jsx'],
    })
  },
  
  // Development server optimization
  devIndicators: {
    position: 'bottom-right',
  },
  
  // Disable ISR and problematic features in development
  ...(process.env.NODE_ENV === 'development' && {
    generateBuildId: () => 'development-build',
    // Disable static generation features that conflict with HMR
    trailingSlash: false,
    // Ensure proper HMR behavior
    onDemandEntries: {
      maxInactiveAge: 60 * 1000,
      pagesBufferLength: 5,
    },
    // Disable features that trigger ISR messages
    outputFileTracingRoot: undefined,
  }),
  
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Enhanced HMR-friendly configuration
      config.watchOptions = {
        ignored: [
          '**/node_modules/**',
          '**/.pnpm/**',
          '**/.git/**',
          '**/.next/**'
        ],
        aggregateTimeout: 300,
        poll: false
      };
      
      // Reduce logging noise and HMR conflicts
      config.stats = 'errors-warnings';
      config.infrastructureLogging = {
        level: 'error'
      };

      // Suppress specific HMR-related warnings
      config.ignoreWarnings = [
        /Cannot read properties of undefined \(reading 'components'\)/,
        /Invalid message.*isrManifest/,
        /handleStaticIndicator/,
        /hot-reloader-pages\.js/,
        /processMessage/,
      ];

      // Prevent HMR from trying to update non-existent components
      if (config.optimization) {
        config.optimization.removeAvailableModules = false;
        config.optimization.removeEmptyChunks = false;
        config.optimization.splitChunks = false;
      }

      // Improve HMR reliability
      config.resolve = {
        ...config.resolve,
        alias: {
          ...config.resolve.alias,
          // Ensure React HMR works properly
          'react-dom$': 'react-dom/profiling',
          'scheduler/tracing': 'scheduler/tracing-profiling',
        },
      };

      // Configure HMR options to prevent ISR manifest errors
      if (config.devServer) {
        config.devServer.hot = true;
        config.devServer.liveReload = false; // Use only HMR, not live reload
      }

      // Override HMR plugin configuration
      const hmrPlugin = config.plugins?.find(
        plugin => plugin?.constructor?.name === 'HotModuleReplacementPlugin'
      );
      if (hmrPlugin) {
        // Configure HMR to ignore ISR manifest messages
        hmrPlugin.options = {
          ...hmrPlugin.options,
          multiStep: false,
        };
      }
    }
    return config;
  }
};

module.exports = nextConfig;