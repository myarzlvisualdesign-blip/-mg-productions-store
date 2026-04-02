Supabase setup

1. Create a Supabase project.
2. Open the project database connection screen.
3. In Supabase, click Connect and copy:

   DATABASE_URL
   Use the Supavisor transaction mode / pooler string for serverless deployments.
   Example:

   postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1

   DIRECT_URL
   Use the direct connection string.
   Example:

   postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres

4. Set these environment variables in Vercel:

   DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
   DIRECT_URL=postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres
   AUTH_SECRET=your-random-secret
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=your-admin-password

5. Redeploy the Vercel project.
6. If the database schema has not been created yet, run schema sync manually from a machine that can connect to Supabase:

   npx prisma db push

Notes:
- Prisma is configured to use PostgreSQL.
- `DATABASE_URL` is used by the running app.
- `DIRECT_URL` is used by Prisma for direct schema operations such as `db push`.
- The Vercel build only runs `prisma generate`. Schema sync should be run manually if needed.
- If you want persistent uploads on Vercel, also set `BLOB_READ_WRITE_TOKEN`.
