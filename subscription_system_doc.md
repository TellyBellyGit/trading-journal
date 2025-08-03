# Subscription System Documentation

This document outlines the complete subscription system implementation in the Trading Journal application.

## Overview

The Trading Journal uses a tiered subscription model with trade limits to monetize the application while providing value to users at different levels.

## Subscription Tiers

### Free Plan
- **Price**: $0/month
- **Trade Limit**: 25 trades per month
- **Grace Period**: +2 additional trades (27 total)
- **Features**:
  - 25 trades per month
  - Basic analytics
  - Trade journaling
  - Basic export

### Pro Plan
- **Price**: $9.99/month
- **Trade Limit**: Unlimited (`maxTrades: -1`)
- **Features**:
  - Unlimited trades
  - Advanced analytics
  - Rich text journaling
  - CSV import/export
  - Performance indicators
  - Email support

### Premium Plan
- **Price**: $19.99/month
- **Trade Limit**: Unlimited (`maxTrades: -1`)
- **Features**:
  - Everything in Pro
  - AI-powered trade analysis
  - Advanced reporting
  - Priority support
  - Custom integrations
  - Trading recommendations

## Database Schema

### Subscription Table
```prisma
model Subscription {
  id                   Int      @id @default(autoincrement())
  // Stripe identifiers
  stripeCustomerId     String   @unique  // Stripe customer ID
  stripeSubscriptionId String?  @unique  // Stripe subscription ID (null for free tier)
  stripePriceId        String?           // Stripe price ID for current plan
  // Subscription details
  plan                 String   @default("free")  // "free", "pro", "premium"
  status               String   @default("active") // "active", "canceled", "past_due", "incomplete"
  currentPeriodStart   DateTime?
  currentPeriodEnd     DateTime?
  cancelAtPeriodEnd    Boolean  @default(false)
  // Usage tracking
  tradeCount           Int      @default(0)       // Current period trade count
  periodStartDate      DateTime @default(now())   // When current usage period started
  // Limits based on plan
  maxTrades            Int      @default(25)      // Max trades per month for current plan
  // User relationship
  userId               Int      @unique
  user                 User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  // Timestamps
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}
```

## System Architecture

### Backend Components

#### 1. Subscription Service (`backend/src/services/subscriptionService.ts`)
Core business logic for subscription management:

- `createFreeSubscription()` - Creates free subscription for new users
- `getSubscriptionStatus()` - Gets current subscription info
- `canAddTrade()` - Checks if user can add more trades
- `incrementTradeCount()` - Increments usage counter
- `resetMonthlyTradeCount()` - Resets monthly usage

#### 2. Subscription Routes (`backend/src/routes/subscriptions.ts`)
API endpoints for subscription operations:

- `GET /api/subscriptions/status` - Get current subscription status
- `GET /api/subscriptions/plans` - Get available plans
- `POST /api/subscriptions/upgrade` - Upgrade to paid plan
- `POST /api/subscriptions/cancel` - Cancel subscription

#### 3. Stripe Configuration (`backend/src/config/stripe.ts`)
Defines subscription plans and integrates with Stripe:

```typescript
export const SUBSCRIPTION_PLANS = {
  free: {
    name: 'Free',
    maxTrades: 25,
    price: 0,
    stripePriceId: null
  },
  pro: {
    name: 'Pro',
    maxTrades: -1, // unlimited
    price: 9.99,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID
  },
  premium: {
    name: 'Premium',
    maxTrades: -1, // unlimited
    price: 19.99,
    stripePriceId: process.env.STRIPE_PREMIUM_PRICE_ID
  }
};
```

### Frontend Components

#### 1. AppShell Component
- **User Dropdown**: Shows subscription plan, usage, and progress bar
- **Usage Indicator**: Displays trade count in header for free users approaching limit
- **Real-time Updates**: Listens for subscription status changes

#### 2. Subscription Page
- **Plan Comparison**: Shows all available plans with features
- **Current Status**: Displays current plan and billing information
- **Upgrade/Cancel Actions**: Handles plan changes

#### 3. TradingApp Component
- **Strategic Notifications**: Shows upgrade prompts at key moments:
  - 80% usage: "Approaching Your Monthly Limit"
  - Grace period: "Using Grace Period"

## Trade Limit Enforcement

### Enforcement Points

#### 1. Single Trade Creation (`POST /api/trades`)
```typescript
const subscriptionStatus = await SubscriptionService.getSubscriptionStatus(userId);
if (subscriptionStatus && subscriptionStatus.maxTrades > 0) {
  const GRACE_TRADES = 2;
  const effectiveLimit = subscriptionStatus.maxTrades + GRACE_TRADES;
  
  if (subscriptionStatus.tradeCount >= effectiveLimit) {
    return res.status(403).json({
      error: 'Subscription limit reached',
      remaining: 0,
      gracePeriodExhausted: true
    });
  }
}
```

