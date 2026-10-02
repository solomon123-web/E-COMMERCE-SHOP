import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

import { env } from './config/env';
import type { CartItem, Order, OrderItem, Payment, Product, ShippingAddress, User } from './types';

let demoProducts: Product[] = [
  {
    id: 1,
    name: 'Aurora Headphones',
    slug: 'aurora-headphones',
    description: 'Wireless over-ear headphones with immersive sound and all-day comfort.',
    price: 199.99,
    compareAtPrice: 249.99,
    stockQuantity: 18,
    categoryId: 1,
    image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80',
    status: 'active',
    featured: true,
    rating: 4.8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Luma Smartwatch',
    slug: 'luma-smartwatch',
    description: 'Track workouts, sleep, and notifications on a premium AMOLED display.',
    price: 249.0,
    compareAtPrice: 299.0,
    stockQuantity: 12,
    categoryId: 2,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80',
    status: 'active',
    featured: true,
    rating: 4.7,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'Terra Bottle',
    slug: 'terra-bottle',
    description: 'Stainless steel insulated bottle designed for hydration anywhere.',
    price: 39.99,
    compareAtPrice: 49.99,
    stockQuantity: 35,
    categoryId: 3,
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=80',
    status: 'active',
    featured: false,
    rating: 4.6,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 4,
    name: 'Echo Speaker',
    slug: 'echo-speaker',
    description: 'Compact wireless speaker with room-filling sound and deep bass.',
    price: 89.99,
    compareAtPrice: 119.99,
    stockQuantity: 20,
    categoryId: 1,
    image: 'https://images.unsplash.com/photo-1518444065439-e933c06ce9cd?auto=format&fit=crop&w=900&q=80',
    status: 'active',
    featured: true,
    rating: 4.5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 5,
    name: 'Oak Desk Lamp',
    slug: 'oak-desk-lamp',
    description: 'Minimal ambient desk lamp with touch dimming and warm light.',
    price: 64.99,
    compareAtPrice: 79.99,
    stockQuantity: 25,
    categoryId: 4,
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
    status: 'active',
    featured: false,
    rating: 4.4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 6,
    name: 'Summit Backpack',
    slug: 'summit-backpack',
    description: 'Weather-resistant everyday backpack with quick-access compartments.',
    price: 119.0,
    compareAtPrice: 149.0,
    stockQuantity: 9,
    categoryId: 5,
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
    status: 'active',
    featured: true,
    rating: 4.9,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 7,
    name: 'Nano Camera',
    slug: 'nano-camera',
    description: 'Pocket-sized camera for travelers who want crisp shots on the go.',
    price: 329.0,
    compareAtPrice: 399.0,
    stockQuantity: 5,
    categoryId: 6,
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80',
    status: 'active',
    featured: true,
    rating: 4.8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 8,
    name: 'Arlo Chair',
    slug: 'arlo-chair',
    description: 'Ergonomic office chair with a soft-touch finish and lumbar support.',
    price: 219.99,
    compareAtPrice: 259.99,
    stockQuantity: 8,
    categoryId: 4,
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
    status: 'active',
    featured: false,
    rating: 4.7,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 9,
    name: 'Pulse Pro',
    slug: 'pulse-pro',
    description: 'Advanced fitness tracker designed for precision and everyday life.',
    price: 149.0,
    compareAtPrice: 189.0,
    stockQuantity: 16,
    categoryId: 2,
    image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=900&q=80',
    status: 'active',
    featured: false,
    rating: 4.7,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 10,
    name: 'North Stand',
    slug: 'north-stand',
    description: 'Premium phone stand with magnetic alignment and aluminum construction.',
    price: 49.5,
    compareAtPrice: 65.0,
    stockQuantity: 30,
    categoryId: 3,
    image: 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=900&q=80',
    status: 'active',
    featured: false,
    rating: 4.3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let users: User[] = [];
let carts: Record<string, CartItem[]> = {};
let orders: Order[] = [];
let payments: Payment[] = [];

// Simple file-backed store to survive dev server restarts.
// In ES module mode `__dirname` is not defined; use process.cwd()
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

function loadStore() {
  try {
    if (!fs.existsSync(DATA_FILE)) return;
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw) as any;
    if (Array.isArray(parsed.products)) demoProducts = parsed.products;
    if (Array.isArray(parsed.users)) users = parsed.users;
    if (parsed.carts && typeof parsed.carts === 'object') carts = parsed.carts;
    if (Array.isArray(parsed.orders)) orders = parsed.orders;
    if (Array.isArray(parsed.payments)) payments = parsed.payments;
  } catch (err) {
    // Do not crash on corrupted store - continue with in-memory defaults
    console.error('Failed to load store file:', err instanceof Error ? err.message : String(err));
  }
}

function saveStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    const payload = {
      products: demoProducts,
      users,
      carts,
      orders,
      payments,
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save store file:', err instanceof Error ? err.message : String(err));
  }
}

