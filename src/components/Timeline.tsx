import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Flex,
  Circle,
  Image,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'

// Import icons
import CheersIcon from '../assets/Cheers_icon.svg'
import WedCakeIcon from '../assets/WedCake_icon.svg'
import PooldayIcon from '../assets/Poolday_icon.svg'

interface WeddingEvent {
  date: string
  title: string
  dressCode: string
  icon: string
}

export default function Timeline() {
  const { t } = useTranslation()

  // Wedding weekend events
  const weddingEvents: WeddingEvent[] = [
    {
      date: t('timeline.events.welcome.date'),
      title: t('timeline.events.welcome.title'),
      dressCode: t('timeline.events.welcome.dressCode'),
      icon: CheersIcon,
    },
    {
      date: t('timeline.events.wedding.date'),
      title: t('timeline.events.wedding.title'),
      dressCode: t('timeline.events.wedding.dressCode'),
      icon: WedCakeIcon,
    },
    {
      date: t('timeline.events.brunch.date'),
      title: t('timeline.events.brunch.title'),
      dressCode: t('timeline.events.brunch.dressCode'),
      icon: PooldayIcon,
    },
  ]

  return (
    <Box as="section" id="timeline" py={[16, 20, 28]} bg="white" position="relative" zIndex={0}>
      <Container maxW="container.xl" px={[4, 6, 8]}>
        <VStack spacing={[12, 16, 20]}>
          {/* Intro Text */}
          <VStack spacing={4} textAlign="center" maxW="700px" mx="auto">
            <Text
              color="neutral.muted"
              fontSize={["sm", "md"]}
              lineHeight="1.8"
              dangerouslySetInnerHTML={{ __html: t('timeline.intro') }}
            />
            <Text
              color="neutral.muted"
              fontSize={["sm", "md"]}
              lineHeight="1.8"
              fontStyle="italic"
            >
              {t('timeline.introClosing')}
            </Text>
          </VStack>

          {/* Section Header */}
          <VStack spacing={4} textAlign="center">
            <Heading
              as="h2"
              fontFamily="heading"
              fontSize={["2xl", "3xl", "4xl"]}
              fontWeight="400"
              textTransform="uppercase"
              letterSpacing="0.15em"
              color="primary.deep"
            >
              {t('timeline.title')}
            </Heading>
          </VStack>

          {/* Wedding Events - Horizontal Layout */}
          <Box w="full" position="relative">
            {/* Events Grid */}
            <Flex
              direction={["column", "column", "row"]}
              justify="center"
              align={["center", "center", "flex-start"]}
              gap={[10, 12, 0]}
              position="relative"
              maxW="1000px"
              mx="auto"
            >
              {weddingEvents.map((event, index) => (
                <EventCard key={index} event={event} />
              ))}
            </Flex>

            {/* Horizontal Timeline Line - Desktop only */}
            <Box
              display={["none", "none", "block"]}
              position="absolute"
              bottom="0"
              left="50%"
              transform="translateX(-50%)"
              w="70%"
              maxW="700px"
            >
              <Box position="relative" w="full">
                {/* Main line */}
                <Box
                  h="2px"
                  bg="primary.soft"
                  opacity={0.6}
                  w="full"
                />
                {/* Dots */}
                <Flex
                  position="absolute"
                  top="50%"
                  left={0}
                  right={0}
                  transform="translateY(-50%)"
                  justify="space-between"
                >
                  {[0, 1, 2].map((i) => (
                    <Circle
                      key={i}
                      size="12px"
                      bg="primary.soft"
                      opacity={0.8}
                    />
                  ))}
                </Flex>
              </Box>
            </Box>
          </Box>
        </VStack>
      </Container>
    </Box>
  )
}

interface EventCardProps {
  event: WeddingEvent
}

function EventCard({ event }: EventCardProps) {
  return (
    <VStack
      flex={1}
      spacing={4}
      textAlign="center"
      px={[4, 6, 8]}
      pb={[0, 0, 10]}
      maxW={["280px", "300px", "320px"]}
    >
      {/* Icon */}
      <Box
        w={["100px", "120px", "140px"]}
        h={["100px", "120px", "140px"]}
        mb={2}
      >
        <Image
          src={event.icon}
          alt=""
          w="full"
          h="full"
          objectFit="contain"
        />
      </Box>

      {/* Date */}
      <Text
        fontSize={["sm", "md"]}
        textTransform="uppercase"
        letterSpacing="0.2em"
        fontWeight="500"
        color="primary.deep"
      >
        {event.date}
      </Text>

      {/* Title */}
      <Text
        fontSize={["md", "lg"]}
        color="neutral.muted"
        fontWeight="400"
      >
        {event.title}
      </Text>

      {/* Dress Code */}
      <Text
        fontSize={["sm", "md"]}
        color="neutral.muted"
        fontStyle="italic"
      >
        {event.dressCode}
      </Text>

      {/* Mobile dot */}
      <Circle
        display={["block", "block", "none"]}
        size="10px"
        bg="primary.soft"
        opacity={0.8}
        mt={2}
      />
    </VStack>
  )
}
