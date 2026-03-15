import type { Handler } from '@netlify/functions'
import {
  verifyAdminRequest,
  adminJson,
  adminUnauthorized,
  adminCorsResponse,
} from './utils/admin-auth'

/**
 * Admin endpoint to fetch all drink preference submissions from Netlify Forms API.
 *
 * GET /api/admin-drink-preferences — Protected by admin JWT
 */

interface NetlifyForm {
  id: string
  name: string
  submission_count: number
}

interface NetlifyFormSubmission {
  id: string
  created_at: string
  data: Record<string, string | undefined>
}

export interface AdminDrinkPrefs {
  id: string
  firstName: string
  email: string
  wine: string[]
  beer: string[]
  cocktail: string[]
  favoriteCocktail: string
  nonAlcoholic: string[]
  comments: string
  submittedAt: string
}

function parseJsonField<T>(value: string | undefined, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function normalizeSubmission(sub: NetlifyFormSubmission): AdminDrinkPrefs {
  const d = sub.data
  return {
    id: sub.id,
    firstName: (d.firstName || d.first_name || '').trim(),
    email: (d.email || '').trim().toLowerCase(),
    wine: parseJsonField(d.wine, []),
    beer: parseJsonField(d.beer, []),
    cocktail: parseJsonField(d.cocktail, []),
    favoriteCocktail: (d.favoriteCocktail || d.favorite_cocktail || '').trim(),
    nonAlcoholic: parseJsonField(d.nonAlcoholic || d.non_alcoholic, []),
    comments: (d.comments || '').trim(),
    submittedAt: sub.created_at,
  }
}

async function fetchAllDrinkPrefsSubmissions(
  siteId: string,
  token: string
): Promise<NetlifyFormSubmission[]> {
  const formsRes = await fetch(
    `https://api.netlify.com/api/v1/sites/${siteId}/forms`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  if (!formsRes.ok) {
    throw new Error(`Failed to fetch forms: ${formsRes.status}`)
  }

  const forms: NetlifyForm[] = await formsRes.json()
  const drinkForm = forms.find((f) => f.name === 'drink-preferences')

  if (!drinkForm) {
    return []
  }

  const allSubmissions: NetlifyFormSubmission[] = []
  let page = 1
  const perPage = 100

  while (true) {
    const res = await fetch(
      `https://api.netlify.com/api/v1/forms/${drinkForm.id}/submissions?per_page=${perPage}&page=${page}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    if (!res.ok) {
      throw new Error(`Failed to fetch submissions page ${page}: ${res.status}`)
    }

    const subs: NetlifyFormSubmission[] = await res.json()
    if (subs.length === 0) break

    allSubmissions.push(...subs)
    if (subs.length < perPage) break
    page++
  }

  return allSubmissions
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return adminCorsResponse()
  }

  if (event.httpMethod !== 'GET') {
    return adminJson(405, { ok: false, error: 'Method not allowed' })
  }

  const payload = verifyAdminRequest(
    event.headers as Record<string, string | undefined>
  )
  if (!payload) {
    return adminUnauthorized()
  }

  const NETLIFY_API_TOKEN = process.env.NETLIFY_API_TOKEN
  const SITE_ID = process.env.SITE_ID

  if (!NETLIFY_API_TOKEN || !SITE_ID) {
    console.error('Missing NETLIFY_API_TOKEN or SITE_ID env vars')
    return adminJson(500, { ok: false, error: 'Server configuration error' })
  }

  try {
    const submissions = await fetchAllDrinkPrefsSubmissions(SITE_ID, NETLIFY_API_TOKEN)

    // Deduplicate by email (keep latest submission)
    const byEmail = new Map<string, AdminDrinkPrefs>()
    for (const sub of submissions) {
      const prefs = normalizeSubmission(sub)
      if (!prefs.email) continue

      const existing = byEmail.get(prefs.email)
      if (!existing || new Date(prefs.submittedAt) > new Date(existing.submittedAt)) {
        byEmail.set(prefs.email, prefs)
      }
    }

    const drinkPrefs = Array.from(byEmail.values())

    return adminJson(200, { ok: true, drinkPrefs })
  } catch (error) {
    console.error('Failed to fetch drink preferences:', error)
    return adminJson(500, {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to fetch drink preferences',
    })
  }
}
