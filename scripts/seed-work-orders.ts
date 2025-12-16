/**
 * Seed script for populating work order types
 */

import { generateEmbedding } from 'simple-embeddings'
import { insertScenario, closePool, pool, getSchemaName } from '../lib/db'

// Work order data
const workOrders = [
  {
    name: 'Change of Service',
    content: 'Change of Service',
    description: '',
    no_truck: true,
    time_bound: false,
    sla: 'No',
    customer_service_impacting: 'No',
    conexon_job_only: false,
    category: 'standard',
  },
  {
    name: 'COS - Telephone Port',
    content: 'COS - Telephone Port',
    description: '',
    no_truck: false,
    time_bound: true,
    sla: 'No',
    customer_service_impacting: 'Yes',
    conexon_job_only: true,
    category: 'standard',
  },
  {
    name: 'Dark Fiber Activation',
    content: 'Dark Fiber Activation. Conexon leases out fiber to another company',
    description: 'Conexon leases out fiber to another company',
    no_truck: true,
    time_bound: false,
    sla: 'N/A',
    customer_service_impacting: 'N/A',
    conexon_job_only: false,
    category: 'standard',
  },
  {
    name: 'Drop Relocation',
    content: 'Drop Relocation',
    description: '',
    no_truck: false,
    time_bound: false,
    sla: 'No',
    customer_service_impacting: 'No',
    conexon_job_only: false,
    category: 'standard',
  },
  {
    name: 'Equip Ship - Pkg modify',
    content: 'Equip Ship - Pkg modify',
    description: '',
    no_truck: true,
    time_bound: false,
    sla: 'No',
    customer_service_impacting: 'No',
    conexon_job_only: false,
    category: 'standard',
  },
  {
    name: 'Inactive - Drop Service Call',
    content: 'Inactive - Drop Service Call. Inactive customer - storm damage, disco for non-pmt - there is a problem with the drop that needs to be fixed',
    description: 'Inactive customer - storm damage, disco for non-pmt - there is a problem with the drop that needs to be fixed',
    no_truck: false,
    time_bound: false,
    sla: 'No',
    customer_service_impacting: 'No',
    conexon_job_only: false,
    category: 'inactive',
  },
  {
    name: 'Reconnect',
    content: 'Reconnect. May or may not require a technician - will if equipment needs to be added',
    description: 'May or may not require a technician - will if equipment needs to be added',
    no_truck: false,
    time_bound: true,
    sla: 'by date of install',
    customer_service_impacting: 'Yes',
    conexon_job_only: false,
    category: 'standard',
  },
  {
    name: 'Return of Equipment',
    content: 'Return of Equipment',
    description: '',
    no_truck: true,
    time_bound: false,
    sla: 'No',
    customer_service_impacting: 'No',
    conexon_job_only: false,
    category: 'standard',
  },
  {
    name: 'Activate Internet',
    content: 'Activate Internet',
    description: '',
    no_truck: false,
    time_bound: true,
    sla: 'Date of Install',
    customer_service_impacting: 'Yes',
    conexon_job_only: false,
    category: 'standard',
  },
  {
    name: 'Activate Native Telephone',
    content: 'Activate Native Telephone',
    description: '',
    no_truck: false,
    time_bound: true,
    sla: 'Date of Install',
    customer_service_impacting: 'Yes',
    conexon_job_only: true,
    category: 'standard',
  },
  {
    name: 'Activate Ported Telephone',
    content: 'Activate Ported Telephone',
    description: '',
    no_truck: false,
    time_bound: true,
    sla: 'Date of Install',
    customer_service_impacting: 'Yes',
    conexon_job_only: true,
    category: 'standard',
  },
  {
    name: 'Drop Connect WO',
    content: 'Drop Connect WO',
    description: '',
    no_truck: false,
    time_bound: false,
    sla: 'by date of install',
    customer_service_impacting: 'Yes',
    conexon_job_only: false,
    category: 'standard',
  },
  {
    name: 'Drop Service Call',
    content: 'Drop Service Call. Issue with drop that tech needs to review, may or may not be service impacting (was previously an SRV WO)',
    description: 'Issue with drop that tech needs to review, may or may not be service impacting (was previously an SRV WO)',
    no_truck: false,
    time_bound: true,
    sla: '24hrs',
    customer_service_impacting: 'Yes & No',
    conexon_job_only: false,
    category: 'standard',
  },
  {
    name: 'MBM Activate',
    content: 'MBM Activate',
    description: '',
    no_truck: false,
    time_bound: true,
    sla: 'Date of Install',
    customer_service_impacting: 'Yes',
    conexon_job_only: false,
    category: 'standard',
  },
  {
    name: 'Resi Site Survey',
    content: 'Resi Site Survey. Flint only (In-house as of 12/12)',
    description: 'Flint only (In-house as of 12/12)',
    no_truck: false,
    time_bound: true,
    sla: '7',
    customer_service_impacting: 'No',
    conexon_job_only: true,
    category: 'standard',
  },
  {
    name: 'Service Call',
    content: 'Service Call. WO type created when tech needs to be dispatched - additional WOs may follow depending on work needed',
    description: 'WO type created when tech needs to be dispatched - additional WOs may follow depending on work needed',
    no_truck: false,
    time_bound: true,
    sla: '24hrs',
    customer_service_impacting: 'Yes',
    conexon_job_only: true,
    category: 'standard',
  },
  {
    name: 'Temp Drop - Follow-Up WO',
    content: 'Temp Drop - Follow-Up WO. Field techs create FWO at time of install/service call if drop can\'t be completed at that time (These typically occur during cold seasons and can\'t be completed until ground is ready.) This happens too on the +1 day installs because locates didn\'t happen in time for install so the tech had to do a temp. Should we push out these dates when the ground is fre',
    description: 'Field techs create FWO at time of install/service call if drop can\'t be completed at that time (These typically occur during cold seasons and can\'t be completed until ground is ready.) This happens too on the +1 day installs because locates didn\'t happen in time for install so the tech had to do a temp',
    no_truck: false,
    time_bound: false,
    sla: '7',
    customer_service_impacting: 'No',
    conexon_job_only: false,
    category: 'standard',
  },
  {
    name: 'Temp Drop Bury',
    content: 'Temp Drop Bury. TDB WO - Temp in place but f/u required - need to finalize a temp drop whether it\'s buried or aerial (These typically occur during cold seasons and can\'t be completed until ground is ready.) (These also get created because the tech didn\'t create an FWO - they have 24 hrs to create it.). Should we push out these dates when the ground is fre Maybe push them out until 1 month prior to being read',
    description: 'TDB WO - Temp in place but f/u required - need to finalize a temp drop whether it\'s buried or aerial (These typically occur during cold seasons and can\'t be completed until ground is ready.) (These also get created because the tech didn\'t create an FWO - they have 24 hrs to create it.)',
    no_truck: false,
    time_bound: false,
    sla: '7',
    customer_service_impacting: 'No',
    conexon_job_only: false,
    category: 'standard',
  },
  {
    name: 'Commercial Internet',
    content: 'Commercial Internet. These dates get continuously pushed out.',
    description: '',
    no_truck: false,
    time_bound: true,
    sla: '42',
    customer_service_impacting: 'Yes',
    conexon_job_only: true,
    category: 'standard',
  },
  {
    name: 'Commercial Site Survey',
    content: 'Commercial Site Survey. These dates get continuously pushed out.',
    description: '',
    no_truck: false,
    time_bound: false,
    sla: '7',
    customer_service_impacting: 'Yes',
    conexon_job_only: true,
    category: 'standard',
  },
  {
    name: 'Commercial Telephone',
    content: 'Commercial Telephone. These dates get continuously pushed out.',
    description: '',
    no_truck: false,
    time_bound: true,
    sla: '42',
    customer_service_impacting: 'Yes',
    conexon_job_only: true,
    category: 'standard',
  },
]

