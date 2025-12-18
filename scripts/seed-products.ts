import { getUncachableStripeClient } from '../server/stripeClient';

async function createProducts() {
  console.log('Creating subscription products in Stripe...');
  
  const stripe = await getUncachableStripeClient();

  const existingProducts = await stripe.products.list({ limit: 100 });
  const productNames = existingProducts.data.map(p => p.name);

  if (!productNames.includes('Ruby Plan')) {
    console.log('Creating Ruby Plan...');
    const rubyProduct = await stripe.products.create({
      name: 'Ruby Plan',
      description: 'Access to v1.5, v4, and v4.5 AI models for music generation',
      metadata: {
        plan_type: 'ruby',
        tier: '2',
      }
    });

    await stripe.prices.create({
      product: rubyProduct.id,
      unit_amount: 999,
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { plan_type: 'ruby' }
    });
    console.log('Ruby Plan created:', rubyProduct.id);
  } else {
    console.log('Ruby Plan already exists');
  }

  if (!productNames.includes('Pro Plan')) {
    console.log('Creating Pro Plan...');
    const proProduct = await stripe.products.create({
      name: 'Pro Plan',
      description: 'Access to v1.5, v5, and v6 AI models for premium music generation',
      metadata: {
        plan_type: 'pro',
        tier: '3',
      }
    });

    await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 1999,
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { plan_type: 'pro' }
    });
    console.log('Pro Plan created:', proProduct.id);
  } else {
    console.log('Pro Plan already exists');
  }

  if (!productNames.includes('Diamond Plan')) {
    console.log('Creating Diamond Plan...');
    const diamondProduct = await stripe.products.create({
      name: 'Diamond Plan',
      description: 'Unlimited access to ALL AI models including v6 for ultimate music creation',
      metadata: {
        plan_type: 'diamond',
        tier: '4',
      }
    });

    await stripe.prices.create({
      product: diamondProduct.id,
      unit_amount: 2999,
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { plan_type: 'diamond' }
    });
    console.log('Diamond Plan created:', diamondProduct.id);
  } else {
    console.log('Diamond Plan already exists');
  }

  console.log('Done! Products will be synced to database via webhooks.');
}

createProducts().catch(console.error);
