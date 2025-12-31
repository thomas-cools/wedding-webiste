import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, VStack, Heading, Text, Image, Button } from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import airbnbLogo from '../../assets/airbnb-tile.svg';

const AIRBNB_SEARCH_URL = 'https://www.airbnb.com/s/Vallesvilles--France/homes?refinement_paths%5B%5D=%2Fhomes&date_picker_type=calendar&checkin=2026-08-24&checkout=2026-08-28&adults=2&search_type=autocomplete_click&flexible_trip_lengths%5B%5D=one_week&monthly_start_date=2026-01-01&monthly_length=3&monthly_end_date=2026-04-01&price_filter_input_type=2&price_filter_num_nights=4&channel=EXPLORE';

export const AirbnbTab: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Box bg="neutral.light" borderWidth="1px" borderColor="primary.soft" p={[8, 10]}>
      <VStack spacing={6} textAlign="center">
        <Image src={airbnbLogo} alt="Airbnb" w="48px" h="48px" borderRadius="md" />
        <Heading as="h3" fontFamily="heading" fontSize="xl" fontWeight="400" color="primary.deep">
          {t('travel.airbnbTitle')}
        </Heading>
        <Text fontSize="sm" color="neutral.muted" maxW="450px">
          {t('travel.airbnbDescription')}
        </Text>
        <Button
          as="a"
          href={AIRBNB_SEARCH_URL}
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
          {t('travel.searchAirbnb')}
        </Button>
      </VStack>
    </Box>
  );
};
