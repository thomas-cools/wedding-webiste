import React, { Suspense, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Button,
  Image as ChakraImage,
  Container,
  Flex,
  VStack,
  HStack,
  Divider,
  Grid,
  IconButton,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerBody,
  useDisclosure} from '@chakra-ui/react';
import { Link } from 'react-router-dom'
import { HamburgerIcon } from '@chakra-ui/icons'
import LanguageSwitcher from './components/LanguageSwitcher'
import Hero from './components/Hero'
import PasswordGate from './components/PasswordGate'
import LoadingScreen from './components/LoadingScreen'
import ErrorBoundary from './components/ErrorBoundary'
import SkipToContent from './components/SkipToContent'
import {
  CountdownSkeleton,
  StorySkeleton,
  TimelineSkeleton,
} from './components/SectionSkeletons'
import { useFeatureFlags } from './contexts/FeatureFlagsContext'

// Import assets
import weddingLogoSmall from './assets/monogram_websiteT&C-small.webp'
import weddingLogoMedium from './assets/monogram_websiteT&C-medium.webp'
import weddingLogo2x from './assets/monogram_websiteT&C-2x.webp'
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
const StorySection = React.lazy(() => import('./components/StorySection'))
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
  const { isOpen, onOpen, onClose } = useDisclosure()
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

  const navLinks = [
    { href: '/gallery', label: t('header.ourStory'), enabled: features.showGallery, isExternal: true },
    { href: '/accommodations', label: t('header.travel'), enabled: features.showAccommodation, isExternal: true },
    { href: '/faq', label: t('header.faq'), enabled: true, isExternal: true },
    { href: '/rsvp', label: t('header.rsvp'), enabled: true, isExternal: true },
  ].filter((link) => link.enabled)

  const content = (
    <>
      {/* Skip to content link for keyboard users */}
      <SkipToContent 
        mainId="main-content"
      />
      
      <LoadingScreen isLoading={isLoading} logo={weddingLogoFull} />
      <Box minH="100vh" bg="neutral.light">
      {/* Minimal Elegant Header */}
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
          <Grid templateColumns="1fr auto 1fr" alignItems="center" width="100%">
            {/* Left Navigation - Desktop */}
            <Box>
              <HStack 
                as="nav" 
                aria-label={t('accessibility.mainNavigation', 'Main navigation')}
                spacing={10} 
                display={["none", "none", "flex"]}
              >
                {navLinks.slice(0, Math.ceil(navLinks.length / 2)).map((link) => 
                  link.isExternal ? (
                    <Button key={link.href} as={Link} to={link.href} variant="ghost" size="sm" color="#E3DFCE" _hover={{ bg: 'whiteAlpha.200' }}>
                      {link.label}
                    </Button>
                  ) : (
                    <Button key={link.href} as="a" href={link.href} variant="ghost" size="sm" color="#E3DFCE" _hover={{ bg: 'whiteAlpha.200' }}>
                      {link.label}
                    </Button>
                  )
                )}
              </HStack>
            </Box>
            
            {/* Centered Logo */}
            <Flex justify="center">
              <ChakraImage 
                src={weddingLogoSmall} 
                srcSet={`${weddingLogoSmall} 60w, ${weddingLogoMedium} 100w, ${weddingLogo2x} 200w`}
                sizes="(max-width: 480px) 40px, (max-width: 768px) 45px, 50px"
                alt={t('header.initials')}
                h={["40px", "45px", "50px"]}
                w="auto"
              />
            </Flex>
            
            {/* Right Navigation - Desktop & Mobile Controls */}
            <Flex justify="flex-end" align="center">
              {/* Desktop Right Nav */}
              <HStack 
                spacing={10} 
                display={["none", "none", "flex"]}
                align="center"
              >
                {navLinks.slice(Math.ceil(navLinks.length / 2)).map((link) => 
                  link.isExternal ? (
                    <Button key={link.href} as={Link} to={link.href} variant="ghost" size="sm" color="#E3DFCE" _hover={{ bg: 'whiteAlpha.200' }}>
                      {link.label}
                    </Button>
                  ) : (
                    <Button key={link.href} as="a" href={link.href} variant="ghost" size="sm" color="#E3DFCE" _hover={{ bg: 'whiteAlpha.200' }}>
                      {link.label}
                    </Button>
                  )
                )}
                <LanguageSwitcher />
              </HStack>
              
              {/* Mobile Controls */}
              <HStack 
                spacing={2} 
                display={["flex", "flex", "none"]}
              >
                <LanguageSwitcher />
                <IconButton
                  aria-label="Open menu"
                  icon={<HamburgerIcon />}
                  variant="ghost"
                  onClick={onOpen}
                  size="sm"
                  color="#E3DFCE"
                  _hover={{ bg: 'whiteAlpha.200' }}
                />
              </HStack>
            </Flex>
          </Grid>
        </Container>
      </Box>

      {/* Mobile Navigation Drawer */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent bg="neutral.light">
          <DrawerCloseButton />
          <DrawerBody pt={16}>
            <VStack spacing={6} align="stretch">
              {navLinks.map((link) => 
                link.isExternal ? (
                  <Button
                    key={link.href}
                    as={Link}
                    to={link.href}
                    variant="ghost"
                    size="lg"
                    justifyContent="flex-start"
                    onClick={onClose}
                  >
                    {link.label}
                  </Button>
                ) : (
                  <Button
                    key={link.href}
                    as="a"
                    href={link.href}
                    variant="ghost"
                    size="lg"
                    justifyContent="flex-start"
                    onClick={onClose}
                  >
                    {link.label}
                  </Button>
                )
              )}
              <Divider borderColor="primary.soft" />
              <Button
                as={Link}
                to="/rsvp"
                variant="primary"
                size="lg"
                onClick={onClose}
              >
                {t('hero.respond')}
              </Button>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

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

        {/* Timeline Section - Controlled by feature flag */}
        {features.showTimeline && (
          <ErrorBoundary sectionName="timeline" silent>
            <Suspense fallback={<TimelineSkeleton />}>
              <Timeline />
            </Suspense>
          </ErrorBoundary>
        )}

        {/* Story Section - Controlled by feature flag */}
        {features.showStory && (
          <ErrorBoundary sectionName="our story" silent>
            <Suspense fallback={<StorySkeleton />}>
              <StorySection />
            </Suspense>
          </ErrorBoundary>
        )}

        {/* Countdown Section - Controlled by feature flag */}
        {features.showCountdown && (
          <ErrorBoundary sectionName="countdown" silent>
            <Suspense fallback={<CountdownSkeleton />}>
              <Countdown />
            </Suspense>
          </ErrorBoundary>
        )}

        {/* Quick Links Section */}
        <Suspense fallback={null}>
          <QuickLinks />
        </Suspense>

      </Box>

      <Footer sectionAboveBg="white" />
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
