import { useTranslation } from 'react-i18next'
import {
  Box,
  Container,
  Image as ChakraImage,
  Link,
  Text,
  VStack,
} from '@chakra-ui/react'
import { ScrollReveal } from './animations'
import footerDetailDark from '../assets/detail footer-dark.svg'
import footerDetailLight from '../assets/detail-footer-light.svg'
import signatureSvg from '../assets/carolina_and_thomas_signature.svg'

interface FooterProps {
  variant?: 'dark' | 'light'
}

/**
 * Footer component with scalloped border and contact information
 * @param variant - 'dark' (default) for dark background, 'light' for cream background
 */
export default function Footer({ variant = 'dark' }: FooterProps) {
  const { t } = useTranslation()
  
  const isLight = variant === 'light'
  const footerDetail = isLight ? footerDetailLight : footerDetailDark
  const bgColor = isLight ? '#E3DFCE' : '#300F0C'
  const textColor = isLight ? '#300F0C' : '#E3DFCE'

  return (
    <Box as="footer" position="relative" overflow="visible">
      {/* Footer content */}
      <Box 
        bg={bgColor} 
        py={16} 
        textAlign="center"
        position="relative"
      >
        {/* Decorative scalloped border - positioned at top of footer */}
        <Box 
          position="absolute"
          top={0}
          left="50%"
          transform="translateX(-50%) translateY(-50%)"
          w="100%"
          minW="1440px"
          overflow="visible"
          pointerEvents="none"
        >
          <ChakraImage
            src={footerDetail}
            alt=""
            w="100%"
            h="auto"
            display="block"
            objectFit="cover"
            objectPosition="center"
            sx={{
              clipPath: 'inset(0 0 50% 0)',
            }}
          />
        </Box>
        
        <Container maxW="container.lg">
          <ScrollReveal>
            <VStack spacing={6}>
              <Text 
                color={textColor} 
                fontSize="md" 
                fontFamily="body"
                letterSpacing="0.05em"
              >
                {t('footer.contactUs')}
              </Text>
              <Link
                href="mailto:carolinaandthomaswedding@gmail.com"
                color={textColor}
                fontSize="md"
                fontFamily="body"
                letterSpacing="0.02em"
                _hover={{ opacity: 0.8, textDecoration: 'underline' }}
              >
                carolinaandthomaswedding@gmail.com
              </Link>
              <ChakraImage
                src={signatureSvg}
                alt="Carolina & Thomas"
                maxW={{ base: '200px', md: '280px' }}
                mt={6}
                filter={isLight ? 'none' : 'none'}
              />
            </VStack>
          </ScrollReveal>
        </Container>
      </Box>
    </Box>
  )
}
