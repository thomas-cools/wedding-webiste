import React from 'react'
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
} from '@chakra-ui/react'
import { HamburgerIcon } from '@chakra-ui/icons'
import RsvpForm from './components/RsvpForm'
import LanguageSwitcher from './components/LanguageSwitcher'
import Hero from './components/Hero'
import Timeline from './components/Timeline'
import Countdown from './components/Countdown'
import PasswordGate from './components/PasswordGate'
import { ScrollReveal, StaggerContainer, StaggerItem, fadeInLeft, fadeInRight, scaleIn } from './components/animations'
import { features } from './config'

// Elegant thin decorative divider - classic minimalist style
const ElegantDivider = ({ color = 'primary.soft', width = '120px', ...props }) => (
  <Box my={8} {...props}>
    <Divider borderColor={color} w={width} mx="auto" />
  </Box>
)

export default function App() {
  const { t } = useTranslation()
  const { isOpen, onOpen, onClose } = useDisclosure()

  const content = (
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
            <Text 
              fontFamily="heading" 
              fontSize={["md", "lg"]}
              fontWeight="400" 
              letterSpacing="0.15em" 
              color="neutral.dark"
            >
              {t('header.initials')}
            </Text>
            <HStack spacing={[2, 4, 10]}>
              {/* Desktop Navigation */}
              <HStack spacing={10} display={["none", "none", "flex"]}>
                <Button as="a" href="#story" variant="ghost" size="sm">
                  {t('header.ourStory')}
                </Button>
                <Button as="a" href="#details" variant="ghost" size="sm">
                  {t('header.details')}
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
        <Hero />

        {/* Countdown Section - Controlled by feature flag */}
        {features.showCountdown && <Countdown />}

        {/* Story Section */}
        <Box id="story" py={[20, 28]} bg="white">
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

        {/* Details Section */}
        <Box id="details" py={[20, 28]} bg="neutral.light">
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

        {/* RSVP Section */}
        <Box id="rsvp" py={[20, 28]} bg="white">
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
  )

  // Wrap with password gate if feature is enabled
  if (features.requirePassword) {
    return <PasswordGate>{content}</PasswordGate>
  }

  return content
}
