/**
 * Seed script for populating policies and procedures
 */

import { generateEmbedding } from 'simple-embeddings'
import { insertScenario, closePool, pool, getSchemaName } from '../lib/db'

const policies = [
  {
    name: 'Customer Service Policy - Refunds',
    description: 'Standard refund policy and procedures for customer service requests. Includes eligibility criteria, approval levels, and processing steps.',
    metadata: {
      category: 'refund',
      appliesTo: ['all_customers'],
      requirements: ['account_verification', 'reason_documentation'],
      approvalLevel: 'supervisor',
      maxRefundAmount: 500,
      processingTime: '3-5 business days',
      eligibleScenarios: [
        'Service outage exceeding 24 hours',
        'Billing errors',
        'Service not delivered as promised',
      ],
    },
  },
  {
    name: 'Equipment Replacement Policy',
    description: 'Policy for replacing customer equipment. Covers warranty periods, damage assessment, and replacement procedures.',
    metadata: {
      category: 'equipment',
      appliesTo: ['all_customers'],
      warrantyPeriod: '12 months',
      replacementCriteria: [
        'Manufacturer defect',
        'Normal wear and tear',
        'Power surge damage (with surge protector)',
      ],
      notCovered: [
        'Physical damage from customer',
        'Water damage',
        'Missing equipment',
      ],
      approvalLevel: 'manager',
      processingTime: '5-7 business days',
    },
  },
  {
    name: 'Service Disconnection Policy',
    description: 'Procedures for disconnecting service. Includes notice requirements, final billing, and equipment return.',
    metadata: {
      category: 'disconnection',
      appliesTo: ['all_customers'],
      noticeRequired: '30 days',
      finalBilling: 'Prorated to disconnection date',
      equipmentReturn: 'Required within 30 days',
      earlyTerminationFee: 'May apply based on contract',
      approvalLevel: 'supervisor',
    },
  },
  {
    name: 'Credit Policy - Service Issues',
    description: 'Policy for issuing credits due to service issues, outages, or billing problems.',
    metadata: {
      category: 'credit',
      appliesTo: ['all_customers'],
      creditAmounts: {
        'Outage 4-8 hours': '25% daily rate',
        'Outage 8-24 hours': '50% daily rate',
        'Outage 24+ hours': '100% daily rate',
        'Billing error': 'Full refund of error amount',
      },
      approvalLevel: 'supervisor',
      maxCreditWithoutApproval: 50,
      processingTime: '1-2 billing cycles',
    },
  },
  {
    name: 'Government Funding Policy - BEAD/RDOF',
    description: 'Policy for government funding eligibility through BEAD and RDOF programs. Determines if locations or customers are eligible for government-subsidized service.',
    metadata: {
      category: 'funding',
      appliesTo: ['eligible_locations', 'eligible_customers'],
      programs: ['BEAD', 'RDOF'],
      eligibilityCriteria: [
        'Location must be in designated underserved/unserved area',
        'Must meet program-specific requirements',
        'Service must meet minimum speed requirements',
      ],
      verificationRequired: true,
      approvalLevel: 'manager',
      documentationRequired: ['location_verification', 'program_eligibility'],
      notes: 'High-level policy for determining funding eligibility. Detailed program requirements available in program documentation.',
    },
  },
]

async function seedPolicies() {
  console.log('Starting policy seeding...')
  console.log(`Processing ${policies.length} policies...`)

  try {
    const schema = getSchemaName()
    const existingPolicies = await pool.query(
      `SELECT title FROM ${schema}.scenarios WHERE type = 'policy'`,
    )
    const existingTitles = new Set(
      existingPolicies.rows.map((row: { title: string }) => row.title),
    )

    for (let i = 0; i < policies.length; i++) {
      const item = policies[i]

      if (existingTitles.has(item.name)) {
        console.log(
          `[${i + 1}/${policies.length}] Skipping (already exists): ${item.name}`,
        )
        continue
      }

      console.log(`[${i + 1}/${policies.length}] Processing: ${item.name}`)

      // Build text for embedding: description + metadata keywords
      let textToEmbed = item.description
      if (item.metadata.category)
        textToEmbed += `. Category: ${item.metadata.category}`
      if (item.metadata.approvalLevel)
        textToEmbed += `. Approval: ${item.metadata.approvalLevel}`

      const embedding = await generateEmbedding(textToEmbed)

      await insertScenario(
        item.name, // title
        item.description, // description
        embedding,
        'policy', // type
        item.metadata,
      )

      console.log(`✓ Inserted: ${item.name}`)
    }

    console.log('\n✓ Policy seeding completed successfully!')
  } catch (error) {
    console.error('Error seeding policies:', error)
    process.exit(1)
  } finally {
    await closePool()
  }
}

// Run the seed script
seedPolicies()
