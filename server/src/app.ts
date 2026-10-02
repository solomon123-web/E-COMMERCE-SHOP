import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import morgan from 'morgan';
import { z } from 'zod';

import { env } from './config/env';
import { sendOrderConfirmationEmail, sendOwnerNotificationEmail } from './services/emailService';
import {
  confirmPayment,
  createOrder,
  createPayment,
  createUserAccount,
  getAllUsers,
  getCartByUser,
  getCatalog,
  getOrderById,
  getOrderByPublicNumber,
  getPaymentByOrderId,
  getPaymentByReference,
  getProductById,
  getStats,
  getUserById,
  getUserOrders,
  hasConfirmationEmailBeenSent,
  loginUser,
  markConfirmationEmailSent,
  removeCartItem,
  sanitizeUser,
  signToken,
  updateCartItem,
  addItemToCart,
  clearCart,
} from './store';
import {
  initializePaystackTransaction,
  verifyPaystackTransaction,
  verifyPaystackWebhookSignature,
} from './services/paystackService';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const orderSchema = z.object({
  userEmail: z.string().email().optional(),
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
  shippingAddress: z.object({
    fullName: z.string().min(2),
    phone: z.string().min(7),
    address: z.string().min(5),
    city: z.string().min(2),
    state: z.string().min(2),
    country: z.string().min(2),
    postalCode: z.string().min(3),
  }),
});

function getTokenFromRequest(req: Request) {
  const authHeader = req.headers.authorization ?? '';
  return authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
}

async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = getTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret) as { sub: string; email: string; role: string };
    const user = getUserById(payload.sub);
    if (!user) {
      return res.status(401).json({ message: 'Session invalid. Please log in again.' });
    }
    req.user = { ...sanitizeUser(user), id: user.id };
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Your session has expired. Please log in again.' });
  }
}

function adminOnly(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }
  return next();
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, status: 'healthy', service: 'lumora-shop' });
});

app.post('/api/auth/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Please provide a valid name, email, and password.' });
  }

  try {
    const user = await createUserAccount(parsed.data);
    const token = signToken(user);
    return res.status(201).json({ user: sanitizeUser(user), token });
  } catch (error) {
    return res.status(400).json({ message: error instanceof Error ? error.message : 'Could not create account.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Please provide a valid email and password.' });
  }

  try {
    const token = await loginUser(parsed.data);
    const claims = jwt.decode(token) as { sub?: string } | null;
    const user = claims?.sub ? getUserById(claims.sub) : null;

    if (!user) {
      return res.status(401).json({ message: 'Unable to authenticate user.' });
    }

    return res.json({ token, user: sanitizeUser(user) });
  } catch (error) {
    return res.status(401).json({ message: error instanceof Error ? error.message : 'Login failed.' });
  }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

app.get('/api/auth/google', (_req, res) => {
  if (!env.googleClientId) {
    return res.status(503).json({
      message: 'Google OAuth is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL in your environment.',
    });
  }

  return res.json({
    message: 'Google OAuth is configured for production use.',
    redirectUrl: `/auth/google?clientId=${env.googleClientId}`,
  });
});

app.get('/api/auth/google/callback', (_req, res) => {
  return res.json({
    message: 'Google OAuth callback has been prepared. Configure the real provider credentials to enable sign-in.',
  });
});

app.get('/api/products', (_req, res) => {
  res.json({ products: getCatalog() });
});

app.get('/api/products/:id', (req, res) => {
  const product = getProductById(Number(req.params.id));
  if (!product) {
    return res.status(404).json({ message: 'Product not found.' });
  }
  return res.json({ product });
});

app.get('/api/cart', authMiddleware, (req, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  const cart = getCartByUser(user.id);
  return res.json({ cart });
});

app.post('/api/cart/items', authMiddleware, (req, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  const productId = Number(req.body.productId);
  const quantity = Number(req.body.quantity ?? 1);
  try {
    const item = addItemToCart(user.id, productId, quantity);
    return res.status(201).json({ item });
  } catch (error) {
    return res.status(400).json({ message: error instanceof Error ? error.message : 'Unable to add item to cart.' });
  }
});

