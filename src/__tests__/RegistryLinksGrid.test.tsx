import { render, screen } from '../test-utils'
import userEvent from '@testing-library/user-event'
import { RegistryLinksGrid } from '../components/RegistryLinks/RegistryLinksGrid'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { returnObjects?: boolean }) => {
      if (key === 'registry.links' && options?.returnObjects) {
        return [
          {
            name: 'Our Gift Registry',
            description: 'Browse our curated list of gifts.',
            buttonLabel: 'View Registry',
            passwordLabel: 'Registry password',
            copyPassword: 'Copy password',
            passwordCopied: 'Password copied',
          },
          {
            name: 'Honeymoon Fund',
            description: 'Help us celebrate our honeymoon.',
            buttonLabel: 'Contribute',
            passwordLabel: 'Registry password',
            copyPassword: 'Copy password',
            passwordCopied: 'Password copied',
          },
        ]
      }
      return key
    },
    i18n: { language: 'en' },
  }),
}))

jest.mock('../assets/gift_icon.svg', () => 'gift-icon.svg')

jest.mock('../config', () => ({
  withJoyRegistryPassword: '6rqr56',
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

  it('shows the registry password and copies it', async () => {
    const user = userEvent.setup()
    const writeText = jest.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })

    render(<RegistryLinksGrid />)

    expect(screen.getAllByText('6rqr56')).toHaveLength(2)
    await user.click(screen.getAllByRole('button', { name: 'Copy password' })[0])

    expect(writeText).toHaveBeenCalledWith('6rqr56')
    expect(screen.getAllByRole('button', { name: 'Password copied' })).toHaveLength(1)
  })
})
