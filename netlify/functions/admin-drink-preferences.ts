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
  guestName: string
  submissionId: string
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
  const explicitGuestName = (d.guestName || d.guest_name || '').trim()
  return {
    id: sub.id,
    firstName: (d.firstName || d.first_name || '').trim(),
    guestName: explicitGuestName || (d.firstName || d.first_name || '').trim(),
    submissionId: (d.submissionId || d.submission_id || '').trim(),
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

    const normalized = submissions
      .map(normalizeSubmission)
      .filter((p) => p.email)

    // Group by email, then keep only the latest submission batch.
    // If a submissionId is present, all entries sharing it belong to the
    // same form submit. Pick the newest submissionId per email, and
    // discard older batches. For legacy entries (no submissionId),
    // fall back to per-guestName dedup.
    const byEmail = new Map<string, AdminDrinkPrefs[]>()
    for (const prefs of normalized) {
      const list = byEmail.get(prefs.email) || []
      list.push(prefs)
      byEmail.set(prefs.email, list)
    }

    const result: AdminDrinkPrefs[] = []
    for (const entries of byEmail.values()) {
      // Find the latest submissionId for this email
      const withSid = entries.filter((e) => e.submissionId)
      if (withSid.length > 0) {
        // Get the most recent submissionId by timestamp
        let latestSid = withSid[0]!.submissionId
        let latestTime = new Date(withSid[0]!.submittedAt).getTime()
        for (const e of withSid) {
          const t = new Date(e.submittedAt).getTime()
          if (t > latestTime) {
            latestTime = t
            latestSid = e.submissionId
          }
        }
        // Keep only entries from the latest submission batch
        result.push(...withSid.filter((e) => e.submissionId === latestSid))
      } else {
        // Legacy: no submissionId — dedup by guestName, keep latest
        const byGuest = new Map<string, AdminDrinkPrefs>()
        for (const e of entries) {
          const gk = e.guestName.toLowerCase()
          const existing = byGuest.get(gk)
          if (!existing || new Date(e.submittedAt) > new Date(existing.submittedAt)) {
            byGuest.set(gk, e)
          }
        }
        result.push(...byGuest.values())
      }
    }

    const drinkPrefs: AdminDrinkPrefs[] = result

    return adminJson(200, { ok: true, drinkPrefs })
  } catch (error) {
    console.error('Failed to fetch drink preferences:', error)
    return adminJson(500, {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to fetch drink preferences',
    })
  }
}
