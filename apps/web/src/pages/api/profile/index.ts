/**
 * Get/Update User Profile (Serverless)
 * File: apps/web/pages/api/profile/index.ts
 */

import { NextApiResponse } from 'next';
import { prisma } from '../../../../lib/api-shared/db';
import { withAuth } from '../../../../lib/api-shared/middleware';
import { AuthenticatedRequest } from '../../../../lib/api-shared/types';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Get user profile
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: {
          wallets: {
            select: {
              id: true,
              chain: true,
              address: true,
              verifiedAt: true,
              createdAt: true
            }
          },
          userWallets: {
            select: {
              id: true,
              address: true,
              chain: true,
              label: true,
              isDefault: true,
              addedAt: true
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

      return res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          name: user.name,
          avatarUrl: user.avatarUrl,
          emailVerified: user.emailVerified,
          profileSettings: user.profileSettings,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
          wallets: user.wallets,
          userWallets: user.userWallets
        }
      });

    } catch (error) {
      console.error('Get profile error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch profile'
      });
    }
  } else if (req.method === 'PUT') {
    // Update user profile
    try {
      const { firstName, lastName, email, avatarUrl, profileSettings } = req.body;

      // Validate avatar URL if provided
      if (avatarUrl && typeof avatarUrl !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Avatar URL must be a string'
        });
      }

      // Validate email if provided
      if (email && typeof email !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Email must be a string'
        });
      }

      // Validate profile settings if provided
      if (profileSettings && typeof profileSettings !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Profile settings must be an object'
        });
      }

      // Check if user is updating from wallet-only account
      const currentUser = await prisma.user.findUnique({
        where: { id: req.user!.id }
      });

      const isWalletOnlyUser = currentUser?.email?.includes('@wallet.local');

      // If updating email from wallet.local, ensure new email doesn't already exist
      if (email && isWalletOnlyUser && email !== currentUser?.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email }
        });

        if (existingUser && existingUser.id !== req.user!.id) {
          return res.status(400).json({
            success: false,
            error: 'Email address is already registered'
          });
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id: req.user!.id },
        data: {
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          name: firstName && lastName ? `${firstName} ${lastName}` : firstName || undefined,
          email: email || undefined,
          avatarUrl: avatarUrl || undefined,
          profileSettings: profileSettings || undefined
        },
        include: {
          wallets: {
            select: {
              id: true,
              chain: true,
              address: true,
              verifiedAt: true,
              createdAt: true
            }
          },
          userWallets: {
            select: {
              id: true,
              address: true,
              chain: true,
              label: true,
              isDefault: true,
              addedAt: true
            }
          }
        }
      });

      return res.json({
        success: true,
        data: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          name: updatedUser.name,
          avatarUrl: updatedUser.avatarUrl,
          emailVerified: updatedUser.emailVerified,
          profileSettings: updatedUser.profileSettings,
          lastLoginAt: updatedUser.lastLoginAt,
          createdAt: updatedUser.createdAt,
          wallets: updatedUser.wallets,
          userWallets: updatedUser.userWallets
        }
      });

    } catch (error) {
      console.error('Update profile error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update profile'
      });
    }
  } else {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}

export default withAuth(handler);

