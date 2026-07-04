import type { Handler, HandlerEvent } from '@netlify/functions'
import { verifyAdminRequest } from './utils/admin-auth'
import { encodeFinalRsvpToken } from './utils/final-rsvp-token'

/**
 * Sends final RSVP invitation emails to all confirmed RSVP guests.
 *
 * This function:
 *  1. Authenticates via admin JWT
 *  2. Fetches all RSVP submissions from the Netlify Forms API
 *  3. Filters for confirmed guests (likelihood = "definitely" or "highly_likely")
 *  4. Sends each guest a personalized email via Resend with a link to /final-rsvp
 *
 * Body options:
 *   - dryRun (boolean): if true, returns the guest list without sending emails
 *   - locale (string):  override locale for all emails (default: "en")
 *   - guests (array):   optional pre-resolved guest list (used by admin panel)
 */

interface RsvpSubmission {
  first_name?: string
  firstName?: string
  email?: string
  likelihood?: string
  guests?: string
  locale?: string
  [key: string]: unknown
}

interface NetlifyForm {
  id: string
  name: string
  [key: string]: unknown
}

interface NetlifyFormSubmission {
  data: RsvpSubmission
  [key: string]: unknown
}

type EmailLocale = 'en' | 'es' | 'nl'

interface EmailStrings {
  subject: string
  greeting: (name: string) => string
  intro: string
  details: string
  callToAction: string
  buttonLabel: string
  partyNote: (count: number, names: string[]) => string
  closing: string
  signOff: string
  footer: string
}

function normalizeLocale(locale?: string): EmailLocale {
  const base = (locale || 'en').toLowerCase().split('-')[0]
  if (base === 'es' || base === 'nl') return base
  return 'en'
}

const weddingConfig = {
  couple: { person1: 'Carolina', person2: 'Thomas' },
  date: { display: 'August 26, 2026' },
  contactEmail: 'carolinaandthomaswedding@gmail.com',
}

