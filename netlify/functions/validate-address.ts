import type { Handler } from '@netlify/functions'

type ValidateAddressRequest = {
  address: string
  regionCode?: string
}

type Verdict = {
  addressComplete?: boolean
  hasUnconfirmedComponents?: boolean
  hasInferredComponents?: boolean
  hasReplacedComponents?: boolean
  missingComponentTypes?: string[]
}

type GoogleAddressValidationResponse = {
  result?: {
    verdict?: Verdict
    address?: {
      formattedAddress?: string
    }
  }
  error?: {
    message?: string
    status?: string
  }
}

function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      // Allow same-origin + Netlify previews to call this function
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(body),
  }
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

  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    return json(500, { ok: false, error: 'Missing GOOGLE_MAPS_API_KEY' })
  }

  let payload: ValidateAddressRequest
  try {
    payload = JSON.parse(event.body || '{}') as ValidateAddressRequest
  } catch {
    return json(400, { ok: false, error: 'Invalid JSON body' })
  }

  const address = (payload.address || '').trim()
  if (!address) {
    return json(400, { ok: false, error: 'Missing address' })
  }

  // Address Validation API expects structured components, but addressLines works well
  // for typical web-form inputs.
  const requestBody = {
    address: {
      addressLines: [address],
      regionCode: payload.regionCode,
    },
  }

  const url = `https://addressvalidation.googleapis.com/v1:validateAddress?key=${encodeURIComponent(apiKey)}`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const data = (await response.json()) as GoogleAddressValidationResponse

    if (!response.ok) {
      return json(response.status, {
        ok: false,
        error: data?.error?.message || 'Address validation failed',
        status: data?.error?.status,
      })
    }

    const verdict = data?.result?.verdict
    const formattedAddress = data?.result?.address?.formattedAddress

    return json(200, {
      ok: true,
      formattedAddress: formattedAddress || null,
      verdict: verdict || null,
    })
  } catch (err) {
    return json(500, {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    })
  }
}
