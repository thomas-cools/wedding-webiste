import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
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
    <Box id="travel" py={[20, 28]} scrollMarginTop={["100px", "130px", "150px"]}>
      <VStack spacing={[12, 14, 16]} align="stretch" maxW="1040px" w="full" mx="auto" px={[4, 6, 8]}>
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

        <SimpleGrid columns={[1, 1, 2]} spacing={[8, 10, 14]} alignItems="start" py={[1, 2, 3]}>
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

        <SimpleGrid columns={[1, 1, 2]} spacing={[8, 10, 12]} alignItems="center" py={[1, 2, 3]}>
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
          maxW="820px"
          mx="auto"
          mt={[4, 6, 7]}
          mb={[4, 6, 7]}
        >
          {t('travel.houseNote')}
        </Text>

        <VStack spacing={[5, 6, 7]} align="stretch" w="full" mx="auto" py={[1, 2, 3]}>
          <Heading as="h3" fontSize={["md", "lg"]} color="secondary.navy">
            {t('travel.food.title')}
          </Heading>

          <Text fontSize={["sm", "md"]} color="neutral.dark" lineHeight="1.8">
            {foodScheduleParagraph}
          </Text>

          <Text fontSize={["sm", "md"]} color="neutral.dark" lineHeight="1.8">
            {t('travel.food.note')}
          </Text>

          <SimpleGrid columns={[1, 2]} spacing={[6, 8]} alignItems="center">
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

        <SimpleGrid columns={[1, 2]} spacing={[8, 12]} alignItems="center" w="full" py={[1, 2, 3]}>
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

        <Box w="full" h="1px" />
      </VStack>
    </Box>
  )
}
