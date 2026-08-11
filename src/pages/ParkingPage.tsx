import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Container,
  Flex,
  Heading,
  Image as ChakraImage,
  Text,
  VStack,
} from '@chakra-ui/react'
import PasswordGate from '../components/PasswordGate'
import Footer from '../components/Footer'
import { useFeatureFlags } from '../contexts/FeatureFlagsContext'
import SiteHeader from '../components/SiteHeader'

import textureSvg from '../assets/texture.svg'
import parking1 from '../assets/parking_1.webp'
import parking2 from '../assets/parking_2.webp'
import parking3 from '../assets/parking_3.webp'

function ParkingPageContent() {
  const { t } = useTranslation()

  return (
    <Box id="page-top" minH="100vh" bg="#300F0C" display="flex" flexDirection="column">
      {/* Content wrapper bounds the texture so it stays out of the footer */}
      <Box position="relative" flex="1" overflow="hidden">
        <Box
          position="absolute"
          left={0}
          top={0}
          bottom={0}
          w={['96px', '120px', '160px', '200px']}
          backgroundImage={`url(${textureSvg})`}
          backgroundRepeat="no-repeat"
          backgroundPosition="left center"
          backgroundSize="cover"
          pointerEvents="none"
          zIndex={1}
          sx={{ opacity: 0.25, mixBlendMode: 'overlay' }}
        />

      <SiteHeader />

      <Box
        as="main"
        id="main-content"
        role="main"
        tabIndex={-1}
        flex="1"
        pt={['80px', '100px', '120px']}
        position="relative"
        zIndex={2}
      >
        <Container maxW="container.md" px={[4, 6, 8]} py={[8, 12, 16]}>
          <VStack spacing={[10, 12, 14]} align="stretch">
            <VStack spacing={4} textAlign="center">
              <Heading
                as="h1"
                fontFamily="heading"
                fontWeight="400"
                color="#E3DFCE"
                fontSize={['2xl', '3xl', '4xl']}
              >
                {t('parking.title', 'Location & Parking')}
              </Heading>
              <Text
                color="rgba(227,223,206,0.82)"
                fontSize={['sm', 'md']}
                lineHeight="1.9"
                maxW="600px"
                mx="auto"
              >
                {t('parking.intro')}
              </Text>
            </VStack>

            <VStack spacing={7} align="stretch" maxW="760px" mx="auto">
              <Box>
                <ChakraImage
                  src={parking1}
                  alt={t('parking.image1Alt', 'Parking area entrance')}
                  rounded="sm"
                  w="100%"
                  h={['220px', '280px', '340px']}
                  objectFit="cover"
                  mb={4}
                />
                <Text
                  textAlign="center"
                  color="rgba(227,223,206,0.65)"
                  fontSize="sm"
                  lineHeight="1.8"
                >
                  {t('parking.caption1')}
                </Text>
              </Box>

              <Box>
                <ChakraImage
                  src={parking2}
                  alt={t('parking.image2Alt', 'Parking area path')}
                  rounded="sm"
                  w="100%"
                  h={['220px', '280px', '340px']}
                  objectFit="cover"
                  objectPosition="right center"
                  mb={4}
                />
                <Text
                  textAlign="center"
                  color="rgba(227,223,206,0.65)"
                  fontSize="sm"
                  lineHeight="1.8"
                >
                  {t('parking.caption2')}
                </Text>
              </Box>

              <Box>
                <ChakraImage
                  src={parking3}
                  alt={t('parking.image3Alt', 'Parking lot location')}
                  rounded="sm"
                  w="100%"
                  h={['220px', '280px', '340px']}
                  objectFit="cover"
                  mb={4}
                />
                <Text
                  textAlign="center"
                  color="rgba(227,223,206,0.65)"
                  fontSize="sm"
                  lineHeight="1.8"
                >
                  {t('parking.caption3', 'The marked area is the parking lot where you can leave your car.')}
                </Text>
              </Box>
            </VStack>

            <Flex
              direction={['column', 'row']}
              align={['flex-start', 'center']}
              justify="space-between"
              gap={8}
              pt={4}
            >
              <VStack align="flex-start" spacing={1}>
                <Text fontWeight="700" color="#E3DFCE" fontSize="md">
                  {t('parking.addressLabel', 'Address:')}
                </Text>
                <Text color="rgba(227,223,206,0.82)" fontSize="sm" lineHeight="1.9">
                  962 Rte du Pujolet, 31570
                  <br />
                  Vallesvilles, France
                </Text>
              </VStack>

              <Box
                as="a"
                href="https://maps.google.com/?q=Chateau+du+Pujolet+Vallesvilles+France"
                target="_blank"
                rel="noopener noreferrer"
                w={['220px', '260px', '300px']}
                h={['220px', '260px', '300px']}
                borderRadius="full"
                overflow="hidden"
                border="3px solid rgba(227,223,206,0.25)"
                flexShrink={0}
                display="block"
                _hover={{ borderColor: 'rgba(227,223,206,0.5)' }}
              >
                <Box
                  as="iframe"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2829.1030073649417!2d1.6686848261739966!3d43.60036382110467!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12ae91b47b91454d%3A0xc512c55b21a49017!2sCh%C3%A2teau%20du%20Pujolet!5e1!3m2!1sen!2snl!4v1785588318612!5m2!1sen!2snl"
                  w="100%"
                  h="100%"
                  frameBorder="0"
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  title={t('parking.mapTitle', 'Venue map')}
                  style={{ pointerEvents: 'none' }}
                />
              </Box>
            </Flex>
          </VStack>
        </Container>
      </Box>

      </Box>{/* end content wrapper */}

      <Footer variant="light" sectionAboveBg="#300F0C" />
    </Box>
  )
}

export default function ParkingPage() {
  const { features } = useFeatureFlags()

  if (features.requirePassword) {
    return (
      <PasswordGate bg="#300F0C" scheme="dark">
        <ParkingPageContent />
      </PasswordGate>
    )
  }

  return <ParkingPageContent />
}
