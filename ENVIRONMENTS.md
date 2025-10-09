# Environments: Development (Docker) and Production (Railway + Cloudflare)

This document describes how to run the app locally (development) with a Dockerized Postgres database, and how to deploy to production with Railway (backend) and Cloudflare Pages (frontend). It also covers environment variables, Prisma migrations, Stripe, Resend, and CORS.

## Overview
- Development: local frontend (Vite) + local backend (Node/Express) + local Postgres (Docker).
- Production: Railway backend service + Railway Postgres + Cloudflare Pages frontend + Resend for email + Stripe for payments.
- Separation: distinct environment variables and databases; branch-based deployment (`dev` → PR → `main`).

## Development (Local)
1) Start Postgres via Docker Compose
   - `docker-compose up -d`
   - Postgres runs at `localhost:5432` with DB `trading_journal`.

2) Environment variables
   - Backend: create `backend/.env` based on `backend/.env.example`.
     - `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/trading_journal?schema=public`
     - `NODE_ENV=development`
     - `PORT=3003`
     - `FRONTEND_URL=http://localhost:5173` (or `http://localhost:5174` if your Vite port differs)
     - `JWT_SECRET=replace_with_local_dev_secret`
     - Optional: `RESEND_API_KEY` (test), `STRIPE_SECRET_KEY` (test)
   - Frontend: create `frontend/.env.development` (see `frontend/.env.development.example`).
     - `VITE_API_URL=http://localhost:3003`
     - Optional: `VITE_STRIPE_PUBLIC_KEY=pk_test_xxx`

3) Prisma (backend)
   - Install and generate: `npm --prefix backend install` then `npx --prefix backend prisma generate`
   - Apply schema:
     - During iteration: `npx --prefix backend prisma db push`
     - With migrations: `npx --prefix backend prisma migrate dev --name init`

4) Run the app locally
   - Root: `npm run dev` (concurrently starts frontend and backend)
   - Verify: backend health endpoint responds; frontend loads and points to `http://localhost:3003`.

## Production (Railway Backend + Cloudflare Pages Frontend)
1) Backend on Railway
   - Create a Railway project and add a Node service.
   - Add Railway Postgres plugin; copy the connection string into service env vars.
   - Required env vars:
     - `NODE_ENV=production`
     - `PORT` (Railway provides; ensure your app reads `process.env.PORT`)
     - `DATABASE_URL` (Railway Postgres connection string)
     - `FRONTEND_URL=https://<your-cloudflare-domain>`
     - `JWT_SECRET` (strong, unique)
     - `RESEND_API_KEY` (live)
     - `STRIPE_SECRET_KEY` (live)
     - Any other service keys your backend uses.
   - Migrations: run `npx prisma migrate deploy` during deploy/start to apply versioned migrations.

2) Frontend on Cloudflare Pages
   - Connect GitHub repo; create a Pages project.
   - Monorepo settings:
     - Root directory: `frontend`
     - Build command: `npm run build`
     - Output directory: `dist`
   - Environment variables (Pages → Settings → Environment Variables):
     - `VITE_API_URL=https://<your-railway-backend-url>`
     - Optional: `VITE_STRIPE_PUBLIC_KEY=pk_live_xxx` and other `VITE_*` vars.
   - Custom domain: add your Cloudflare-managed domain; Pages will instruct DNS (CNAME) setup. Ensure SSL/TLS is set appropriately (usually “Full”).

3) Resend (Email)
   - Confirm your domain’s DNS (SPF, DKIM) remains configured in Cloudflare.
   - Use a verified “from” address (e.g., `no-reply@yourdomain.com`).
   - Set `RESEND_API_KEY` in Railway (production only).

4) Stripe
   - Frontend: `VITE_STRIPE_PUBLIC_KEY` (live) in Cloudflare Pages env.
   - Backend: `STRIPE_SECRET_KEY` (live) in Railway env.
   - Webhooks: point Stripe webhooks to your Railway backend URL; secure with the webhook signing secret.

5) CORS
   - Backend should read `FRONTEND_URL` from env and allow CORS for:
     - `https://<your-cloudflare-domain>` (production)
     - Optionally `https://*.cloudflarepages.dev` (preview builds)

## Deployment Workflow
- Branches: develop on `dev`; open PRs to `main`.
- Cloudflare Pages creates preview builds per branch.
- Merge to `main` triggers production deploys:
  - Railway: backend deploy + `prisma migrate deploy`.
  - Cloudflare Pages: frontend build.
- No auto-deploy from `dev` to production without a PR merge.

## Commands Cheat Sheet
- Start local DB: `docker-compose up -d`
- Stop local DB: `docker-compose down`
- Prisma (dev): `npx --prefix backend prisma db push`
- Prisma (migrations): `npx --prefix backend prisma migrate dev --name <name>`
- Prisma (prod apply): `npx prisma migrate deploy`
- Run apps locally: `npm run dev`

## Troubleshooting
- Stripe publishable key warning: set `VITE_STRIPE_PUBLIC_KEY` in frontend env and ensure code uses it.
- DB connection errors: confirm Docker container is healthy; check `DATABASE_URL` format.
- CORS issues: verify `FRONTEND_URL` and backend CORS config.
- Emails not sending: check Resend dashboard and DNS records; verify API key.

## Related Docs
- See `RAILWAY_DEPLOYMENT.md` for more deployment details.
- See `SETUP_GUIDE.txt` for general project setup notes.