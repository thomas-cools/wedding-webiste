import { render, screen } from '../test-utils'
import { RegistryLinksGrid } from '../components/RegistryLinks/RegistryLinksGrid'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { returnObjects?: boolean }) => {
      if (key === 'registry.links' && options?.returnObjects) {
        return [
          { name: 'Our Gift Registry', description: 'Browse our curated list of gifts.', buttonLabel: 'View Registry' },
          { name: 'Honeymoon Fund', description: 'Help us celebrate our honeymoon.', buttonLabel: 'Contribute' },
        ]
      }
      return key
    },
    i18n: { language: 'en' },
  }),
}))

jest.mock('../assets/gift_icon.svg', () => 'gift-icon.svg')

jest.mock('../config', () => ({
  registryLinks: [
    { id: 'primary', url: 'https://www.zola.com/registry/example' },
    { id: 'honeymoon', url: 'https://www.honeyfund.com/example' },
  ],
}))

describe('RegistryLinksGrid', () => {
  it('renders a card for each configured registry link', () => {
    render(<RegistryLinksGrid />)

    expect(screen.getByRole('heading', { name: 'Our Gift Registry' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Honeymoon Fund' })).toBeInTheDocument()
  })

  it('renders external links that open in a new tab safely', () => {
    render(<RegistryLinksGrid />)

    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(2)
    links.forEach((link) => {
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })

    expect(links[0]).toHaveAttribute('href', 'https://www.zola.com/registry/example')
    expect(links[1]).toHaveAttribute('href', 'https://www.honeyfund.com/example')
  })
})
