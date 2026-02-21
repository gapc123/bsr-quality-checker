import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { ClerkExpressRequireAuth, RequireAuthProp } from '@clerk/express';
import prisma from '../db/client.js';

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia'
});

const PRICE_IDS: Record<string, string> = {
  price_per_submission: process.env.STRIPE_PRICE_PER_SUBMISSION || '',
  price_professional_monthly: process.env.STRIPE_PRICE_PROFESSIONAL || '',
  price_enterprise_monthly: process.env.STRIPE_PRICE_ENTERPRISE || ''
};

// Middleware to require authentication
const requireAuth = ClerkExpressRequireAuth();

// Plan limits
const PLAN_LIMITS: Record<string, number> = {
  professional: 15,
  enterprise: -1 // unlimited
};

// GET /api/subscription/status - Check subscription status and usage
router.get('/status', requireAuth, async (req: RequireAuthProp<Request>, res: Response) => {
  try {
    const userId = req.auth.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Check for active subscription in database
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'active'
      }
    });

    // Get current period start (beginning of billing cycle)
    const periodStart = subscription?.currentPeriodEnd
      ? new Date(subscription.currentPeriodEnd.getTime() - 30 * 24 * 60 * 60 * 1000)
      : new Date(new Date().setDate(1)); // First of current month

    // Count submissions this period
    const submissionsThisPeriod = await prisma.submissionUsage.count({
      where: {
        userId,
        createdAt: { gte: periodStart }
      }
    });

    // Get available credits (pay-as-you-go)
    const credits = await prisma.submissionCredit.aggregate({
      where: { userId },
      _sum: { creditsRemaining: true }
    });
    const availableCredits = credits._sum.creditsRemaining || 0;

    // Calculate remaining submissions
    const plan = subscription?.plan || 'none';
    const limit = PLAN_LIMITS[plan] ?? 0;
    const isUnlimited = limit === -1;
    const remainingInPlan = isUnlimited ? -1 : Math.max(0, limit - submissionsThisPeriod);

    res.json({
      hasActiveSubscription: !!subscription,
      subscription: subscription ? {
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd
      } : null,
      usage: {
        submissionsThisPeriod,
        limit: isUnlimited ? 'unlimited' : limit,
        remainingInPlan: isUnlimited ? 'unlimited' : remainingInPlan,
        availableCredits,
        canSubmit: isUnlimited || remainingInPlan > 0 || availableCredits > 0
      }
    });
  } catch (error) {
    console.error('Error checking subscription:', error);
    res.status(500).json({ error: 'Failed to check subscription status' });
  }
});

// POST /api/subscription/check-can-submit - Check if user can submit and reserve a slot
router.post('/check-can-submit', requireAuth, async (req: RequireAuthProp<Request>, res: Response) => {
  try {
    const userId = req.auth.userId;
    const { packVersionId } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Check if this submission already exists (re-running analysis)
    const existingUsage = await prisma.submissionUsage.findUnique({
      where: { packVersionId }
    });

    if (existingUsage) {
      // Already counted, allow re-analysis
      res.json({ canSubmit: true, reason: 'existing' });
      return;
    }

    // Get subscription
    const subscription = await prisma.subscription.findFirst({
      where: { userId, status: 'active' }
    });

    const plan = subscription?.plan || 'none';
    const limit = PLAN_LIMITS[plan] ?? 0;
    const isUnlimited = limit === -1;

    if (isUnlimited) {
      // Enterprise - unlimited, just record usage
      await prisma.submissionUsage.create({
        data: { userId, packVersionId }
      });
      res.json({ canSubmit: true, reason: 'unlimited' });
      return;
    }

    // Get period start
    const periodStart = subscription?.currentPeriodEnd
      ? new Date(subscription.currentPeriodEnd.getTime() - 30 * 24 * 60 * 60 * 1000)
      : new Date(new Date().setDate(1));

    // Count submissions this period
    const submissionsThisPeriod = await prisma.submissionUsage.count({
      where: { userId, createdAt: { gte: periodStart } }
    });

    // Check if within plan limit
    if (subscription && submissionsThisPeriod < limit) {
      await prisma.submissionUsage.create({
        data: { userId, packVersionId }
      });
      res.json({
        canSubmit: true,
        reason: 'plan',
        remaining: limit - submissionsThisPeriod - 1
      });
      return;
    }

    // Check for pay-as-you-go credits
    const creditRecord = await prisma.submissionCredit.findFirst({
      where: { userId, creditsRemaining: { gt: 0 } },
      orderBy: { createdAt: 'asc' }
    });

    if (creditRecord) {
      // Deduct credit and record usage
      await prisma.$transaction([
        prisma.submissionCredit.update({
          where: { id: creditRecord.id },
          data: { creditsRemaining: creditRecord.creditsRemaining - 1 }
        }),
        prisma.submissionUsage.create({
          data: { userId, packVersionId }
        })
      ]);
      res.json({ canSubmit: true, reason: 'credit' });
      return;
    }

    // No submissions available
    res.json({
      canSubmit: false,
      reason: 'limit_reached',
      message: subscription
        ? 'You have reached your monthly submission limit. Purchase additional submissions to continue.'
        : 'You need an active subscription or credits to run analysis.'
    });
  } catch (error) {
    console.error('Error checking submission:', error);
    res.status(500).json({ error: 'Failed to check submission availability' });
  }
});

