import React, { Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Container,
  Button,
  HStack,
  Flex,
  Image as ChakraImage,
} from '@chakra-ui/react'
import { Link } from 'react-router-dom'
import { ArrowBackIcon } from '@chakra-ui/icons'
import LanguageSwitcher from '../components/LanguageSwitcher'
import ErrorBoundary from '../components/ErrorBoundary'
import PasswordGate from '../components/PasswordGate'
import { GallerySkeleton } from '../components/SectionSkeletons'
import Footer from '../components/Footer'
import { useFeatureFlags } from '../contexts/FeatureFlagsContext'

// Import logo
import weddingLogoSmall from '../assets/monogram_websiteT&C-small.webp'
import weddingLogoMedium from '../assets/monogram_websiteT&C-medium.webp'
import weddingLogo2x from '../assets/monogram_websiteT&C-2x.webp'

const PhotoGallery = React.lazy(() =>
  import('../components/PhotoGallery').then((m) => ({ default: m.PhotoGallery }))
)

function GalleryPageContent() {
  const { t } = useTranslation()

  return (
    <Box minH="100vh" bg="neutral.warm" display="flex" flexDirection="column">
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
                {t('gallery.backToHome', 'Back')}
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
      >
        <ErrorBoundary sectionName="Photo Gallery">
          <Suspense fallback={<GallerySkeleton />}>
            <PhotoGallery />
          </Suspense>
        </ErrorBoundary>
      </Box>

      <Footer variant="light" />
    </Box>
  )
}

export default function GalleryPage() {
  const { features } = useFeatureFlags()

  // Wrap with password gate if feature is enabled
  if (features.requirePassword) {
    return <PasswordGate bg="#300F0C"><GalleryPageContent /></PasswordGate>
  }

  return <GalleryPageContent />
}
