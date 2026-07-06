import type { Handler, HandlerEvent } from '@netlify/functions'
import { consumeRateLimit, getClientIp, rateLimitHeaders, rateLimitKey } from './utils/rate-limiter'

interface FinalRsvpEvents {
  welcome: string
  ceremony: string
  brunch: string
}

interface FinalRsvpGuest {
  name: string
  events: FinalRsvpEvents
  isChild: boolean
  appetizer?: string
  main?: string
  allergies?: string
}

interface FinalRsvpData {
  firstName: string
  email: string
  guests: FinalRsvpGuest[]
  accommodationType: string
  accommodationAddress?: string
  hotelName?: string
  transportationPreference?: string
  songRequest?: string
  photographyConsent?: boolean
  additionalNotes?: string
  locale?: string
}

type EmailLocale = 'en' | 'es' | 'nl'

type EmailStrings = {
  subjectPrefix: string
  title: string
  thanks: (firstName: string) => string
  intro: string
  yourResponse: string
  events: string
  welcomeDinner: string
  ceremony: string
  brunch: string
  accommodation: string
  accommodationChateau: string
  accommodationAirbnb: string
  accommodationHotel: string
  accommodationAddress: string
  hotelName: string
  transportationLabel: string
  transportationTaxi: string
  transportationOwn: string
  menuChoices: string
  yourParty: string
  childrensMeal: string
  appetizer: string
  mainCourse: string
  allergiesLabel: string
  songRequest: string
  photographyConsent: string
  yes: string
  no: string
  notSpecified: string
  additionalNotes: string
  updateNote: string
  questions: string
  withLove: string
  eventAnswer: Record<string, string>
  appetizerValue: Record<string, string>
  mainCourseValue: Record<string, string>
}

function normalizeLocale(locale?: string): EmailLocale {
  const base = (locale || 'en').toLowerCase().split('-')[0]
  if (base === 'es' || base === 'nl') return base
  return 'en'
}

