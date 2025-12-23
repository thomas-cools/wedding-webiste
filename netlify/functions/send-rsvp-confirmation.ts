import type { Handler, HandlerEvent } from '@netlify/functions'
import { consumeRateLimit, getClientIp, rateLimitHeaders, rateLimitKey } from './utils/rate-limiter'

interface Guest {
  name: string
  dietary?: string
}

interface Events {
  welcome: string
  ceremony: string
  brunch: string
}

interface RsvpData {
  firstName: string
  email: string
  mailingAddress?: string
  likelihood: string
  events?: Events
  accommodation?: string
  travelPlan?: string
  guests: Guest[]
  dietary?: string
  songRequest?: string
  franceTips?: boolean
  additionalNotes?: string
  /** i18n locale from the client (e.g. en, fr, es, nl, en-US) */
  locale?: string
}

type EmailLocale = 'en' | 'fr' | 'es' | 'nl'

type EmailStrings = {
  subjectPrefix: string
  title: string
  thanks: (firstName: string) => string
  intro: string
  yourResponse: string
  contactDetails: string
  email: string
  mailingAddress: string
  events: string
  fridayWelcomeDinner: string
  saturdayCeremonyReception: string
  sundayBrunch: string
  accommodation: string
  travel: string
  yourParty: string
  noAdditionalGuests: string
  dietaryLabel: string
  dietaryRequirements: string
  songRequest: string
  franceTips: string
  additionalNotes: string
  notSpecified: string
  yes: string
  no: string
  updateNote: string
  questions: string
  withLove: string
  likelihood: Record<string, string>
  eventAnswer: Record<string, string>
  accommodationValue: Record<string, string>
  travelValue: Record<string, string>
}

function normalizeLocale(locale?: string): EmailLocale {
  const base = (locale || 'en').toLowerCase().split('-')[0]
  if (base === 'fr' || base === 'es' || base === 'nl') return base
  return 'en'
}

