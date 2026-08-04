import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Flex,
  Heading,
  Image,
  Link,
  List,
  ListItem,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react'
import chateauSketch from '../../assets/Chateau.svg'
import friesIcon from '../../assets/Belgium.svg'
import pharmacyIcon from '../../assets/ouch.svg'
import poolIcon from '../../assets/Pool.svg'

interface AccommodationSectionProps {
  enabled: boolean
}

interface QuickPlace {
  name: string
  address: string
  hours: string
  url?: string
}

interface PharmacyPlace {
  name: string
  address: string
  phone: string
  hours: string
  url?: string
}

export const AccommodationSection: React.FC<AccommodationSectionProps> = ({ enabled }) => {
  const { t } = useTranslation()
  const sectionMaxW = 'container.lg'

  const introParagraphs = t('travel.introParagraphs', { returnObjects: true }) as string[]
  const mainHouseGuests = t('travel.layout.mainHouse.guests', { returnObjects: true }) as string[]
  const chambreGuests = t('travel.layout.chambre.guests', { returnObjects: true }) as string[]
  const amenities = t('travel.amenities.items', { returnObjects: true }) as string[]
  const foodSchedule = t('travel.food.schedule', { returnObjects: true }) as string[]
  const foodScheduleParagraph = foodSchedule.join(' ')
  const store = t('travel.food.store', { returnObjects: true }) as QuickPlace
  const pharmacies = t('travel.pharmacy.places', { returnObjects: true }) as PharmacyPlace[]

  if (!enabled) return null

  return (
    <Box id="travel" py={[14, 18, 20]} scrollMarginTop={["100px", "130px", "150px"]}>
      <VStack spacing={[8, 10, 12]} align="stretch" maxW={sectionMaxW} w="full" mx="auto" px={[4, 6, 8]}>
        <VStack spacing={4} textAlign="center">
          <Heading
            as="h2"
            fontFamily="heading"
            fontSize={["3xl", "4xl", "5xl"]}
            fontWeight="400"
            color="secondary.maroon"
          >
            {t('travel.title')}
          </Heading>
          <Text
            fontSize={["sm", "md"]}
            color="neutral.muted"
            maxW="940px"
            lineHeight="1.8"
            textAlign="center"
          >
            {[t('travel.subtitle'), ...introParagraphs].join(' ')}
          </Text>
        </VStack>

        <SimpleGrid columns={[1, 1, 2]} spacing={[6, 8, 10]} alignItems="start" py={[1, 1, 2]}>
          <Box>
            <Image
              src={chateauSketch}
              alt={t('travel.layout.imageAlt', 'Chateau layout sketch')}
              maxW={["320px", "380px", "100%"]}
              w="100%"
              h="auto"
              mx="auto"
              objectFit="contain"
            />
          </Box>

          <VStack align="start" spacing={6}>
            <Box>
              <Heading as="h3" fontSize={["md", "lg"]} color="secondary.navy" mb={2}>
                {t('travel.layout.mainHouse.title')}
              </Heading>
              <List spacing={1} styleType="none" m={0}>
                {mainHouseGuests.map((guest, index) => (
                  <ListItem key={index} fontSize={["sm", "md"]} color="neutral.dark">
                    {guest}
                  </ListItem>
                ))}
              </List>
            </Box>

            <Box>
              <Heading as="h3" fontSize={["md", "lg"]} color="secondary.navy" mb={2}>
                {t('travel.layout.chambre.title')}
              </Heading>
              <List spacing={1} styleType="none" m={0}>
                {chambreGuests.map((guest, index) => (
                  <ListItem key={index} fontSize={["sm", "md"]} color="neutral.dark">
                    {guest}
                  </ListItem>
                ))}
              </List>
            </Box>
          </VStack>
        </SimpleGrid>

        <SimpleGrid columns={[1, 1, 2]} spacing={[6, 8, 10]} alignItems="center" py={[1, 1, 2]}>
          <Box>
            <Heading as="h3" fontSize={["md", "lg"]} color="secondary.navy" mb={3}>
              {t('travel.amenities.title')}
            </Heading>
            <List spacing={1.5} styleType="none" m={0}>
              {amenities.map((item, index) => (
                <ListItem key={index} fontSize={["sm", "md"]} color="neutral.dark">
                  {item}
                </ListItem>
              ))}
            </List>
          </Box>

          <Box>
            <Image
              src={poolIcon}
              alt={t('travel.amenities.imageAlt', 'Pool lounge illustration')}
              maxW={["170px", "190px", "210px"]}
              w="100%"
              h="auto"
              mx="auto"
              objectFit="contain"
            />
          </Box>
        </SimpleGrid>

        <Text
          fontSize={["sm", "md"]}
          color="neutral.dark"
          lineHeight="1.9"
          textAlign="center"
          maxW="full"
          mx="0"
          mt={[1, 2]}
          mb={[1, 2]}
        >
          {t('travel.houseNote')}
        </Text>

        <VStack spacing={[4, 5, 6]} align="stretch" w="full" mx="auto" py={[1, 1, 2]}>
          <Heading as="h3" fontSize={["md", "lg"]} color="secondary.navy">
            {t('travel.food.title')}
          </Heading>

          <Text fontSize={["sm", "md"]} color="neutral.dark" lineHeight="1.8">
            {foodScheduleParagraph}
          </Text>

          <Text fontSize={["sm", "md"]} color="neutral.dark" lineHeight="1.8">
            {t('travel.food.note')}
          </Text>

          <SimpleGrid columns={[1, 2]} spacing={[5, 6]} alignItems="center">
            <Box>
              <Image
                src={friesIcon}
                alt={t('travel.food.iconAlt', 'Fries icon')}
                maxW={["170px", "190px", "210px"]}
                w="100%"
                h="auto"
                mx={["auto", "0"]}
              />
            </Box>

            <Box>
              {store.url ? (
                <Link href={store.url} isExternal color="secondary.navy" fontWeight="700" fontSize={["sm", "md"]} _hover={{ textDecoration: 'underline' }}>
                  {store.name}
                </Link>
              ) : (
                <Text fontWeight="700" fontSize={["sm", "md"]} color="secondary.navy">
                  {store.name}
                </Text>
              )}
              <Text fontSize={["sm", "md"]} color="neutral.dark" mt={1}>
                {store.address}
              </Text>
              <Text fontSize={["sm", "md"]} color="neutral.dark">
                {store.hours}
              </Text>
            </Box>
          </SimpleGrid>

          <Text fontSize={["sm", "md"]} color="neutral.dark" lineHeight="1.8">
            {t('travel.food.allergyNote')}
          </Text>
        </VStack>

        <SimpleGrid columns={[1, 2]} spacing={[6, 8]} alignItems="center" w="full" py={[1, 1, 2]}>
          <VStack align="start" spacing={6}>
            {pharmacies.map((place, index) => (
              <Box key={index}>
                {place.url ? (
                  <Link href={place.url} isExternal color="secondary.navy" fontWeight="700" fontSize={["sm", "md"]} _hover={{ textDecoration: 'underline' }}>
                    {place.name}
                  </Link>
                ) : (
                  <Text fontWeight="700" fontSize={["sm", "md"]} color="secondary.navy">
                    {place.name}
                  </Text>
                )}
                <Text fontSize={["sm", "md"]} color="neutral.dark" mt={1}>
                  {place.address}
                </Text>
                <Text fontSize={["sm", "md"]} color="neutral.dark">
                  {place.phone}
                </Text>
                <Text fontSize={["sm", "md"]} color="neutral.dark">
                  {place.hours}
                </Text>
              </Box>
            ))}
          </VStack>

          <Box>
            <Image
              src={pharmacyIcon}
              alt={t('travel.pharmacy.iconAlt', 'Pharmacy icon')}
              maxW={["170px", "190px", "210px"]}
              w="100%"
              h="auto"
              mx={["auto", "auto"]}
            />
          </Box>
        </SimpleGrid>

        <Flex
          direction={["column", "row"]}
          align={["flex-start", "center"]}
          justify="space-between"
          gap={[5, 6]}
          w="full"
          maxW="full"
          mx="0"
          py={[1, 2]}
        >
          <VStack align="flex-start" spacing={1}>
            <Text fontWeight="700" color="secondary.navy" fontSize="md">
              {t('parking.addressLabel', 'Address:')}
            </Text>
            <Text color="neutral.dark" fontSize="sm" lineHeight="1.9">
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
            w={["220px", "260px", "300px"]}
            h={["220px", "260px", "300px"]}
            borderRadius="full"
            overflow="hidden"
            border="3px solid"
            borderColor="primary.soft"
            flexShrink={0}
            display="block"
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

        <Box w="full" h="1px" />
      </VStack>
    </Box>
  )
}
