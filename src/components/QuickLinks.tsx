import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Container,
  VStack,
  Flex,
  Text,
  Heading,
  Image,
} from '@chakra-ui/react'
import { Link } from 'react-router-dom'
import { ScrollReveal, StaggerContainer, StaggerItem } from './animations'

// Import icons
import loveBirdsIcon from '../assets/love_birds.svg'
import luchadorIcon from '../assets/Luchador_icon.svg'
import restIcon from '../assets/rest_icon.svg'

interface QuickLinkItem {
  to: string
  icon: string
  label: string
  alt: string
}

const ICON_FILTER = 'brightness(0) saturate(100%) invert(12%) sepia(24%) saturate(1500%) hue-rotate(190deg) brightness(95%) contrast(95%)'

function QuickLinkCard({ to, icon, label, alt }: QuickLinkItem) {
  return (
    <StaggerItem>
      <Link to={to} style={{ textDecoration: 'none' }}>
        <VStack
          flex={1}
          spacing={4}
          textAlign="center"
          px={[4, 6, 8]}
          cursor="pointer"
          transition="all 0.3s ease"
          _hover={{ transform: 'translateY(-4px)' }}
          maxW={['280px', '300px', '320px']}
        >
          <Box
            w={['100px', '120px', '140px']}
            h={['100px', '120px', '140px']}
            mb={2}
          >
            <Image
              src={icon}
              alt={alt}
              w="100%"
              h="100%"
              objectFit="contain"
              filter={ICON_FILTER}
            />
          </Box>
          <Text
            fontFamily="elegant"
            fontSize={['sm', 'md']}
            textTransform="uppercase"
            letterSpacing="0.2em"
            color="secondary.navy"
            fontWeight="500"
          >
            {label}
          </Text>
        </VStack>
      </Link>
    </StaggerItem>
  )
}

export function QuickLinks() {
  const { t } = useTranslation()

  const quickLinks: QuickLinkItem[] = [
    {
      to: '/rsvp',
      icon: loveBirdsIcon,
      label: t('header.rsvp'),
      alt: 'RSVP',
    },
    {
      to: '/faq',
      icon: luchadorIcon,
      label: t('header.faq'),
      alt: 'FAQ',
    },
    {
      to: '/accommodations',
      icon: restIcon,
      label: t('quickLinks.stay', 'STAY'),
      alt: 'Stay',
    },
  ]

  return (
    <Box as="section" id="quick-links" py={[16, 20, 24]} bg="neutral.light">
      <Container maxW="container.xl" px={[4, 6, 8]}>
        <VStack spacing={[12, 16, 20]}>
          {/* Section Header */}
          <ScrollReveal>
            <VStack spacing={3} textAlign="center">
              <Text
                fontFamily="elegant"
                fontSize="sm"
                textTransform="uppercase"
                letterSpacing="0.35em"
                color="primary.soft"
                fontWeight="500"
              >
                {t('story.label')}
              </Text>
              <Heading
                as="h2"
                fontFamily="elegant"
                fontSize={['2xl', '3xl', '4xl']}
                fontWeight="400"
                color="secondary.navy"
                letterSpacing="0.02em"
              >
                {t('story.title')}
              </Heading>
            </VStack>
          </ScrollReveal>

          {/* Quick Links Icons */}
          <Box w="full" position="relative">
            <StaggerContainer>
              <Flex
                direction={['column', 'column', 'row']}
                justify="center"
                align={['center', 'center', 'flex-start']}
                gap={[10, 12, 0]}
                position="relative"
                maxW="1000px"
                mx="auto"
              >
                {quickLinks.map((link) => (
                  <QuickLinkCard key={link.to} {...link} />
                ))}
              </Flex>
            </StaggerContainer>
          </Box>
        </VStack>
      </Container>
    </Box>
  )
}

export default QuickLinks
