import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Container,
  Grid,
  GridItem,
  Heading,
  Image as ChakraImage,
  Link,
  List,
  ListItem,
  Text,
  VStack,
} from '@chakra-ui/react'
import PasswordGate from '../components/PasswordGate'
import Footer from '../components/Footer'
import { useFeatureFlags } from '../contexts/FeatureFlagsContext'
import SiteHeader from '../components/SiteHeader'

import taxiIcon from '../assets/Taxi.svg'

function TaxiPageContent() {
  const { t } = useTranslation()

  const full = { colStart: [1, 1, 2] as const, colSpan: [6, 6, 4] as const }
  const left = { colStart: [1, 1, 2] as const, colSpan: [6, 6, 2] as const }
  const right = { colStart: [1, 1, 4] as const, colSpan: [6, 6, 2] as const }

  return (
    <Box id="page-top" minH="100vh" bg="neutral.cream" display="flex" flexDirection="column">
      <SiteHeader />

      <Box
        as="main"
        id="main-content"
        role="main"
        tabIndex={-1}
        flex="1"
        pt={['80px', '100px', '120px']}
      >
        <Container maxW="container.xl" px={[4, 6, 8]} py={[10, 14, 16]}>
          <Grid templateColumns="repeat(6, 1fr)" columnGap={[4, 6, 8]} rowGap={[8, 10, 12]}>
            <GridItem {...full}>
              <VStack spacing={4} textAlign="center" maxW="760px" mx="auto">
                <Heading
                  as="h1"
                  fontFamily="heading"
                  fontWeight="400"
                  color="neutral.dark"
                  fontSize={['2xl', '3xl', '4xl']}
                >
                  {t('taxi.title')}
                </Heading>
                <Text fontSize={['sm', 'md']} lineHeight="1.9" color="neutral.dark" textAlign="justify">
                  {t('taxi.intro')}
                </Text>
              </VStack>
            </GridItem>

            <GridItem {...left} display="flex" alignItems="flex-start" justifyContent="center">
              <Box w={['160px', '180px', '220px']} flexShrink={0}>
                <ChakraImage src={taxiIcon} alt="Taxi" w="100%" h="auto" />
              </Box>
            </GridItem>

            <GridItem {...right}>
              <VStack align="flex-start" spacing={5}>
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
              </VStack>
            </GridItem>

            <GridItem {...full}>
              <Box maxW="760px" mx="auto">
                <Text fontWeight="700" color="neutral.dark" mb={2}>
                  {t('taxi.estimateLabel')}
                </Text>
                <List spacing={1} styleType="disc" pl={5}>
                  {(t('taxi.estimates', { returnObjects: true }) as string[]).map((line) => (
                    <ListItem key={line} color="neutral.dark" fontSize={['sm', 'md']}>
                      {line}
                    </ListItem>
                  ))}
                </List>
                <Text fontWeight="600" color="neutral.dark" fontSize={['sm', 'md']} mt={4} mb={2}>
                  {t('taxi.vansLabel')}
                </Text>
                <List spacing={1} styleType="disc" pl={5}>
                  {(t('taxi.vansEstimates', { returnObjects: true }) as string[]).map((line) => (
                    <ListItem key={line} color="neutral.dark" fontSize={['sm', 'md']}>
                      {line}
                    </ListItem>
                  ))}
                </List>
              </Box>
            </GridItem>

            <GridItem {...full}>
              <Text
                textAlign="justify"
                color="neutral.dark"
                fontSize={['sm', 'md']}
                lineHeight="1.9"
                maxW="760px"
                mx="auto"
                pt={4}
              >
                {t('taxi.note')}
              </Text>
            </GridItem>
          </Grid>
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
