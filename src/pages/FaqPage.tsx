import React, { Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Container,
  Button,
  HStack,
  Flex,
  Image as ChakraImage,
  Skeleton,
  VStack,
} from '@chakra-ui/react'
import { Link } from 'react-router-dom'
import { ArrowBackIcon } from '@chakra-ui/icons'
import LanguageSwitcher from '../components/LanguageSwitcher'
import ErrorBoundary from '../components/ErrorBoundary'
import PasswordGate from '../components/PasswordGate'
import Footer from '../components/Footer'
import { useFeatureFlags } from '../contexts/FeatureFlagsContext'

// Import logo
import weddingLogoSmall from '../assets/monogram_websiteT&C-small.webp'
import weddingLogoMedium from '../assets/monogram_websiteT&C-medium.webp'
import weddingLogo2x from '../assets/monogram_websiteT&C-2x.webp'

const FaqSection = React.lazy(() =>
  import('../components/FaqSection').then((m) => ({ default: m.FaqSection }))
)

// Skeleton loader for FAQ section
function FaqSkeleton() {
  return (
    <Box py={[16, 20, 24]} bg="neutral.light">
      <Container maxW="container.md">
        <VStack spacing={12}>
          <VStack spacing={4} width="100%" align="center">
            <Skeleton height="12px" width="100px" />
            <Skeleton height="40px" width="300px" />
            <Skeleton height="1px" width="120px" />
            <Skeleton height="20px" width="400px" />
          </VStack>
          <VStack spacing={4} width="100%">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} height="70px" width="100%" borderRadius="lg" />
            ))}
          </VStack>
        </VStack>
      </Container>
    </Box>
  )
}

function FaqPageContent() {
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
                {t('faq.backToHome', 'Back')}
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
        <ErrorBoundary sectionName="faq" silent>
          <Suspense fallback={<FaqSkeleton />}>
            <FaqSection />
          </Suspense>
        </ErrorBoundary>
      </Box>

      {/* Footer */}
      <Footer sectionAboveBg="#F6F1EB" />
    </Box>
  )
}

export default function FaqPage() {
  const { features } = useFeatureFlags()

  // If password protection is enabled, wrap content in PasswordGate
  if (features.requirePassword) {
    return (
      <PasswordGate>
        <FaqPageContent />
      </PasswordGate>
    )
  }

  return <FaqPageContent />
}
