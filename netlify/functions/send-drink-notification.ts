import type { Handler, HandlerEvent } from '@netlify/functions'
import { consumeRateLimit, getClientIp, rateLimitHeaders, rateLimitKey } from './utils/rate-limiter'

interface DrinkPreferencesData {
  firstName: string
  guestName?: string
  email: string
  wine?: string[]
  beer?: string[]
  cocktail?: string[]
  favoriteCocktail?: string
  nonAlcoholic?: string[]
  comments?: string
  locale?: string
}

type EmailLocale = 'en' | 'es' | 'nl'

type EmailStrings = {
  subjectPrefix: string
  title: string
  newSubmission: (firstName: string) => string
  intro: string
  guestDetails: string
  name: string
  email: string
  drinkPreferences: string
  cocktail: string
  favoriteCocktail: string
  wine: string
  beer: string
  nonAlcoholic: string
  comments: string
  notSpecified: string
  footer: string
}

function normalizeLocale(locale?: string): EmailLocale {
  const base = (locale || 'en').toLowerCase().split('-')[0]
  if (base === 'es' || base === 'nl') return base
  return 'en'
}

const EMAIL_STRINGS: Record<EmailLocale, EmailStrings> = {
  en: {
    subjectPrefix: 'New Drink Preferences',
    title: 'New Drink Preferences Submitted',
    newSubmission: (firstName) => `${firstName} has submitted their drink preferences!`,
    intro: "A guest has shared their drink preferences for the wedding celebration.",
    guestDetails: 'Guest Details',
    name: 'Name',
    email: 'Email',
    drinkPreferences: 'Drink Preferences',
    cocktail: 'Cocktail',
    favoriteCocktail: 'Favorite Cocktail',
    wine: 'Wine',
    beer: 'Beer',
    nonAlcoholic: 'Non-Alcoholic',
    comments: 'Additional Comments',
    notSpecified: 'Not specified',
    footer: 'This is an automated notification from your wedding website.',
  },
  es: {
    subjectPrefix: 'Nuevas Preferencias de Bebidas',
    title: 'Nuevas Preferencias de Bebidas Enviadas',
    newSubmission: (firstName) => `¡${firstName} ha enviado sus preferencias de bebidas!`,
    intro: 'Un invitado ha compartido sus preferencias de bebidas para la celebración de la boda.',
    guestDetails: 'Detalles del Invitado',
    name: 'Nombre',
    email: 'Correo',
    drinkPreferences: 'Preferencias de Bebidas',
    cocktail: 'Cóctel',
    favoriteCocktail: 'Cóctel Favorito',
    wine: 'Vino',
    beer: 'Cerveza',
    nonAlcoholic: 'Sin Alcohol',
    comments: 'Comentarios Adicionales',
    notSpecified: 'No especificado',
    footer: 'Esta es una notificación automática de su sitio web de boda.',
  },
  nl: {
    subjectPrefix: 'Nieuwe Drankvoorkeuren',
    title: 'Nieuwe Drankvoorkeuren Ingediend',
    newSubmission: (firstName) => `${firstName} heeft drankvoorkeuren ingediend!`,
    intro: 'Een gast heeft drankvoorkeuren gedeeld voor de huwelijksviering.',
    guestDetails: 'Gastgegevens',
    name: 'Naam',
    email: 'E-mail',
    drinkPreferences: 'Drankvoorkeuren',
    cocktail: 'Cocktail',
    favoriteCocktail: 'Favoriete Cocktail',
    wine: 'Wijn',
    beer: 'Bier',
    nonAlcoholic: 'Alcoholvrij',
    comments: 'Aanvullende Opmerkingen',
    notSpecified: 'Niet opgegeven',
    footer: 'Dit is een automatische melding van uw trouwwebsite.',
  },
}

