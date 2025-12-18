import React from 'react'
import { render, screen, fireEvent, waitFor } from '../test-utils'
import userEvent from '@testing-library/user-event'
import AdminPanel from '../components/AdminPanel'

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

// Mock window.confirm
const mockConfirm = jest.fn()
Object.defineProperty(window, 'confirm', { value: mockConfirm })

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = jest.fn(() => 'blob:mock-url')
const mockRevokeObjectURL = jest.fn()
Object.defineProperty(URL, 'createObjectURL', { value: mockCreateObjectURL })
Object.defineProperty(URL, 'revokeObjectURL', { value: mockRevokeObjectURL })

// Sample RSVP data matching the current Rsvp type
const sampleRsvps = [
  {
    id: '1',
    firstName: 'John Doe',
    email: 'john@example.com',
    likelihood: 'definitely' as const,
    events: {
      welcome: 'yes' as const,
      ceremony: 'yes' as const,
      brunch: '' as const,
    },
    guests: [{ name: 'Jane Doe', dietary: 'Vegetarian' }],
    dietary: 'None',
    songRequest: 'Dancing Queen',
    additionalNotes: 'Looking forward to it!',
    timestamp: Date.now(),
  },
  {
    id: '2',
    firstName: 'Alice Smith',
    email: 'alice@example.com',
    likelihood: 'no' as const,
    events: {
      welcome: '' as const,
      ceremony: '' as const,
      brunch: '' as const,
    },
    guests: [],
    additionalNotes: 'Sorry, cannot make it',
    timestamp: Date.now(),
  },
]