app.put('/api/cart/items/:id', authMiddleware, (req, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  const quantity = Number(req.body.quantity ?? 1);
  const cartItemId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  try {
    const item = updateCartItem(user.id, cartItemId, quantity);
    return res.json({ item });
  } catch (error) {
    return res.status(400).json({ message: error instanceof Error ? error.message : 'Unable to update cart item.' });
  }
});

app.delete('/api/cart/items/:id', authMiddleware, (req, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  const cartItemId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  removeCartItem(user.id, cartItemId);
  return res.status(204).send();
});

app.delete('/api/cart', authMiddleware, (req, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  clearCart(user.id);
  return res.status(204).send();
});

app.get('/api/orders', authMiddleware, (req, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  const ordersForUser = getUserOrders(user.id);
  return res.json({ orders: ordersForUser });
});

app.get('/api/orders/:id', authMiddleware, (req, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  const orderId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const order = getOrderById(orderId, user.id);
  if (!order) {
    return res.status(404).json({ message: 'Order not found.' });
  }
  return res.json({ order });
});

app.post('/api/orders', authMiddleware, async (req, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  console.log('[Order Creation] Content-Type:', req.headers['content-type']);
  console.log('[Order Creation] Body exists:', req.body !== undefined);
  console.log('[Order Creation] Body:', req.body);
  console.log('[Order Creation] Received request body:', JSON.stringify(req.body, null, 2));
  console.log('[Order Creation] User:', user.id, user.email);

  const parsed = orderSchema.safeParse(req.body);
  if (!parsed.success) {
    console.error('[Order Creation] Validation failed:', parsed.error.errors);
    const errors = parsed.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
    return res.status(400).json({ 
      message: 'Please provide valid order information.',
      details: errors,
      receivedData: req.body
    });
  }

  console.log('[Order Creation] Validation passed. Items:', parsed.data.items);

  try {
    const order = createOrder({
      userId: user.id,
      userEmail: user.email,
      shippingAddress: {
        fullName: parsed.data.shippingAddress.fullName,
        phone: parsed.data.shippingAddress.phone,
        address: parsed.data.shippingAddress.address,
        city: parsed.data.shippingAddress.city,
        state: parsed.data.shippingAddress.state,
        country: parsed.data.shippingAddress.country,
        postalCode: parsed.data.shippingAddress.postalCode,
      },
      items: parsed.data.items,
    });

    // Order is created in PENDING status
    // Confirmation email will only be sent after payment is verified
    // Stock will only be reduced after payment is verified

    return res.status(201).json({ order });
  } catch (error) {
    return res.status(400).json({ message: error instanceof Error ? error.message : 'Unable to process the order.' });
  }
});

app.get('/api/addresses', authMiddleware, (_req, res) => {
  res.json({ addresses: [] });
});

app.get('/api/admin/stats', authMiddleware, adminOnly, (_req, res) => {
  res.json({ stats: getStats() });
});

app.get('/api/admin/customers', authMiddleware, adminOnly, (_req, res) => {
  res.json({ customers: getAllUsers() });
});

app.get('/api/admin/orders', authMiddleware, adminOnly, (_req, res) => {
  res.json({ orders: [] });
});

// ============================================
// PAYSTACK PAYMENT ENDPOINTS
// ============================================

/**
 * POST /api/payments/paystack/initialize
 * Initialize a Paystack transaction for an order.
 * Frontend sends the order ID, backend calculates amount from database.
 */
