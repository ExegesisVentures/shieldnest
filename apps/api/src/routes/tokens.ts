/**
 * Token Metadata API Routes
 * Handles CRUD operations for token metadata
 */

import express from 'express';
import { body, param, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { 
  getTokenMetadata, 
  upsertTokenMetadata, 
  getVerifiedTokens,
  cacheTokenImage,
  type TokenMetadata 
} from '../services/token-metadata.js';
import { tokenDiscovery } from '../services/token-discovery.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), '../../web/public/tokens');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const symbol = req.body.symbol?.toLowerCase() || 'unknown';
    const extension = path.extname(file.originalname) || '.svg';
    cb(null, `${symbol}${extension}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only SVG, PNG, JPEG, and WebP are allowed.'));
    }
  }
});

/**
 * GET /api/tokens/:denom - Get token metadata by denomination
 */
router.get('/:denom', 
  param('denom').notEmpty().withMessage('Denomination is required'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Invalid input', details: errors.array() });
      }

      const { denom } = req.params;
      const metadata = await getTokenMetadata(decodeURIComponent(denom));
      
      res.json({ success: true, data: metadata });
    } catch (error) {
      console.error('Error fetching token metadata:', error);
      res.status(500).json({ error: 'Failed to fetch token metadata' });
    }
  }
);

/**
 * GET /api/tokens - Get all verified tokens
 */
router.get('/', async (req, res) => {
  try {
    const tokens = await getVerifiedTokens();
    res.json({ success: true, data: tokens });
  } catch (error) {
    console.error('Error fetching verified tokens:', error);
    res.status(500).json({ error: 'Failed to fetch verified tokens' });
  }
});

/**
 * POST /api/tokens - Create or update token metadata (admin only)
 */
router.post('/',
  // authenticateToken, // Temporarily disabled for debugging
  body('denom').notEmpty().withMessage('Denomination is required'),
  body('symbol').notEmpty().withMessage('Symbol is required'),
  body('name').notEmpty().withMessage('Name is required'),
  body('decimals').isInt({ min: 0, max: 18 }).withMessage('Decimals must be between 0 and 18'),
  body('category').isIn(['native', 'fungible', 'nft', 'other']).withMessage('Invalid category'),
  body('isNative').isBoolean().withMessage('isNative must be boolean'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Invalid input', details: errors.array() });
      }

      const metadata: TokenMetadata = {
        denom: req.body.denom,
        symbol: req.body.symbol,
        name: req.body.name,
        decimals: parseInt(req.body.decimals),
        imageUrl: req.body.imageUrl,
        description: req.body.description,
        website: req.body.website,
        isNative: req.body.isNative,
        category: req.body.category,
        verified: req.body.verified || false,
        priority: parseInt(req.body.priority) || 0,
        explorerUrl: req.body.explorerUrl
      };

      await upsertTokenMetadata(metadata);
      
      res.json({ success: true, message: 'Token metadata updated successfully' });
    } catch (error) {
      console.error('Error updating token metadata:', error);
      res.status(500).json({ error: 'Failed to update token metadata' });
    }
  }
);

/**
 * POST /api/tokens/populate-images - Populate token images from reliable sources
 */
router.post('/populate-images',
  // authenticateToken, // Temporarily disabled for debugging
  async (req, res) => {
    try {
      const { populateTokenImages } = await import('../scripts/populate-token-images.js');
      await populateTokenImages();
      
      res.json({ 
        success: true, 
        message: 'Token images populated successfully from Coreum sources' 
      });
    } catch (error) {
      console.error('Error populating token images:', error);
      res.status(500).json({ 
        error: 'Failed to populate token images',
        details: error.message 
      });
    }
  }
);

/**
 * POST /api/tokens/:denom/image - Upload token image (admin only)
 */
router.post('/:denom/image',
  // authenticateToken, // Temporarily disabled for debugging
  upload.single('image'),
  param('denom').notEmpty().withMessage('Denomination is required'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Invalid input', details: errors.array() });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      const { denom } = req.params;
      const imageUrl = `/tokens/${req.file.filename}`;
      
      // Update token metadata with new image URL
      const existingMetadata = await getTokenMetadata(decodeURIComponent(denom));
      await upsertTokenMetadata({
        ...existingMetadata,
        imageUrl
      });

      res.json({ 
        success: true, 
        message: 'Token image uploaded successfully',
        imageUrl 
      });
    } catch (error) {
      console.error('Error uploading token image:', error);
      res.status(500).json({ error: 'Failed to upload token image' });
    }
  }
);

/**
 * POST /api/tokens/cache-image - Cache external token image (admin only)
 */
router.post('/cache-image',
  // authenticateToken, // Temporarily disabled for debugging
  body('imageUrl').isURL().withMessage('Valid image URL is required'),
  body('symbol').notEmpty().withMessage('Symbol is required'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Invalid input', details: errors.array() });
      }

      const { imageUrl, symbol } = req.body;
      const cachedImageUrl = await cacheTokenImage(imageUrl, symbol);
      
      res.json({ 
        success: true, 
        message: 'Token image cached successfully',
        imageUrl: cachedImageUrl 
      });
    } catch (error) {
      console.error('Error caching token image:', error);
      res.status(500).json({ error: 'Failed to cache token image' });
    }
  }
);

/**
 * POST /api/tokens/bulk-import - Bulk import token metadata from Coreum explorer (admin only)
 */
router.post('/bulk-import',
  // authenticateToken, // Temporarily disabled for debugging
  body('tokens').isArray().withMessage('Tokens array is required'),
  body('tokens.*.denom').notEmpty().withMessage('Each token must have a denomination'),
  body('tokens.*.symbol').notEmpty().withMessage('Each token must have a symbol'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Invalid input', details: errors.array() });
      }

      const { tokens } = req.body;
      const results = [];

      for (const tokenData of tokens) {
        try {
          const metadata: TokenMetadata = {
            denom: tokenData.denom,
            symbol: tokenData.symbol,
            name: tokenData.name || tokenData.symbol,
            decimals: tokenData.decimals || 6,
            imageUrl: tokenData.imageUrl || '/tokens/default.svg',
            description: tokenData.description,
            website: tokenData.website,
            isNative: tokenData.isNative || false,
            category: tokenData.category || 'fungible',
            verified: tokenData.verified || false,
            priority: tokenData.priority || 0,
            explorerUrl: tokenData.explorerUrl
          };

          await upsertTokenMetadata(metadata);
          results.push({ denom: tokenData.denom, status: 'success' });
        } catch (error) {
          console.error(`Error importing token ${tokenData.denom}:`, error);
          results.push({ denom: tokenData.denom, status: 'error', error: error.message });
        }
      }

      res.json({ 
        success: true, 
        message: 'Bulk import completed',
        results 
      });
    } catch (error) {
      console.error('Error in bulk import:', error);
      res.status(500).json({ error: 'Failed to complete bulk import' });
    }
  }
);

/**
 * POST /api/tokens/discover - Auto-discover tokens from multiple sources (admin only)
 */
router.post('/discover',
  // authenticateToken, // Temporarily disabled for debugging
  body('force').optional().isBoolean().withMessage('Force must be boolean'),
  body('includeImages').optional().isBoolean().withMessage('Include images must be boolean'),
  body('denoms').optional().isArray().withMessage('Denoms must be array'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Invalid input', details: errors.array() });
      }

      const { force = false, includeImages = true, denoms } = req.body;
      
      const results = await tokenDiscovery.discoverAndCacheTokens({
        force,
        includeImages,
        specificDenoms: denoms
      });

      res.json({ 
        success: true, 
        message: 'Token discovery completed',
        results 
      });
    } catch (error) {
      console.error('Error in token discovery:', error);
      res.status(500).json({ 
        error: error.message === 'Token discovery already in progress' 
          ? 'Token discovery already in progress' 
          : 'Failed to complete token discovery' 
      });
    }
  }
);

/**
 * GET /api/tokens/discovery/status - Get token discovery status
 */
router.get('/discovery/status', async (req, res) => {
  try {
    // Basic status info - you could expand this with more detailed tracking
    res.json({ 
      success: true, 
      data: {
        isRunning: false, // You'd track this in the service
        lastRun: null,    // You'd track this in the service
        nextRun: null     // You'd track this in the service
      }
    });
  } catch (error) {
    console.error('Error getting discovery status:', error);
    res.status(500).json({ error: 'Failed to get discovery status' });
  }
});

export default router;
