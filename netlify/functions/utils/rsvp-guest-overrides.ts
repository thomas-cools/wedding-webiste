import { getStore } from '@netlify/blobs'

/**
 * Persists admin-made edits to an RSVP party's guest (plus-ones) list.
 *
 * Netlify Forms submissions are read-only, so this uses Netlify Blobs as a
 * simple key-value override store, keyed by the party's normalized email.
 * When an override exists, `admin-rsvps.ts` fully replaces that party's
 * `guests` array with it before computing stats/duplicate-detection.
 */

const STORE_NAME = 'rsvp-guest-overrides'

/** Max number of prior states kept per party for audit purposes. */
const MAX_HISTORY_ENTRIES = 5

export interface EditableGuest {
  name: string
  age?: string
  dietary?: string
}

export interface RsvpGuestOverrideEntry {
  guests: EditableGuest[]
  updatedAt: string
}

export interface RsvpGuestOverride extends RsvpGuestOverrideEntry {
  /** Prior states, most recent first. Bounded to MAX_HISTORY_ENTRIES. */
  history: RsvpGuestOverrideEntry[]
}

/** Lowercases and trims an email to use as a stable blob store key. */
export function normalizeOverrideKey(email: string): string {
  return email.trim().toLowerCase()
}

function getOverrideStore() {
  // Netlify normally injects Blobs context automatically for Functions, but
  // that auto-configuration isn't always available (e.g. CLI-based
  // `netlify deploy` rather than a Netlify-triggered build). Fall back to
  // explicit configuration using the same site credentials already required
  // for the Forms API (NETLIFY_API_TOKEN, SITE_ID) so this works either way.
  const siteID = process.env.SITE_ID
  const token = process.env.NETLIFY_API_TOKEN
  if (siteID && token) {
    return getStore({ name: STORE_NAME, siteID, token })
  }
  return getStore(STORE_NAME)
}

/** Fetches the current guest override for a single party, if any. */
export async function getGuestOverride(email: string): Promise<RsvpGuestOverride | null> {
  const store = getOverrideStore()
  const key = normalizeOverrideKey(email)
  const data = await store.get(key, { type: 'json' })
  return (data as RsvpGuestOverride | null) ?? null
}

/** Fetches every stored guest override, keyed by normalized email. */
export async function getAllGuestOverrides(): Promise<Map<string, RsvpGuestOverride>> {
  const store = getOverrideStore()
  const { blobs } = await store.list()

  const entries = await Promise.all(
    blobs.map(async (blob) => {
      const data = await store.get(blob.key, { type: 'json' })
      return [blob.key, data as RsvpGuestOverride] as const
    })
  )

  return new Map(entries.filter(([, data]) => data != null))
}

/**
 * Replaces a party's guest override, pushing the previous state (if any)
 * onto a bounded history array.
 */
export async function saveGuestOverride(
  email: string,
  guests: EditableGuest[]
): Promise<RsvpGuestOverride> {
  const store = getOverrideStore()
  const key = normalizeOverrideKey(email)

  const existing = (await store.get(key, { type: 'json' })) as RsvpGuestOverride | null
  const history = existing
    ? [{ guests: existing.guests, updatedAt: existing.updatedAt }, ...existing.history].slice(
        0,
        MAX_HISTORY_ENTRIES
      )
    : []

  const override: RsvpGuestOverride = {
    guests,
    updatedAt: new Date().toISOString(),
    history,
  }

  await store.setJSON(key, override)
  return override
}

/**
 * Moves a guest override from one email key to another, preserving its
 * history untouched. Used when a party's email is corrected (see
 * admin-update-rsvp-email.ts) so an existing guest-list edit isn't orphaned
 * under the old, typo'd email key.
 */
export async function migrateGuestOverrideKey(oldEmail: string, newEmail: string): Promise<void> {
  const oldKey = normalizeOverrideKey(oldEmail)
  const newKey = normalizeOverrideKey(newEmail)
  if (!oldKey || oldKey === newKey) return

  const store = getOverrideStore()
  const existing = await store.get(oldKey, { type: 'json' })
  if (existing == null) return

  await store.setJSON(newKey, existing)
  await store.delete(oldKey)
}
