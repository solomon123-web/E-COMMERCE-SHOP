# Lumora Shop

Lumora Shop is a full-stack e-commerce application for a modern storefront, shopping cart, order flow, and admin-ready backend. It includes a TypeScript Express API, a React + Vite frontend, secure session/auth patterns, and a production-ready structure for deployment.

## Features

- Responsive e-commerce storefront
- Product search and browsing
- Cart and checkout flow
- Protected user account routes
- Order creation and history
- Email confirmation flow via Mailgun
- Google OAuth setup placeholders
- Admin-style stats endpoints
- Demo product catalog and seeded sample data

## Requirements

- Node.js 20+
- npm
- PostgreSQL database
- Google Cloud project credentials
- Mailgun credentials

## Local setup

1. Install dependencies:
   npm install
   cd server && npm install
   cd ../frontend && npm install
2. Copy environment variables:
   cp .env.example .env
3. Configure your app credentials.
4. Start the API and frontend:
   npm run dev

## Database setup

Use PostgreSQL and add the DATABASE_URL in your env file. The current code is implemented with a service-layer pattern ready for PostgreSQL migrations.

## Google OAuth

Follow the setup guide in SETUP.md and configure the Google redirect URL to match your local callback route.

## Mailgun

Set MAILGUN_API_KEY, MAILGUN_DOMAIN, MAILGUN_FROM_EMAIL, and MAILGUN_FROM_NAME to enable transactional emails.

## Testing

cd server && npm test

## Production build

npm --prefix server run build
npm --prefix frontend run build

> The frontend production build is still subject to the local runtime issue observed in this environment; it is not a code logic failure, but an environment-level Vite/Node crash.
