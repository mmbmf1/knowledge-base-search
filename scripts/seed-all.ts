/**
 * Master seed script that runs all seed scripts in sequence
 */

import { execSync } from 'child_process'
import { join } from 'path'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') })

const seedScripts = [
  'seed.ts',
  'seed-work-orders.ts',
  'seed-equipment.ts',
  'seed-outages.ts',
  'seed-policies.ts',
  'seed-references.ts',
  'seed-subscribers.ts',
  'seed-feedback.ts',
]

async function seedAll() {
  console.log('Starting full database seeding...\n')

  for (const script of seedScripts) {
    const scriptPath = join(__dirname, script)
    console.log(`\n📦 Running ${script}...`)
    console.log('─'.repeat(50))
    
    try {
      execSync(`tsx ${scriptPath}`, {
        stdio: 'inherit',
        cwd: __dirname,
        env: { ...process.env },
      })
      console.log(`✓ Completed ${script}\n`)
    } catch (error) {
      console.error(`\n✗ Error running ${script}:`, error)
      process.exit(1)
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('✅ All seeding completed successfully!')
  console.log('='.repeat(50))
}

seedAll()
