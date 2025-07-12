import express from 'express';
import { authenticateToken } from '../middleware/auth';
import SubscriptionService from '../services/subscriptionService';
import { SUBSCRIPTION_PLANS } from '../config/stripe';

const router = express.Router();

// Apply authentication to all subscription routes
router.use(authenticateToken);

// Get current subscription status
router.get('/status', async (req, res) => {
  try {
    const userId = req.user!.userId;
    const subscription = await SubscriptionService.getSubscriptionStatus(userId);
    
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.json(subscription);
  } catch (error) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
});

// Get available plans
router.get('/plans', async (req, res) => {
  try {
    const plans = Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => ({
      id: key,
      ...plan
    }));
    
    res.json(plans);
  } catch (error) {
    console.error('Error getting subscription plans:', error);
    res.status(500).json({ error: 'Failed to get subscription plans' });
  }
});

// Upgrade to paid plan
router.post('/upgrade', async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { plan, paymentMethodId } = req.body;

    if (!plan || !paymentMethodId) {
      return res.status(400).json({ error: 'Plan and payment method are required' });
    }

    if (!SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS]) {
      return res.status(400).json({ error: 'Invalid subscription plan' });
    }

    if (plan === 'free') {
      return res.status(400).json({ error: 'Cannot upgrade to free plan' });
    }

    const result = await SubscriptionService.upgradeToPaidPlan(userId, plan, paymentMethodId);
    
    res.json({
      success: true,
      subscription: result.subscription,
      clientSecret: result.clientSecret
    });
  } catch (error) {
    console.error('Error upgrading subscription:', error);
    res.status(500).json({ error: 'Failed to upgrade subscription' });
  }
});

// Cancel subscription
router.post('/cancel', async (req, res) => {
  try {
    const userId = req.user!.userId;
    const subscription = await SubscriptionService.cancelSubscription(userId);
    
    res.json({
      success: true,
      subscription,
      message: 'Subscription will be canceled at the end of the current billing period'
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Reactivate subscription
router.post('/reactivate', async (req, res) => {
  try {
    const userId = req.user!.userId;
    const subscription = await SubscriptionService.reactivateSubscription(userId);
    
    res.json({
      success: true,
      subscription,
      message: 'Subscription reactivated successfully'
    });
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    res.status(500).json({ error: 'Failed to reactivate subscription' });
  }
});

// Downgrade subscription
router.post('/downgrade', async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { targetPlan } = req.body;

    if (!targetPlan || !['free', 'pro'].includes(targetPlan)) {
      return res.status(400).json({ error: 'Invalid target plan' });
    }

    const subscription = await SubscriptionService.downgradeSubscription(userId, targetPlan);
    
    res.json({
      success: true,
      subscription,
      message: `Subscription will downgrade to ${targetPlan} at the end of the current billing period`
    });
  } catch (error) {
    console.error('Error downgrading subscription:', error);
    res.status(500).json({ error: 'Failed to downgrade subscription' });
  }
});

// Check if user can add a trade
router.get('/can-add-trade', async (req, res) => {
  try {
    const userId = req.user!.userId;
    const result = await SubscriptionService.canAddTrade(userId);
    
    res.json(result);
  } catch (error) {
    console.error('Error checking trade limit:', error);
    res.status(500).json({ error: 'Failed to check trade limit' });
  }
});

// Development-only route to reset trade count for testing
router.post('/reset-trade-count', authenticateToken, async (req, res) => {
  try {
    // Only allow in development environment
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Not allowed in production' });
    }

    const userId = req.user!.userId;
    
    await SubscriptionService.resetMonthlyTradeCount(userId);
    
    // Get updated subscription status to return
    const updatedStatus = await SubscriptionService.getSubscriptionStatus(userId);
    
    res.json({
      message: 'Trade count reset successfully',
      subscription: updatedStatus
    });
  } catch (error) {
    console.error('Error resetting trade count:', error);
    res.status(500).json({ error: 'Failed to reset trade count' });
  }
});

export default router;