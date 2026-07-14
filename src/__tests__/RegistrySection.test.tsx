import { render, screen } from '../test-utils'
import RegistrySection from '../components/RegistrySection'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'registry.label': 'Gifts & Registry',
        'registry.title': 'Wedding Registry',
        'registry.teaserDescription': 'Your presence is the greatest gift.',
        'registry.viewButton': 'View Our Registry',
      }
      return translations[key] || key
    },
    i18n: { language: 'en' },
  }),
}))

describe('RegistrySection', () => {
  it('renders the teaser heading and description', () => {
    render(<RegistrySection />)

    expect(screen.getByRole('heading', { name: 'Wedding Registry' })).toBeInTheDocument()
    expect(screen.getByText('Your presence is the greatest gift.')).toBeInTheDocument()
  })

  it('renders a link to the full registry page', () => {
    render(<RegistrySection />)

    const link = screen.getByRole('link', { name: 'View Our Registry' })
    expect(link).toHaveAttribute('href', '/registry#page-top')
  })

  it('renders the section with correct id', () => {
    const { container } = render(<RegistrySection />)

    expect(container.querySelector('#registry')).toBeInTheDocument()
  })
})
