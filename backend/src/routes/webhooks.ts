import express from 'express';
import { stripe } from '../config/stripe';
import { PrismaClient } from '@prisma/client';
import SubscriptionService from '../services/subscriptionService';

const router = express.Router();
const prisma = new PrismaClient();

// Stripe webhook endpoint (raw body needed for signature verification)
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event;

  try {
    // Verify the webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// Handle subscription created
async function handleSubscriptionCreated(subscription: any) {
  console.log('Subscription created:', subscription.id);
  
  try {
    // Find user by customer ID
    const userSubscription = await prisma.subscription.findUnique({
      where: { stripeCustomerId: subscription.customer }
    });

    if (userSubscription) {
      await prisma.subscription.update({
        where: { stripeCustomerId: subscription.customer },
        data: {
          stripeSubscriptionId: subscription.id,
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end
        }
      });
    }
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

// Handle subscription updated
async function handleSubscriptionUpdated(subscription: any) {
  console.log('Subscription updated:', subscription.id);
  
  try {
    const userSubscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscription.id }
    });

    if (userSubscription) {
      // Determine plan from price ID
      let plan = 'free';
      if (subscription.items.data.length > 0) {
        const priceId = subscription.items.data[0].price.id;
        if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
          plan = 'pro';
        } else if (priceId === process.env.STRIPE_PREMIUM_PRICE_ID) {
          plan = 'premium';
        }
      }

      await prisma.subscription.update({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          status: subscription.status,
          plan,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end
        }
      });

      // Reset trade count for new billing period
      if (subscription.status === 'active') {
        await SubscriptionService.resetMonthlyTradeCount(userSubscription.userId);
      }
    }
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

// Handle subscription deleted/canceled
async function handleSubscriptionDeleted(subscription: any) {
  console.log('Subscription deleted:', subscription.id);
  
  try {
    const userSubscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscription.id }
    });

    if (userSubscription) {
      // Downgrade to free plan
      await prisma.subscription.update({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          plan: 'free',
          status: 'active',
          stripeSubscriptionId: null,
          stripePriceId: null,
          maxTrades: 25,
          tradeCount: 0,
          periodStartDate: new Date(),
          cancelAtPeriodEnd: false,
          currentPeriodStart: null,
          currentPeriodEnd: null
        }
      });
    }
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

// Handle successful payment
async function handlePaymentSucceeded(invoice: any) {
  console.log('Payment succeeded for invoice:', invoice.id);
  
  try {
    if (invoice.subscription) {
      const userSubscription = await prisma.subscription.findUnique({
        where: { stripeSubscriptionId: invoice.subscription }
      });

      if (userSubscription) {
        // Reset trade count for new billing period
        await SubscriptionService.resetMonthlyTradeCount(userSubscription.userId);
        
        // Update subscription status
        await prisma.subscription.update({
          where: { stripeSubscriptionId: invoice.subscription },
          data: {
            status: 'active'
          }
        });
      }
    }
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}

// Handle failed payment
async function handlePaymentFailed(invoice: any) {
  console.log('Payment failed for invoice:', invoice.id);
  
  try {
    if (invoice.subscription) {
      await prisma.subscription.update({
        where: { stripeSubscriptionId: invoice.subscription },
        data: {
          status: 'past_due'
        }
      });
    }
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

export default router;