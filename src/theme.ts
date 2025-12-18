import { extendTheme } from '@chakra-ui/react'

// Classic Minimalist Wedding Theme
// Inspired by garden wedding aesthetics with refined, luxurious restraint
const theme = extendTheme({
  fonts: {
    heading: "'Playfair Display', serif",
    body: "'Cormorant Garamond', 'Georgia', serif",
  },
  colors: {
    neutral: {
      light: '#E3DFCE',      // Warm cream - primary background
      dark: '#0B1937',       // Deep navy - primary text
      muted: 'rgba(11,25,55,0.6)', // Muted text
    },
    primary: {
      soft: '#94B1C8',       // Dusty blue - subtle accents, borders
      deep: '#4C050C',       // Burgundy wine - rich accent, hover states
    },
    accent: {
      sage: '#BCCA25',       // Chartreuse - use VERY sparingly (maybe not at all)
      gold: '#B8A77C',       // Muted gold for subtle highlights
    },
  },
  styles: {
    global: {
      body: {
        bg: 'neutral.light',
        color: 'neutral.dark',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        fontSize: '18px',
        lineHeight: 1.7,
      },
      'a': {
        color: 'primary.deep',
        textDecoration: 'none',
        _hover: { color: 'primary.soft' },
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
        fontFamily: "'Cormorant Garamond', serif",
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.2em',
        fontSize: 'sm',
      },
      variants: {
        primary: {
          bg: 'neutral.dark',
          color: 'neutral.light',
          px: 10,
          py: 6,
          _hover: { bg: 'primary.deep' },
        },
        outline: {
          bg: 'transparent',
          color: 'neutral.dark',
          border: '1px solid',
          borderColor: 'neutral.dark',
          px: 10,
          py: 6,
          _hover: { bg: 'neutral.dark', color: 'neutral.light' },
        },
        ghost: {
          bg: 'transparent',
          color: 'neutral.dark',
          fontWeight: 400,
          _hover: { color: 'primary.deep', bg: 'transparent' },
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
        fontFamily: "'Cormorant Garamond', serif",
      },
    },
    FormLabel: {
      baseStyle: {
        fontFamily: "'Cormorant Garamond', serif",
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
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 'md',
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
            py: 3,
            _focusVisible: { 
              borderColor: 'primary.deep', 
              boxShadow: 'none',
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
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 'md',
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
            py: 3,
            _focusVisible: { 
              borderColor: 'primary.deep', 
              boxShadow: 'none',
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
        fontFamily: "'Cormorant Garamond', serif",
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
          _focusVisible: { 
            borderColor: 'primary.deep', 
            boxShadow: 'none',
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
          fontFamily: "'Cormorant Garamond', serif",
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
  },
})

export default theme
