import { PrismaClient, Subscription } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export class SubscriptionService {
  static async getSubscription(userId: string): Promise<Subscription | null> {
    return await prisma.subscription.findFirst({
      where: { userId }
    });
  }

  static async createSubscription(userId: string, planId: string, paymentMethodId: string): Promise<any> {
    // Get the user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get the plan
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      throw new Error('Plan not found');
    }

    try {
      // Create or get Stripe customer
      let stripeCustomerId = user.stripeCustomerId;

      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          metadata: {
            userId: user.id
          }
        });

        stripeCustomerId = customer.id;

        // Update user with Stripe customer ID
        await prisma.user.update({
          where: { id: userId },
          data: { stripeCustomerId }
        });
      }

      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: stripeCustomerId
      });

      // Set as default payment method
      await stripe.customers.update(stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });

      // Create Stripe subscription
      const stripeSubscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: plan.stripePriceId }],
        expand: ['latest_invoice.payment_intent']
      });

      // Create subscription in database
      const subscription = await prisma.subscription.create({
        data: {
          userId,
          planId,
          stripeSubscriptionId: stripeSubscription.id,
          status: stripeSubscription.status,
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end
        }
      });

      // Update user plan level
      await prisma.user.update({
        where: { id: userId },
        data: { planLevel: plan.name }
      });

      return {
        subscription,
        stripeSubscription
      };
    } catch (error) {
      console.error('Stripe subscription error:', error);
      throw error;
    }
  }

  static async cancelSubscription(userId: string): Promise<Subscription> {
    // Get the current subscription
    const subscription = await prisma.subscription.findFirst({
      where: { userId }
    });

    if (!subscription) {
      throw new Error('No active subscription found');
    }

    try {
      // Cancel at period end in Stripe
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true
      });

      // Update our database
      const updatedSubscription = await prisma.subscription.update({
        where: { id: subscription.id },
        data: { cancelAtPeriodEnd: true }
      });

      return updatedSubscription;
    } catch (error) {
      console.error('Stripe cancellation error:', error);
      throw error;
    }
  }

  static async reactivateSubscription(userId: string): Promise<Subscription> {
    // Get the current subscription
    const subscription = await prisma.subscription.findFirst({
      where: { userId }
    });

    if (!subscription) {
      throw new Error('No subscription found');
    }

    try {
      // Reactivate in Stripe
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: false
      });

      // Update our database
      const updatedSubscription = await prisma.subscription.update({
        where: { id: subscription.id },
        data: { cancelAtPeriodEnd: false }
      });

      return updatedSubscription;
    } catch (error) {
      console.error('Stripe reactivation error:', error);
      throw error;
    }
  }

  static async changeSubscriptionPlan(userId: string, newPlanId: string): Promise<Subscription> {
    // Get the current subscription
    const subscription = await prisma.subscription.findFirst({
      where: { userId }
    });

    if (!subscription) {
      throw new Error('No active subscription found');
    }

    // Get the new plan
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: newPlanId }
    });

    if (!plan) {
      throw new Error('Plan not found');
    }

    try {
      // Change plan in Stripe
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        items: [{
          id: (await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId)).items.data[0].id,
          price: plan.stripePriceId
        }],
        proration_behavior: 'create_prorations'
      });

      // Update our database
      const updatedSubscription = await prisma.subscription.update({
        where: { id: subscription.id },
        data: { planId: newPlanId }
      });

      // Update user plan level
      await prisma.user.update({
        where: { id: userId },
        data: { planLevel: plan.name }
      });

      return updatedSubscription;
    } catch (error) {
      console.error('Stripe plan change error:', error);
      throw error;
    }
  }

  static async handleWebhook(event: any): Promise<void> {
    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object;
        await this.updateSubscriptionStatus(subscription);
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        if (invoice.subscription) {
          await this.handleSuccessfulPayment(invoice);
        }
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;
        if (failedInvoice.subscription) {
          await this.handleFailedPayment(failedInvoice);
        }
        break;
    }
  }

  private static async updateSubscriptionStatus(stripeSubscription: any): Promise<void> {
    // Find our subscription
    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: stripeSubscription.id }
    });

    if (!subscription) return;

    // Update our subscription
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: stripeSubscription.status,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end
      }
    });

    // If subscription is canceled or unpaid, update user plan to free
    if (['canceled', 'unpaid'].includes(stripeSubscription.status)) {
      await prisma.user.update({
        where: { id: subscription.userId },
        data: { planLevel: 'FREE' }
      });
    }
  }

  private static async handleSuccessfulPayment(invoice: any): Promise<void> {
    // Find subscription
    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: invoice.subscription }
    });

    if (!subscription) return;

    // Update payment status
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { lastPaymentStatus: 'SUCCEEDED' }
    });

    // Log successful payment
    await prisma.paymentHistory.create({
      data: {
        userId: subscription.userId,
        amount: invoice.amount_paid / 100, // Convert from cents
        status: 'SUCCEEDED',
        stripeInvoiceId: invoice.id,
        paymentDate: new Date(invoice.created * 1000)
      }
    });
  }

  private static async handleFailedPayment(invoice: any): Promise<void> {
    // Find subscription
    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: invoice.subscription }
    });

    if (!subscription) return;

    // Update payment status
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { lastPaymentStatus: 'FAILED' }
    });

    // Log failed payment
    await prisma.paymentHistory.create({
      data: {
        userId: subscription.userId,
        amount: invoice.amount_due / 100, // Convert from cents
        status: 'FAILED',
        stripeInvoiceId: invoice.id,
        paymentDate: new Date(invoice.created * 1000)
      }
    });
  }

  static async getAllSubscriptionPlans(): Promise<any[]> {
    return await prisma.subscriptionPlan.findMany({
      orderBy: { price: 'asc' }
    });
  }
}