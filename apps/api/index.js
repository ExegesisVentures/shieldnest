// Vercel serverless entry point
// This file is at the root of apps/api and Vercel will use it

// Import the compiled Express app
const app = require('./dist/index.js');

// Export for Vercel serverless
module.exports = app.default || app;

