#!/usr/bin/env node

/**
 * Validation script: Compare CSV data to live Netlify Final RSVP form submissions.
 *
 * Usage: node scripts/validate-final-rsvp-data.mjs
 *
 * Reads the CSV file from scripts/, fetches live data from Netlify Forms API,
 * and reports discrepancies with fuzzy name matching.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ============================================================================
// NORMALIZATION UTILITIES (match admin-rsvps.ts and admin-final-rsvps.ts)
// ============================================================================

/** Lowercases, strips accents, and collapses whitespace for name comparison. */
function normalizeName(name) {
  if (!name) return ''
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

/** Standard Levenshtein edit distance between two strings. */
function levenshtein(a, b) {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  const prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const curr = [i]
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost)
    }
    prev.splice(0, prev.length, ...curr)
  }
  return prev[b.length]
}

/** Exact match after normalization, or Levenshtein distance <= 1 for names of length >= 3 (catches typos/accents). */
function isNameMatch(a, b) {
  const normA = normalizeName(a)
  const normB = normalizeName(b)
  if (!normA || !normB) return false
  if (normA === normB) return true
  if (normA.length < 3 || normB.length < 3) return false
  return levenshtein(normA, normB) <= 1
}

// ============================================================================
// CSV PARSING
// ============================================================================

/**
 * Simple CSV parser that handles quoted fields.
 */
function parseCsvLine(line) {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }

  result.push(current)
  return result.map((v) => v.trim())
}

/**
 * Parse CSV file into contacts with guests arrays.
 * Columns: Primary Name, Email, Welcome Dinner, Ceremony & Reception, Farewell Brunch,
 *          Guest Name, Age Group, Appetizer, Main Course, Allergies, Song Request,
 *          Accommodation Type, Accommodation Detail, Column 14, Photography Consent
 */
function parseCsvFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n').filter((l) => l.trim())

  if (lines.length < 1) {
    throw new Error('CSV file is empty')
  }

  // Skip header
  const dataLines = lines.slice(1)

  const byEmail = new Map()

  for (const line of dataLines) {
    const fields = parseCsvLine(line)

    const primaryName = fields[0]?.trim() || ''
    const email = fields[1]?.trim().toLowerCase() || ''
    const welcomeDinner = fields[2]?.trim().toLowerCase() || ''
    const ceremony = fields[3]?.trim().toLowerCase() || ''
    const brunch = fields[4]?.trim().toLowerCase() || ''
    const guestName = fields[5]?.trim() || ''
    const ageGroup = fields[6]?.trim() || ''
    const appetizer = fields[7]?.trim() || ''
    const main = fields[8]?.trim() || ''
    const allergies = fields[9]?.trim() || ''
    const songRequest = fields[10]?.trim() || ''
    const accommodationType = fields[11]?.trim() || ''
    const accommodationDetail = fields[12]?.trim() || ''
    const transportation = fields[13]?.trim() || '' // Column 14 appears to be transportation
    const photographyConsent = fields[14]?.trim() || ''

    if (!email || !guestName) {
      continue
    }

    let contact = byEmail.get(email)
    if (!contact) {
      contact = {
        email,
        firstName: primaryName,
        guests: [],
        accommodationType,
        accommodationAddress: accommodationDetail,
        transportationPreference: transportation === 'taxi' ? 'taxi' : 'own',
        songRequest,
        photographyConsent:
          photographyConsent.toLowerCase() === 'yes' ? true : photographyConsent.toLowerCase() === 'no' ? false : null,
        submittedAt: new Date().toISOString(), // CSV doesn't have timestamp
      }
      byEmail.set(email, contact)
    }

    // Add guest
    const isChild = ageGroup.toLowerCase().includes('child') || ageGroup.toLowerCase().includes('baby')
    const guest = {
      name: guestName,
      events: {
        welcome: welcomeDinner === 'yes' ? 'yes' : welcomeDinner === 'no' ? 'no' : '',
        ceremony: ceremony === 'yes' ? 'yes' : ceremony === 'no' ? 'no' : '',
        brunch: brunch === 'yes' ? 'yes' : brunch === 'no' ? 'no' : '',
      },
      isChild,
    }

    // Only add meal preferences for adults
    if (!isChild) {
      guest.appetizer = appetizer || ''
      guest.main = main || ''
      guest.allergies = allergies || ''
    }

    contact.guests.push(guest)
  }

  return Array.from(byEmail.values())
}

// ============================================================================
// NETLIFY API
// ============================================================================

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env')
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8')
    const lines = content.split('\n')
    for (const line of lines) {
      const match = line.match(/^([^=]+)=(.*)$/)
      if (match) {
        const key = match[1].trim()
        const value = match[2].trim().replace(/^['"]|['"]$/g, '') // Remove quotes
        if (!process.env[key]) {
          process.env[key] = value
        }
      }
    }
  }
}

