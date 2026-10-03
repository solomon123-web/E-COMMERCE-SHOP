import crypto from 'crypto';
import { env } from '../config/env';

const PAYSTACK_API_BASE = 'https://api.paystack.co';

interface PaystackInitializeRequest {
  email: string;
  amount: number;
  orderNumber: string;
  orderId: string;
  metadata?: Record<string, unknown>;
}

interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data?: {
    id: number;
    reference: string;
    amount: number;
    currency: string;
    status: 'success' | 'failed' | 'abandoned';
    paid_at: string;
    created_at: string;
    customer: {
      id: number;
      email: string;
      customer_code: string;
    };
  };
}

/**
 * Initialize a Paystack transaction.
 * Amount must be in the currency's smallest unit (e.g., kobo for NGN).
 * For NGN: multiply the amount in naira by 100 to get kobo.
 */
export async function initializePaystackTransaction(
  request: PaystackInitializeRequest,
): Promise<{
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}> {
  if (!env.paystackSecretKey) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured on the server.');
  }

  console.info('[Paystack] Initializing transaction', {
    orderId: request.orderId,
    orderNumber: request.orderNumber,
    amount: request.amount,
    email: request.email,
  });

  const response = await fetch(`${PAYSTACK_API_BASE}/transaction/initialize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.paystackSecretKey}`,
    },
    body: JSON.stringify({
      email: request.email,
      amount: request.amount,
      metadata: {
        orderNumber: request.orderNumber,
        orderId: request.orderId,
        ...request.metadata,
      },
    }),
  });

  const responseText = await response.text();
  let data: PaystackInitializeResponse;

  try {
    data = responseText ? (JSON.parse(responseText) as PaystackInitializeResponse) : { status: false, message: 'Empty Paystack response.' };
  } catch {
    console.error('[Paystack] Failed to parse initialize response', { status: response.status, body: responseText.slice(0, 200) });
    throw new Error('Failed to parse Paystack initialization response.');
  }

  if (!response.ok || !data.status || !data.data) {
    console.error('[Paystack] Initialization failed', {
      status: response.status,
      statusText: response.statusText,
      message: data.message,
    });
    throw new Error(data.message || 'Failed to initialize Paystack transaction.');
  }

  return {
    authorizationUrl: data.data.authorization_url,
    accessCode: data.data.access_code,
    reference: data.data.reference,
  };
}

/**
 * Verify a Paystack transaction by reference.
 * This should be called after the customer completes or returns from Paystack.
 */
export async function verifyPaystackTransaction(reference: string): Promise<{
  id: number;
  reference: string;
  amount: number;
  currency: string;
  status: 'success' | 'failed' | 'abandoned';
  paidAt: string;
  createdAt: string;
  customerEmail: string;
}> {
  if (!env.paystackSecretKey) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured on the server.');
  }

  const response = await fetch(`${PAYSTACK_API_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${env.paystackSecretKey}`,
    },
  });

  const responseText = await response.text();
  let data: PaystackVerifyResponse;

  try {
    data = responseText ? (JSON.parse(responseText) as PaystackVerifyResponse) : { status: false, message: 'Empty Paystack response.' };
  } catch {
    console.error('[Paystack] Failed to parse verification response', { status: response.status, body: responseText.slice(0, 200) });
    throw new Error('Failed to parse Paystack verification response.');
  }

  if (!response.ok || !data.status || !data.data) {
    console.error('[Paystack] Verification failed', {
      status: response.status,
      statusText: response.statusText,
      reference,
      message: data.message,
    });
    throw new Error(data.message || 'Failed to verify Paystack transaction.');
  }

  return {
    id: data.data.id,
    reference: data.data.reference,
    amount: data.data.amount,
    currency: data.data.currency,
    status: data.data.status,
    paidAt: data.data.paid_at,
    createdAt: data.data.created_at,
    customerEmail: data.data.customer.email,
  };
}

/**
 * Verify the webhook signature from Paystack.
 * Paystack sends the signature in the x-paystack-signature header.
 * We calculate HMAC SHA512 of the request body using the secret key.
 */
export function verifyPaystackWebhookSignature(
  requestBody: string,
  signature: string,
): boolean {
  if (!env.paystackSecretKey) {
    console.error('Paystack secret key not configured');
    return false;
  }

  const hash = crypto
    .createHmac('sha512', env.paystackSecretKey)
    .update(requestBody)
    .digest('hex');

  return hash === signature;
}

/**
 * Get the public key for frontend Paystack checkout (if using their popup).
 * Note: For security, use server-side initialization.
 */
export function getPublicKey(): string {
  if (!env.paystackPublicKey) {
    throw new Error('Paystack public key not configured');
  }
  return env.paystackPublicKey;
}
