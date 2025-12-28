import React from 'react'
import { render, screen, fireEvent, waitFor } from '../test-utils'
import userEvent from '@testing-library/user-event'
import RsvpForm from '../components/RsvpForm'

/**
 * Integration tests for the RsvpForm component.
 *
 * These tests verify the full component behavior including:
 * - UI rendering
 * - User interactions
 * - Form validation feedback
 * - Submission flow
 *
 * For unit tests of individual pieces, see:
 * - rsvpApi.test.ts (API functions)
 * - useRsvpForm.test.ts (hook logic)
 */

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

// Mock toast
const mockToast = jest.fn()
jest.mock('@chakra-ui/react', () => {
  const actual = jest.requireActual('@chakra-ui/react')
  return {
    ...actual,
    useToast: () => mockToast,
  }
})

// Note: Tests use translation keys since the i18n mock returns keys as-is
describe('RsvpForm Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.store = {}
    mockLocalStorage.getItem.mockImplementation((key: string) => mockLocalStorage.store[key] || null)
  })

  describe('Rendering', () => {
    it('renders the form with all required fields', () => {
      render(<RsvpForm />)
      
      expect(screen.getByText('rsvp.label')).toBeInTheDocument()
      expect(screen.getByText('rsvp.form.yourName')).toBeInTheDocument()
      expect(screen.getByText('rsvp.form.email')).toBeInTheDocument()
      expect(screen.getByText('rsvp.form.mailingAddress')).toBeInTheDocument()
      expect(screen.getByText('rsvp.form.willYouJoin')).toBeInTheDocument()
    })

    it('renders the RSVP header section', () => {
      render(<RsvpForm />)
      
      expect(screen.getByRole('heading', { name: 'rsvp.title' })).toBeInTheDocument()
      expect(screen.getByText('rsvp.description')).toBeInTheDocument()
    })

    it('renders optional fields', () => {
      render(<RsvpForm />)
      
      expect(screen.getByText('rsvp.form.accommodation')).toBeInTheDocument()
      expect(screen.getByText('rsvp.form.travel')).toBeInTheDocument()
      expect(screen.getByText('rsvp.form.dietary')).toBeInTheDocument()
      expect(screen.getByText('rsvp.form.plusOneSection')).toBeInTheDocument()
      expect(screen.getByText('rsvp.form.childrenSection')).toBeInTheDocument()
      expect(screen.getByText('rsvp.form.additionalNotes')).toBeInTheDocument()
    })

    it('renders submit button', () => {
      render(<RsvpForm />)
      
      expect(screen.getByRole('button', { name: 'rsvp.form.submit' })).toBeInTheDocument()
    })

    it('renders France tips checkbox', () => {
      render(<RsvpForm />)
      
      expect(screen.getByText('rsvp.form.franceTips')).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('shows error when submitting without name', async () => {
      const user = userEvent.setup()
      render(<RsvpForm />)
      
      const submitButton = screen.getByRole('button', { name: 'rsvp.form.submit' })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('rsvp.validation.nameRequired')).toBeInTheDocument()
      })
    })

    it('shows error when submitting without email', async () => {
      const user = userEvent.setup()
      render(<RsvpForm />)
      
      const nameInput = screen.getByPlaceholderText('rsvp.form.namePlaceholder')
      await user.type(nameInput, 'John Doe')
      
      const submitButton = screen.getByRole('button', { name: 'rsvp.form.submit' })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('rsvp.validation.emailRequired')).toBeInTheDocument()
      })
    })

    it('shows error when submitting without likelihood selection', async () => {
      const user = userEvent.setup()
      render(<RsvpForm />)
      
      const nameInput = screen.getByPlaceholderText('rsvp.form.namePlaceholder')
      await user.type(nameInput, 'John Doe')
      
      const emailInput = screen.getByPlaceholderText('rsvp.form.emailPlaceholder')
      await user.type(emailInput, 'john@example.com')

      const addressInput = screen.getByPlaceholderText('rsvp.form.mailingAddressPlaceholder')
      await user.type(addressInput, '123 Main St, City')
      
      const submitButton = screen.getByRole('button', { name: 'rsvp.form.submit' })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('rsvp.validation.likelihoodRequired')).toBeInTheDocument()
      })
    })

    it('validates email format', async () => {
      const user = userEvent.setup()
      render(<RsvpForm />)
      
      const emailInput = screen.getByPlaceholderText('rsvp.form.emailPlaceholder')
      await user.type(emailInput, 'invalid-email')
      fireEvent.blur(emailInput)
      
      await waitFor(() => {
        expect(screen.getByText('rsvp.validation.emailRequired')).toBeInTheDocument()
      })
    })

    it('clears email error when valid email is entered', async () => {
      const user = userEvent.setup()
      render(<RsvpForm />)
      
      const emailInput = screen.getByPlaceholderText('rsvp.form.emailPlaceholder')
      await user.type(emailInput, 'invalid')
      fireEvent.blur(emailInput)
      
      await waitFor(() => {
        expect(screen.getByText('rsvp.validation.emailRequired')).toBeInTheDocument()
      })
      
      await user.clear(emailInput)
      await user.type(emailInput, 'valid@email.com')
      fireEvent.blur(emailInput)
      
      await waitFor(() => {
        expect(screen.queryByText('rsvp.validation.emailRequired')).not.toBeInTheDocument()
      })
    })
  })

  describe('Conditional Event Selection', () => {
    it('shows event selection when user selects "Joyfully Accept"', async () => {
      const user = userEvent.setup()
      render(<RsvpForm />)
      
      const likelihoodSelect = screen.getByRole('combobox', { name: 'rsvp.form.willYouJoin' })
      await user.selectOptions(likelihoodSelect, 'definitely')
      
      await waitFor(() => {
        expect(screen.getByText('rsvp.form.eventsTitle')).toBeInTheDocument()
      })
    })

    it('shows event selection when user selects "Likely to Attend"', async () => {
      const user = userEvent.setup()
      render(<RsvpForm />)
      
      const likelihoodSelect = screen.getByRole('combobox', { name: 'rsvp.form.willYouJoin' })
      await user.selectOptions(likelihoodSelect, 'highly_likely')
      
      await waitFor(() => {
        expect(screen.getByText('rsvp.form.eventsTitle')).toBeInTheDocument()
      })
    })

    it('shows event selection when user selects "Not Yet Certain"', async () => {
      const user = userEvent.setup()
      render(<RsvpForm />)
      
      const likelihoodSelect = screen.getByRole('combobox', { name: 'rsvp.form.willYouJoin' })
      await user.selectOptions(likelihoodSelect, 'maybe')
      
      await waitFor(() => {
        expect(screen.getByText('rsvp.form.eventsTitle')).toBeInTheDocument()
      })
    })

    it('hides event selection when user selects "Regretfully Decline"', async () => {
      const user = userEvent.setup()
      render(<RsvpForm />)
      
      const likelihoodSelect = screen.getByRole('combobox', { name: 'rsvp.form.willYouJoin' })
      await user.selectOptions(likelihoodSelect, 'no')
      
      await waitFor(() => {
        expect(screen.queryByText('rsvp.form.eventsTitle')).not.toBeInTheDocument()
      })
    })

    it('does not show event validation error until submit', async () => {
      const user = userEvent.setup()
      render(<RsvpForm />)

      const likelihoodSelect = screen.getByRole('combobox', { name: 'rsvp.form.willYouJoin' })
      await user.selectOptions(likelihoodSelect, 'definitely')

      // Event section appears, but the error message should not.
      expect(await screen.findByText('rsvp.form.eventsTitle')).toBeInTheDocument()
      expect(screen.queryByText('rsvp.validation.eventRequired')).not.toBeInTheDocument()
    })

    it('requires at least one event when definitely attending', async () => {
      const user = userEvent.setup()
      render(<RsvpForm />)
      
      await user.type(screen.getByPlaceholderText('rsvp.form.namePlaceholder'), 'John Doe')
      await user.type(screen.getByPlaceholderText('rsvp.form.emailPlaceholder'), 'john@example.com')
      await user.type(screen.getByPlaceholderText('rsvp.form.mailingAddressPlaceholder'), '123 Main St, City')
      await user.selectOptions(screen.getByRole('combobox', { name: 'rsvp.form.willYouJoin' }), 'definitely')
      
      const submitButton = screen.getByRole('button', { name: 'rsvp.form.submit' })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('rsvp.validation.eventRequired')).toBeInTheDocument()
      })
    })
  })

  describe('Plus One & Children', () => {
    it('shows plus one fields when enabled', async () => {
      const user = userEvent.setup()
      render(<RsvpForm />)

      const plusOneCheckbox = screen.getByRole('checkbox', { name: 'rsvp.form.hasPlusOne' })
      await user.click(plusOneCheckbox)

      expect(screen.getByPlaceholderText('rsvp.form.plusOneNamePlaceholder')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('rsvp.form.plusOneDietaryPlaceholder')).toBeInTheDocument()
    })

    it('validates plus one name when enabled', async () => {
      const user = userEvent.setup()
      render(<RsvpForm />)

      await user.type(screen.getByPlaceholderText('rsvp.form.namePlaceholder'), 'John Doe')
      await user.type(screen.getByPlaceholderText('rsvp.form.emailPlaceholder'), 'john@example.com')
      await user.type(screen.getByPlaceholderText('rsvp.form.mailingAddressPlaceholder'), '123 Main St, City')
      await user.selectOptions(screen.getByRole('combobox', { name: 'rsvp.form.willYouJoin' }), 'no')

      const plusOneCheckbox = screen.getByRole('checkbox', { name: 'rsvp.form.hasPlusOne' })
      await user.click(plusOneCheckbox)

      const submitButton = screen.getByRole('button', { name: 'rsvp.form.submit' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('rsvp.validation.plusOneNameRequired')).toBeInTheDocument()
      })
    })

    it('shows children section and allows adding a child', async () => {
      const user = userEvent.setup()
      render(<RsvpForm />)

      const childrenCheckbox = screen.getByRole('checkbox', { name: 'rsvp.form.hasChildren' })
      await user.click(childrenCheckbox)

      const addChildButton = screen.getByRole('button', { name: 'rsvp.form.addChild' })
      await user.click(addChildButton)

      expect(screen.getByPlaceholderText('rsvp.form.childName')).toBeInTheDocument()
    })

    it('validates that at least one child is added when children is enabled', async () => {
      const user = userEvent.setup()
      render(<RsvpForm />)

      await user.type(screen.getByPlaceholderText('rsvp.form.namePlaceholder'), 'John Doe')
      await user.type(screen.getByPlaceholderText('rsvp.form.emailPlaceholder'), 'john@example.com')
      await user.type(screen.getByPlaceholderText('rsvp.form.mailingAddressPlaceholder'), '123 Main St, City')
      await user.selectOptions(screen.getByRole('combobox', { name: 'rsvp.form.willYouJoin' }), 'no')

      const childrenCheckbox = screen.getByRole('checkbox', { name: 'rsvp.form.hasChildren' })
      await user.click(childrenCheckbox)

      const submitButton = screen.getByRole('button', { name: 'rsvp.form.submit' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('rsvp.validation.childrenRequired')).toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('saves RSVP to localStorage on successful submission', async () => {
      const user = userEvent.setup()
      render(<RsvpForm />)
      
      await user.type(screen.getByPlaceholderText('rsvp.form.namePlaceholder'), 'John Doe')
      await user.type(screen.getByPlaceholderText('rsvp.form.emailPlaceholder'), 'john@example.com')
      await user.type(screen.getByPlaceholderText('rsvp.form.mailingAddressPlaceholder'), '123 Main St, City')
      await user.selectOptions(screen.getByRole('combobox', { name: 'rsvp.form.willYouJoin' }), 'no')
      
      const submitButton = screen.getByRole('button', { name: 'rsvp.form.submit' })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'rsvps',
          expect.any(String)
        )
      })
    })

    it('dispatches custom event on submission', async () => {
      const user = userEvent.setup()
      const dispatchSpy = jest.spyOn(window, 'dispatchEvent')
      render(<RsvpForm />)
      
      await user.type(screen.getByPlaceholderText('rsvp.form.namePlaceholder'), 'John Doe')
      await user.type(screen.getByPlaceholderText('rsvp.form.emailPlaceholder'), 'john@example.com')
      await user.type(screen.getByPlaceholderText('rsvp.form.mailingAddressPlaceholder'), '123 Main St, City')
      await user.selectOptions(screen.getByRole('combobox', { name: 'rsvp.form.willYouJoin' }), 'no')
      
      const submitButton = screen.getByRole('button', { name: 'rsvp.form.submit' })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(dispatchSpy).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'rsvp:submitted' })
        )
      })
      
      dispatchSpy.mockRestore()
    })
  })

  describe('Optional Fields', () => {
    it('allows selecting accommodation preference', async () => {
      const user = userEvent.setup()
      render(<RsvpForm />)
      
      const accommodationSelect = screen.getByRole('combobox', { name: 'rsvp.form.accommodation' })
      await user.selectOptions(accommodationSelect, 'venue')
      
      expect(accommodationSelect).toHaveValue('venue')
    })

    it('allows selecting travel arrangements', async () => {
      const user = userEvent.setup()
      render(<RsvpForm />)
      
      const travelSelect = screen.getByRole('combobox', { name: 'rsvp.form.travel' })
      await user.selectOptions(travelSelect, 'rent_car')
      
      expect(travelSelect).toHaveValue('rent_car')
    })

    it('allows entering dietary requirements', async () => {
      const user = userEvent.setup()
      render(<RsvpForm />)
      
      const dietaryInput = screen.getByPlaceholderText('rsvp.form.dietaryPlaceholder')
      await user.type(dietaryInput, 'Vegetarian')
      
      expect(dietaryInput).toHaveValue('Vegetarian')
    })

    it('allows checking France tips checkbox', async () => {
      const user = userEvent.setup()
      render(<RsvpForm />)
      
      const checkbox = screen.getByRole('checkbox', { name: 'rsvp.form.franceTips' })
      await user.click(checkbox)
      
      expect(checkbox).toBeChecked()
    })

    it('allows entering additional notes', async () => {
      const user = userEvent.setup()
      render(<RsvpForm />)
      
      const notesTextarea = screen.getByPlaceholderText('rsvp.form.notesPlaceholder')
      await user.type(notesTextarea, 'Looking forward to it!')
      
      expect(notesTextarea).toHaveValue('Looking forward to it!')
    })
  })
})
