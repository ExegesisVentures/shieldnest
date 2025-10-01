import { Router } from 'express';
import { authenticate, requireWallet } from '@/middleware/auth';
import { AuthenticatedRequest } from '@/types';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { SecureTokenManager } from '@/utils/security';

const router = Router();

// Validation schemas
const createUserProfileSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(1, 'Name is required').optional(),
});

const updateUserProfileSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  name: z.string().min(1, 'Name cannot be empty').optional(),
});

const linkWalletSchema = z.object({
  walletAddress: z.string().min(1, 'Wallet address is required'),
  chain: z.string().default('coreum'),
});

/**
 * Get current user profile
 */
router.get('/profile', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        wallets: {
          select: {
            id: true,
            address: true,
            chain: true,
            verifiedAt: true,
            createdAt: true,
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        wallets: user.wallets
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile'
    });
  }
});

/**
 * Create or update user profile with email
 */
router.post('/profile', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const validation = createUserProfileSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input',
        details: validation.error.issues
      });
    }

    const { email, name } = validation.data;

    // Check if email is already taken by another user
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser && existingUser.id !== req.user!.id) {
      return res.status(409).json({
        success: false,
        error: 'Email already in use by another account'
      });
    }

    // Update or create user profile
    const user = await prisma.user.upsert({
      where: { id: req.user!.id },
      update: { email, name },
      create: {
        id: req.user!.id,
        email,
        name
      },
      include: {
        wallets: {
          select: {
            id: true,
            address: true,
            chain: true,
            verifiedAt: true,
            createdAt: true,
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        wallets: user.wallets
      }
    });
  } catch (error) {
    console.error('Error creating/updating user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create/update user profile'
    });
  }
});

/**
 * Update user profile
 */
router.put('/profile', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const validation = updateUserProfileSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input',
        details: validation.error.issues
      });
    }

    const updates = validation.data;

    // If updating email, check if it's already taken
    if (updates.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: updates.email }
      });

      if (existingUser && existingUser.id !== req.user!.id) {
        return res.status(409).json({
          success: false,
          error: 'Email already in use by another account'
        });
      }
    }

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: updates,
      include: {
        wallets: {
          select: {
            id: true,
            address: true,
            chain: true,
            verifiedAt: true,
            createdAt: true,
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        wallets: user.wallets
      }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user profile'
    });
  }
});

/**
 * Link a wallet address to the user's profile
 */
router.post('/wallets', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const validation = linkWalletSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input',
        details: validation.error.issues
      });
    }

    const { walletAddress, chain } = validation.data;

    // Validate Coreum address format
    if (chain === 'coreum' && (!walletAddress.startsWith('core1') || walletAddress.length < 39)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Coreum address format'
      });
    }

    // Check if wallet is already linked to another user
    const existingWallet = await prisma.wallet.findUnique({
      where: {
        address_chain: {
          address: walletAddress,
          chain: chain
        }
      }
    });

    if (existingWallet && existingWallet.userId !== req.user!.id) {
      return res.status(409).json({
        success: false,
        error: 'Wallet address already linked to another account'
      });
    }

    // Create or update wallet link
    const wallet = await prisma.wallet.upsert({
      where: {
        address_chain: {
          address: walletAddress,
          chain: chain
        }
      },
      update: {
        userId: req.user!.id,
        verifiedAt: new Date() // Auto-verify for now
      },
      create: {
        userId: req.user!.id,
        address: walletAddress,
        chain: chain,
        verifiedAt: new Date() // Auto-verify for now
      }
    });

    res.json({
      success: true,
      data: {
        id: wallet.id,
        address: wallet.address,
        chain: wallet.chain,
        verifiedAt: wallet.verifiedAt,
        createdAt: wallet.createdAt
      }
    });
  } catch (error) {
    console.error('Error linking wallet:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to link wallet'
    });
  }
});

/**
 * Remove a wallet from user's profile
 */
router.delete('/wallets/:walletId', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const walletId = req.params.walletId;

    // Verify the wallet belongs to the user
    const wallet = await prisma.wallet.findFirst({
      where: {
        id: walletId,
        userId: req.user!.id
      }
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found or does not belong to you'
      });
    }

    await prisma.wallet.delete({
      where: { id: walletId }
    });

    res.json({
      success: true,
      message: 'Wallet removed successfully'
    });
  } catch (error) {
    console.error('Error removing wallet:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove wallet'
    });
  }
});

/**
 * Find user by wallet address (for linking addresses to profiles)
 */
router.get('/by-wallet/:address', async (req, res) => {
  try {
    const walletAddress = req.params.address;

    // Validate address format
    if (!walletAddress.startsWith('core1') || walletAddress.length < 39) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Coreum address format'
      });
    }

    const wallet = await prisma.wallet.findUnique({
      where: {
        address_chain: {
          address: walletAddress,
          chain: 'coreum'
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true
          }
        }
      }
    });

    if (!wallet || !wallet.user) {
      return res.status(404).json({
        success: false,
        error: 'No user found for this wallet address'
      });
    }

    res.json({
      success: true,
      data: {
        wallet: {
          id: wallet.id,
          address: wallet.address,
          chain: wallet.chain,
          verifiedAt: wallet.verifiedAt
        },
        user: wallet.user
      }
    });
  } catch (error) {
    console.error('Error finding user by wallet:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find user'
    });
  }
});

/**
 * Create user profile with email for manual address (no authentication required)
 */
router.post('/create-profile', async (req, res) => {
  try {
    const validation = z.object({
      email: z.string().email('Invalid email format'),
      name: z.string().min(1, 'Name is required').optional(),
      walletAddress: z.string().min(1, 'Wallet address is required'),
      chain: z.string().default('coreum'),
    }).safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input',
        details: validation.error.issues
      });
    }

    const { email, name, walletAddress, chain } = validation.data;

    // Validate Coreum address format
    if (chain === 'coreum' && (!walletAddress.startsWith('core1') || walletAddress.length < 39)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Coreum address format'
      });
    }

    // Check if email already exists
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUserByEmail) {
      return res.status(409).json({
        success: false,
        error: 'Email already in use'
      });
    }

    // Check if wallet already exists
    const existingWallet = await prisma.wallet.findUnique({
      where: {
        address_chain: {
          address: walletAddress,
          chain: chain
        }
      }
    });

    if (existingWallet) {
      return res.status(409).json({
        success: false,
        error: 'Wallet address already linked to an account'
      });
    }

    // Create user and wallet in transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name
        }
      });

      const wallet = await tx.wallet.create({
        data: {
          userId: user.id,
          address: walletAddress,
          chain: chain,
          verifiedAt: new Date()
        }
      });

      return { user, wallet };
    });

    // Generate JWT token for automatic login
    const token = SecureTokenManager.generateJWT({
      userId: result.user.id,
      walletId: result.wallet.id,
      purpose: 'email-auth'
    });

    res.json({
      success: true,
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          createdAt: result.user.createdAt
        },
        wallet: {
          id: result.wallet.id,
          address: result.wallet.address,
          chain: result.wallet.chain,
          verifiedAt: result.wallet.verifiedAt
        },
        token: token
      }
    });
  } catch (error) {
    console.error('Error creating user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create user profile'
    });
  }
});

export default router;
