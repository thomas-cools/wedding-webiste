import { renderHook, act } from '@testing-library/react'
import { useFinalRsvpForm } from '../components/FinalRsvp/useFinalRsvpForm'
import * as finalRsvpApi from '../components/FinalRsvp/finalRsvpApi'

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
    i18n: { language: 'en' },
  }),
}))

// Mock the finalRsvpApi module
jest.mock('../components/FinalRsvp/finalRsvpApi', () => ({
  submitToNetlifyForms: jest.fn(() => Promise.resolve()),
  sendConfirmationEmail: jest.fn(() => Promise.resolve()),
  fetchAddressSuggestions: jest.fn(() => Promise.resolve({ suggestions: [], rateLimited: false })),
}))

const mockedFinalRsvpApi = finalRsvpApi as jest.Mocked<typeof finalRsvpApi>

describe('useFinalRsvpForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('initial state', () => {
    it('initializes one guest entry per party member, each with blank per-day events', () => {
      const { result } = renderHook(() =>
        useFinalRsvpForm({ initialPartyMembers: ['Alice', 'Bob'], initialEmail: 'alice@example.com' })
      )

      expect(result.current.guests).toHaveLength(2)
      expect(result.current.guests[0]).toMatchObject({
        name: 'Alice',
        isChild: false,
        events: { welcome: '', ceremony: '', brunch: '' },
        allergies: '',
      })
      expect(result.current.guests[1]).toMatchObject({
        name: 'Bob',
        isChild: false,
        events: { welcome: '', ceremony: '', brunch: '' },
        allergies: '',
      })
    })
  })

  describe('setGuestEventAnswer', () => {
    it('updates only the targeted guest and day, leaving other guests untouched', () => {
      const { result } = renderHook(() =>
        useFinalRsvpForm({ initialPartyMembers: ['Alice', 'Bob'] })
      )

      act(() => {
        result.current.setGuestEventAnswer(0, 'ceremony', 'yes')
      })

      expect(result.current.guests[0]!.events).toEqual({ welcome: '', ceremony: 'yes', brunch: '' })
      expect(result.current.guests[1]!.events).toEqual({ welcome: '', ceremony: '', brunch: '' })
    })

    it('allows two guests to have different answers for the same day', () => {
      const { result } = renderHook(() =>
        useFinalRsvpForm({ initialPartyMembers: ['Alice', 'Bob'] })
      )

      act(() => {
        result.current.setGuestEventAnswer(0, 'ceremony', 'yes')
        result.current.setGuestEventAnswer(1, 'ceremony', 'no')
      })

      expect(result.current.guests[0]!.events.ceremony).toBe('yes')
      expect(result.current.guests[1]!.events.ceremony).toBe('no')
    })
  })

  describe('validation', () => {
    it('blocks submit and reports a per-guest error when a guest has not answered every day', async () => {
      const { result } = renderHook(() =>
        useFinalRsvpForm({ initialPartyMembers: ['Alice', 'Bob'] })
      )

      act(() => {
        // Alice answers all 3 days, Bob only answers 2
        result.current.setGuestEventAnswer(0, 'welcome', 'yes')
        result.current.setGuestEventAnswer(0, 'ceremony', 'yes')
        result.current.setGuestEventAnswer(0, 'brunch', 'no')
        result.current.setGuestEventAnswer(1, 'welcome', 'yes')
        result.current.setGuestEventAnswer(1, 'ceremony', 'yes')
      })

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: () => {} } as React.FormEvent)
      })

      expect(result.current.errors.guest_0_events).toBeUndefined()
      expect(result.current.errors.guest_1_events).toBeDefined()
      expect(mockedFinalRsvpApi.submitToNetlifyForms).not.toHaveBeenCalled()
    })
  })

  describe('handleSubmit', () => {
    it('submits per-guest events distinctly when the party disagrees on a day', async () => {
      const { result } = renderHook(() =>
        useFinalRsvpForm({ initialPartyMembers: ['Alice', 'Bob'], initialEmail: 'alice@example.com' })
      )

      act(() => {
        result.current.setGuestEventAnswer(0, 'welcome', 'yes')
        result.current.setGuestEventAnswer(0, 'ceremony', 'yes')
        result.current.setGuestEventAnswer(0, 'brunch', 'yes')
        result.current.setGuestEventAnswer(1, 'welcome', 'no')
        result.current.setGuestEventAnswer(1, 'ceremony', 'no')
        result.current.setGuestEventAnswer(1, 'brunch', 'no')
        result.current.updateGuest(0, { appetizer: 'ceviche', main: 'bar' })
        result.current.updateGuest(1, { appetizer: 'gaspacho', main: 'tournedos' })
        result.current.setAccommodationType('chateau')
      })

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: () => {} } as React.FormEvent)
      })

      expect(mockedFinalRsvpApi.submitToNetlifyForms).toHaveBeenCalledTimes(1)
      const submittedEntry = mockedFinalRsvpApi.submitToNetlifyForms.mock.calls[0]![0]
      expect(submittedEntry.guests[0]!.events).toEqual({ welcome: 'yes', ceremony: 'yes', brunch: 'yes' })
      expect(submittedEntry.guests[1]!.events).toEqual({ welcome: 'no', ceremony: 'no', brunch: 'no' })
      expect(submittedEntry).not.toHaveProperty('events')
      expect(submittedEntry).not.toHaveProperty('arrivalDate')
      expect(submittedEntry).not.toHaveProperty('departureDate')
    })

    it('allows a guest to select the vegan main course and records their allergies', async () => {
      const { result } = renderHook(() =>
        useFinalRsvpForm({ initialPartyMembers: ['Alice', 'Bob'], initialEmail: 'alice@example.com' })
      )

      act(() => {
        result.current.setGuestEventAnswer(0, 'welcome', 'yes')
        result.current.setGuestEventAnswer(0, 'ceremony', 'yes')
        result.current.setGuestEventAnswer(0, 'brunch', 'yes')
        result.current.setGuestEventAnswer(1, 'welcome', 'yes')
        result.current.setGuestEventAnswer(1, 'ceremony', 'yes')
        result.current.setGuestEventAnswer(1, 'brunch', 'yes')
        result.current.updateGuest(0, { appetizer: 'gaspacho', main: 'vegan', allergies: 'peanut allergy' })
        result.current.updateGuest(1, { appetizer: 'ceviche', main: 'bar' })
        result.current.setAccommodationType('chateau')
      })

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: () => {} } as React.FormEvent)
      })

      expect(mockedFinalRsvpApi.submitToNetlifyForms).toHaveBeenCalledTimes(1)
      const submittedEntry = mockedFinalRsvpApi.submitToNetlifyForms.mock.calls[0]![0]
      expect(submittedEntry.guests[0]!.main).toBe('vegan')
      expect(submittedEntry.guests[0]!.allergies).toBe('peanut allergy')
      expect(submittedEntry.guests[1]!.allergies).toBe('')
    })
  })
})
