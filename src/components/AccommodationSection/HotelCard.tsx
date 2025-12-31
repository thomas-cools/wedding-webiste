import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, VStack, Heading, Text, Flex, Badge } from '@chakra-ui/react';

export interface Hotel {
  name: string;
  location: string;
  description: string;
  priceRange: string;
}

interface HotelCardProps {
  hotel: Hotel;
}

export const HotelCard: React.FC<HotelCardProps> = ({ hotel }) => {
  return (
    <Box bg="white" borderWidth="1px" borderColor="primary.soft" p={6}>
      <VStack align="start" spacing={3}>
        <Flex justify="space-between" align="flex-start" w="full" gap={2} minH="50px">
          <Heading as="h4" fontSize="md" fontWeight="500" color="neutral.dark">
            {hotel.name}
          </Heading>
          <Badge colorScheme="gray" variant="subtle" fontSize="xs" flexShrink={0}>
            {hotel.priceRange}
          </Badge>
        </Flex>
        <Text fontSize="xs" color="primary.soft" fontWeight="500">
          {hotel.location}
        </Text>
        <Text fontSize="sm" color="neutral.muted">
          {hotel.description}
        </Text>
      </VStack>
    </Box>
  );
};
