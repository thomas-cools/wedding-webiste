import { extendTheme } from '@chakra-ui/react'

const colors = {
  brand: {
    50: '#E3DFCE', // neutral (light)
    100: '#E3DFCE',
    200: '#CFCAB8',
    300: '#BFB99F',
    400: '#AFA689',
    500: '#949B7A',
    600: '#6f7c5a',
    700: '#4C4F3d',
    800: '#2E3025',
    900: '#0B1937', // neutral (dark)
    primary: '#94B1C8',
    secondary: '#BCCA25',
    accent: '#4C050C',
  },
}

const fonts = {
  heading: `Playfair Display, serif`,
  body: `Montserrat, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial`,
}

const components = {
  Heading: {
    baseStyle: {
      fontFamily: fonts.heading,
    },
  },
}

const theme = extendTheme({ colors, fonts, components })

export default theme
