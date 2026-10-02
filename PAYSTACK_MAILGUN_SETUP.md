# Real Paystack Payment + Mailgun Integration Guide

This document provides complete setup instructions for configuring the real Paystack payment system and Mailgun email service with your Lumora e-commerce application.

## ✅ Implementation Complete

This application now includes:

- **Real Paystack API integration** (not mock/fake)
- **Real Mailgun email sending** with customer and owner notifications
- **Secure server-side payment verification**
- **Webhook-based payment confirmation**
- **Proper inventory management** (stock reduced only after payment confirmation)
- **Idempotent payment processing** (duplicate webhook protection)
- **Production-ready architecture**

---

## 1. PAYSTACK CONFIGURATION

### Step 1.1: Create a Paystack Account

1. Go to [https://paystack.com](https://paystack.com)
2. Click **Sign up** and create your account
3. Complete identity verification (required for live payments)
4. Navigate to **Settings > API Keys & Webhooks**

### Step 1.2: Get Your API Keys

In the Paystack Dashboard:
- **Public Key**: Copy your public key (starts with `pk_live_` or `pk_test_`)
- **Secret Key**: Copy your secret key (starts with `sk_live_` or `sk_test_`)

> ⚠️ IMPORTANT: Never commit the secret key to version control. It should ONLY be in your `.env` file on the server.

### Step 1.3: Configure Webhook

1. In Paystack Dashboard, go to **Settings > API Keys & Webhooks**
2. Under **Webhooks**, click **Add Webhook**
3. Enter your webhook URL:
   ```
   https://your-domain.com/api/payments/paystack/webhook
   ```
   (For local development, use a service like [ngrok](https://ngrok.com) to tunnel your local port)

4. Select these events:
   - `charge.success`
   - `charge.failed`
   - `charge.incomplete`

5. Save the webhook

### Step 1.4: Set Callback URL (Frontend)

The callback URL is where Paystack redirects the customer after payment:

```
https://your-domain.com/order-success
```

This is configured in your `.env` file as `PAYSTACK_CALLBACK_URL`.

---

## 2. MAILGUN CONFIGURATION

### Step 2.1: Create a Mailgun Account

1. Go to [https://mailgun.com](https://mailgun.com)
2. Sign up for a free account
3. Verify your email

### Step 2.2: Add a Sending Domain

1. In Mailgun Dashboard, go to **Sending > Domains**
2. Click **Add New Domain**
3. Enter your domain (e.g., `mail.yourdomain.com`)
4. Mailgun will provide DNS records to add to your domain registrar

### Step 2.3: Add DNS Records

Mailgun will show you records like:

```
Type: MX
Name: mail.yourdomain.com
Value: mxa.mailgun.org (10 priority)
```

Add these DNS records to your domain registrar (GoDaddy, Namecheap, AWS Route 53, etc.):

- **MX Records** (for receiving email)
- **TXT Records** (for SPF verification)
- **CNAME Records** (for DKIM signing)

> This typically takes 24-48 hours to propagate.

### Step 2.4: Get Your Mailgun Credentials

1. In Mailgun Dashboard, go to **Account > API Security**
2. Copy your **Private API Key**
3. Note your **Sending Domain** (e.g., `mail.yourdomain.com`)

### Step 2.5: Add Authorized Recipients (Sandbox Only)

If using a Mailgun **sandbox domain**:
- Add authorized recipient email addresses under **Sending > Authorized Recipients**
- Emails can only be sent to these addresses in sandbox mode

For **production** with your own domain:
- No authorized recipients needed
- Can send to any email address

---

## 3. ENVIRONMENT VARIABLES

Copy the following to your `.env` file (server root):

```bash
# Server
PORT=4000
APP_URL=http://localhost:5173

# Security
JWT_SECRET=your-secure-random-string-here

# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_test_XXXXXXXX (or sk_live_XXXXXXXX for production)
PAYSTACK_PUBLIC_KEY=pk_test_XXXXXXXX (or pk_live_XXXXXXXX for production)
PAYSTACK_CALLBACK_URL=http://localhost:5173/order-success

# Mailgun Configuration
MAILGUN_API_KEY=key-XXXXXXXX
MAILGUN_DOMAIN=mail.yourdomain.com
MAILGUN_FROM_EMAIL=noreply@mail.yourdomain.com
MAILGUN_FROM_NAME=Lumora Shop
MAILGUN_OWNER_EMAIL=your-email@yourdomain.com

# Database (if using PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/lumora

# Frontend
VITE_API_URL=http://localhost:4000/api
```

### Environment Variable Requirements

| Variable | Required | Secret | Purpose |
|----------|----------|--------|---------|
| `PAYSTACK_SECRET_KEY` | Yes | ✅ Yes | Backend payment verification |
| `PAYSTACK_PUBLIC_KEY` | Yes | ❌ No | Frontend/Backend initialization |
| `PAYSTACK_CALLBACK_URL` | Yes | ❌ No | Redirect URL after payment |
| `MAILGUN_API_KEY` | Yes | ✅ Yes | Email sending authentication |
| `MAILGUN_DOMAIN` | Yes | ❌ No | Sender domain |
| `MAILGUN_FROM_EMAIL` | Yes | ❌ No | Sender email address |
| `MAILGUN_FROM_NAME` | Yes | ❌ No | Sender display name |
| `MAILGUN_OWNER_EMAIL` | Yes | ❌ No | Owner notification recipient |

---

## 4. TEST MODE vs. LIVE MODE

### Test Mode (Development)

Use Paystack **test credentials**:
- Public Key: `pk_test_...`
- Secret Key: `sk_test_...`

Test cards provided by Paystack:
- **Visa**: 4084084084084081 (any future expiry, any CVV)
- **Mastercard**: 5531887632127111

### Live Mode (Production)

1. Switch Paystack account to **Live** mode
2. Update `.env` with **live credentials**:
   - Public Key: `pk_live_...`
   - Secret Key: `sk_live_...`
3. Use real customer credit cards
4. Ensure webhook URL is publicly accessible
5. Use Mailgun **production domain** (not sandbox)

---

## 5. LOCAL TESTING WITH NGROK

To test the webhook locally:

### Step 5.1: Install ngrok

```bash
brew install ngrok  # macOS
# or download from https://ngrok.com/download
```

### Step 5.2: Start ngrok

```bash
ngrok http 4000
```

This gives you a URL like: `https://xxxx-xx-xxx-xxx-xx.ngrok.io`

### Step 5.3: Configure Paystack

Update your Paystack webhook URL:
```
https://xxxx-xx-xxx-xxx-xx.ngrok.io/api/payments/paystack/webhook
```

Update your `.env`:
```bash
PAYSTACK_CALLBACK_URL=https://xxxx-xx-xxx-xxx-xx.ngrok.io/order-success
```

### Step 5.4: Start Your Application

```bash
npm run dev
```

---

## 6. COMPLETE PAYMENT FLOW

```
┌─────────────┐
│  Customer   │
│  (Browser)  │
└──────┬──────┘
       │
       │ 1. Adds items to cart
       │ 2. Clicks "Checkout"
       ↓
┌──────────────────┐
│ Checkout Page    │
│ - Fills address  │
│ - Clicks "Pay"   │
└────────┬─────────┘
         │
         │ 3. POST /api/orders
         ↓
    ┌────────────────────────┐
    │ Backend Creates Order  │
    │ - Status: PENDING      │
    │ - Stock NOT reduced    │
    │ - No email sent        │
    └─────────┬──────────────┘
              │
              │ 4. POST /api/payments/paystack/initialize
              ↓
         ┌────────────────────────┐
         │ Paystack API           │
         │ - Creates transaction  │
         │ - Returns auth URL     │
         └────────┬───────────────┘
                  │
                  │ 5. Frontend redirects to Paystack checkout
                  ↓
            ┌────────────┐
            │ Paystack   │
            │ (Customer  │
            │  enters    │
            │  payment)  │
            └─────┬──────┘
                  │
                  │ 6. Payment success
                  │    Redirects to /order-success?reference=xxx
                  ↓
         ┌──────────────────────────────┐
         │ Order Success Page           │
         │ - Calls /verify endpoint     │
         │ - Backend verifies with      │
         │   Paystack API              │
         │ - Confirms payment          │
         │ - Reduces stock             │
         │ - Sends confirmation emails │
         │ - Displays order details    │
         └──────────────────────────────┘
         
         [ALSO] Webhook Path:
         
         ┌────────────────────┐
         │ Paystack Webhook   │
         │ charge.success     │
         └────────┬───────────┘
                  │
                  │ 7. POST /api/payments/paystack/webhook
                  ↓
         ┌──────────────────────┐
         │ Backend Webhook      │
         │ - Verifies signature │
         │ - Confirms payment   │
         │ - Sends emails       │
         │ - Updates order      │
         └──────────────────────┘
```

---

## 7. TESTING THE INTEGRATION

### Test Successful Payment

1. Start the application:
   ```bash
   npm run dev
   ```

2. Create a test account and log in

3. Add products to cart

4. Go to checkout and fill in details

5. Click "Pay with Paystack"

6. Use test card: `4084084084084081` (any future expiry, any CVV)

7. Complete payment in Paystack

8. Verify:
   - ✅ Redirected to order success page
   - ✅ Order status is "confirmed"
   - ✅ Payment status is "paid"
   - ✅ Stock has been reduced
   - ✅ Cart is cleared
   - ✅ Confirmation email received (check mailbox/spam)
   - ✅ Owner email received (check `MAILGUN_OWNER_EMAIL`)

### Test Failed Payment

1. In Paystack checkout, click **X** or close the window
2. Verify order remains in "pending" status
3. Verify stock is NOT reduced
4. Verify no confirmation email is sent
5. Customer can retry payment

### Test Webhook

1. Use [Postman](https://postman.com) or `curl` to simulate webhook:

```bash
# Generate HMAC signature
BODY='{"event":"charge.success","data":{"id":12345,"reference":"ABC123","amount":100000,"currency":"NGN","status":"success"}}'
SIGNATURE=$(echo -n "$BODY" | openssl dgst -sha512 -mac HMAC -macopt key="sk_test_XXXXXXXX" | cut -d' ' -f2)

curl -X POST http://localhost:4000/api/payments/paystack/webhook \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: $SIGNATURE" \
  -d "$BODY"
```

---

## 8. PRODUCTION CHECKLIST

Before going live:

- [ ] Switch Paystack credentials to **live mode**
- [ ] Use Mailgun **production domain** (not sandbox)
- [ ] Update `PAYSTACK_CALLBACK_URL` to production URL
- [ ] Update `APP_URL` to production URL
- [ ] Configure Paystack webhook for production URL
- [ ] Test complete payment flow with real payment method
- [ ] Verify emails are sent correctly (check spam folder)
- [ ] Set up monitoring for failed payments
- [ ] Document refund process
- [ ] Test admin order viewing
- [ ] Set up database backups
- [ ] Enable HTTPS on all endpoints
- [ ] Set `secure: true` in cookies (if applicable)

---

## 9. PAYMENT STATUSES

### Order Payment Statuses

| Status | Meaning | Next Action |
|--------|---------|-------------|
| `pending` | Waiting for payment | Customer completes payment |
| `paid` | Payment verified | Order confirmed |
| `failed` | Payment rejected | Customer can retry |
| `abandoned` | Customer left Paystack | Order stays pending |
| `refunded` | Refund issued | Contact admin |

### Payment Record Statuses (Internal)

| Status | Meaning |
|--------|---------|
| `pending` | Paystack transaction initialized |
| `success` | Payment verified ✅ |
| `failed` | Payment declined ❌ |
| `abandoned` | Customer didn't complete ❌ |

---

## 10. EMAIL TEMPLATES

### Customer Confirmation Email

Sent when payment is verified. Contains:
- Order number
- Payment reference
- All purchased items with quantities
- Subtotal, shipping, total
- Shipping address
- Payment status (Verified ✓)

### Owner Notification Email

Sent to `MAILGUN_OWNER_EMAIL`. Contains:
- Customer information (name, email, phone)
- All order items
- Total amount paid
- Shipping address
- Payment reference
- Paystack transaction ID

---

## 11. SECURITY NOTES

### What's Protected

✅ **Paystack Secret Key**
- Only exists on backend (`.env`)
- Used for payment verification
- Never exposed to frontend
- Never logged

✅ **Mailgun API Key**
- Only exists on backend (`.env`)
- Never exposed to frontend
- Never logged

✅ **Server-Side Price Verification**
- Backend recalculates order total
- Frontend price tampering ignored
- Amount verified against Paystack

✅ **Stock Protection**
- Transaction-level integrity
- Stock reduced after payment confirmed
- Prevents overselling

### What's NOT Protected

❌ **Paystack Public Key**
- Safe to expose to frontend if needed
- Used only for initialization
- Cannot accept payments alone

---

## 12. TROUBLESHOOTING

### "Paystack is not configured"

**Solution**: Check `.env` file has:
- `PAYSTACK_SECRET_KEY=sk_test_...`
- `PAYSTACK_PUBLIC_KEY=pk_test_...`

Restart server after adding to `.env`.

### "Mailgun not configured; skipping email"

**Solution**: Check `.env` file has:
- `MAILGUN_API_KEY=key-...`
- `MAILGUN_DOMAIN=...`

### Webhook not triggering

**Solution**: 
- Check webhook URL is publicly accessible (use ngrok for local testing)
- Verify webhook is added in Paystack Dashboard
- Check webhook events include `charge.success`
- Ensure secret key in `.env` matches Paystack

### Email not received

**Solution**:
- Check `MAILGUN_FROM_EMAIL` is a verified sender
- For sandbox domain, check customer email is authorized
- Check spam/junk folder
- Verify `MAILGUN_API_KEY` is correct

### Payment verified but stock not reduced

**Solution**:
- Check server logs for errors
- Verify order items exist in database
- Restart server

---

## 13. API ENDPOINTS REFERENCE

### Payment Initialization

```
POST /api/payments/paystack/initialize

Request:
{
  "orderId": "order-1234567890"
}

Response:
{
  "payment": {
    "id": "payment-xxx",
    "reference": "ABC123DEF456",
    "authorizationUrl": "https://checkout.paystack.com/...",
    "accessCode": "access_code_xxx",
    "amount": 500000 (in kobo)
  }
}
```

### Payment Verification

```
GET /api/payments/paystack/verify/:reference

Headers:
Authorization: Bearer {token}

Response:
{
  "message": "Payment verified successfully",
  "paymentStatus": "paid",
  "order": { ... }
}
```

### Webhook

```
POST /api/payments/paystack/webhook

Headers:
x-paystack-signature: {HMAC-SHA512}
Content-Type: application/json

Body:
{
  "event": "charge.success",
  "data": {
    "id": 12345,
    "reference": "ABC123",
    "amount": 500000,
    "currency": "NGN",
    "status": "success"
  }
}
```

---

## 14. SUPPORT

For issues with:

- **Paystack**: [https://paystack.com/support](https://paystack.com/support)
- **Mailgun**: [https://mailgun.com/support](https://mailgun.com/support)
- **Application**: Check logs and `.env` configuration

---

## 15. KEY SECURITY SUMMARY

✅ **Orders start in PENDING status** - No instant confirmation
✅ **Paystack verifies payment** - Backend calls Paystack API
✅ **Amount verified** - Backend checks Paystack amount matches order
✅ **Webhook verified** - HMAC-SHA512 signature validation
✅ **Stock only reduced** - After payment confirmed
✅ **Emails are idempotent** - Same webhook won't send duplicate emails
✅ **Secret keys protected** - Never exposed or logged
✅ **Database transactions** - Atomic payment+order updates (when using PostgreSQL)

---

**Implementation Date**: October 2024
**Status**: ✅ Complete & Production Ready
