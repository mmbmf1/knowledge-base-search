/**
 * Complete database setup script
 * Runs migration and all seeding in one command
 */

import { execSync } from 'child_process'
import { join } from 'path'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') })

async function setupDatabase() {
  console.log('🚀 Starting complete database setup...\n')
  console.log('='.repeat(60))

  try {
    // Step 1: Run migration
    console.log('\n📋 Step 1: Running database migration...')
    console.log('─'.repeat(60))
    const migratePath = join(__dirname, 'migrate-all.ts')
    execSync(`tsx ${migratePath}`, {
      stdio: 'inherit',
      cwd: __dirname,
      env: { ...process.env },
    })
    console.log('✅ Migration completed!\n')

    // Step 2: Run all seeding
    console.log('🌱 Step 2: Seeding all data...')
    console.log('─'.repeat(60))
    const seedAllPath = join(__dirname, 'seed-all.ts')
    execSync(`tsx ${seedAllPath}`, {
      stdio: 'inherit',
      cwd: __dirname,
      env: { ...process.env },
    })
    console.log('✅ Seeding completed!\n')

    console.log('='.repeat(60))
    console.log('🎉 Database setup completed successfully!')
    console.log('='.repeat(60))
  } catch (error) {
    console.error('\n❌ Error during database setup:', error)
    process.exit(1)
  }
}

setupDatabase()