// POST /api/subscription/buy-credits - Purchase additional submission credits
router.post('/buy-credits', requireAuth, async (req: RequireAuthProp<Request>, res: Response) => {
  try {
    const userId = req.auth.userId;
    const { quantity = 1 } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Get or create Stripe customer
    let customer = await prisma.stripeCustomer.findUnique({
      where: { userId }
    });

    if (!customer) {
      const stripeCustomer = await stripe.customers.create({
        metadata: { userId }
      });
      customer = await prisma.stripeCustomer.create({
        data: { userId, stripeCustomerId: stripeCustomer.id }
      });
    }

    const baseUrl = process.env.APP_URL || 'http://localhost:5173';
    const priceId = process.env.STRIPE_PRICE_PER_SUBMISSION || '';

    const session = await stripe.checkout.sessions.create({
      customer: customer.stripeCustomerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: Math.min(Math.max(1, quantity), 10) // 1-10 credits at a time
      }],
      success_url: `${baseUrl}/?credits_purchased=true`,
      cancel_url: `${baseUrl}/pricing`,
      metadata: {
        userId,
        type: 'credit_purchase',
        quantity: String(quantity)
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating credit checkout:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// POST /api/subscription/create-checkout - Create Stripe checkout session
router.post('/create-checkout', requireAuth, async (req: RequireAuthProp<Request>, res: Response) => {
  try {
    const userId = req.auth.userId;
    const { priceId } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const stripePriceId = PRICE_IDS[priceId];
    if (!stripePriceId) {
      res.status(400).json({ error: 'Invalid price ID' });
      return;
    }

    // Create or retrieve Stripe customer
    let customer = await prisma.stripeCustomer.findUnique({
      where: { userId }
    });

    if (!customer) {
      const stripeCustomer = await stripe.customers.create({
        metadata: { userId }
      });

      customer = await prisma.stripeCustomer.create({
        data: {
          userId,
          stripeCustomerId: stripeCustomer.id
        }
      });
    }

    // Create checkout session
    const baseUrl = process.env.APP_URL || 'http://localhost:5173';
    const isOneTime = priceId === 'price_per_submission';

    const session = await stripe.checkout.sessions.create({
      customer: customer.stripeCustomerId,
      mode: isOneTime ? 'payment' : 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: stripePriceId,
          quantity: 1
        }
      ],
      success_url: `${baseUrl}/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
      metadata: {
        userId,
        priceId
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// POST /api/subscription/webhook - Stripe webhook
router.post('/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      // Check if this is a credit purchase or subscription
      if (session.metadata?.type === 'credit_purchase') {
        await handleCreditPurchase(session);
      } else {
        await handleCheckoutCompleted(session);
      }
      break;
    }
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionUpdated(subscription);
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionDeleted(subscription);
      break;
    }
  }

  res.json({ received: true });
});

async function handleCreditPurchase(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const quantity = parseInt(session.metadata?.quantity || '1', 10);

  if (!userId || !session.payment_intent) {
    return;
  }

  // Add credits to user account
  await prisma.submissionCredit.create({
    data: {
      userId,
      stripePaymentId: session.payment_intent as string,
      creditsRemaining: quantity
    }
  });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const priceId = session.metadata?.priceId;

  if (!userId || !session.subscription) {
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: subscription.id },
    create: {
      userId,
      stripeSubscriptionId: subscription.id,
      plan: priceId?.includes('enterprise') ? 'enterprise' : 'professional',
      status: 'active',
      currentPeriodEnd: new Date(subscription.current_period_end * 1000)
    },
    update: {
      status: 'active',
      currentPeriodEnd: new Date(subscription.current_period_end * 1000)
    }
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const status = subscription.status === 'active' ? 'active' : 'inactive';

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000)
    }
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: { status: 'cancelled' }
  });
}

// POST /api/subscription/portal - Create customer portal session
router.post('/portal', requireAuth, async (req: RequireAuthProp<Request>, res: Response) => {
  try {
    const userId = req.auth.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const customer = await prisma.stripeCustomer.findUnique({
      where: { userId }
    });

    if (!customer) {
      res.status(404).json({ error: 'No subscription found' });
      return;
    }

    const baseUrl = process.env.APP_URL || 'http://localhost:5173';
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.stripeCustomerId,
      return_url: baseUrl
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

export default router;
