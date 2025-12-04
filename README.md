# Support Chat Tool

Semantic search tool for support scenarios. Uses embeddings and PostgreSQL with pgvector to match troubleshooting queries against a knowledge base of scenarios and work orders.

## Features

- Semantic search for troubleshooting scenarios
- Work order knowledge base with clickable references
- Schedule work orders with time slot selection for truck-required jobs
- Feedback system for scenario helpfulness

## Setup

### Prerequisites

- Node.js 18+
- Docker and Docker Compose

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your database connection:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/isp_support
```

3. Start database:
```bash
npm run docker:up
```

4. Create schema:
```bash
docker exec -i isp-support-db psql -U postgres -d isp_support < scripts/schema.sql
```

5. Seed database:
```bash
npm run seed
npm run seed:work-orders
```

6. Start dev server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run seed` - Seed scenarios
- `npm run seed:work-orders` - Seed work orders
- `npm run docker:up` - Start database
- `npm run docker:down` - Stop database

## Architecture

- **Frontend**: Next.js with Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: PostgreSQL with pgvector
- **Embeddings**: transformers.js (`Xenova/all-MiniLM-L6-v2`, 384 dimensions)
- **Search**: Cosine similarity using pgvector

## Project Structure

```
/app
  /api/search/route.ts      # Search endpoint
  /api/resolution/route.ts   # Resolution endpoint
  /api/work-order/route.ts   # Work order endpoint
  /api/schedule/route.ts    # Scheduling endpoint
  /components/               # React components
/lib
  /embeddings.ts            # Embedding generation
  /db.ts                    # Database queries
/scripts
  /schema.sql               # Database schema
  /seed.ts                  # Scenario seed data
  /seed-work-orders.ts      # Work order seed data
```
