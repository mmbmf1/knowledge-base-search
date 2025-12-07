/**
 * Master migration script that runs all migrations in sequence
 */

import { execSync } from 'child_process'
import { join } from 'path'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') })

// Single combined migration file
const migrationFile = 'migrate-all.sql'

async function migrateAll() {
  console.log('Starting database migration...\n')

  try {
    const runMigrationPath = join(__dirname, 'run-migration.ts')
    execSync(`tsx ${runMigrationPath} ${migrationFile}`, {
      stdio: 'inherit',
      cwd: join(__dirname, '..'),
      env: { ...process.env },
    })
    console.log('\n' + '='.repeat(50))
    console.log('✅ Migration completed successfully!')
    console.log('='.repeat(50))
  } catch (error) {
    console.error(`\n✗ Error running migration:`, error)
    process.exit(1)
  }
}

migrateAll()
