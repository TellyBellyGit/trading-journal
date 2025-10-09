# Cloudflare Pages Deployment (Frontend)

This guide configures Cloudflare Pages to deploy the Vite frontend in `frontend/`, with production gated to `master` and previews from `dev` and PRs.

## Prerequisites
- GitHub repository: `TellyBellyGit/trading-journal`
- Branch strategy: `dev` (default), `master` (production)
- Backend deployed on Railway with a production URL

## Create Pages Project
1) In Cloudflare Dashboard, go to `Pages → Create project → Connect to Git`.
2) Select the `trading-journal` repo.
3) Set production branch: `master`.
4) Enable preview deployments for PRs and the `dev` branch.

## Build Settings
- Project root: `frontend`
- Build command: `npm ci && npm run build`
- Output directory: `dist`
- Node version: 18+ (Cloudflare default is fine)
- SPA routing: already configured via `frontend/public/_redirects` (`/* /index.html 200`).

## Environment Variables
Configure separately for Production (master) and Preview (dev/PRs):

- Production (branch: `master`)
  - `VITE_API_URL=https://<your-railway-backend-prod-url>`
  - Optional: `VITE_STRIPE_PUBLIC_KEY=pk_live_...` and other `VITE_*` variables

- Preview (branches: `dev`, PRs)
  - `VITE_API_URL=https://<your-dev-or-staging-backend-url>`
  - Optional: `VITE_ENV=preview`

Notes:
- Do not store secrets in the repo; use Cloudflare Pages environment variables.
- `frontend/.env.production.example` shows expected keys.

## Domain & SSL
1) Add a custom domain (e.g., `app.yourdomain.com`) in Pages → Custom domains.
2) Follow DNS instructions (CNAME) in Cloudflare DNS.
3) SSL/TLS mode: “Full” is recommended.

## Backend CORS Alignment
- In Railway (production), set `FRONTEND_URL` to your Pages production domain.
- Keep production CORS strict (only your production domain).
- For preview builds hitting a non-production backend, allow the preview domain (e.g., `*.pages.dev`) on that backend.

## Verify Deployments
- Preview: push to `dev` or open a PR → Pages provides `*.pages.dev` URL.
  - Confirm the app loads and API calls hit the preview backend (`VITE_API_URL`).
- Production: merge `dev → master` → Pages deploys from `master`.
  - Confirm the app loads on the custom domain and API calls hit the prod backend.

## Troubleshooting
- Build fails: ensure `frontend` is the project root and `npm run build` works locally.
- 404s on routes: confirm `_redirects` exists at `frontend/public/_redirects`.
- API errors: verify `VITE_API_URL` in Pages env and backend CORS `FRONTEND_URL`.
- Mixed environments: double-check branch gating—production must only deploy from `master`.

## Operational Guardrails
- Protect `master` in GitHub (no direct pushes; require checks).
- Use PRs to promote `dev → master` and follow the release checklist in `.github/pull_request_template.md`.