const EMAIL_STRINGS: Record<EmailLocale, EmailStrings> = {
  en: {
    subject: 'Final Details — Please Confirm Your Attendance',
    greeting: (name) => `Dear ${name},`,
    intro: `We're so excited for our wedding week in Toulouse and can't wait to celebrate with you! As the big day approaches, we need a few final details to make sure everything is perfect.`,
    details: 'We need to confirm your attendance for each day, your menu choices, and your accommodation details so we can coordinate transportation.',
    callToAction: 'Please take a few minutes to complete your final RSVP — it helps us enormously with planning!',
    buttonLabel: 'Complete Final RSVP',
    partyNote: (count, names) =>
      count > 1
        ? `You RSVP'd for ${count} people${names.length > 0 ? ` (${names.join(', ')})` : ''}. Please confirm attendance and menu choices for everyone in your party.`
        : '',
    closing: "Thank you so much — we can't wait to see you there!",
    signOff: `With love,\n${weddingConfig.couple.person1} & ${weddingConfig.couple.person2}`,
    footer: 'This is an automated message from our wedding website.',
  },
  es: {
    subject: 'Detalles Finales — Por favor confirma tu asistencia',
    greeting: (name) => `Querido/a ${name},`,
    intro: `¡Estamos muy emocionados por nuestra semana de boda en Toulouse y no podemos esperar para celebrar contigo! A medida que se acerca el gran día, necesitamos algunos detalles finales para asegurarnos de que todo sea perfecto.`,
    details: 'Necesitamos confirmar tu asistencia para cada día, tus elecciones de menú y tus detalles de alojamiento para coordinar el transporte.',
    callToAction: '¡Por favor tómate unos minutos para completar tu RSVP final — nos ayuda enormemente con la planificación!',
    buttonLabel: 'Completar RSVP Final',
    partyNote: (count, names) =>
      count > 1
        ? `Confirmaste para ${count} personas${names.length > 0 ? ` (${names.join(', ')})` : ''}. Por favor confirma la asistencia y las elecciones de menú para todos.`
        : '',
    closing: '¡Muchas gracias — no podemos esperar para verte!',
    signOff: `Con cariño,\n${weddingConfig.couple.person1} & ${weddingConfig.couple.person2}`,
    footer: 'Este es un mensaje automático de nuestro sitio web de boda.',
  },
  nl: {
    subject: 'Laatste Details — Bevestig alsjeblieft je aanwezigheid',
    greeting: (name) => `Beste ${name},`,
    intro: `We zijn zo enthousiast over onze trouwweek in Toulouse en kunnen niet wachten om met jou te vieren! Nu de grote dag nadert, hebben we een paar laatste details nodig om alles perfect te maken.`,
    details: 'We moeten je aanwezigheid per dag bevestigen, je menukeuzes en je verblijfsgegevens zodat we het transport kunnen coördineren.',
    callToAction: 'Neem even een paar minuten om je definitieve RSVP in te vullen — het helpt ons enorm met de planning!',
    buttonLabel: 'Definitieve RSVP Invullen',
    partyNote: (count, names) =>
      count > 1
        ? `Je hebt gereserveerd voor ${count} personen${names.length > 0 ? ` (${names.join(', ')})` : ''}. Bevestig alsjeblieft aanwezigheid en menukeuzes voor iedereen.`
        : '',
    closing: 'Heel erg bedankt — we kunnen niet wachten om je te zien!',
    signOff: `Liefs,\n${weddingConfig.couple.person1} & ${weddingConfig.couple.person2}`,
    footer: 'Dit is een automatisch bericht van onze trouwwebsite.',
  },
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function generateInvitationHtml(
  name: string,
  finalRsvpUrl: string,
  locale: EmailLocale,
  partySize: number,
  partyNames: string[],
  trackingPixelUrl?: string
): string {
  const s = EMAIL_STRINGS[locale]
  const safeName = escapeHtml(name)
  const partyNote = s.partyNote(partySize, partyNames)

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(s.subject)}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Georgia, 'Times New Roman', serif; background-color: #F6F1EB; color: #0B1937;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F6F1EB; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border: 1px solid #94B1C8; max-width: 100%;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid #94B1C8;">
              <h1 style="margin: 0; font-size: 28px; font-weight: normal; color: #0B1937; font-family: Georgia, serif;">
                ${weddingConfig.couple.person1} & ${weddingConfig.couple.person2}
              </h1>
              <p style="margin: 10px 0 0; font-size: 14px; color: #648EC0; letter-spacing: 2px; text-transform: uppercase;">
                ${weddingConfig.date.display} &nbsp;·&nbsp; Vallesvilles, France
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; font-size: 22px; font-weight: normal; color: #0B1937;">
                ${s.greeting(safeName)}
              </h2>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #0B1937;">
                ${escapeHtml(s.intro)}
              </p>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #0B1937;">
                ${escapeHtml(s.details)}
              </p>

              ${partyNote ? `<p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #300F0C; font-weight: bold; background-color: #F6F1EB; padding: 12px 16px; border-left: 3px solid #94B1C8;">
                ${escapeHtml(partyNote)}
              </p>` : ''}

              <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #0B1937;">
                ${escapeHtml(s.callToAction)}
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 10px 0 30px;">
                    <a href="${finalRsvpUrl}" style="display: inline-block; background-color: #300F0C; color: #E3DFCE; padding: 16px 40px; border-radius: 999px; text-decoration: none; font-size: 16px; font-family: 'Montserrat', Helvetica, sans-serif; letter-spacing: 1px;">
                      ${escapeHtml(s.buttonLabel)}
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 30px; font-size: 14px; line-height: 1.6; color: #666; font-style: italic;">
                ${escapeHtml(s.closing)}
              </p>

              <p style="margin: 0; font-size: 16px; line-height: 1.8; color: #0B1937; white-space: pre-line;">
                ${escapeHtml(s.signOff)}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #300F0C; border-top: 1px solid #94B1C8; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 12px; color: #E3DFCE; opacity: 0.8;">
                ${escapeHtml(s.footer)}
              </p>
              <p style="margin: 0; font-size: 12px; color: #94B1C8;">
                <a href="mailto:${weddingConfig.contactEmail}" style="color: #94B1C8;">${weddingConfig.contactEmail}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
${trackingPixelUrl ? `<img src="${trackingPixelUrl}" width="1" height="1" alt="" style="display:none" />` : ''}</body>
</html>`
}

function generateInvitationText(
  name: string,
  finalRsvpUrl: string,
  locale: EmailLocale,
  partySize: number,
  partyNames: string[]
): string {
  const s = EMAIL_STRINGS[locale]
  const partyNote = s.partyNote(partySize, partyNames)

  return `${s.greeting(name)}

${s.intro}

${s.details}

${partyNote ? partyNote + '\n\n' : ''}${s.callToAction}

→ ${s.buttonLabel}: ${finalRsvpUrl}

${s.closing}

${s.signOff}

${'─'.repeat(40)}
${s.footer}
${weddingConfig.contactEmail}`.trim()
}

async function fetchRsvpSubmissions(siteId: string, token: string): Promise<RsvpSubmission[]> {
  const formsRes = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/forms`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!formsRes.ok) {
    throw new Error(`Failed to fetch forms: ${formsRes.status}`)
  }
  const forms: NetlifyForm[] = await formsRes.json()
  const rsvpForm = forms.find((f) => f.name === 'rsvp')
  if (!rsvpForm) {
    throw new Error('RSVP form not found. Available: ' + forms.map((f) => f.name).join(', '))
  }

  const allSubmissions: RsvpSubmission[] = []
  let page = 1
  const perPage = 100
  while (true) {
    const subsRes = await fetch(
      `https://api.netlify.com/api/v1/forms/${rsvpForm.id}/submissions?per_page=${perPage}&page=${page}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!subsRes.ok) throw new Error(`Failed to fetch submissions page ${page}: ${subsRes.status}`)
    const subs: NetlifyFormSubmission[] = await subsRes.json()
    if (subs.length === 0) break
    allSubmissions.push(...subs.map((s) => s.data))
    if (subs.length < perPage) break
    page++
  }
  return allSubmissions
}

interface ConfirmedGuest {
  name: string
  email: string
  partySize: number
  partyNames: string[]
  locale?: string
  previewUrl?: string
}

function parseGuestsField(raw?: string): Array<{ name: string }> {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((g: { name?: string }) => g?.name) : []
  } catch {
    return []
  }
}

function getConfirmedGuests(submissions: RsvpSubmission[]): ConfirmedGuest[] {
  const confirmedLikelihoods = new Set(['definitely', 'highly_likely'])
  const seen = new Set<string>()
  const guests: ConfirmedGuest[] = []

  for (const sub of submissions) {
    const email = sub.email?.trim().toLowerCase()
    const name = (sub.firstName || sub.first_name || '').trim()
    const likelihood = sub.likelihood?.trim().toLowerCase()
    if (!email || !name || !likelihood) continue
    if (!confirmedLikelihoods.has(likelihood)) continue
    if (seen.has(email)) continue
    seen.add(email)

    const additionalGuests = parseGuestsField(sub.guests as string | undefined)
    guests.push({
      name,
      email,
      partySize: 1 + additionalGuests.length,
      partyNames: additionalGuests.map((g) => g.name),
      locale: typeof sub.locale === 'string' ? sub.locale : undefined,
    })
  }
  return guests
}

const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  const adminPayload = verifyAdminRequest(event.headers as Record<string, string | undefined>)
  let authenticated = !!adminPayload
  if (!authenticated) {
    const adminKey = process.env.ADMIN_API_KEY
    const providedKey = event.headers['x-admin-key']
    if (adminKey && providedKey && providedKey === adminKey) authenticated = true
  }
  if (!authenticated) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  let dryRun = false
  let localeOverride: string | undefined
  let providedGuests: ConfirmedGuest[] | undefined
  try {
    const body = JSON.parse(event.body || '{}')
    dryRun = body.dryRun === true
    localeOverride = body.locale
    if (Array.isArray(body.guests) && body.guests.length > 0) {
      providedGuests = body.guests.map((g: Record<string, unknown>) => ({
        name: String(g.name || ''),
        email: String(g.email || ''),
        partySize: typeof g.partySize === 'number' ? g.partySize : 1,
        partyNames: Array.isArray(g.partyNames) ? g.partyNames.map(String) : [],
        locale: typeof g.locale === 'string' ? g.locale : undefined,
      }))
    }
  } catch {
    // defaults are fine
  }

  const NETLIFY_API_TOKEN = process.env.NETLIFY_API_TOKEN
  const SITE_ID = process.env.SITE_ID
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  const SITE_URL = process.env.URL || process.env.DEPLOY_PRIME_URL || ''

  if (!providedGuests && (!NETLIFY_API_TOKEN || !SITE_ID)) {
    return { statusCode: 500, body: JSON.stringify({ error: 'NETLIFY_API_TOKEN and SITE_ID must be configured' }) }
  }
  if (!dryRun && !RESEND_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'RESEND_API_KEY not configured' }) }
  }

  let guests: ConfirmedGuest[]
  if (providedGuests) {
    guests = providedGuests
  } else {
    try {
      const submissions = await fetchRsvpSubmissions(SITE_ID!, NETLIFY_API_TOKEN!)
      guests = getConfirmedGuests(submissions)
    } catch (error) {
      console.error('Error fetching RSVP submissions:', error)
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to fetch RSVP submissions', details: String(error) }) }
    }
  }

  if (guests.length === 0) {
    return { statusCode: 200, body: JSON.stringify({ message: 'No confirmed guests found', sent: 0 }) }
  }

  const baseFinalRsvpUrl = `${SITE_URL}/final-rsvp`

  if (dryRun) {
    const sampleLocale = normalizeLocale(guests[0].locale || localeOverride)
    const sampleToken = encodeFinalRsvpToken({ name: guests[0].name, email: guests[0].email, partyNames: guests[0].partyNames })
    const sampleUrl = `${baseFinalRsvpUrl}?t=${sampleToken}&lang=${sampleLocale}`

    const confirmedGuestsWithPreview: ConfirmedGuest[] = guests.map((guest) => {
      const guestLocale = normalizeLocale(guest.locale || localeOverride)
      const guestToken = encodeFinalRsvpToken({ name: guest.name, email: guest.email, partyNames: guest.partyNames })
      return { ...guest, previewUrl: `${baseFinalRsvpUrl}?t=${guestToken}&lang=${guestLocale}` }
    })

    return {
      statusCode: 200,
      body: JSON.stringify({
        dryRun: true,
        locale: localeOverride || 'en',
        finalRsvpUrl: sampleUrl,
        confirmedGuests: confirmedGuestsWithPreview,
        totalCount: guests.length,
        sampleHtml: generateInvitationHtml(guests[0].name, sampleUrl, sampleLocale, guests[0].partySize, guests[0].partyNames),
        sampleText: generateInvitationText(guests[0].name, sampleUrl, sampleLocale, guests[0].partySize, guests[0].partyNames),
      }),
    }
  }

  const fromEmail = process.env.FROM_EMAIL || 'Wedding RSVP <onboarding@resend.dev>'
  const results: { email: string; success: boolean; error?: string }[] = []

  for (const guest of guests) {
    const guestLocale = normalizeLocale(guest.locale || localeOverride)
    const guestToken = encodeFinalRsvpToken({ name: guest.name, email: guest.email, partyNames: guest.partyNames })
    const finalRsvpUrl = `${baseFinalRsvpUrl}?t=${guestToken}&lang=${guestLocale}`
    const pixelUrl = SITE_URL
      ? `${SITE_URL}/.netlify/functions/track-email-open?e=${encodeURIComponent(guest.email)}&c=final_rsvp_invitation`
      : undefined

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: fromEmail,
          to: [guest.email],
          subject: `${EMAIL_STRINGS[guestLocale].subject} — ${weddingConfig.couple.person1} & ${weddingConfig.couple.person2}`,
          html: generateInvitationHtml(guest.name, finalRsvpUrl, guestLocale, guest.partySize, guest.partyNames, pixelUrl),
          text: generateInvitationText(guest.name, finalRsvpUrl, guestLocale, guest.partySize, guest.partyNames),
        }),
      })
      if (!response.ok) {
        const errorData = await response.text()
        console.error(`Failed to send to ${guest.email}:`, errorData)
        results.push({ email: guest.email, success: false, error: errorData })
      } else {
        results.push({ email: guest.email, success: true })
      }
    } catch (error) {
      console.error(`Error sending to ${guest.email}:`, error)
      results.push({ email: guest.email, success: false, error: String(error) })
    }
  }

  const succeeded = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success).length

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Sent ${succeeded} emails, ${failed} failed`,
      sent: succeeded,
      failed,
      total: guests.length,
      results,
    }),
  }
}

export { handler }