// Load persisted state if available
loadStore();

const adminPasswordHash = bcrypt.hashSync('Admin123!', 10);
users.push({
  id: 'admin-1',
  name: 'Lumora Admin',
  email: 'admin@lumora.com',
  passwordHash: adminPasswordHash,
  role: 'admin',
  phone: '555010101',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export function sanitizeUser(user: User) {
  const { passwordHash, ...rest } = user;
  return rest;
}

export function signToken(user: User) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    env.jwtSecret,
    { expiresIn: '7d' },
  );
}

export async function createUserAccount(input: { name: string; email: string; password: string }) {
  const normalizedEmail = input.email.trim().toLowerCase();
  if (users.some((user) => user.email === normalizedEmail)) {
    throw new Error('A user with this email already exists.');
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user: User = {
    id: `user-${Date.now()}`,
    name: input.name.trim(),
    email: normalizedEmail,
    passwordHash,
    role: 'customer',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  users.push(user);
  carts[user.id] = [];
  saveStore();
  return user;
}

export async function loginUser(input: { email: string; password: string }) {
  const user = users.find((candidate) => candidate.email.toLowerCase() === input.email.trim().toLowerCase());
  if (!user) {
    throw new Error('Incorrect email or password.');
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw new Error('Incorrect email or password.');
  }

  return signToken(user);
}

export function getCatalog() {
  return demoProducts.map((product) => ({ ...product }));
}

export function getProductById(productId: number) {
  return demoProducts.find((product) => product.id === productId) ?? null;
}

export function getCartByUser(userId: string) {
  return (carts[userId] ?? []).map((item) => ({ ...item }));
}

export function addItemToCart(userId: string, productId: number, quantity: number) {
  const product = getProductById(productId);
  if (!product) {
    throw new Error('Product not found.');
  }

  if (product.stockQuantity <= 0) {
    throw new Error('This product is currently out of stock.');
  }

  const existing = (carts[userId] ?? []).find((item) => item.productId === productId);
  const nextQuantity = existing ? existing.quantity + quantity : quantity;

  if (nextQuantity > product.stockQuantity) {
    throw new Error(`Only ${product.stockQuantity} items available in stock.`);
  }

  if (existing) {
    existing.quantity = nextQuantity;
    existing.updatedAt = new Date().toISOString();
    return existing;
  }

  const item: CartItem = {
    id: `cart-${Date.now()}`,
    productId,
    quantity,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  carts[userId] = [...(carts[userId] ?? []), item];
  saveStore();
  return item;
}

export function updateCartItem(userId: string, itemId: string, quantity: number) {
  const cart = carts[userId] ?? [];
  const item = cart.find((entry) => entry.id === itemId);
  if (!item) {
    throw new Error('Cart item not found.');
  }

  const product = getProductById(item.productId);
  if (!product) {
    throw new Error('Product not found.');
  }

  if (quantity <= 0) {
    carts[userId] = cart.filter((entry) => entry.id !== itemId);
    return null;
  }

  if (quantity > product.stockQuantity) {
    throw new Error(`Only ${product.stockQuantity} items available in stock.`);
  }

  item.quantity = quantity;
  item.updatedAt = new Date().toISOString();
  saveStore();
  return item;
}

export function removeCartItem(userId: string, itemId: string) {
  carts[userId] = (carts[userId] ?? []).filter((entry) => entry.id !== itemId);
  saveStore();
}

export function clearCart(userId: string) {
  carts[userId] = [];
  saveStore();
}

export function getStats() {
  return {
    totalOrders: orders.length,
    totalCustomers: users.filter((user) => user.role === 'customer').length,
    totalProducts: demoProducts.length,
    revenue: orders.reduce((sum, order) => sum + order.total, 0),
    recentOrders: orders.slice(-5),
    lowStockProducts: demoProducts.filter((product) => product.stockQuantity < 10).length,
  };
}

export function getUserById(userId: string) {
  return users.find((user) => user.id === userId) ?? null;
}

export function getUserOrders(userId: string) {
  return orders.filter((order) => order.userId === userId);
}

export function getOrderById(orderId: string, userId: string) {
  return orders.find((order) => order.id === orderId && order.userId === userId) ?? null;
}

export function getOrderByPublicNumber(orderNumber: string) {
  return orders.find((order) => order.orderNumber === orderNumber) ?? null;
}

export function createOrder(input: {
  userId?: string | null;
  userEmail: string;
  shippingAddress: ShippingAddress;
  items: Array<{ productId: number; quantity: number }>;
}) {
  if (!input.items.length) {
    throw new Error('Cannot create an empty order.');
  }

  const resolvedItems: OrderItem[] = [];
  let subtotal = 0;

  // Validate all items and calculate totals
  for (const item of input.items) {
    const product = getProductById(item.productId);
    if (!product) {
      throw new Error(`Product ${item.productId} was not found.`);
    }

    if (item.quantity <= 0) {
      throw new Error('Quantity must be greater than zero.');
    }

    if (product.stockQuantity < item.quantity) {
      throw new Error(`Only ${product.stockQuantity} item(s) left for ${product.name}.`);
    }

    const totalPrice = product.price * item.quantity;
    subtotal += totalPrice;

    resolvedItems.push({
      productId: product.id,
      productName: product.name,
      quantity: item.quantity,
      unitPrice: product.price,
      totalPrice,
    });
  }

  const shippingCost = subtotal > 150 ? 0 : 14.99;
  const discount = 0;
  const total = subtotal + shippingCost - discount;

  const user = input.userId ? getUserById(input.userId) : users.find((candidate) => candidate.email === input.userEmail);
  
  // Create order in PENDING status - payment must be verified before fulfillment
  const order: Order = {
    id: `order-${Date.now()}`,
    orderNumber: `LUM-${Math.floor(100000 + Math.random() * 900000)}`,
    userId: user?.id ?? null,
    email: input.userEmail,
    phone: input.shippingAddress.phone,
    shippingAddress: input.shippingAddress,
    items: resolvedItems,
    subtotal,
    shippingCost,
    discount,
    total,
    paymentStatus: 'pending', // Order starts as pending - NOT automatically paid
    orderStatus: 'pending', // Order is pending payment
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  orders.push(order);
  saveStore();

  // Note: Stock is NOT reduced yet - it will be reduced only after payment verification
  // This prevents overselling if payment fails

  return order;
}

export function getAllUsers() {
  return users.map((user) => sanitizeUser(user));
}

export function getPublicProduct(product: Product) {
  return {
    ...product,
    stockStatus: product.stockQuantity > 0 ? 'In stock' : 'Out of stock',
  };
}

/**
 * Create a payment record for an order.
 * This is called when Paystack transaction is initialized.
 */
export function createPayment(input: {
  orderId: string;
  paystackReference: string;
  amount: number;
  currency: string;
}): Payment {
  const payment: Payment = {
    id: `payment-${Date.now()}`,
    orderId: input.orderId,
    paystackReference: input.paystackReference,
    amount: input.amount,
    currency: input.currency,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  payments.push(payment);
  saveStore();
  return payment;
}

/**
 * Get payment by Paystack reference.
 */
export function getPaymentByReference(reference: string): Payment | null {
  return payments.find((p) => p.paystackReference === reference) ?? null;
}

/**
 * Get payment by order ID.
 */
export function getPaymentByOrderId(orderId: string): Payment | null {
  return payments.find((p) => p.orderId === orderId) ?? null;
}

/**
 * Verify and confirm payment. This is called after Paystack verification.
 * Only after this should we update order status and reduce inventory.
 */
export function confirmPayment(input: {
  paystackReference: string;
  paystackTransactionId: number;
  verifiedAmount: number;
  verifiedCurrency: string;
  status: 'success' | 'failed' | 'abandoned';
}): { success: boolean; order: Order | null; message: string } {
  const payment = getPaymentByReference(input.paystackReference);
  if (!payment) {
    return { success: false, order: null, message: 'Payment not found' };
  }

  const order = getOrderById(payment.orderId, '');
  if (!order) {
    return { success: false, order: null, message: 'Associated order not found' };
  }

  // Verify amount matches
  if (input.verifiedAmount !== payment.amount) {
    payment.status = 'failed';
    payment.updatedAt = new Date().toISOString();
    return {
      success: false,
      order: null,
      message: `Amount mismatch: expected ${payment.amount}, got ${input.verifiedAmount}`,
    };
  }

  // Verify currency matches
  if (input.verifiedCurrency !== payment.currency) {
    payment.status = 'failed';
    payment.updatedAt = new Date().toISOString();
    return {
      success: false,
      order: null,
      message: `Currency mismatch: expected ${payment.currency}, got ${input.verifiedCurrency}`,
    };
  }

  // Only confirm if payment status is success
  if (input.status !== 'success') {
    payment.status = input.status;
    payment.updatedAt = new Date().toISOString();
    order.paymentStatus = input.status;
    order.updatedAt = new Date().toISOString();
    return {
      success: false,
      order,
      message: `Payment not successful: ${input.status}`,
    };
  }

  // All validations passed - confirm the payment
  payment.status = 'success';
  payment.paystackTransactionId = input.paystackTransactionId;
  payment.verifiedAmount = input.verifiedAmount;
  payment.verifiedCurrency = input.verifiedCurrency;
  payment.verifiedAt = new Date().toISOString();
  payment.updatedAt = new Date().toISOString();

  // Update order to PAID and CONFIRMED
  order.paymentStatus = 'paid';
  order.paymentReference = input.paystackReference;
  order.paystackTransactionId = input.paystackTransactionId;
  order.orderStatus = 'confirmed';
  order.updatedAt = new Date().toISOString();

  // NOW reduce inventory (only after payment is confirmed)
  for (const item of order.items) {
    const product = getProductById(item.productId);
    if (product) {
      product.stockQuantity -= item.quantity;
      product.updatedAt = new Date().toISOString();
    }
  }

  // Clear the customer's cart
  if (order.userId) {
    clearCart(order.userId);
  }

  return { success: true, order, message: 'Payment confirmed' };
}

/**
 * Mark confirmation email as sent (idempotency).
 */
export function markConfirmationEmailSent(orderId: string): void {
  const order = orders.find((o) => o.id === orderId);
  if (order) {
    order.confirmationEmailSentAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();
  }
}

/**
 * Check if confirmation email has already been sent.
 */
export function hasConfirmationEmailBeenSent(orderId: string): boolean {
  const order = orders.find((o) => o.id === orderId);
  return order?.confirmationEmailSentAt ? true : false;
}
