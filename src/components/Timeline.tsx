import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Flex,
  Circle,
  Divider,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'

interface TimelineEvent {
  date: string
  title: string
  description: string
  location?: string
}

export default function Timeline() {
  const { t } = useTranslation()

  // Get timeline events from translations
  const events: TimelineEvent[] = [
    {
      date: t('timeline.events.met.date'),
      title: t('timeline.events.met.title'),
      description: t('timeline.events.met.description'),
      location: t('timeline.events.met.location'),
    },
    {
      date: t('timeline.events.firstDate.date'),
      title: t('timeline.events.firstDate.title'),
      description: t('timeline.events.firstDate.description'),
      location: t('timeline.events.firstDate.location'),
    },
    {
      date: t('timeline.events.moved.date'),
      title: t('timeline.events.moved.title'),
      description: t('timeline.events.moved.description'),
      location: t('timeline.events.moved.location'),
    },
    {
      date: t('timeline.events.engaged.date'),
      title: t('timeline.events.engaged.title'),
      description: t('timeline.events.engaged.description'),
      location: t('timeline.events.engaged.location'),
    },
    {
      date: t('timeline.events.wedding.date'),
      title: t('timeline.events.wedding.title'),
      description: t('timeline.events.wedding.description'),
      location: t('timeline.events.wedding.location'),
    },
  ]

  return (
    <Box as="section" id="timeline" py={[20, 28]} bg="white">
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
              {t('timeline.label')}
            </Text>
            <Heading
              as="h2"
              fontFamily="heading"
              fontSize={["3xl", "4xl"]}
              fontWeight="400"
            >
              {t('timeline.title')}
            </Heading>
            <Box my={2}>
              <Divider borderColor="primary.soft" w="120px" mx="auto" />
            </Box>
            <Text color="neutral.muted" fontSize="md" maxW="500px" lineHeight="1.8">
              {t('timeline.subtitle')}
            </Text>
          </VStack>

          {/* Timeline */}
          <Box position="relative" w="full" maxW="800px">
            {/* Vertical Line - Hidden on mobile */}
            <Box
              display={["none", "none", "block"]}
              position="absolute"
              left="50%"
              top={0}
              bottom={0}
              w="1px"
              bg="primary.soft"
              transform="translateX(-50%)"
            />

            {/* Timeline Events */}
            <VStack spacing={[8, 12, 0]} align="stretch">
              {events.map((event, index) => (
                <TimelineItem
                  key={index}
                  event={event}
                  isLeft={index % 2 === 0}
                  isFirst={index === 0}
                  isLast={index === events.length - 1}
                />
              ))}
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  )
}

interface TimelineItemProps {
  event: TimelineEvent
  isLeft: boolean
  isFirst: boolean
  isLast: boolean
}

function TimelineItem({ event, isLeft, isFirst, isLast }: TimelineItemProps) {
  return (
    <Flex
      direction={["column", "column", isLeft ? "row" : "row-reverse"]}
      align={["flex-start", "flex-start", "center"]}
      position="relative"
      pb={[0, 0, 12]}
    >
      {/* Content */}
      <Box
        flex={1}
        textAlign={["left", "left", isLeft ? "right" : "left"]}
        pr={[0, 0, isLeft ? 12 : 0]}
        pl={[0, 0, isLeft ? 0 : 12]}
        pb={[4, 4, 0]}
      >
        <Text
          fontSize="sm"
          textTransform="uppercase"
          letterSpacing="0.2em"
          color="primary.soft"
          fontWeight="500"
          mb={2}
        >
          {event.date}
        </Text>
        <Heading
          as="h3"
          fontFamily="heading"
          fontSize={["xl", "2xl"]}
          fontWeight="400"
          mb={3}
          color="primary.deep"
        >
          {event.title}
        </Heading>
        <Text fontSize="md" color="neutral.muted" lineHeight="1.8" mb={2}>
          {event.description}
        </Text>
        {event.location && (
          <Text fontSize="sm" fontStyle="italic" color="primary.soft">
            {event.location}
          </Text>
        )}
      </Box>

      {/* Center Dot - Only visible on desktop */}
      <Circle
        display={["none", "none", "flex"]}
        size="16px"
        bg="white"
        border="2px solid"
        borderColor="primary.soft"
        position="absolute"
        left="50%"
        top="8px"
        transform="translateX(-50%)"
        zIndex={1}
        _before={isLast ? {
          content: '""',
          position: 'absolute',
          w: '24px',
          h: '24px',
          borderRadius: 'full',
          border: '1px solid',
          borderColor: 'primary.soft',
          opacity: 0.5,
        } : undefined}
      />

      {/* Mobile Timeline Dot */}
      <HStack
        display={["flex", "flex", "none"]}
        spacing={3}
        mb={4}
        position="relative"
      >
        <Circle
          size="12px"
          bg="primary.soft"
        />
        <Box flex={1} h="1px" bg="primary.soft" opacity={0.3} />
      </HStack>

      {/* Empty space for the other side */}
      <Box flex={1} display={["none", "none", "block"]} />
    </Flex>
  )
}
