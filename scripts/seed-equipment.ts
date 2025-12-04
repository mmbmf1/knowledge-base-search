/**
 * Seed script for populating equipment/technical information
 */

import { generateEmbedding } from '../lib/embeddings'
import { insertScenario, closePool, pool } from '../lib/db'

const equipment = [
  {
    name: 'Router Model X-2000',
    description: 'Standard router model with dual-band WiFi, 4 Ethernet ports, and fiber connectivity. Default IP: 192.168.1.1',
    metadata: {
      model: 'X-2000',
      manufacturer: 'TechCorp',
      specs: {
        wifi: 'Dual-band 802.11ac',
        ethernetPorts: 4,
        fiberCompatible: true,
        defaultIP: '192.168.1.1',
        defaultUsername: 'admin',
        defaultPassword: 'password',
      },
      commonIssues: [
        'Power light red - hardware failure',
        'WiFi drops - firmware update needed',
        'Cannot access admin - factory reset required',
      ],
      firmwareVersion: 'v2.4.1',
      resetProcedure: 'Hold reset button for 10 seconds',
    },
  },
  {
    name: 'ONT Model F-500',
    description: 'Fiber Optical Network Terminal with GPON support. Handles fiber-to-home connections.',
    metadata: {
      model: 'F-500',
      manufacturer: 'FiberTech',
      specs: {
        type: 'GPON',
        ports: ['Fiber In', 'Ethernet Out', 'Phone Out'],
        powerSupply: '12V DC',
        operatingTemp: '0-50°C',
      },
      lightStatus: {
        'Power Green': 'Normal operation',
        'Power Red': 'Power issue or hardware failure',
        'PON Green': 'Fiber connection active',
        'PON Blinking': 'Connecting to network',
        'PON Red': 'No fiber signal',
      },
      commonIssues: [
        'PON light red - fiber cut or no signal',
        'Power light off - check power adapter',
        'Cannot sync - verify fiber connection',
      ],
    },
  },
  {
    name: 'Modem Model C-300',
    description: 'Cable modem with DOCSIS 3.1 support. Compatible with cable internet services.',
    metadata: {
      model: 'C-300',
      manufacturer: 'CableNet',
      specs: {
        docsis: '3.1',
        ethernetPorts: 4,
        wifi: false,
        defaultIP: '192.168.100.1',
      },
      lightStatus: {
        'Power': 'Green = Normal, Red = Issue',
        'DS/US': 'Downstream/Upstream sync status',
        'Online': 'Green = Connected, Blinking = Connecting',
      },
      commonIssues: [
        'Online light blinking - signal issue',
        'DS/US lights off - cable connection problem',
        'Slow speeds - check signal levels',
      ],
    },
  },
]

async function seedEquipment() {
  console.log('Starting equipment seeding...')
  console.log(`Processing ${equipment.length} equipment items...`)

  try {
    const existingEquipment = await pool.query(
      "SELECT title FROM isp_support.scenarios WHERE type = 'equipment'",
    )
    const existingTitles = new Set(
      existingEquipment.rows.map((row: { title: string }) => row.title),
    )

    for (let i = 0; i < equipment.length; i++) {
      const item = equipment[i]

      if (existingTitles.has(item.name)) {
        console.log(
          `[${i + 1}/${equipment.length}] Skipping (already exists): ${item.name}`,
        )
        continue
      }

      console.log(`[${i + 1}/${equipment.length}] Processing: ${item.name}`)

      // Build text for embedding: description + metadata keywords
      let textToEmbed = item.description
      if (item.metadata.model) textToEmbed += `. Model: ${item.metadata.model}`
      if (item.metadata.manufacturer)
        textToEmbed += `. Manufacturer: ${item.metadata.manufacturer}`
      if (item.metadata.specs) {
        if (item.metadata.specs.wifi)
          textToEmbed += `. WiFi: ${item.metadata.specs.wifi}`
        if (item.metadata.specs.defaultIP)
          textToEmbed += `. Default IP: ${item.metadata.specs.defaultIP}`
      }

      const embedding = await generateEmbedding(textToEmbed)

      await insertScenario(
        item.name, // title
        item.description, // description
        embedding,
        'equipment', // type
        item.metadata,
      )

      console.log(`✓ Inserted: ${item.name}`)
    }

    console.log('\n✓ Equipment seeding completed successfully!')
  } catch (error) {
    console.error('Error seeding equipment:', error)
    process.exit(1)
  } finally {
    await closePool()
  }
}

// Run the seed script
seedEquipment()