app.post('/api/payments/paystack/initialize', authMiddleware, async (req, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  const { orderId } = req.body;
  if (!orderId || typeof orderId !== 'string') {
    return res.status(400).json({ message: 'Order ID is required.' });
  }

  try {
    // Retrieve the order
    const order = getOrderById(orderId, user.id);
    console.log('[Paystack Init] orderId:', orderId, 'userId:', user.id);
    console.log('[Paystack Init] order found:', Boolean(order));
    if (!order) {
      console.error('[Paystack Init] Order not found for given id and user');
      return res.status(404).json({ message: 'Order not found.' });
    }

    // Order must be pending payment
    if (order.paymentStatus !== 'pending') {
      console.error('[Paystack Init] Order paymentStatus not pending:', order.paymentStatus);
      return res.status(400).json({ message: 'This order cannot be paid now.' });
    }

    // Check if Paystack is configured
    if (!env.paystackSecretKey) {
      console.error('[Paystack Init] Paystack secret key not configured');
      return res.status(503).json({
        message: 'PAYSTACK_SECRET_KEY is not configured on the server.',
      });
    }

    // Calculate amount in kobo (1 naira = 100 kobo)
    const amountInKobo = Math.round(order.total * 100);
    console.log('[Paystack Init] order.total:', order.total, 'amountInKobo:', amountInKobo);

    // Initialize Paystack transaction
    const paystackResponse = await initializePaystackTransaction({
      email: order.email,
      amount: amountInKobo,
      orderNumber: order.orderNumber,
      orderId: order.id,
    });

    // Create payment record
    const payment = createPayment({
      orderId: order.id,
      paystackReference: paystackResponse.reference,
      amount: amountInKobo,
      currency: 'NGN',
    });

    return res.status(201).json({
      payment: {
        id: payment.id,
        reference: payment.paystackReference,
        amount: payment.amount,
        currency: payment.currency,
        authorizationUrl: paystackResponse.authorizationUrl,
        accessCode: paystackResponse.accessCode,
      },
    });
  } catch (error) {
    console.error('Paystack initialization error:', error);
    return res.status(400).json({
      message: error instanceof Error ? error.message : 'Failed to initialize payment.',
    });
  }
});

/**
 * GET /api/payments/paystack/verify/:reference
 * Verify a Paystack transaction and confirm the payment.
 * This should be called after the customer returns from Paystack.
 */
app.get('/api/payments/paystack/verify/:reference', authMiddleware, async (req, res) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  const { reference } = req.params;
  if (!reference || typeof reference !== 'string') {
    return res.status(400).json({ message: 'Payment reference is required.' });
  }

  try {
    // Check if payment exists
    const payment = getPaymentByReference(reference);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found.' });
    }

    // Get associated order
    const order = getOrderById(payment.orderId, '');
    if (!order) {
      return res.status(404).json({ message: 'Associated order not found.' });
    }

    // Verify user owns this order
    if (order.userId !== user.id) {
      return res.status(403).json({ message: 'Unauthorized access to this order.' });
    }

    // Verify transaction with Paystack
    const verifiedTransaction = await verifyPaystackTransaction(reference);

    // Confirm the payment (this updates order status and reduces inventory)
    const confirmResult = confirmPayment({
      paystackReference: reference,
      paystackTransactionId: verifiedTransaction.id,
      verifiedAmount: verifiedTransaction.amount,
      verifiedCurrency: verifiedTransaction.currency,
      status: verifiedTransaction.status,
    });

    if (!confirmResult.success || !confirmResult.order) {
      return res.status(400).json({
        message: confirmResult.message,
        paymentStatus: 'failed',
      });
    }

    // Send confirmation emails (only if not already sent - idempotency)
    const confirmationEmailAlreadySent = hasConfirmationEmailBeenSent(confirmResult.order.id);
    if (!confirmationEmailAlreadySent) {
      try {
        // Send customer confirmation email
        await sendOrderConfirmationEmail({
          customerName: user.name,
          customerEmail: order.email,
          orderNumber: confirmResult.order.orderNumber,
          paymentReference: reference,
          orderTotal: confirmResult.order.total,
          items: confirmResult.order.items.map((item) => ({
            name: item.productName,
            quantity: item.quantity,
            price: item.unitPrice,
          })),
          shippingAddress: `${confirmResult.order.shippingAddress.address}, ${confirmResult.order.shippingAddress.city}, ${confirmResult.order.shippingAddress.country}`,
        });

        // Send owner notification email
        await sendOwnerNotificationEmail(confirmResult.order);

        // Mark email as sent
        markConfirmationEmailSent(confirmResult.order.id);
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        // Email failure should not fail the payment confirmation
        // Payment is already confirmed
      }
    }

    return res.json({
      message: 'Payment verified successfully',
      paymentStatus: 'paid',
      order: confirmResult.order,
    });
  } catch (error) {
    console.error('Paystack verification error:', error);
    return res.status(400).json({
      message: error instanceof Error ? error.message : 'Failed to verify payment.',
      paymentStatus: 'failed',
    });
  }
});

