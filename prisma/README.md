# Legacy Prisma Folder

This `prisma/` folder previously contained a SQLite prototype schema. The canonical schema for this project is now located at `backend/prisma/schema.prisma` and targets PostgreSQL.

Changes:
- The former file `prisma/schema.prisma` has been renamed to `prisma/schema.prisma.legacy` to prevent accidental usage.

Use the backend schema for all Prisma operations:
- Generate client: `npx --prefix backend prisma generate`
- Push schema: `npx --prefix backend prisma db push --schema backend/prisma/schema.prisma`
- Migrations: `npx --prefix backend prisma migrate dev --name <name>`

If any script or workflow breaks due to expecting `./prisma/schema.prisma`, update it to explicitly reference `backend/prisma/schema.prisma` or run the command from the `backend/` directory.