async function seedWorkOrders() {
  console.log('Starting work order seeding...')
  console.log(`Processing ${workOrders.length} work orders...`)

  try {
    const schema = getSchemaName()
    // Check which work orders already exist
    const existingWorkOrders = await pool.query(
      `SELECT title FROM ${schema}.scenarios WHERE type = 'work_order'`,
    )
    const existingTitles = new Set(
      existingWorkOrders.rows.map((row: { title: string }) => row.title),
    )

    for (let i = 0; i < workOrders.length; i++) {
      const wo = workOrders[i]

      if (existingTitles.has(wo.name)) {
        console.log(
          `[${i + 1}/${workOrders.length}] Skipping (already exists): ${wo.name}`,
        )
        continue
      }

      console.log(`[${i + 1}/${workOrders.length}] Processing: ${wo.name}`)

      // Build text for embedding: content + metadata keywords
      let textToEmbed = wo.content || wo.name
      if (wo.time_bound) textToEmbed += '. Time bound'
      if (wo.no_truck) textToEmbed += '. No truck required'
      if (wo.sla && wo.sla !== 'No' && wo.sla !== 'N/A')
        textToEmbed += `. SLA: ${wo.sla}`
      if (wo.customer_service_impacting === 'Yes')
        textToEmbed += '. Customer service impacting'

      const embedding = await generateEmbedding(textToEmbed)

      // Build metadata object
      const metadata = {
        no_truck: wo.no_truck,
        time_bound: wo.time_bound,
        sla: wo.sla,
        customer_service_impacting: wo.customer_service_impacting,
        conexon_job_only: wo.conexon_job_only,
        category: wo.category,
      }

      await insertScenario(
        wo.name, // title
        wo.content || wo.name, // description
        embedding,
        'work_order', // type
        metadata,
      )

      console.log(`✓ Inserted: ${wo.name}`)
    }

    console.log('\n✓ Work order seeding completed successfully!')
  } catch (error) {
    console.error('Error seeding work orders:', error)
    process.exit(1)
  } finally {
    await closePool()
  }
}

// Run the seed script
seedWorkOrders()
