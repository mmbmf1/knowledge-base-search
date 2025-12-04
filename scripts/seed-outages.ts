/**
 * Seed script for populating outage scenarios
 */

import { generateEmbedding } from '../lib/embeddings'
import { insertScenario, closePool, pool } from '../lib/db'

const outages = [
  {
    name: 'Area Outage - Downtown',
    description: 'Multiple customers reporting service outage in downtown area. Check outage map for affected zones and dispatch technicians as needed.',
    metadata: {
      affectedAreas: [
        {
          name: 'Downtown Core',
          center: [40.7580, -73.9855],
          radius: 2.0, // miles
        },
        {
          name: 'Financial District',
          center: [40.7074, -74.0113],
          radius: 1.5,
        },
      ],
      workOrderType: 'Service Call',
      requiresWorkOrder: true,
      status: 'active',
      outageType: 'unplanned',
      affectedCustomers: 250,
      estimatedRestoreTime: '2024-01-15T20:00:00Z',
      cause: 'Fiber cut on Main Street',
      lastUpdated: '2024-01-15T15:00:00Z',
    },
  },
  {
    name: 'Planned Maintenance Outage',
    description: 'Scheduled maintenance affecting service in specific areas. Check map for maintenance zones and inform customers of expected downtime.',
    metadata: {
      affectedAreas: [
        {
          name: 'Westside',
          coordinates: [
            [40.75, -74.01],
            [40.76, -74.01],
            [40.76, -74.02],
            [40.75, -74.02],
          ],
        },
      ],
      workOrderType: null,
      requiresWorkOrder: false,
      status: 'active',
      outageType: 'planned',
      affectedCustomers: 75,
      estimatedRestoreTime: '2024-01-15T22:00:00Z',
      cause: 'Network upgrade',
      lastUpdated: '2024-01-15T10:00:00Z',
    },
  },
  {
    name: 'Network Node Failure',
    description: 'Network node failure causing service interruption. Multiple areas affected. Check outage map and coordinate with network operations.',
    metadata: {
      affectedAreas: [
        {
          name: 'Northside',
          center: [40.78, -73.95],
          radius: 3.0,
        },
        {
          name: 'Northeast',
          center: [40.79, -73.94],
          radius: 2.5,
        },
      ],
      workOrderType: 'Service Call',
      requiresWorkOrder: true,
      status: 'investigating',
      outageType: 'unplanned',
      affectedCustomers: 500,
      estimatedRestoreTime: '2024-01-15T21:30:00Z',
      cause: 'Network node hardware failure',
      lastUpdated: '2024-01-15T14:00:00Z',
    },
  },
]

async function seedOutages() {
  console.log('Starting outage seeding...')
  console.log(`Processing ${outages.length} outages...`)

  try {
    const existingOutages = await pool.query(
      "SELECT title FROM isp_support.scenarios WHERE type = 'outage'",
    )
    const existingTitles = new Set(
      existingOutages.rows.map((row: { title: string }) => row.title),
    )

    for (let i = 0; i < outages.length; i++) {
      const item = outages[i]

      if (existingTitles.has(item.name)) {
        console.log(
          `[${i + 1}/${outages.length}] Skipping (already exists): ${item.name}`,
        )
        continue
      }

      console.log(`[${i + 1}/${outages.length}] Processing: ${item.name}`)

      // Build text for embedding: description + metadata keywords
      let textToEmbed = item.description
      if (item.metadata.status)
        textToEmbed += `. Status: ${item.metadata.status}`
      if (item.metadata.outageType)
        textToEmbed += `. Type: ${item.metadata.outageType}`
      if (item.metadata.affectedCustomers)
        textToEmbed += `. Affected: ${item.metadata.affectedCustomers} customers`
      if (item.metadata.cause) textToEmbed += `. Cause: ${item.metadata.cause}`

      const embedding = await generateEmbedding(textToEmbed)

      await insertScenario(
        item.name, // title
        item.description, // description
        embedding,
        'outage', // type
        item.metadata,
      )

      console.log(`✓ Inserted: ${item.name}`)
    }

    console.log('\n✓ Outage seeding completed successfully!')
  } catch (error) {
    console.error('Error seeding outages:', error)
    process.exit(1)
  } finally {
    await closePool()
  }
}

// Run the seed script
seedOutages()
