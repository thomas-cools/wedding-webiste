import type { Handler } from '@netlify/functions'
import {
  verifyAdminRequest,
  adminJson,
  adminUnauthorized,
  adminCorsResponse,
} from './utils/admin-auth'

/**
 * Admin endpoint to send reminder emails via Resend.
 *
 * POST /api/admin-send-reminders — Protected by admin JWT
 *
 * Body: {
 *   type: 'rsvp_reminder' | 'event_reminder' | 'custom'
 *   recipients: Array<{ email: string; name: string }>
 *   subject?: string      // required for 'custom'
 *   htmlBody?: string     // required for 'custom'
 *   textBody?: string
 *   locale?: string       // default: 'en'
 * }
 */

const weddingConfig = {
  couple: {
    person1: 'Carolina',
    person2: 'Thomas',
  },
  contactEmail: 'carolinaandthomaswedding@gmail.com',
  websiteUrl: '',
}

type EmailLocale = 'en' | 'es' | 'nl'

function normalizeLocale(locale?: string): EmailLocale {
  const base = (locale || 'en').toLowerCase().split('-')[0]
  if (base === 'es' || base === 'nl') return base
  return 'en'
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

interface ReminderTemplate {
  subject: string
  html: (name: string, siteUrl: string) => string
  text: (name: string, siteUrl: string) => string
}

const RSVP_REMINDER_TEMPLATES: Record<EmailLocale, ReminderTemplate> = {
  en: {
    subject: `RSVP Reminder — ${weddingConfig.couple.person1} & ${weddingConfig.couple.person2}'s Wedding`,
    html: (name, siteUrl) => `
      <h2 style="margin: 0 0 20px; font-size: 22px; font-weight: normal; color: #0B1937;">
        Hi ${escapeHtml(name)},
      </h2>
      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6;">
        We noticed you haven't RSVPed yet for our wedding. We'd love to know if you can make it!
      </p>
      <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6;">
        Please take a moment to let us know by visiting our wedding website.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding: 10px 0 30px;">
            <a href="${siteUrl}/rsvp" style="display: inline-block; background-color: #300F0C; color: #E3DFCE; padding: 16px 40px; border-radius: 999px; text-decoration: none; font-size: 16px; font-family: 'Montserrat', Helvetica, sans-serif; letter-spacing: 1px;">
              RSVP Now
            </a>
          </td>
        </tr>
      </table>
      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #666; font-style: italic;">
        Thank you so much — we hope to see you there!
      </p>
      <p style="margin: 20px 0 0; font-size: 16px; line-height: 1.6;">
        With love,<br>
        ${weddingConfig.couple.person1} & ${weddingConfig.couple.person2}
      </p>`,
    text: (name, siteUrl) =>
      `Hi ${name},\n\nWe noticed you haven't RSVPed yet for our wedding. We'd love to know if you can make it!\n\nPlease visit: ${siteUrl}/rsvp\n\nWith love,\n${weddingConfig.couple.person1} & ${weddingConfig.couple.person2}`,
  },
  es: {
    subject: `Recordatorio RSVP — Boda de ${weddingConfig.couple.person1} & ${weddingConfig.couple.person2}`,
    html: (name, siteUrl) => `
      <h2 style="margin: 0 0 20px; font-size: 22px; font-weight: normal; color: #0B1937;">
        Hola ${escapeHtml(name)},
      </h2>
      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6;">
        Hemos notado que aún no has confirmado tu asistencia a nuestra boda. ¡Nos encantaría saber si puedes venir!
      </p>
      <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6;">
        Por favor, tómate un momento para confirmar visitando nuestra página de boda.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding: 10px 0 30px;">
            <a href="${siteUrl}/rsvp" style="display: inline-block; background-color: #300F0C; color: #E3DFCE; padding: 16px 40px; border-radius: 999px; text-decoration: none; font-size: 16px; font-family: 'Montserrat', Helvetica, sans-serif; letter-spacing: 1px;">
              Confirmar Ahora
            </a>
          </td>
        </tr>
      </table>
      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #666; font-style: italic;">
        ¡Muchas gracias — esperamos verte allí!
      </p>
      <p style="margin: 20px 0 0; font-size: 16px; line-height: 1.6;">
        Con cariño,<br>
        ${weddingConfig.couple.person1} & ${weddingConfig.couple.person2}
      </p>`,
    text: (name, siteUrl) =>
      `Hola ${name},\n\nHemos notado que aún no has confirmado tu asistencia. ¡Nos encantaría saber si puedes venir!\n\nVisita: ${siteUrl}/rsvp\n\nCon cariño,\n${weddingConfig.couple.person1} & ${weddingConfig.couple.person2}`,
  },
  nl: {
    subject: `RSVP Herinnering — Bruiloft van ${weddingConfig.couple.person1} & ${weddingConfig.couple.person2}`,
    html: (name, siteUrl) => `
      <h2 style="margin: 0 0 20px; font-size: 22px; font-weight: normal; color: #0B1937;">
        Hoi ${escapeHtml(name)},
      </h2>
      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6;">
        We hebben gemerkt dat je nog niet hebt gereageerd op onze bruiloft. We horen graag of je erbij kunt zijn!
      </p>
      <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6;">
        Neem even de tijd om te reageren via onze trouwwebsite.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding: 10px 0 30px;">
            <a href="${siteUrl}/rsvp" style="display: inline-block; background-color: #300F0C; color: #E3DFCE; padding: 16px 40px; border-radius: 999px; text-decoration: none; font-size: 16px; font-family: 'Montserrat', Helvetica, sans-serif; letter-spacing: 1px;">
              RSVP Nu
            </a>
          </td>
        </tr>
      </table>
      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #666; font-style: italic;">
        Heel erg bedankt — we hopen je daar te zien!
      </p>
      <p style="margin: 20px 0 0; font-size: 16px; line-height: 1.6;">
        Liefs,<br>
        ${weddingConfig.couple.person1} & ${weddingConfig.couple.person2}
      </p>`,
    text: (name, siteUrl) =>
      `Hoi ${name},\n\nWe hebben gemerkt dat je nog niet hebt gereageerd. We horen graag of je erbij kunt zijn!\n\nBezoek: ${siteUrl}/rsvp\n\nLiefs,\n${weddingConfig.couple.person1} & ${weddingConfig.couple.person2}`,
  },
}

const EVENT_REMINDER_TEMPLATES: Record<EmailLocale, ReminderTemplate> = {
  en: {
    subject: `Event Reminder — ${weddingConfig.couple.person1} & ${weddingConfig.couple.person2}'s Wedding`,
    html: (name, _siteUrl) => `
      <h2 style="margin: 0 0 20px; font-size: 22px; font-weight: normal; color: #0B1937;">
        Hi ${escapeHtml(name)},
      </h2>
      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6;">
        The big day is approaching! We wanted to send you a quick reminder about our upcoming wedding celebrations.
      </p>
      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6;">
        We can't wait to celebrate with you. If you have any questions, don't hesitate to reach out!
      </p>
      <p style="margin: 20px 0 0; font-size: 16px; line-height: 1.6;">
        With love,<br>
        ${weddingConfig.couple.person1} & ${weddingConfig.couple.person2}
      </p>`,
    text: (name) =>
      `Hi ${name},\n\nThe big day is approaching! We wanted to send you a quick reminder about our upcoming wedding celebrations.\n\nWe can't wait to celebrate with you!\n\nWith love,\n${weddingConfig.couple.person1} & ${weddingConfig.couple.person2}`,
  },
  es: {
    subject: `Recordatorio del Evento — Boda de ${weddingConfig.couple.person1} & ${weddingConfig.couple.person2}`,
    html: (name, _siteUrl) => `
      <h2 style="margin: 0 0 20px; font-size: 22px; font-weight: normal; color: #0B1937;">
        Hola ${escapeHtml(name)},
      </h2>
      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6;">
        ¡El gran día se acerca! Queríamos enviarte un recordatorio sobre nuestras celebraciones de boda.
      </p>
      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6;">
        ¡No podemos esperar para celebrar contigo! Si tienes alguna pregunta, no dudes en contactarnos.
      </p>
      <p style="margin: 20px 0 0; font-size: 16px; line-height: 1.6;">
        Con cariño,<br>
        ${weddingConfig.couple.person1} & ${weddingConfig.couple.person2}
      </p>`,
    text: (name) =>
      `Hola ${name},\n\n¡El gran día se acerca! Queríamos enviarte un recordatorio sobre nuestra boda.\n\n¡No podemos esperar para celebrar contigo!\n\nCon cariño,\n${weddingConfig.couple.person1} & ${weddingConfig.couple.person2}`,
  },
  nl: {
    subject: `Herinnering — Bruiloft van ${weddingConfig.couple.person1} & ${weddingConfig.couple.person2}`,
    html: (name, _siteUrl) => `
      <h2 style="margin: 0 0 20px; font-size: 22px; font-weight: normal; color: #0B1937;">
        Hoi ${escapeHtml(name)},
      </h2>
      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6;">
        De grote dag nadert! We wilden je een herinnering sturen over onze aanstaande bruiloft.
      </p>
      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6;">
        We kunnen niet wachten om met je te vieren! Als je vragen hebt, aarzel dan niet om contact met ons op te nemen.
      </p>
      <p style="margin: 20px 0 0; font-size: 16px; line-height: 1.6;">
        Liefs,<br>
        ${weddingConfig.couple.person1} & ${weddingConfig.couple.person2}
      </p>`,
    text: (name) =>
      `Hoi ${name},\n\nDe grote dag nadert! We wilden je een herinnering sturen.\n\nWe kunnen niet wachten om met je te vieren!\n\nLiefs,\n${weddingConfig.couple.person1} & ${weddingConfig.couple.person2}`,
  },
}

function wrapInEmailTemplate(subject: string, bodyHtml: string): string {
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
              ${bodyHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #300F0C; border-top: 1px solid #94B1C8; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #E3DFCE; opacity: 0.8;">
                ${escapeHtml(weddingConfig.couple.person1)} &amp; ${escapeHtml(weddingConfig.couple.person2)} &middot; ${escapeHtml(weddingConfig.contactEmail)}
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

type ReminderType = 'rsvp_reminder' | 'event_reminder' | 'custom'

interface SendReminderBody {
  type: ReminderType
  recipients: Recipient[]
  subject?: string
  htmlBody?: string
  textBody?: string
  locale?: string
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
  let body: SendReminderBody
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return adminJson(400, { ok: false, error: 'Invalid JSON body' })
  }

  const { type, recipients, htmlBody, textBody } = body

  if (!type || !['rsvp_reminder', 'event_reminder', 'custom'].includes(type)) {
    return adminJson(400, {
      ok: false,
      error: 'type must be rsvp_reminder, event_reminder, or custom',
    })
  }

  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    return adminJson(400, { ok: false, error: 'recipients array is required' })
  }

  const locale = normalizeLocale(body.locale)
  const siteUrl =
    process.env.URL || process.env.DEPLOY_PRIME_URL || ''

  // Resolve template or custom content
  let subject: string
  let getHtml: (name: string) => string
  let getText: (name: string) => string

  if (type === 'custom') {
    if (!body.subject || !htmlBody) {
      return adminJson(400, {
        ok: false,
        error: 'subject and htmlBody required for custom type',
      })
    }
    subject = body.subject
    getHtml = () => htmlBody
    getText = () => textBody || ''
  } else {
    const templates =
      type === 'rsvp_reminder'
        ? RSVP_REMINDER_TEMPLATES
        : EVENT_REMINDER_TEMPLATES
    const template = templates[locale]
    subject = template.subject
    getHtml = (name) => template.html(name, siteUrl)
    getText = (name) => template.text(name, siteUrl)
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY
  if (!RESEND_API_KEY) {
    console.error('Missing RESEND_API_KEY env var')
    return adminJson(500, { ok: false, error: 'Server configuration error' })
  }

  const fromEmail =
    process.env.FROM_EMAIL || 'Wedding RSVP <onboarding@resend.dev>'

  const results: Array<{ email: string; success: boolean; error?: string }> = []

  for (const recipient of recipients) {
    if (!recipient.email) {
      results.push({ email: '', success: false, error: 'Missing email address' })
      continue
    }

    const bodyHtml = getHtml(recipient.name || 'Guest')
    const bodyText = getText(recipient.name || 'Guest')
    const wrappedHtml = wrapInEmailTemplate(subject, bodyHtml)

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
          text: bodyText,
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
    message: `Sent ${succeeded} reminders, ${failed} failed`,
    sent: succeeded,
    failed,
    total: recipients.length,
    results,
  })
}
