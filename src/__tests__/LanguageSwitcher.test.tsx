import { render, screen, fireEvent } from '../test-utils'
import LanguageSwitcher from '../components/LanguageSwitcher'

// Mock scrollTo for Chakra Menu
beforeAll(() => {
  Element.prototype.scrollTo = jest.fn()
})

// Mock react-i18next
const mockChangeLanguage = jest.fn()

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'en',
      changeLanguage: mockChangeLanguage,
    },
  }),
}))

// Mock the i18n module for language options
jest.mock('../i18n', () => ({
  languages: [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Español', flag: '🇲🇽' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'nl', name: 'Nederlands', flag: '🇧🇪' },
  ],
  LanguageCode: {},
}))

describe('LanguageSwitcher Component', () => {
  beforeEach(() => {
    mockChangeLanguage.mockClear()
  })

  it('renders the language switcher button', () => {
    render(<LanguageSwitcher />)
    
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('displays the current language flag', () => {
    render(<LanguageSwitcher />)
    
    // Flag appears in button and potentially in menu
    const flags = screen.getAllByText('🇬🇧')
    expect(flags.length).toBeGreaterThanOrEqual(1)
  })

  it('displays the current language code on larger screens', () => {
    render(<LanguageSwitcher />)
    
    expect(screen.getByText('EN')).toBeInTheDocument()
  })

  it('opens menu when clicked', async () => {
    render(<LanguageSwitcher />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    // Menu items should appear
    expect(await screen.findByText('English')).toBeInTheDocument()
    expect(screen.getByText('Español')).toBeInTheDocument()
    expect(screen.getByText('Français')).toBeInTheDocument()
    expect(screen.getByText('Nederlands')).toBeInTheDocument()
  })

  it('displays all language flags in the menu', async () => {
    render(<LanguageSwitcher />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    // Wait for menu to open
    await screen.findByText('English')
    
    // Check all flags are present (there will be duplicates - one in button, one in menu)
    expect(screen.getAllByText('🇬🇧').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('🇲🇽')).toBeInTheDocument()
    expect(screen.getByText('🇫🇷')).toBeInTheDocument()
    expect(screen.getByText('🇧🇪')).toBeInTheDocument()
  })

  it('calls changeLanguage when a language is selected', async () => {
    render(<LanguageSwitcher />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    const spanishOption = await screen.findByText('Español')
    fireEvent.click(spanishOption)
    
    expect(mockChangeLanguage).toHaveBeenCalledWith('es')
  })

  it('can switch to French', async () => {
    render(<LanguageSwitcher />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    const frenchOption = await screen.findByText('Français')
    fireEvent.click(frenchOption)
    
    expect(mockChangeLanguage).toHaveBeenCalledWith('fr')
  })

  it('can switch to Dutch', async () => {
    render(<LanguageSwitcher />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    const dutchOption = await screen.findByText('Nederlands')
    fireEvent.click(dutchOption)
    
    expect(mockChangeLanguage).toHaveBeenCalledWith('nl')
  })

  it('shows all 4 language options', async () => {
    render(<LanguageSwitcher />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    const menuItems = await screen.findAllByRole('menuitem')
    expect(menuItems).toHaveLength(4)
  })

  it('has dropdown icon', () => {
    render(<LanguageSwitcher />)
    
    // ChevronDownIcon should be present
    const button = screen.getByRole('button')
    const svg = button.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })
})
