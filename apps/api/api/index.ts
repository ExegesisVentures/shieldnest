// Vercel serverless function entry point
// This file wraps the Express app for Vercel's serverless environment

import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../src/index';

// Export handler for Vercel serverless
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Forward the request to the Express app
  return app(req, res);
}

