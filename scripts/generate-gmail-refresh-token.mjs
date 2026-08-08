import { randomBytes } from 'node:crypto'
import { spawn } from 'node:child_process'
import http from 'node:http'
import { google } from 'googleapis'

const clientId = process.env.GMAIL_CLIENT_ID?.trim()
const clientSecret = process.env.GMAIL_CLIENT_SECRET?.trim()
const redirectUri =
  process.env.GMAIL_OAUTH_REDIRECT_URI?.trim() || 'http://127.0.0.1:53682/oauth2/callback'

if (!clientId || !clientSecret) {
  console.error('Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET before running this script.')
  process.exit(1)
}

const redirect = new URL(redirectUri)
if (redirect.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(redirect.hostname)) {
  console.error('GMAIL_OAUTH_REDIRECT_URI must be an HTTP localhost URL.')
  process.exit(1)
}

const state = randomBytes(24).toString('hex')
const oauthClient = new google.auth.OAuth2(clientId, clientSecret, redirectUri)
const authorizeUrl = oauthClient.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  state,
  scope: [
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/drive.readonly',
  ],
})

const server = http.createServer(async (request, response) => {
  const callbackUrl = new URL(request.url || '/', redirectUri)
  if (callbackUrl.pathname !== redirect.pathname) {
    response.writeHead(404).end('Not found')
    return
  }
  if (callbackUrl.searchParams.get('state') !== state) {
    response.writeHead(400).end('OAuth state mismatch')
    server.close()
    return
  }

  const code = callbackUrl.searchParams.get('code')
  if (!code) {
    response.writeHead(400).end('Authorization code is missing')
    server.close()
    return
  }

  try {
    const { tokens } = await oauthClient.getToken(code)
    if (typeof tokens.refresh_token !== 'string') {
      throw new Error('Google did not return a refresh token. Revoke prior consent and retry.')
    }

    response.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' })
    response.end('Authorization complete. You can close this tab.')
    console.log('\nGMAIL_REFRESH_TOKEN=')
    console.log(tokens.refresh_token)
    console.log('\nStore this value directly in Netlify environment variables. Do not commit it.')
  } catch (error) {
    response.writeHead(500).end('Token exchange failed. Check the terminal.')
    console.error(error instanceof Error ? error.message : 'Token exchange failed')
    process.exitCode = 1
  } finally {
    server.close()
  }
})

server.listen(Number(redirect.port), redirect.hostname, () => {
  console.log(`Open this URL to authorize the wedding Gmail account:\n${authorizeUrl}`)
  if (process.env.BROWSER) {
    spawn(process.env.BROWSER, [authorizeUrl], {
      detached: true,
      stdio: 'ignore',
    }).unref()
  }
})
