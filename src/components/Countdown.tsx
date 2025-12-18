import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Heading,
  Divider,
} from '@chakra-ui/react'
import { weddingConfig } from '../config'

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function calculateTimeLeft(): TimeLeft {
  const difference = weddingConfig.date.full.getTime() - new Date().getTime()

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  }
}

interface TimeUnitProps {
  value: number
  label: string
}

function TimeUnit({ value, label }: TimeUnitProps) {
  return (
    <VStack spacing={1}>
      <Box
        bg="white"
        px={[4, 6, 8]}
        py={[3, 4, 6]}
        minW={['60px', '80px', '100px']}
        borderRadius="md"
        boxShadow="sm"
      >
        <Text
          fontFamily="heading"
          fontSize={['2xl', '3xl', '4xl']}
          fontWeight="400"
          color="neutral.dark"
          lineHeight="1"
        >
          {value.toString().padStart(2, '0')}
        </Text>
      </Box>
      <Text
        fontSize={['xs', 'sm']}
        textTransform="uppercase"
        letterSpacing="0.2em"
        color="primary.soft"
        fontWeight="500"
      >
        {label}
      </Text>
    </VStack>
  )
}

export default function Countdown() {
  const { t } = useTranslation()
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft)
  const [hasPassed, setHasPassed] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft()
      setTimeLeft(newTimeLeft)

      // Check if wedding date has passed
      if (
        newTimeLeft.days === 0 &&
        newTimeLeft.hours === 0 &&
        newTimeLeft.minutes === 0 &&
        newTimeLeft.seconds === 0
      ) {
        setHasPassed(true)
        clearInterval(timer)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <Box py={[16, 20]} bg="neutral.light">
      <Container maxW="container.lg">
        <VStack spacing={10}>
          {/* Section Header */}
          <VStack spacing={4} textAlign="center">
            <Text
              fontSize="xs"
              textTransform="uppercase"
              letterSpacing="0.35em"
              color="primary.soft"
              fontWeight="500"
            >
              {t('countdown.label')}
            </Text>
            <Heading
              as="h2"
              fontFamily="heading"
              fontSize={['2xl', '3xl']}
              fontWeight="400"
              color="neutral.dark"
            >
              {hasPassed ? t('countdown.celebrated') : t('countdown.title')}
            </Heading>
            <Divider borderColor="primary.soft" w="120px" mx="auto" />
          </VStack>

          {/* Countdown Display */}
          {!hasPassed && (
            <HStack spacing={[2, 4, 6]} justify="center" flexWrap="wrap">
              <TimeUnit value={timeLeft.days} label={t('countdown.days')} />
              <Text
                fontFamily="heading"
                fontSize={['xl', '2xl', '3xl']}
                color="primary.soft"
                alignSelf="flex-start"
                pt={[4, 5, 7]}
              >
                :
              </Text>
              <TimeUnit value={timeLeft.hours} label={t('countdown.hours')} />
              <Text
                fontFamily="heading"
                fontSize={['xl', '2xl', '3xl']}
                color="primary.soft"
                alignSelf="flex-start"
                pt={[4, 5, 7]}
              >
                :
              </Text>
              <TimeUnit value={timeLeft.minutes} label={t('countdown.minutes')} />
              <Text
                fontFamily="heading"
                fontSize={['xl', '2xl', '3xl']}
                color="primary.soft"
                alignSelf="flex-start"
                pt={[4, 5, 7]}
              >
                :
              </Text>
              <TimeUnit value={timeLeft.seconds} label={t('countdown.seconds')} />
            </HStack>
          )}

          {/* Wedding Date */}
          <Text
            fontFamily="heading"
            fontSize={['md', 'lg']}
            color="neutral.dark"
            letterSpacing="0.1em"
          >
            {weddingConfig.date.display}
          </Text>
        </VStack>
      </Container>
    </Box>
  )
}
