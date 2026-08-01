import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Button,
  Container,
  Flex,
  HStack,
  Heading,
  Image as ChakraImage,
  Link,
  Text,
  VStack,
} from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { ArrowBackIcon } from '@chakra-ui/icons'
import LanguageSwitcher from '../components/LanguageSwitcher'
import PasswordGate from '../components/PasswordGate'
import Footer from '../components/Footer'
import { useFeatureFlags } from '../contexts/FeatureFlagsContext'

import weddingLogoSmall from '../assets/monogram_websiteT&C-small.webp'
import weddingLogoMedium from '../assets/monogram_websiteT&C-medium.webp'
import weddingLogo2x from '../assets/monogram_websiteT&C-2x.webp'
import taxiIcon from '../assets/Taxi.svg'

function TaxiPageContent() {
  const { t } = useTranslation()

  return (
    <Box id="page-top" minH="100vh" bg="neutral.cream" display="flex" flexDirection="column">
      <Box
        as="header"
        role="banner"
        py={[4, 6]}
        position="fixed"
        top={0}
        left={0}
        right={0}
        zIndex={100}
        bg="#300F0C"
      >
        <Container maxW="container.xl" px={[4, 6, 8]}>
          <Flex justify="center" align="center" position="relative">
            <HStack spacing={4} position="absolute" left={0}>
              <Button
                as={RouterLink}
                to="/"
                variant="ghost"
                size="sm"
                color="#E3DFCE"
                _hover={{ bg: 'whiteAlpha.200' }}
                leftIcon={<ArrowBackIcon />}
              >
                {t('taxi.backToHome', 'Back')}
              </Button>
            </HStack>

            <RouterLink to="/">
              <ChakraImage
                src={weddingLogoSmall}
                srcSet={`${weddingLogoSmall} 60w, ${weddingLogoMedium} 100w, ${weddingLogo2x} 200w`}
                sizes="(max-width: 480px) 40px, (max-width: 768px) 45px, 50px"
                alt={t('header.initials')}
                h={['40px', '45px', '50px']}
                w="auto"
                cursor="pointer"
              />
            </RouterLink>

            <HStack spacing={4} position="absolute" right={0}>
              <LanguageSwitcher />
            </HStack>
          </Flex>
        </Container>
      </Box>

      <Box
        as="main"
        id="main-content"
        role="main"
        tabIndex={-1}
        flex="1"
        pt={['80px', '100px', '120px']}
      >
        <Container maxW="container.md" px={[4, 6, 8]} py={[10, 14, 16]}>
          <VStack spacing={[10, 12]} align="stretch">
            <VStack spacing={4} textAlign="center" maxW="660px" mx="auto">
              <Heading
                as="h1"
                fontFamily="heading"
                fontWeight="400"
                color="neutral.dark"
                fontSize={['2xl', '3xl', '4xl']}
              >
                {t('taxi.title')}
              </Heading>
              <Text fontSize={['sm', 'md']} lineHeight="1.9" color="neutral.dark">
                {t('taxi.intro')}
              </Text>
            </VStack>

            <Flex direction={['column', 'row']} gap={[8, 10, 14]} align={['center', 'flex-start']}>
              <Box flexShrink={0} w={['160px', '180px', '220px']}>
                <ChakraImage src={taxiIcon} alt="Taxi" w="100%" h="auto" />
              </Box>

              <VStack align="flex-start" spacing={5} flex="1">
                <Text fontWeight="600" color="neutral.dark" fontSize={['md', 'lg']}>
                  {t('taxi.company')}
                </Text>

                <Box>
                  <Text fontWeight="700" color="neutral.dark" mb={1}>
                    {t('taxi.phoneLabel')}
                  </Text>
                  <Text color="neutral.dark" fontSize={['sm', 'md']}>
                    {t('taxi.phone')}
                  </Text>
                </Box>

                <Box>
                  <Text fontWeight="700" color="neutral.dark" mb={1}>
                    {t('taxi.emailLabel')}
                  </Text>
                  <Link
                    href={`mailto:${t('taxi.email')}`}
                    color="neutral.dark"
                    fontSize={['sm', 'md']}
                    _hover={{ opacity: 0.7 }}
                  >
                    {t('taxi.email')}
                  </Link>
                </Box>

                <Box>
                  <Text fontWeight="700" color="neutral.dark" mb={2}>
                    {t('taxi.estimateLabel')}
                  </Text>
                  <VStack align="flex-start" spacing={1}>
                    {(t('taxi.estimates', { returnObjects: true }) as string[]).map((line) => (
                      <Text key={line} color="neutral.dark" fontSize={['sm', 'md']}>
                        {line}
                      </Text>
                    ))}
                  </VStack>
                  <Text fontWeight="600" color="neutral.dark" fontSize={['sm', 'md']} mt={4} mb={2}>
                    {t('taxi.vansLabel')}
                  </Text>
                  <VStack align="flex-start" spacing={1}>
                    {(t('taxi.vansEstimates', { returnObjects: true }) as string[]).map((line) => (
                      <Text key={line} color="neutral.dark" fontSize={['sm', 'md']}>
                        {line}
                      </Text>
                    ))}
                  </VStack>
                </Box>
              </VStack>
            </Flex>

            <Text
              textAlign="center"
              color="neutral.dark"
              fontSize={['sm', 'md']}
              lineHeight="1.9"
              maxW="580px"
              mx="auto"
              pt={4}
            >
              {t('taxi.note')}
            </Text>
          </VStack>
        </Container>
      </Box>

      <Footer variant="dark" sectionAboveBg="#E3DFCE" />
    </Box>
  )
}

export default function TaxiPage() {
  const { features } = useFeatureFlags()

  if (features.requirePassword) {
    return (
      <PasswordGate>
        <TaxiPageContent />
      </PasswordGate>
    )
  }

  return <TaxiPageContent />
}
