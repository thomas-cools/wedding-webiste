import { getStore } from '@netlify/blobs'
import { randomUUID } from 'crypto'

/**
 * Persists parties added directly by an admin (e.g. someone who never
 * submitted the real RSVP form but still needs a Final RSVP invitation).
 *
 * Netlify Forms only knows about real form submissions, so these live in
 * their own Netlify Blobs store, keyed by a generated id. `admin-rsvps.ts`
 * merges them into the GET response as pseudo-`AdminRsvp` rows with
 * `likelihood: 'definitely'` and `isManuallyAdded: true` so they flow through
 * every existing dashboard/selection/Final RSVP Invitations code path
 * unchanged.
 */

const STORE_NAME = 'manual-rsvp-parties'

export interface ManualRsvpPartyGuest {
  name: string
}

export interface ManualRsvpParty {
  id: string
  firstName: string
  email: string
  guests: ManualRsvpPartyGuest[]
  createdAt: string
  updatedAt: string
}

function getManualPartyStore() {
  // See rsvp-guest-overrides.ts for why explicit siteID/token are needed:
  // automatic Blobs context isn't available for CLI-based `netlify deploy`.
  const siteID = process.env.SITE_ID
  const token = process.env.NETLIFY_API_TOKEN
  if (siteID && token) {
    return getStore({ name: STORE_NAME, siteID, token })
  }
  return getStore(STORE_NAME)
}

/** Fetches every manually-added party. */
export async function getAllManualParties(): Promise<ManualRsvpParty[]> {
  const store = getManualPartyStore()
  const { blobs } = await store.list()

  const entries = await Promise.all(
    blobs.map(async (blob) => {
      const data = await store.get(blob.key, { type: 'json' })
      return data as ManualRsvpParty | null
    })
  )

  return entries.filter((party): party is ManualRsvpParty => party != null)
}

/** Creates a new manually-added party and persists it. */
export async function createManualParty(
  firstName: string,
  email: string,
  guests: ManualRsvpPartyGuest[]
): Promise<ManualRsvpParty> {
  const store = getManualPartyStore()
  const now = new Date().toISOString()
  const party: ManualRsvpParty = {
    id: randomUUID(),
    firstName,
    email,
    guests,
    createdAt: now,
    updatedAt: now,
  }
  await store.setJSON(party.id, party)
  return party
}

/** Updates an existing manually-added party. Returns null if it doesn't exist. */
export async function updateManualParty(
  id: string,
  firstName: string,
  email: string,
  guests: ManualRsvpPartyGuest[]
): Promise<ManualRsvpParty | null> {
  const store = getManualPartyStore()
  const existing = (await store.get(id, { type: 'json' })) as ManualRsvpParty | null
  if (!existing) return null

  const party: ManualRsvpParty = {
    ...existing,
    firstName,
    email,
    guests,
    updatedAt: new Date().toISOString(),
  }
  await store.setJSON(id, party)
  return party
}

/** Deletes a manually-added party. No-op if it doesn't exist. */
export async function deleteManualParty(id: string): Promise<void> {
  const store = getManualPartyStore()
  await store.delete(id)
}
