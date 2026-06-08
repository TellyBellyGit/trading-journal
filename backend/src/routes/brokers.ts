// backend/src/routes/brokers.ts - Updated for Global Broker System
import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = express.Router();

// ===== USER ROUTES (for regular users) =====

// Get all available brokers (global list) and user's broker accounts
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Get all global brokers with user's account info (if any)
    const brokersWithUserAccounts = await prisma.broker.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        userBrokerAccounts: {
          where: { userId: req.user!.userId },
          select: {
            id: true,
            accountType: true,
            accountId: true,
            customCommission: true,
            displayName: true,
            isActive: true
          }
        },
        _count: {
          select: { 
            trades: true,
            userBrokerAccounts: true
          }
        }
      }
    });

    // Transform response to match expected format
    const brokers = brokersWithUserAccounts.map(broker => {
      const userAccount = broker.userBrokerAccounts[0]; // User can only have one account per broker
      return {
        id: broker.id,
        name: broker.name,
        displayName: userAccount?.displayName || broker.displayName,
        accountType: userAccount?.accountType || null,
        accountId: userAccount?.accountId || null,
        isActive: broker.isActive,
        defaultCommission: userAccount?.customCommission || broker.defaultCommission,
        commissionType: broker.commissionType,
        hasUserAccount: !!userAccount,
        userAccountActive: userAccount?.isActive || false,
        _count: broker._count
      };
    });

    res.json(brokers);
  } catch (error: any) {
    console.error('Error fetching brokers:', error);
    res.status(500).json({ error: 'Failed to fetch brokers' });
  }
});

// Get single broker with user account details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const brokerId = parseInt(req.params.id);
    
    const broker = await prisma.broker.findUnique({
      where: { id: brokerId },
      include: {
        userBrokerAccounts: {
          where: { userId: req.user!.userId }
        },
        _count: {
          select: { 
            trades: true,
            userBrokerAccounts: true
          }
        }
      }
    });
    
    if (!broker) {
      return res.status(404).json({ error: 'Broker not found' });
    }

    const userAccount = broker.userBrokerAccounts[0];
    
    const response = {
      id: broker.id,
      name: broker.name,
      displayName: userAccount?.displayName || broker.displayName,
      accountType: userAccount?.accountType || null,
      accountId: userAccount?.accountId || null,
      isActive: broker.isActive,
      defaultCommission: userAccount?.customCommission || broker.defaultCommission,
      commissionType: broker.commissionType,
      hasUserAccount: !!userAccount,
      userAccountActive: userAccount?.isActive || false,
      _count: broker._count
    };
    
    res.json(response);
  } catch (error: any) {
    console.error('Error fetching broker:', error);
    res.status(500).json({ error: 'Failed to fetch broker' });
  }
});

// Create or update user's broker account for a global broker
router.post('/:id/account', authenticateToken, async (req, res) => {
  try {
    const brokerId = parseInt(req.params.id);
    const {
      accountType,
      accountId,
      customCommission,
      displayName
    } = req.body;

    // Verify broker exists
    const broker = await prisma.broker.findUnique({ where: { id: brokerId } });
    if (!broker) {
      return res.status(404).json({ error: 'Broker not found' });
    }

    // Create or update user broker account
    const userBrokerAccount = await prisma.userBrokerAccount.upsert({
      where: {
        userId_brokerId: {
          userId: req.user!.userId,
          brokerId
        }
      },
      update: {
        accountType: accountType || null,
        accountId: accountId || null,
        customCommission: customCommission ? parseFloat(customCommission) : null,
        displayName: displayName || null,
        isActive: true
      },
      create: {
        userId: req.user!.userId,
        brokerId,
        accountType: accountType || null,
        accountId: accountId || null,
        customCommission: customCommission ? parseFloat(customCommission) : null,
        displayName: displayName || null,
        isActive: true
      }
    });

    res.status(201).json({
      id: broker.id,
      name: broker.name,
      displayName: userBrokerAccount.displayName || broker.displayName,
      accountType: userBrokerAccount.accountType,
      accountId: userBrokerAccount.accountId,
      defaultCommission: userBrokerAccount.customCommission || broker.defaultCommission,
      commissionType: broker.commissionType,
      hasUserAccount: true,
      userAccountActive: userBrokerAccount.isActive
    });
  } catch (error: any) {
    console.error('Error creating/updating broker account:', error);
    res.status(500).json({ error: 'Failed to create/update broker account' });
  }
});

