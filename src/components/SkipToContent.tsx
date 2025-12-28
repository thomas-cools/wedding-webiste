import { Box, Link, VisuallyHidden } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'

export interface SkipToContentProps {
  /** The ID of the main content element to skip to */
  mainId?: string
  /** Additional skip links for other landmarks */
  additionalLinks?: Array<{
    id: string
    labelKey: string
  }>
}

/**
 * SkipToContent provides keyboard-accessible skip links for screen readers
 * and keyboard users to bypass repetitive navigation and jump to main content.
 * 
 * The links are visually hidden until focused, then appear at the top of the page.
 * 
 * @example
 * // In App.tsx, place at the very top of the component tree
 * <SkipToContent mainId="main-content" />
 * 
 * // Then ensure your main content has the matching id
 * <Box as="main" id="main-content">...</Box>
 */
export function SkipToContent({ 
  mainId = 'main-content',
  additionalLinks = []
}: SkipToContentProps) {
  const { t } = useTranslation()

  const skipLinkStyles = {
    position: 'absolute' as const,
    top: '-100px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 9999,
    bg: 'white',
    color: 'chateau.charcoal',
    px: 4,
    py: 2,
    borderRadius: 'md',
    fontWeight: 'medium',
    boxShadow: 'lg',
    transition: 'top 0.2s ease-in-out',
    _focus: {
      top: '16px',
      outline: '2px solid',
      outlineColor: 'primary.gold',
      outlineOffset: '2px',
    },
  }

  return (
    <Box
      as="nav"
      aria-label={t('accessibility.skipNavigation', 'Skip navigation')}
    >
      <Link
        href={`#${mainId}`}
        sx={skipLinkStyles}
        onClick={(e) => {
          e.preventDefault()
          const target = document.getElementById(mainId)
          if (target) {
            target.focus()
            target.scrollIntoView({ behavior: 'smooth' })
          }
        }}
      >
        {t('accessibility.skipToMain', 'Skip to main content')}
      </Link>
      
      {additionalLinks.map(({ id, labelKey }) => (
        <Link
          key={id}
          href={`#${id}`}
          sx={skipLinkStyles}
          onClick={(e) => {
            e.preventDefault()
            const target = document.getElementById(id)
            if (target) {
              target.focus()
              target.scrollIntoView({ behavior: 'smooth' })
            }
          }}
        >
          {t(labelKey)}
        </Link>
      ))}
      
      {/* Hidden instructions for screen readers */}
      <VisuallyHidden>
        {t('accessibility.keyboardInstructions', 'Use Tab key to navigate through the page. Press Enter to activate links and buttons.')}
      </VisuallyHidden>
    </Box>
  )
}

export default SkipToContent
