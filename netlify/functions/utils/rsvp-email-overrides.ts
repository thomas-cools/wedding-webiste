import { getStore } from '@netlify/blobs'

/**
 * Persists admin-made corrections to an RSVP party's email address (e.g. a
 * guest typo'd their email when submitting).
 *
 * Keyed by the Netlify Forms submission's stable `id` — unlike email, which
 * is exactly what's being corrected and is used as the dedup/identity key
 * everywhere else, the submission id never changes. `admin-rsvps.ts` applies
 * these corrections before deduplicating submissions by email.
 */

const STORE_NAME = 'rsvp-email-overrides'

/** Max number of prior states kept per party for audit purposes. */
const MAX_HISTORY_ENTRIES = 5

export interface EmailOverrideEntry {
  email: string
  updatedAt: string
}

export interface RsvpEmailOverride extends EmailOverrideEntry {
  /** Prior states, most recent first. Bounded to MAX_HISTORY_ENTRIES. */
  history: EmailOverrideEntry[]
}

function getOverrideStore() {
  // See rsvp-guest-overrides.ts for why explicit siteID/token are needed:
  // automatic Blobs context isn't available for CLI-based `netlify deploy`.
  const siteID = process.env.SITE_ID
  const token = process.env.NETLIFY_API_TOKEN
  if (siteID && token) {
    return getStore({ name: STORE_NAME, siteID, token })
  }
  return getStore(STORE_NAME)
}

/** Fetches the current email override for a single submission, if any. */
export async function getEmailOverride(id: string): Promise<RsvpEmailOverride | null> {
  const store = getOverrideStore()
  const data = await store.get(id, { type: 'json' })
  return (data as RsvpEmailOverride | null) ?? null
}

/** Fetches every stored email override, keyed by submission id. */
export async function getAllEmailOverrides(): Promise<Map<string, RsvpEmailOverride>> {
  const store = getOverrideStore()
  const { blobs } = await store.list()

  const entries = await Promise.all(
    blobs.map(async (blob) => {
      const data = await store.get(blob.key, { type: 'json' })
      return [blob.key, data as RsvpEmailOverride] as const
    })
  )

  return new Map(entries.filter(([, data]) => data != null))
}

/**
 * Replaces a submission's email override, pushing the previous state (if
 * any) onto a bounded history array.
 */
export async function saveEmailOverride(id: string, email: string): Promise<RsvpEmailOverride> {
  const store = getOverrideStore()

  const existing = (await store.get(id, { type: 'json' })) as RsvpEmailOverride | null
  const history = existing
    ? [{ email: existing.email, updatedAt: existing.updatedAt }, ...existing.history].slice(
        0,
        MAX_HISTORY_ENTRIES
      )
    : []

  const override: RsvpEmailOverride = {
    email,
    updatedAt: new Date().toISOString(),
    history,
  }

  await store.setJSON(id, override)
  return override
}
