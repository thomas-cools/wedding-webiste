import React, { Suspense, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Container,
  Divider,
  Text,
} from '@chakra-ui/react'
import Hero from './components/Hero'
import PasswordGate from './components/PasswordGate'
import LoadingScreen from './components/LoadingScreen'
import ErrorBoundary from './components/ErrorBoundary'
import SkipToContent from './components/SkipToContent'
import SiteHeader from './components/SiteHeader'
import {
  CountdownSkeleton,
  TimelineSkeleton,
} from './components/SectionSkeletons'
import { useFeatureFlags } from './contexts/FeatureFlagsContext'

// Import assets
import weddingLogoFull from './assets/T&C-Monogram.webp'
import Footer from './components/Footer'

// Optimized WebP images for hero collage
import envelopeSmall from './assets/envelope-400.webp'
import envelopeMedium from './assets/envelope-800.webp'
import envelopeLarge from './assets/envelope-1200.webp'
import venueSmall from './assets/venue-400.webp'
import venueLarge from './assets/venue.webp'
import stampSmall from './assets/postcard-stamp-300.webp'
import stampLarge from './assets/postcard-stamp-600.webp'

// Optimized banner WebP versions
import bannerMobile from './assets/banner-mobile.webp'
import bannerTablet from './assets/banner-tablet.webp'
import bannerDesktop from './assets/banner-desktop.webp'

const Countdown = React.lazy(() => import('./components/Countdown'))
const Timeline = React.lazy(() => import('./components/Timeline'))
const QuickLinks = React.lazy(() => import('./components/QuickLinks'))

// Elegant thin decorative divider - classic minimalist style
const ElegantDivider = ({ color = 'primary.soft', width = '120px', ...props }) => (
  <Box my={8} {...props}>
    <Divider borderColor={color} w={width} mx="auto" />
  </Box>
)

/**
 * Main app content component that uses feature flags
 */
function AppContent() {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(true)
  const { features } = useFeatureFlags()

  useEffect(() => {
    let cancelled = false

    const preloadImage = (src: string) =>
      new Promise<void>((resolve) => {
        const img = new globalThis.Image()
        const done = () => resolve()
        img.onload = done
        img.onerror = done
        img.src = src

        // Try to decode for quicker paint when possible.
        if (typeof (img as HTMLImageElement).decode === 'function') {
          ;(img as HTMLImageElement)
            .decode()
            .then(done)
            .catch(() => {
              /* ignore */
            })
        }
      })

    // Keep the loading screen only as long as needed for a smooth transition
    // and to avoid the hero collage popping in late.
    const minDelay = new Promise<void>((resolve) => setTimeout(resolve, 350))
    const maxDelay = setTimeout(() => {
      if (!cancelled) setIsLoading(false)
    }, 1200)

    // Fire-and-forget background warmup - use optimized WebP.
    void preloadImage(bannerDesktop)

    // Preload collage images - use appropriately sized optimized WebP
    Promise.all([
      minDelay,
      preloadImage(envelopeMedium),
      preloadImage(venueLarge),
      preloadImage(stampLarge),
    ]).then(() => {
      if (cancelled) return
      clearTimeout(maxDelay)
      setIsLoading(false)
    })

    return () => {
      cancelled = true
      clearTimeout(maxDelay)
    }
  }, [])

  const content = (
    <>
      {/* Skip to content link for keyboard users */}
      <SkipToContent 
        mainId="main-content"
      />
      
      <LoadingScreen isLoading={isLoading} logo={weddingLogoFull} />
      <Box minH="100vh" bg="neutral.light">
      <SiteHeader withTimelineAnchor={features.showTimeline} />

      <Box as="main" id="main-content" role="main" tabIndex={-1}>
        {/* Hero Section - using optimized responsive WebP images */}
        <Hero
          imageSet={{
            mobile: bannerMobile,
            tablet: bannerTablet,
            desktop: bannerDesktop,
            alt: 'Wedding hero background',
          }}
          overlayOpacity={0.35}
          collage={{
            envelopeSrc: envelopeMedium,
            envelopeSrcSet: { small: envelopeSmall, medium: envelopeMedium, large: envelopeLarge },
            venueSrc: venueLarge,
            venueSrcSet: { small: venueSmall, large: venueLarge },
            stampSrc: stampLarge,
            stampSrcSet: { small: stampSmall, large: stampLarge },
          }}
          showScrollIndicator={features.showTimeline}
          scrollIndicatorHref="#timeline"
        />

        {/* Countdown Section - Controlled by feature flag */}
        {features.showCountdown && (
          <ErrorBoundary sectionName="countdown" silent>
            <Suspense fallback={<CountdownSkeleton />}>
              <Countdown />
            </Suspense>
          </ErrorBoundary>
        )}

        {/* Timeline Section - Controlled by feature flag */}
        {features.showTimeline && (
          <ErrorBoundary sectionName="timeline" silent>
            <Suspense fallback={<TimelineSkeleton />}>
              <Timeline />
            </Suspense>
          </ErrorBoundary>
        )}

        {features.showTimeline && (
          <Box as="section" bg="neutral.light" px={[4, 6, 8]} py={[12, 16, 20]}>
            <Container maxW="container.md">
              <Text
                maxW="620px"
                mx="auto"
                textAlign="center"
                color="neutral.dark"
                fontSize={["sm", "md"]}
                lineHeight="1.8"
              >
                {t('timeline.communityNote')}
              </Text>
            </Container>
          </Box>
        )}

        {/* Quick Links Section */}
        <Suspense fallback={null}>
          <QuickLinks />
        </Suspense>

      </Box>

      <Footer sectionAboveBg="#F6F1EB" />
    </Box>
    </>
  )

  // Wrap with password gate if feature is enabled
  if (features.requirePassword) {
    return <PasswordGate>{content}</PasswordGate>
  }

  return content
}

/**
 * Root App component
 */
export default function App() {
  return <AppContent />
}
