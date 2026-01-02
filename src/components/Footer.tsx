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
import footerDetailDark from '../assets/detail-footer-dark.svg'
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
  // The scalloped border should match the footer background color so that,
  // when it protrudes upward, it creates a scalloped edge into the section above.
  const footerDetail = isLight ? footerDetailLight : footerDetailDark
  const bgColor = isLight ? '#E3DFCE' : '#300F0C'
  const textColor = isLight ? '#300F0C' : '#E3DFCE'
  // Background for scallop gaps - should match the section above the footer
  const scallopsGapBg = isLight ? '#300F0C' : '#E3DFCE'

  return (
    <Box
      as="footer"
      position="relative"
      zIndex={10}
    >
      {/* Decorative scalloped border - only top half visible */}
      <Box 
        h="17px"
        w="100%"
        overflow="hidden"
        bg={scallopsGapBg}
        position="relative"
      >
        <ChakraImage
          src={footerDetail}
          alt=""
          position="absolute"
          top="0"
          left="0"
          h="34px"
          w="100%"
          minW="1440px"
          objectFit="cover"
          objectPosition="left top"
        />
      </Box>
      
      {/* Footer content */}
      <Box 
        bg={bgColor} 
        py={{ base: 10, md: 16 }} 
        textAlign="center"
        position="relative"
      >
        
        <Container maxW="container.lg" px={{ base: 4, md: 6 }}>
          <ScrollReveal>
            <VStack spacing={{ base: 4, md: 6 }}>
              <Text 
                color={textColor} 
                fontSize={{ base: 'sm', md: 'md', lg: 'lg' }} 
                fontFamily="body"
                letterSpacing="0.05em"
                px={{ base: 2, md: 0 }}
              >
                {t('footer.contactUs')}
              </Text>
              <Link
                href="mailto:carolinaandthomaswedding@gmail.com"
                color={textColor}
                fontSize={{ base: 'xs', sm: 'sm', md: 'md' }}
                fontFamily="body"
                letterSpacing="0.02em"
                wordBreak="break-word"
                _hover={{ opacity: 0.8, textDecoration: 'underline' }}
              >
                carolinaandthomaswedding@gmail.com
              </Link>
              <ChakraImage
                src={signatureSvg}
                alt="Carolina & Thomas"
                w={{ base: '60%', sm: '50%', md: '280px', lg: '320px' }}
                maxW="320px"
                mt={{ base: 4, md: 6 }}
                filter={isLight ? 'none' : 'none'}
              />
            </VStack>
          </ScrollReveal>
        </Container>
      </Box>
    </Box>
  )
}
