## Release Promotion: dev → master

Use this template when promoting changes from `dev` to `master` for production.

### Overview
- Describe the scope of changes and any user-facing impact.
- Link related issues/tasks.

### Pre-PR Verification
- [ ] Compare branch is `dev`, base branch is `master`.
- [ ] `dev` rebased on latest `master` (no merge commits/conflicts).
- [ ] Local builds succeed in `backend` and `frontend`.
- [ ] Lint, typecheck, and tests pass locally.

### Backend (API)
- [ ] Prisma changes are in `backend/prisma/migrations/` (no dev-only `db push`).
- [ ] Ran `prisma migrate deploy` against staging/pre-prod database and validated results.
- [ ] No dev-only scripts/config included (e.g., nodemon, localhost CORS in prod).
- [ ] Production `FRONTEND_URL` is set in Railway and used for reset links.
- [ ] CORS allowlist is correct for production (no localhost/preview origins).

### Frontend (App)
- [ ] Build succeeds (`frontend`), assets and routes load locally.
- [ ] API base URL points to production backend.
- [ ] Env separation: `.env.production.example` updated for new vars.
- [ ] No secrets or dev-only keys committed.

### Environment & Secrets
- [ ] Production env vars exist in Railway/Cloudflare Pages (and any workers):
  - [ ] Backend: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, email provider keys, etc.
  - [ ] Frontend: API URL and product keys configured via platform env.
- [ ] Documented any new required envs in `PRODUCTION_SETUP.md`.

### CI/CD & Gating
- [ ] Required status checks enabled and passing for `master`.
- [ ] Branch protections prevent direct pushes to `master`.
- [ ] Reviewer approvals collected per policy.

### Release Plan
- [ ] Post-merge deploy targets `master` (Railway backend, Pages frontend).
- [ ] Tag release (e.g., `vX.Y.Z`) with notes.
- [ ] Rollback plan defined (previous tag or revert strategy).

### Smoke Test Plan (post-deploy)
- [ ] Backend health (`/health`), auth, critical API routes.
- [ ] Frontend main pages load; auth/login/signup; API calls succeed.
- [ ] Password reset flow produces valid links (no localhost).

### Post-Merge Actions
- [ ] Back-merge `master` → `dev` to keep branches in sync.
- [ ] Monitor logs, errors, metrics; address issues promptly.
- [ ] Update documentation (deployment notes, any config changes).

### Approvals
- Reviewers: @...
- Additional stakeholders: @...

### Release Notes
- Summary of changes, migrations, and any operational considerations.