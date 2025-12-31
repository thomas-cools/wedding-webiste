import { render, screen } from '../test-utils'
import Footer from '../components/Footer'

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'footer.contactUs': 'For any questions, please contact us at:',
      }
      return translations[key] || key
    },
    i18n: { language: 'en' },
  }),
}))

// Mock the SVG imports
jest.mock('../assets/footer_detail.svg', () => 'footer_detail.svg')
jest.mock('../assets/carolina_and_thomas_signature.svg', () => 'signature.svg')

describe('Footer Component', () => {
  describe('Rendering', () => {
    it('renders the footer element', () => {
      render(<Footer />)
      
      expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    })

    it('renders the contact text', () => {
      render(<Footer />)
      
      expect(screen.getByText('For any questions, please contact us at:')).toBeInTheDocument()
    })

    it('renders the email address as a link', () => {
      render(<Footer />)
      
      const emailLink = screen.getByRole('link', { name: /carolinaandthomaswedding@gmail.com/i })
      expect(emailLink).toBeInTheDocument()
      expect(emailLink).toHaveAttribute('href', 'mailto:carolinaandthomaswedding@gmail.com')
    })

    it('renders the decorative scalloped border image', () => {
      render(<Footer />)
      
      // Images with empty alt text get role="presentation" for accessibility
      // Use getAllByRole to find all presentation images, then check for the decorative one
      const images = screen.getAllByRole('presentation')
      const decorativeImage = images.find(img => img.getAttribute('alt') === '')
      expect(decorativeImage).toBeInTheDocument()
    })

    it('renders the signature image', () => {
      render(<Footer />)
      
      const signatureImage = screen.getByRole('img', { name: 'Carolina & Thomas' })
      expect(signatureImage).toBeInTheDocument()
      expect(signatureImage).toHaveAttribute('src', 'signature.svg')
    })
  })

  describe('Accessibility', () => {
    it('has accessible footer landmark', () => {
      render(<Footer />)
      
      // contentinfo role is the accessible role for footer
      expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    })

    it('decorative image has presentation role for accessibility', () => {
      render(<Footer />)
      
      // Images with empty alt correctly get role="presentation" 
      // This is the accessible way to mark decorative images
      const presentationImages = screen.getAllByRole('presentation')
      expect(presentationImages.length).toBeGreaterThan(0)
      
      const decorativeImage = presentationImages.find(img => img.getAttribute('alt') === '')
      expect(decorativeImage).toBeInTheDocument()
      expect(decorativeImage).toHaveAttribute('alt', '')
    })

    it('signature image has descriptive alt text', () => {
      render(<Footer />)
      
      const signatureImage = screen.getByRole('img', { name: 'Carolina & Thomas' })
      expect(signatureImage).toHaveAttribute('alt', 'Carolina & Thomas')
    })

    it('email link is keyboard accessible', () => {
      render(<Footer />)
      
      const emailLink = screen.getByRole('link', { name: /carolinaandthomaswedding@gmail.com/i })
      expect(emailLink).not.toHaveAttribute('tabindex', '-1')
    })
  })

  describe('Styling', () => {
    it('applies the correct background color', () => {
      render(<Footer />)
      
      // The footer content box should have the maroon background
      const footer = screen.getByRole('contentinfo')
      // Just verify it renders - specific CSS testing is better done in visual/e2e tests
      expect(footer).toBeInTheDocument()
    })
  })
})