async function fetchNetlifyFinalRsvpSubmissions() {
  const token = process.env.NETLIFY_API_TOKEN
  const siteId = process.env.SITE_ID

  if (!token || !siteId) {
    throw new Error('Missing NETLIFY_API_TOKEN or SITE_ID environment variables. Please add them to .env file.')
  }

  // 1. Find the final-rsvp form
  const formsRes = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/forms`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!formsRes.ok) {
    throw new Error(`Failed to fetch forms from Netlify: ${formsRes.status}`)
  }

  const forms = await formsRes.json()
  const finalRsvpForm = forms.find((f) => f.name === 'final-rsvp')

  if (!finalRsvpForm) {
    throw new Error('final-rsvp form not found on Netlify. Available: ' + forms.map((f) => f.name).join(', '))
  }

  // 2. Paginate through all submissions
  const allSubmissions = []
  let page = 1
  const perPage = 100

  while (true) {
    const res = await fetch(
      `https://api.netlify.com/api/v1/forms/${finalRsvpForm.id}/submissions?per_page=${perPage}&page=${page}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )

    if (!res.ok) {
      throw new Error(`Failed to fetch submissions page ${page}: ${res.status}`)
    }

    const subs = await res.json()
    if (subs.length === 0) break
    allSubmissions.push(...subs)
    if (subs.length < perPage) break
    page++
  }

  return allSubmissions
}

/**
 * Normalize Netlify submission to match CSV structure.
 */
function normalizeNetlifySubmission(sub) {
  const d = sub.data

  function parseJsonField(value, fallback) {
    if (!value) return fallback
    try {
      return JSON.parse(value)
    } catch {
      return fallback
    }
  }

  function parseBooleanField(value) {
    if (value === 'true') return true
    if (value === 'false') return false
    return null
  }

  // Handle legacy submissions where guests array might be missing
  const legacyEvents = parseJsonField(d.events, undefined)
  const rawGuests = parseJsonField(d.guests, [])
  const guests = rawGuests.map((g) => ({
    ...g,
    events: g.events || legacyEvents || { welcome: '', ceremony: '', brunch: '' },
  }))

  return {
    id: sub.id,
    firstName: (d.firstName || '').trim(),
    email: (d.email || '').trim().toLowerCase(),
    guests,
    accommodationType: (d.accommodationType || '').trim(),
    accommodationAddress: (d.accommodationAddress || '').trim(),
    hotelName: (d.hotelName || '').trim(),
    transportationPreference: (d.transportationPreference || '').trim(),
    songRequest: (d.songRequest || '').trim(),
    photographyConsent: parseBooleanField(d.photographyConsent),
    additionalNotes: (d.additionalNotes || '').trim(),
    submittedAt: sub.created_at,
    locale: (d.locale || 'en').trim().toLowerCase().split('-')[0] || 'en',
  }
}

/**
 * Process Netlify submissions: normalize and deduplicate by email (keep latest).
 */
function processNetlifySubmissions(submissions) {
  const byEmail = new Map()

  for (const sub of submissions) {
    const rsvp = normalizeNetlifySubmission(sub)
    if (!rsvp.email) continue

    const existing = byEmail.get(rsvp.email)
    if (!existing || new Date(rsvp.submittedAt) > new Date(existing.submittedAt)) {
      byEmail.set(rsvp.email, rsvp)
    }
  }

  return Array.from(byEmail.values())
}

// ============================================================================
// COMPARISON & VALIDATION
// ============================================================================

