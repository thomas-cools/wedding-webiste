import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Grid,
  GridItem,
  Image,
  Link,
  VisuallyHidden,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router-dom'

// Section title artwork and per-day icons
import weddingTimelineArt from '../assets/WeddingTimeline.svg'
import bubblesIcon from '../assets/Bubbles.svg'
import cakeIcon from '../assets/Cake.svg'
import poolIcon from '../assets/Pool.svg'

interface ScheduleItem {
  time: string
  label: string
}

interface DaySchedule {
  label: string
  date: string
  items: ScheduleItem[]
  dressCode: string
  hash: string
  icon: string
  iconAlt: string
}

const ROW_COLUMNS = ['1fr 1fr']
const ICON_SIZE = ['76px', '92px', '108px']

export default function Timeline() {
  const { t } = useTranslation()

  const days: DaySchedule[] = [
    {
      label: t('timeline.schedule.day1.label'),
      date: t('timeline.schedule.day1.date'),
      items: t('timeline.schedule.day1.items', { returnObjects: true }) as ScheduleItem[],
      dressCode: t('timeline.schedule.day1.dressCode'),
      hash: '#dress-code-welcome',
      icon: bubblesIcon,
      iconAlt: 'Champagne toast icon for the Welcome Dinner',
    },
    {
      label: t('timeline.schedule.day2.label'),
      date: t('timeline.schedule.day2.date'),
      items: t('timeline.schedule.day2.items', { returnObjects: true }) as ScheduleItem[],
      dressCode: t('timeline.schedule.day2.dressCode'),
      hash: '#dress-code-wedding',
      icon: cakeIcon,
      iconAlt: 'Wedding cake icon for The Wedding',
    },
    {
      label: t('timeline.schedule.day3.label'),
      date: t('timeline.schedule.day3.date'),
      items: t('timeline.schedule.day3.items', { returnObjects: true }) as ScheduleItem[],
      dressCode: t('timeline.schedule.day3.dressCode'),
      hash: '#dress-code-brunch',
      icon: poolIcon,
      iconAlt: 'Beach umbrella icon for the Pool Brunch',
    },
  ]

  return (
    <Box as="section" id="timeline" py={[16, 20, 28]} bg="neutral.light" position="relative" overflow="hidden" zIndex={0}>
      <Container maxW="container.xl" px={[4, 6, 8]} position="relative" zIndex={1}>
        <VStack spacing={[12, 16, 20]}>
          {/* Intro Text */}
          <VStack spacing={4} textAlign="center" alignItems="center" maxW="700px" mx="auto">
            <Text
              color="neutral.dark"
              fontSize={["sm", "md"]}
              lineHeight="1.8"
              dangerouslySetInnerHTML={{ __html: t('timeline.intro') }}
            />
            {t('timeline.introClosing') && (
              <Text
                color="neutral.dark"
                fontSize={["sm", "md"]}
                lineHeight="1.8"
                fontStyle="italic"
              >
                {t('timeline.introClosing')}
              </Text>
            )}
          </VStack>

          {/* Section Header */}
          <Heading
            as="h2"
            fontFamily="handwriting"
            fontWeight="400"
            color="accent.olive"
            textTransform="capitalize"
            lineHeight="1"
          >
            <VisuallyHidden>{t('timeline.label')}</VisuallyHidden>
            <Image
              src={weddingTimelineArt}
              alt=""
              w={["220px", "280px", "340px"]}
              h="auto"
            />
          </Heading>

          {/* Day-by-day schedule */}
          <Box w="full" maxW="700px" mx="auto" position="relative">
            <VStack spacing={[14, 18, 24]} alignItems="stretch">
              {days.map((day, index) => {
                const isLast = index === days.length - 1

                return (
                  <Box key={day.label} position="relative">
                    {/* Vertical line segment extending down to the next item's dot */}
                    {!isLast && (
                      <Box
                        position="absolute"
                        left="50%"
                        top="13px"
                        bottom={["-69px", "-85px", "-109px"]}
                        w="2px"
                        bg="primary.soft"
                        transform="translateX(-50%)"
                      />
                    )}

                    {/* Dot on vertical center line, level with dress code text */}
                    <Box
                      position="absolute"
                      left="50%"
                      top="6px"
                      w="14px"
                      h="14px"
                      borderRadius="full"
                      bg="primary.soft"
                      transform="translateX(-50%)"
                      zIndex={1}
                    />

                    <Grid templateColumns={ROW_COLUMNS} columnGap={[8, 12, 16]} alignItems="start">
                      {/* Left column: Icon + Date + Event Name */}
                      <GridItem display="flex" justifyContent="center">
                        <VStack align="center" textAlign="center" spacing={1}>
                          <Image
                            src={day.icon}
                            alt={day.iconAlt}
                            w={ICON_SIZE}
                            h="auto"
                            mb={1}
                          />
                          <Text
                            fontFamily="body"
                            fontWeight="500"
                            fontSize={["sm", "md", "lg"]}
                            letterSpacing="0.08em"
                            color="neutral.dark"
                            textTransform="uppercase"
                          >
                            {day.date}
                          </Text>
                          <Text fontFamily="elegant" fontStyle="italic" fontSize={["md", "lg", "xl"]} color="neutral.muted">
                            {day.label}
                          </Text>
                        </VStack>
                      </GridItem>

                      {/* Right column: Dress code + schedule times */}
                      <GridItem display="flex" justifyContent="flex-start">
                        <VStack align="flex-start" spacing={3} pt="2px">
                          <Link as={RouterLink} to={`/faq${day.hash}`} _hover={{ textDecoration: 'none' }}>
                            <Text
                              fontSize={["sm", "md", "lg"]}
                              color="neutral.muted"
                              fontStyle="normal"
                              textDecoration="none"
                              _hover={{ color: 'neutral.dark' }}
                              transition="color 0.2s"
                            >
                              {day.dressCode}
                            </Text>
                          </Link>
                          <VStack align="flex-start" spacing={2} w="full">
                            {day.items.map((item) => (
                              <Grid
                                key={item.time}
                                templateColumns={["110px auto", "135px auto", "160px auto"]}
                                columnGap={4}
                                alignItems="baseline"
                              >
                                <Text fontFamily="elegant" fontStyle="normal" fontSize={["md", "lg", "xl"]} color="neutral.muted">
                                  {item.label}
                                </Text>
                                <Text fontFamily="elegant" fontSize={["md", "lg", "xl"]} color="neutral.muted">
                                  {item.time}
                                </Text>
                              </Grid>
                            ))}
                          </VStack>
                        </VStack>
                      </GridItem>
                    </Grid>
                  </Box>
                )
              })}
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  )
}
