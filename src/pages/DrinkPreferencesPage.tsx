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
} from '@chakra-ui/react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowBackIcon } from '@chakra-ui/icons'
import LanguageSwitcher from '../components/LanguageSwitcher'
import ErrorBoundary from '../components/ErrorBoundary'
import PasswordGate from '../components/PasswordGate'
import Footer from '../components/Footer'
import { useFeatureFlags } from '../contexts/FeatureFlagsContext'
import { useDrinkToken } from '../components/DrinkPreferences/useDrinkToken'

import weddingLogoSmall from '../assets/monogram_websiteT&C-small.webp'
import weddingLogoMedium from '../assets/monogram_websiteT&C-medium.webp'
import weddingLogo2x from '../assets/monogram_websiteT&C-2x.webp'
import textureSvg from '../assets/texture.svg'

const DrinkPreferencesForm = React.lazy(() => import('../components/DrinkPreferences'))

function DrinkPreferencesFormSkeleton() {
  return (
    <Box maxW="container.sm" mx="auto" px={[4, 0]} py={4}>
      <Box textAlign="center" mb={[8, 12]}>
        <Skeleton h="40px" w="250px" mx="auto" mb={4} />
        <Skeleton h="1px" w="120px" mx="auto" mb={6} />
        <Skeleton h="60px" w="80%" mx="auto" />
      </Box>
      <Box bg="#E3DFCE" p={[6, 10, 14]} borderRadius="lg">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} h="50px" w="100%" mb={6} borderRadius="full" />
        ))}
        <Skeleton h="100px" w="100%" mb={6} borderRadius="xl" />
        <Skeleton h="50px" w="100%" borderRadius="full" />
      </Box>
    </Box>
  )
}

function DrinkPreferencesPageContent() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const guestData = useDrinkToken()

  const handleSuccess = () => {
    navigate('/')
  }

  return (
    <Box id="page-top" minH="100vh" bg="#300F0C" display="flex" flexDirection="column" position="relative" overflow="hidden">
      {/* Texture Background Decoration */}
      <Box
        position="fixed"
        left={0}
        top={0}
        bottom={0}
        w={["200px", "300px", "450px", "550px"]}
        backgroundImage={`url(${textureSvg})`}
        backgroundRepeat="no-repeat"
        backgroundPosition="left center"
        backgroundSize="cover"
        pointerEvents="none"
        zIndex={0}
        sx={{
          opacity: 0.4,
          mixBlendMode: 'overlay',
          filter: 'drop-shadow(1px 1px 0px rgba(255,255,255,0.5)) drop-shadow(-1px -1px 0px rgba(0,0,0,0.2))',
        }}
      />

      {/* Header */}
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
                {t('drinkPreferences.backToHome')}
              </Button>
            </HStack>

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
        pt={["100px", "120px", "140px"]}
        pb={[12, 16, 20]}
        position="relative"
      >
        <Container maxW="container.lg" position="relative" zIndex={1}>
          <ErrorBoundary sectionName="Drink preferences form">
            <Suspense fallback={<DrinkPreferencesFormSkeleton />}>
              <DrinkPreferencesForm onSuccess={handleSuccess} guestData={guestData} />
            </Suspense>
          </ErrorBoundary>
        </Container>
      </Box>

      <Footer variant="light" />
    </Box>
  )
}

export default function DrinkPreferencesPage() {
  const { features } = useFeatureFlags()

  if (features.requirePassword) {
    return <PasswordGate><DrinkPreferencesPageContent /></PasswordGate>
  }

  return <DrinkPreferencesPageContent />
}
