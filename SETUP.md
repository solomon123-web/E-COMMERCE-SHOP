# Setup Guide

## 1. Install Node dependencies

npm install
cd server && npm install
cd ../frontend && npm install

## 2. Configure environment variables

Copy .env.example to .env and fill in the values.

Required values:
- PORT
- JWT_SECRET
- DATABASE_URL
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- GOOGLE_CALLBACK_URL
- MAILGUN_API_KEY
- MAILGUN_DOMAIN
- MAILGUN_FROM_EMAIL
- MAILGUN_FROM_NAME
- VITE_API_URL

## 3. PostgreSQL

Create a PostgreSQL database named lumora or another preferred name and set DATABASE_URL accordingly.

## 4. Google Cloud Console

1. Open Google Cloud Console.
2. Create a new project.
3. Go to APIs & Services > Credentials.
4. Create OAuth 2.0 Client ID.
5. Use authorized JavaScript origins: http://localhost:5173
6. Use authorized redirect URIs: http://localhost:4000/api/auth/google/callback
7. Add the values to the environment file.

## 5. Mailgun

1. Create a Mailgun account.
2. Add a domain and get your API key.
3. Fill in MAILGUN_API_KEY and MAILGUN_DOMAIN.
4. Set MAILGUN_FROM_EMAIL to a verified sender address.

## 6. Run locally

npm run dev

This starts the API server and the Vite frontend.

## 7. Deployment notes

- Frontend: deploy to Vercel or Netlify
- Backend: deploy to Render or Railway
- Database: use Supabase or Neon/PostgreSQL
- Update Google OAuth redirect URLs before production launch
- Update Mailgun sender and domain for production
