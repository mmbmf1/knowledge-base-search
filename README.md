# Support Chat Tool

Semantic search tool for support scenarios using embeddings and PostgreSQL with pgvector.

## Features

- Semantic search for troubleshooting scenarios
- Knowledge base types: scenarios, work orders, equipment, outages, policies, references
- Clickable references in resolution steps
- Work order scheduling with time slot selection
- Feedback system

## Setup

**Prerequisites**: Node.js 18+, Docker

1. Install dependencies: `npm install`
2. Copy `.env.local.example` to `.env.local` and set `DATABASE_URL`
3. Start database: `npm run docker:up`
4. Create schema: `docker exec -i isp-support-db psql -U postgres -d isp_support < scripts/schema.sql`
5. Run migrations: `npm run migrate:work-orders && npm run migrate:new-types`
6. Seed database: `npm run seed`
7. Start dev server: `npm run dev`

Open [http://localhost:3000](http://localhost:3000)

## Scripts

- `npm run dev` - Development server
- `npm run seed` - Seed all data (scenarios, work orders, equipment, outages, policies, references, subscribers)
- `npm run docker:up` - Start database
- `npm run docker:down` - Stop database

## Tech Stack

- Next.js, PostgreSQL with pgvector, transformers.js (384-dim embeddings)