// Update user's broker account
router.put('/:id/account', authenticateToken, async (req, res) => {
  try {
    const brokerId = parseInt(req.params.id);
    const {
      accountType,
      accountId,
      customCommission,
      displayName,
      isActive
    } = req.body;

    const userBrokerAccount = await prisma.userBrokerAccount.update({
      where: {
        userId_brokerId: {
          userId: req.user!.userId,
          brokerId
        }
      },
      data: {
        accountType: accountType || null,
        accountId: accountId || null,
        customCommission: customCommission ? parseFloat(customCommission) : null,
        displayName: displayName || null,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    const broker = await prisma.broker.findUnique({ where: { id: brokerId } });

    res.json({
      id: broker!.id,
      name: broker!.name,
      displayName: userBrokerAccount.displayName || broker!.displayName,
      accountType: userBrokerAccount.accountType,
      accountId: userBrokerAccount.accountId,
      defaultCommission: userBrokerAccount.customCommission || broker!.defaultCommission,
      commissionType: broker!.commissionType,
      hasUserAccount: true,
      userAccountActive: userBrokerAccount.isActive
    });
  } catch (error: any) {
    console.error('Error updating broker account:', error);
    res.status(500).json({ error: 'Failed to update broker account' });
  }
});

// Delete user's broker account (not the global broker)
router.delete('/:id/account', authenticateToken, async (req, res) => {
  try {
    const brokerId = parseInt(req.params.id);
    
    // Check if user has trades with this broker
    const tradeCount = await prisma.trade.count({
      where: { 
        brokerId,
        userId: req.user!.userId
      }
    });
    
    if (tradeCount > 0) {
      return res.status(400).json({ 
        error: `Cannot remove broker account. You have ${tradeCount} trades with this broker. Consider deactivating instead.` 
      });
    }

    await prisma.userBrokerAccount.delete({
      where: {
        userId_brokerId: {
          userId: req.user!.userId,
          brokerId
        }
      }
    });
    
    res.json({ message: 'Broker account removed successfully' });
  } catch (error: any) {
    console.error('Error deleting broker account:', error);
    res.status(500).json({ error: 'Failed to delete broker account' });
  }
});

// ===== ADMIN ROUTES (for broker management) =====

// Get all global brokers (admin only)
router.get('/admin/global', requireAdmin, async (req, res) => {
  try {
    const brokers = await prisma.broker.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { 
            trades: true,
            userBrokerAccounts: true
          }
        }
      }
    });
    res.json(brokers);
  } catch (error: any) {
    console.error('Error fetching global brokers:', error);
    res.status(500).json({ error: 'Failed to fetch global brokers' });
  }
});

// Create new global broker (admin only)
router.post('/admin/global', requireAdmin, async (req, res) => {
  try {
    const {
      name,
      displayName,
      defaultCommission,
      commissionType,
      isActive = true
    } = req.body;

    const broker = await prisma.broker.create({
      data: {
        name: name.trim(),
        displayName: displayName?.trim() || name.trim(),
        defaultCommission: defaultCommission ? parseFloat(defaultCommission) : null,
        commissionType: commissionType || null,
        isActive
      }
    });

    res.status(201).json(broker);
  } catch (error: any) {
    console.error('Error creating global broker:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Broker name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create broker' });
    }
  }
});

// Update global broker (admin only)
router.put('/admin/global/:id', requireAdmin, async (req, res) => {
  try {
    const brokerId = parseInt(req.params.id);
    const {
      name,
      displayName,
      defaultCommission,
      commissionType,
      isActive
    } = req.body;

    const broker = await prisma.broker.update({
      where: { id: brokerId },
      data: {
        name: name?.trim(),
        displayName: displayName?.trim(),
        defaultCommission: defaultCommission ? parseFloat(defaultCommission) : null,
        commissionType: commissionType || null,
        isActive
      }
    });

    res.json(broker);
  } catch (error: any) {
    console.error('Error updating global broker:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Broker name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update broker' });
    }
  }
});

// Utility function to find or create broker (used by import)
export async function findOrCreateBroker(brokerName: string): Promise<number> {
  const normalizedName = brokerName.trim();
  
  // Try to find existing broker
  let broker = await prisma.broker.findUnique({
    where: { name: normalizedName }
  });
  
  if (!broker) {
    // Create new broker
    broker = await prisma.broker.create({
      data: {
        name: normalizedName,
        displayName: normalizedName,
        isActive: true
      }
    });
    console.log(`✅ Auto-created new broker: ${normalizedName} (ID: ${broker.id})`);
  }
  
  return broker.id;
}

export default router;
