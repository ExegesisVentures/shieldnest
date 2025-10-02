/**
 * Get/Create/Update User Profile (Serverless)
 * File: apps/web/pages/api/users/profile.ts
 */

import { NextApiResponse } from 'next';
import { prisma } from '../../../../lib/api-shared/db';
import { withAuth } from '../../../../lib/api-shared/middleware';
import { AuthenticatedRequest } from '../../../../lib/api-shared/types';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Get current user profile
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

      return res.json({
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
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch user profile'
      });
    }
  } else if (req.method === 'POST') {
    // Create or update user profile with email
    try {
      const { email, name } = req.body;

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Valid email is required'
        });
      }

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

      return res.json({
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
      return res.status(500).json({
        success: false,
        error: 'Failed to create/update user profile'
      });
    }
  } else if (req.method === 'PUT') {
    // Update user profile
    try {
      const { email, name } = req.body;

      const updates: any = {};
      if (email) updates.email = email;
      if (name !== undefined) updates.name = name;

      // If updating email, check if it's already taken
      if (email) {
        const existingUser = await prisma.user.findUnique({
          where: { email }
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

      return res.json({
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
      return res.status(500).json({
        success: false,
        error: 'Failed to update user profile'
      });
    }
  } else {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}

export default withAuth(handler);