function compareContacts(csvData, netlifyData) {
  const report = {
    summary: {
      csvTotal: csvData.length,
      netlifyTotal: netlifyData.length,
      exactMatches: 0,
      discrepancies: [],
    },
  }

  const csvByEmail = new Map(csvData.map((c) => [c.email, c]))
  const netlifyByEmail = new Map(netlifyData.map((c) => [c.email, c]))

  const allEmails = new Set([...csvByEmail.keys(), ...netlifyByEmail.keys()])

  for (const email of allEmails) {
    const csv = csvByEmail.get(email)
    const netlify = netlifyByEmail.get(email)

    if (!csv) {
      report.summary.discrepancies.push({
        type: 'EXTRA_IN_NETLIFY',
        email,
        netlifyFirstName: netlify.firstName,
        guestCount: netlify.guests.length,
      })
      continue
    }

    if (!netlify) {
      report.summary.discrepancies.push({
        type: 'MISSING_IN_NETLIFY',
        email,
        csvFirstName: csv.firstName,
        guestCount: csv.guests.length,
      })
      continue
    }

    // Compare contact-level fields
    const contactDiffs = []

    if (!isNameMatch(csv.firstName, netlify.firstName)) {
      contactDiffs.push({
        field: 'firstName',
        csv: csv.firstName,
        netlify: netlify.firstName,
      })
    }

    if (csv.accommodationType.toLowerCase() !== netlify.accommodationType.toLowerCase()) {
      contactDiffs.push({
        field: 'accommodationType',
        csv: csv.accommodationType,
        netlify: netlify.accommodationType,
      })
    }

    if (csv.accommodationAddress.toLowerCase() !== netlify.accommodationAddress.toLowerCase()) {
      contactDiffs.push({
        field: 'accommodationAddress',
        csv: csv.accommodationAddress || '(none)',
        netlify: netlify.accommodationAddress || '(none)',
      })
    }

    // Compare guests
    const guestDiffs = []

    // Match guests by name with fuzzy matching
    const unmatchedCsvGuests = [...csv.guests]
    const unmatchedNetlifyGuests = [...netlify.guests]

    for (let i = 0; i < unmatchedCsvGuests.length; i++) {
      const csvGuest = unmatchedCsvGuests[i]
      let bestMatch = null
      let bestMatchIdx = -1
      let bestMatchScore = Infinity

      for (let j = 0; j < unmatchedNetlifyGuests.length; j++) {
        const netlifyGuest = unmatchedNetlifyGuests[j]
        if (isNameMatch(csvGuest.name, netlifyGuest.name)) {
          bestMatch = netlifyGuest
          bestMatchIdx = j
          bestMatchScore = 0
          break
        }
      }

      if (bestMatch) {
        unmatchedCsvGuests.splice(i, 1)
        unmatchedNetlifyGuests.splice(bestMatchIdx, 1)
        i--

        // Compare fields for matched guest
        const fieldDiffs = []

        if (csvGuest.isChild !== bestMatch.isChild) {
          fieldDiffs.push({
            guestName: csvGuest.name,
            field: 'isChild',
            csv: csvGuest.isChild,
            netlify: bestMatch.isChild,
          })
        }

        // Compare events
        if (csvGuest.events.welcome !== bestMatch.events.welcome) {
          fieldDiffs.push({
            guestName: csvGuest.name,
            field: 'events.welcome',
            csv: csvGuest.events.welcome,
            netlify: bestMatch.events.welcome,
          })
        }
        if (csvGuest.events.ceremony !== bestMatch.events.ceremony) {
          fieldDiffs.push({
            guestName: csvGuest.name,
            field: 'events.ceremony',
            csv: csvGuest.events.ceremony,
            netlify: bestMatch.events.ceremony,
          })
        }
        if (csvGuest.events.brunch !== bestMatch.events.brunch) {
          fieldDiffs.push({
            guestName: csvGuest.name,
            field: 'events.brunch',
            csv: csvGuest.events.brunch,
            netlify: bestMatch.events.brunch,
          })
        }

        // Compare meals (only for adults)
        if (!csvGuest.isChild && !bestMatch.isChild) {
          if ((csvGuest.appetizer || '').toLowerCase() !== (bestMatch.appetizer || '').toLowerCase()) {
            fieldDiffs.push({
              guestName: csvGuest.name,
              field: 'appetizer',
              csv: csvGuest.appetizer || '(none)',
              netlify: bestMatch.appetizer || '(none)',
            })
          }
          if ((csvGuest.main || '').toLowerCase() !== (bestMatch.main || '').toLowerCase()) {
            fieldDiffs.push({
              guestName: csvGuest.name,
              field: 'main',
              csv: csvGuest.main || '(none)',
              netlify: bestMatch.main || '(none)',
            })
          }
          if ((csvGuest.allergies || '').toLowerCase() !== (bestMatch.allergies || '').toLowerCase()) {
            fieldDiffs.push({
              guestName: csvGuest.name,
              field: 'allergies',
              csv: csvGuest.allergies || '(none)',
              netlify: bestMatch.allergies || '(none)',
            })
          }
        }

        if (fieldDiffs.length > 0) {
          guestDiffs.push(...fieldDiffs)
        }
      }
    }

    // Unmatched guests in CSV
    for (const guest of unmatchedCsvGuests) {
      guestDiffs.push({
        type: 'MISSING_IN_NETLIFY',
        guestName: guest.name,
      })
    }

    // Unmatched guests in Netlify
    for (const guest of unmatchedNetlifyGuests) {
      guestDiffs.push({
        type: 'EXTRA_IN_NETLIFY',
        guestName: guest.name,
      })
    }

    if (contactDiffs.length === 0 && guestDiffs.length === 0) {
      report.summary.exactMatches++
    } else {
      report.summary.discrepancies.push({
        type: 'FIELD_MISMATCH',
        email,
        csvFirstName: csv.firstName,
        netlifyFirstName: netlify.firstName,
        contactDiffs,
        guestDiffs,
      })
    }
  }

  return report
}

