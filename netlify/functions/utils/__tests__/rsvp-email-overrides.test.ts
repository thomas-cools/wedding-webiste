/**
 * @jest-environment node
 */

const mockGet = jest.fn()
const mockSetJSON = jest.fn()
const mockList = jest.fn()
const mockGetStore = jest.fn((...args: unknown[]) => ({
  get: mockGet,
  setJSON: mockSetJSON,
  list: mockList,
}))

jest.mock('@netlify/blobs', () => ({
  getStore: (...args: unknown[]) => mockGetStore(...args),
}))

import {
  getEmailOverride,
  getAllEmailOverrides,
  saveEmailOverride,
} from '../rsvp-email-overrides'

describe('getEmailOverride', () => {
  beforeEach(() => {
    mockGet.mockReset()
    mockSetJSON.mockReset()
    mockList.mockReset()
    mockGetStore.mockClear()
  })

  it('returns null when no override exists', async () => {
    mockGet.mockResolvedValue(null)
    const result = await getEmailOverride('sub-1')
    expect(result).toBeNull()
    expect(mockGet).toHaveBeenCalledWith('sub-1', { type: 'json' })
  })

  it('looks the override up by the raw submission id (no normalization)', async () => {
    mockGet.mockResolvedValue({ email: 'alice@example.com', updatedAt: '2026-01-01T00:00:00.000Z', history: [] })
    const result = await getEmailOverride('sub-1')
    expect(result?.email).toBe('alice@example.com')
    expect(mockGet).toHaveBeenCalledWith('sub-1', { type: 'json' })
  })
})

describe('getAllEmailOverrides', () => {
  beforeEach(() => {
    mockGet.mockReset()
    mockSetJSON.mockReset()
    mockList.mockReset()
    mockGetStore.mockClear()
  })

  it('returns an empty map when the store has no blobs', async () => {
    mockList.mockResolvedValue({ blobs: [] })
    const result = await getAllEmailOverrides()
    expect(result.size).toBe(0)
  })

  it('fetches every listed key and keys the map by submission id', async () => {
    mockList.mockResolvedValue({ blobs: [{ key: 'sub-1' }, { key: 'sub-2' }] })
    mockGet.mockImplementation((key: string) =>
      Promise.resolve({ email: `${key}@example.com`, updatedAt: '2026-01-01T00:00:00.000Z', history: [] })
    )

    const result = await getAllEmailOverrides()
    expect(result.size).toBe(2)
    expect(result.get('sub-1')?.email).toBe('sub-1@example.com')
    expect(result.get('sub-2')?.email).toBe('sub-2@example.com')
  })

  it('skips keys that resolve to null', async () => {
    mockList.mockResolvedValue({ blobs: [{ key: 'ghost' }] })
    mockGet.mockResolvedValue(null)

    const result = await getAllEmailOverrides()
    expect(result.size).toBe(0)
  })
})

describe('saveEmailOverride', () => {
  beforeEach(() => {
    mockGet.mockReset()
    mockSetJSON.mockReset()
    mockList.mockReset()
    mockGetStore.mockClear()
  })

  it('saves a fresh override with empty history when none existed', async () => {
    mockGet.mockResolvedValue(null)

    const result = await saveEmailOverride('sub-1', 'alice@example.com')

    expect(result.email).toBe('alice@example.com')
    expect(result.history).toEqual([])
    expect(mockSetJSON).toHaveBeenCalledWith('sub-1', result)
  })

  it('prepends the previous state onto history', async () => {
    mockGet.mockResolvedValue({
      email: 'alcie@example.com',
      updatedAt: '2025-01-01T00:00:00.000Z',
      history: [],
    })

    const result = await saveEmailOverride('sub-1', 'alice@example.com')

    expect(result.email).toBe('alice@example.com')
    expect(result.history).toEqual([{ email: 'alcie@example.com', updatedAt: '2025-01-01T00:00:00.000Z' }])
  })

  it('caps history at 5 entries, dropping the oldest', async () => {
    const existingHistory = Array.from({ length: 5 }, (_, i) => ({
      email: `typo-${i}@example.com`,
      updatedAt: `2020-0${(i % 9) + 1}-01T00:00:00.000Z`,
    }))
    mockGet.mockResolvedValue({
      email: 'current@example.com',
      updatedAt: '2025-06-01T00:00:00.000Z',
      history: existingHistory,
    })

    const result = await saveEmailOverride('sub-1', 'newest@example.com')

    expect(result.history).toHaveLength(5)
    expect(result.history[0]).toEqual({ email: 'current@example.com', updatedAt: '2025-06-01T00:00:00.000Z' })
    expect(result.history[4]).toEqual(existingHistory[3])
  })
})
