import React, { Suspense } from 'react'
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
import ErrorBoundary from '../components/ErrorBoundary'
import PasswordGate from '../components/PasswordGate'
import { SectionSkeleton } from '../components/SectionSkeletons'
import Footer from '../components/Footer'
import { useFeatureFlags } from '../contexts/FeatureFlagsContext'

// Import logo
import weddingLogoSmall from '../assets/monogram_websiteT&C-small.webp'
import weddingLogoMedium from '../assets/monogram_websiteT&C-medium.webp'
import weddingLogo2x from '../assets/monogram_websiteT&C-2x.webp'
import textureSvg from '../assets/texture.svg'

const RegistryLinksGrid = React.lazy(() =>
  import('../components/RegistryLinks/RegistryLinksGrid').then((m) => ({ default: m.RegistryLinksGrid }))
)

function RegistryPageContent() {
  const { t } = useTranslation()

  return (
    <Box id="page-top" minH="100vh" bg="#E3DFCE" display="flex" flexDirection="column" position="relative" overflow="hidden">
      {/* Texture Background Decoration - Right Side */}
      <Box
        position="fixed"
        right={0}
        top={0}
        bottom={0}
        w={["200px", "300px", "450px", "550px"]}
        backgroundImage={`url(${textureSvg})`}
        backgroundRepeat="no-repeat"
        backgroundPosition="right center"
        backgroundSize="cover"
        pointerEvents="none"
        zIndex={0}
        transform="scaleX(-1)"
        sx={{
          opacity: 0.4,
          mixBlendMode: 'overlay',
          filter: 'drop-shadow(1px 1px 0px rgba(255,255,255,0.5)) drop-shadow(-1px -1px 0px rgba(0,0,0,0.2))',
        }}
      />

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
            <HStack
              spacing={4}
              position="absolute"
              left={0}
            >
              <Button
                as={Link}
                to="/"
                variant="ghost"
                size="sm"
                color="#E3DFCE"
                _hover={{ bg: 'whiteAlpha.200' }}
                leftIcon={<ArrowBackIcon />}
              >
                {t('registry.backToHome')}
              </Button>
            </HStack>

            {/* Centered Logo */}
            <Link to="/">
              <ChakraImage
                src={weddingLogoSmall}
                srcSet={`${weddingLogoSmall} 60w, ${weddingLogoMedium} 100w, ${weddingLogo2x} 200w`}
                sizes="(max-width: 480px) 40px, (max-width: 768px) 45px, 50px"
                alt={t('header.initials')}
                h={["40px", "45px", "50px"]}
                w="auto"
                cursor="pointer"
              />
            </Link>

            {/* Language Switcher - Right */}
            <HStack
              spacing={4}
              position="absolute"
              right={0}
            >
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
        pt={["80px", "100px", "120px"]}
        position="relative"
        zIndex={1}
      >
        <Container maxW="container.lg" px={[4, 6, 8]} py={[12, 16]}>
          <VStack spacing={10}>
            <VStack spacing={4} textAlign="center" maxW="700px" mx="auto">
              <Heading as="h1" fontFamily="heading" fontSize={["3xl", "4xl"]} fontWeight="400" color="neutral.dark">
                {t('registry.pageTitle')}
              </Heading>
              <Text fontSize={["md", "lg"]} lineHeight="1.9" color="neutral.dark">
                {t('registry.pageIntro')}
              </Text>
            </VStack>

            <ErrorBoundary sectionName="registry">
              <Suspense fallback={<SectionSkeleton lines={2} />}>
                <RegistryLinksGrid />
              </Suspense>
            </ErrorBoundary>
          </VStack>
        </Container>
      </Box>

      <Footer sectionAboveBg="#E3DFCE" />
    </Box>
  )
}

export default function RegistryPage() {
  const { features } = useFeatureFlags()

  // Wrap with password gate if feature is enabled
  if (features.requirePassword) {
    return <PasswordGate bg="#E3DFCE"><RegistryPageContent /></PasswordGate>
  }

  return <RegistryPageContent />
}