// ============================================================================
// REPORTING
// ============================================================================

function colorize(text, color) {
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
  }
  return `${colors[color] || ''}${text}${colors.reset}`
}

function printReport(report) {
  const { summary } = report

  console.log('\n' + '='.repeat(80))
  console.log(colorize('FINAL RSVP DATA VALIDATION REPORT', 'blue'))
  console.log('='.repeat(80) + '\n')

  console.log(colorize('SUMMARY', 'yellow'))
  console.log(`  CSV records:      ${summary.csvTotal}`)
  console.log(`  Netlify records:  ${summary.netlifyTotal}`)
  console.log(`  Exact matches:    ${colorize(String(summary.exactMatches), 'green')}`)
  console.log(`  Discrepancies:    ${colorize(String(summary.discrepancies.length), summary.discrepancies.length === 0 ? 'green' : 'red')}`)

  if (summary.discrepancies.length === 0) {
    console.log('\n' + colorize('✓ No discrepancies found! CSV matches Netlify data.', 'green'))
    console.log('='.repeat(80) + '\n')
    return 0
  }

  console.log('\n' + colorize('DISCREPANCIES', 'red'))
  console.log('-'.repeat(80))

  // Group by type
  const byType = new Map()
  for (const disc of summary.discrepancies) {
    const type = disc.type
    if (!byType.has(type)) byType.set(type, [])
    byType.get(type).push(disc)
  }

  for (const [type, items] of byType) {
    console.log(`\n${colorize(type, 'red')} (${items.length}):`)

    for (const item of items) {
      if (type === 'MISSING_IN_NETLIFY') {
        console.log(`  ✗ ${item.csvFirstName} (${item.email}) - ${item.guestCount} guests`)
      } else if (type === 'EXTRA_IN_NETLIFY') {
        console.log(`  + ${item.netlifyFirstName} (${item.email}) - ${item.guestCount} guests`)
      } else if (type === 'FIELD_MISMATCH') {
        console.log(`  ~ ${item.csvFirstName} (${item.email})`)

        if (item.contactDiffs.length > 0) {
          console.log('    Contact fields:')
          for (const diff of item.contactDiffs) {
            console.log(`      ${diff.field}:`)
            console.log(`        CSV:     ${colorize(String(diff.csv), 'yellow')}`)
            console.log(`        Netlify: ${colorize(String(diff.netlify), 'yellow')}`)
          }
        }

        if (item.guestDiffs.length > 0) {
          console.log('    Guest mismatches:')
          for (const diff of item.guestDiffs) {
            if (diff.type === 'MISSING_IN_NETLIFY') {
              console.log(`      - ${diff.guestName} (not in Netlify)`)
            } else if (diff.type === 'EXTRA_IN_NETLIFY') {
              console.log(`      + ${diff.guestName} (extra in Netlify)`)
            } else {
              console.log(`      ${diff.guestName} - ${diff.field}:`)
              console.log(`        CSV:     ${colorize(String(diff.csv), 'yellow')}`)
              console.log(`        Netlify: ${colorize(String(diff.netlify), 'yellow')}`)
            }
          }
        }
      }
    }
  }

  console.log('\n' + '='.repeat(80) + '\n')
  return 1
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  try {
    // Load environment variables from .env file
    loadEnv()

    const csvPath = path.join(__dirname, 'Carolina & Thomas 26.8.26 Final Attendees - Final Attendees.csv')

    console.log('📋 Parsing CSV file...')
    const csvData = parseCsvFile(csvPath)
    console.log(`   Loaded ${csvData.length} contacts from CSV`)

    console.log('🌐 Fetching Netlify submissions...')
    const netlifySubmissions = await fetchNetlifyFinalRsvpSubmissions()
    console.log(`   Fetched ${netlifySubmissions.length} raw submissions from Netlify`)

    console.log('🔄 Processing and deduplicating...')
    const netlifyData = processNetlifySubmissions(netlifySubmissions)
    console.log(`   Deduplicated to ${netlifyData.length} unique contacts`)

    console.log('🔍 Comparing data...')
    const report = compareContacts(csvData, netlifyData)

    const exitCode = printReport(report)
    process.exit(exitCode)
  } catch (error) {
    console.error(colorize('❌ Error:', 'red'), error.message)
    process.exit(1)
  }
}

main()
