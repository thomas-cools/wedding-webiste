import type { Handler, HandlerEvent } from '@netlify/functions'

/**
 * Sends drink preference invitation emails to all confirmed RSVP guests.
 *
 * This function:
 *  1. Authenticates via ADMIN_API_KEY header
 *  2. Fetches all RSVP submissions from the Netlify Forms API
 *  3. Filters for confirmed guests (likelihood = "definitely" or "highly_likely")
 *  4. Sends each guest a personalized email via Resend with a link to /drinks
 *
 * Trigger manually via:
 *   curl -X POST https://YOUR-SITE/.netlify/functions/send-drink-invitations \
 *     -H "x-admin-key: YOUR_ADMIN_API_KEY" \
 *     -H "Content-Type: application/json" \
 *     -d '{"dryRun": true}'
 *
 * Body options:
 *   - dryRun (boolean): if true, returns the guest list without sending emails
 *   - locale (string):  override locale for all emails (default: "en")
 */

interface RsvpSubmission {
  first_name?: string
  firstName?: string
  email?: string
  likelihood?: string
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
  callToAction: string
  buttonLabel: string
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
  couple: {
    person1: 'Carolina',
    person2: 'Thomas',
  },
  contactEmail: 'carolinaandthomaswedding@gmail.com',
}

