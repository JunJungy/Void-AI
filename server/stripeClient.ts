import Stripe from 'stripe';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  const connectorName = 'stripe';
  const isProduction = process.env.REPLIT_DEPLOYMENT === '1';
  const targetEnvironment = isProduction ? 'production' : 'development';

  const url = new URL(`https://${hostname}/api/v2/connection`);
  url.searchParams.set('include_secrets', 'true');
  url.searchParams.set('connector_names', connectorName);
  url.searchParams.set('environment', targetEnvironment);

  const response = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
      'X_REPLIT_TOKEN': xReplitToken
    }
  });

  const data = await response.json();
  
  connectionSettings = data.items?.[0];

  if (!connectionSettings || (!connectionSettings.settings?.publishable || !connectionSettings.settings?.secret)) {
    console.warn(`Stripe ${targetEnvironment} connection not configured - Stripe features will be disabled`);
    return null;
  }

  return {
    publishableKey: connectionSettings.settings.publishable,
    secretKey: connectionSettings.settings.secret,
  };
}

export function isStripeConfigured(): boolean {
  return connectionSettings !== null && connectionSettings !== undefined;
}

export async function getUncachableStripeClient() {
  const credentials = await getCredentials();
  if (!credentials) {
    throw new Error('Stripe is not configured');
  }
  return new Stripe(credentials.secretKey);
}

export async function getStripePublishableKey() {
  const credentials = await getCredentials();
  if (!credentials) {
    return null;
  }
  return credentials.publishableKey;
}

export async function getStripeSecretKey() {
  const credentials = await getCredentials();
  if (!credentials) {
    return null;
  }
  return credentials.secretKey;
}

let stripeSync: any = null;

export async function getStripeSync() {
  if (!stripeSync) {
    const secretKey = await getStripeSecretKey();
    if (!secretKey) {
      throw new Error('Stripe is not configured');
    }
    
    const { StripeSync } = await import('stripe-replit-sync');
    stripeSync = new StripeSync({
      poolConfig: {
        connectionString: process.env.DATABASE_URL!,
        max: 2,
      },
      stripeSecretKey: secretKey,
    });
  }
  return stripeSync;
}
