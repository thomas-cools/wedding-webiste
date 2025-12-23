import type { Handler } from '@netlify/functions'
import { consumeRateLimit, getClientIp, rateLimitHeaders, rateLimitKey } from './utils/rate-limiter'

type PlacesAutocompleteRequest = {
  input: string
  /** Optional: ISO-3166-1 alpha-2 country code (e.g. US, FR) */
  country?: string
  /** Optional: BCP-47 language (e.g. en, fr) */
  language?: string
  /** Optional session token for better billing grouping */
  sessionToken?: string
}

type GooglePlacesAutocompleteResponse = {
  status?: string
  error_message?: string
  predictions?: Array<{
    description?: string
    place_id?: string
  }>
}

function googlePlacesStatusToHttp(status: string | undefined): number {
  switch (status) {
    case 'OK':
    case 'ZERO_RESULTS':
      return 200
    case 'INVALID_REQUEST':
      return 400
    case 'REQUEST_DENIED':
      return 403
    case 'OVER_QUERY_LIMIT':
      return 429
    case 'UNKNOWN_ERROR':
    default:
      return 502
  }
}

function json(statusCode: number, body: unknown, extraHeaders: Record<string, string> = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  }
}

function numberFromEnv(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(String(value || ''), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    }
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, error: 'Method not allowed' })
  }

  // IP-based rate limiting (protects paid Google Places API usage).
  // Defaults are conservative; adjust via env vars if needed.
  const ip = getClientIp(event.headers || {})
  const limit = numberFromEnv(process.env.RATE_LIMIT_PLACES_AUTOCOMPLETE_MAX, 60)
  const windowSeconds = numberFromEnv(process.env.RATE_LIMIT_PLACES_AUTOCOMPLETE_WINDOW_SECONDS, 600)
  const rl = consumeRateLimit(rateLimitKey('places-autocomplete', ip), {
    max: limit,
    windowMs: windowSeconds * 1000,
  })

  if (!rl.allowed) {
    return json(
      429,
      { ok: false, error: 'Rate limit exceeded. Please try again shortly.' },
      rateLimitHeaders(rl)
    )
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    return json(500, { ok: false, error: 'Missing GOOGLE_MAPS_API_KEY' }, rateLimitHeaders(rl))
  }

  let payload: PlacesAutocompleteRequest
  try {
    payload = JSON.parse(event.body || '{}') as PlacesAutocompleteRequest
  } catch {
    return json(400, { ok: false, error: 'Invalid JSON body' }, rateLimitHeaders(rl))
  }

  const input = (payload.input || '').trim()
  if (input.length < 3) {
    return json(400, { ok: false, error: 'Input must be at least 3 characters' }, rateLimitHeaders(rl))
  }

  const params = new URLSearchParams({
    input,
    key: apiKey,
    types: 'address',
  })

  if (payload.language) params.set('language', payload.language)
  if (payload.sessionToken) params.set('sessiontoken', payload.sessionToken)
  if (payload.country) params.set('components', `country:${payload.country}`)

  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`

  try {
    const response = await fetch(url, { method: 'GET' })
    const data = (await response.json()) as GooglePlacesAutocompleteResponse

    if (!response.ok) {
      console.error('places-autocomplete upstream HTTP error', {
        upstreamStatus: response.status,
        googleStatus: data?.status,
        googleErrorMessage: data?.error_message,
      })

      return json(
        response.status,
        {
          ok: false,
          error: data?.error_message || 'Places autocomplete failed',
          status: data?.status || null,
        },
        rateLimitHeaders(rl)
      )
    }

    const googleStatus = data?.status
    if (googleStatus && googleStatus !== 'OK' && googleStatus !== 'ZERO_RESULTS') {
      console.error('places-autocomplete upstream Google status error', {
        googleStatus,
        googleErrorMessage: data?.error_message,
      })

      return json(
        googlePlacesStatusToHttp(googleStatus),
        {
          ok: false,
          error: data?.error_message || 'Places autocomplete failed',
          status: googleStatus,
        },
        rateLimitHeaders(rl)
      )
    }

    const predictions = (data.predictions || [])
      .map(p => ({
        description: p.description || '',
        placeId: p.place_id || '',
      }))
      .filter(p => p.description && p.placeId)

    return json(
      200,
      {
        ok: true,
        predictions,
      },
      rateLimitHeaders(rl)
    )
  } catch (err) {
    return json(
      500,
      { ok: false, error: err instanceof Error ? err.message : 'Unknown error' },
      rateLimitHeaders(rl)
    )
  }
}
