import React, { Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
} from '@chakra-ui/react'
import ErrorBoundary from '../components/ErrorBoundary'
import PasswordGate from '../components/PasswordGate'
import { AccommodationSkeleton } from '../components/SectionSkeletons'
import Footer from '../components/Footer'
import { useFeatureFlags } from '../contexts/FeatureFlagsContext'
import SiteHeader from '../components/SiteHeader'

const AccommodationSection = React.lazy(() =>
  import('../components/AccommodationSection/AccommodationSection').then((m) => ({ default: m.AccommodationSection }))
)

function AccommodationsPageContent() {
  return (
    <Box id="page-top" minH="100vh" bg="#E3DFCE" display="flex" flexDirection="column" position="relative" overflow="hidden">
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
        <ErrorBoundary sectionName="accommodations">
          <Suspense fallback={<AccommodationSkeleton />}>
            <AccommodationSection enabled={true} />
          </Suspense>
        </ErrorBoundary>
      </Box>

      <Footer sectionAboveBg="#E3DFCE" />
    </Box>
  )
}

export default function AccommodationsPage() {
  const { features } = useFeatureFlags()

  // Wrap with password gate if feature is enabled
  if (features.requirePassword) {
    return <PasswordGate bg="#E3DFCE"><AccommodationsPageContent /></PasswordGate>
  }

  return <AccommodationsPageContent />
}
