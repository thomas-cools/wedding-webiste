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

describe('RsvpForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.store = {}
    mockLocalStorage.getItem.mockImplementation((key: string) => mockLocalStorage.store[key] || null)
  })

  describe('Rendering', () => {
    it('renders the form with all required fields', () => {
      render(<RsvpForm />)
      
      expect(screen.getByText(/kindly respond/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/your name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/will you be joining us/i)).toBeInTheDocument()
    })

    it('renders the RSVP header section', () => {
      render(<RsvpForm />)
      
      expect(screen.getByRole('heading', { name: /rsvp/i })).toBeInTheDocument()
      expect(screen.getByText(/please let us know/i)).toBeInTheDocument()
    })

    it('renders optional fields', () => {
      render(<RsvpForm />)
      
      expect(screen.getByLabelText(/accommodation/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/travel arrangements/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/dietary requirements/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/song request/i)).toBeInTheDocument()
    })

    it('renders submit button', () => {
      render(<RsvpForm />)
      
      expect(screen.getByRole('button', { name: /submit response/i })).toBeInTheDocument()
    })

    it('renders France tips checkbox', () => {
      render(<RsvpForm />)
      
      expect(screen.getByText(/first time in france/i)).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('shows error when submitting without name', async () => {
      const user = userEvent.setup()
      render(<RsvpForm />)
      
      const submitButton = screen.getByRole('button', { name: /submit response/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/please enter your full name/i)).toBeInTheDocument()
      })
    })

    it('shows error when submitting without email', async () => {
      const user = userEvent.setup()
      render(<RsvpForm />)
      
      const nameInput = screen.getByLabelText(/your name/i)
      await user.type(nameInput, 'John Doe')
      
      const submitButton = screen.getByRole('button', { name: /submit response/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument()
      })
    })

    it('shows error when submitting without likelihood selection', async () => {
      const user = userEvent.setup()
      render(<RsvpForm />)
      
      const nameInput = screen.getByLabelText(/your name/i)
      await user.type(nameInput, 'John Doe')
      
      const emailInput = screen.getByLabelText(/email address/i)
      await user.type(emailInput, 'john@example.com')
      
      const submitButton = screen.getByRole('button', { name: /submit response/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/please indicate how likely/i)).toBeInTheDocument()
      })
    })

    it('validates email format', async () => {
      const user = userEvent.setup()
      render(<RsvpForm />)
      
      const emailInput = screen.getByLabelText(/email address/i)
      await user.type(emailInput, 'invalid-email')
      fireEvent.blur(emailInput)
      
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument()
      })
    })

    it('clears email error when valid email is entered', async () => {
      const user = userEvent.setup()
      render(<RsvpForm />)
      
      const emailInput = screen.getByLabelText(/email address/i)
      await user.type(emailInput, 'invalid')
      fireEvent.blur(emailInput)
      
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument()
      })
      
      await user.clear(emailInput)
      await user.type(emailInput, 'valid@email.com')
      fireEvent.blur(emailInput)
      
      await waitFor(() => {
        expect(screen.queryByText(/please enter a valid email/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Conditional Event Selection', () => {
    it('shows event selection when user selects "Joyfully Accept"', async () => {
      const user = userEvent.setup()
      render(<RsvpForm />)
      
      const likelihoodSelect = screen.getByLabelText(/will you be joining us/i)
      await user.selectOptions(likelihoodSelect, 'definitely')
      
      await waitFor(() => {
        expect(screen.getByText(/events you plan to attend/i)).toBeInTheDocument()
      })
    })

    it('shows event selection when user selects "Likely to Attend"', async () => {
      const user = userEvent.setup()
      render(<RsvpForm />)
      
      const likelihoodSelect = screen.getByLabelText(/will you be joining us/i)
      await user.selectOptions(likelihoodSelect, 'highly_likely')
      
      await waitFor(() => {
        expect(screen.getByText(/events you plan to attend/i)).toBeInTheDocument()
      })
    })

    it('shows event selection when user selects "Not Yet Certain"', async () => {
      const user = userEvent.setup()
      render(<RsvpForm />)
      
      const likelihoodSelect = screen.getByLabelText(/will you be joining us/i)
      await user.selectOptions(likelihoodSelect, 'maybe')
      
      await waitFor(() => {
        expect(screen.getByText(/events you plan to attend/i)).toBeInTheDocument()
      })
    })

    it('hides event selection when user selects "Regretfully Decline"', async () => {
      const user = userEvent.setup()
      render(<RsvpForm />)
      
      const likelihoodSelect = screen.getByLabelText(/will you be joining us/i)
      await user.selectOptions(likelihoodSelect, 'no')
      
      await waitFor(() => {
        expect(screen.queryByText(/events you plan to attend/i)).not.toBeInTheDocument()
      })
    })

    it('requires at least one event when definitely attending', async () => {
      const user = userEvent.setup()
      render(<RsvpForm />)
      
      await user.type(screen.getByLabelText(/your name/i), 'John Doe')
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com')
      await user.selectOptions(screen.getByLabelText(/will you be joining us/i), 'definitely')
      
      const submitButton = screen.getByRole('button', { name: /submit response/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/please select at least one event/i)).toBeInTheDocument()
      })
    })
  })

  describe('Guest Management', () => {
    it('allows adding a guest', async () => {
      const user = userEvent.setup()
      render(<RsvpForm />)
      
      const addGuestButton = screen.getByRole('button', { name: /add guest/i })
      await user.click(addGuestButton)
      
      expect(screen.getByPlaceholderText(/guest 1 name/i)).toBeInTheDocument()
    })

    it('allows adding multiple guests', async () => {
      const user = userEvent.setup()
      render(<RsvpForm />)
      
      const addGuestButton = screen.getByRole('button', { name: /add guest/i })
      await user.click(addGuestButton)
      await user.click(addGuestButton)
      
      expect(screen.getByPlaceholderText(/guest 1 name/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/guest 2 name/i)).toBeInTheDocument()
    })

    it('allows removing a guest', async () => {
      const user = userEvent.setup()
      render(<RsvpForm />)
      
      const addGuestButton = screen.getByRole('button', { name: /add guest/i })
      await user.click(addGuestButton)
      
      expect(screen.getByPlaceholderText(/guest 1 name/i)).toBeInTheDocument()
      
      const removeButton = screen.getByRole('button', { name: /remove/i })
      await user.click(removeButton)
      
      expect(screen.queryByPlaceholderText(/guest 1 name/i)).not.toBeInTheDocument()
    })

    it('validates guest names when guests are added', async () => {
      const user = userEvent.setup()
      render(<RsvpForm />)
      
      await user.type(screen.getByLabelText(/your name/i), 'John Doe')
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com')
      await user.selectOptions(screen.getByLabelText(/will you be joining us/i), 'no')
      
      const addGuestButton = screen.getByRole('button', { name: /add guest/i })
      await user.click(addGuestButton)
      
      const submitButton = screen.getByRole('button', { name: /submit response/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/please provide guest names/i)).toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('saves RSVP to localStorage on successful submission', async () => {
      const user = userEvent.setup()
      render(<RsvpForm />)
      
      await user.type(screen.getByLabelText(/your name/i), 'John Doe')
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com')
      await user.selectOptions(screen.getByLabelText(/will you be joining us/i), 'no')
      
      const submitButton = screen.getByRole('button', { name: /submit response/i })
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
      
      await user.type(screen.getByLabelText(/your name/i), 'John Doe')
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com')
      await user.selectOptions(screen.getByLabelText(/will you be joining us/i), 'no')
      
      const submitButton = screen.getByRole('button', { name: /submit response/i })
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
      
      const accommodationSelect = screen.getByLabelText(/accommodation/i)
      await user.selectOptions(accommodationSelect, 'venue')
      
      expect(accommodationSelect).toHaveValue('venue')
    })

    it('allows selecting travel arrangements', async () => {
      const user = userEvent.setup()
      render(<RsvpForm />)
      
      const travelSelect = screen.getByLabelText(/travel arrangements/i)
      await user.selectOptions(travelSelect, 'rent_car')
      
      expect(travelSelect).toHaveValue('rent_car')
    })

    it('allows entering dietary requirements', async () => {
      const user = userEvent.setup()
      render(<RsvpForm />)
      
      const dietaryInput = screen.getByLabelText(/dietary requirements/i)
      await user.type(dietaryInput, 'Vegetarian')
      
      expect(dietaryInput).toHaveValue('Vegetarian')
    })

    it('allows entering song request', async () => {
      const user = userEvent.setup()
      render(<RsvpForm />)
      
      const songInput = screen.getByLabelText(/song request/i)
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
      
      const notesTextarea = screen.getByLabelText(/additional notes/i)
      await user.type(notesTextarea, 'Looking forward to it!')
      
      expect(notesTextarea).toHaveValue('Looking forward to it!')
    })
  })
})
