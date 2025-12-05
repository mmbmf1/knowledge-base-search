# Support Chat Tool

## Setup

**Prerequisites**: Node.js 18+, Docker

1. Install dependencies: `npm install`
2. Copy `.env.local.example` to `.env.local` and set `DATABASE_URL`
3. Start database: `npm run docker:up`
4. Create schema: `docker exec -i isp-support-db psql -U postgres -d isp_support < scripts/schema.sql`
5. Run migrations: `npm run migrate`
6. Seed database: `npm run seed`
7. Start dev server: `npm run dev`

Open [http://localhost:3000](http://localhost:3000)
