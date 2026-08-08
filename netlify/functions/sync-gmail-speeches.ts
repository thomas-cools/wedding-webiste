import type { Handler } from '@netlify/functions'

import { syncGmailSpeeches } from './utils/gmail-speeches'

export const handler: Handler = async () => {
  try {
    const result = await syncGmailSpeeches()
    console.info('Completed Gmail speech sync', result)
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ok: true, ...result }),
    }
  } catch (error) {
    console.error('Gmail speech sync failed', {
      error: error instanceof Error ? error.message : 'Unknown sync error',
    })
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Gmail speech sync failed' }),
    }
  }
}