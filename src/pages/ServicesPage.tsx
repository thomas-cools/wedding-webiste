import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
} from '@chakra-ui/react'
import PasswordGate from '../components/PasswordGate'
import Footer from '../components/Footer'
import { useFeatureFlags } from '../contexts/FeatureFlagsContext'
import SiteHeader from '../components/SiteHeader'

function ServicesPageContent() {
  const { t } = useTranslation()

  return (
    <Box id="page-top" minH="100vh" bg="neutral.light" display="flex" flexDirection="column">
      <SiteHeader />

      {/* Main Content */}
      <Box
        as="main"
        id="main-content"
        role="main"
        tabIndex={-1}
        flex="1"
        pt={['80px', '100px', '120px']}
      >
        <Container maxW="container.md" px={[4, 6, 8]} py={[12, 16]}>
          <VStack spacing={10} align="stretch">
            <VStack spacing={4} textAlign="center" maxW="700px" mx="auto">
              <Heading as="h1" fontFamily="heading" fontSize={['3xl', '4xl']} fontWeight="400" color="neutral.dark">
                {t('services.pageTitle')}
              </Heading>
              <Text fontSize={['md', 'lg']} lineHeight="1.9" color="neutral.dark">
                {t('services.pageIntro')}
              </Text>
            </VStack>

            <VStack
              align="stretch"
              spacing={4}
              bg="white"
              borderRadius="lg"
              boxShadow="sm"
              p={[6, 8]}
            >
              <Heading as="h2" fontFamily="heading" fontSize={['xl', '2xl']} fontWeight="400" color="neutral.dark">
                {t('services.transportation.title')}
              </Heading>
              <Box>
                <Text fontWeight="600" color="neutral.dark" mb={1}>
                  {t('services.transportation.taxis.title')}
                </Text>
                <Text fontSize={['sm', 'md']} lineHeight="1.8" color="neutral.dark">
                  {t('services.transportation.taxis.description')}
                </Text>
              </Box>
            </VStack>
          </VStack>
        </Container>
      </Box>

      <Footer sectionAboveBg="#F6F1EB" />
    </Box>
  )
}

export default function ServicesPage() {
  const { features } = useFeatureFlags()

  if (features.requirePassword) {
    return (
      <PasswordGate>
        <ServicesPageContent />
      </PasswordGate>
    )
  }

  return <ServicesPageContent />
}
