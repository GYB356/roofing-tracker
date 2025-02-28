import { Router, json, raw } from 'express';
import { SubscriptionService } from '../services/subscription';
import { requireAuth, requireRole } from '../middleware/auth';
import { validateSubscriptionData } from '../middleware/validation';
import { auditLog } from '../middleware/audit';
import { prisma } from '../../lib/prisma';
import Stripe from 'stripe';

const router = Router();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

// Get the current user's subscription
router.get('/me', requireAuth, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const subscription = await SubscriptionService.getSubscription(req.user.id);
    res.json(subscription || { status: 'NONE' });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ message: 'Failed to fetch subscription' });
  }
});

// Get all available subscription plans
router.get('/plans', async (_req, res) => {
  try {
    const plans = await SubscriptionService.getAllSubscriptionPlans();
    res.json(plans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ message: 'Failed to fetch subscription plans' });
  }
});

// Create a subscription
router.post('/', requireAuth, async (req, res) => {
  try {
    const { planId, paymentMethodId } = req.body;

    if (!req.user?.id || !planId || !paymentMethodId) {
      return res.status(400).json({ message: 'Plan ID and payment method are required' });
    }

    const result = await SubscriptionService.createSubscription(
      req.user.id,
      planId,
      paymentMethodId
    );

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to create subscription' });
  }
});

// Cancel a subscription
router.post('/cancel', requireAuth, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const subscription = await SubscriptionService.cancelSubscription(req.user.id);
    res.json(subscription);
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to cancel subscription' });
  }
});

// Reactivate a subscription
router.post('/reactivate', requireAuth, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const subscription = await SubscriptionService.reactivateSubscription(req.user.id);
    res.json(subscription);
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to reactivate subscription' });
  }
});

// Change subscription plan
router.post('/change-plan', requireAuth, async (req, res) => {
  try {
    const { planId } = req.body;

    if (!req.user?.id) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!planId) {
      return res.status(400).json({ message: 'Plan ID is required' });
    }

    const subscription = await SubscriptionService.changeSubscriptionPlan(req.user.id, planId);
    res.json(subscription);
  } catch (error) {
    console.error('Error changing plan:', error);
    res.status(400).json({ message: error instanceof Error ? error.message : 'Failed to change subscription plan' });
  }
});

// Create a Stripe session for payment setup
router.post('/create-setup-intent', requireAuth, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Get or create Stripe customer
    let user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create setup intent
    const setupIntent = await stripe.setupIntents.create({
      customer: user.stripeCustomerId,
      payment_method_types: ['card'],
    });

    res.json({ clientSecret: setupIntent.client_secret });
  } catch (error) {
    console.error('Error creating setup intent:', error);
    res.status(500).json({ message: 'Failed to create payment setup' });
  }
});

// Handle Stripe webhooks
router.post('/webhooks', raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    return res.status(500).send('Webhook secret not configured');
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err instanceof Error ? err.message : err);
    return res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }

  try {
    await SubscriptionService.handleWebhook(event);
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
import express from 'express';
import { prisma } from '../../lib/prisma';

const router = express.Router();

// Minimal implementation - get all subscriptions
router.get('/', async (req, res) => {
  try {
    const subscriptions = await prisma.subscription.findMany();
    res.json(subscriptions);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

export default router;
