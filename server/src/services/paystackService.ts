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
    throw new Error('Paystack secret key not configured');
  }

  // Amount is expected to be in kobo already (multiply naira by 100)
  const response = await fetch(`${PAYSTACK_API_BASE}/transaction/initialize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.paystackSecretKey}`,
    },
    body: JSON.stringify({
      email: request.email,
      amount: request.amount, // in kobo (100 = ₦1.00)
      metadata: {
        orderNumber: request.orderNumber,
        orderId: request.orderId,
        ...request.metadata,
      },
    }),
  });

  const data = (await response.json()) as PaystackInitializeResponse;

  if (!data.status || !data.data) {
    throw new Error(data.message || 'Failed to initialize Paystack transaction');
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
    throw new Error('Paystack secret key not configured');
  }

  const response = await fetch(`${PAYSTACK_API_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${env.paystackSecretKey}`,
    },
  });

  const data = (await response.json()) as PaystackVerifyResponse;

  if (!data.status || !data.data) {
    throw new Error(data.message || 'Failed to verify Paystack transaction');
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
