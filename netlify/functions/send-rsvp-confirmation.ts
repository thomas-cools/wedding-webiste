import type { Handler, HandlerEvent } from '@netlify/functions'

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
  likelihood: string
  events?: Events
  accommodation?: string
  travelPlan?: string
  guests: Guest[]
  dietary?: string
  songRequest?: string
  franceTips?: boolean
  additionalNotes?: string
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
    name: 'Château du Pujolet',
    location: 'Haute-Garonne, France',
  },
  contactEmail: 'wedding@example.com', // Update with your actual contact email
}

function getLikelihoodText(likelihood: string): string {
  const map: Record<string, string> = {
    definitely: "We'll definitely be there! 🎉",
    highly_likely: "We're highly likely to attend",
    maybe: "We're not sure yet",
    no: "Unfortunately, we can't make it",
  }
  return map[likelihood] || likelihood
}

function getEventText(answer: string): string {
  const map: Record<string, string> = {
    yes: '✓ Attending',
    no: '✗ Not attending',
    arriving_late: '⏰ Arriving late',
    '': '— Not specified',
  }
  return map[answer] || answer
}

function getAccommodationText(accommodation: string): string {
  const map: Record<string, string> = {
    venue: 'Staying at the venue',
    own: 'Arranging own accommodation',
    recommend: 'Would like recommendations',
    '': 'Not specified',
  }
  return map[accommodation] || accommodation
}

function getTravelText(travel: string): string {
  const map: Record<string, string> = {
    rent_car: 'Renting a car',
    need_shuttle: 'Would like shuttle service',
    no_plan: 'No plan yet',
    '': 'Not specified',
  }
  return map[travel] || travel
}

