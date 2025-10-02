// Vercel serverless function entry point
// This file wraps the Express app for Vercel's serverless environment

import app from '../src/index';

// Export the Express app as a Vercel serverless function
export default app;

