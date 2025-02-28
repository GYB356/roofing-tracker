
import Stripe from 'stripe';
import { storage } from '../storage';
import { log } from '../vite';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const PREMIUM_PRICE_ID = process.env.STRIPE_PREMIUM_PRICE_ID;

if (!STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

export class StripeService {
  static async createCustomer(userId: string, email: string, name: string) {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          userId
        }
      });
      
      await storage.updateUser(userId, { stripeCustomerId: customer.id });
      log(`Created Stripe customer for user ${userId}: ${customer.id}`);
      
      return customer;
    } catch (error) {
      log(`Error creating Stripe customer: ${error.message}`);
      throw error;
    }
  }
  
  static async getOrCreateCustomer(userId: string) {
    try {
      const user = await storage.getUser(userId);
      
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }
      
      if (user.stripeCustomerId) {
        const customer = await stripe.customers.retrieve(user.stripeCustomerId);
        if (customer.deleted) {
          throw new Error(`Stripe customer has been deleted: ${user.stripeCustomerId}`);
        }
        return customer;
      }
      
      return await this.createCustomer(userId, user.email, user.fullName);
    } catch (error) {
      log(`Error in getOrCreateCustomer: ${error.message}`);
      throw error;
    }
  }
  
  static async createCheckoutSession(userId: string, priceId = PREMIUM_PRICE_ID) {
    try {
      const customer = await this.getOrCreateCustomer(userId);
      
      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.CLIENT_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT_URL}/subscription/cancel`,
        metadata: {
          userId
        }
      });
      
      return session;
    } catch (error) {
      log(`Error creating checkout session: ${error.message}`);
      throw error;
    }
  }
  
  static async cancelSubscription(subscriptionId: string) {
    try {
      return await stripe.subscriptions.cancel(subscriptionId);
    } catch (error) {
      log(`Error cancelling subscription: ${error.message}`);
      throw error;
    }
  }
  
  static async getSubscription(subscriptionId: string) {
    try {
      return await stripe.subscriptions.retrieve(subscriptionId);
    } catch (error) {
      log(`Error retrieving subscription: ${error.message}`);
      throw error;
    }
  }
  
  static async handleWebhookEvent(signature: string, payload: Buffer) {
    if (!STRIPE_WEBHOOK_SECRET) {
      throw new Error('Missing STRIPE_WEBHOOK_SECRET environment variable');
    }
    
    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        STRIPE_WEBHOOK_SECRET
      );
      
      log(`Processing webhook event: ${event.type}`);
      
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.metadata?.userId;
          
          if (userId && session.subscription) {
            await storage.updateUser(userId, {
              subscriptionId: session.subscription as string,
              subscriptionStatus: 'active',
              subscriptionTier: 'premium'
            });
            log(`Updated subscription for user ${userId}: ${session.subscription}`);
          }
          break;
        }
        
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          const customer = subscription.customer as string;
          
          const user = await storage.getUserByStripeCustomerId(customer);
          if (user) {
            await storage.updateUser(user.id, {
              subscriptionStatus: subscription.status,
              subscriptionTier: subscription.status === 'active' ? 'premium' : 'free'
            });
            log(`Updated subscription status for user ${user.id}: ${subscription.status}`);
          }
          break;
        }
        
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const customer = subscription.customer as string;
          
          const user = await storage.getUserByStripeCustomerId(customer);
          if (user) {
            await storage.updateUser(user.id, {
              subscriptionId: null,
              subscriptionStatus: 'inactive',
              subscriptionTier: 'free'
            });
            log(`Subscription cancelled for user ${user.id}`);
          }
          break;
        }
      }
      
      return { received: true };
    } catch (error) {
      log(`Webhook error: ${error.message}`);
      throw error;
    }
  }
}
