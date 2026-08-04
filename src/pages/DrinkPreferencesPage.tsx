import React, { Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Container,
  Skeleton,
} from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import ErrorBoundary from '../components/ErrorBoundary'
import PasswordGate from '../components/PasswordGate'
import Footer from '../components/Footer'
import { useFeatureFlags } from '../contexts/FeatureFlagsContext'
import { useDrinkToken } from '../components/DrinkPreferences/useDrinkToken'
import SiteHeader from '../components/SiteHeader'

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

      <SiteHeader />

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
