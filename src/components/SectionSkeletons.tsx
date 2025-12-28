import { Box, Container, Skeleton, SkeletonText, VStack, HStack, SimpleGrid } from '@chakra-ui/react'

/**
 * Skeleton loader for a generic section with centered heading
 */
export function SectionSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <Box py={[16, 20]} bg="neutral.light">
      <Container maxW="container.lg">
        <VStack spacing={8} align="center">
          {/* Section label */}
          <Skeleton height="12px" width="100px" />
          {/* Section heading */}
          <Skeleton height="32px" width="250px" />
          {/* Divider */}
          <Skeleton height="1px" width="120px" />
          {/* Content lines */}
          <Box maxW="500px" w="full">
            <SkeletonText noOfLines={lines} spacing={4} />
          </Box>
        </VStack>
      </Container>
    </Box>
  )
}

/**
 * Skeleton loader for the Countdown section
 */
export function CountdownSkeleton() {
  return (
    <Box py={[12, 16]} bg="neutral.light">
      <Container maxW="container.lg">
        <VStack spacing={8} align="center">
          {/* Section heading */}
          <Skeleton height="28px" width="200px" />
          {/* Countdown boxes */}
          <HStack spacing={[4, 8]} justify="center">
            {[1, 2, 3, 4].map((i) => (
              <VStack key={i} spacing={2}>
                <Skeleton height={["50px", "70px"]} width={["50px", "70px"]} borderRadius="md" />
                <Skeleton height="14px" width="40px" />
              </VStack>
            ))}
          </HStack>
          {/* Date text */}
          <Skeleton height="16px" width="150px" />
        </VStack>
      </Container>
    </Box>
  )
}

/**
 * Skeleton loader for the Story section
 */
export function StorySkeleton() {
  return (
    <Box py={[16, 24]} bg="neutral.light">
      <Container maxW="container.lg">
        <VStack spacing={10} align="center">
          {/* Section label */}
          <Skeleton height="12px" width="80px" />
          {/* Section heading */}
          <Skeleton height="36px" width="280px" />
          {/* Divider */}
          <Skeleton height="1px" width="120px" />
          {/* Story content */}
          <Box maxW="650px" w="full">
            <SkeletonText noOfLines={6} spacing={4} />
          </Box>
        </VStack>
      </Container>
    </Box>
  )
}

/**
 * Skeleton loader for the Timeline section
 */
export function TimelineSkeleton() {
  return (
    <Box py={[16, 24]} bg="neutral.light">
      <Container maxW="container.lg">
        <VStack spacing={10}>
          {/* Section header */}
          <VStack spacing={4} align="center">
            <Skeleton height="12px" width="100px" />
            <Skeleton height="32px" width="220px" />
            <Skeleton height="1px" width="120px" />
          </VStack>
          {/* Timeline items */}
          <VStack spacing={8} w="full" maxW="600px">
            {[1, 2, 3].map((i) => (
              <HStack key={i} spacing={6} w="full" align="start">
                <Skeleton height="60px" width="60px" borderRadius="full" flexShrink={0} />
                <Box flex={1}>
                  <Skeleton height="20px" width="120px" mb={2} />
                  <SkeletonText noOfLines={2} spacing={2} />
                </Box>
              </HStack>
            ))}
          </VStack>
        </VStack>
      </Container>
    </Box>
  )
}

/**
 * Skeleton loader for the Photo Gallery section
 */
export function GallerySkeleton() {
  return (
    <Box py={[16, 24]} bg="neutral.light">
      <Container maxW="container.xl">
        <VStack spacing={10}>
          {/* Section header */}
          <VStack spacing={4} align="center">
            <Skeleton height="12px" width="80px" />
            <Skeleton height="32px" width="200px" />
            <Skeleton height="1px" width="120px" />
          </VStack>
          {/* Gallery grid */}
          <SimpleGrid columns={[2, 3, 4]} spacing={4} w="full">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} height={["150px", "200px", "250px"]} borderRadius="md" />
            ))}
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
  )
}

/**
 * Skeleton loader for the Accommodation section
 */
export function AccommodationSkeleton() {
  return (
    <Box py={[16, 24]} bg="neutral.light">
      <Container maxW="container.lg">
        <VStack spacing={10}>
          {/* Section header */}
          <VStack spacing={4} align="center">
            <Skeleton height="12px" width="100px" />
            <Skeleton height="32px" width="260px" />
            <Skeleton height="1px" width="120px" />
          </VStack>
          {/* Content */}
          <Box maxW="600px" w="full">
            <SkeletonText noOfLines={4} spacing={4} />
          </Box>
          {/* Cards */}
          <SimpleGrid columns={[1, 2]} spacing={6} w="full" maxW="800px">
            {[1, 2].map((i) => (
              <Box key={i} p={6} borderWidth="1px" borderColor="primary.soft" borderRadius="md">
                <VStack spacing={4} align="start">
                  <Skeleton height="24px" width="150px" />
                  <SkeletonText noOfLines={3} spacing={2} w="full" />
                  <Skeleton height="36px" width="120px" />
                </VStack>
              </Box>
            ))}
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
  )
}

/**
 * Skeleton loader for the RSVP Form section
 */
export function RsvpFormSkeleton() {
  return (
    <Box py={[12, 16]} bg="secondary.slate">
      <Container maxW="container.lg">
        <VStack spacing={8} align="center">
          {/* Section header */}
          <VStack spacing={4} align="center">
            <Skeleton height="12px" width="60px" startColor="whiteAlpha.200" endColor="whiteAlpha.400" />
            <Skeleton height="36px" width="300px" startColor="whiteAlpha.200" endColor="whiteAlpha.400" />
            <Skeleton height="1px" width="120px" startColor="whiteAlpha.200" endColor="whiteAlpha.400" />
          </VStack>
          {/* Form skeleton */}
          <Box
            bg="neutral.light"
            p={[5, 8, 12]}
            borderRadius="md"
            w="full"
            maxW="600px"
          >
            <VStack spacing={6} align="stretch">
              {/* Form fields */}
              {[1, 2, 3, 4].map((i) => (
                <Box key={i}>
                  <Skeleton height="14px" width="100px" mb={2} />
                  <Skeleton height="40px" width="full" />
                </Box>
              ))}
              {/* Submit button */}
              <Skeleton height="48px" width="full" mt={4} />
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  )
}
