import { stripe, SUBSCRIPTION_PLANS, SubscriptionPlan, getPlanLimits } from '../config/stripe';
import { prisma } from '../lib/prisma';

export class SubscriptionService {
  // Create a free subscription for new users
  static async createFreeSubscription(userId: number, email: string) {
    try {
      // For development without real Stripe keys, create subscription without Stripe customer
      let stripeCustomerId = `dummy_customer_${userId}`;
      
      if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('dummy')) {
        // Create Stripe customer only if we have a real API key
        const customer = await stripe.customers.create({
          email,
          metadata: {
            userId: userId.toString()
          }
        });
        stripeCustomerId = customer.id;
      }

      // Create subscription record in database
      const now = new Date();
      const subscription = await prisma.subscription.create({
        data: {
          userId,
          stripeCustomerId,
          plan: 'free',
          status: 'active',
          maxTrades: SUBSCRIPTION_PLANS.free.maxTrades,
          tradeCount: 0,
          periodStartDate: now,
          currentPeriodStart: now,
          // For free plans, set period end to end of current month
          currentPeriodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
        }
      });

      return { subscription, customer: { id: stripeCustomerId } };
    } catch (error) {
      console.error('Error creating free subscription:', error);
      throw error;
    }
  }

  // Upgrade user to paid plan
  static async upgradeToPaidPlan(userId: number, plan: SubscriptionPlan, paymentMethodId: string) {
    try {
      const userSubscription = await prisma.subscription.findUnique({
        where: { userId }
      });

      if (!userSubscription) {
        throw new Error('User subscription not found');
      }

      const planConfig = SUBSCRIPTION_PLANS[plan];
      if (!planConfig.stripePriceId) {
        throw new Error('Invalid paid plan');
      }

      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: userSubscription.stripeCustomerId,
      });

      // Set as default payment method
      await stripe.customers.update(userSubscription.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      // Create Stripe subscription
      const stripeSubscription = await stripe.subscriptions.create({
        customer: userSubscription.stripeCustomerId,
        items: [{ price: planConfig.stripePriceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      // Update database subscription
      const updatedSubscription = await prisma.subscription.update({
        where: { userId },
        data: {
          stripeSubscriptionId: stripeSubscription.id,
          stripePriceId: planConfig.stripePriceId,
          plan,
          status: stripeSubscription.status,
          currentPeriodStart: new Date((stripeSubscription as any).current_period_start * 1000),
          currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000),
          maxTrades: planConfig.maxTrades,
          tradeCount: 0, // Reset count for new billing period
          periodStartDate: new Date((stripeSubscription as any).current_period_start * 1000)
        }
      });

      return {
        subscription: updatedSubscription,
        stripeSubscription,
        clientSecret: (stripeSubscription.latest_invoice as any)?.payment_intent?.client_secret
      };
    } catch (error) {
      console.error('Error upgrading to paid plan:', error);
      throw error;
    }
  }

  // Check if user can add more trades
  static async canAddTrade(userId: number): Promise<{ canAdd: boolean; reason?: string; remaining?: number }> {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { userId }
      });

      if (!subscription) {
        return { canAdd: false, reason: 'No subscription found' };
      }

      // Unlimited plans can always add trades
      if (subscription.maxTrades === -1) {
        return { canAdd: true };
      }

      // Check if user has reached their limit
      if (subscription.tradeCount >= subscription.maxTrades) {
        return { 
          canAdd: false, 
          reason: `Monthly limit of ${subscription.maxTrades} trades reached`,
          remaining: 0
        };
      }

      return { 
        canAdd: true, 
        remaining: subscription.maxTrades - subscription.tradeCount
      };
    } catch (error) {
      console.error('Error checking trade limit:', error);
      return { canAdd: false, reason: 'Error checking subscription status' };
    }
  }

  // Increment trade count
  static async incrementTradeCount(userId: number) {
    try {
      await prisma.subscription.update({
        where: { userId },
        data: {
          tradeCount: {
            increment: 1
          }
        }
      });
    } catch (error) {
      console.error('Error incrementing trade count:', error);
      throw error;
    }
  }

  // Reset monthly trade count (called by cron job or webhook)
  static async resetMonthlyTradeCount(userId: number) {
    try {
      await prisma.subscription.update({
        where: { userId },
        data: {
          tradeCount: 0,
          periodStartDate: new Date()
        }
      });
    } catch (error) {
      console.error('Error resetting trade count:', error);
      throw error;
    }
  }

  // Get subscription status for user
  static async getSubscriptionStatus(userId: number) {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { userId },
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      if (!subscription) {
        return null;
      }

      const planConfig = getPlanLimits(subscription.plan as SubscriptionPlan);

      return {
        ...subscription,
        planConfig,
        usagePercentage: subscription.maxTrades === -1 ? 0 : (subscription.tradeCount / subscription.maxTrades) * 100
      };
    } catch (error) {
      console.error('Error getting subscription status:', error);
      throw error;
    }
  }

  // Cancel subscription
  static async cancelSubscription(userId: number) {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { userId }
      });

      if (!subscription) {
        throw new Error('No subscription found');
      }

      let updatedSubscription;

      if (!subscription.stripeSubscriptionId || process.env.STRIPE_SECRET_KEY?.includes('dummy')) {
        // For free or dummy subscriptions, handle locally
        let effectiveDate = subscription.currentPeriodEnd;
        if (!effectiveDate) {
          // If no period end, set to end of current month
          const now = new Date();
          effectiveDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        }

        updatedSubscription = await prisma.subscription.update({
          where: { userId },
          data: {
            cancelAtPeriodEnd: true,
            status: 'active', // Still active until period ends
            currentPeriodEnd: effectiveDate
          }
        });
      } else {
        // Cancel at period end in Stripe
        const stripeSubscription = await stripe.subscriptions.update(
          subscription.stripeSubscriptionId,
          { cancel_at_period_end: true }
        );

        // Update database
        updatedSubscription = await prisma.subscription.update({
          where: { userId },
          data: {
            cancelAtPeriodEnd: true,
            status: stripeSubscription.status
          }
        });
      }

      return updatedSubscription;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  // Reactivate canceled subscription
  static async reactivateSubscription(userId: number) {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { userId }
      });

      if (!subscription || !subscription.stripeSubscriptionId) {
        throw new Error('No subscription found');
      }

      // Only reactivate if we have a real Stripe subscription
      if (!process.env.STRIPE_SECRET_KEY?.includes('dummy')) {
        // Reactivate in Stripe
        const stripeSubscription = await stripe.subscriptions.update(
          subscription.stripeSubscriptionId,
          { cancel_at_period_end: false }
        );
      }

      // Update database
      const updatedSubscription = await prisma.subscription.update({
        where: { userId },
        data: {
          cancelAtPeriodEnd: false,
          status: 'active'
        }
      });

      return updatedSubscription;
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      throw error;
    }
  }

  // Downgrade subscription (same as cancel - ends at period end)
  static async downgradeSubscription(userId: number, targetPlan: string) {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { userId }
      });

      if (!subscription) {
        throw new Error('No subscription found');
      }

      // For free plan or if no Stripe subscription, update immediately
      if (targetPlan === 'free' || !subscription.stripeSubscriptionId || process.env.STRIPE_SECRET_KEY?.includes('dummy')) {
        // Calculate when the downgrade will take effect
        let effectiveDate = subscription.currentPeriodEnd;
        if (!effectiveDate) {
          // If no period end, set to end of current month
          const now = new Date();
          effectiveDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        }

        const updatedSubscription = await prisma.subscription.update({
          where: { userId },
          data: {
            cancelAtPeriodEnd: true,
            status: 'active', // Still active until period ends
            currentPeriodEnd: effectiveDate
          }
        });
        return updatedSubscription;
      }

      // For paid plans, update in Stripe to cancel at period end
      const stripeSubscription = await stripe.subscriptions.update(
        subscription.stripeSubscriptionId,
        { cancel_at_period_end: true }
      );

      // Update database
      const updatedSubscription = await prisma.subscription.update({
        where: { userId },
        data: {
          cancelAtPeriodEnd: true,
          status: stripeSubscription.status
        }
      });

      return updatedSubscription;
    } catch (error) {
      console.error('Error downgrading subscription:', error);
      throw error;
    }
  }
}

export default SubscriptionService;