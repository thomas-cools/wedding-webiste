import { renderHook, act, waitFor } from '@testing-library/react'
import { useRsvpForm } from '../components/RsvpForm/useRsvpForm'
import * as rsvpApi from '../components/RsvpForm/rsvpApi'
import type { Rsvp } from '../components/RsvpForm/types'

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}))

// Mock the rsvpApi module
jest.mock('../components/RsvpForm/rsvpApi', () => ({
  loadRsvps: jest.fn(() => []),
  saveRsvps: jest.fn(),
  fetchAddressSuggestions: jest.fn(() =>
    Promise.resolve({ suggestions: [], rateLimited: false })
  ),
  validateMailingAddress: jest.fn(() => Promise.resolve(null)),
  sendConfirmationEmail: jest.fn(() => Promise.resolve()),
  submitToNetlifyForms: jest.fn(() => Promise.resolve()),
}))

const mockedRsvpApi = rsvpApi as jest.Mocked<typeof rsvpApi>

describe('useRsvpForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedRsvpApi.loadRsvps.mockReturnValue([])
  })

  describe('initial state', () => {
    it('initializes with empty form fields', () => {
      const { result } = renderHook(() => useRsvpForm())

      expect(result.current.firstName).toBe('')
      expect(result.current.email).toBe('')
      expect(result.current.mailingAddress).toBe('')
      expect(result.current.likelihood).toBe('')
      expect(result.current.events).toEqual({ welcome: '', ceremony: '', brunch: '' })
      expect(result.current.accommodation).toBe('')
      expect(result.current.travelPlan).toBe('')
      expect(result.current.dietary).toBe('')
      expect(result.current.franceTips).toBe(false)
      expect(result.current.additionalNotes).toBe('')
    })

    it('initializes plus one as disabled', () => {
      const { result } = renderHook(() => useRsvpForm())

      expect(result.current.hasPlusOne).toBe(false)
      expect(result.current.plusOne).toEqual({ name: '', dietary: '' })
    })

    it('initializes children as disabled with empty array', () => {
      const { result } = renderHook(() => useRsvpForm())

      expect(result.current.hasChildren).toBe(false)
      expect(result.current.children).toEqual([])
    })

    it('initializes status as null', () => {
      const { result } = renderHook(() => useRsvpForm())

      expect(result.current.status).toBeNull()
    })

    it('initializes with no errors and hasAttemptedSubmit as false', () => {
      const { result } = renderHook(() => useRsvpForm())

      expect(result.current.errors).toEqual({})
      expect(result.current.hasAttemptedSubmit).toBe(false)
    })
  })

  describe('form field updates', () => {
    it('updates firstName', () => {
      const { result } = renderHook(() => useRsvpForm())

      act(() => {
        result.current.setFirstName('John')
      })

      expect(result.current.firstName).toBe('John')
    })

    it('updates email', () => {
      const { result } = renderHook(() => useRsvpForm())

      act(() => {
        result.current.setEmail('john@example.com')
      })

      expect(result.current.email).toBe('john@example.com')
    })

    it('updates likelihood', () => {
      const { result } = renderHook(() => useRsvpForm())

      act(() => {
        result.current.setLikelihood('definitely')
      })

      expect(result.current.likelihood).toBe('definitely')
    })

    it('updates event answers', () => {
      const { result } = renderHook(() => useRsvpForm())

      act(() => {
        result.current.setEventAnswer('welcome', 'yes')
        result.current.setEventAnswer('ceremony', 'arriving_late')
        result.current.setEventAnswer('brunch', 'no')
      })

      expect(result.current.events).toEqual({
        welcome: 'yes',
        ceremony: 'arriving_late',
        brunch: 'no',
      })
    })

    it('updates accommodation', () => {
      const { result } = renderHook(() => useRsvpForm())

      act(() => {
        result.current.setAccommodation('venue')
      })

      expect(result.current.accommodation).toBe('venue')
    })

    it('updates travelPlan', () => {
      const { result } = renderHook(() => useRsvpForm())

      act(() => {
        result.current.setTravelPlan('rent_car')
      })

      expect(result.current.travelPlan).toBe('rent_car')
    })

    it('updates franceTips', () => {
      const { result } = renderHook(() => useRsvpForm())

      act(() => {
        result.current.setFranceTips(true)
      })

      expect(result.current.franceTips).toBe(true)
    })
  })

  describe('plus one management', () => {
    it('enables plus one', () => {
      const { result } = renderHook(() => useRsvpForm())

      act(() => {
        result.current.setHasPlusOne(true)
      })

      expect(result.current.hasPlusOne).toBe(true)
    })

    it('updates plus one name and dietary', () => {
      const { result } = renderHook(() => useRsvpForm())

      act(() => {
        result.current.setHasPlusOne(true)
        result.current.setPlusOne({ name: 'Jane Doe', dietary: 'vegetarian' })
      })

      expect(result.current.plusOne).toEqual({ name: 'Jane Doe', dietary: 'vegetarian' })
    })

    it('supports functional update for plusOne', () => {
      const { result } = renderHook(() => useRsvpForm())

      act(() => {
        result.current.setPlusOne({ name: 'Initial', dietary: '' })
      })

      act(() => {
        result.current.setPlusOne(prev => ({ ...prev, dietary: 'vegan' }))
      })

      expect(result.current.plusOne).toEqual({ name: 'Initial', dietary: 'vegan' })
    })
  })

  describe('children management', () => {
    it('adds a child', () => {
      const { result } = renderHook(() => useRsvpForm())

      act(() => {
        result.current.setHasChildren(true)
        result.current.addChild()
      })

      expect(result.current.children).toHaveLength(1)
      expect(result.current.children[0]).toEqual({ name: '', dietary: '' })
    })

    it('updates a child', () => {
      const { result } = renderHook(() => useRsvpForm())

      act(() => {
        result.current.setHasChildren(true)
        result.current.addChild()
      })

      act(() => {
        result.current.updateChild(0, { name: 'Child 1', dietary: 'none' })
      })

      expect(result.current.children[0]).toEqual({ name: 'Child 1', dietary: 'none' })
    })

    it('removes a child', () => {
      const { result } = renderHook(() => useRsvpForm())

      act(() => {
        result.current.setHasChildren(true)
        result.current.addChild()
        result.current.addChild()
      })

      expect(result.current.children).toHaveLength(2)

      act(() => {
        result.current.removeChild(0)
      })

      expect(result.current.children).toHaveLength(1)
    })
  })

  describe('validation', () => {
    it('validates firstName as required', () => {
      const { result } = renderHook(() => useRsvpForm())

      act(() => {
        result.current.validateField('firstName')
      })

      expect(result.current.errors.firstName).toBe('rsvp.validation.nameRequired')
    })

    it('clears firstName error when valid', () => {
      const { result } = renderHook(() => useRsvpForm())

      // First set the name
      act(() => {
        result.current.setFirstName('John')
      })

      // Then validate in a separate act
      act(() => {
        result.current.validateField('firstName')
      })

      expect(result.current.errors.firstName).toBeUndefined()
    })

    it('validates email as required', () => {
      const { result } = renderHook(() => useRsvpForm())

      act(() => {
        result.current.validateField('email')
      })

      expect(result.current.errors.email).toBe('rsvp.validation.emailRequired')
    })

    it('validates email format', () => {
      const { result } = renderHook(() => useRsvpForm())

      act(() => {
        result.current.setEmail('invalid-email')
        result.current.validateField('email')
      })

      expect(result.current.errors.email).toBe('rsvp.validation.emailRequired')
    })

    it('clears email error for valid email', async () => {
      const { result } = renderHook(() => useRsvpForm())

      act(() => {
        result.current.setEmail('valid@example.com')
      })

      // Wait for any effects to settle
      await waitFor(() => {})

      act(() => {
        result.current.validateField('email')
      })

      expect(result.current.errors.email).toBeUndefined()
    })

    it('validates mailing address as required', () => {
      const { result } = renderHook(() => useRsvpForm())

      act(() => {
        result.current.validateField('mailingAddress')
      })

      expect(result.current.errors.mailingAddress).toBe('rsvp.validation.addressRequired')
    })

    it('validates likelihood as required', () => {
      const { result } = renderHook(() => useRsvpForm())

      act(() => {
        result.current.validateField('likelihood')
      })

      expect(result.current.errors.likelihood).toBe('rsvp.validation.likelihoodRequired')
    })

    it('validates plus one name when enabled', () => {
      const { result } = renderHook(() => useRsvpForm())

      // First enable plus one
      act(() => {
        result.current.setHasPlusOne(true)
      })

      // Then validate in a separate act
      act(() => {
        result.current.validateField('plusOne')
      })

      expect(result.current.errors.plusOne).toBe('rsvp.validation.plusOneNameRequired')
    })

    it('validates children required when enabled with none added', () => {
      const { result } = renderHook(() => useRsvpForm())

      act(() => {
        result.current.setHasChildren(true)
      })

      act(() => {
        result.current.validateField('children')
      })

      expect(result.current.errors.children).toBe('rsvp.validation.childrenRequired')
    })
  })

  describe('prefill from localStorage', () => {
    it('prefills form when email matches existing RSVP', async () => {
      const existingRsvp: Rsvp = {
        id: '123',
        firstName: 'Jane',
        email: 'jane@example.com',
        likelihood: 'definitely',
        events: { welcome: 'yes', ceremony: 'yes', brunch: 'no' },
        guests: [],
        dietary: 'vegetarian',
        timestamp: Date.now(),
      }
      mockedRsvpApi.loadRsvps.mockReturnValue([existingRsvp])

      const { result } = renderHook(() => useRsvpForm())

      act(() => {
        result.current.setEmail('jane@example.com')
      })

      await waitFor(() => {
        expect(result.current.firstName).toBe('Jane')
        expect(result.current.likelihood).toBe('definitely')
        expect(result.current.dietary).toBe('vegetarian')
      })
    })

    it('prefills plus one from guests array', async () => {
      const existingRsvp: Rsvp = {
        id: '123',
        firstName: 'John',
        email: 'john@example.com',
        likelihood: 'maybe',
        guests: [{ name: 'Partner Name', dietary: 'vegan' }],
        timestamp: Date.now(),
      }
      mockedRsvpApi.loadRsvps.mockReturnValue([existingRsvp])

      const { result } = renderHook(() => useRsvpForm())

      act(() => {
        result.current.setEmail('john@example.com')
      })

      await waitFor(() => {
        expect(result.current.hasPlusOne).toBe(true)
        expect(result.current.plusOne).toEqual({ name: 'Partner Name', dietary: 'vegan' })
      })
    })
  })

  describe('form submission', () => {
    it('sets hasAttemptedSubmit to true on submit', async () => {
      const { result } = renderHook(() => useRsvpForm())

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: jest.fn() } as unknown as React.FormEvent)
      })

      expect(result.current.hasAttemptedSubmit).toBe(true)
    })

    it('does not submit when form is invalid', async () => {
      const { result } = renderHook(() => useRsvpForm())

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: jest.fn() } as unknown as React.FormEvent)
      })

      expect(mockedRsvpApi.saveRsvps).not.toHaveBeenCalled()
    })

    it('saves RSVP on successful submission', async () => {
      const onSuccess = jest.fn()
      const { result } = renderHook(() => useRsvpForm({ onSuccess }))

      // Fill required fields
      act(() => {
        result.current.setFirstName('John Doe')
        result.current.setEmail('john@example.com')
        result.current.setMailingAddress('123 Main St')
        result.current.setLikelihood('no')
      })

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: jest.fn() } as unknown as React.FormEvent)
      })

      expect(mockedRsvpApi.saveRsvps).toHaveBeenCalled()
      expect(onSuccess).toHaveBeenCalled()
    })

    it('sets status to saved for new RSVP', async () => {
      const { result } = renderHook(() => useRsvpForm())

      act(() => {
        result.current.setFirstName('John Doe')
        result.current.setEmail('john@example.com')
        result.current.setMailingAddress('123 Main St')
        result.current.setLikelihood('no')
      })

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: jest.fn() } as unknown as React.FormEvent)
      })

      expect(result.current.status).toBe('saved')
    })

    it('sets status to updated for existing RSVP', async () => {
      const existingRsvp: Rsvp = {
        id: '123',
        firstName: 'John',
        email: 'john@example.com',
        mailingAddress: '123 Main St',
        likelihood: 'no',
        guests: [],
        timestamp: Date.now() - 10000,
      }
      mockedRsvpApi.loadRsvps.mockReturnValue([existingRsvp])

      const { result } = renderHook(() => useRsvpForm())

      // Set email to trigger prefill from existing RSVP
      act(() => {
        result.current.setEmail('john@example.com')
      })

      // Wait for prefill effect
      await waitFor(() => {
        expect(result.current.firstName).toBe('John')
      })

      // Update mailing address since it's required
      act(() => {
        result.current.setMailingAddress('123 Main St')
      })

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: jest.fn() } as unknown as React.FormEvent)
      })

      expect(result.current.status).toBe('updated')
    })

    it('validates events when likelihood is not "no"', async () => {
      const { result } = renderHook(() => useRsvpForm())

      act(() => {
        result.current.setFirstName('John Doe')
        result.current.setEmail('john@example.com')
        result.current.setMailingAddress('123 Main St')
        result.current.setLikelihood('definitely')
        // Don't select any events
      })

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: jest.fn() } as unknown as React.FormEvent)
      })

      expect(result.current.errors.events).toBe('rsvp.validation.eventRequired')
      expect(mockedRsvpApi.saveRsvps).not.toHaveBeenCalled()
    })
  })

  describe('address autocomplete', () => {
    it('selects address suggestion and clears suggestions', () => {
      const { result } = renderHook(() => useRsvpForm())

      act(() => {
        result.current.selectAddressSuggestion({
          description: '123 Main Street, City',
          placeId: 'place123',
        })
      })

      expect(result.current.mailingAddress).toBe('123 Main Street, City')
      expect(result.current.mailingAddressPlaceId).toBe('place123')
      expect(result.current.mailingAddressSuggestionsOpen).toBe(false)
    })
  })
})
