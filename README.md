# Knowledge Base Search

A semantic search application for knowledge bases with vector embeddings, feedback tracking, and analytics.

## Features

- **Semantic Search**: Vector-based similarity search using embeddings
- **Knowledge Base**: Support for multiple content types (scenarios, work orders, equipment, outages, policies, references, subscribers)
- **Feedback System**: Track helpful/not helpful ratings with analytics
- **Top Searches**: Display most popular and helpful searches
- **Interactive Modals**: View detailed resolutions and knowledge base items

## Tech Stack

- **Next.js 16** - React framework
- **PostgreSQL** - Database with pgvector extension
- **Hugging Face Transformers** - Embedding generation
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety

## Prerequisites

- Node.js 18+
- Docker and Docker Compose

## Quick Start

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   Create `.env.local` file:

   ```bash
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/isp_support
   ```

3. **Start database with Docker**

   ```bash
   npm run docker:up
   ```

   This starts PostgreSQL with pgvector extension in a container. The database persists in a Docker volume, so your data survives container restarts.

4. **Setup database** (migration + seeding)

   ```bash
   npm run setup
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000)

## Docker Setup

This project uses Docker Compose to run PostgreSQL with the pgvector extension, which is required for semantic search.

**Why Docker?**

- **pgvector Extension**: Pre-configured PostgreSQL image with vector similarity search
- **Zero Configuration**: No need to install PostgreSQL or extensions manually
- **Data Persistence**: Database data persists in Docker volumes
- **Easy Reset**: Stop/start containers without losing data
- **Consistent Environment**: Same database setup across all machines

**Docker Commands:**

- `npm run docker:up` - Start PostgreSQL container
- `npm run docker:down` - Stop and remove container (data persists in volume)
- `docker-compose ps` - Check container status
- `docker-compose logs postgres` - View database logs

**Database Details:**

- **Image**: `pgvector/pgvector:pg16` (PostgreSQL 16 with pgvector)
- **Port**: `5432` (mapped to host)
- **Credentials**: `postgres/postgres`
- **Database**: `isp_support`
- **Volume**: `postgres_data` (persists data between restarts)

## Available Scripts

**Database:**

- `npm run setup` - Complete database setup (migration + all seeding)
- `npm run migrate` - Run database migrations only
- `npm run seed` - Seed all data (requires schema to exist)

**Docker:**

- `npm run docker:up` - Start PostgreSQL container
- `npm run docker:down` - Stop PostgreSQL container

**Development:**

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Project Structure

```
app/
  api/              # API routes
  components/       # React components
  page.tsx         # Main search page
lib/
  db.ts            # Database functions
  embeddings.ts    # Embedding generation
scripts/
  setup-db.ts      # Complete database setup
  migrate-all.ts   # Migration runner
  seed-all.ts      # Seed data runner
  seed-*.ts        # Individual seed scripts
```

## Database Schema

- `scenarios` - Main content items with vector embeddings
- `resolutions` - Step-by-step resolution instructions
- `feedback` - User ratings (helpful/not helpful)
- `actions` - User interaction logs

## Development

The app uses semantic search with vector embeddings. When a user searches:

1. Query is converted to a 384-dimensional embedding
2. Cosine similarity search finds matching scenarios
3. Results are ranked by similarity and feedback scores
4. User can provide feedback to improve future results
