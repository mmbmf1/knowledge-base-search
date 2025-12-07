/**
 * Seed script for generating mock feedback data
 * 
 * This creates realistic feedback patterns:
 * - Some scenarios have high success rates (90%+)
 * - Some have moderate success rates (70-85%)
 * - Some have lower success rates (50-70%)
 * - Varies total feedback counts for realism
 */

import { pool, closePool, getSchemaName } from '../lib/db'

// Mock queries that users might search for
const mockQueries = [
  'router light is red',
  'no internet connection',
  'router power light red',
  'internet not working',
  'router keeps restarting',
  'slow internet speeds',
  'wifi not working',
  'cannot connect to internet',
  'router orange light',
  'internet connection problems',
  'wifi signal weak',
  'ethernet port not working',
  'authentication failed',
  'dns not working',
  'router admin panel',
  'port forwarding issues',
  'multiple devices cannot connect',
  'intermittent connection',
  'wifi password not working',
  'firmware update failed',
  'specific websites not loading',
  'router overheating',
  'ip address conflict',
  'parental controls blocking',
  'guest network not working',
  'time settings wrong',
  'qos causing problems',
  'account suspended',
  'factory reset needed',
  'fiber light levels low',
  'vpn not working',
  'wps button not working',
  'bandwidth limits exceeded',
  'mac address filtering',
  'upnp not working',
  'bridge mode issues',
]

// Feedback distribution patterns by scenario title
// Format: [title, helpfulRate (0-1), totalFeedbackCount]
// Higher helpful rates for common/easy issues, lower for complex ones
const feedbackPatterns: Array<[string, number, number]> = [
  ['Router Power Light is Red', 0.95, 45],
  ['Router Internet Light is Orange/Amber', 0.88, 38],
  ['No Internet Connection', 0.92, 52],
  ['Slow Internet Speeds', 0.75, 28],
  ['Authentication Failure', 0.82, 22],
  ['Ethernet Port Not Working', 0.90, 18],
  ['WiFi Signal is Weak', 0.78, 35],
  ['Router Keeps Restarting', 0.65, 15],
  ['Fiber Optic Cable Damage', 0.55, 12],
  ['ONT Power Light Off', 0.85, 20],
  ['Cannot Access Router Admin Panel', 0.88, 25],
  ['DNS Resolution Issues', 0.80, 30],
  ['Port Forwarding Not Working', 0.70, 16],
  ['Multiple Devices Cannot Connect', 0.75, 19],
  ['Service Intermittent - Works Then Drops', 0.68, 24],
  ['WiFi Password Not Working', 0.85, 32],
  ['Router Firmware Update Failed', 0.60, 10],
  ['Cannot Connect to Specific Websites', 0.72, 21],
  ['Router Overheating', 0.80, 14],
  ['IP Address Conflict', 0.88, 26],
  ['Parental Controls Blocking Access', 0.90, 29],
  ['Guest Network Not Working', 0.82, 17],
  ['Router Time Settings Incorrect', 0.95, 8],
  ['QoS Settings Causing Issues', 0.65, 13],
  ['Account Suspended or Past Due', 0.50, 11],
  ['Router Needs Factory Reset', 0.88, 23],
  ['Fiber Optic Light Levels Low', 0.45, 9],
  ['VPN Not Working Through Router', 0.70, 15],
  ['Router WPS Button Not Working', 0.75, 12],
  ['Bandwidth Usage Exceeding Limits', 0.55, 18],
  ['Router MAC Address Filtering Issues', 0.85, 20],
  ['UPnP Not Working', 0.68, 14],
  ['Router Bridge Mode Issues', 0.60, 10],
]

async function seedFeedback() {
  console.log('Starting feedback seeding...')

  try {
    const schema = getSchemaName()
    let totalFeedback = 0

    for (const [title, helpfulRate, totalCount] of feedbackPatterns) {
      // Find scenario by title (get the most recent one if duplicates exist)
      const scenarioResult = await pool.query(
        `SELECT id FROM ${schema}.scenarios WHERE title = $1 ORDER BY id DESC LIMIT 1`,
        [title],
      )

      if (scenarioResult.rows.length === 0) {
        console.log(`Skipping "${title}" - not found`)
        continue
      }

      const scenarioId = scenarioResult.rows[0].id

      const helpfulCount = Math.round(totalCount * helpfulRate)
      const notHelpfulCount = totalCount - helpfulCount

      // Generate helpful feedback
      for (let i = 0; i < helpfulCount; i++) {
        const query =
          mockQueries[Math.floor(Math.random() * mockQueries.length)]
        await pool.query(
          `INSERT INTO ${schema}.feedback (query, scenario_id, rating) VALUES ($1, $2, $3)`,
          [query, scenarioId, 1],
        )
        totalFeedback++
      }

      // Generate not helpful feedback
      for (let i = 0; i < notHelpfulCount; i++) {
        const query =
          mockQueries[Math.floor(Math.random() * mockQueries.length)]
        await pool.query(
          `INSERT INTO ${schema}.feedback (query, scenario_id, rating) VALUES ($1, $2, $3)`,
          [query, scenarioId, -1],
        )
        totalFeedback++
      }

      const percentage = ((helpfulCount / totalCount) * 100).toFixed(1)
      console.log(
        `✓ "${title}" (ID ${scenarioId}): ${helpfulCount}/${totalCount} helpful (${percentage}%)`,
      )
    }

    console.log(`\n✓ Inserted ${totalFeedback} feedback records`)
    console.log('✓ Feedback seeding completed successfully!')
  } catch (error) {
    console.error('Error seeding feedback:', error)
    process.exit(1)
  } finally {
    await closePool()
  }
}

// Run the seed script
seedFeedback()
