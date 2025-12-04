/**
 * Run database migration
 * Usage: tsx scripts/run-migration.ts [migration-file.sql]
 */

import { pool, closePool } from '../lib/db'
import { readFileSync } from 'fs'
import { join } from 'path'

async function runMigration() {
  // Get migration file from command line argument or use default
  let migrationFile = process.argv[2] || 'migrate-work-orders.sql'
  
  // Remove 'scripts/' prefix if present
  if (migrationFile.startsWith('scripts/')) {
    migrationFile = migrationFile.replace('scripts/', '')
  }
  
  const migrationPath = join(__dirname, migrationFile)

  console.log(`Running migration: ${migrationFile}...`)

  try {
    const migrationSQL = readFileSync(migrationPath, 'utf-8')

    // Remove comments
    const cleanedSQL = migrationSQL
      .split('\n')
      .filter((line) => !line.trim().startsWith('--'))
      .join('\n')

    // Split by semicolon
    const statements = cleanedSQL
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await pool.query(statement)
          console.log('✓ Executed migration statement')
        } catch (err: any) {
          // Ignore "already exists" errors for IF NOT EXISTS statements
          if (err.code === '42710' || err.code === '42P07') {
            console.log('⚠ Skipped (already exists)')
          } else {
            throw err
          }
        }
      }
    }

    console.log('\n✓ Migration completed successfully!')
  } catch (error) {
    console.error('Error running migration:', error)
    process.exit(1)
  } finally {
    await closePool()
  }
}

runMigration()
