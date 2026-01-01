import React from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { 
  Box, VStack, Tabs, TabList, TabPanels, Tab, TabPanel, Heading, Text, Image, Button, Badge, SimpleGrid, Flex, Link
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
    <Box id="travel" py={[12, 16, 28]} px={[4, 6, 8]} bg="white" scrollMarginTop={["100px", "130px", "150px"]}>
      <VStack spacing={[8, 10, 12]}>
        {/* Section Header */}
        <VStack spacing={[3, 4]} textAlign="center" px={[2, 0]}>
          <Text 
            fontSize={["xs", "sm"]} 
            textTransform="uppercase" 
            letterSpacing={["0.2em", "0.3em"]} 
            color="primary.soft"
            fontWeight="500"
          >
            {t('travel.label')}
          </Text>
          <Heading 
            as="h2"
            fontFamily="heading"
            fontSize={["2xl", "3xl", "4xl", "5xl"]}
            fontWeight="400"
            color="neutral.dark"
          >
            {t('travel.title')}
          </Heading>
          <Text 
            fontSize={["sm", "md"]} 
            color="neutral.muted" 
            maxW="700px"
            lineHeight="tall"
            px={[2, 4, 0]}
          >
            {t('travel.subtitle')}
          </Text>
          <Text 
            fontSize={["xs", "sm"]} 
            color="primary.deep" 
            maxW="650px"
            lineHeight="tall"
            fontWeight="500"
            fontStyle="italic"
            px={[2, 4, 0]}
          >
            {t('travel.transportNote')}
          </Text>
        </VStack>
        {/* Accommodation Tabs */}
        <Box w="full" maxW="900px" mx="auto">
          <Tabs variant="soft-rounded" colorScheme="gray" isFitted>
            <TabList 
              bg="neutral.light" 
              p={[1.5, 2]} 
              borderRadius={["xl", "full"]}
              border="1px solid"
              borderColor="primary.soft"
              mb={[6, 8]}
              flexWrap={["wrap", "wrap", "nowrap"]}
              gap={[1, 1, 0]}
            >
              <Tab 
                _selected={{ bg: 'neutral.dark', color: 'white' }}
                fontSize={["xs", "sm", "md"]}
                px={[3, 4, 6]}
                py={[2, 2.5]}
                flex={["1 1 45%", "1 1 45%", "1"]}
                minW={["auto", "auto", "unset"]}
              >
                {t('travel.tabs.onsite')}
              </Tab>
              <Tab 
                _selected={{ bg: 'neutral.dark', color: 'white' }}
                fontSize={["xs", "sm", "md"]}
                px={[3, 4, 6]}
                py={[2, 2.5]}
                flex={["1 1 45%", "1 1 45%", "1"]}
                minW={["auto", "auto", "unset"]}
              >
                {t('travel.tabs.airbnb')}
              </Tab>
              <Tab 
                _selected={{ bg: 'neutral.dark', color: 'white' }}
                fontSize={["xs", "sm", "md"]}
                px={[3, 4, 6]}
                py={[2, 2.5]}
                flex={["1 1 45%", "1 1 45%", "1"]}
                minW={["auto", "auto", "unset"]}
              >
                {t('travel.tabs.booking')}
              </Tab>
              <Tab 
                _selected={{ bg: 'neutral.dark', color: 'white' }}
                fontSize={["xs", "sm", "md"]}
                px={[3, 4, 6]}
                py={[2, 2.5]}
                flex={["1 1 45%", "1 1 45%", "1"]}
                minW={["auto", "auto", "unset"]}
              >
                {t('travel.tabs.hotels')}
              </Tab>
            </TabList>
            <TabPanels>
              {/* On-Site Accommodation Tab */}
              <TabPanel p={0}>
                <Box bg="neutral.light" borderWidth="1px" borderColor="primary.soft" p={[5, 6, 10]}>
                  <VStack spacing={[4, 5, 6]} textAlign="center">
                    <Box as="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" w={["40px", "44px", "48px"]} h={["40px", "44px", "48px"]} fill="none" stroke="currentColor" strokeWidth="1.5" color="neutral.dark">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
                    </Box>
                    <Heading as="h3" fontFamily="heading" fontSize={["lg", "xl"]} fontWeight="400" color="primary.deep">
                      {t('travel.onsiteTitle')}
                    </Heading>
                    <Text fontSize={["xs", "sm"]} color="neutral.muted" maxW="550px" px={[2, 0]}>
                      {t('travel.onsiteDescription')}
                    </Text>
                    <Text fontSize={["xs", "sm"]} color="neutral.muted" maxW="550px" px={[2, 0]}>
                      <Trans 
                        i18nKey="travel.onsiteDetails"
                        components={{
                          emailLink: <Link href="mailto:rsvp@carolinaandthomas.com" color="primary.deep" fontWeight="500" _hover={{ textDecoration: 'underline' }} />
                        }}
                      />
                    </Text>
                  </VStack>
                </Box>
              </TabPanel>
              {/* Airbnb Tab */}
              <TabPanel p={0}>
                <Box bg="neutral.light" borderWidth="1px" borderColor="primary.soft" p={[5, 6, 10]}>
                  <VStack spacing={[4, 5, 6]} textAlign="center">
                    <Image src={airbnbLogo} alt="Airbnb" w={["40px", "44px", "48px"]} h={["40px", "44px", "48px"]} borderRadius="md" />
                    <Heading as="h3" fontFamily="heading" fontSize={["lg", "xl"]} fontWeight="400" color="primary.deep">
                      {t('travel.airbnbTitle')}
                    </Heading>
                    <Text fontSize={["xs", "sm"]} color="neutral.muted" maxW="450px" px={[2, 0]}>
                      {t('travel.airbnbDescription')}
                    </Text>
                    <Button
                      as="a"
                      href="https://www.airbnb.com/s/Vallesvilles--France/homes?refinement_paths%5B%5D=%2Fhomes&date_picker_type=calendar&checkin=2026-08-24&checkout=2026-08-28&adults=2&search_type=autocomplete_click&flexible_trip_lengths%5B%5D=one_week&monthly_start_date=2026-01-01&monthly_length=3&monthly_end_date=2026-04-01&price_filter_input_type=2&price_filter_num_nights=4&channel=EXPLORE"
                      target="_blank"
                      rel="noopener noreferrer"
                      bg="transparent"
                      color="neutral.dark"
                      border="1px solid"
                      borderColor="primary.soft"
                      borderRadius="full"
                      px={[5, 6, 8]}
                      py={[4, 4, 5]}
                      fontSize={["xs", "sm"]}
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
                <Box bg="neutral.light" borderWidth="1px" borderColor="primary.soft" p={[5, 6, 10]}>
                  <VStack spacing={[4, 5, 6]} textAlign="center">
                    <Image src={bookingLogo} alt="Booking.com" w={["40px", "44px", "48px"]} h={["40px", "44px", "48px"]} borderRadius="md" />
                    <Heading as="h3" fontFamily="heading" fontSize={["lg", "xl"]} fontWeight="400" color="primary.deep">
                      {t('travel.bookingTitle')}
                    </Heading>
                    <Text fontSize={["xs", "sm"]} color="neutral.muted" maxW="450px" px={[2, 0]}>
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
                      px={[5, 6, 8]}
                      py={[4, 4, 5]}
                      fontSize={["xs", "sm"]}
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
                <VStack spacing={[5, 6, 8]}>
                  {/* Hotels Introduction */}
                  <Box bg="neutral.light" borderWidth="1px" borderColor="primary.soft" p={[5, 6, 8]} w="full" textAlign="center">
                    <VStack spacing={[3, 4]}>
                      <Box as="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" w={["40px", "44px", "48px"]} h={["40px", "44px", "48px"]} fill="none" stroke="currentColor" strokeWidth="1.5" color="neutral.dark">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                      </Box>
                      <Heading as="h3" fontFamily="heading" fontSize={["lg", "xl"]} fontWeight="400" color="primary.deep">
                        {t('travel.hotelsTitle')}
                      </Heading>
                      <Text fontSize={["xs", "sm"]} color="neutral.muted" maxW="450px" px={[2, 0]}>
                        {t('travel.hotelsDescription')}
                      </Text>
                    </VStack>
                  </Box>
                  {/* Recommended Hotels List */}
                  <Box w="full">
                    <Text fontSize="xs" textTransform="uppercase" letterSpacing={["0.15em", "0.2em"]} color="primary.soft" fontWeight="500" mb={[3, 4]} textAlign="center">
                      {t('travel.recommendedHotels')}
                    </Text>
                    <SimpleGrid columns={[1, 1, 2, 3]} spacing={[3, 4]}>
                      {/* Hotel 1 */}
                      <Box bg="white" borderWidth="1px" borderColor="primary.soft" p={[4, 5, 6]}>
                        <VStack align="start" spacing={[2, 3]}>
                          <Flex justify="space-between" align="flex-start" w="full" gap={2} minH={["auto", "50px"]} flexWrap={["wrap", "nowrap"]}>
                            <Heading as="h4" fontSize={["sm", "md"]} fontWeight="500" color="neutral.dark">
                              {t('travel.hotels.0.name')}
                            </Heading>
                            <Badge colorScheme="gray" variant="subtle" fontSize="xs" flexShrink={0}>
                              {t('travel.hotels.0.priceRange')}
                            </Badge>
                          </Flex>
                          <Text fontSize="xs" color="primary.soft" fontWeight="500">
                            {t('travel.hotels.0.location')}
                          </Text>
                          <Text fontSize={["xs", "sm"]} color="neutral.muted">
                            {t('travel.hotels.0.description')}
                          </Text>
                        </VStack>
                      </Box>
                      {/* Hotel 2 */}
                      <Box bg="white" borderWidth="1px" borderColor="primary.soft" p={[4, 5, 6]}>
                        <VStack align="start" spacing={[2, 3]}>
                          <Flex justify="space-between" align="flex-start" w="full" gap={2} minH={["auto", "50px"]} flexWrap={["wrap", "nowrap"]}>
                            <Heading as="h4" fontSize={["sm", "md"]} fontWeight="500" color="neutral.dark">
                              {t('travel.hotels.1.name')}
                            </Heading>
                            <Badge colorScheme="gray" variant="subtle" fontSize="xs" flexShrink={0}>
                              {t('travel.hotels.1.priceRange')}
                            </Badge>
                          </Flex>
                          <Text fontSize="xs" color="primary.soft" fontWeight="500">
                            {t('travel.hotels.1.location')}
                          </Text>
                          <Text fontSize={["xs", "sm"]} color="neutral.muted">
                            {t('travel.hotels.1.description')}
                          </Text>
                        </VStack>
                      </Box>
                      {/* Hotel 3 */}
                      <Box bg="white" borderWidth="1px" borderColor="primary.soft" p={[4, 5, 6]}>
                        <VStack align="start" spacing={[2, 3]}>
                          <Flex justify="space-between" align="flex-start" w="full" gap={2} minH={["auto", "50px"]} flexWrap={["wrap", "nowrap"]}>
                            <Heading as="h4" fontSize={["sm", "md"]} fontWeight="500" color="neutral.dark">
                              {t('travel.hotels.2.name')}
                            </Heading>
                            <Badge colorScheme="gray" variant="subtle" fontSize="xs" flexShrink={0}>
                              {t('travel.hotels.2.priceRange')}
                            </Badge>
                          </Flex>
                          <Text fontSize="xs" color="primary.soft" fontWeight="500">
                            {t('travel.hotels.2.location')}
                          </Text>
                          <Text fontSize={["xs", "sm"]} color="neutral.muted">
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
