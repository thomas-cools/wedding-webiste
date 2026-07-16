/**
 * @jest-environment node
 */

const mockGet = jest.fn()
const mockSetJSON = jest.fn()
const mockList = jest.fn()
const mockDelete = jest.fn()
const mockGetStore = jest.fn((...args: unknown[]) => ({
  get: mockGet,
  setJSON: mockSetJSON,
  list: mockList,
  delete: mockDelete,
}))

jest.mock('@netlify/blobs', () => ({
  getStore: (...args: unknown[]) => mockGetStore(...args),
}))

import {
  getGuestOverride,
  getAllGuestOverrides,
  saveGuestOverride,
  normalizeOverrideKey,
  migrateGuestOverrideKey,
} from '../rsvp-guest-overrides'

describe('normalizeOverrideKey', () => {
  it('lowercases and trims the email', () => {
    expect(normalizeOverrideKey('  Alice@Example.COM  ')).toBe('alice@example.com')
  })
})

describe('getGuestOverride', () => {
  beforeEach(() => {
    mockGet.mockReset()
    mockSetJSON.mockReset()
    mockList.mockReset()
    mockGetStore.mockClear()
  })

  it('returns null when no override exists', async () => {
    mockGet.mockResolvedValue(null)
    const result = await getGuestOverride('alice@example.com')
    expect(result).toBeNull()
    expect(mockGet).toHaveBeenCalledWith('alice@example.com', { type: 'json' })
  })

  it('normalizes the email before looking it up', async () => {
    mockGet.mockResolvedValue({ guests: [], updatedAt: '2026-01-01T00:00:00.000Z', history: [] })
    await getGuestOverride('  Alice@Example.COM  ')
    expect(mockGet).toHaveBeenCalledWith('alice@example.com', { type: 'json' })
  })
})

describe('getAllGuestOverrides', () => {
  beforeEach(() => {
    mockGet.mockReset()
    mockSetJSON.mockReset()
    mockList.mockReset()
    mockGetStore.mockClear()
  })

  it('returns an empty map when the store has no blobs', async () => {
    mockList.mockResolvedValue({ blobs: [] })
    const result = await getAllGuestOverrides()
    expect(result.size).toBe(0)
  })

  it('fetches every listed key and keys the map by normalized email', async () => {
    mockList.mockResolvedValue({ blobs: [{ key: 'alice@example.com' }, { key: 'bob@example.com' }] })
    mockGet.mockImplementation((key: string) =>
      Promise.resolve({ guests: [{ name: `guest-of-${key}` }], updatedAt: '2026-01-01T00:00:00.000Z', history: [] })
    )

    const result = await getAllGuestOverrides()
    expect(result.size).toBe(2)
    expect(result.get('alice@example.com')?.guests).toEqual([{ name: 'guest-of-alice@example.com' }])
    expect(result.get('bob@example.com')?.guests).toEqual([{ name: 'guest-of-bob@example.com' }])
  })

  it('skips keys that resolve to null', async () => {
    mockList.mockResolvedValue({ blobs: [{ key: 'ghost@example.com' }] })
    mockGet.mockResolvedValue(null)

    const result = await getAllGuestOverrides()
    expect(result.size).toBe(0)
  })
})

describe('saveGuestOverride', () => {
  beforeEach(() => {
    mockGet.mockReset()
    mockSetJSON.mockReset()
    mockList.mockReset()
    mockGetStore.mockClear()
  })

  it('saves a fresh override with empty history when none existed', async () => {
    mockGet.mockResolvedValue(null)
    const guests = [{ name: 'Bob' }]

    const result = await saveGuestOverride('alice@example.com', guests)

    expect(result.guests).toEqual(guests)
    expect(result.history).toEqual([])
    expect(mockSetJSON).toHaveBeenCalledWith('alice@example.com', result)
  })

  it('prepends the previous state onto history', async () => {
    mockGet.mockResolvedValue({
      guests: [{ name: 'Old Guest' }],
      updatedAt: '2025-01-01T00:00:00.000Z',
      history: [],
    })

    const result = await saveGuestOverride('alice@example.com', [{ name: 'New Guest' }])

    expect(result.guests).toEqual([{ name: 'New Guest' }])
    expect(result.history).toEqual([{ guests: [{ name: 'Old Guest' }], updatedAt: '2025-01-01T00:00:00.000Z' }])
  })

  it('caps history at 5 entries, dropping the oldest', async () => {
    const existingHistory = Array.from({ length: 5 }, (_, i) => ({
      guests: [{ name: `Guest ${i}` }],
      updatedAt: `2020-0${(i % 9) + 1}-01T00:00:00.000Z`,
    }))
    mockGet.mockResolvedValue({
      guests: [{ name: 'Current Guest' }],
      updatedAt: '2025-06-01T00:00:00.000Z',
      history: existingHistory,
    })

    const result = await saveGuestOverride('alice@example.com', [{ name: 'Newest Guest' }])

    expect(result.history).toHaveLength(5)
    expect(result.history[0]).toEqual({ guests: [{ name: 'Current Guest' }], updatedAt: '2025-06-01T00:00:00.000Z' })
    // The oldest of the previous 5 history entries should have been dropped
    expect(result.history[4]).toEqual(existingHistory[3])
  })

  it('normalizes the key used to read and write the blob', async () => {
    mockGet.mockResolvedValue(null)
    await saveGuestOverride('  Alice@Example.COM  ', [])

    expect(mockGet).toHaveBeenCalledWith('alice@example.com', { type: 'json' })
    expect(mockSetJSON).toHaveBeenCalledWith('alice@example.com', expect.any(Object))
  })
})

describe('migrateGuestOverrideKey', () => {
  beforeEach(() => {
    mockGet.mockReset()
    mockSetJSON.mockReset()
    mockList.mockReset()
    mockDelete.mockReset()
    mockGetStore.mockClear()
  })

  it('does nothing when no override exists under the old key', async () => {
    mockGet.mockResolvedValue(null)
    await migrateGuestOverrideKey('old@example.com', 'new@example.com')

    expect(mockSetJSON).not.toHaveBeenCalled()
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('copies the override to the new key and deletes the old one, unchanged', async () => {
    const existing = { guests: [{ name: 'Bob' }], updatedAt: '2026-01-01T00:00:00.000Z', history: [] }
    mockGet.mockResolvedValue(existing)

    await migrateGuestOverrideKey('old@example.com', 'new@example.com')

    expect(mockGet).toHaveBeenCalledWith('old@example.com', { type: 'json' })
    expect(mockSetJSON).toHaveBeenCalledWith('new@example.com', existing)
    expect(mockDelete).toHaveBeenCalledWith('old@example.com')
  })

  it('normalizes both keys before comparing/migrating', async () => {
    mockGet.mockResolvedValue(null)
    await migrateGuestOverrideKey('  Old@Example.COM  ', '  old@example.com  ')

    // Normalized keys are identical, so nothing should happen
    expect(mockGet).not.toHaveBeenCalled()
    expect(mockSetJSON).not.toHaveBeenCalled()
    expect(mockDelete).not.toHaveBeenCalled()
  })
})
