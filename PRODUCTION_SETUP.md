# Production Setup: Railway (Backend) + Cloudflare Pages (Frontend)

This guide sets up a production environment for Trading Journal using Railway for the backend API and Cloudflare Pages for the frontend. It aligns with `ENVIRONMENTS.md` and the existing `Dockerfile`/`railway.json`.

## Overview
- Backend: Node/Express on Railway, Postgres on Railway.
- Frontend: Vite app on Cloudflare Pages with a custom domain.
- Migrations: Prisma `migrate deploy` executed at start.

## Backend on Railway
1) Create a Railway project and deploy the repo (Dockerfile is used).
2) Add a PostgreSQL service and copy its `DATABASE_URL`.
3) Set environment variables on the backend service:
   - `NODE_ENV=production`
   - `PORT` (Railway sets this; app reads `process.env.PORT`)
   - `DATABASE_URL` (from Postgres service)
   - `FRONTEND_URL=https://<your-cloudflare-domain>`
   - `JWT_SECRET` (strong, unique)
   - Optional: `RESEND_API_KEY`, `FROM_EMAIL`, `FROM_NAME`
   - Optional: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price IDs

4) Deploy. Health check at `/api/health` should respond OK.

### Prisma migrations
- Production uses versioned migrations: `npx prisma migrate deploy`.
- The backend `start` script runs `migrate deploy` before starting the server.

### CORS
- Backend allows `FRONTEND_URL` and local development by default.
- Set `FRONTEND_URL` to your Cloudflare Pages domain (or custom domain).

## Frontend on Cloudflare Pages
1) Create a Pages project and point it to this repo.
2) Monorepo configuration:
   - Project root: `frontend`
   - Build command: `npm run build`
   - Output directory: `dist`
3) Environment variables (Pages → Settings → Environment Variables):
   - `VITE_API_URL=https://<your-railway-backend-url>`
   - Optional: `VITE_STRIPE_PUBLIC_KEY`, other `VITE_*` keys.
4) Custom domain: add your Cloudflare-managed domain and follow DNS instructions (CNAME). Ensure SSL/TLS is set to “Full”.

## Stripe & Resend (Optional)
- Stripe: configure publishable key in Pages (`VITE_STRIPE_PUBLIC_KEY`) and secret key on Railway (`STRIPE_SECRET_KEY`). Point webhooks to your Railway backend.
- Resend: set `RESEND_API_KEY` on Railway and verify DNS (SPF, DKIM) in Cloudflare.

## Deployment Flow
- Develop on `dev` → PR → merge to `main`.
- Cloudflare Pages will create preview builds per branch.
- Production deploys occur on merge to `main`:
  - Railway deploys backend and runs `prisma migrate deploy`.
  - Cloudflare Pages builds frontend.

## Quick Commands
- Local DB up: `docker-compose up -d`
- Local DB down: `docker-compose down`
- Local run: `npm run dev`
- Prod apply migrations: `npx prisma migrate deploy`

## Troubleshooting
- CORS: verify `FRONTEND_URL` on Railway matches your frontend domain.
- DB: confirm `DATABASE_URL` uses the Railway Postgres connection string.
- Emails: verify Resend API key and domain DNS in Cloudflare.
- Stripe: ensure live keys and webhook signing secret are set correctly.