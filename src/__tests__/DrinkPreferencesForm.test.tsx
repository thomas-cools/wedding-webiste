import React from 'react'
import { render, screen, fireEvent, waitFor } from '../test-utils'
import userEvent from '@testing-library/user-event'
import DrinkPreferencesForm from '../components/DrinkPreferences'

// Mock @zag-js/focus-visible to prevent TypeError in tests
jest.mock('@zag-js/focus-visible', () => ({
  trackFocusVisible: jest.fn(() => () => {}),
  setupGlobalFocusEvents: jest.fn(),
}))

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

describe('DrinkPreferencesForm', () => {
  beforeEach(() => {
    mockLocalStorage.store = {}
    mockLocalStorage.getItem.mockClear()
    mockLocalStorage.setItem.mockClear()
    mockToast.mockClear()
    // Mock fetch
    global.fetch = jest.fn().mockResolvedValue({ ok: true })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders the form title and all sections', () => {
    render(<DrinkPreferencesForm />)

    expect(screen.getByText('drinkPreferences.title')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('drinkPreferences.form.namePlaceholder')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('drinkPreferences.form.emailPlaceholder')).toBeInTheDocument()

    // Check checkbox option labels
    expect(screen.getByText('drinkPreferences.form.wine.white')).toBeInTheDocument()
    expect(screen.getByText('drinkPreferences.form.wine.red')).toBeInTheDocument()
    expect(screen.getByText('drinkPreferences.form.beer.light_crisp')).toBeInTheDocument()
    expect(screen.getByText('drinkPreferences.form.cocktail.agave')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('drinkPreferences.form.favoriteCocktailPlaceholder')).toBeInTheDocument()
    expect(screen.getByText('drinkPreferences.form.nonAlcoholic.mocktails')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('drinkPreferences.form.commentsPlaceholder')).toBeInTheDocument()
  })

  it('shows validation errors when submitting empty form', async () => {
    render(<DrinkPreferencesForm />)

    const submitButton = screen.getByRole('button', { name: 'drinkPreferences.form.submit' })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('drinkPreferences.validation.nameRequired')).toBeInTheDocument()
      expect(screen.getByText('drinkPreferences.validation.emailRequired')).toBeInTheDocument()
      expect(screen.getByText('drinkPreferences.validation.atLeastOneDrink')).toBeInTheDocument()
    })
  })

  it('validates email format', async () => {
    const user = userEvent.setup()
    render(<DrinkPreferencesForm />)

    const emailInput = screen.getByPlaceholderText('drinkPreferences.form.emailPlaceholder')
    await user.type(emailInput, 'invalid-email')
    await user.tab()

    await waitFor(() => {
      expect(screen.getByText('drinkPreferences.validation.emailRequired')).toBeInTheDocument()
    })
  })

  it('clears drink error when a checkbox is selected', async () => {
    const user = userEvent.setup()
    render(<DrinkPreferencesForm />)

    // Submit to trigger all errors
    const submitButton = screen.getByRole('button', { name: 'drinkPreferences.form.submit' })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('drinkPreferences.validation.atLeastOneDrink')).toBeInTheDocument()
    })

    // Click a wine checkbox to clear the drink error
    const wineCheckbox = screen.getByText('drinkPreferences.form.wine.white')
    await user.click(wineCheckbox)

    await waitFor(() => {
      expect(screen.queryByText('drinkPreferences.validation.atLeastOneDrink')).not.toBeInTheDocument()
    })
  })

  it('submits successfully with valid data', async () => {
    const onSuccess = jest.fn()
    const user = userEvent.setup()
    render(<DrinkPreferencesForm onSuccess={onSuccess} />)

    await user.type(
      screen.getByPlaceholderText('drinkPreferences.form.namePlaceholder'),
      'Test Guest'
    )
    await user.type(
      screen.getByPlaceholderText('drinkPreferences.form.emailPlaceholder'),
      'test@example.com'
    )

    // Select some drink preferences
    await user.click(screen.getByText('drinkPreferences.form.wine.red'))
    await user.click(screen.getByText('drinkPreferences.form.beer.light_crisp'))
    await user.click(screen.getByText('drinkPreferences.form.cocktail.agave'))

    const submitButton = screen.getByRole('button', { name: 'drinkPreferences.form.submit' })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
        })
      )
      expect(onSuccess).toHaveBeenCalled()
    })

    // Verify data saved to localStorage
    expect(mockLocalStorage.setItem).toHaveBeenCalled()
  })

  it('accepts only non-alcoholic preference', async () => {
    const user = userEvent.setup()
    render(<DrinkPreferencesForm />)

    await user.type(
      screen.getByPlaceholderText('drinkPreferences.form.namePlaceholder'),
      'Non-Drinker'
    )
    await user.type(
      screen.getByPlaceholderText('drinkPreferences.form.emailPlaceholder'),
      'nd@example.com'
    )

    // Select only a non-alcoholic option
    await user.click(screen.getByText('drinkPreferences.form.nonAlcoholic.sparkling_water'))

    const submitButton = screen.getByRole('button', { name: 'drinkPreferences.form.submit' })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
        })
      )
    })
  })

  it('renders the submit button', () => {
    render(<DrinkPreferencesForm />)
    expect(screen.getByRole('button', { name: 'drinkPreferences.form.submit' })).toBeInTheDocument()
  })
})