#### 2. Bulk CSV Import (`POST /api/trades/import/save`)
Additional restrictions for free users:
- **Batch limit**: Maximum 5 trades per import
- **Monthly limit check**: Validates against remaining trades
- **Grace period handling**: Allows import within grace period

### Grace Period System

Free users get additional flexibility:
- **Base limit**: 25 trades/month
- **Grace trades**: +2 additional trades (27 total)
- **Warning system**: User notified when entering grace period
- **Hard stop**: At 27 trades, completely blocked

### Usage Tracking

#### Trade Count Increment
Every successful trade creation calls:
```typescript
await SubscriptionService.incrementTradeCount(userId);
```

#### Monthly Reset
Usage resets at the beginning of each billing period:
```typescript
await SubscriptionService.resetMonthlyTradeCount(userId);
```

## User Experience

### Subscription Information Display

Users can see their subscription status in multiple places:

1. **User Dropdown Menu**:
   - Plan name (e.g., "Free Plan", "Pro Plan")
   - Current usage (e.g., "15/25 trades this month")
   - Progress bar with color coding:
     - Blue: Normal usage (< 70%)
     - Yellow: Warning (70-89%)
     - Red: Critical (≥ 90%)
   - Grace period indicator when applicable

2. **Header Usage Indicator** (Free users ≥ 50% usage):
   - Compact display: "15/25" with mini progress bar
   - Color-coded based on usage percentage

3. **Strategic Notifications**:
   - 80% usage: Upgrade prompt with benefits
   - Grace period: Warning about approaching hard limit

### Plan Upgrade Flow

1. User clicks "Billing & Subscription" or upgrade notification
2. Subscription page shows current plan and available upgrades
3. Payment form integration with Stripe
4. Immediate access to unlimited trades upon successful upgrade

## Development & Testing

### Creating Subscriptions for Existing Users

If users were created before the subscription system:

```bash
# Run this script to create free subscriptions
npx ts-node scripts/createSubscriptionsDirectly.ts
```

This creates subscriptions directly in the database without Stripe API calls.

### Testing Trade Limits

1. **Reset Trade Count** (Development only):
   ```typescript
   await SubscriptionService.resetMonthlyTradeCount(userId);
   ```

2. **Manual Testing**:
   - Add trades until approaching limit
   - Verify warnings appear at 70% and 90%
   - Test grace period (trades 26-27)
   - Verify hard stop at trade 28

### Environment Setup

Required environment variables:
```env
STRIPE_SECRET_KEY=sk_test_...        # Stripe secret key
STRIPE_PRO_PRICE_ID=price_...        # Pro plan price ID
STRIPE_PREMIUM_PRICE_ID=price_...    # Premium plan price ID
```

For development without Stripe:
```env
STRIPE_SECRET_KEY=sk_test_dummy_key_for_development
```

## Security Considerations

- **Server-side enforcement**: All limits checked in backend
- **Token validation**: Subscription endpoints require authentication
- **Grace period abuse prevention**: Batch import limits for free users
- **Stripe integration**: Secure payment processing
- **No client-side bypassing**: UI restrictions backed by API validation

## Business Logic

### Upgrade Strategy

The system employs strategic upgrade prompts:

1. **Early Engagement** (50% usage): Show usage indicator in header
2. **Conversion Moment** (80% usage): "Approaching limit" notification
3. **Urgency Creation** (Grace period): "Using grace trades" warning
4. **Value Demonstration**: Emphasize unlimited trades and advanced features

### Plan Features Differentiation

- **Free**: Core functionality with reasonable limits
- **Pro**: Removes all restrictions, adds power user features
- **Premium**: Enterprise features and priority support

This creates a clear upgrade path that provides value at each tier while encouraging progression to paid plans.

## Troubleshooting

### Common Issues

1. **404 on subscription endpoints**: User lacks subscription record
   - **Solution**: Run `createSubscriptionsDirectly.ts` script

2. **Stripe authentication errors**: Invalid or missing API keys
   - **Solution**: Check environment variables or use dummy keys for development

3. **Trade limits not enforcing**: Subscription service not being called
   - **Solution**: Verify `SubscriptionService.getSubscriptionStatus()` is called before trade creation

4. **UI not showing subscription info**: Subscription status not loading
   - **Solution**: Check browser console for API errors, verify authentication

### Maintenance Scripts

- `createSubscriptionsDirectly.ts` - Creates subscriptions without Stripe
- `createSubscriptionsForExistingUsers.ts` - Creates subscriptions via Stripe API
- `resetAdminToFree.ts` - Resets admin user to free plan for testing
- `upgradeAdminToPro.ts` - Upgrades admin user to pro plan for testing