const EMAIL_STRINGS: Record<EmailLocale, EmailStrings> = {
  en: {
    subject: 'Help Us Pick the Drinks!',
    greeting: (name) => `Hi ${name}!`,
    intro: "We're finalizing the bar menu for our wedding weekend in Toulouse and we'd love your input!",
    callToAction: 'Please take a quick moment to let us know what you like to drink — it helps us make sure we have plenty of exactly the right stuff for the August heat.',
    buttonLabel: 'Choose Your Drinks',
    closing: "Don't worry, you aren't locked into anything — it just helps us with the math!",
    signOff: `With love,\n${weddingConfig.couple.person1} & ${weddingConfig.couple.person2}`,
    footer: 'This is an automated message from our wedding website.',
  },
  es: {
    subject: '¡Ayúdanos a Elegir las Bebidas!',
    greeting: (name) => `¡Hola ${name}!`,
    intro: 'Estamos finalizando el menú del bar para nuestro fin de semana de boda en Toulouse y ¡nos encantaría tu opinión!',
    callToAction: 'Por favor tómate un momento para contarnos qué te gusta beber — nos ayuda a asegurarnos de tener suficiente de todo lo bueno para el calor de agosto.',
    buttonLabel: 'Elige Tus Bebidas',
    closing: 'No te preocupes, no estás comprometido/a con nada — ¡solo nos ayuda con los cálculos!',
    signOff: `Con cariño,\n${weddingConfig.couple.person1} & ${weddingConfig.couple.person2}`,
    footer: 'Este es un mensaje automático de nuestro sitio web de boda.',
  },
  nl: {
    subject: 'Help Ons de Drankjes Kiezen!',
    greeting: (name) => `Hoi ${name}!`,
    intro: 'We zijn het barmenu aan het afronden voor ons trouwweekend in Toulouse en we horen graag jouw voorkeur!',
    callToAction: 'Neem even een momentje om ons te laten weten wat je graag drinkt — het helpt ons om genoeg van precies de juiste dingen in huis te halen voor de augustushitte.',
    buttonLabel: 'Kies Je Drankjes',
    closing: 'Geen zorgen, je zit nergens aan vast — het helpt ons gewoon met de berekeningen!',
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

function generateInvitationHtml(name: string, drinksUrl: string, locale: EmailLocale): string {
  const s = EMAIL_STRINGS[locale]
  const safeName = escapeHtml(name)

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${s.subject}</title>
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
                🍸 ${escapeHtml(s.subject)}
              </h1>
              <p style="margin: 10px 0 0; font-size: 14px; color: #648EC0; letter-spacing: 2px; text-transform: uppercase;">
                ${weddingConfig.couple.person1} & ${weddingConfig.couple.person2}
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

              <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #0B1937;">
                ${escapeHtml(s.callToAction)}
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 10px 0 30px;">
                    <a href="${drinksUrl}" style="display: inline-block; background-color: #300F0C; color: #E3DFCE; padding: 16px 40px; border-radius: 999px; text-decoration: none; font-size: 16px; font-family: 'Montserrat', Helvetica, sans-serif; letter-spacing: 1px;">
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
              <p style="margin: 0; font-size: 12px; color: #E3DFCE; opacity: 0.8;">
                ${escapeHtml(s.footer)}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

function generateInvitationText(name: string, drinksUrl: string, locale: EmailLocale): string {
  const s = EMAIL_STRINGS[locale]

  return `
${s.greeting(name)}

${s.intro}

${s.callToAction}

→ ${s.buttonLabel}: ${drinksUrl}

${s.closing}

${s.signOff}

${'─'.repeat(40)}
${s.footer}
`.trim()
}

async function fetchRsvpSubmissions(siteId: string, token: string): Promise<RsvpSubmission[]> {
  // 1. Find the RSVP form ID
  const formsRes = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/forms`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!formsRes.ok) {
    throw new Error(`Failed to fetch forms: ${formsRes.status} ${await formsRes.text()}`)
  }

  const forms: NetlifyForm[] = await formsRes.json()
  const rsvpForm = forms.find((f) => f.name === 'rsvp')

  if (!rsvpForm) {
    throw new Error('RSVP form not found. Available forms: ' + forms.map((f) => f.name).join(', '))
  }

  // 2. Fetch all submissions (paginated, max 100 per page)
  const allSubmissions: RsvpSubmission[] = []
  let page = 1
  const perPage = 100

  while (true) {
    const subsRes = await fetch(
      `https://api.netlify.com/api/v1/forms/${rsvpForm.id}/submissions?per_page=${perPage}&page=${page}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    if (!subsRes.ok) {
      throw new Error(`Failed to fetch submissions page ${page}: ${subsRes.status}`)
    }

    const subs: NetlifyFormSubmission[] = await subsRes.json()
    if (subs.length === 0) break

    allSubmissions.push(...subs.map((s) => s.data))
    if (subs.length < perPage) break
    page++
  }

  return allSubmissions
}

function getConfirmedGuests(submissions: RsvpSubmission[]): { name: string; email: string }[] {
  const confirmedLikelihoods = new Set(['definitely', 'highly_likely'])
  const seen = new Set<string>()
  const guests: { name: string; email: string }[] = []

  for (const sub of submissions) {
    const email = sub.email?.trim().toLowerCase()
    const name = (sub.firstName || sub.first_name || '').trim()
    const likelihood = sub.likelihood?.trim().toLowerCase()

    if (!email || !name || !likelihood) continue
    if (!confirmedLikelihoods.has(likelihood)) continue
    if (seen.has(email)) continue

    seen.add(email)
    guests.push({ name, email })
  }

  return guests
}

const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  // Authenticate with admin key
  const adminKey = process.env.ADMIN_API_KEY
  if (!adminKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'ADMIN_API_KEY not configured' }) }
  }

  const providedKey = event.headers['x-admin-key']
  if (!providedKey || providedKey !== adminKey) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  // Parse request body
  let dryRun = false
  let localeOverride: string | undefined
  try {
    const body = JSON.parse(event.body || '{}')
    dryRun = body.dryRun === true
    localeOverride = body.locale
  } catch {
    // defaults are fine
  }

  const locale = normalizeLocale(localeOverride)

  // Required env vars
  const NETLIFY_API_TOKEN = process.env.NETLIFY_API_TOKEN
  const SITE_ID = process.env.SITE_ID
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  const SITE_URL = process.env.URL || process.env.DEPLOY_PRIME_URL || ''

  if (!NETLIFY_API_TOKEN || !SITE_ID) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'NETLIFY_API_TOKEN and SITE_ID must be configured' }),
    }
  }

  if (!dryRun && !RESEND_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'RESEND_API_KEY not configured' }) }
  }

  // Fetch confirmed guests
  let guests: { name: string; email: string }[]
  try {
    const submissions = await fetchRsvpSubmissions(SITE_ID, NETLIFY_API_TOKEN)
    guests = getConfirmedGuests(submissions)
  } catch (error) {
    console.error('Error fetching RSVP submissions:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch RSVP submissions', details: String(error) }),
    }
  }

  if (guests.length === 0) {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'No confirmed guests found', sent: 0 }),
    }
  }

  const drinksUrl = `${SITE_URL}/drinks`

  // Dry run: return guest list without sending
  if (dryRun) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        dryRun: true,
        locale,
        drinksUrl,
        confirmedGuests: guests,
        totalCount: guests.length,
        sampleHtml: generateInvitationHtml(guests[0].name, drinksUrl, locale),
        sampleText: generateInvitationText(guests[0].name, drinksUrl, locale),
      }),
    }
  }

  // Send emails
  const fromEmail = process.env.FROM_EMAIL || 'Wedding RSVP <onboarding@resend.dev>'
  const results: { email: string; success: boolean; error?: string }[] = []

  for (const guest of guests) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [guest.email],
          subject: `${EMAIL_STRINGS[locale].subject} — ${weddingConfig.couple.person1} & ${weddingConfig.couple.person2}`,
          html: generateInvitationHtml(guest.name, drinksUrl, locale),
          text: generateInvitationText(guest.name, drinksUrl, locale),
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