/**
 * POST /api/payments/paystack/webhook
 * Webhook endpoint for Paystack to send payment confirmation.
 * This is critical for payments that complete after the customer closes their browser.
 */
app.post('/api/payments/paystack/webhook', async (req, res) => {
  // Verify webhook signature
  const signature = req.headers['x-paystack-signature'];
  if (!signature || typeof signature !== 'string') {
    console.warn('Webhook received without signature');
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const rawBody = JSON.stringify(req.body);
  const isSignatureValid = verifyPaystackWebhookSignature(rawBody, signature);

  if (!isSignatureValid) {
    console.warn('Webhook received with invalid signature');
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const { event, data } = req.body;

    // Only process successful charge events
    if (event !== 'charge.success') {
      console.log(`Webhook event received: ${event}, no action needed`);
      return res.status(200).json({ message: 'Webhook processed' });
    }

    const reference = data.reference;
    const transactionId = data.id;
    const amount = data.amount; // in kobo
    const currency = data.currency;
    const status = data.status;

    console.log(`Processing Paystack webhook for reference: ${reference}`);

    // Check if payment exists
    const payment = getPaymentByReference(reference);
    if (!payment) {
      console.warn(`Payment not found for reference: ${reference}`);
      return res.status(200).json({ message: 'Webhook processed' });
    }

    // Get associated order
    const order = getOrderById(payment.orderId, '');
    if (!order) {
      console.warn(`Order not found for payment: ${reference}`);
      return res.status(200).json({ message: 'Webhook processed' });
    }

    // Confirm the payment
    const confirmResult = confirmPayment({
      paystackReference: reference,
      paystackTransactionId: transactionId,
      verifiedAmount: amount,
      verifiedCurrency: currency,
      status,
    });

    if (!confirmResult.success || !confirmResult.order) {
      console.error(`Payment confirmation failed: ${confirmResult.message}`);
      return res.status(200).json({ message: 'Webhook processed' });
    }

    // Send confirmation emails (only if not already sent - idempotency)
    const confirmationEmailAlreadySent = hasConfirmationEmailBeenSent(confirmResult.order.id);
    if (!confirmationEmailAlreadySent) {
      try {
        // Send customer confirmation email
        await sendOrderConfirmationEmail({
          customerName: order.shippingAddress.fullName,
          customerEmail: order.email,
          orderNumber: confirmResult.order.orderNumber,
          paymentReference: reference,
          orderTotal: confirmResult.order.total,
          items: confirmResult.order.items.map((item) => ({
            name: item.productName,
            quantity: item.quantity,
            price: item.unitPrice,
          })),
          shippingAddress: `${confirmResult.order.shippingAddress.address}, ${confirmResult.order.shippingAddress.city}, ${confirmResult.order.shippingAddress.country}`,
        });

        // Send owner notification email
        await sendOwnerNotificationEmail(confirmResult.order);

        // Mark email as sent
        markConfirmationEmailSent(confirmResult.order.id);
      } catch (emailError) {
        console.error('Email sending error in webhook:', emailError);
        // Email failure should not fail the webhook response
      }
    }

    console.log(`Payment confirmed via webhook for order: ${order.orderNumber}`);
    return res.status(200).json({ message: 'Webhook processed' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Always return 200 to prevent Paystack from retrying
    return res.status(200).json({ message: 'Webhook processed' });
  }
});

app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
});

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        role: string;
      };
    }
  }
}

(app as typeof app & { locals?: { env?: typeof env } }).locals = { env };

export default app;
