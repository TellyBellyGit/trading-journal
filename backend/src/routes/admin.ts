// backend/src/routes/admin.ts
import express from 'express';
import { requireAdmin, authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';
import { prisma } from '../lib/prisma';

const router = express.Router();

// GET /api/admin/users - List all users with pagination and search
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const { 
      page = '1', 
      limit = '10', 
      search = '', 
      status = 'all' 
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause for filtering
    const whereClause: any = {};
    
    if (search) {
      whereClause.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (status === 'active') {
      whereClause.isActive = true;
    } else if (status === 'inactive') {
      whereClause.isActive = false;
    }

    // Get users with pagination including subscription data
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
          isAdmin: true,
          emailVerified: true,
          lastLogin: true,
          timezone: true,
          createdAt: true,
          updatedAt: true,
          subscription: {
            select: {
              plan: true,
              status: true,
              tradeCount: true,
              maxTrades: true,
              currentPeriodEnd: true
            }
          },
          _count: {
            select: {
              trades: true,
              notes: true,
              userBrokerAccounts: true,
              loginHistory: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.user.count({ where: whereClause })
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    res.json({
      users,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        limit: limitNum,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });

  } catch (error) {
    logger.error('Failed to fetch users', error, req);
    res.status(500).json({ 
      error: 'Failed to fetch users',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/admin/users/:id - Get detailed user information
router.get('/users/:id', requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        isAdmin: true,
        timezone: true,
        createdAt: true,
        updatedAt: true,
        subscription: {
          select: {
            plan: true,
            status: true,
            currentPeriodEnd: true,
            tradeCount: true,
            maxTrades: true
          }
        },
        _count: {
          select: {
            trades: true,
            notes: true,
            userBrokerAccounts: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get recent trades for activity overview
    const recentTrades = await prisma.trade.findMany({
      where: { userId },
      select: {
        id: true,
        symbol: true,
        direction: true,
        entryDate: true,
        exitDate: true,
        pnl: true,
        percentChange: true,
        status: true,
        createdAt: true,
        broker: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Get recent notes
    const recentNotes = await prisma.note.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        category: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Get trading performance summary
    const [totalPnL, winningTrades, losingTrades] = await Promise.all([
      prisma.trade.aggregate({
        where: { userId, status: 'Closed' },
        _sum: { pnl: true }
      }),
      prisma.trade.count({
        where: { userId, status: 'Closed', pnl: { gt: 0 } }
      }),
      prisma.trade.count({
        where: { userId, status: 'Closed', pnl: { lt: 0 } }
      })
    ]);

    const totalClosedTrades = winningTrades + losingTrades;
    const winRate = totalClosedTrades > 0 ? (winningTrades / totalClosedTrades) * 100 : 0;

    res.json({
      user,
      recentActivity: {
        trades: recentTrades,
        notes: recentNotes
      },
      tradingStats: {
        totalPnL: totalPnL._sum.pnl || 0,
        winningTrades,
        losingTrades,
        totalClosedTrades,
        winRate: Math.round(winRate * 100) / 100
      }
    });

  } catch (error) {
    logger.error('Failed to fetch user details', error, req);
    res.status(500).json({ 
      error: 'Failed to fetch user details',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PATCH /api/admin/users/:id - Update user status
router.patch('/users/:id', requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { isActive, isAdmin } = req.body;

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Validate request body
    if (typeof isActive !== 'boolean' && typeof isAdmin !== 'boolean') {
      return res.status(400).json({ 
        error: 'At least one field must be provided: isActive or isAdmin' 
      });
    }

    // Prevent admin from deactivating themselves
    if (req.user?.userId === userId && isActive === false) {
      return res.status(400).json({ 
        error: 'Cannot deactivate your own account' 
      });
    }

    // Prepare update data
    const updateData: any = {};
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (typeof isAdmin === 'boolean') updateData.isAdmin = isAdmin;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        isAdmin: true,
        updatedAt: true
      }
    });

    logger.info(`Admin ${req.user?.email} updated user ${updatedUser.email}`, req);

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });

  } catch (error) {
    logger.error('Failed to update user', error, req);
    res.status(500).json({ 
      error: 'Failed to update user',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/admin/users/:id/reset-trade-count - Reset user's monthly trade count
router.post('/users/:id/reset-trade-count', requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Check if user exists and has a subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        email: true, 
        firstName: true, 
        lastName: true,
        subscription: {
          select: {
            tradeCount: true,
            maxTrades: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.subscription) {
      return res.status(400).json({ error: 'User has no subscription' });
    }

    // Reset trade count using Prisma directly
    await prisma.subscription.update({
      where: { userId },
      data: {
        tradeCount: 0,
        periodStartDate: new Date()
      }
    });
    
    logger.info(`Admin ${req.user?.email} reset trade count for user ${user.email} (${user.firstName} ${user.lastName})`);
    
    res.json({ 
      success: true, 
      message: `Trade count reset successfully for ${user.firstName} ${user.lastName}`,
      resetData: {
        userId: user.id,
        userEmail: user.email,
        previousCount: user.subscription.tradeCount,
        newCount: 0
      }
    });
    
  } catch (error) {
    logger.error('Failed to reset trade count', error, req);
    res.status(500).json({ 
      error: 'Failed to reset trade count',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/admin/stats - Basic system statistics
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      adminUsers,
      totalTrades,
      totalNotes,
      totalBrokers,
      recentUsers
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isAdmin: true } }),
      prisma.trade.count(),
      prisma.note.count(),
      prisma.broker.count(),
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ]);

    // Get subscription breakdown
    const subscriptionStats = await prisma.subscription.groupBy({
      by: ['plan'],
      _count: { _all: true }
    });

    res.json({
      overview: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        adminUsers,
        totalTrades,
        totalNotes,
        totalBrokers
      },
      subscriptions: subscriptionStats.reduce((acc, stat) => {
        acc[stat.plan] = stat._count._all;
        return acc;
      }, {} as Record<string, number>),
      recentRegistrations: recentUsers
    });

  } catch (error) {
    logger.error('Failed to fetch system stats', error, req);
    res.status(500).json({ 
      error: 'Failed to fetch system statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/admin/clear-user-data - Clear all user-specific data (keep brokers global)
router.delete('/clear-user-data', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.userId;
    
    logger.warning('CLEAR DATA REQUEST initiated', req);

    // Start a transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // Delete user's notes
      const deletedNotes = await tx.note.deleteMany({
        where: { userId }
      });

      // Delete user's trades
      const deletedTrades = await tx.trade.deleteMany({
        where: { userId }
      });

      // Note: We deliberately keep brokers as they are global/shared
      
      logger.data('DELETED', 'Notes', deletedNotes.count, req);
      logger.data('DELETED', 'Trades', deletedTrades.count, req);
      logger.info('Brokers preserved (global resource)', req);
    });

    logger.success('CLEAR DATA COMPLETED successfully', req);
    
    res.json({
      message: 'User data cleared successfully',
      cleared: {
        notes: true,
        trades: true,
        brokers: false // Kept as global resource
      }
    });

  } catch (error) {
    logger.error('CLEAR DATA FAILED', error, req);
    res.status(500).json({ 
      error: 'Failed to clear user data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/admin/user-stats - Get user data statistics (for verification)
router.get('/user-stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.userId;

    const [tradesCount, notesCount, brokersCount] = await Promise.all([
      prisma.trade.count({ where: { userId } }),
      prisma.note.count({ where: { userId } }),
      prisma.broker.count() // Global count, not user-specific
    ]);

    res.json({
      userId,
      userEmail: req.user!.email,
      stats: {
        trades: tradesCount,
        notes: notesCount,
        brokers: brokersCount // Global resource
      }
    });

  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 🔥 NEW: Toggle email verification status
router.patch('/users/:id/email-verification', requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { emailVerified } = req.body;

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    if (typeof emailVerified !== 'boolean') {
      return res.status(400).json({ error: 'emailVerified must be a boolean' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        emailVerified,
        // Clear verification token if marking as verified
        ...(emailVerified && {
          emailVerificationToken: null,
          emailVerificationExpires: null
        })
      },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        updatedAt: true
      }
    });

    logger.info(`Admin ${req.user?.email} toggled email verification for user ${updatedUser.email} to ${emailVerified}`, req);

    res.json({
      message: `Email verification ${emailVerified ? 'enabled' : 'disabled'} for user`,
      user: updatedUser
    });

  } catch (error) {
    logger.error('Failed to toggle email verification', error, req);
    res.status(500).json({ 
      error: 'Failed to update email verification status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 🔥 NEW: Toggle account suspension/activation
router.patch('/users/:id/account-status', requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { isActive } = req.body;

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive must be a boolean' });
    }

    // Prevent admin from deactivating themselves
    if (userId === req.user?.userId && !isActive) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        email: true,
        isActive: true,
        updatedAt: true
      }
    });

    logger.info(`Admin ${req.user?.email} ${isActive ? 'activated' : 'suspended'} user account ${updatedUser.email}`, req);

    res.json({
      message: `User account ${isActive ? 'activated' : 'suspended'} successfully`,
      user: updatedUser
    });

  } catch (error) {
    logger.error('Failed to toggle account status', error, req);
    res.status(500).json({ 
      error: 'Failed to update account status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 🔥 NEW: Manual password reset (generate reset token)
router.post('/users/:id/reset-password', requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Generate reset token
    const crypto = await import('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpires: resetExpires
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    });

    logger.info(`Admin ${req.user?.email} generated password reset token for user ${updatedUser.email}`, req);

    // Build reset link safely: require FRONTEND_URL in production
    const frontendUrl = process.env.FRONTEND_URL;
    if ((process.env.NODE_ENV || '').toLowerCase() === 'production' && !frontendUrl) {
      return res.status(500).json({ error: 'FRONTEND_URL is not configured in production' });
    }
    const resetLink = `${frontendUrl || 'http://localhost:5173'}?token=${resetToken}`;
    const includeDebug = (process.env.NODE_ENV || '').toLowerCase() !== 'production';

    // 🔍 Include debug info only in non-production environments
    res.json({
      message: 'Password reset token generated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: `${updatedUser.firstName} ${updatedUser.lastName}`
      },
      resetLink,
      expiresAt: resetExpires,
      ...(includeDebug ? { resetToken } : {}),
      ...(includeDebug ? {
        debug: {
          rawToken: resetToken.substring(0, 8) + '...',
          hashedToken: hashedToken.substring(0, 8) + '...',
          expiresAt: resetExpires.toISOString(),
          userId,
          tokenStoredInDatabase: true
        }
      } : {})
    });

  } catch (error) {
    logger.error('Failed to generate password reset token', error, req);
    res.status(500).json({ 
      error: 'Failed to generate password reset token',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 🔥 NEW: Check user deletion impact
router.get('/users/:id/deletion-check', requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Count related data
    const counts = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        _count: {
          select: {
            trades: true,
            notes: true,
            userBrokerAccounts: true,
            loginHistory: true
          }
        }
      }
    });

    const tradeCount = counts?._count.trades || 0;
    const noteCount = counts?._count.notes || 0;
    const brokerCount = counts?._count.userBrokerAccounts || 0;

    res.json({
      canDelete: true,
      tradeCount,
      noteCount,
      brokerCount,
      message: tradeCount > 0 || noteCount > 0 || brokerCount > 0 
        ? `User has ${tradeCount} trades, ${noteCount} notes, and ${brokerCount} broker accounts that will be deleted.`
        : 'User has no associated data.'
    });

  } catch (error) {
    logger.error('Failed to check user deletion', error, req);
    res.status(500).json({ 
      error: 'Failed to check user deletion',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 🔥 NEW: Delete user and all associated data
router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { force } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        email: true, 
        firstName: true, 
        lastName: true,
        _count: {
          select: {
            trades: true,
            notes: true,
            userBrokerAccounts: true,
            loginHistory: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deletion of current admin user
    if ((req.user as any)?.userId === userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Use transaction to ensure all data is deleted atomically
    const result = await prisma.$transaction(async (tx) => {
      // Delete in correct order due to foreign key constraints
      
      // 1. Delete login history
      const deletedLoginHistory = await tx.loginHistory.deleteMany({
        where: { userId }
      });

      // 2. Delete notes
      const deletedNotes = await tx.note.deleteMany({
        where: { userId }
      });

      // 3. Delete trades
      const deletedTrades = await tx.trade.deleteMany({
        where: { userId }
      });

      // 4. Delete user broker accounts (not global brokers)
      const deletedBrokers = await tx.userBrokerAccount.deleteMany({
        where: { userId }
      });

      // 5. Delete subscription
      const deletedSubscription = await tx.subscription.deleteMany({
        where: { userId }
      });

      // 6. Finally delete the user
      const deletedUser = await tx.user.delete({
        where: { id: userId }
      });

      return {
        deletedUser,
        deletedData: {
          trades: deletedTrades.count,
          notes: deletedNotes.count,
          brokers: deletedBrokers.count,
          loginHistory: deletedLoginHistory.count,
          subscription: deletedSubscription.count > 0
        }
      };
    });

    logger.info(`Admin ${(req.user as any)?.email} deleted user ${user.email} and all associated data`, req);

    res.json({
      message: 'User and all associated data deleted successfully',
      deletedUser: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`
      },
      deletedData: result.deletedData
    });

  } catch (error) {
    logger.error('Failed to delete user', error, req);
    res.status(500).json({ 
      error: 'Failed to delete user',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 🔥 NEW: Update user subscription
router.patch('/users/:id/subscription', requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { plan, status, maxTrades } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get or create subscription
    let subscription = await prisma.subscription.findUnique({
      where: { userId }
    });

    const subscriptionData: any = {};
    
    if (plan !== undefined) {
      subscriptionData.plan = plan;
      subscriptionData.maxTrades = plan === 'pro' ? -1 : (maxTrades || 50);
    }
    
    if (status !== undefined) {
      subscriptionData.status = status;
    }
    
    if (maxTrades !== undefined && plan !== 'pro') {
      subscriptionData.maxTrades = maxTrades;
    }

    if (subscription) {
      // Update existing subscription
      subscription = await prisma.subscription.update({
        where: { userId },
        data: subscriptionData
      });
    } else {
      // Create new subscription
      subscription = await prisma.subscription.create({
        data: {
          userId,
          stripeCustomerId: `admin_created_${userId}_${Date.now()}`, // Admin-created subscriptions get unique ID
          plan: plan || 'free',
          status: status || 'active',
          maxTrades: plan === 'pro' ? -1 : (maxTrades || 50),
          tradeCount: 0,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        }
      });
    }

    logger.info(`Admin ${(req.user as any)?.email} updated subscription for user ${user.email}`, req);

    res.json({
      message: 'Subscription updated successfully',
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
        maxTrades: subscription.maxTrades,
        tradeCount: subscription.tradeCount,
        currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    });

  } catch (error) {
    logger.error('Failed to update subscription', error, req);
    res.status(500).json({ 
      error: 'Failed to update subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
