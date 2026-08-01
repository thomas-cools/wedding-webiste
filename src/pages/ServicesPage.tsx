import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Container,
  Button,
  HStack,
  Flex,
  Image as ChakraImage,
  VStack,
  Heading,
  Text,
} from '@chakra-ui/react'
import { Link } from 'react-router-dom'
import { ArrowBackIcon } from '@chakra-ui/icons'
import LanguageSwitcher from '../components/LanguageSwitcher'
import PasswordGate from '../components/PasswordGate'
import Footer from '../components/Footer'
import { useFeatureFlags } from '../contexts/FeatureFlagsContext'

// Import logo
import weddingLogoSmall from '../assets/monogram_websiteT&C-small.webp'
import weddingLogoMedium from '../assets/monogram_websiteT&C-medium.webp'
import weddingLogo2x from '../assets/monogram_websiteT&C-2x.webp'

function ServicesPageContent() {
  const { t } = useTranslation()

  return (
    <Box id="page-top" minH="100vh" bg="neutral.light" display="flex" flexDirection="column">
      {/* Minimal Header */}
      <Box
        as="header"
        role="banner"
        py={[4, 6]}
        position="fixed"
        top={0}
        left={0}
        right={0}
        zIndex={100}
        bg="#300F0C"
      >
        <Container maxW="container.xl" px={[4, 6, 8]}>
          <Flex justify="center" align="center" position="relative">
            {/* Back to Home - Left */}
            <HStack spacing={4} position="absolute" left={0}>
              <Button
                as={Link}
                to="/"
                variant="ghost"
                size="sm"
                color="#E3DFCE"
                _hover={{ bg: 'whiteAlpha.200' }}
                leftIcon={<ArrowBackIcon />}
              >
                {t('services.backToHome', 'Back')}
              </Button>
            </HStack>

            {/* Centered Logo */}
            <Link to="/">
              <ChakraImage
                src={weddingLogoSmall}
                srcSet={`${weddingLogoSmall} 60w, ${weddingLogoMedium} 100w, ${weddingLogo2x} 200w`}
                sizes="(max-width: 480px) 40px, (max-width: 768px) 45px, 50px"
                alt={t('header.initials')}
                h={['40px', '45px', '50px']}
                w="auto"
                cursor="pointer"
              />
            </Link>

            {/* Language Switcher - Right */}
            <HStack spacing={4} position="absolute" right={0}>
              <LanguageSwitcher />
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Main Content */}
      <Box
        as="main"
        id="main-content"
        role="main"
        tabIndex={-1}
        flex="1"
        pt={['80px', '100px', '120px']}
      >
        <Container maxW="container.md" px={[4, 6, 8]} py={[12, 16]}>
          <VStack spacing={10} align="stretch">
            <VStack spacing={4} textAlign="center" maxW="700px" mx="auto">
              <Heading as="h1" fontFamily="heading" fontSize={['3xl', '4xl']} fontWeight="400" color="neutral.dark">
                {t('services.pageTitle')}
              </Heading>
              <Text fontSize={['md', 'lg']} lineHeight="1.9" color="neutral.dark">
                {t('services.pageIntro')}
              </Text>
            </VStack>

            <VStack
              align="stretch"
              spacing={4}
              bg="white"
              borderRadius="lg"
              boxShadow="sm"
              p={[6, 8]}
            >
              <Heading as="h2" fontFamily="heading" fontSize={['xl', '2xl']} fontWeight="400" color="neutral.dark">
                {t('services.transportation.title')}
              </Heading>
              <Box>
                <Text fontWeight="600" color="neutral.dark" mb={1}>
                  {t('services.transportation.taxis.title')}
                </Text>
                <Text fontSize={['sm', 'md']} lineHeight="1.8" color="neutral.dark">
                  {t('services.transportation.taxis.description')}
                </Text>
              </Box>
            </VStack>
          </VStack>
        </Container>
      </Box>

      <Footer sectionAboveBg="#F6F1EB" />
    </Box>
  )
}

export default function ServicesPage() {
  const { features } = useFeatureFlags()

  if (features.requirePassword) {
    return (
      <PasswordGate>
        <ServicesPageContent />
      </PasswordGate>
    )
  }

  return <ServicesPageContent />
}
