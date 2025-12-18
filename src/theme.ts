import { extendTheme } from '@chakra-ui/react'

// Elegant Wedding Theme: Mexican-Belgian Heritage at a French Chateau
// Blends warm terracotta tones with European sophistication
const theme = extendTheme({
  fonts: {
    // Cormorant Garamond: French elegance, excellent for body text
    // Montserrat: Modern, clean readability for UI elements
    heading: "'Cormorant Garamond', 'Georgia', serif",
    body: "'Montserrat', 'Helvetica Neue', sans-serif",
    accent: "'Playfair Display', serif", // For special decorative text
  },
  colors: {
    // Core palette: "Terracotta Elegance"
    neutral: {
      light: '#F5F1EB',      // Warm cream - primary background
      dark: '#2C3E50',       // Deep navy - primary text
      muted: 'rgba(44,62,80,0.6)', // Muted text
      white: '#FEFEFE',      // Pure white for cards
    },
    primary: {
      soft: '#C4A77D',       // Warm gold - elegant accents, borders
      deep: '#8B4513',       // Terracotta - rich accent, hover states
      gold: '#D4A574',       // Burnt sienna - highlight color
    },
    // Mexican heritage colors (use as accents)
    mexican: {
      marigold: '#E8963A',   // Cempasúchil orange
      pink: '#9B2335',       // Mexican pink / magenta
      talavera: '#1E4D8C',   // Traditional Talavera blue
      terracotta: '#CB6843', // Clay pottery tone
      dahlia: '#C71585',     // Dahlia flower pink
    },
    // Belgian heritage colors (subtle, sophisticated)
    belgian: {
      lace: '#FAF8F5',       // Bruges lace white
      chocolate: '#4A3728',  // Belgian chocolate brown
      gold: '#C9A227',       // Antique gold (Art Nouveau)
      charcoal: '#2D3436',   // Flemish painting darks
    },
    // French chateau aesthetic
    chateau: {
      stone: '#D4CFC4',      // Limestone walls
      lavender: '#9B8AA4',   // Provence lavender
      champagne: '#F7E7CE',  // Champagne toast
      garden: '#6B705C',     // Formal garden sage
      wine: '#722F37',       // Burgundy wine
    },
    // Legacy aliases for backward compatibility
    accent: {
      sage: '#6B705C',
      gold: '#C4A77D',
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
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.15em',
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
        cultural: {
          bg: 'mexican.marigold',
          color: 'neutral.white',
          px: 10,
          py: 6,
          _hover: { bg: 'mexican.terracotta' },
        },
      },
      defaultProps: {
        variant: 'outline',
      },
    },
    Heading: {
      baseStyle: {
        fontFamily: "'Cormorant Garamond', serif",
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
          fontFamily: "'Montserrat', sans-serif",
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
  },
})

export default theme
