import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, VStack, Heading, Text, Image, Button } from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import bookingLogo from '../../assets/booking-tile.svg';

const BOOKING_SEARCH_URL = 'https://www.booking.com/searchresults.html?ss=Vallesvilles%2C+France&checkin=2026-08-24&checkout=2026-08-28&group_adults=2&no_rooms=1';

export const BookingTab: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Box bg="neutral.light" borderWidth="1px" borderColor="primary.soft" p={[8, 10]}>
      <VStack spacing={6} textAlign="center">
        <Image src={bookingLogo} alt="Booking.com" w="48px" h="48px" borderRadius="md" />
        <Heading as="h3" fontFamily="heading" fontSize="xl" fontWeight="400" color="primary.deep">
          {t('travel.bookingTitle')}
        </Heading>
        <Text fontSize="sm" color="neutral.muted" maxW="450px">
          {t('travel.bookingDescription')}
        </Text>
        <Button
          as="a"
          href={BOOKING_SEARCH_URL}
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
          _hover={{ 
            bg: "neutral.dark", 
            color: "white", 
            borderColor: "neutral.dark", 
            transform: "translateY(-2px)" 
          }}
          transition="all 0.3s ease"
        >
          {t('travel.searchBookingButton')}
        </Button>
      </VStack>
    </Box>
  );
};
