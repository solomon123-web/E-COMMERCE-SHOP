import formData from 'form-data';
import Mailgun from 'mailgun.js';

import { env } from '../config/env';
import type { Order, OrderItem } from '../types';

type MailgunClient = {
  client: (options: { username: string; key: string }) => {
    messages: {
      create: (domain: string, payload: Record<string, unknown>) => Promise<unknown>;
    };
  };
};

const mailgun = new (Mailgun as unknown as new () => MailgunClient)();

/**
 * Send payment confirmation email to the customer.
 * This is sent after successful payment verification.
 */
export async function sendOrderConfirmationEmail(payload: {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  orderTotal: number;
  items: Array<{ name: string; quantity: number; price: number }>;
  shippingAddress: string;
  paymentReference?: string;
}) {
  if (!env.emailEnabled) {
    console.info('Mailgun not configured; skipping order confirmation email for', payload.orderNumber);
    return { ok: true, skipped: true };
  }

  const mg = mailgun.client({ username: 'api', key: env.mailgunApiKey });
  const itemsList = payload.items
    .map(
      (item) =>
        `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">×${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">₦${(item.price * item.quantity).toLocaleString('en-NG')}</td>
    </tr>
    `,
    )
    .join('');

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1f2937; max-width: 640px; margin: 0 auto; background: #ffffff;">
      <div style="background: #f3f4f6; padding: 20px; border-bottom: 2px solid #3b82f6;">
        <h1 style="color: #1f2937; margin: 0; font-size: 28px;">Payment Confirmed</h1>
        <p style="color: #6b7280; margin: 5px 0 0 0;">Order #${payload.orderNumber}</p>
      </div>
      
      <div style="padding: 30px;">
        <p style="font-size: 16px;">Hello ${payload.customerName},</p>
        <p style="color: #4b5563; margin-bottom: 20px;">Thank you for your purchase! Your payment has been successfully received and your order is being prepared for shipment.</p>
        
        <div style="background: #f9fafb; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0;">
          <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Order Details</p>
          <p style="margin: 0; font-size: 18px; font-weight: bold; color: #111827;">Order #${payload.orderNumber}</p>
          ${payload.paymentReference ? `<p style="margin: 5px 0 0 0; color: #6b7280; font-size: 13px;">Reference: ${payload.paymentReference}</p>` : ''}
        </div>

        <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 12px; text-align: left; color: #374151; font-weight: 600;">Product</th>
              <th style="padding: 12px; text-align: center; color: #374151; font-weight: 600;">Qty</th>
              <th style="padding: 12px; text-align: right; color: #374151; font-weight: 600;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsList}
          </tbody>
        </table>

        <div style="border-top: 2px solid #e5e7eb; padding-top: 15px; text-align: right;">
          <p style="margin: 5px 0; color: #6b7280;"><strong>Shipping Address:</strong></p>
          <p style="margin: 0; color: #1f2937;">${payload.shippingAddress}</p>
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 14px; color: #6b7280;">Total Paid</p>
            <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #111827;">₦${payload.orderTotal.toLocaleString('en-NG')}</p>
          </div>
        </div>

        <div style="margin-top: 30px; padding: 20px; background: #eff6ff; border-left: 4px solid #3b82f6;">
          <p style="margin: 0; color: #1e40af; font-weight: 500;">✓ Payment Status: <strong>Verified</strong></p>
          <p style="margin: 5px 0 0 0; color: #1e40af; font-size: 14px;">Your payment has been securely processed and confirmed.</p>
        </div>

        <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">If you have any questions about your order, please reply to this email or contact our support team.</p>
        <p style="color: #6b7280; margin: 10px 0 0 0;">Thank you for shopping with us!</p>
      </div>

      <div style="background: #f3f4f6; padding: 15px; text-align: center; color: #6b7280; font-size: 12px;">
        <p style="margin: 0;">© 2024 Lumora Shop. All rights reserved.</p>
      </div>
    </div>
  `;

  await mg.messages.create(env.mailgunDomain, {
    from: `${env.mailgunFromName} <${env.mailgunFromEmail}>`,
    to: [payload.customerEmail],
    subject: `Payment Confirmed — Order #${payload.orderNumber}`,
    html,
  });

  return { ok: true, skipped: false };
}

