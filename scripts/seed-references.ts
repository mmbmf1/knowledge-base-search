/**
 * Seed script for populating reference documents and guides
 */

import { generateEmbedding } from 'simple-embeddings'
import { insertScenario, closePool, pool, getSchemaName } from '../lib/db'

const references = [
  {
    name: 'ONT Light Status Guide',
    description: 'Quick reference for interpreting ONT (Optical Network Terminal) status lights. Use this guide to diagnose connection issues.',
    metadata: {
      category: 'troubleshooting',
      equipmentType: 'ONT',
      lightStates: {
        'Power Green': 'Normal operation - device powered on',
        'Power Red': 'Power issue or hardware failure - check power adapter',
        'Power Off': 'No power - verify power connection',
        'PON Green': 'Fiber connection active - service operational',
        'PON Blinking': 'Connecting to network - wait 2-3 minutes',
        'PON Red': 'No fiber signal - check fiber connection, possible outage',
        'LAN Green': 'Ethernet connection active',
        'LAN Blinking': 'Data transmission in progress',
        'LAN Off': 'No Ethernet connection',
      },
      troubleshooting: {
        'PON Red': [
          'Check fiber cable connection',
          'Verify no damage to fiber cable',
          'Check for area outages',
          'Contact network operations if persistent',
        ],
        'Power Red': [
          'Unplug and replug power adapter',
          'Try different power outlet',
          'Check power adapter for damage',
          'Replace power adapter if needed',
        ],
      },
    },
  },
  {
    name: 'Router Admin Access Guide',
    description: 'Quick reference for accessing router admin panel. Includes default IPs, usernames, and common troubleshooting steps.',
    metadata: {
      category: 'troubleshooting',
      equipmentType: 'Router',
      defaultSettings: {
        'Common IPs': ['192.168.1.1', '192.168.0.1', '10.0.0.1'],
        'Default Username': 'admin',
        'Default Password': 'password (or check sticker on router)',
      },
      accessSteps: [
        'Open web browser',
        'Enter router IP address in address bar',
        'Enter username and password',
        'If credentials don\'t work, try factory reset',
      ],
      troubleshooting: {
        'Cannot access': [
          'Verify correct IP address',
          'Ensure device is connected to router network',
          'Try different browser',
          'Clear browser cache',
          'Factory reset if credentials unknown',
        ],
        'Page not loading': [
          'Check network connection',
          'Verify router is powered on',
          'Try wired connection instead of WiFi',
          'Check firewall settings',
        ],
      },
    },
  },
  {
    name: 'Speed Test Reference',
    description: 'Reference guide for interpreting speed test results and troubleshooting slow speeds.',
    metadata: {
      category: 'troubleshooting',
      speedRanges: {
        'Excellent': '90-100% of advertised speed',
        'Good': '70-89% of advertised speed',
        'Fair': '50-69% of advertised speed',
        'Poor': 'Below 50% of advertised speed',
      },
      factors: [
        'Time of day (peak hours slower)',
        'Number of connected devices',
        'WiFi vs wired connection',
        'Distance from router',
        'Interference from other devices',
      ],
      troubleshooting: [
        'Test with wired connection first',
        'Disconnect other devices',
        'Move closer to router',
        'Check for background downloads',
        'Test at different times of day',
        'Restart router',
      ],
    },
  },
  {
    name: 'Account Status Codes',
    description: 'Reference guide for account status codes in billing system. Use to understand customer account state.',
    metadata: {
      category: 'billing',
      statusCodes: {
        'ACTIVE': 'Account in good standing, service active',
        'SUSPENDED': 'Service suspended - usually billing issue',
        'DISCONNECTED': 'Service disconnected - may need reactivation',
        'PENDING': 'Account pending activation or setup',
        'CANCELLED': 'Account cancelled - service terminated',
        'COLLECTIONS': 'Account in collections - billing issue',
      },
      actions: {
        'SUSPENDED': [
          'Check billing status',
          'Verify payment method',
          'Process payment if needed',
          'Reactivate service after payment',
        ],
        'DISCONNECTED': [
          'Verify disconnection reason',
          'Check if customer wants to reconnect',
          'Create Reconnect work order if needed',
        ],
        'COLLECTIONS': [
          'Escalate to collections department',
          'Do not process new orders',
          'Refer to collections policy',
        ],
      },
    },
  },
]

async function seedReferences() {
  console.log('Starting reference seeding...')
  console.log(`Processing ${references.length} references...`)

  try {
    const schema = getSchemaName()
    const existingReferences = await pool.query(
      `SELECT title FROM ${schema}.scenarios WHERE type = 'reference'`,
    )
    const existingTitles = new Set(
      existingReferences.rows.map((row: { title: string }) => row.title),
    )

    for (let i = 0; i < references.length; i++) {
      const item = references[i]

      if (existingTitles.has(item.name)) {
        console.log(
          `[${i + 1}/${references.length}] Skipping (already exists): ${item.name}`,
        )
        continue
      }

      console.log(`[${i + 1}/${references.length}] Processing: ${item.name}`)

      // Build text for embedding: description + metadata keywords
      let textToEmbed = item.description
      if (item.metadata.category)
        textToEmbed += `. Category: ${item.metadata.category}`
      if (item.metadata.equipmentType)
        textToEmbed += `. Equipment: ${item.metadata.equipmentType}`

      const embedding = await generateEmbedding(textToEmbed)

      await insertScenario(
        item.name, // title
        item.description, // description
        embedding,
        'reference', // type
        item.metadata,
      )

      console.log(`✓ Inserted: ${item.name}`)
    }

    console.log('\n✓ Reference seeding completed successfully!')
  } catch (error) {
    console.error('Error seeding references:', error)
    process.exit(1)
  } finally {
    await closePool()
  }
}

// Run the seed script
seedReferences()