describe('AdminPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.store = {}
    mockLocalStorage.getItem.mockImplementation((key: string) => mockLocalStorage.store[key] || null)
    mockConfirm.mockReturnValue(false)
  })

  describe('Rendering', () => {
    it('renders the admin section header', () => {
      render(<AdminPanel />)
      
      expect(screen.getByText('Admin')).toBeInTheDocument()
      expect(screen.getByText('RSVP Responses')).toBeInTheDocument()
    })

    it('renders export and clear buttons', () => {
      render(<AdminPanel />)
      
      expect(screen.getByRole('button', { name: /export csv/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /clear all/i })).toBeInTheDocument()
    })

    it('shows "No RSVPs yet" when localStorage is empty', () => {
      render(<AdminPanel />)
      
      expect(screen.getByText(/no rsvps yet/i)).toBeInTheDocument()
    })

    it('renders RSVP table when data exists', () => {
      mockLocalStorage.store['rsvps'] = JSON.stringify(sampleRsvps)
      
      render(<AdminPanel />)
      
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    })

    it('displays table headers', () => {
      mockLocalStorage.store['rsvps'] = JSON.stringify(sampleRsvps)
      
      render(<AdminPanel />)
      
      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Email')).toBeInTheDocument()
      expect(screen.getByText('Likelihood')).toBeInTheDocument()
      expect(screen.getByText('Events')).toBeInTheDocument()
    })
  })

  describe('RSVP Data Display', () => {
    it('displays guest names', () => {
      mockLocalStorage.store['rsvps'] = JSON.stringify(sampleRsvps)
      
      render(<AdminPanel />)
      
      expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    })

    it('displays event selections with labels', () => {
      mockLocalStorage.store['rsvps'] = JSON.stringify(sampleRsvps)
      
      render(<AdminPanel />)
      
      // Events are formatted as "Welcome Dinner, Wedding Day"
      expect(screen.getByText(/Welcome Dinner/)).toBeInTheDocument()
      expect(screen.getByText(/Wedding Day/)).toBeInTheDocument()
    })

    it('displays likelihood badges', () => {
      mockLocalStorage.store['rsvps'] = JSON.stringify(sampleRsvps)
      
      render(<AdminPanel />)
      
      expect(screen.getByText(/Definitely/)).toBeInTheDocument()
      expect(screen.getByText(/Cannot attend/)).toBeInTheDocument()
    })

    it('displays email addresses', () => {
      mockLocalStorage.store['rsvps'] = JSON.stringify(sampleRsvps)
      
      render(<AdminPanel />)
      
      expect(screen.getByText('john@example.com')).toBeInTheDocument()
      expect(screen.getByText('alice@example.com')).toBeInTheDocument()
    })
  })

  describe('Clear All Functionality', () => {
    it('prompts for confirmation before clearing', async () => {
      const user = userEvent.setup()
      mockLocalStorage.store['rsvps'] = JSON.stringify(sampleRsvps)
      
      render(<AdminPanel />)
      
      const clearButton = screen.getByRole('button', { name: /clear all/i })
      await user.click(clearButton)
      
      expect(mockConfirm).toHaveBeenCalledWith('Clear all RSVPs?')
    })

    it('does not clear when user cancels', async () => {
      const user = userEvent.setup()
      mockLocalStorage.store['rsvps'] = JSON.stringify(sampleRsvps)
      mockConfirm.mockReturnValue(false)
      
      render(<AdminPanel />)
      
      const clearButton = screen.getByRole('button', { name: /clear all/i })
      await user.click(clearButton)
      
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalled()
    })

    it('clears RSVPs when user confirms', async () => {
      const user = userEvent.setup()
      mockLocalStorage.store['rsvps'] = JSON.stringify(sampleRsvps)
      mockConfirm.mockReturnValue(true)
      
      render(<AdminPanel />)
      
      const clearButton = screen.getByRole('button', { name: /clear all/i })
      await user.click(clearButton)
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('rsvps')
      
      await waitFor(() => {
        expect(screen.getByText(/no rsvps yet/i)).toBeInTheDocument()
      })
    })
  })

  describe('Export CSV Functionality', () => {
    it('creates a CSV blob on export', async () => {
      const user = userEvent.setup()
      mockLocalStorage.store['rsvps'] = JSON.stringify(sampleRsvps)
      
      render(<AdminPanel />)
      
      const exportButton = screen.getByRole('button', { name: /export csv/i })
      await user.click(exportButton)
      
      expect(mockCreateObjectURL).toHaveBeenCalled()
    })

    it('revokes object URL after download', async () => {
      const user = userEvent.setup()
      mockLocalStorage.store['rsvps'] = JSON.stringify(sampleRsvps)
      
      render(<AdminPanel />)
      
      const exportButton = screen.getByRole('button', { name: /export csv/i })
      await user.click(exportButton)
      
      expect(mockRevokeObjectURL).toHaveBeenCalled()
    })
  })

  describe('Real-time Updates', () => {
    it('updates when rsvp:submitted event is fired', async () => {
      render(<AdminPanel />)
      
      expect(screen.getByText(/no rsvps yet/i)).toBeInTheDocument()
      
      // Simulate new RSVP submission
      mockLocalStorage.store['rsvps'] = JSON.stringify([sampleRsvps[0]])
      
      // Fire the custom event
      fireEvent(window, new CustomEvent('rsvp:submitted'))
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })
    })

    it('cleans up event listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
      
      const { unmount } = render(<AdminPanel />)
      unmount()
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'rsvp:submitted',
        expect.any(Function)
      )
      
      removeEventListenerSpy.mockRestore()
    })
  })

  describe('Error Handling', () => {
    it('handles corrupted localStorage data gracefully', () => {
      mockLocalStorage.store['rsvps'] = 'invalid-json'
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'rsvps') return 'invalid-json'
        return null
      })
      
      // Should not throw
      expect(() => render(<AdminPanel />)).not.toThrow()
    })

    it('handles missing events object', () => {
      const rsvpWithoutEvents = [{
        ...sampleRsvps[0],
        events: undefined,
      }]
      mockLocalStorage.store['rsvps'] = JSON.stringify(rsvpWithoutEvents)
      
      expect(() => render(<AdminPanel />)).not.toThrow()
      expect(screen.getByText('–')).toBeInTheDocument() // Should show dash for no events
    })

    it('handles empty guests array', () => {
      mockLocalStorage.store['rsvps'] = JSON.stringify([sampleRsvps[1]]) // Alice has no guests
      
      render(<AdminPanel />)
      
      // Should render without crashing
      expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    })
  })
})
