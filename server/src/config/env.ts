import dotenv from 'dotenv';
import path from 'node:path';

const currentDir = __dirname;
const serverRoot = path.resolve(currentDir, '..', '..');
const serverEnvPath = path.join(serverRoot, '.env');

dotenv.config({ path: serverEnvPath, override: true });

export const env = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? 'dev-jwt-secret',
  appUrl: process.env.APP_URL ?? 'http://localhost:5173',

  // Email
  emailEnabled: Boolean(process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN),
  mailgunApiKey: process.env.MAILGUN_API_KEY ?? '',
  mailgunDomain: process.env.MAILGUN_DOMAIN ?? '',
  mailgunFromEmail: process.env.MAILGUN_FROM_EMAIL ?? 'noreply@localhost',
  mailgunFromName: process.env.MAILGUN_FROM_NAME ?? 'Lumora Shop',
  mailgunOwnerEmail: process.env.MAILGUN_OWNER_EMAIL ?? '',

  // Google OAuth
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:4000/api/auth/google/callback',

  // Paystack
  paystackSecretKey: process.env.PAYSTACK_SECRET_KEY ?? '',
  paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY ?? '',
  paystackCallbackUrl: process.env.PAYSTACK_CALLBACK_URL ?? 'http://localhost:5173/order-success',

  // Database
  databaseUrl: process.env.DATABASE_URL ?? '',
};
