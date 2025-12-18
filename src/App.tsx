import React from 'react'
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
} from '@chakra-ui/react'
import RsvpForm from './components/RsvpForm'

// Elegant thin decorative divider - classic minimalist style
const ElegantDivider = ({ color = 'primary.soft', width = '120px', ...props }) => (
  <Box my={8} {...props}>
    <Divider borderColor={color} w={width} mx="auto" />
  </Box>
)

export default function App() {
  return (
    <Box minH="100vh" bg="neutral.light">
      {/* Minimal Elegant Header */}
      <Box 
        as="header" 
        py={6} 
        position="fixed" 
        top={0} 
        left={0} 
        right={0} 
        zIndex={100}
        bg="neutral.light"
        borderBottom="1px solid"
        borderColor="primary.soft"
      >
        <Container maxW="container.xl">
          <Flex justify="space-between" align="center">
            <Text 
              fontFamily="heading" 
              fontSize="lg" 
              fontWeight="400" 
              letterSpacing="0.15em" 
              color="neutral.dark"
            >
              S & L
            </Text>
            <HStack spacing={10} display={["none", "none", "flex"]}>
              <Button as="a" href="#story" variant="ghost" size="sm">
                Our Story
              </Button>
              <Button as="a" href="#details" variant="ghost" size="sm">
                Details
              </Button>
              <Button as="a" href="#rsvp" variant="ghost" size="sm">
                RSVP
              </Button>
            </HStack>
          </Flex>
        </Container>
      </Box>

      <Box as="main">
        {/* Hero Section - Full Height, Centered, Elegant */}
        <Box 
          minH="100vh" 
          display="flex" 
          alignItems="center" 
          justifyContent="center"
          textAlign="center"
          px={6}
          pt={20}
        >
          <VStack spacing={0} maxW="700px">
            <Text 
              fontSize="xs" 
              textTransform="uppercase" 
              letterSpacing="0.35em" 
              color="neutral.dark"
              fontWeight="500"
              mb={8}
            >
              Together with their families
            </Text>
            
            <Heading 
              as="h1" 
              fontFamily="heading" 
              fontSize={["5xl", "6xl", "7xl"]}
              fontWeight="400"
              color="neutral.dark"
              lineHeight="0.9"
              letterSpacing="-0.02em"
            >
              Sofia
            </Heading>
            
            <Text 
              fontFamily="heading"
              fontSize={["2xl", "3xl"]} 
              fontStyle="italic" 
              fontWeight="300" 
              color="primary.soft"
              my={4}
            >
              &
            </Text>
            
            <Heading 
              as="h1" 
              fontFamily="heading" 
              fontSize={["5xl", "6xl", "7xl"]}
              fontWeight="400"
              color="neutral.dark"
              lineHeight="0.9"
              letterSpacing="-0.02em"
            >
              Lucas
            </Heading>

            <ElegantDivider mt={12} mb={10} />
            
            <Text 
              fontSize="sm" 
              textTransform="uppercase" 
              letterSpacing="0.25em" 
              color="neutral.dark"
              fontWeight="500"
              mb={2}
            >
              October Eighteenth
            </Text>
            <Text 
              fontSize="sm" 
              textTransform="uppercase" 
              letterSpacing="0.25em" 
              color="neutral.dark"
              fontWeight="500"
              mb={6}
            >
              Two Thousand Twenty-Six
            </Text>
            <Text 
              fontSize="md" 
              color="neutral.dark" 
              fontStyle="italic"
              letterSpacing="0.05em"
            >
              Château de Varennes · Burgundy, France
            </Text>
            
            <Button 
              as="a" 
              href="#rsvp" 
              mt={12}
              variant="outline"
              size="lg"
            >
              Kindly Respond
            </Button>
          </VStack>
        </Box>

        {/* Story Section */}
        <Box id="story" py={[20, 28]} bg="white">
          <Container maxW="container.lg">
            <VStack spacing={16}>
              {/* Section Header */}
              <VStack spacing={4} textAlign="center" maxW="600px">
                <Text 
                  fontSize="xs" 
                  textTransform="uppercase" 
                  letterSpacing="0.35em" 
                  color="primary.soft"
                  fontWeight="500"
                >
                  Our Story
                </Text>
                <Heading 
                  as="h2" 
                  fontFamily="heading" 
                  fontSize={["3xl", "4xl"]} 
                  fontWeight="400"
                >
                  Two Worlds, One Heart
                </Heading>
                <ElegantDivider my={2} />
              </VStack>
              
              {/* Story Content - Elegant Layout */}
              <Flex 
                direction={["column", "column", "row"]} 
                gap={[10, 10, 16]} 
                align="center"
                maxW="1000px"
              >
                <Box flex={1} maxW={["100%", "100%", "450px"]}>
                  <Image 
                    src="https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=2070&auto=format&fit=crop" 
                    alt="Sofia and Lucas" 
                    w="100%"
                    h={["300px", "400px", "500px"]}
                    objectFit="cover"
                  />
                </Box>
                <VStack flex={1} align={["center", "center", "flex-start"]} spacing={6} textAlign={["center", "center", "left"]}>
                  <Text fontSize="lg" lineHeight="1.9">
                    From the vibrant streets of Mexico City to the cobbled squares of Brussels, our story is a map of two cultures finding a home in one another.
                  </Text>
                  <Text fontSize="lg" lineHeight="1.9">
                    We chose France as our gathering place—a neutral ground of beauty and wine—to celebrate the blending of our families and the beginning of our forever.
                  </Text>
                  <Text 
                    fontFamily="heading" 
                    fontStyle="italic" 
                    fontSize="xl"
                    color="primary.deep" 
                    mt={4}
                  >
                    "Une Célébration d'Amor & Liefde"
                  </Text>
                </VStack>
              </Flex>
            </VStack>
          </Container>
        </Box>

        {/* Details Section */}
        <Box id="details" py={[20, 28]} bg="neutral.light">
          <Container maxW="container.lg">
            <VStack spacing={16}>
              {/* Section Header */}
              <VStack spacing={4} textAlign="center">
                <Text 
                  fontSize="xs" 
                  textTransform="uppercase" 
                  letterSpacing="0.35em" 
                  color="primary.soft"
                  fontWeight="500"
                >
                  The Celebration
                </Text>
                <Heading 
                  as="h2" 
                  fontFamily="heading" 
                  fontSize={["3xl", "4xl"]} 
                  fontWeight="400"
                >
                  Wedding Weekend
                </Heading>
                <ElegantDivider my={2} />
              </VStack>

              {/* Event Cards - Refined Minimal Design */}
              <SimpleGrid columns={[1, 1, 3]} spacing={8} w="full" maxW="900px">
                {/* Friday */}
                <VStack 
                  p={10} 
                  bg="white"
                  textAlign="center"
                  spacing={4}
                  borderWidth="1px"
                  borderColor="primary.soft"
                >
                  <Text 
                    fontSize="xs" 
                    textTransform="uppercase" 
                    letterSpacing="0.3em" 
                    color="primary.soft"
                    fontWeight="500"
                  >
                    Friday
                  </Text>
                  <Heading 
                    as="h3" 
                    fontFamily="heading" 
                    fontSize="xl" 
                    fontWeight="400"
                  >
                    Welcome Dinner
                  </Heading>
                  <Divider borderColor="primary.soft" w="40px" opacity={0.5} />
                  <Text fontSize="sm" color="neutral.dark">October 17, 2026</Text>
                  <Text fontSize="sm" color="neutral.muted">Seven o'clock in the evening</Text>
                </VStack>

                {/* Saturday - Featured */}
                <VStack 
                  p={10} 
                  bg="neutral.dark"
                  textAlign="center"
                  spacing={4}
                >
                  <Text 
                    fontSize="xs" 
                    textTransform="uppercase" 
                    letterSpacing="0.3em" 
                    color="primary.soft"
                    fontWeight="500"
                  >
                    Saturday
                  </Text>
                  <Heading 
                    as="h3" 
                    fontFamily="heading" 
                    fontSize="xl" 
                    fontWeight="400"
                    color="neutral.light"
                  >
                    The Wedding
                  </Heading>
                  <Divider borderColor="primary.soft" w="40px" opacity={0.5} />
                  <Text fontSize="sm" color="neutral.light">October 18, 2026</Text>
                  <Text fontSize="sm" color="primary.soft">Ceremony at four o'clock</Text>
                  <Text fontSize="sm" color="primary.soft">Reception to follow</Text>
                </VStack>

                {/* Sunday */}
                <VStack 
                  p={10} 
                  bg="white"
                  textAlign="center"
                  spacing={4}
                  borderWidth="1px"
                  borderColor="primary.soft"
                >
                  <Text 
                    fontSize="xs" 
                    textTransform="uppercase" 
                    letterSpacing="0.3em" 
                    color="primary.soft"
                    fontWeight="500"
                  >
                    Sunday
                  </Text>
                  <Heading 
                    as="h3" 
                    fontFamily="heading" 
                    fontSize="xl" 
                    fontWeight="400"
                  >
                    Farewell Brunch
                  </Heading>
                  <Divider borderColor="primary.soft" w="40px" opacity={0.5} />
                  <Text fontSize="sm" color="neutral.dark">October 19, 2026</Text>
                  <Text fontSize="sm" color="neutral.muted">Eleven in the morning</Text>
                </VStack>
              </SimpleGrid>

              {/* Venue Info */}
              <VStack spacing={2} textAlign="center" pt={8}>
                <Text fontSize="sm" textTransform="uppercase" letterSpacing="0.2em" color="neutral.dark">
                  Château de Varennes
                </Text>
                <Text fontSize="sm" color="neutral.muted" fontStyle="italic">
                  21320 Pouilly-en-Auxois, Burgundy, France
                </Text>
              </VStack>
            </VStack>
          </Container>
        </Box>

        {/* RSVP Section */}
        <Box id="rsvp" py={[20, 28]} bg="white">
          <Container maxW="container.lg">
            <RsvpForm />
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
          <VStack spacing={6}>
            <Divider borderColor="primary.soft" w="80px" opacity={0.5} />
            <Heading 
              fontFamily="heading" 
              fontSize="2xl" 
              fontWeight="400" 
              letterSpacing="0.1em"
            >
              S & L
            </Heading>
            <Text 
              fontSize="sm" 
              letterSpacing="0.15em"
              textTransform="uppercase"
            >
              October 18, 2026
            </Text>
            <Text fontSize="xs" color="neutral.muted" mt={4}>
              Made with love in Brussels & Mexico City
            </Text>
          </VStack>
        </Container>
      </Box>
    </Box>
  )
}
