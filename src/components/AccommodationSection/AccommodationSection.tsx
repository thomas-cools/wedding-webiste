import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Container,
  Divider,
  Grid,
  GridItem,
  Heading,
  Image,
  Link,
  List,
  ListItem,
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

  // col shorthands: mobile = full-width (colSpan 6), desktop = constrained to cols 2–5
  const full = { colStart: [1, 1, 2] as const, colSpan: [6, 6, 4] as const }
  const left = { colStart: [1, 1, 2] as const, colSpan: [6, 6, 2] as const }
  const right = { colStart: [1, 1, 4] as const, colSpan: [6, 6, 2] as const }

  return (
    <Box id="travel" py={[16, 20, 24]} scrollMarginTop={["100px", "130px", "150px"]}>
      <Container maxW="container.xl" px={[4, 6, 8]}>
        <Grid
          templateColumns="repeat(6, 1fr)"
          columnGap={[4, 6, 8]}
          rowGap={[8, 10, 12]}
        >

          {/* ── Header / intro ── */}
          <GridItem {...full}>
            <VStack spacing={4} textAlign="center">
              <Text
                fontFamily="elegant"
                fontSize="sm"
                textTransform="uppercase"
                letterSpacing="0.35em"
                color="primary.soft"
                fontWeight="500"
              >
                {t('travel.label')}
              </Text>
              <Heading
                as="h2"
                fontFamily="elegant"
                fontSize={["3xl", "4xl", "5xl"]}
                fontWeight="400"
                color="secondary.navy"
                letterSpacing="0.02em"
              >
                {t('travel.title')}
              </Heading>
              <Divider borderColor="primary.soft" w="120px" mx="auto" my={2} />
              <Text
                fontSize={["sm", "md"]}
                color="neutral.muted"
                lineHeight="1.9"
                textAlign="justify"
              >
                {[t('travel.subtitle'), ...introParagraphs].join(' ')}
              </Text>
            </VStack>
          </GridItem>

          {/* ── Chateau sketch (left) + room layout (right) ── */}
          <GridItem {...left} display="flex" alignItems="flex-start">
            <Image
              src={chateauSketch}
              alt={t('travel.layout.imageAlt', 'Chateau layout sketch')}
              w="100%"
              h="auto"
              objectFit="contain"
            />
          </GridItem>
          <GridItem {...right} display="flex" alignItems="flex-start">
            <VStack align="start" spacing={6}>
              <Box>
                <Heading as="h3" fontSize={["md", "lg"]} color="secondary.navy" mb={2}>
                  {t('travel.layout.mainHouse.title')}
                </Heading>
                <List spacing={2} styleType="none" m={0}>
                  {mainHouseGuests.map((guest, index) => (
                    <ListItem key={index} display="flex" alignItems="center" gap={3}>
                      <Box w="6px" h="6px" borderRadius="full" bg="neutral.dark" flexShrink={0} />
                      <Text fontSize={["sm", "md"]} color="neutral.dark">{guest}</Text>
                    </ListItem>
                  ))}
                </List>
              </Box>
              <Box>
                <Heading as="h3" fontSize={["md", "lg"]} color="secondary.navy" mb={2}>
                  {t('travel.layout.chambre.title')}
                </Heading>
                <List spacing={2} styleType="none" m={0}>
                  {chambreGuests.map((guest, index) => (
                    <ListItem key={index} display="flex" alignItems="center" gap={3}>
                      <Box w="6px" h="6px" borderRadius="full" bg="neutral.dark" flexShrink={0} />
                      <Text fontSize={["sm", "md"]} color="neutral.dark">{guest}</Text>
                    </ListItem>
                  ))}
                </List>
              </Box>
            </VStack>
          </GridItem>

          {/* ── Amenities (left) + pool icon (right) ── */}
          <GridItem {...left} display="flex" alignItems="center">
            <Box>
              <Heading as="h3" fontSize={["md", "lg"]} color="secondary.navy" mb={3}>
                {t('travel.amenities.title')}
              </Heading>
              <List spacing={2} styleType="none" m={0}>
                {amenities.map((item, index) => (
                  <ListItem key={index} display="flex" alignItems="center" gap={3}>
                    <Box w="6px" h="6px" borderRadius="full" bg="neutral.dark" flexShrink={0} />
                    <Text fontSize={["sm", "md"]} color="neutral.dark">{item}</Text>
                  </ListItem>
                ))}
              </List>
            </Box>
          </GridItem>
          <GridItem {...right} display="flex" alignItems="center" justifyContent="center">
            <Image
              src={poolIcon}
              alt={t('travel.amenities.imageAlt', 'Pool lounge illustration')}
              maxW={["170px", "190px", "210px"]}
              w="100%"
              h="auto"
              objectFit="contain"
            />
          </GridItem>

          {/* ── House note ── */}
          <GridItem {...full}>
            <Text
              fontSize={["sm", "md"]}
              color="neutral.dark"
              lineHeight="1.9"
              textAlign="justify"
            >
              {t('travel.houseNote')}
            </Text>
          </GridItem>

          {/* ── Food section: title + text ── */}
          <GridItem {...full}>
            <VStack spacing={[4, 5, 6]} align="stretch">
              <Heading as="h3" fontSize={["md", "lg"]} color="secondary.navy">
                {t('travel.food.title')}
              </Heading>
              <Text fontSize={["sm", "md"]} color="neutral.dark" lineHeight="1.8" textAlign="justify">
                {foodScheduleParagraph}
              </Text>
              <Text fontSize={["sm", "md"]} color="neutral.dark" lineHeight="1.8" textAlign="justify">
                {t('travel.food.note')}
              </Text>
            </VStack>
          </GridItem>

          {/* ── Fries icon (left) + store info (right) ── */}
          <GridItem {...left} display="flex" alignItems="center" justifyContent="center">
            <Image
              src={friesIcon}
              alt={t('travel.food.iconAlt', 'Fries icon')}
              maxW={["170px", "190px", "210px"]}
              w="100%"
              h="auto"
              objectFit="contain"
            />
          </GridItem>
          <GridItem {...right} display="flex" alignItems="center">
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
          </GridItem>

          {/* ── Allergy note ── */}
          <GridItem {...full}>
            <Text fontSize={["sm", "md"]} color="neutral.dark" lineHeight="1.8" textAlign="justify">
              {t('travel.food.allergyNote')}
            </Text>
          </GridItem>

          {/* ── Pharmacies (left) + pharmacy icon (right) ── */}
          <GridItem {...left} display="flex" alignItems="center">
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
          </GridItem>
          <GridItem {...right} display="flex" alignItems="center" justifyContent="center">
            <Image
              src={pharmacyIcon}
              alt={t('travel.pharmacy.iconAlt', 'Pharmacy icon')}
              maxW={["170px", "190px", "210px"]}
              w="100%"
              h="auto"
              objectFit="contain"
            />
          </GridItem>

        </Grid>
      </Container>
    </Box>
  )
}