const EMAIL_STRINGS: Record<EmailLocale, EmailStrings> = {
  en: {
    subjectPrefix: 'RSVP Confirmation',
    title: 'RSVP Confirmation',
    thanks: (firstName) => `Thank you for your RSVP, ${firstName}!`,
    intro: "We've received your response and wanted to send you a copy for your records.",
    yourResponse: 'Your Response',
    contactDetails: 'Contact Details',
    email: 'Email',
    mailingAddress: 'Mailing Address',
    events: 'Events',
    fridayWelcomeDinner: 'Friday Welcome Dinner',
    saturdayCeremonyReception: 'Saturday Ceremony & Reception',
    sundayBrunch: 'Sunday Brunch',
    accommodation: 'Accommodation',
    travel: 'Travel',
    yourParty: 'Your Party',
    noAdditionalGuests: 'No additional guests',
    dietaryLabel: 'Dietary',
    dietaryRequirements: 'Dietary Requirements',
    songRequest: 'Song Request',
    franceTips: 'France Tips',
    additionalNotes: 'Additional Notes',
    notSpecified: 'Not specified',
    yes: 'Yes',
    no: 'No',
    updateNote: 'If you need to update your response, simply visit our website and submit the form again with the same email address.',
    questions: 'Questions? Contact us at',
    withLove: 'With love',
    likelihood: {
      definitely: "We'll definitely be there! 🎉",
      highly_likely: "We're highly likely to attend",
      maybe: "We're not sure yet",
      no: "Unfortunately, we can't make it",
    },
    eventAnswer: {
      yes: '✓ Attending',
      no: '✗ Not attending',
      arriving_late: '⏰ Arriving late',
      '': '— Not specified',
    },
    accommodationValue: {
      venue: 'Staying at the venue',
      own: 'Arranging own accommodation',
      recommend: 'Would like recommendations',
      '': 'Not specified',
    },
    travelValue: {
      rent_car: 'Renting a car',
      need_shuttle: 'Would like shuttle service',
      no_plan: 'No plan yet',
      '': 'Not specified',
    },
  },
  fr: {
    subjectPrefix: 'Confirmation RSVP',
    title: 'Confirmation RSVP',
    thanks: (firstName) => `Merci pour votre RSVP, ${firstName} !`,
    intro: "Nous avons bien reçu votre réponse et souhaitons vous en envoyer une copie pour vos dossiers.",
    yourResponse: 'Votre Réponse',
    contactDetails: 'Coordonnées',
    email: 'Email',
    mailingAddress: 'Adresse postale',
    events: 'Événements',
    fridayWelcomeDinner: 'Dîner de bienvenue (vendredi)',
    saturdayCeremonyReception: 'Cérémonie & réception (samedi)',
    sundayBrunch: 'Brunch (dimanche)',
    accommodation: 'Hébergement',
    travel: 'Voyage',
    yourParty: 'Votre Groupe',
    noAdditionalGuests: "Pas d'invités supplémentaires",
    dietaryLabel: 'Régime',
    dietaryRequirements: 'Restrictions alimentaires',
    songRequest: 'Suggestion musicale',
    franceTips: 'Conseils France',
    additionalNotes: 'Notes supplémentaires',
    notSpecified: 'Non précisé',
    yes: 'Oui',
    no: 'Non',
    updateNote: "Si vous devez modifier votre réponse, retournez simplement sur notre site et renvoyez le formulaire avec la même adresse email.",
    questions: 'Des questions ? Contactez-nous à',
    withLove: 'Avec amour',
    likelihood: {
      definitely: 'Nous serons là avec certitude ! 🎉',
      highly_likely: 'Nous viendrons très probablement',
      maybe: "Nous ne sommes pas encore sûrs",
      no: "Malheureusement, nous ne pourrons pas venir",
    },
    eventAnswer: {
      yes: '✓ Présent',
      no: '✗ Absent',
      arriving_late: '⏰ En retard',
      '': '— Non précisé',
    },
    accommodationValue: {
      venue: 'Loger au château',
      own: 'Organiser son hébergement',
      recommend: 'Souhaite des recommandations',
      '': 'Non précisé',
    },
    travelValue: {
      rent_car: 'Location de voiture',
      need_shuttle: 'Souhaite une navette',
      no_plan: 'Pas encore de plan',
      '': 'Non précisé',
    },
  },
  es: {
    subjectPrefix: 'Confirmación de RSVP',
    title: 'Confirmación de RSVP',
    thanks: (firstName) => `¡Gracias por tu RSVP, ${firstName}!`,
    intro: 'Hemos recibido tu respuesta y queremos enviarte una copia para tus registros.',
    yourResponse: 'Tu Respuesta',
    contactDetails: 'Datos de contacto',
    email: 'Correo',
    mailingAddress: 'Dirección postal',
    events: 'Eventos',
    fridayWelcomeDinner: 'Cena de bienvenida (viernes)',
    saturdayCeremonyReception: 'Ceremonia y recepción (sábado)',
    sundayBrunch: 'Brunch (domingo)',
    accommodation: 'Alojamiento',
    travel: 'Viaje',
    yourParty: 'Tu Grupo',
    noAdditionalGuests: 'Sin invitados adicionales',
    dietaryLabel: 'Dieta',
    dietaryRequirements: 'Restricciones alimentarias',
    songRequest: 'Canción solicitada',
    franceTips: 'Consejos de Francia',
    additionalNotes: 'Notas adicionales',
    notSpecified: 'No especificado',
    yes: 'Sí',
    no: 'No',
    updateNote: 'Si necesitas actualizar tu respuesta, vuelve a nuestro sitio web y envía el formulario nuevamente con el mismo correo.',
    questions: '¿Preguntas? Contáctanos en',
    withLove: 'Con cariño',
    likelihood: {
      definitely: '¡Definitivamente estaremos allí! 🎉',
      highly_likely: 'Es muy probable que asistamos',
      maybe: 'Aún no estamos seguros',
      no: 'Lamentablemente no podremos asistir',
    },
    eventAnswer: {
      yes: '✓ Asistiré',
      no: '✗ No asistiré',
      arriving_late: '⏰ Llegaré tarde',
      '': '— No especificado',
    },
    accommodationValue: {
      venue: 'Me hospedo en el lugar',
      own: 'Organizo mi alojamiento',
      recommend: 'Quisiera recomendaciones',
      '': 'No especificado',
    },
    travelValue: {
      rent_car: 'Rentaré un auto',
      need_shuttle: 'Quisiera transporte',
      no_plan: 'Aún sin plan',
      '': 'No especificado',
    },
  },
  nl: {
    subjectPrefix: 'RSVP-bevestiging',
    title: 'RSVP-bevestiging',
    thanks: (firstName) => `Bedankt voor je RSVP, ${firstName}!`,
    intro: 'We hebben je antwoord ontvangen en sturen je graag een kopie voor je eigen administratie.',
    yourResponse: 'Jouw Antwoord',
    contactDetails: 'Contactgegevens',
    email: 'E-mail',
    mailingAddress: 'Postadres',
    events: 'Evenementen',
    fridayWelcomeDinner: 'Welkomstdiner (vrijdag)',
    saturdayCeremonyReception: 'Ceremonie & receptie (zaterdag)',
    sundayBrunch: 'Brunch (zondag)',
    accommodation: 'Accommodatie',
    travel: 'Reis',
    yourParty: 'Jouw Gezelschap',
    noAdditionalGuests: 'Geen extra gasten',
    dietaryLabel: 'Dieet',
    dietaryRequirements: 'Dieetwensen',
    songRequest: 'Muziekverzoek',
    franceTips: 'Frankrijk-tips',
    additionalNotes: 'Extra opmerkingen',
    notSpecified: 'Niet opgegeven',
    yes: 'Ja',
    no: 'Nee',
    updateNote: 'Wil je je antwoord aanpassen? Bezoek onze website en verstuur het formulier opnieuw met hetzelfde e-mailadres.',
    questions: 'Vragen? Contacteer ons via',
    withLove: 'Met liefde',
    likelihood: {
      definitely: 'We zijn er zeker bij! 🎉',
      highly_likely: 'We komen zeer waarschijnlijk',
      maybe: 'We zijn nog niet zeker',
      no: 'Helaas kunnen we er niet bij zijn',
    },
    eventAnswer: {
      yes: '✓ Aanwezig',
      no: '✗ Niet aanwezig',
      arriving_late: '⏰ Later',
      '': '— Niet opgegeven',
    },
    accommodationValue: {
      venue: 'Verblijf op de locatie',
      own: 'Regel eigen accommodatie',
      recommend: 'Graag aanbevelingen',
      '': 'Niet opgegeven',
    },
    travelValue: {
      rent_car: 'Ik huur een auto',
      need_shuttle: 'Graag shuttle',
      no_plan: 'Nog geen plan',
      '': 'Niet opgegeven',
    },
  },
}

