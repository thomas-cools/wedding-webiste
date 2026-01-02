import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, VStack, Heading, Text, SimpleGrid } from '@chakra-ui/react';
import { HotelCard, Hotel } from './HotelCard';

export const HotelsTab: React.FC = () => {
  const { t } = useTranslation();

  // Get hotels from translations
  const hotels: Hotel[] = [
    {
      name: t('travel.hotels.0.name'),
      location: t('travel.hotels.0.location'),
      description: t('travel.hotels.0.description'),
      priceRange: t('travel.hotels.0.priceRange'),
    },
    {
      name: t('travel.hotels.1.name'),
      location: t('travel.hotels.1.location'),
      description: t('travel.hotels.1.description'),
      priceRange: t('travel.hotels.1.priceRange'),
    },
    {
      name: t('travel.hotels.2.name'),
      location: t('travel.hotels.2.location'),
      description: t('travel.hotels.2.description'),
      priceRange: t('travel.hotels.2.priceRange'),
    },
  ];

  return (
    <VStack spacing={8}>
      {/* Hotels Introduction */}
      <Box bg="neutral.light" borderWidth="1px" borderColor="primary.soft" borderRadius="md" p={[6, 8]} w="full" textAlign="center">
        <VStack spacing={4}>
          <Box 
            as="svg" 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            w="48px" 
            h="48px" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            color="neutral.dark"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" 
            />
          </Box>
          <Heading as="h3" fontFamily="heading" fontSize="xl" fontWeight="400" color="primary.deep">
            {t('travel.hotelsTitle')}
          </Heading>
          <Text fontSize="sm" color="neutral.muted" maxW="450px">
            {t('travel.hotelsDescription')}
          </Text>
        </VStack>
      </Box>

      {/* Recommended Hotels List */}
      <Box w="full">
        <Text 
          fontSize="xs" 
          textTransform="uppercase" 
          letterSpacing="0.2em" 
          color="primary.soft" 
          fontWeight="500" 
          mb={4} 
          textAlign="center"
        >
          {t('travel.recommendedHotels')}
        </Text>
        <SimpleGrid columns={[1, 1, 3]} spacing={4}>
          {hotels.map((hotel, index) => (
            <HotelCard key={index} hotel={hotel} />
          ))}
        </SimpleGrid>
      </Box>
    </VStack>
  );
};
