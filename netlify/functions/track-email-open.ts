import type { Handler } from '@netlify/functions'

/**
 * Email open tracking endpoint.
 *
 * GET /.netlify/functions/track-email-open?e=<email>&c=<campaign>
 *
 * Logs the open event to the "email-opens" Netlify Form, then returns
 * a 1×1 transparent GIF. No authentication required (called from email clients).
 */

// 1×1 transparent GIF (43 bytes)
const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
)

const GIF_RESPONSE = {
  statusCode: 200,
  headers: {
    'Content-Type': 'image/gif',
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
  },
  body: TRANSPARENT_GIF.toString('base64'),
  isBase64Encoded: true,
}

// Cache the form ID across warm invocations
let cachedFormId: string | null = null

async function getEmailOpensFormId(token: string, siteId: string): Promise<string | null> {
  if (cachedFormId) return cachedFormId

  const res = await fetch(
    `https://api.netlify.com/api/v1/sites/${siteId}/forms`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) {
    console.error(`Failed to list forms: ${res.status}`)
    return null
  }

  const forms = (await res.json()) as Array<{ id: string; name: string }>
  const form = forms.find((f) => f.name === 'email-opens')
  if (!form) {
    console.error('email-opens form not found')
    return null
  }

  cachedFormId = form.id
  return cachedFormId
}

export const handler: Handler = async (event) => {
  // Always return the GIF, even if logging fails
  const email = event.queryStringParameters?.e
  const campaign = event.queryStringParameters?.c

  if (!email || !campaign) {
    return GIF_RESPONSE
  }

  // Log to Netlify Forms via the REST API (bypasses CDN routing)
  try {
    const token = process.env.NETLIFY_API_TOKEN
    const siteId = process.env.SITE_ID
    if (!token || !siteId) {
      console.error('Missing NETLIFY_API_TOKEN or SITE_ID env vars')
      return GIF_RESPONSE
    }

    const formId = await getEmailOpensFormId(token, siteId)
    if (!formId) return GIF_RESPONSE

    const res = await fetch(
      `https://api.netlify.com/api/v1/forms/${formId}/submissions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientEmail: email,
          campaign,
          openedAt: new Date().toISOString(),
        }),
      }
    )

    if (!res.ok) {
      console.error(`Email open submission failed: ${res.status} ${await res.text()}`)
    }
  } catch (err) {
    console.error('Failed to log email open:', err)
  }

  return GIF_RESPONSE
}
