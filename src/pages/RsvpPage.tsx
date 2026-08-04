import React, { Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Container,
} from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import ErrorBoundary from '../components/ErrorBoundary'
import PasswordGate from '../components/PasswordGate'
import { RsvpFormSkeleton } from '../components/SectionSkeletons'
import Footer from '../components/Footer'
import { useFeatureFlags } from '../contexts/FeatureFlagsContext'
import SiteHeader from '../components/SiteHeader'

import textureSvg from '../assets/texture.svg'

const RsvpForm = React.lazy(() => import('../components/RsvpForm'))

function RsvpPageContent() {
  const navigate = useNavigate()

  const handleRsvpSuccess = () => {
    // Redirect to home page after successful RSVP submission
    navigate('/')
  }

  return (
    <Box id="page-top" minH="100vh" bg="#300F0C" display="flex" flexDirection="column" position="relative" overflow="hidden">
      {/* Texture Background Decoration - Left Side */}
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
      <SiteHeader withTimelineAnchor={false} />

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
          <ErrorBoundary sectionName="RSVP form">
            <Suspense fallback={<RsvpFormSkeleton />}>
              <RsvpForm onSuccess={handleRsvpSuccess} />
            </Suspense>
          </ErrorBoundary>
        </Container>
      </Box>

      <Footer variant="light" />
    </Box>
  )
}

export default function RsvpPage() {
  const { features } = useFeatureFlags()

  // Wrap with password gate if feature is enabled
  if (features.requirePassword) {
    return <PasswordGate bg="#300F0C"><RsvpPageContent /></PasswordGate>
  }

  return <RsvpPageContent />
}
