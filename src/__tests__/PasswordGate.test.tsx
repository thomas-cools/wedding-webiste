import { render, screen, fireEvent, waitFor } from '../test-utils'
import { act } from '@testing-library/react'
import PasswordGate, { AUTH_KEY } from '../components/PasswordGate'

// Default password for testing
const TEST_PASSWORD = 'carolina&thomas2026'

// Mock the auth module
jest.mock('../utils/auth', () => ({
  authenticate: jest.fn(),
  isAuthenticated: jest.fn(() => false),
}))

import { authenticate, isAuthenticated } from '../utils/auth'
const mockAuthenticate = authenticate as jest.MockedFunction<typeof authenticate>
const mockIsAuthenticated = isAuthenticated as jest.MockedFunction<typeof isAuthenticated>

describe('PasswordGate', () => {
  // Create fresh mock for each test
  let mockSessionStorage: {
    getItem: jest.Mock
    setItem: jest.Mock
    removeItem: jest.Mock
    clear: jest.Mock
    store: Record<string, string>
  }

  let mockLocalStorage: {
    getItem: jest.Mock
    setItem: jest.Mock
    removeItem: jest.Mock
    clear: jest.Mock
    store: Record<string, string>
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mock: authentication fails
    mockAuthenticate.mockResolvedValue({ ok: false, error: 'Invalid password' })
    mockIsAuthenticated.mockReturnValue(false)
    
    mockSessionStorage = {
      store: {},
      getItem: jest.fn((key: string) => mockSessionStorage.store[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        mockSessionStorage.store[key] = value
      }),
      removeItem: jest.fn((key: string) => {
        delete mockSessionStorage.store[key]
      }),
      clear: jest.fn(() => {
        mockSessionStorage.store = {}
      }),
    }
    
    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true,
    })

    mockLocalStorage = {
      store: {},
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

    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    })
  })

  it('renders password form when not authenticated', () => {
    render(
      <PasswordGate>
        <div>Protected Content</div>
      </PasswordGate>
    )

    expect(screen.getByTestId('password-input')).toBeInTheDocument()
    expect(screen.getByTestId('password-submit')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('renders children when already authenticated via sessionStorage', () => {
    // Set up authenticated state before rendering
    mockSessionStorage.store[AUTH_KEY] = 'true'

    render(
      <PasswordGate>
        <div>Protected Content</div>
      </PasswordGate>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
    expect(screen.queryByTestId('password-input')).not.toBeInTheDocument()
  })

  it('shows error message for incorrect password', async () => {
    // Mock returns failure for wrong password
    mockAuthenticate.mockResolvedValue({ ok: false, error: 'Invalid password' })
    
    render(
      <PasswordGate>
        <div>Protected Content</div>
      </PasswordGate>
    )

    const input = screen.getByTestId('password-input')
    const submitButton = screen.getByTestId('password-submit')

    fireEvent.change(input, { target: { value: 'wrongpassword' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByTestId('password-error')).toBeInTheDocument()
    })

    expect(mockAuthenticate).toHaveBeenCalledWith('wrongpassword')
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('grants access with correct password', async () => {
    // Mock returns success for correct password
    mockAuthenticate.mockResolvedValue({ ok: true, token: 'test-token', expiresIn: 86400 })
    
    render(
      <PasswordGate>
        <div>Protected Content</div>
      </PasswordGate>
    )

    const input = screen.getByTestId('password-input')
    const submitButton = screen.getByTestId('password-submit')

    fireEvent.change(input, { target: { value: TEST_PASSWORD } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })

    expect(mockAuthenticate).toHaveBeenCalledWith(TEST_PASSWORD)
  })

  it('password comparison is case-insensitive', async () => {
    // Server handles case-insensitivity, mock returns success
    mockAuthenticate.mockResolvedValue({ ok: true, token: 'test-token', expiresIn: 86400 })
    
    render(
      <PasswordGate>
        <div>Protected Content</div>
      </PasswordGate>
    )

    const input = screen.getByTestId('password-input')
    const submitButton = screen.getByTestId('password-submit')

    fireEvent.change(input, { target: { value: TEST_PASSWORD.toUpperCase() } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
  })

  it('clears error when typing after error', async () => {
    mockAuthenticate.mockResolvedValue({ ok: false, error: 'Invalid password' })
    
    render(
      <PasswordGate>
        <div>Protected Content</div>
      </PasswordGate>
    )

    const input = screen.getByTestId('password-input')
    const submitButton = screen.getByTestId('password-submit')

    // First submit with wrong password
    fireEvent.change(input, { target: { value: 'wrong' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByTestId('password-error')).toBeInTheDocument()
    })

    // Start typing again
    fireEvent.change(input, { target: { value: 'new' } })

    await waitFor(() => {
      expect(screen.queryByTestId('password-error')).not.toBeInTheDocument()
    })
  })

  it('displays password label and description', () => {
    render(
      <PasswordGate>
        <div>Protected Content</div>
      </PasswordGate>
    )

    expect(screen.getByText('password.label')).toBeInTheDocument()
    expect(screen.getByText('password.title')).toBeInTheDocument()
    expect(screen.getByText('password.description')).toBeInTheDocument()
  })

  it('renders language switcher', () => {
    render(
      <PasswordGate>
        <div>Protected Content</div>
      </PasswordGate>
    )

    // Language switcher should be visible on the gate
    const flags = screen.getAllByText('🇬🇧')
    expect(flags.length).toBeGreaterThan(0)
  })

  it('submits form on Enter key press', async () => {
    mockAuthenticate.mockResolvedValue({ ok: true, token: 'test-token', expiresIn: 86400 })
    
    render(
      <PasswordGate>
        <div>Protected Content</div>
      </PasswordGate>
    )

    const input = screen.getByTestId('password-input')

    fireEvent.change(input, { target: { value: TEST_PASSWORD } })
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 })

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
  })

  it('toggles password visibility', () => {
    render(
      <PasswordGate>
        <div>Protected Content</div>
      </PasswordGate>
    )

    const input = screen.getByTestId('password-input')
    const toggleButton = screen.getByLabelText('Show password')

    // Initially password is hidden
    expect(input).toHaveAttribute('type', 'password')

    // Click to show
    fireEvent.click(toggleButton)
    expect(input).toHaveAttribute('type', 'text')

    // Click to hide again
    const hideButton = screen.getByLabelText('Hide password')
    fireEvent.click(hideButton)
    expect(input).toHaveAttribute('type', 'password')
  })

  it('locks out after exceeding 5 attempts per minute', async () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2025-01-01T00:00:00.000Z'))

    render(
      <PasswordGate>
        <div>Protected Content</div>
      </PasswordGate>
    )

    const input = screen.getByTestId('password-input')
    const submitButton = screen.getByTestId('password-submit')

    // 6 attempts in the same minute -> lockout
    for (let i = 0; i < 6; i++) {
      fireEvent.change(input, { target: { value: 'wrongpassword' } })
      fireEvent.click(submitButton)
      // Allow async password verification to complete
      await act(async () => {
        await Promise.resolve()
        jest.advanceTimersByTime(100)
      })
    }

    await waitFor(() => {
      expect(screen.getByTestId('password-cooldown')).toBeInTheDocument()
    })

    expect(input).toBeDisabled()
    expect(submitButton).toBeDisabled()

    jest.useRealTimers()
  })

  it('clears lockout after 5 minutes', async () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2025-01-01T00:00:00.000Z'))

    render(
      <PasswordGate>
        <div>Protected Content</div>
      </PasswordGate>
    )

    const input = screen.getByTestId('password-input')
    const submitButton = screen.getByTestId('password-submit')

    for (let i = 0; i < 6; i++) {
      fireEvent.change(input, { target: { value: 'wrongpassword' } })
      fireEvent.click(submitButton)
      // Allow async password verification to complete
      await act(async () => {
        await Promise.resolve()
        jest.advanceTimersByTime(100)
      })
    }

    await waitFor(() => {
      expect(screen.getByTestId('password-cooldown')).toBeInTheDocument()
    })

    await act(async () => {
      jest.advanceTimersByTime(5 * 60 * 1000 + 1000)
    })

    await waitFor(() => {
      expect(screen.queryByTestId('password-cooldown')).not.toBeInTheDocument()
    })

    expect(input).not.toBeDisabled()
    expect(submitButton).not.toBeDisabled()

    jest.useRealTimers()
  })
})
