import React, { Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Container,
  Skeleton,
  VStack,
} from '@chakra-ui/react'
import ErrorBoundary from '../components/ErrorBoundary'
import PasswordGate from '../components/PasswordGate'
import Footer from '../components/Footer'
import { useFeatureFlags } from '../contexts/FeatureFlagsContext'
import SiteHeader from '../components/SiteHeader'

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
  return (
    <Box id="page-top" minH="100vh" bg="neutral.light" display="flex" flexDirection="column">
      <SiteHeader withTimelineAnchor={false} />

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