function generateEmailHtml(data: RsvpData): string {
  const { firstName, likelihood, events, accommodation, travelPlan, guests, dietary, songRequest, additionalNotes } = data
  
  const showEventDetails = likelihood === 'definitely' || likelihood === 'highly_likely'
  
  const guestList = guests.length > 0 
    ? guests.map(g => `<li>${g.name}${g.dietary ? ` <em>(Dietary: ${g.dietary})</em>` : ''}</li>`).join('')
    : '<li><em>No additional guests</em></li>'

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RSVP Confirmation</title>
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
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; font-size: 22px; font-weight: normal; color: #2C3E50;">
                Thank you for your RSVP, ${firstName}!
              </h2>
              
              <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #2C3E50;">
                We've received your response and wanted to send you a copy for your records.
              </p>
              
              <!-- Response Summary -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAF8F5; border: 1px solid #E8E4DC; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 25px;">
                    <h3 style="margin: 0 0 15px; font-size: 16px; color: #8B4513; text-transform: uppercase; letter-spacing: 1px;">
                      Your Response
                    </h3>
                    
                    <p style="margin: 0 0 15px; font-size: 18px; color: #2C3E50;">
                      <strong>${getLikelihoodText(likelihood)}</strong>
                    </p>
                    
                    ${showEventDetails ? `
                    <hr style="border: none; border-top: 1px solid #E8E4DC; margin: 20px 0;">
                    
                    <h4 style="margin: 0 0 10px; font-size: 14px; color: #8B4513; text-transform: uppercase; letter-spacing: 1px;">
                      Events
                    </h4>
                    <table width="100%" cellpadding="8" cellspacing="0" style="font-size: 14px;">
                      <tr>
                        <td style="color: #666;">Friday Welcome Dinner</td>
                        <td style="text-align: right;">${getEventText(events?.welcome || '')}</td>
                      </tr>
                      <tr>
                        <td style="color: #666;">Saturday Ceremony & Reception</td>
                        <td style="text-align: right;">${getEventText(events?.ceremony || '')}</td>
                      </tr>
                      <tr>
                        <td style="color: #666;">Sunday Brunch</td>
                        <td style="text-align: right;">${getEventText(events?.brunch || '')}</td>
                      </tr>
                    </table>
                    
                    ${accommodation ? `
                    <hr style="border: none; border-top: 1px solid #E8E4DC; margin: 20px 0;">
                    <p style="margin: 0; font-size: 14px;">
                      <strong style="color: #8B4513;">Accommodation:</strong> ${getAccommodationText(accommodation)}
                    </p>
                    ` : ''}
                    
                    ${travelPlan ? `
                    <p style="margin: 10px 0 0; font-size: 14px;">
                      <strong style="color: #8B4513;">Travel:</strong> ${getTravelText(travelPlan)}
                    </p>
                    ` : ''}
                    ` : ''}
                    
                    <hr style="border: none; border-top: 1px solid #E8E4DC; margin: 20px 0;">
                    
                    <h4 style="margin: 0 0 10px; font-size: 14px; color: #8B4513; text-transform: uppercase; letter-spacing: 1px;">
                      Your Party
                    </h4>
                    <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
                      ${guestList}
                    </ul>
                    
                    ${dietary ? `
                    <hr style="border: none; border-top: 1px solid #E8E4DC; margin: 20px 0;">
                    <p style="margin: 0; font-size: 14px;">
                      <strong style="color: #8B4513;">Dietary Requirements:</strong> ${dietary}
                    </p>
                    ` : ''}
                    
                    ${songRequest ? `
                    <p style="margin: 10px 0 0; font-size: 14px;">
                      <strong style="color: #8B4513;">Song Request:</strong> ${songRequest}
                    </p>
                    ` : ''}
                    
                    ${additionalNotes ? `
                    <hr style="border: none; border-top: 1px solid #E8E4DC; margin: 20px 0;">
                    <p style="margin: 0; font-size: 14px;">
                      <strong style="color: #8B4513;">Additional Notes:</strong><br>
                      ${additionalNotes}
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
                If you need to update your response, simply visit our website and submit the form again with the same email address.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #FAF8F5; border-top: 1px solid #C4A77D; text-align: center;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #666;">
                Questions? Contact us at<br>
                <a href="mailto:${weddingConfig.contactEmail}" style="color: #8B4513;">${weddingConfig.contactEmail}</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #999;">
                With love, ${weddingConfig.couple.person1} & ${weddingConfig.couple.person2} 💕
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
  const { firstName, likelihood, events, accommodation, travelPlan, guests, dietary, songRequest, additionalNotes } = data
  const showEventDetails = likelihood === 'definitely' || likelihood === 'highly_likely'
  
  let text = `
${weddingConfig.couple.person1} & ${weddingConfig.couple.person2}
${weddingConfig.date.display}

────────────────────────────────

Thank you for your RSVP, ${firstName}!

We've received your response and wanted to send you a copy for your records.

YOUR RESPONSE
─────────────
${getLikelihoodText(likelihood)}
`

  if (showEventDetails && events) {
    text += `
EVENTS
──────
• Friday Welcome Dinner: ${getEventText(events.welcome)}
• Saturday Ceremony & Reception: ${getEventText(events.ceremony)}
• Sunday Brunch: ${getEventText(events.brunch)}
`
    if (accommodation) {
      text += `\nAccommodation: ${getAccommodationText(accommodation)}`
    }
    if (travelPlan) {
      text += `\nTravel: ${getTravelText(travelPlan)}`
    }
  }

  text += `

YOUR PARTY
──────────
`
  if (guests.length > 0) {
    guests.forEach(g => {
      text += `• ${g.name}${g.dietary ? ` (Dietary: ${g.dietary})` : ''}\n`
    })
  } else {
    text += `• No additional guests\n`
  }

  if (dietary) {
    text += `\nDietary Requirements: ${dietary}`
  }
  if (songRequest) {
    text += `\nSong Request: ${songRequest}`
  }
  if (additionalNotes) {
    text += `\n\nAdditional Notes:\n${additionalNotes}`
  }

  text += `

────────────────────────────────

${weddingConfig.venue.name}
${weddingConfig.venue.location}

If you need to update your response, simply visit our website and submit the form again with the same email address.

Questions? Contact us at ${weddingConfig.contactEmail}

With love, ${weddingConfig.couple.person1} & ${weddingConfig.couple.person2} 💕
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

  // Check for Resend API key
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY environment variable is not set')
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Email service not configured' }),
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
        subject: `RSVP Confirmation - ${weddingConfig.couple.person1} & ${weddingConfig.couple.person2}'s Wedding`,
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
