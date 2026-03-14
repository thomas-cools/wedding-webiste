import type { Handler } from '@netlify/functions'
import {
  verifyAdminRequest,
  adminJson,
  adminUnauthorized,
  adminCorsResponse,
} from './utils/admin-auth'

/**
 * Admin endpoint to send bulk emails via Resend.
 *
 * POST /api/admin-send-email — Protected by admin JWT
 *
 * Body: {
 *   recipients: Array<{ email: string; name: string }>
 *   subject: string
 *   htmlBody: string
 *   textBody?: string
 * }
 *
 * Wraps the custom HTML body in the wedding email template and sends via Resend.
 */

const weddingConfig = {
  couple: {
    person1: 'Carolina',
    person2: 'Thomas',
  },
  contactEmail: 'carolinaandthomaswedding@gmail.com',
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function wrapInEmailTemplate(subject: string, htmlBody: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #E3DFCE; font-family: 'Georgia', 'Times New Roman', serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #E3DFCE;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 40px; background-color: #0B1937; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; color: #E3DFCE; font-family: 'Georgia', serif;">
                ${weddingConfig.couple.person1} & ${weddingConfig.couple.person2}
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 30px 40px; color: #300F0C; font-size: 16px; line-height: 1.6;">
              ${htmlBody}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #300F0C; border-top: 1px solid #94B1C8; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #E3DFCE; opacity: 0.8;">
                ${escapeHtml(weddingConfig.couple.person1)} &amp; ${escapeHtml(weddingConfig.couple.person2)} · ${escapeHtml(weddingConfig.contactEmail)}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

interface Recipient {
  email: string
  name: string
}

interface SendEmailBody {
  recipients: Recipient[]
  subject: string
  htmlBody: string
  textBody?: string
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return adminCorsResponse()
  }

  if (event.httpMethod !== 'POST') {
    return adminJson(405, { ok: false, error: 'Method not allowed' })
  }

  // Verify admin JWT
  const payload = verifyAdminRequest(
    event.headers as Record<string, string | undefined>
  )
  if (!payload) {
    return adminUnauthorized()
  }

  // Parse body
  let body: SendEmailBody
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return adminJson(400, { ok: false, error: 'Invalid JSON body' })
  }

  const { recipients, subject, htmlBody, textBody } = body

  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    return adminJson(400, { ok: false, error: 'recipients array is required' })
  }

  if (!subject || typeof subject !== 'string') {
    return adminJson(400, { ok: false, error: 'subject is required' })
  }

  if (!htmlBody || typeof htmlBody !== 'string') {
    return adminJson(400, { ok: false, error: 'htmlBody is required' })
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY
  if (!RESEND_API_KEY) {
    console.error('Missing RESEND_API_KEY env var')
    return adminJson(500, { ok: false, error: 'Server configuration error' })
  }

  const fromEmail =
    process.env.FROM_EMAIL || 'Wedding RSVP <onboarding@resend.dev>'

  const wrappedHtml = wrapInEmailTemplate(subject, htmlBody)
  const results: Array<{ email: string; success: boolean; error?: string }> = []

  for (const recipient of recipients) {
    if (!recipient.email) {
      results.push({ email: '', success: false, error: 'Missing email address' })
      continue
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [recipient.email],
          subject,
          html: wrappedHtml,
          text: textBody || '',
        }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error(`Failed to send to ${recipient.email}:`, errorData)
        results.push({ email: recipient.email, success: false, error: errorData })
      } else {
        results.push({ email: recipient.email, success: true })
      }
    } catch (error) {
      console.error(`Error sending to ${recipient.email}:`, error)
      results.push({
        email: recipient.email,
        success: false,
        error: String(error),
      })
    }
  }

  const succeeded = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success).length

  return adminJson(200, {
    ok: true,
    message: `Sent ${succeeded} emails, ${failed} failed`,
    sent: succeeded,
    failed,
    total: recipients.length,
    results,
  })
}
