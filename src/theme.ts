import { extendTheme } from '@chakra-ui/react'

// Visual Identity: Terracotta & Slate
// Palette anchors:
// - Deep terracotta: #C06C5D
// - Slate blue: #5C6D7E
// - Champagne gold: #D4AF37
// - Cream (off-white): #F9F7F2
// - Charcoal: #2C2C2C
const theme = extendTheme({
  fonts: {
    heading: "'Playfair Display', 'Georgia', serif",
    body: "'Montserrat', 'Helvetica Neue', sans-serif",
    accent: "'Playfair Display', 'Georgia', serif",
  },
  colors: {
    neutral: {
      light: '#F9F7F2',
      dark: '#2C2C2C',
      muted: 'rgba(44,44,44,0.60)',
      white: '#FFFFFF',
    },
    primary: {
      // Champagne gold (borders, dividers) + deep terracotta (CTAs, accents)
      soft: '#D4AF37',
      deep: '#C06C5D',
      gold: '#D4AF37',
    },
    secondary: {
      slate: '#5C6D7E',
    },
    chateau: {
      stone: '#F9F7F2',
      lavender: '#5C6D7E',
      champagne: '#D4AF37',
      garden: '#5C6D7E',
      wine: '#C06C5D',
    },
    // Legacy aliases for backward compatibility
    accent: {
      sage: '#5C6D7E',
      gold: '#D4AF37',
    },
  },
  styles: {
    global: {
      body: {
        bg: 'neutral.light',
        color: 'neutral.dark',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        fontSize: '16px',
        lineHeight: 1.7,
        // Subtle white-on-white "papel picado" texture (minimalist, not kitschy)
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='120' viewBox='0 0 240 120'%3E%3Cdefs%3E%3Cpattern id='p' width='120' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M0 10h120' stroke='%23ffffff' stroke-opacity='0.35' stroke-width='1'/%3E%3Cpath d='M0 30h120' stroke='%23ffffff' stroke-opacity='0.20' stroke-width='1'/%3E%3Cpath d='M0 50h120' stroke='%23ffffff' stroke-opacity='0.35' stroke-width='1'/%3E%3Cpath d='M0 10l10 10 10-10 10 10 10-10 10 10 10-10 10 10 10-10 10 10 10-10 10 10 10-10 10 10 10-10' fill='none' stroke='%23ffffff' stroke-opacity='0.10' stroke-width='2'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='240' height='120' fill='url(%23p)'/%3E%3C/svg%3E\")",
        backgroundRepeat: 'repeat',
        backgroundSize: '240px 120px',
      },
      'a': {
        color: 'primary.deep',
        textDecoration: 'none',
        _hover: { color: 'primary.deep' },
      },
    },
  },
  radii: {
    none: '0',
    sm: '2px',
    md: '4px',
    lg: '8px',
  },
  components: {
    Button: {
      baseStyle: {
        borderRadius: 'none',
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.15em',
        fontSize: 'sm',
      },
      variants: {
        primary: {
          bg: 'primary.deep',
          color: 'neutral.light',
          px: 10,
          py: 6,
          _hover: { bg: 'primary.deep', color: 'neutral.light', opacity: 1, filter: 'none' },
          _active: { bg: 'primary.deep', color: 'neutral.light', opacity: 1 },
        },
        outline: {
          bg: 'transparent',
          color: 'neutral.dark',
          border: '1px solid',
          borderColor: 'neutral.dark',
          px: 10,
          py: 6,
          _hover: { bg: 'transparent', color: 'neutral.dark', borderColor: 'neutral.dark', opacity: 1, filter: 'none' },
          _active: { bg: 'transparent', color: 'neutral.dark', opacity: 1 },
        },
        ghost: {
          bg: 'transparent',
          color: 'neutral.dark',
          fontWeight: 400,
          _hover: { color: 'primary.deep', bg: 'transparent' },
        },
        cultural: {
          bg: 'secondary.slate',
          color: 'neutral.light',
          px: 10,
          py: 6,
          _hover: { bg: 'primary.deep' },
        },
      },
      defaultProps: {
        variant: 'outline',
      },
    },
    Heading: {
      baseStyle: {
        fontFamily: "'Playfair Display', serif",
        color: 'neutral.dark',
        fontWeight: 400,
        letterSpacing: '0.02em',
      },
    },
    Text: {
      baseStyle: {
        color: 'neutral.dark',
        fontFamily: "'Montserrat', sans-serif",
      },
    },
    FormLabel: {
      baseStyle: {
        fontFamily: "'Montserrat', sans-serif",
        textTransform: 'uppercase',
        letterSpacing: '0.15em',
        fontSize: 'xs',
        fontWeight: 600,
        color: 'neutral.dark',
        mb: 3,
      },
    },
    Input: {
      baseStyle: {
        field: {
          fontFamily: "'Montserrat', sans-serif",
          fontSize: 'md',
          lineHeight: '1.6',
        },
      },
      variants: {
        elegant: {
          field: {
            bg: 'transparent',
            border: 'none',
            borderBottom: '1px solid',
            borderColor: 'primary.soft',
            borderRadius: 0,
            px: 0,
            pt: 3,
            pb: 4,
            h: 'auto',
            minH: '48px',
            _focus: {
              borderColor: 'primary.deep',
              boxShadow: 'none',
              outline: 'none',
            },
            _focusVisible: { 
              borderColor: 'primary.deep', 
              boxShadow: 'none',
              outline: 'none',
            },
            _placeholder: { color: 'neutral.muted' },
          },
        },
      },
      defaultProps: {
        variant: 'elegant',
      },
    },
    Select: {
      baseStyle: {
        field: {
          fontFamily: "'Montserrat', sans-serif",
          fontSize: 'md',
          lineHeight: '1.6',
          overflow: 'visible',
        },
      },
      variants: {
        elegant: {
          field: {
            bg: 'transparent',
            border: 'none',
            borderBottom: '1px solid',
            borderColor: 'primary.soft',
            borderRadius: 0,
            px: 0,
            pt: 3,
            pb: 4,
            h: 'auto',
            minH: '48px',
            _focus: {
              borderColor: 'primary.deep',
              boxShadow: 'none',
              outline: 'none',
            },
            _focusVisible: { 
              borderColor: 'primary.deep', 
              boxShadow: 'none',
              outline: 'none',
            },
          },
        },
      },
      defaultProps: {
        variant: 'elegant',
      },
    },
    Textarea: {
      baseStyle: {
        fontFamily: "'Montserrat', sans-serif",
        fontSize: 'md',
      },
      variants: {
        elegant: {
          bg: 'transparent',
          border: '1px solid',
          borderColor: 'primary.soft',
          borderRadius: 'sm',
          px: 4,
          py: 3,
          _focus: {
            borderColor: 'primary.deep',
            boxShadow: 'none',
            outline: 'none',
          },
          _focusVisible: { 
            borderColor: 'primary.deep', 
            boxShadow: 'none',
            outline: 'none',
          },
          _placeholder: { color: 'neutral.muted' },
        },
      },
      defaultProps: {
        variant: 'elegant',
      },
    },
    Checkbox: {
      baseStyle: {
        label: {
          fontFamily: "'Montserrat', sans-serif",
        },
        control: {
          borderColor: 'primary.soft',
          _checked: {
            bg: 'primary.deep',
            borderColor: 'primary.deep',
          },
        },
      },
    },
    Divider: {
      baseStyle: {
        borderColor: 'primary.soft',
        opacity: 0.5,
      },
    },
    Alert: {
      baseStyle: {
        container: {
          borderRadius: 'sm',
          fontFamily: "'Montserrat', sans-serif",
        },
        title: {
          fontFamily: "'Playfair Display', serif",
          fontSize: 'lg',
          fontWeight: 500,
          letterSpacing: '0.02em',
        },
        description: {
          fontFamily: "'Montserrat', sans-serif",
          fontSize: 'sm',
        },
        icon: {
          flexShrink: 0,
        },
      },
      variants: {
        subtle: {
          container: {
            bg: 'neutral.white',
            border: '1px solid',
            borderColor: 'primary.soft',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          },
        },
        solid: {
          container: {
            bg: 'neutral.white',
            border: '1px solid',
            borderColor: 'primary.soft',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            color: 'neutral.dark',
          },
          icon: {
            color: 'primary.deep',
          },
        },
      },
    },
  },
})

export default theme
