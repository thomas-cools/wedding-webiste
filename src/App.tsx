import React, { Suspense, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Text,
  Heading,
  Button,
  Image as ChakraImage,
  Container,
  Flex,
  VStack,
  HStack,
  Divider,
  SimpleGrid,
  IconButton,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerBody,
  useDisclosure,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
  Link
} from '@chakra-ui/react';
import { HamburgerIcon, ExternalLinkIcon } from '@chakra-ui/icons'
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
  GallerySkeleton,
  AccommodationSkeleton,
  RsvpFormSkeleton,
} from './components/SectionSkeletons'
import { ScrollReveal, StaggerContainer, StaggerItem, fadeInLeft, fadeInRight, scaleIn } from './components/animations'
import { weddingConfig } from './config'
import { FeatureFlagsProvider, useFeatureFlags } from './contexts/FeatureFlagsContext'

// Import assets
import weddingLogoSmall from './assets/monogram_websiteT&C-small.webp'
import weddingLogoMedium from './assets/monogram_websiteT&C-medium.webp'
import weddingLogo2x from './assets/monogram_websiteT&C-2x.webp'
import weddingLogoFull from './assets/T&C-Monogram.webp'
import airbnbLogo from './assets/airbnb-tile.svg'
import bookingLogo from './assets/booking-tile.svg'
import footerDetail from './assets/footer_detail.svg'
import signatureSvg from './assets/carolina_and_thomas_signature.svg'

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
const PhotoGallery = React.lazy(() =>
  import('./components/PhotoGallery').then((m) => ({ default: m.PhotoGallery }))
)
const AccommodationSection = React.lazy(() =>
  import('./components/AccommodationSection').then((m) => ({ default: m.AccommodationSection }))
)
const RsvpForm = React.lazy(() => import('./components/RsvpForm'))

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
    { href: '#story', label: t('header.ourStory'), enabled: features.showStory },
    { href: '#details', label: t('header.details'), enabled: true },
    { href: '#travel', label: t('header.travel'), enabled: features.showAccommodation },
    { href: '#rsvp', label: t('header.rsvp'), enabled: true },
  ].filter((link) => link.enabled)

  const content = (
    <>
      {/* Skip to content link for keyboard users */}
      <SkipToContent 
        mainId="main-content"
        additionalLinks={[
          { id: 'rsvp', labelKey: 'accessibility.skipToRsvp' },
        ]}
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
          <Flex justify="center" align="center" position="relative">
            {/* Left Navigation - Desktop */}
            <HStack 
              as="nav" 
              aria-label={t('accessibility.mainNavigation', 'Main navigation')}
              spacing={10} 
              display={["none", "none", "flex"]}
              position="absolute"
              left={0}
            >
              {navLinks.slice(0, Math.ceil(navLinks.length / 2)).map((link) => (
                <Button key={link.href} as="a" href={link.href} variant="ghost" size="sm" color="white" _hover={{ bg: 'whiteAlpha.200' }}>
                  {link.label}
                </Button>
              ))}
            </HStack>
            
            {/* Centered Logo */}
            <ChakraImage 
              src={weddingLogoSmall} 
              srcSet={`${weddingLogoSmall} 60w, ${weddingLogoMedium} 100w, ${weddingLogo2x} 200w`}
              sizes="(max-width: 480px) 40px, (max-width: 768px) 45px, 50px"
              alt={t('header.initials')}
              h={["40px", "45px", "50px"]}
              w="auto"
            />
            
            {/* Right Navigation - Desktop */}
            <HStack 
              spacing={10} 
              display={["none", "none", "flex"]}
              position="absolute"
              right={0}
              align="center"
            >
              {navLinks.slice(Math.ceil(navLinks.length / 2)).map((link) => (
                <Button key={link.href} as="a" href={link.href} variant="ghost" size="sm" color="white" _hover={{ bg: 'whiteAlpha.200' }}>
                  {link.label}
                </Button>
              ))}
              <LanguageSwitcher />
            </HStack>
            
            {/* Mobile Controls */}
            <HStack 
              spacing={2} 
              display={["flex", "flex", "none"]}
              position="absolute"
              right={0}
            >
              <LanguageSwitcher />
              <IconButton
                aria-label="Open menu"
                icon={<HamburgerIcon />}
                variant="ghost"
                onClick={onOpen}
                size="sm"
                color="white"
                _hover={{ bg: 'whiteAlpha.200' }}
              />
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Mobile Navigation Drawer */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent bg="neutral.light">
          <DrawerCloseButton />
          <DrawerBody pt={16}>
            <VStack spacing={6} align="stretch">
              {navLinks.map((link) => (
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
              ))}
              <Divider borderColor="primary.soft" />
              <Button
                as="a"
                href="#rsvp"
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
          showScrollIndicator={features.showStory}
          scrollIndicatorHref="#story"
        />

        {/* Countdown Section - Controlled by feature flag */}
        {features.showCountdown && (
          <ErrorBoundary sectionName="countdown" silent>
            <Suspense fallback={<CountdownSkeleton />}>
              <Countdown />
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

        {/* Timeline Section - Controlled by feature flag */}
        {features.showTimeline && (
          <ErrorBoundary sectionName="timeline" silent>
            <Suspense fallback={<TimelineSkeleton />}>
              <Timeline />
            </Suspense>
          </ErrorBoundary>
        )}

        {/* Photo Gallery Section - Controlled by feature flag */}
        {features.showGallery && (
          <ErrorBoundary sectionName="gallery" silent>
            <Suspense fallback={<GallerySkeleton />}>
              <PhotoGallery />
            </Suspense>
          </ErrorBoundary>
        )}

        {/* Details Section */}
        <Box id="details" py={[20, 28]} bg="neutral.light" scrollMarginTop={["100px", "130px", "150px"]}>
          <Container maxW="container.lg">
            <VStack spacing={16}>
              {/* Section Header */}
              <ScrollReveal>
                <VStack spacing={4} textAlign="center">
                  <Text 
                    fontSize="xs" 
                    textTransform="uppercase" 
                    letterSpacing="0.35em" 
                    color="primary.soft"
                    fontWeight="500"
                  >
                    {t('details.label')}
                  </Text>
                  <Heading 
                    as="h2" 
                    fontFamily="heading" 
                    fontSize={["3xl", "4xl"]} 
                    fontWeight="400"
                  >
                    {t('details.title')}
                  </Heading>
                  <ElegantDivider my={2} />
                </VStack>
              </ScrollReveal>

                      color="primary.deep"
              {/* Event Cards - Refined Minimal Design */}
              <StaggerContainer as={SimpleGrid} columns={[1, 1, 3]} spacing={8} w="full" maxW="900px">
                {/* Friday */}
                <StaggerItem>
                  <VStack 
                    p={10} 
                    bg="white"
                    textAlign="center"
                    spacing={4}
                    borderWidth="1px"
                    borderColor="primary.soft"
                    h="full"
                  >
                    <Text 
                      fontSize="xs" 
                      textTransform="uppercase" 
                      letterSpacing="0.3em" 
                      color="primary.soft"
                      fontWeight="500"
                    >
                      {t('details.friday')}
                    </Text>
                    <Heading 
                      as="h3" 
                      fontFamily="heading" 
                      fontSize="xl" 
                      fontWeight="400"
                    >
                      {t('details.welcomeDinner')}
                    </Heading>
                    <Divider borderColor="primary.soft" w="40px" opacity={0.5} />
                    <Text fontSize="sm" color="neutral.dark">{t('details.date.friday')}</Text>
                  </VStack>
                </StaggerItem>

                {/* Saturday - Featured */}
                <StaggerItem>
                  <VStack 
                    p={10} 
                    bg="neutral.dark"
                    textAlign="center"
                    spacing={4}
                    h="full"
                  >
                    <Text 
                      fontSize="xs" 
                      textTransform="uppercase" 
                      letterSpacing="0.3em" 
                      color="primary.soft"
                      fontWeight="500"
                    >
                      {t('details.saturday')}
                    </Text>
                    <Heading 
                      as="h3" 
                      fontFamily="heading" 
                      fontSize="xl" 
                      fontWeight="400"
                      color="neutral.light"
                    >
                      {t('details.theWedding')}
                    </Heading>
                    <Divider borderColor="primary.soft" w="40px" opacity={0.5} />
                    <Text fontSize="sm" color="neutral.light">{t('details.date.saturday')}</Text>
                  </VStack>
                </StaggerItem>

                {/* Sunday */}
                <StaggerItem>
                  <VStack 
                    p={10} 
                    bg="white"
                    textAlign="center"
                    spacing={4}
                    borderWidth="1px"
                    borderColor="primary.soft"
                    h="full"
                  >
                    <Text 
                      fontSize="xs" 
                      textTransform="uppercase" 
                      letterSpacing="0.3em" 
                      color="primary.soft"
                      fontWeight="500"
                    >
                      {t('details.sunday')}
                    </Text>
                    <Heading 
                      as="h3" 
                      fontFamily="heading" 
                      fontSize="xl" 
                      fontWeight="400"
                      color="primary.deep"
                    >
                      {t('details.farewellBrunch')}
                    </Heading>
                    <Divider borderColor="primary.soft" w="40px" opacity={0.5} />
                    <Text fontSize="sm" color="neutral.dark">{t('details.date.sunday')}</Text>
                  </VStack>
                </StaggerItem>
              </StaggerContainer>

              {/* Venue Info */}
              <ScrollReveal>
                <VStack spacing={2} textAlign="center" pt={8}>
                  <Text fontSize="sm" textTransform="uppercase" letterSpacing="0.2em" color="neutral.dark">
                    {t('details.venueName')}
                  </Text>
                  <Link 
                    href={weddingConfig.venue.googleMapsUrl} 
                    isExternal
                    _hover={{ color: 'primary.deep' }}
                  >
                    <Text fontSize="sm" color="neutral.muted" fontStyle="italic" _hover={{ textDecoration: 'underline' }}>
                      {t('details.venueAddress')} ↗
                    </Text>
                  </Link>
                </VStack>
              </ScrollReveal>
            </VStack>
          </Container>
        </Box>

        {/* Travel & Accommodation Section */}
        <ErrorBoundary sectionName="accommodation" silent>
          <Suspense fallback={<AccommodationSkeleton />}>
            <AccommodationSection enabled={features.showAccommodation} />
          </Suspense>
        </ErrorBoundary>

        {/* RSVP Section */}
        <Box id="rsvp" py={[20, 28]} bg="secondary.slate" scrollMarginTop={["100px", "130px", "150px"]}>
          <Container maxW="container.lg">
            <ScrollReveal variants={scaleIn}>
              <ErrorBoundary sectionName="RSVP form">
                <Suspense fallback={<RsvpFormSkeleton />}>
                  <RsvpForm />
                </Suspense>
              </ErrorBoundary>
            </ScrollReveal>
          </Container>
        </Box>
      </Box>

      {/* Footer - Elegant Dark Design */}
      <Box as="footer" position="relative" overflow="hidden">
        {/* Decorative scalloped border - positioned to overlap footer */}
        <ChakraImage
          src={footerDetail}
          alt=""
          w="100%"
          h="auto"
          display="block"
          minW="1440px"
          objectFit="cover"
          objectPosition="center"
          transform="translateX(-50%)"
          position="relative"
          left="50%"
          mb="-31px"
        />
        
        {/* Footer content */}
        <Box 
          bg="#300F0C" 
          py={16} 
          textAlign="center"
        >
          <Container maxW="container.lg">
            <ScrollReveal>
              <VStack spacing={6}>
                <Text 
                  color="white" 
                  fontSize="md" 
                  fontFamily="body"
                  letterSpacing="0.05em"
                >
                  {t('footer.contactUs')}
                </Text>
                <Link
                  href="mailto:carolinaandthomaswedding@gmail.com"
                  color="white"
                  fontSize="md"
                  fontFamily="body"
                  letterSpacing="0.02em"
                  _hover={{ opacity: 0.8, textDecoration: 'underline' }}
                >
                  carolinaandthomaswedding@gmail.com
                </Link>
                <ChakraImage
                  src={signatureSvg}
                  alt="Carolina & Thomas"
                  maxW={{ base: '200px', md: '280px' }}
                  mt={6}
                />
              </VStack>
            </ScrollReveal>
          </Container>
        </Box>
      </Box>
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
 * Root App component with FeatureFlagsProvider
 */
export default function App() {
  return (
    <FeatureFlagsProvider>
      <AppContent />
    </FeatureFlagsProvider>
  )
}
