import React from 'react'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  Box, 
  Text, 
  Heading, 
  Button, 
  Image, 
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
} from '@chakra-ui/react'
import { HamburgerIcon, ExternalLinkIcon } from '@chakra-ui/icons'
import RsvpForm from './components/RsvpForm'
import LanguageSwitcher from './components/LanguageSwitcher'
import Hero from './components/Hero'
import Timeline from './components/Timeline'
import Countdown from './components/Countdown'
import PasswordGate from './components/PasswordGate'
import { PhotoGallery } from './components/PhotoGallery'
import LoadingScreen from './components/LoadingScreen'
import { ScrollReveal, StaggerContainer, StaggerItem, fadeInLeft, fadeInRight, scaleIn } from './components/animations'
import { features } from './config'

// Import assets
import heroBanner from './assets/Banner-wedding-01.jpeg'
import weddingLogo from './assets/T&C-Monogram-small.webp'
import weddingLogo2x from './assets/T&C-Monogram-2x.webp'
import weddingLogoFull from './assets/T&C-Monogram.webp'

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
    // Simulate minimum loading time for smooth animation
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1800)
    return () => clearTimeout(timer)
  }, [])

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
            <Image 
              src={weddingLogo} 
              srcSet={`${weddingLogo} 1x, ${weddingLogo2x} 2x`}
              alt={t('header.initials')}
              h={["60px", "80px", "100px"]}
              w="auto"
            />
            <HStack spacing={[2, 4, 10]}>
              {/* Desktop Navigation */}
              <HStack spacing={10} display={["none", "none", "flex"]}>
                <Button as="a" href="#story" variant="ghost" size="sm">
                  {t('header.ourStory')}
                </Button>
                <Button as="a" href="#details" variant="ghost" size="sm">
                  {t('header.details')}
                </Button>
                <Button as="a" href="#travel" variant="ghost" size="sm">
                  {t('header.travel')}
                </Button>
                <Button as="a" href="#rsvp" variant="ghost" size="sm">
                  {t('header.rsvp')}
                </Button>
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
              <Button 
                as="a" 
                href="#story" 
                variant="ghost" 
                size="lg" 
                justifyContent="flex-start"
                onClick={onClose}
              >
                {t('header.ourStory')}
              </Button>
              <Button 
                as="a" 
                href="#details" 
                variant="ghost" 
                size="lg" 
                justifyContent="flex-start"
                onClick={onClose}
              >
                {t('header.details')}
              </Button>
              <Button 
                as="a" 
                href="#travel" 
                variant="ghost" 
                size="lg" 
                justifyContent="flex-start"
                onClick={onClose}
              >
                {t('header.travel')}
              </Button>
              <Button 
                as="a" 
                href="#rsvp" 
                variant="ghost" 
                size="lg" 
                justifyContent="flex-start"
                onClick={onClose}
              >
                {t('header.rsvp')}
              </Button>
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
        <Hero backgroundImage={heroBanner} overlayOpacity={0.35} />

        {/* Countdown Section - Controlled by feature flag */}
        {features.showCountdown && <Countdown />}

        {/* Story Section */}
        <Box id="story" py={[20, 28]} bg="white" scrollMarginTop={["100px", "130px", "150px"]}>
          <Container maxW="container.lg">
            <VStack spacing={16}>
              {/* Section Header */}
              <ScrollReveal>
                <VStack spacing={4} textAlign="center" maxW="600px">
                  <Text 
                    fontSize="xs" 
                    textTransform="uppercase" 
                    letterSpacing="0.35em" 
                    color="primary.soft"
                    fontWeight="500"
                  >
                    {t('story.label')}
                  </Text>
                  <Heading 
                    as="h2" 
                    fontFamily="heading" 
                    fontSize={["3xl", "4xl"]} 
                    fontWeight="400"
                  >
                    {t('story.title')}
                  </Heading>
                  <ElegantDivider my={2} />
                </VStack>
              </ScrollReveal>
              
              {/* Story Content - Elegant Layout */}
              <Flex 
                direction={["column", "column", "row"]} 
                gap={[10, 10, 16]} 
                align="center"
                maxW="1000px"
              >
                <ScrollReveal variants={fadeInLeft} flex={1} maxW={["100%", "100%", "450px"]}>
                  <Image 
                    src="https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=2070&auto=format&fit=crop" 
                    alt="Sofia and Lucas" 
                    w="100%"
                    h={["300px", "400px", "500px"]}
                    objectFit="cover"
                  />
                </ScrollReveal>
                <ScrollReveal variants={fadeInRight} flex={1}>
                  <VStack align={["center", "center", "flex-start"]} spacing={6} textAlign={["center", "center", "left"]}>
                    <Text fontSize="lg" lineHeight="1.9">
                      {t('story.paragraph1')}
                    </Text>
                    <Text fontSize="lg" lineHeight="1.9">
                      {t('story.paragraph2')}
                    </Text>
                    <Text 
                      fontFamily="heading" 
                      fontStyle="italic" 
                      fontSize="xl"
                      color="primary.deep" 
                      mt={4}
                    >
                      "{t('story.quote')}"
                    </Text>
                  </VStack>
                </ScrollReveal>
              </Flex>
            </VStack>
          </Container>
        </Box>

        {/* Timeline Section - Controlled by feature flag */}
        {features.showTimeline && <Timeline />}

        {/* Photo Gallery Section - Controlled by feature flag */}
        {features.showGallery && <PhotoGallery />}

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
                  <Text fontSize="sm" color="neutral.muted" fontStyle="italic">
                    {t('details.venueAddress')}
                  </Text>
                </VStack>
              </ScrollReveal>
            </VStack>
          </Container>
        </Box>

        {/* Travel & Accommodation Section */}
        <Box id="travel" py={[20, 28]} bg="white" scrollMarginTop={["100px", "130px", "150px"]}>
          <Container maxW="container.lg">
            <VStack spacing={12}>
              {/* Section Header */}
              <ScrollReveal>
                <VStack spacing={4} textAlign="center">
                  <Text 
                    fontSize="sm" 
                    textTransform="uppercase" 
                    letterSpacing="0.3em" 
                    color="primary.soft"
                    fontWeight="500"
                  >
                    {t('travel.label')}
                  </Text>
                  <Heading 
                    as="h2"
                    fontFamily="heading"
                    fontSize={["3xl", "4xl", "5xl"]}
                    fontWeight="400"
                    color="neutral.dark"
                  >
                    {t('travel.title')}
                  </Heading>
                  <ElegantDivider my={2} />
                  <Text 
                    fontSize="md" 
                    color="neutral.muted" 
                    maxW="600px"
                    lineHeight="tall"
                  >
                    {t('travel.subtitle')}
                  </Text>
                </VStack>
              </ScrollReveal>

              {/* Accommodation Tabs */}
              <ScrollReveal>
                <Box w="full" maxW="900px" mx="auto">
                  <Tabs variant="soft-rounded" colorScheme="gray" isFitted>
                    <TabList 
                      bg="neutral.light" 
                      p={2} 
                      borderRadius="full"
                      border="1px solid"
                      borderColor="primary.soft"
                      mb={8}
                    >
                      <Tab 
                        _selected={{ bg: 'neutral.dark', color: 'white' }}
                        fontWeight="500"
                        fontSize="sm"
                        letterSpacing="0.05em"
                      >
                        {t('travel.tabs.airbnb')}
                      </Tab>
                      <Tab 
                        _selected={{ bg: 'neutral.dark', color: 'white' }}
                        fontWeight="500"
                        fontSize="sm"
                        letterSpacing="0.05em"
                      >
                        {t('travel.tabs.hotels')}
                      </Tab>
                    </TabList>

                    <TabPanels>
                      {/* Airbnb Tab */}
                      <TabPanel p={0}>
                        <Box 
                          bg="neutral.light" 
                          borderWidth="1px" 
                          borderColor="primary.soft"
                          p={[8, 10]}
                        >
                          <VStack spacing={6} textAlign="center">
                            {/* Airbnb Logo/Icon */}
                            <Box
                              as="svg"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              w="48px"
                              h="48px"
                              fill="#FF5A5F"
                            >
                              <path d="M12.001 18.275c-.649-.8-1.156-1.6-1.499-2.274-.415-.857-.632-1.628-.632-2.356 0-1.057.415-1.728 1.056-1.928a.912.912 0 0 1 .275-.043c.414 0 .828.2 1.113.571.285-.371.7-.571 1.113-.571.1 0 .185.014.271.043.642.2 1.057.871 1.057 1.928 0 .728-.214 1.499-.628 2.356-.357.671-.857 1.471-1.5 2.271l-.314.4-.312-.397zm.57-8.686c1.114 0 2.07.714 2.485 1.728.128-.214.271-.414.428-.6.557-.67 1.342-1.085 2.185-1.085.185 0 .357.014.542.057 1.614.4 2.57 1.985 2.57 4.085 0 1.442-.443 2.928-1.285 4.442-.843 1.528-2.114 3.185-3.756 4.899l-.028.029-.029.028-1.871 1.9c-.742.757-1.713 1.128-2.713 1.128-.999 0-1.985-.385-2.713-1.128l-1.871-1.9-.057-.057c-1.642-1.714-2.914-3.371-3.756-4.899-.843-1.514-1.286-3-1.286-4.442 0-2.1.957-3.685 2.571-4.085.185-.043.357-.057.543-.057.842 0 1.628.414 2.185 1.085.157.186.3.386.428.6.414-1.014 1.371-1.728 2.485-1.728h-.057z"/>
                            </Box>
                            
                            <Heading 
                              as="h3" 
                              fontFamily="heading" 
                              fontSize="xl" 
                              fontWeight="400"
                              color="neutral.dark"
                            >
                              {t('travel.airbnbTitle')}
                            </Heading>
                            
                            <Text fontSize="sm" color="neutral.muted" maxW="450px">
                              {t('travel.airbnbDescription')}
                            </Text>

                            {/* Airbnb Search Button */}
                            <Button
                              as="a"
                              href="https://www.airbnb.com/s/Ch%C3%A2teau-du-Pujolet--Vallesvilles--France/homes?refinement_paths%5B%5D=%2Fhomes&date_picker_type=calendar&checkin=2026-08-24&checkout=2026-08-28&adults=2&search_type=autocomplete_click&flexible_trip_lengths%5B%5D=one_week&monthly_start_date=2026-01-01&monthly_length=3&monthly_end_date=2026-04-01&price_filter_input_type=2&price_filter_num_nights=4&channel=EXPLORE&place_id=ChIJP_GaICSQrhIRMqr4tYT_Wcw&acp_id=t-g-ChIJP_GaICSQrhIRMqr4tYT_Wcw"
                              target="_blank"
                              rel="noopener noreferrer"
                              variant="primary"
                              size="lg"
                              rightIcon={<ExternalLinkIcon />}
                              _hover={{
                                transform: "translateY(-2px)",
                                boxShadow: "lg"
                              }}
                              transition="all 0.2s"
                            >
                              {t('travel.searchAirbnb')}
                            </Button>
                          </VStack>
                        </Box>
                      </TabPanel>

                      {/* Hotels Tab */}
                      <TabPanel p={0}>
                        <VStack spacing={8}>
                          {/* Hotels Introduction */}
                          <Box 
                            bg="neutral.light" 
                            borderWidth="1px" 
                            borderColor="primary.soft"
                            p={[6, 8]}
                            w="full"
                            textAlign="center"
                          >
                            <VStack spacing={4}>
                              {/* Hotel Icon */}
                              <Box
                                as="svg"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                w="48px"
                                h="48px"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                color="neutral.dark"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                              </Box>
                              
                              <Heading 
                                as="h3" 
                                fontFamily="heading" 
                                fontSize="xl" 
                                fontWeight="400"
                                color="neutral.dark"
                              >
                                {t('travel.hotelsTitle')}
                              </Heading>
                              
                              <Text fontSize="sm" color="neutral.muted" maxW="450px">
                                {t('travel.hotelsDescription')}
                              </Text>
                            </VStack>
                          </Box>

                          {/* Recommended Hotels List */}
                          <Box w="full">
                            <Text 
                              fontSize="xs" 
                              textTransform="uppercase" 
                              letterSpacing="0.2em" 
                              color="primary.soft"
                              fontWeight="500"
                              mb={4}
                              textAlign="center"
                            >
                              {t('travel.recommendedHotels')}
                            </Text>
                            <SimpleGrid columns={[1, 1, 3]} spacing={4}>
                              {/* Hotel 1 */}
                              <Box 
                                bg="white" 
                                borderWidth="1px" 
                                borderColor="primary.soft"
                                p={6}
                              >
                                <VStack align="start" spacing={3}>
                                  <HStack justify="space-between" w="full">
                                    <Heading 
                                      as="h4" 
                                      fontSize="md" 
                                      fontWeight="500"
                                      color="neutral.dark"
                                    >
                                      {t('travel.hotels.0.name')}
                                    </Heading>
                                    <Badge 
                                      colorScheme="gray" 
                                      variant="subtle"
                                      fontSize="xs"
                                    >
                                      {t('travel.hotels.0.priceRange')}
                                    </Badge>
                                  </HStack>
                                  <Text fontSize="xs" color="primary.soft" fontWeight="500">
                                    {t('travel.hotels.0.location')}
                                  </Text>
                                  <Text fontSize="sm" color="neutral.muted">
                                    {t('travel.hotels.0.description')}
                                  </Text>
                                </VStack>
                              </Box>

                              {/* Hotel 2 */}
                              <Box 
                                bg="white" 
                                borderWidth="1px" 
                                borderColor="primary.soft"
                                p={6}
                              >
                                <VStack align="start" spacing={3}>
                                  <HStack justify="space-between" w="full">
                                    <Heading 
                                      as="h4" 
                                      fontSize="md" 
                                      fontWeight="500"
                                      color="neutral.dark"
                                    >
                                      {t('travel.hotels.1.name')}
                                    </Heading>
                                    <Badge 
                                      colorScheme="gray" 
                                      variant="subtle"
                                      fontSize="xs"
                                    >
                                      {t('travel.hotels.1.priceRange')}
                                    </Badge>
                                  </HStack>
                                  <Text fontSize="xs" color="primary.soft" fontWeight="500">
                                    {t('travel.hotels.1.location')}
                                  </Text>
                                  <Text fontSize="sm" color="neutral.muted">
                                    {t('travel.hotels.1.description')}
                                  </Text>
                                </VStack>
                              </Box>

                              {/* Hotel 3 */}
                              <Box 
                                bg="white" 
                                borderWidth="1px" 
                                borderColor="primary.soft"
                                p={6}
                              >
                                <VStack align="start" spacing={3}>
                                  <HStack justify="space-between" w="full">
                                    <Heading 
                                      as="h4" 
                                      fontSize="md" 
                                      fontWeight="500"
                                      color="neutral.dark"
                                    >
                                      {t('travel.hotels.2.name')}
                                    </Heading>
                                    <Badge 
                                      colorScheme="gray" 
                                      variant="subtle"
                                      fontSize="xs"
                                    >
                                      {t('travel.hotels.2.priceRange')}
                                    </Badge>
                                  </HStack>
                                  <Text fontSize="xs" color="primary.soft" fontWeight="500">
                                    {t('travel.hotels.2.location')}
                                  </Text>
                                  <Text fontSize="sm" color="neutral.muted">
                                    {t('travel.hotels.2.description')}
                                  </Text>
                                </VStack>
                              </Box>
                            </SimpleGrid>
                          </Box>

                          {/* Search More Hotels */}
                          <Box 
                            bg="neutral.light" 
                            borderWidth="1px" 
                            borderColor="primary.soft"
                            p={[6, 8]}
                            w="full"
                          >
                            <VStack spacing={6}>
                              <Text 
                                fontSize="xs" 
                                textTransform="uppercase" 
                                letterSpacing="0.2em" 
                                color="primary.soft"
                                fontWeight="500"
                              >
                                {t('travel.searchMore')}
                              </Text>
                              
                              <HStack spacing={4} flexWrap="wrap" justify="center">
                                {/* Booking.com Button */}
                                <Button
                                  as="a"
                                  href="https://www.booking.com/searchresults.html?ss=Vallesvilles%2C+France&checkin=2026-08-24&checkout=2026-08-28&group_adults=2&no_rooms=1"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  variant="outline"
                                  size="md"
                                  rightIcon={<ExternalLinkIcon />}
                                  borderColor="neutral.dark"
                                  color="neutral.dark"
                                  _hover={{
                                    bg: "neutral.dark",
                                    color: "white",
                                    transform: "translateY(-2px)",
                                  }}
                                  transition="all 0.2s"
                                >
                                  {t('travel.searchBooking')}
                                </Button>

                                {/* Expedia Button */}
                                <Button
                                  as="a"
                                  href="https://www.expedia.com/Hotel-Search?destination=Vallesvilles%2C%20France&startDate=2026-08-24&endDate=2026-08-28&adults=2"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  variant="outline"
                                  size="md"
                                  rightIcon={<ExternalLinkIcon />}
                                  borderColor="neutral.dark"
                                  color="neutral.dark"
                                  _hover={{
                                    bg: "neutral.dark",
                                    color: "white",
                                    transform: "translateY(-2px)",
                                  }}
                                  transition="all 0.2s"
                                >
                                  {t('travel.searchExpedia')}
                                </Button>
                              </HStack>
                            </VStack>
                          </Box>
                        </VStack>
                      </TabPanel>
                    </TabPanels>
                  </Tabs>
                </Box>
              </ScrollReveal>

              {/* Booking Tip & Additional Info */}
              <ScrollReveal>
                <VStack spacing={4} textAlign="center">
                  <Text 
                    fontSize="sm" 
                    color="primary.soft" 
                    fontStyle="italic"
                    maxW="500px"
                  >
                    {t('travel.tip')}
                  </Text>
                  <Text 
                    fontSize="sm" 
                    color="neutral.muted" 
                    maxW="500px"
                  >
                    {t('travel.nearbyTowns')}
                  </Text>
                </VStack>
              </ScrollReveal>
            </VStack>
          </Container>
        </Box>

        {/* RSVP Section */}
        <Box id="rsvp" py={[20, 28]} bg="white" scrollMarginTop={["100px", "130px", "150px"]}>
          <Container maxW="container.lg">
            <ScrollReveal variants={scaleIn}>
              <RsvpForm />
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
