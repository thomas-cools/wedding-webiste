import React, { Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
} from '@chakra-ui/react'
import ErrorBoundary from '../components/ErrorBoundary'
import PasswordGate from '../components/PasswordGate'
import { SectionSkeleton } from '../components/SectionSkeletons'
import Footer from '../components/Footer'
import { useFeatureFlags } from '../contexts/FeatureFlagsContext'
import SiteHeader from '../components/SiteHeader'

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

      <SiteHeader />

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
