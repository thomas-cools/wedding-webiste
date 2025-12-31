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
import footerDetail from '../assets/footer_detail.svg'
import signatureSvg from '../assets/carolina_and_thomas_signature.svg'

/**
 * Footer component with scalloped border and contact information
 */
export default function Footer() {
  const { t } = useTranslation()

  return (
    <Box as="footer" position="relative" overflow="hidden">
      {/* Decorative scalloped border - positioned to overlap footer */}
      <ChakraImage
        src={footerDetail}
        alt=""
        w="100%"
        h="auto"
        display="block"
        minW="1440px"
        objectFit="cover"
        objectPosition="center"
        transform="translateX(-50%)"
        position="relative"
        left="50%"
        mb="-31px"
      />
      
      {/* Footer content */}
      <Box 
        bg="#300F0C" 
        py={16} 
        textAlign="center"
      >
        <Container maxW="container.lg">
          <ScrollReveal>
            <VStack spacing={6}>
              <Text 
                color="#E3DFCE" 
                fontSize="md" 
                fontFamily="body"
                letterSpacing="0.05em"
              >
                {t('footer.contactUs')}
              </Text>
              <Link
                href="mailto:carolinaandthomaswedding@gmail.com"
                color="#E3DFCE"
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
              />
            </VStack>
          </ScrollReveal>
        </Container>
      </Box>
    </Box>
  )
}
