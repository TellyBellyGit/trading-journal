# How the App Hangs Together (Cloudflare Pages + Railway)

This document explains how the deployed frontend on Cloudflare Pages connects to the backend runtime on Railway, which environment variables control that wiring, and how to verify the setup end‑to‑end.

## TL;DR
- Frontend: Cloudflare Pages serves the built Vite React app at `https://trading-journal-dlb.pages.dev`.
- Runtime/API: The frontend calls the backend on Railway using `VITE_API_URL`.
- CORS: The backend allows the frontend domain via `FRONTEND_URL`.
- If `VITE_API_URL` is missing, the frontend falls back to `http://localhost:3003` for local development.

## Runtime Flow
1. A user loads `https://trading-journal-dlb.pages.dev` (Cloudflare Pages). Static assets (HTML/CSS/JS) are served globally.
2. The frontend reads `import.meta.env.VITE_API_URL` (in the build/runtime environment).
3. All API modules use `API_BASE_URL = VITE_API_URL + "/api"` for requests (e.g., `/trades`, `/subscriptions`, `/admin`).
4. Authentication: an `auth_token` stored in `sessionStorage` is attached to requests via the `Authorization: Bearer <token>` header.
5. Optional integrations:
   - Stripe: frontend needs `VITE_STRIPE_PUBLIC_KEY`; backend needs Stripe secrets and webhook configuration on Railway.
   - Resend emails: backend needs `RESEND_API_KEY`, `FROM_EMAIL`, `FROM_NAME`.

## Where This Is Configured

### Cloudflare Pages (Frontend)
- Project → Settings → Environment Variables:
  - `VITE_API_URL`: `https://<your-backend-public-url>`
  - `VITE_STRIPE_PUBLIC_KEY`: optional (removes publishable key warning if Stripe is in use)
- Build settings:
  - Root: `frontend`
  - Build command: `npm run build`
  - Output directory: `dist`
- Domain: Cloudflare Pages serves at `https://trading-journal-dlb.pages.dev` (or your custom domain if configured).

### Railway (Backend)
- Required variables:
  - `NODE_ENV=production`
  - `DATABASE_URL=<Railway Postgres connection>`
  - `FRONTEND_URL=https://trading-journal-dlb.pages.dev` (exact scheme + domain, used by CORS)
  - `JWT_SECRET` (and `JWT_REFRESH_SECRET` if used)
- Optional variables:
  - `RESEND_API_KEY`, `FROM_EMAIL`, `FROM_NAME` (email service)
  - Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price IDs
- Port: The app must listen on `process.env.PORT` (Railway sets this automatically).
- Health check: `https://<your-railway-app>.railway.app/api/health`

## Code References (Frontend)
- `frontend/src/config/api.ts`:
  - `API_CONFIG.BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003'`
  - `API_BASE_URL = BASE_URL + '/api'`
- API modules using `API_BASE_URL`:
  - `frontend/src/api/trades.ts`
  - `frontend/src/api/analytics.ts`
  - `frontend/src/api/analysis.ts`
  - `frontend/src/api/admin.ts`
  - `frontend/src/api/subscriptions.ts`
  - `frontend/src/components/auth/EnhancedLogin.tsx`

## Typical URLs
- Frontend (Cloudflare Pages): `https://trading-journal-dlb.pages.dev`
- Backend (Railway): `https://<your-app>.railway.app` or a custom API domain like `https://api.<your-domain>`
- Health endpoint: `https://<backend>/api/health`

## Verification Checklist
1. Cloudflare Pages → Environment variables:
   - `VITE_API_URL` is set and points to the correct backend URL.
2. Browser devtools → Network tab:
   - Requests from `https://trading-journal-dlb.pages.dev` go to `VITE_API_URL + '/api/...'`.
3. Railway → Variables:
   - `FRONTEND_URL` exactly matches `https://trading-journal-dlb.pages.dev`.
   - `DATABASE_URL`, `JWT_SECRET` present; app listens on `PORT`.
4. Backend health:
   - `GET https://<backend>/api/health` returns OK.
5. Stripe (if used):
   - Pages has `VITE_STRIPE_PUBLIC_KEY`.
   - Railway has `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.

## Common Gotchas
- CORS errors: `FRONTEND_URL` mismatch (wrong domain or missing `https`).
- Wrong API URL: `VITE_API_URL` not set in Cloudflare Pages → frontend falls back to `http://localhost:3003` and fails in production.
- Preview builds: ensure the Pages Preview environment also has `VITE_API_URL` set (can point to staging or the same backend).
- Stripe warning: publishable key not set in Pages.

## Optional Improvements
- Custom API domain:
  - Create `api.<your-domain>` in Cloudflare DNS (proxied), point to Railway.
  - Set `VITE_API_URL=https://api.<your-domain>` in Pages.
- Environment separation:
  - Different `VITE_API_URL` per environment (Production vs Preview).
- Observability:
  - Add a status/health check page; set up alerts on Railway.

## Related Docs in This Repo
- `CLOUDFLARE_PAGES_DEPLOYMENT.md`
- `RAILWAY_DEPLOYMENT.md`
- `PRODUCTION_SETUP.md`
- `ENVIRONMENTS.md`

---
If you change domains or enable new integrations (Stripe, email), update the appropriate env vars on both Cloudflare Pages and Railway, and re-verify with the checklist above.