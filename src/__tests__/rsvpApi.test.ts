import {
  loadRsvps,
  saveRsvps,
  fetchAddressSuggestions,
  validateMailingAddress,
  sendConfirmationEmail,
  submitToNetlifyForms,
} from '../components/RsvpForm/rsvpApi'
import type { Rsvp } from '../components/RsvpForm/types'

// Mock localStorage
const mockLocalStorage: {
  store: Record<string, string>
  getItem: jest.Mock<string | null, [string]>
  setItem: jest.Mock<void, [string, string]>
  removeItem: jest.Mock<void, [string]>
  clear: jest.Mock<void, []>
} = {
  store: {} as Record<string, string>,
  getItem: jest.fn((key: string): string | null => mockLocalStorage.store[key] ?? null),
  setItem: jest.fn((key: string, value: string): void => {
    mockLocalStorage.store[key] = value
  }),
  removeItem: jest.fn((key: string): void => {
    delete mockLocalStorage.store[key]
  }),
  clear: jest.fn((): void => {
    mockLocalStorage.store = {}
  }),
}

Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })

// Mock fetch
const mockFetch = jest.fn() as jest.Mock
global.fetch = mockFetch

describe('rsvpApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.store = {}
    mockLocalStorage.getItem.mockImplementation(
      (key: string) => mockLocalStorage.store[key] ?? null
    )
  })

  describe('loadRsvps', () => {
    it('returns empty array when localStorage is empty', () => {
      const result = loadRsvps()
      expect(result).toEqual([])
    })

    it('returns parsed RSVPs from localStorage', () => {
      const rsvps: Rsvp[] = [
        {
          id: '1',
          firstName: 'John',
          email: 'john@example.com',
          likelihood: 'definitely',
          guests: [],
          timestamp: Date.now(),
        },
      ]
      mockLocalStorage.store['rsvps'] = JSON.stringify(rsvps)

      const result = loadRsvps()
      expect(result).toEqual(rsvps)
    })

    it('returns empty array on JSON parse error', () => {
      mockLocalStorage.store['rsvps'] = 'invalid json'
      const result = loadRsvps()
      expect(result).toEqual([])
    })
  })

  describe('saveRsvps', () => {
    it('saves RSVPs to localStorage', () => {
      const rsvps: Rsvp[] = [
        {
          id: '1',
          firstName: 'Jane',
          email: 'jane@example.com',
          likelihood: 'maybe',
          guests: [],
          timestamp: Date.now(),
        },
      ]

      saveRsvps(rsvps)

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('rsvps', JSON.stringify(rsvps))
    })
  })

  describe('fetchAddressSuggestions', () => {
    it('returns suggestions on successful response', async () => {
      const predictions = [
        { description: '123 Main St', placeId: 'abc123' },
        { description: '456 Oak Ave', placeId: 'def456' },
      ]
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ok: true, predictions }),
      })

      const result = await fetchAddressSuggestions('123 Main', 'en')

      expect(result).toEqual({ suggestions: predictions, rateLimited: false })
      expect(mockFetch).toHaveBeenCalledWith('/.netlify/functions/places-autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: '123 Main', language: 'en' }),
        signal: undefined,
      })
    })

    it('returns rateLimited flag on 429 response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({}),
      })

      const result = await fetchAddressSuggestions('test', 'en')

      expect(result).toEqual({ suggestions: [], rateLimited: true })
    })

    it('returns empty suggestions on error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ ok: false }),
      })

      const result = await fetchAddressSuggestions('test', 'en')

      expect(result).toEqual({ suggestions: [], rateLimited: false })
    })

    it('returns empty suggestions on fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await fetchAddressSuggestions('test', 'en')

      expect(result).toEqual({ suggestions: [], rateLimited: false })
    })

    it('passes AbortSignal to fetch', async () => {
      const controller = new AbortController()
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ok: true, predictions: [] }),
      })

      await fetchAddressSuggestions('test', 'en', controller.signal)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ signal: controller.signal })
      )
    })
  })

  describe('validateMailingAddress', () => {
    it('returns validation result on success', async () => {
      const validationResult = {
        ok: true,
        formattedAddress: '123 Main Street, City, ST 12345',
        verdict: { addressComplete: true },
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => validationResult,
      })

      const result = await validateMailingAddress('123 Main St')

      expect(result).toEqual(validationResult)
      expect(mockFetch).toHaveBeenCalledWith('/.netlify/functions/validate-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: '123 Main St' }),
      })
    })

    it('returns null on error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ ok: false, error: 'Invalid address' }),
      })

      const result = await validateMailingAddress('invalid')

      expect(result).toBeNull()
    })

    it('returns null on fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await validateMailingAddress('test')

      expect(result).toBeNull()
    })
  })

  describe('sendConfirmationEmail', () => {
    const rsvpData = {
      firstName: 'John',
      email: 'john@example.com',
      likelihood: 'definitely' as const,
      guests: [],
      locale: 'en',
    }

    it('sends POST request with RSVP data', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })

      await sendConfirmationEmail(rsvpData)

      expect(mockFetch).toHaveBeenCalledWith('/.netlify/functions/send-rsvp-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rsvpData),
      })
    })

    it('logs error on failed response', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: async () => 'Server error',
      })

      await sendConfirmationEmail(rsvpData)

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to send confirmation email:',
        'Server error'
      )
      consoleSpy.mockRestore()
    })

    it('handles fetch error silently', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await sendConfirmationEmail(rsvpData)

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error sending confirmation email:',
        expect.any(Error)
      )
      consoleSpy.mockRestore()
    })
  })

  describe('submitToNetlifyForms', () => {
    const rsvpEntry: Rsvp = {
      id: '123',
      firstName: 'Jane',
      email: 'jane@example.com',
      mailingAddress: '123 Main St',
      mailingAddressPlaceId: 'place123',
      likelihood: 'definitely',
      events: { welcome: 'yes', ceremony: 'yes', brunch: 'no' },
      accommodation: 'venue',
      travelPlan: 'rent_car',
      guests: [{ name: 'John', dietary: 'vegetarian' }],
      dietary: 'none',
      franceTips: true,
      additionalNotes: 'Looking forward!',
      timestamp: Date.now(),
    }

    it('submits form data to Netlify', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })

      await submitToNetlifyForms(rsvpEntry)

      expect(mockFetch).toHaveBeenCalledWith('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: expect.any(String),
      })

      // Body is a URL-encoded string, parse it to verify contents
      const body = mockFetch.mock.calls[0]![1].body as string
      const params = new URLSearchParams(body)
      expect(params.get('form-name')).toBe('rsvp')
      expect(params.get('firstName')).toBe('Jane')
      expect(params.get('email')).toBe('jane@example.com')
      expect(params.get('likelihood')).toBe('definitely')
      expect(params.get('franceTips')).toBe('true')
    })

    it('handles missing optional fields', async () => {
      const minimalEntry: Rsvp = {
        id: '456',
        firstName: 'Bob',
        email: 'bob@example.com',
        likelihood: 'no',
        guests: [],
        timestamp: Date.now(),
      }
      mockFetch.mockResolvedValueOnce({ ok: true })

      await submitToNetlifyForms(minimalEntry)

      // Body is a URL-encoded string, parse it to verify contents
      const body = mockFetch.mock.calls[0]![1].body as string
      const params = new URLSearchParams(body)
      expect(params.get('mailingAddress')).toBe('')
      expect(params.get('accommodation')).toBe('')
      expect(params.get('franceTips')).toBe('false')
    })
  })
})
