# Production Data Migration Notes

Goal: Keep existing production data intact, avoid introducing development data into production, and have a clear plan for future migrations.

## Environments

- Development DB: local Docker (`trading_journal`), URL typically `postgresql://postgres:postgres@localhost:5432/trading_journal?schema=public`.
- Production DB: Railway PostgreSQL (managed). Use the `DATABASE_URL` from Railway project settings.

Recommendation: Maintain separate `.env` files per environment. Do not reuse dev credentials in production.

## Prisma Migrations

- Author changes in dev using Prisma migrations.
- Apply in production using `npx prisma migrate deploy` (idempotent, applies pending migrations without creating new ones).
- Ensure the production `DATABASE_URL` is set in Railway before deploying.

### Development Workflow

1. Modify Prisma schema in `backend/prisma/schema.prisma`.
2. Run `npx prisma migrate dev --name <meaningful_name>` against the dev DB.
3. Verify locally via the backend API and UI.
4. Commit migrations (`backend/prisma/migrations/**`).

### Production Deployment

1. Push code to Railway; confirm `DATABASE_URL` points to Railway DB.
2. Run `npx prisma migrate deploy` as a post-deploy hook (or manual once-off).
3. Validate with health endpoints: `/api/health` and optional `/api/debug/env`.

## Seeding and Test Data

- Do NOT run dev seeds in production.
- If a seed script exists, guard with `NODE_ENV` checks or separate dev-only seed commands.

## Preserving Existing Production Data

- Backups: Before running migrations, take a Railway DB snapshot/backup (or export via `pg_dump`).
- Non-destructive migrations: Prefer additive changes (new tables/columns, nullable fields), avoid dropping or renaming without a plan.
- Data migration scripts: If schema changes require transforming data, write explicit scripts and test on a production clone.

## Rollback Strategy

- If a migration causes issues, roll forward with corrective migrations when possible.
- For critical incidents, restore from backup; then re-apply safe migrations.

## Config Reference

- Backend `DATABASE_URL` must match the target environment.
- Frontend `VITE_API_URL` should point to the correct backend (Railway for production, localhost for dev).
- CORS: Set `FRONTEND_URL` in backend `.env` to the actual frontend origin.

## Operational Tips

- Keep a changelog of domain changes (e.g., tickets tables) tied to migration names.
- Use feature flags or environment checks to hide dev-only features in production during rollout.
- Validate after deploy: smoke test login, critical flows, and ticket endpoints if applicable.

---

Future checklist when migrating the ticketing system to production:

- [ ] Confirm production has latest Prisma migrations applied.
- [ ] Validate tickets table and relations exist (`Ticket`, `TicketComment`, `TicketHistory`).
- [ ] Ensure no dev-only seed data is introduced.
- [ ] Update frontend to point to Railway backend.
- [ ] Verify `/api/tickets` endpoints work for a test account.