function stringsForLocale(locale?: string): EmailStrings {
  return EMAIL_STRINGS[normalizeLocale(locale)]
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const weddingConfig = {
  couple: {
    person1: 'Carolina',
    person2: 'Thomas',
  },
  contactEmail: 'carolinaandthomaswedding@gmail.com',
}

function generateEmailHtml(data: DrinkPreferencesData): string {
  const s = stringsForLocale(data.locale)
  const safeFirstName = escapeHtml(data.firstName)
  const safeEmail = escapeHtml(data.email)

  const drinkRow = (label: string, values?: string[]) => {
    const display = values && values.length > 0 ? values.map(v => escapeHtml(v)).join(', ') : `<em>${s.notSpecified}</em>`
    return `
      <tr>
        <td style="padding: 8px; color: #666; width: 140px;">${label}</td>
        <td style="padding: 8px; text-align: right;">${display}</td>
      </tr>`
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${s.title}</title>
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
                🍸 ${s.title}
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
                ${s.newSubmission(safeFirstName)}
              </h2>

              <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #0B1937;">
                ${s.intro}
              </p>

              <!-- Guest Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F6F1EB; border: 1px solid #E3DFCE; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 25px;">
                    <h3 style="margin: 0 0 15px; font-size: 14px; color: #648EC0; text-transform: uppercase; letter-spacing: 1px;">
                      ${s.guestDetails}
                    </h3>
                    <table width="100%" cellpadding="8" cellspacing="0" style="font-size: 14px;">
                      <tr>
                        <td style="color: #666;">${s.name}</td>
                        <td style="text-align: right;">${safeFirstName}</td>
                      </tr>${data.guestName && data.guestName !== data.firstName ? `
                      <tr>
                        <td style="color: #666;">Guest</td>
                        <td style="text-align: right;">${escapeHtml(data.guestName)}</td>
                      </tr>` : ''}
                      <tr>
                        <td style="color: #666;">${s.email}</td>
                        <td style="text-align: right;">${safeEmail}</td>
                      </tr>
                    </table>

                    <hr style="border: none; border-top: 1px solid #E3DFCE; margin: 20px 0;">

                    <h3 style="margin: 0 0 15px; font-size: 14px; color: #648EC0; text-transform: uppercase; letter-spacing: 1px;">
                      ${s.drinkPreferences}
                    </h3>
                    <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px;">
                      ${drinkRow('� ' + s.wine, data.wine)}
                      ${drinkRow('🍺 ' + s.beer, data.beer)}
                      ${drinkRow('🍸 ' + s.cocktail, data.cocktail)}
                      ${data.favoriteCocktail?.trim() ? `
      <tr>
        <td style="padding: 8px; color: #666; width: 140px;">⭐ ${s.favoriteCocktail}</td>
        <td style="padding: 8px; text-align: right;">${escapeHtml(data.favoriteCocktail.trim())}</td>
      </tr>` : ''}
                      ${drinkRow('🥤 ' + s.nonAlcoholic, data.nonAlcoholic)}
                    </table>

                    ${data.comments?.trim() ? `
                    <hr style="border: none; border-top: 1px solid #E3DFCE; margin: 20px 0;">
                    <p style="margin: 0; font-size: 14px;">
                      <strong style="color: #648EC0;">${s.comments}:</strong><br>
                      ${escapeHtml(data.comments.trim())}
                    </p>
                    ` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #300F0C; border-top: 1px solid #94B1C8; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #E3DFCE; opacity: 0.8;">
                ${s.footer}
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

function generatePlainText(data: DrinkPreferencesData): string {
  const s = stringsForLocale(data.locale)

  const line = (label: string, values?: string[]) =>
    `${label}: ${values && values.length > 0 ? values.join(', ') : s.notSpecified}`

  let text = `
${s.title}
${'─'.repeat(40)}

${s.newSubmission(data.firstName)}

${s.intro}

${s.guestDetails.toUpperCase()}
──────────────
${s.name}: ${data.firstName}${data.guestName && data.guestName !== data.firstName ? `\nGuest: ${data.guestName}` : ''}
${s.email}: ${data.email}

${s.drinkPreferences.toUpperCase()}
──────────────────
${line('🍷 ' + s.wine, data.wine)}
${line('🍺 ' + s.beer, data.beer)}
${line('🍸 ' + s.cocktail, data.cocktail)}
${data.favoriteCocktail?.trim() ? `⭐ ${s.favoriteCocktail}: ${data.favoriteCocktail.trim()}` : ''}
${line('🥤 ' + s.nonAlcoholic, data.nonAlcoholic)}
`

  if (data.comments?.trim()) {
    text += `\n${s.comments}:\n${data.comments.trim()}\n`
  }

  text += `\n${'─'.repeat(40)}\n${s.footer}\n`

  return text
}

const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  // Rate limiting
  const ip = getClientIp(event.headers || {})
  const limit = Number.parseInt(process.env.RATE_LIMIT_DRINK_NOTIFICATION_MAX || '5', 10)
  const windowSeconds = Number.parseInt(process.env.RATE_LIMIT_DRINK_NOTIFICATION_WINDOW_SECONDS || '900', 10)
  const rl = consumeRateLimit(rateLimitKey('send-drink-notification', ip), {
    max: Number.isFinite(limit) && limit > 0 ? limit : 5,
    windowMs: (Number.isFinite(windowSeconds) && windowSeconds > 0 ? windowSeconds : 900) * 1000,
  })

  if (!rl.allowed) {
    return {
      statusCode: 429,
      headers: {
        'Content-Type': 'application/json',
        ...rateLimitHeaders(rl),
      },
      body: JSON.stringify({ error: 'Rate limit exceeded. Please try again shortly.' }),
    }
  }

  let data: DrinkPreferencesData
  try {
    data = JSON.parse(event.body || '{}')
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON body' }),
    }
  }

  if (!data.email || !data.firstName) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required fields: email and firstName' }),
    }
  }

  // Dev preview mode
  const isPreview = event.queryStringParameters?.preview === '1'
  const isNetlifyDev = process.env.NETLIFY_DEV === 'true'
  if (isPreview && isNetlifyDev) {
    const s = stringsForLocale(data.locale)
    return {
      statusCode: 200,
      body: JSON.stringify({
        preview: true,
        localeRequested: data.locale || null,
        localeNormalized: normalizeLocale(data.locale),
        subject: `${s.subjectPrefix} - ${data.firstName}`,
        html: generateEmailHtml(data),
        text: generatePlainText(data),
      }),
    }
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY environment variable is not set')
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Email service not configured' }),
    }
  }

  // Send notification email to the couple (not the guest)
  const notificationRecipient = process.env.DRINK_NOTIFICATION_EMAIL || weddingConfig.contactEmail

  try {
    const s = stringsForLocale(data.locale)
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL || 'Wedding RSVP <onboarding@resend.dev>',
        to: [notificationRecipient],
        subject: `${s.subjectPrefix} - ${data.firstName}`,
        html: generateEmailHtml(data),
        text: generatePlainText(data),
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Resend API error:', errorData)
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: 'Failed to send email', details: errorData }),
      }
    }

    const result = await response.json()
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, messageId: result.id }),
    }
  } catch (error) {
    console.error('Error sending drink notification email:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send email' }),
    }
  }
}

export { handler }