const EMAIL_STRINGS: Record<EmailLocale, EmailStrings> = {
  en: {
    subjectPrefix: 'Final RSVP Confirmation',
    title: 'Final RSVP Confirmation',
    thanks: (firstName) => `Thank you for your final RSVP, ${firstName}!`,
    intro: "We've received your final details. Here's a summary for your records.",
    yourResponse: 'Your Response',
    events: 'Attendance',
    welcomeDinner: 'Welcome Dinner (Tue, Aug 25)',
    ceremony: 'Ceremony & Reception (Wed, Aug 26)',
    brunch: 'Farewell Brunch (Thu, Aug 27)',
    accommodation: 'Accommodation',
    accommodationChateau: 'Staying at the venue (Chateau)',
    accommodationAirbnb: 'Staying at an Airbnb',
    accommodationHotel: 'Staying at a hotel',
    accommodationAddress: 'Accommodation Address',
    hotelName: 'Hotel Name',
    transportationLabel: 'Transportation',
    transportationTaxi: 'Interested in taxi transportation to/from the venue',
    transportationOwn: 'Arranging own transportation',
    menuChoices: 'Menu Choices',
    yourParty: 'Your Party',
    childrensMeal: "Children's Meal",
    appetizer: 'Appetizer',
    mainCourse: 'Main Course',
    allergiesLabel: 'Allergies & Precautions',
    songRequest: 'Song Request',
    photographyConsent: 'Photography / Video Consent',
    yes: 'Yes',
    no: 'No',
    notSpecified: 'Not specified',
    additionalNotes: 'Additional Notes',
    updateNote: 'Need to make a change? Visit our website and submit the form again with the same email address.',
    questions: 'Questions? Contact us at',
    withLove: 'With love',
    eventAnswer: {
      yes: '✓ Attending',
      no: '✗ Not attending',
      arriving_late: '⏰ Arriving late',
      '': '— Not specified',
    },
    appetizerValue: {
      ceviche: 'Ceviche de Bar français, citron vert et piment d\'Espelette',
      gaspacho: 'Gaspacho fumé aux tomates jaunes et éclats de légumes rouges',
      '': 'Not specified',
    },
    mainCourseValue: {
      bar: 'Filet de Bar grillé, tartelette de légumes méditerranéens, purée de petits pois et olives noires',
      tournedos: 'Tournedos de filet de boeuf français, purée d\'échalotes confites au vin rouge, compression de pommes de terre, jus aux morilles et vin doux',
      vegan: 'Seasonal vegetable tartlet, root vegetable purée & red wine jus',
      '': 'Not specified',
    },
  },
  es: {
    subjectPrefix: 'Confirmación Final de RSVP',
    title: 'Confirmación Final de RSVP',
    thanks: (firstName) => `¡Gracias por tu RSVP final, ${firstName}!`,
    intro: 'Hemos recibido tus detalles finales. Aquí tienes un resumen para tus registros.',
    yourResponse: 'Tu Respuesta',
    events: 'Asistencia',
    welcomeDinner: 'Cena de bienvenida (mar, 25 ago)',
    ceremony: 'Ceremonia y recepción (mié, 26 ago)',
    brunch: 'Brunch de despedida (jue, 27 ago)',
    accommodation: 'Alojamiento',
    accommodationChateau: 'Se hospeda en el lugar (Chateau)',
    accommodationAirbnb: 'Se hospeda en un Airbnb',
    accommodationHotel: 'Se hospeda en un hotel',
    accommodationAddress: 'Dirección de alojamiento',
    hotelName: 'Nombre del hotel',
    transportationLabel: 'Transporte',
    transportationTaxi: 'Interesado/a en transporte en taxi hacia y desde el lugar',
    transportationOwn: 'Organizará su propio transporte',
    menuChoices: 'Elecciones de menú',
    yourParty: 'Tu grupo',
    childrensMeal: 'Menú infantil',
    appetizer: 'Entrante',
    mainCourse: 'Plato principal',
    allergiesLabel: 'Alergias y Precauciones',
    songRequest: 'Canción solicitada',
    photographyConsent: 'Consentimiento de fotografía / video',
    yes: 'Sí',
    no: 'No',
    notSpecified: 'No especificado',
    additionalNotes: 'Notas adicionales',
    updateNote: '¿Necesitas hacer un cambio? Visita nuestro sitio web y envía el formulario nuevamente con el mismo correo.',
    questions: '¿Preguntas? Contáctanos en',
    withLove: 'Con cariño',
    eventAnswer: {
      yes: '✓ Asistiré',
      no: '✗ No asistiré',
      arriving_late: '⏰ Llegaré tarde',
      '': '— No especificado',
    },
    appetizerValue: {
      ceviche: 'Ceviche de Bar français, citron vert et piment d\'Espelette',
      gaspacho: 'Gaspacho fumé aux tomates jaunes et éclats de légumes rouges',
      '': 'No especificado',
    },
    mainCourseValue: {
      bar: 'Filet de Bar grillé, tartelette de légumes méditerranéens, purée de petits pois et olives noires',
      tournedos: 'Tournedos de filet de boeuf français, purée d\'échalotes confites au vin rouge, compression de pommes de terre, jus aux morilles et vin doux',
      vegan: 'Tartaleta de verduras de temporada, puré de raíces y jus de vino tinto',
      '': 'No especificado',
    },
  },
  nl: {
    subjectPrefix: 'Definitieve RSVP-bevestiging',
    title: 'Definitieve RSVP-bevestiging',
    thanks: (firstName) => `Bedankt voor je definitieve RSVP, ${firstName}!`,
    intro: 'We hebben je definitieve gegevens ontvangen. Hier is een samenvatting voor je eigen administratie.',
    yourResponse: 'Jouw Antwoord',
    events: 'Aanwezigheid',
    welcomeDinner: 'Welkomstdiner (di, 25 aug)',
    ceremony: 'Ceremonie & receptie (wo, 26 aug)',
    brunch: 'Afscheidsbrunch (do, 27 aug)',
    accommodation: 'Accommodatie',
    accommodationChateau: 'Verblijft op de locatie (Chateau)',
    accommodationAirbnb: 'Verblijft in een Airbnb',
    accommodationHotel: 'Verblijft in een hotel',
    accommodationAddress: 'Accommodatieadres',
    hotelName: 'Hotelnaam',
    transportationLabel: 'Vervoer',
    transportationTaxi: 'Geïnteresseerd in taxivervoer van en naar de locatie',
    transportationOwn: 'Regelt eigen vervoer',
    menuChoices: 'Menukeuzes',
    yourParty: 'Jouw Gezelschap',
    childrensMeal: 'Kindermenu',
    appetizer: 'Voorgerecht',
    mainCourse: 'Hoofdgerecht',
    allergiesLabel: 'Allergieën & Voorzorgsmaatregelen',
    songRequest: 'Muziekverzoek',
    photographyConsent: 'Toestemming foto / video',
    yes: 'Ja',
    no: 'Nee',
    notSpecified: 'Niet opgegeven',
    additionalNotes: 'Extra opmerkingen',
    updateNote: 'Iets aanpassen? Bezoek onze website en verstuur het formulier opnieuw met hetzelfde e-mailadres.',
    questions: 'Vragen? Contacteer ons via',
    withLove: 'Met liefde',
    eventAnswer: {
      yes: '✓ Aanwezig',
      no: '✗ Niet aanwezig',
      arriving_late: '⏰ Later',
      '': '— Niet opgegeven',
    },
    appetizerValue: {
      ceviche: 'Ceviche de Bar français, citron vert et piment d\'Espelette',
      gaspacho: 'Gaspacho fumé aux tomates jaunes et éclats de légumes rouges',
      '': 'Niet opgegeven',
    },
    mainCourseValue: {
      bar: 'Filet de Bar grillé, tartelette de légumes méditerranéens, purée de petits pois et olives noires',
      tournedos: 'Tournedos de filet de boeuf français, purée d\'échalotes confites au vin rouge, compression de pommes de terre, jus aux morilles et vin doux',
      vegan: 'Groentetaartje van het seizoen, wortelpuree en rodewijnjus',
      '': 'Niet opgegeven',
    },
  },
}