function stringsForLocale(locale?: string): EmailStrings {
  return EMAIL_STRINGS[normalizeLocale(locale)]
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function getFranceTipsText(franceTips: boolean | undefined, s: EmailStrings): string {
  if (franceTips === true) return s.yes
  if (franceTips === false) return s.no
  return s.notSpecified
}

// Wedding configuration - keep in sync with src/config.ts
const weddingConfig = {
  couple: {
    person1: 'Carolina',
    person2: 'Thomas',
  },
  date: {
    display: 'August 26, 2026',
  },
  venue: {
    name: 'Vallesvilles',
    location: 'Haute-Garonne, France',
  },
  contactEmail: 'wedding@example.com', // Update with your actual contact email
}

function getLikelihoodText(likelihood: string, s: EmailStrings): string {
  return s.likelihood[likelihood] || likelihood
}

function getEventText(answer: string, s: EmailStrings): string {
  return s.eventAnswer[answer] || answer
}

function getAccommodationText(accommodation: string, s: EmailStrings): string {
  return s.accommodationValue[accommodation] || accommodation
}

function getTravelText(travel: string, s: EmailStrings): string {
  return s.travelValue[travel] || travel
}

function generateEmailHtml(data: RsvpData): string {
  const s = stringsForLocale(data.locale)
  const {
    firstName,
    email,
    mailingAddress,
    likelihood,
    events,
    accommodation,
    travelPlan,
    guests,
    dietary,
    songRequest,
    franceTips,
    additionalNotes,
  } = data

  const safeFirstName = escapeHtml(firstName)
  const safeEmail = escapeHtml(email)
  const safeMailingAddress = mailingAddress ? escapeHtml(mailingAddress) : ''
  const safeDietary = dietary ? escapeHtml(dietary) : ''
  const safeSongRequest = songRequest ? escapeHtml(songRequest) : ''
  const safeAdditionalNotes = additionalNotes ? escapeHtml(additionalNotes) : ''

  const guestList = guests.length > 0
    ? guests
        .map(
          (g) =>
            `<li>${escapeHtml(g.name)}${g.dietary ? ` <em>(${s.dietaryLabel}: ${escapeHtml(g.dietary)})</em>` : ''}</li>`,
        )
        .join('')
    : `<li><em>${s.noAdditionalGuests}</em></li>`

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${s.title}</title>
  <style>
    @keyframes floatCouple {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }
    @keyframes wave {
      0%, 100% { transform: rotate(0deg); }
      50% { transform: rotate(6deg); }
    }
    .coupleWrap { display: inline-block; margin-top: 14px; }
    .coupleFloat { animation: floatCouple 3.2s ease-in-out infinite; }
    .groomWave { transform-origin: 88% 58%; animation: wave 2.4s ease-in-out infinite; }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: Georgia, 'Times New Roman', serif; background-color: #F5F1EB; color: #2C3E50;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F5F1EB; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border: 1px solid #C4A77D; max-width: 100%;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid #C4A77D;">
              <h1 style="margin: 0; font-size: 28px; font-weight: normal; color: #2C3E50; font-family: Georgia, serif;">
                ${weddingConfig.couple.person1} & ${weddingConfig.couple.person2}
              </h1>
              <p style="margin: 10px 0 0; font-size: 14px; color: #8B4513; letter-spacing: 2px; text-transform: uppercase;">
                ${weddingConfig.date.display}
              </p>
              <div class="coupleWrap coupleFloat" aria-hidden="true">
                <svg width="120" height="48" viewBox="0 0 120 48" role="img" focusable="false" xmlns="http://www.w3.org/2000/svg">
                  <!-- bride (left) -->
                  <g transform="translate(12,4)" fill="none" stroke="#8B4513" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="14" cy="12" r="6"/>
                    <path d="M7 12 C10 5, 18 5, 21 12" opacity="0.5"/>
                    <path d="M14 18 L14 30"/>
                    <path d="M14 30 L6 40"/>
                    <path d="M14 30 L22 40"/>
                    <path d="M8 22 L20 22"/>
                  </g>
                  <!-- groom (right) -->
                  <g transform="translate(66,4)" fill="none" stroke="#8B4513" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="14" cy="12" r="6"/>
                    <path d="M10 9 L18 9" opacity="0.6"/>
                    <path d="M14 18 L14 30"/>
                    <path class="groomWave" d="M14 22 L24 18"/>
                    <path d="M14 22 L4 18"/>
                    <path d="M14 30 L8 40"/>
                    <path d="M14 30 L20 40"/>
                  </g>
                  <!-- little heart -->
                  <path d="M58 18 C58 14, 62 14, 62 18 C62 22, 58 24, 60 26 C62 24, 66 22, 66 18 C66 14, 62 14, 62 18" fill="#C4A77D" stroke="none" opacity="0.85"/>
                </svg>
              </div>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; font-size: 22px; font-weight: normal; color: #2C3E50;">
                ${s.thanks(safeFirstName)}
              </h2>
              
              <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #2C3E50;">
                ${s.intro}
              </p>
              
              <!-- Response Summary -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAF8F5; border: 1px solid #E8E4DC; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 25px;">
                    <h3 style="margin: 0 0 15px; font-size: 16px; color: #8B4513; text-transform: uppercase; letter-spacing: 1px;">
                      ${s.yourResponse}
                    </h3>
                    
                    <p style="margin: 0 0 15px; font-size: 18px; color: #2C3E50;">
                      <strong>${escapeHtml(getLikelihoodText(likelihood, s))}</strong>
                    </p>

                    <hr style="border: none; border-top: 1px solid #E8E4DC; margin: 20px 0;">

                    <h4 style="margin: 0 0 10px; font-size: 14px; color: #8B4513; text-transform: uppercase; letter-spacing: 1px;">
                      ${s.contactDetails}
                    </h4>
                    <table width="100%" cellpadding="8" cellspacing="0" style="font-size: 14px;">
                      <tr>
                        <td style="color: #666;">${s.email}</td>
                        <td style="text-align: right;">${safeEmail}</td>
                      </tr>
                      <tr>
                        <td style="color: #666;">${s.mailingAddress}</td>
                        <td style="text-align: right;">${safeMailingAddress ? safeMailingAddress : `— ${s.notSpecified}`}</td>
                      </tr>
                    </table>

                    <hr style="border: none; border-top: 1px solid #E8E4DC; margin: 20px 0;">

                    <h4 style="margin: 0 0 10px; font-size: 14px; color: #8B4513; text-transform: uppercase; letter-spacing: 1px;">
                      ${s.events}
                    </h4>
                    <table width="100%" cellpadding="8" cellspacing="0" style="font-size: 14px;">
                      <tr>
                        <td style="color: #666;">${s.fridayWelcomeDinner}</td>
                        <td style="text-align: right;">${escapeHtml(getEventText(events?.welcome || '', s))}</td>
                      </tr>
                      <tr>
                        <td style="color: #666;">${s.saturdayCeremonyReception}</td>
                        <td style="text-align: right;">${escapeHtml(getEventText(events?.ceremony || '', s))}</td>
                      </tr>
                      <tr>
                        <td style="color: #666;">${s.sundayBrunch}</td>
                        <td style="text-align: right;">${escapeHtml(getEventText(events?.brunch || '', s))}</td>
                      </tr>
                    </table>

                    <hr style="border: none; border-top: 1px solid #E8E4DC; margin: 20px 0;">
                    <p style="margin: 0; font-size: 14px;">
                      <strong style="color: #8B4513;">${s.accommodation}:</strong> ${escapeHtml(getAccommodationText(accommodation || '', s))}
                    </p>
                    <p style="margin: 10px 0 0; font-size: 14px;">
                      <strong style="color: #8B4513;">${s.travel}:</strong> ${escapeHtml(getTravelText(travelPlan || '', s))}
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #E8E4DC; margin: 20px 0;">
                    
                    <h4 style="margin: 0 0 10px; font-size: 14px; color: #8B4513; text-transform: uppercase; letter-spacing: 1px;">
                      ${s.yourParty}
                    </h4>
                    <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
                      ${guestList}
                    </ul>
                    
                    ${safeDietary ? `
                    <hr style="border: none; border-top: 1px solid #E8E4DC; margin: 20px 0;">
                    <p style="margin: 0; font-size: 14px;">
                      <strong style="color: #8B4513;">${s.dietaryRequirements}:</strong> ${safeDietary}
                    </p>
                    ` : ''}
                    
                    ${safeSongRequest ? `
                    <p style="margin: 10px 0 0; font-size: 14px;">
                      <strong style="color: #8B4513;">${s.songRequest}:</strong> ${safeSongRequest}
                    </p>
                    ` : ''}

                    <p style="margin: 10px 0 0; font-size: 14px;">
                      <strong style="color: #8B4513;">${s.franceTips}:</strong> ${getFranceTipsText(franceTips, s)}
                    </p>
                    
                    ${safeAdditionalNotes ? `
                    <hr style="border: none; border-top: 1px solid #E8E4DC; margin: 20px 0;">
                    <p style="margin: 0; font-size: 14px;">
                      <strong style="color: #8B4513;">${s.additionalNotes}:</strong><br>
                      ${safeAdditionalNotes}
                    </p>
                    ` : ''}
                  </td>
                </tr>
              </table>
              
              <!-- Venue Info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="text-align: center; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 5px; font-size: 16px; color: #2C3E50;">
                      <strong>${weddingConfig.venue.name}</strong>
                    </p>
                    <p style="margin: 0; font-size: 14px; color: #666;">
                      ${weddingConfig.venue.location}
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #666; text-align: center;">
                ${s.updateNote}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #FAF8F5; border-top: 1px solid #C4A77D; text-align: center;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #666;">
                ${s.questions}<br>
                <a href="mailto:${weddingConfig.contactEmail}" style="color: #8B4513;">${weddingConfig.contactEmail}</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #999;">
                ${s.withLove}, ${weddingConfig.couple.person1} & ${weddingConfig.couple.person2} 💕
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

function generatePlainText(data: RsvpData): string {
  const s = stringsForLocale(data.locale)
  const {
    firstName,
    email,
    mailingAddress,
    likelihood,
    events,
    accommodation,
    travelPlan,
    guests,
    dietary,
    songRequest,
    franceTips,
    additionalNotes,
  } = data
  
  let text = `
${weddingConfig.couple.person1} & ${weddingConfig.couple.person2}
${weddingConfig.date.display}

────────────────────────────────

${s.thanks(firstName)}

${s.intro}

${s.yourResponse.toUpperCase()}
─────────────
${getLikelihoodText(likelihood, s)}
`

  text += `
${s.contactDetails.toUpperCase()}
──────────────
${s.email}: ${email}
${s.mailingAddress}: ${mailingAddress ? mailingAddress : s.notSpecified}
`

  text += `
${s.events.toUpperCase()}
──────
• ${s.fridayWelcomeDinner}: ${getEventText(events?.welcome || '', s)}
• ${s.saturdayCeremonyReception}: ${getEventText(events?.ceremony || '', s)}
• ${s.sundayBrunch}: ${getEventText(events?.brunch || '', s)}

${s.accommodation}: ${getAccommodationText(accommodation || '', s)}
${s.travel}: ${getTravelText(travelPlan || '', s)}
`

  text += `

${s.yourParty.toUpperCase()}
──────────
`
  if (guests.length > 0) {
    guests.forEach(g => {
      text += `• ${g.name}${g.dietary ? ` (${s.dietaryLabel}: ${g.dietary})` : ''}\n`
    })
  } else {
    text += `• ${s.noAdditionalGuests}\n`
  }

  if (dietary) {
    text += `\n${s.dietaryRequirements}: ${dietary}`
  }
  if (songRequest) {
    text += `\n${s.songRequest}: ${songRequest}`
  }

  text += `\n${s.franceTips}: ${getFranceTipsText(franceTips, s)}`

  if (additionalNotes) {
    text += `\n\n${s.additionalNotes}:\n${additionalNotes}`
  }

  text += `

────────────────────────────────

${weddingConfig.venue.name}
${weddingConfig.venue.location}

${s.updateNote}

${s.questions} ${weddingConfig.contactEmail}

${s.withLove}, ${weddingConfig.couple.person1} & ${weddingConfig.couple.person2} 💕
`

  return text
}

const handler: Handler = async (event: HandlerEvent) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  // IP-based rate limiting (protects external Resend API usage).
  // Defaults: 5 requests per 15 minutes per IP. Configure via env vars if needed.
  const ip = getClientIp(event.headers || {})
  const limit = Number.parseInt(process.env.RATE_LIMIT_RSVP_CONFIRM_MAX || '5', 10)
  const windowSeconds = Number.parseInt(process.env.RATE_LIMIT_RSVP_CONFIRM_WINDOW_SECONDS || '900', 10)
  const rl = consumeRateLimit(rateLimitKey('send-rsvp-confirmation', ip), {
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

  // Parse request body
  let data: RsvpData
  try {
    data = JSON.parse(event.body || '{}')
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON body' }),
    }
  }

  // Validate required fields
  if (!data.email || !data.firstName) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required fields: email and firstName' }),
    }
  }

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
        subject: `${s.subjectPrefix} - ${weddingConfig.couple.person1} & ${weddingConfig.couple.person2}`,
        html: generateEmailHtml(data),
        text: generatePlainText(data),
      }),
    }
  }

  // Check for Resend API key
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY environment variable is not set')
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Email service not configured' }),
    }
  }

  // Send email using Resend API
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL || 'Wedding RSVP <onboarding@resend.dev>',
        to: [data.email],
        subject: `${stringsForLocale(data.locale).subjectPrefix} - ${weddingConfig.couple.person1} & ${weddingConfig.couple.person2}`,
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
    console.error('Error sending email:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send email' }),
    }
  }
}

export { handler }
