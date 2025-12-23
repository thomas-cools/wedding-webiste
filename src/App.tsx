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
import { ScrollReveal, StaggerContainer, StaggerItem, fadeInLeft, fadeInRight, scaleIn } from './components/animations'
import { features, weddingConfig } from './config'

// Import assets
import heroBanner from './assets/Banner-wedding-01.jpeg'
import envelopeImage from './assets/Envelope.png'
import weddingLogo from './assets/T&C-Monogram-small.webp'
import weddingLogo2x from './assets/T&C-Monogram-2x.webp'
import weddingLogoFull from './assets/T&C-Monogram.webp'
import airbnbLogo from './assets/airbnb-tile.svg'
import bookingLogo from './assets/booking-tile.svg'
import venueImage from './assets/venue.png'
import postcardStamp from './assets/postcard-stamp-T&C.png'

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

export default function App() {
  const { t } = useTranslation()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [isLoading, setIsLoading] = useState(true)

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

    // Fire-and-forget background warmup.
    void preloadImage(heroBanner)

    Promise.all([
      minDelay,
      preloadImage(envelopeImage),
      preloadImage(venueImage),
      preloadImage(postcardStamp),
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
      <LoadingScreen isLoading={isLoading} logo={weddingLogoFull} />
      <Box minH="100vh" bg="neutral.light">
      {/* Minimal Elegant Header */}
      <Box 
        as="header" 
        py={[4, 6]} 
        position="fixed" 
        top={0} 
        left={0} 
        right={0} 
        zIndex={100}
        bg="neutral.light"
        borderBottom="1px solid"
        borderColor="primary.soft"
      >
        <Container maxW="container.xl" px={[4, 6, 8]}>
          <Flex justify="space-between" align="center">
            <ChakraImage 
              src={weddingLogo} 
              srcSet={`${weddingLogo} 1x, ${weddingLogo2x} 2x`}
              alt={t('header.initials')}
              h={["60px", "80px", "100px"]}
              w="auto"
            />
            <HStack spacing={[2, 4, 10]}>
              {/* Desktop Navigation */}
              <HStack spacing={10} display={["none", "none", "flex"]}>
                {navLinks.map((link) => (
                  <Button key={link.href} as="a" href={link.href} variant="ghost" size="sm">
                    {link.label}
                  </Button>
                ))}
              </HStack>
              <LanguageSwitcher />
              {/* Mobile Hamburger Menu */}
              <IconButton
                aria-label="Open menu"
                icon={<HamburgerIcon />}
                variant="ghost"
                display={["flex", "flex", "none"]}
                onClick={onOpen}
                size="sm"
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

      <Box as="main">
        {/* Hero Section */}
        <Hero
          backgroundImage={heroBanner}
          overlayOpacity={0.35}
          collage={{ envelopeSrc: envelopeImage, venueSrc: venueImage, stampSrc: postcardStamp }}
          showScrollIndicator={features.showStory}
          scrollIndicatorHref="#story"
        />

        {/* Countdown Section - Controlled by feature flag */}
        {features.showCountdown && (
          <Suspense fallback={null}>
            <Countdown />
          </Suspense>
        )}

        {/* Story Section - Controlled by feature flag */}
        {features.showStory && (
          <Suspense fallback={null}>
            <StorySection />
          </Suspense>
        )}

        {/* Timeline Section - Controlled by feature flag */}
        {features.showTimeline && (
          <Suspense fallback={null}>
            <Timeline />
          </Suspense>
        )}

        {/* Photo Gallery Section - Controlled by feature flag */}
        {features.showGallery && (
          <Suspense fallback={null}>
            <PhotoGallery />
          </Suspense>
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
                    <Text fontSize="sm" color="neutral.muted">{t('details.time.dinner')}</Text>
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
                    <Text fontSize="sm" color="primary.soft">{t('details.time.ceremony')}</Text>
                    <Text fontSize="sm" color="primary.soft">{t('details.time.reception')}</Text>
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
                    <Text fontSize="sm" color="neutral.muted">{t('details.time.brunch')}</Text>
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
        <Suspense fallback={null}>
          <AccommodationSection enabled={features.showAccommodation} />
        </Suspense>

        {/* RSVP Section */}
        <Box id="rsvp" py={[20, 28]} bg="secondary.slate" scrollMarginTop={["100px", "130px", "150px"]}>
          <Container maxW="container.lg">
            <ScrollReveal variants={scaleIn}>
              <Suspense fallback={null}>
                <RsvpForm />
              </Suspense>
            </ScrollReveal>
          </Container>
        </Box>
      </Box>

      {/* Footer - Minimal & Elegant */}
      <Box 
        as="footer" 
        py={16} 
        textAlign="center" 
        bg="neutral.light"
      >
        <Container maxW="container.lg">
          <ScrollReveal>
            <VStack spacing={6}>
              <Divider borderColor="primary.soft" w="80px" opacity={0.5} />
              <Heading 
                fontFamily="heading" 
                fontSize="2xl" 
                fontWeight="400" 
                letterSpacing="0.1em"
              >
                {t('header.initials')}
              </Heading>
              <Text 
                fontSize="sm" 
                letterSpacing="0.15em"
                textTransform="uppercase"
              >
                {t('footer.date')}
              </Text>
              <Text fontSize="xs" color="neutral.muted" mt={4}>
                {t('footer.madeWith')}
              </Text>
            </VStack>
          </ScrollReveal>
        </Container>
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
