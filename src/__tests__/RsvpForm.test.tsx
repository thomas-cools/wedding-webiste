import React from 'react'
import { render, screen, fireEvent, waitFor } from '../test-utils'
import userEvent from '@testing-library/user-event'
import RsvpForm from '../components/RsvpForm'

// Mock localStorage
const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem: jest.fn((key: string) => mockLocalStorage.store[key] || null),
  setItem: jest.fn((key: string, value: string) => {
    mockLocalStorage.store[key] = value
  }),
  removeItem: jest.fn((key: string) => {
    delete mockLocalStorage.store[key]
  }),
  clear: jest.fn(() => {
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
describe('RsvpForm', () => {
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
      expect(screen.getByText('rsvp.form.songRequest')).toBeInTheDocument()
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

    it('requires at least one event when definitely attending', async () => {
      const user = userEvent.setup()
      render(<RsvpForm />)
      
      await user.type(screen.getByPlaceholderText('rsvp.form.namePlaceholder'), 'John Doe')
      await user.type(screen.getByPlaceholderText('rsvp.form.emailPlaceholder'), 'john@example.com')
      await user.selectOptions(screen.getByRole('combobox', { name: 'rsvp.form.willYouJoin' }), 'definitely')
      
      const submitButton = screen.getByRole('button', { name: 'rsvp.form.submit' })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('rsvp.validation.eventRequired')).toBeInTheDocument()
      })
    })
  })

  describe('Guest Management', () => {
    it('allows adding a guest', async () => {
      const user = userEvent.setup()
      render(<RsvpForm />)
      
      const addGuestButton = screen.getByRole('button', { name: 'rsvp.form.addGuest' })
      await user.click(addGuestButton)
      
      expect(screen.getByPlaceholderText('rsvp.form.guestName')).toBeInTheDocument()
    })

    it('allows adding multiple guests', async () => {
      const user = userEvent.setup()
      render(<RsvpForm />)
      
      const addGuestButton = screen.getByRole('button', { name: 'rsvp.form.addGuest' })
      await user.click(addGuestButton)
      await user.click(addGuestButton)
      
      // Both guests will have the same placeholder since i18n mock returns keys
      const guestInputs = screen.getAllByPlaceholderText('rsvp.form.guestName')
      expect(guestInputs.length).toBe(2)
    })

    it('allows removing a guest', async () => {
      const user = userEvent.setup()
      render(<RsvpForm />)
      
      const addGuestButton = screen.getByRole('button', { name: 'rsvp.form.addGuest' })
      await user.click(addGuestButton)
      
      expect(screen.getByPlaceholderText('rsvp.form.guestName')).toBeInTheDocument()
      
      const removeButton = screen.getByRole('button', { name: 'rsvp.form.remove' })
      await user.click(removeButton)
      
      expect(screen.queryByPlaceholderText('rsvp.form.guestName')).not.toBeInTheDocument()
    })

    it('validates guest names when guests are added', async () => {
      const user = userEvent.setup()
      render(<RsvpForm />)
      
      await user.type(screen.getByPlaceholderText('rsvp.form.namePlaceholder'), 'John Doe')
      await user.type(screen.getByPlaceholderText('rsvp.form.emailPlaceholder'), 'john@example.com')
      await user.selectOptions(screen.getByRole('combobox', { name: 'rsvp.form.willYouJoin' }), 'no')
      
      const addGuestButton = screen.getByRole('button', { name: 'rsvp.form.addGuest' })
      await user.click(addGuestButton)
      
      const submitButton = screen.getByRole('button', { name: 'rsvp.form.submit' })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('rsvp.validation.guestNameRequired')).toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('saves RSVP to localStorage on successful submission', async () => {
      const user = userEvent.setup()
      render(<RsvpForm />)
      
      await user.type(screen.getByPlaceholderText('rsvp.form.namePlaceholder'), 'John Doe')
      await user.type(screen.getByPlaceholderText('rsvp.form.emailPlaceholder'), 'john@example.com')
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

    it('allows entering song request', async () => {
      const user = userEvent.setup()
      render(<RsvpForm />)
      
      const songInput = screen.getByPlaceholderText('rsvp.form.songPlaceholder')
      await user.type(songInput, 'Dancing Queen')
      
      expect(songInput).toHaveValue('Dancing Queen')
    })

    it('allows checking France tips checkbox', async () => {
      const user = userEvent.setup()
      render(<RsvpForm />)
      
      const checkbox = screen.getByRole('checkbox')
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