/**
 * Send order notification email to the shop owner.
 * This is sent after successful payment verification.
 */
export async function sendOwnerNotificationEmail(order: Order) {
  if (!env.emailEnabled || !env.mailgunOwnerEmail) {
    console.info('Mailgun or owner email not configured; skipping owner notification for', order.orderNumber);
    return { ok: true, skipped: true };
  }

  const mg = mailgun.client({ username: 'api', key: env.mailgunApiKey });
  const itemsList = order.items
    .map(
      (item: OrderItem) =>
        `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.productName}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">×${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">₦${(item.unitPrice * item.quantity).toLocaleString('en-NG')}</td>
    </tr>
    `,
    )
    .join('');

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1f2937; max-width: 640px; margin: 0 auto; background: #ffffff;">
      <div style="background: #1f2937; padding: 20px; border-bottom: 2px solid #3b82f6;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">New Order Received</h1>
        <p style="color: #d1d5db; margin: 5px 0 0 0;">Order #${order.orderNumber}</p>
      </div>
      
      <div style="padding: 30px;">
        <div style="background: #f0fdf4; padding: 15px; border-left: 4px solid #22c55e; margin-bottom: 20px;">
          <p style="margin: 0; font-weight: bold; color: #15803d;">✓ Payment Verified</p>
          <p style="margin: 5px 0 0 0; color: #22c55e;">Amount: ₦${order.total.toLocaleString('en-NG')} • Reference: ${order.paymentReference || 'N/A'}</p>
        </div>

        <h3 style="color: #1f2937; margin-top: 0;">Customer Information</h3>
        <table style="width: 100%; background: #f9fafb; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Name:</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${order.shippingAddress.fullName}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Email:</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${order.email}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Phone:</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${order.phone}</td>
          </tr>
          <tr>
            <td style="padding: 10px; color: #6b7280;">Shipping Address:</td>
            <td style="padding: 10px; font-weight: 500;">${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.state}, ${order.shippingAddress.country} ${order.shippingAddress.postalCode}</td>
          </tr>
        </table>

        <h3 style="color: #1f2937; margin-top: 20px;">Order Items</h3>
        <table style="width: 100%; margin: 15px 0; border-collapse: collapse;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 12px; text-align: left; color: #374151; font-weight: 600;">Product</th>
              <th style="padding: 12px; text-align: center; color: #374151; font-weight: 600;">Qty</th>
              <th style="padding: 12px; text-align: right; color: #374151; font-weight: 600;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsList}
          </tbody>
        </table>

        <div style="border-top: 2px solid #e5e7eb; padding-top: 15px; text-align: right;">
          <div style="margin: 8px 0;">
            <span style="color: #6b7280;">Subtotal:</span>
            <span style="font-weight: 500;">₦${order.subtotal.toLocaleString('en-NG')}</span>
          </div>
          <div style="margin: 8px 0;">
            <span style="color: #6b7280;">Shipping:</span>
            <span style="font-weight: 500;">₦${order.shippingCost.toLocaleString('en-NG')}</span>
          </div>
          ${order.discount > 0 ? `<div style="margin: 8px 0;"><span style="color: #6b7280;">Discount:</span><span style="font-weight: 500;">-₦${order.discount.toLocaleString('en-NG')}</span></div>` : ''}
          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
            <span style="color: #6b7280; font-size: 14px;">Total</span>
            <div style="font-size: 20px; font-weight: bold; color: #111827;">₦${order.total.toLocaleString('en-NG')}</div>
          </div>
        </div>

        <p style="margin-top: 30px; color: #6b7280; font-size: 14px; text-align: center;">Order placed at: ${new Date(order.createdAt).toLocaleString('en-NG')}</p>
      </div>

      <div style="background: #f3f4f6; padding: 15px; text-align: center; color: #6b7280; font-size: 12px;">
        <p style="margin: 0;">Lumora Shop Admin Dashboard</p>
      </div>
    </div>
  `;

  await mg.messages.create(env.mailgunDomain, {
    from: `${env.mailgunFromName} <${env.mailgunFromEmail}>`,
    to: [env.mailgunOwnerEmail],
    subject: `New Order Received - #${order.orderNumber} (₦${order.total.toLocaleString('en-NG')})`,
    html,
  });

  return { ok: true, skipped: false };
}
