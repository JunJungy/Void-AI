import { getStripeSync, getUncachableStripeClient } from './stripeClient';
import { storage } from './storage';
import Stripe from 'stripe';

const PLAN_CREDITS: Record<string, number> = {
  free: 55,
  ruby: 2500,
  pro: 5000,
  diamond: 999999,
};

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string, uuid: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. '
      );
    }

    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature, uuid);

    try {
      const stripe = await getUncachableStripeClient();
      const endpointSecret = await sync.getWebhookSecret(uuid);
      
      const event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);
      
      await WebhookHandlers.handleStripeEvent(event);
    } catch (error) {
      console.error('Error processing custom webhook logic:', error);
    }
  }

  static async handleStripeEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await WebhookHandlers.handleCheckoutComplete(session);
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await WebhookHandlers.handleSubscriptionUpdate(subscription);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await WebhookHandlers.handleSubscriptionDeleted(subscription);
        break;
      }
    }
  }

  static async handleCheckoutComplete(session: Stripe.Checkout.Session): Promise<void> {
    const planType = session.metadata?.planType;
    const customerEmail = session.customer_email || session.customer_details?.email;
    
    if (!planType || !customerEmail) {
      console.log('Checkout session missing planType or email:', { planType, customerEmail });
      return;
    }

    const user = await storage.getUserByEmail(customerEmail);
    if (!user) {
      console.log('User not found for email:', customerEmail);
      return;
    }

    const credits = PLAN_CREDITS[planType] || 55;
    
    await storage.updateUserPlan(user.id, planType);
    await storage.updateUserCredits(user.id, credits);
    
    console.log(`Updated user ${user.email} to plan ${planType} with ${credits} credits`);
  }

  static async handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
    if (subscription.status !== 'active') {
      return;
    }

    const customerId = typeof subscription.customer === 'string' 
      ? subscription.customer 
      : subscription.customer.id;

    try {
      const stripe = await getUncachableStripeClient();
      const customer = await stripe.customers.retrieve(customerId);
      
      if (customer.deleted || !('email' in customer) || !customer.email) {
        return;
      }

      const user = await storage.getUserByEmail(customer.email);
      if (!user) {
        return;
      }

      const priceId = subscription.items.data[0]?.price.id;
      if (priceId) {
        const price = await stripe.prices.retrieve(priceId, { expand: ['product'] });
        const product = price.product as Stripe.Product;
        const planType = product.metadata?.plan_type;
        
        if (planType && planType !== user.planType) {
          const credits = PLAN_CREDITS[planType] || 55;
          await storage.updateUserPlan(user.id, planType);
          await storage.updateUserCredits(user.id, credits);
          console.log(`Subscription update: User ${user.email} changed to ${planType}`);
        }
      }
    } catch (error) {
      console.error('Error handling subscription update:', error);
    }
  }

  static async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const customerId = typeof subscription.customer === 'string' 
      ? subscription.customer 
      : subscription.customer.id;

    try {
      const stripe = await getUncachableStripeClient();
      const customer = await stripe.customers.retrieve(customerId);
      
      if (customer.deleted || !('email' in customer) || !customer.email) {
        return;
      }

      const user = await storage.getUserByEmail(customer.email);
      if (!user) {
        return;
      }

      await storage.updateUserPlan(user.id, 'free');
      await storage.updateUserCredits(user.id, PLAN_CREDITS.free);
      console.log(`Subscription canceled: User ${user.email} downgraded to free`);
    } catch (error) {
      console.error('Error handling subscription deletion:', error);
    }
  }
}
