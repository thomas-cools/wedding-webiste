import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Box, VStack, Tabs, TabList, TabPanels, Tab, TabPanel, Heading, Text, Image, Button, Badge, SimpleGrid, HStack
} from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import airbnbLogo from '../assets/airbnb-tile.svg';
import bookingLogo from '../assets/booking-tile.svg';

interface AccommodationSectionProps {
  enabled: boolean;
}

export const AccommodationSection: React.FC<AccommodationSectionProps> = ({ enabled }) => {
  const { t } = useTranslation();
  if (!enabled) return null;
  return (
    <Box id="travel" py={[20, 28]} bg="white" scrollMarginTop={["100px", "130px", "150px"]}>
      <VStack spacing={12}>
        {/* Section Header */}
        <VStack spacing={4} textAlign="center">
          <Text 
            fontSize="sm" 
            textTransform="uppercase" 
            letterSpacing="0.3em" 
            color="primary.soft"
            fontWeight="500"
          >
            {t('travel.label')}
          </Text>
          <Heading 
            as="h2"
            fontFamily="heading"
            fontSize={["3xl", "4xl", "5xl"]}
            fontWeight="400"
            color="neutral.dark"
          >
            {t('travel.title')}
          </Heading>
          <Text 
            fontSize="md" 
            color="neutral.muted" 
            maxW="600px"
            lineHeight="tall"
          >
            {t('travel.subtitle')}
          </Text>
        </VStack>
        {/* Accommodation Tabs */}
        <Box w="full" maxW="900px" mx="auto">
          <Tabs variant="soft-rounded" colorScheme="gray" isFitted>
            <TabList 
              bg="neutral.light" 
              p={2} 
              borderRadius="full"
              border="1px solid"
              borderColor="primary.soft"
              mb={8}
            >
              <Tab _selected={{ bg: 'neutral.dark', color: 'white' }}>{t('travel.tabs.airbnb')}</Tab>
              <Tab _selected={{ bg: 'neutral.dark', color: 'white' }}>{t('travel.tabs.booking')}</Tab>
              <Tab _selected={{ bg: 'neutral.dark', color: 'white' }}>{t('travel.tabs.hotels')}</Tab>
            </TabList>
            <TabPanels>
              {/* Airbnb Tab */}
              <TabPanel p={0}>
                <Box bg="neutral.light" borderWidth="1px" borderColor="primary.soft" p={[8, 10]}>
                  <VStack spacing={6} textAlign="center">
                    <Image src={airbnbLogo} alt="Airbnb" w="48px" h="48px" borderRadius="md" />
                    <Heading as="h3" fontFamily="heading" fontSize="xl" fontWeight="400" color="neutral.dark">
                      {t('travel.airbnbTitle')}
                    </Heading>
                    <Text fontSize="sm" color="neutral.muted" maxW="450px">
                      {t('travel.airbnbDescription')}
                    </Text>
                    <Button
                      as="a"
                      href="https://www.airbnb.com/s/Ch%C3%A2teau-du-Pujolet--Vallesvilles--France/homes?refinement_paths%5B%5D=%2Fhomes&date_picker_type=calendar&checkin=2026-08-24&checkout=2026-08-28&adults=2&search_type=autocomplete_click&flexible_trip_lengths%5B%5D=one_week&monthly_start_date=2026-01-01&monthly_length=3&monthly_end_date=2026-04-01&price_filter_input_type=2&price_filter_num_nights=4&channel=EXPLORE&place_id=ChIJP_GaICSQrhIRMqr4tYT_Wcw&acp_id=t-g-ChIJP_GaICSQrhIRMqr4tYT_Wcw"
                      target="_blank"
                      rel="noopener noreferrer"
                      bg="transparent"
                      color="neutral.dark"
                      border="1px solid"
                      borderColor="primary.soft"
                      borderRadius="full"
                      px={8}
                      py={5}
                      fontSize="sm"
                      fontWeight="500"
                      letterSpacing="0.05em"
                      rightIcon={<ExternalLinkIcon boxSize={3} />}
                      _hover={{ bg: "neutral.dark", color: "white", borderColor: "neutral.dark", transform: "translateY(-2px)" }}
                      transition="all 0.3s ease"
                    >
                      {t('travel.searchAirbnb')}
                    </Button>
                  </VStack>
                </Box>
              </TabPanel>
              {/* Booking.com Tab */}
              <TabPanel p={0}>
                <Box bg="neutral.light" borderWidth="1px" borderColor="primary.soft" p={[8, 10]}>
                  <VStack spacing={6} textAlign="center">
                    <Image src={bookingLogo} alt="Booking.com" w="48px" h="48px" borderRadius="md" />
                    <Heading as="h3" fontFamily="heading" fontSize="xl" fontWeight="400" color="neutral.dark">
                      {t('travel.bookingTitle')}
                    </Heading>
                    <Text fontSize="sm" color="neutral.muted" maxW="450px">
                      {t('travel.bookingDescription')}
                    </Text>
                    <Button
                      as="a"
                      href="https://www.booking.com/searchresults.html?ss=Vallesvilles%2C+France&checkin=2026-08-24&checkout=2026-08-28&group_adults=2&no_rooms=1"
                      target="_blank"
                      rel="noopener noreferrer"
                      bg="transparent"
                      color="neutral.dark"
                      border="1px solid"
                      borderColor="primary.soft"
                      borderRadius="full"
                      px={8}
                      py={5}
                      fontSize="sm"
                      fontWeight="500"
                      letterSpacing="0.05em"
                      rightIcon={<ExternalLinkIcon boxSize={3} />}
                      _hover={{ bg: "neutral.dark", color: "white", borderColor: "neutral.dark", transform: "translateY(-2px)" }}
                      transition="all 0.3s ease"
                    >
                      {t('travel.searchBookingButton')}
                    </Button>
                  </VStack>
                </Box>
              </TabPanel>
              {/* Hotels Tab */}
              <TabPanel p={0}>
                <VStack spacing={8}>
                  {/* Hotels Introduction */}
                  <Box bg="neutral.light" borderWidth="1px" borderColor="primary.soft" p={[6, 8]} w="full" textAlign="center">
                    <VStack spacing={4}>
                      <Box as="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" w="48px" h="48px" fill="none" stroke="currentColor" strokeWidth="1.5" color="neutral.dark">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                      </Box>
                      <Heading as="h3" fontFamily="heading" fontSize="xl" fontWeight="400" color="neutral.dark">
                        {t('travel.hotelsTitle')}
                      </Heading>
                      <Text fontSize="sm" color="neutral.muted" maxW="450px">
                        {t('travel.hotelsDescription')}
                      </Text>
                    </VStack>
                  </Box>
                  {/* Recommended Hotels List */}
                  <Box w="full">
                    <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.2em" color="primary.soft" fontWeight="500" mb={4} textAlign="center">
                      {t('travel.recommendedHotels')}
                    </Text>
                    <SimpleGrid columns={[1, 1, 3]} spacing={4}>
                      {/* Hotel 1 */}
                      <Box bg="white" borderWidth="1px" borderColor="primary.soft" p={6}>
                        <VStack align="start" spacing={3}>
                          <HStack justify="space-between" w="full">
                            <Heading as="h4" fontSize="md" fontWeight="500" color="neutral.dark">
                              {t('travel.hotels.0.name')}
                            </Heading>
                            <Badge colorScheme="gray" variant="subtle" fontSize="xs">
                              {t('travel.hotels.0.priceRange')}
                            </Badge>
                          </HStack>
                          <Text fontSize="xs" color="primary.soft" fontWeight="500">
                            {t('travel.hotels.0.location')}
                          </Text>
                          <Text fontSize="sm" color="neutral.muted">
                            {t('travel.hotels.0.description')}
                          </Text>
                        </VStack>
                      </Box>
                      {/* Hotel 2 */}
                      <Box bg="white" borderWidth="1px" borderColor="primary.soft" p={6}>
                        <VStack align="start" spacing={3}>
                          <HStack justify="space-between" w="full">
                            <Heading as="h4" fontSize="md" fontWeight="500" color="neutral.dark">
                              {t('travel.hotels.1.name')}
                            </Heading>
                            <Badge colorScheme="gray" variant="subtle" fontSize="xs">
                              {t('travel.hotels.1.priceRange')}
                            </Badge>
                          </HStack>
                          <Text fontSize="xs" color="primary.soft" fontWeight="500">
                            {t('travel.hotels.1.location')}
                          </Text>
                          <Text fontSize="sm" color="neutral.muted">
                            {t('travel.hotels.1.description')}
                          </Text>
                        </VStack>
                      </Box>
                      {/* Hotel 3 */}
                      <Box bg="white" borderWidth="1px" borderColor="primary.soft" p={6}>
                        <VStack align="start" spacing={3}>
                          <HStack justify="space-between" w="full">
                            <Heading as="h4" fontSize="md" fontWeight="500" color="neutral.dark">
                              {t('travel.hotels.2.name')}
                            </Heading>
                            <Badge colorScheme="gray" variant="subtle" fontSize="xs">
                              {t('travel.hotels.2.priceRange')}
                            </Badge>
                          </HStack>
                          <Text fontSize="xs" color="primary.soft" fontWeight="500">
                            {t('travel.hotels.2.location')}
                          </Text>
                          <Text fontSize="sm" color="neutral.muted">
                            {t('travel.hotels.2.description')}
                          </Text>
                        </VStack>
                      </Box>
                    </SimpleGrid>
                  </Box>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </VStack>
    </Box>
  );
};
