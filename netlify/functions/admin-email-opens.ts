import type { Handler } from '@netlify/functions'
import {
  verifyAdminRequest,
  adminJson,
  adminUnauthorized,
  adminCorsResponse,
} from './utils/admin-auth'

/**
 * Admin endpoint to fetch all email open events from Netlify Forms API.
 *
 * GET /api/admin-email-opens — Protected by admin JWT
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

export interface EmailOpen {
  id: string
  recipientEmail: string
  campaign: string
  openedAt: string
}

async function fetchAllEmailOpens(
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
  const opensForm = forms.find((f) => f.name === 'email-opens')

  if (!opensForm) {
    return []
  }

  const allSubmissions: NetlifyFormSubmission[] = []
  let page = 1
  const perPage = 100

  while (true) {
    const res = await fetch(
      `https://api.netlify.com/api/v1/forms/${opensForm.id}/submissions?per_page=${perPage}&page=${page}`,
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
    const submissions = await fetchAllEmailOpens(SITE_ID, NETLIFY_API_TOKEN)

    const emailOpens: EmailOpen[] = submissions.map((sub) => ({
      id: sub.id,
      recipientEmail: (sub.data.recipientEmail || sub.data.recipient_email || '').trim().toLowerCase(),
      campaign: (sub.data.campaign || '').trim(),
      openedAt: sub.data.openedAt || sub.data.opened_at || sub.created_at,
    }))

    return adminJson(200, { ok: true, emailOpens })
  } catch (error) {
    console.error('Failed to fetch email opens:', error)
    return adminJson(500, {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to fetch email opens',
    })
  }
}
