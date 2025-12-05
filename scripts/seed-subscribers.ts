/**
 * Seed script for populating subscriber data reference guide
 */

import { generateEmbedding } from '../lib/embeddings'
import { insertScenario, closePool, pool, getSchemaName } from '../lib/db'

const subscribers = [
  {
    name: 'Subscriber Data Fields',
    description: 'Reference guide for subscriber data fields, validation rules, and update procedures. Use when updating customer information.',
    metadata: {
      category: 'customer_data',
      fields: {
        name: {
          required: true,
          format: 'string',
          description: 'Full name of subscriber',
          maxLength: 100,
        },
        address: {
          required: true,
          format: 'string',
          description: 'Service address',
          maxLength: 255,
        },
        phone: {
          required: true,
          format: 'phone',
          description: 'Primary phone number',
          validation: 'Must be 10 digits',
          example: '(555) 123-4567',
        },
        email: {
          required: true,
          format: 'email',
          description: 'Primary email address',
          validation: 'Valid email format required',
        },
        accountNumber: {
          required: true,
          format: 'string',
          description: 'Account identifier',
          readOnly: true,
          note: 'Cannot be changed',
        },
        servicePreferences: {
          required: false,
          format: 'object',
          description: 'Service preferences and settings',
          fields: ['paperless_billing', 'auto_pay', 'communication_preferences'],
        },
      },
      updateProcedures: [
        'Verify customer identity before updating',
        'Confirm changes with customer',
        'Update all related systems',
        'Send confirmation to customer',
        'Log all changes for audit',
      ],
      validationRules: {
        phone: 'Must match format: (XXX) XXX-XXXX or XXX-XXX-XXXX',
        email: 'Must be valid email format',
        address: 'Must include street, city, state, and ZIP code',
      },
    },
  },
]

async function seedSubscribers() {
  console.log('Starting subscriber seeding...')
  console.log(`Processing ${subscribers.length} subscriber references...`)

  try {
    const schema = getSchemaName()
    const existingSubscribers = await pool.query(
      `SELECT title FROM ${schema}.scenarios WHERE type = 'subscriber'`,
    )
    const existingTitles = new Set(
      existingSubscribers.rows.map((row: { title: string }) => row.title),
    )

    for (let i = 0; i < subscribers.length; i++) {
      const item = subscribers[i]

      if (existingTitles.has(item.name)) {
        console.log(
          `[${i + 1}/${subscribers.length}] Skipping (already exists): ${item.name}`,
        )
        continue
      }

      console.log(`[${i + 1}/${subscribers.length}] Processing: ${item.name}`)

      // Build text for embedding: description + metadata keywords
      let textToEmbed = item.description
      if (item.metadata.category)
        textToEmbed += `. Category: ${item.metadata.category}`
      textToEmbed += '. Fields: name, address, phone, email, account number'

      const embedding = await generateEmbedding(textToEmbed)

      await insertScenario(
        item.name, // title
        item.description, // description
        embedding,
        'subscriber', // type
        item.metadata,
      )

      console.log(`✓ Inserted: ${item.name}`)
    }

    console.log('\n✓ Subscriber seeding completed successfully!')
  } catch (error) {
    console.error('Error seeding subscribers:', error)
    process.exit(1)
  } finally {
    await closePool()
  }
}

// Run the seed script
seedSubscribers()