const weddingConfig = {
  couple: { person1: 'Carolina', person2: 'Thomas' },
  date: { display: 'August 26, 2026' },
  venue: { name: 'Vallesvilles', location: 'Haute-Garonne, France' },
  contactEmail: 'carolinaandthomaswedding@gmail.com',
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function generateEmailHtml(data: FinalRsvpData): string {
  const s = EMAIL_STRINGS[normalizeLocale(data.locale)]
  const { firstName, guests, accommodationType, accommodationAddress, hotelName, transportationPreference, songRequest, photographyConsent, additionalNotes } = data

  const renderEventRow = (label: string, answer: string) =>
    `<tr>
      <td style="color: #666; padding: 6px 0;">${label}</td>
      <td style="text-align: right; padding: 6px 0;">${escapeHtml(s.eventAnswer[answer] || answer || s.eventAnswer[''])}</td>
    </tr>`

  const guestEventRows = guests.map((g) => `<tr>
      <td colspan="2" style="padding: 10px 0 4px; border-top: 1px solid #E3DFCE;">
        <strong>${escapeHtml(g.name)}</strong>
      </td>
    </tr>
    ${renderEventRow(s.welcomeDinner, g.events?.welcome || '')}
    ${renderEventRow(s.ceremony, g.events?.ceremony || '')}
    ${renderEventRow(s.brunch, g.events?.brunch || '')}`).join('')

  const guestMenuRows = guests.map((g) => {
    if (g.isChild) {
      return `<tr>
        <td colspan="2" style="padding: 10px 0; border-top: 1px solid #E3DFCE;">
          <strong>${escapeHtml(g.name)}</strong> &nbsp;
          <span style="background: #E3DFCE; border-radius: 4px; padding: 2px 8px; font-size: 12px;">${s.childrensMeal}</span>
          ${g.allergies ? `<br><span style="font-size: 13px; color: #666;">${s.allergiesLabel}: </span><span style="font-size: 13px;">${escapeHtml(g.allergies)}</span>` : ''}
        </td>
      </tr>`
    }
    return `<tr>
      <td colspan="2" style="padding: 10px 0; border-top: 1px solid #E3DFCE;">
        <strong>${escapeHtml(g.name)}</strong><br>
        <span style="font-size: 13px; color: #666;">${s.appetizer}: </span>
        <span style="font-size: 13px;">${escapeHtml(s.appetizerValue[g.appetizer || ''] || s.notSpecified)}</span><br>
        <span style="font-size: 13px; color: #666;">${s.mainCourse}: </span>
        <span style="font-size: 13px;">${escapeHtml(s.mainCourseValue[g.main || ''] || s.notSpecified)}</span>
        ${g.allergies ? `<br><span style="font-size: 13px; color: #666;">${s.allergiesLabel}: </span><span style="font-size: 13px;">${escapeHtml(g.allergies)}</span>` : ''}
      </td>
    </tr>`
  }).join('')

  return `<!DOCTYPE html>
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
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid #94B1C8;">
              <h1 style="margin: 0; font-size: 28px; font-weight: normal; color: #0B1937;">${weddingConfig.couple.person1} & ${weddingConfig.couple.person2}</h1>
              <p style="margin: 10px 0 0; font-size: 14px; color: #648EC0; letter-spacing: 2px; text-transform: uppercase;">${weddingConfig.date.display}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; font-size: 22px; font-weight: normal;">${s.thanks(escapeHtml(firstName))}</h2>
              <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6;">${s.intro}</p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F6F1EB; border: 1px solid #E3DFCE; margin-bottom: 24px;">
                <tr><td style="padding: 20px;">
                  <h3 style="margin: 0 0 12px; font-size: 14px; color: #648EC0; text-transform: uppercase; letter-spacing: 1px;">${s.events}</h3>
                  <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px;">
                    ${guestEventRows}
                  </table>
                </td></tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F6F1EB; border: 1px solid #E3DFCE; margin-bottom: 24px;">
                <tr><td style="padding: 20px;">
                  <h3 style="margin: 0 0 12px; font-size: 14px; color: #648EC0; text-transform: uppercase; letter-spacing: 1px;">${s.accommodation}</h3>
                  <p style="margin: 0 0 8px; font-size: 14px;">${
                    accommodationType === 'chateau' ? s.accommodationChateau
                    : accommodationType === 'airbnb' ? s.accommodationAirbnb
                    : accommodationType === 'hotel' ? s.accommodationHotel
                    : s.notSpecified
                  }</p>
                  ${accommodationType === 'airbnb' && accommodationAddress ? `<p style="margin: 0; font-size: 14px; color: #666;">${s.accommodationAddress}: ${escapeHtml(accommodationAddress)}</p>` : ''}
                  ${accommodationType === 'hotel' && hotelName ? `<p style="margin: 0; font-size: 14px; color: #666;">${s.hotelName}: ${escapeHtml(hotelName)}</p>` : ''}
                  ${accommodationType !== 'chateau' && accommodationType ? `<p style="margin: 8px 0 0; font-size: 14px; color: #666;">${s.transportationLabel}: ${transportationPreference === 'taxi' ? s.transportationTaxi : transportationPreference === 'own' ? s.transportationOwn : s.notSpecified}</p>` : ''}
                </td></tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F6F1EB; border: 1px solid #E3DFCE; margin-bottom: 24px;">
                <tr><td style="padding: 20px;">
                  <h3 style="margin: 0 0 4px; font-size: 14px; color: #648EC0; text-transform: uppercase; letter-spacing: 1px;">${s.menuChoices}</h3>
                  <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px;">
                    ${guestMenuRows}
                  </table>
                </td></tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F6F1EB; border: 1px solid #E3DFCE; margin-bottom: 24px;">
                <tr><td style="padding: 20px; font-size: 14px;">
                  ${songRequest ? `<p style="margin: 0 0 8px;"><strong style="color: #648EC0;">${s.songRequest}:</strong> ${escapeHtml(songRequest)}</p>` : ''}
                  <p style="margin: 0;"><strong style="color: #648EC0;">${s.photographyConsent}:</strong> ${photographyConsent === true ? s.yes : photographyConsent === false ? s.no : s.notSpecified}</p>
                  ${additionalNotes ? `<p style="margin: 8px 0 0;"><strong style="color: #648EC0;">${s.additionalNotes}:</strong><br>${escapeHtml(additionalNotes)}</p>` : ''}
                </td></tr>
              </table>

              <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #888; text-align: center;">${s.updateNote}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px; background-color: #300F0C; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #E3DFCE;">${s.questions}<br>
                <a href="mailto:${weddingConfig.contactEmail}" style="color: #94B1C8;">${weddingConfig.contactEmail}</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #E3DFCE; opacity: 0.8;">${s.withLove}, ${weddingConfig.couple.person1} & ${weddingConfig.couple.person2} 💕</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function generatePlainText(data: FinalRsvpData): string {
  const s = EMAIL_STRINGS[normalizeLocale(data.locale)]
  const { firstName, guests, accommodationType, accommodationAddress, hotelName, transportationPreference, songRequest, photographyConsent, additionalNotes } = data

  let text = `${weddingConfig.couple.person1} & ${weddingConfig.couple.person2}\n${weddingConfig.date.display}\n\n`
  text += `${s.thanks(firstName)}\n\n${s.intro}\n\n`
  text += `${s.events.toUpperCase()}\n─────────\n`
  for (const g of guests) {
    text += `${g.name}:\n`
    text += `  • ${s.welcomeDinner}: ${s.eventAnswer[g.events?.welcome || ''] || s.notSpecified}\n`
    text += `  • ${s.ceremony}: ${s.eventAnswer[g.events?.ceremony || ''] || s.notSpecified}\n`
    text += `  • ${s.brunch}: ${s.eventAnswer[g.events?.brunch || ''] || s.notSpecified}\n`
  }
  text += `\n${s.accommodation.toUpperCase()}\n─────────────\n`
  text += `${
    accommodationType === 'chateau' ? s.accommodationChateau
    : accommodationType === 'airbnb' ? s.accommodationAirbnb
    : accommodationType === 'hotel' ? s.accommodationHotel
    : s.notSpecified
  }\n`
  if (accommodationType === 'airbnb' && accommodationAddress) text += `${s.accommodationAddress}: ${accommodationAddress}\n`
  if (accommodationType === 'hotel' && hotelName) text += `${s.hotelName}: ${hotelName}\n`
  if (accommodationType && accommodationType !== 'chateau') {
    text += `${s.transportationLabel}: ${transportationPreference === 'taxi' ? s.transportationTaxi : transportationPreference === 'own' ? s.transportationOwn : s.notSpecified}\n`
  }
  text += `\n${s.menuChoices.toUpperCase()}\n─────────────\n`
  for (const g of guests) {
    if (g.isChild) {
      text += `• ${g.name}: ${s.childrensMeal}\n`
    } else {
      text += `• ${g.name}:\n`
      text += `  ${s.appetizer}: ${s.appetizerValue[g.appetizer || ''] || s.notSpecified}\n`
      text += `  ${s.mainCourse}: ${s.mainCourseValue[g.main || ''] || s.notSpecified}\n`
    }
    if (g.allergies) text += `  ${s.allergiesLabel}: ${g.allergies}\n`
  }
  if (songRequest) text += `\n${s.songRequest}: ${songRequest}`
  text += `\n${s.photographyConsent}: ${photographyConsent === true ? s.yes : photographyConsent === false ? s.no : s.notSpecified}`
  if (additionalNotes) text += `\n\n${s.additionalNotes}:\n${additionalNotes}`
  text += `\n\n${'─'.repeat(40)}\n${s.updateNote}\n\n${s.questions} ${weddingConfig.contactEmail}\n${s.withLove}, ${weddingConfig.couple.person1} & ${weddingConfig.couple.person2}`
  return text
}

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  const ip = getClientIp(event.headers || {})
  const limit = Number.parseInt(process.env.RATE_LIMIT_FINAL_RSVP_MAX || '5', 10)
  const windowSeconds = Number.parseInt(process.env.RATE_LIMIT_FINAL_RSVP_WINDOW_SECONDS || '900', 10)
  const rl = consumeRateLimit(rateLimitKey('send-final-rsvp-confirmation', ip), {
    max: Number.isFinite(limit) && limit > 0 ? limit : 5,
    windowMs: (Number.isFinite(windowSeconds) && windowSeconds > 0 ? windowSeconds : 900) * 1000,
  })
  if (!rl.allowed) {
    return {
      statusCode: 429,
      headers: { 'Content-Type': 'application/json', ...rateLimitHeaders(rl) },
      body: JSON.stringify({ error: 'Rate limit exceeded. Please try again shortly.' }),
    }
  }

  let data: FinalRsvpData
  try {
    data = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) }
  }

  if (!data.email || !data.firstName) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields: email and firstName' }) }
  }

  const isPreview = event.queryStringParameters?.preview === '1'
  const isNetlifyDev = process.env.NETLIFY_DEV === 'true'
  if (isPreview && isNetlifyDev) {
    const s = EMAIL_STRINGS[normalizeLocale(data.locale)]
    return {
      statusCode: 200,
      body: JSON.stringify({
        preview: true,
        subject: `${s.subjectPrefix} - ${weddingConfig.couple.person1} & ${weddingConfig.couple.person2}`,
        html: generateEmailHtml(data),
        text: generatePlainText(data),
      }),
    }
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY environment variable is not set')
    return { statusCode: 500, body: JSON.stringify({ error: 'Email service not configured' }) }
  }

  try {
    const s = EMAIL_STRINGS[normalizeLocale(data.locale)]
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL || 'Wedding RSVP <onboarding@resend.dev>',
        to: [data.email],
        subject: `${s.subjectPrefix} - ${weddingConfig.couple.person1} & ${weddingConfig.couple.person2}`,
        html: generateEmailHtml(data),
        text: generatePlainText(data),
      }),
    })
    if (!response.ok) {
      const errorData = await response.json()
      console.error('Resend API error:', errorData)
      return { statusCode: response.status, body: JSON.stringify({ error: 'Failed to send email', details: errorData }) }
    }
    return { statusCode: 200, body: JSON.stringify({ ok: true }) }
  } catch (error) {
    console.error('Error sending final RSVP confirmation email:', error)
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) }
  }
}
