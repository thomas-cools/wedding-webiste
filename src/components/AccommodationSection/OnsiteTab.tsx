import React from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { Box, VStack, Heading, Text, Image, Link } from '@chakra-ui/react';
import venueRoomsImg from '../../assets/venue_rooms.webp';

interface OnsiteTabProps {
  onOpenModal: () => void;
}

export const OnsiteTab: React.FC<OnsiteTabProps> = ({ onOpenModal }) => {
  const { t } = useTranslation();

  return (
    <Box bg="neutral.light" borderWidth="1px" borderColor="primary.soft" p={[8, 10]}>
      <VStack spacing={6} textAlign="center">
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
            d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" 
          />
        </Box>
        <Heading as="h3" fontFamily="heading" fontSize="xl" fontWeight="400" color="primary.deep">
          {t('travel.onsiteTitle')}
        </Heading>
        <Text fontSize="sm" color="neutral.muted" maxW="550px">
          {t('travel.onsiteDescription')}
        </Text>
        <Text fontSize="sm" color="neutral.muted" maxW="550px">
          <Trans 
            i18nKey="travel.onsiteDetails"
            components={{
              emailLink: (
                <Link 
                  href="mailto:rsvp@carolinaandthomas.com" 
                  color="primary.deep" 
                  fontWeight="500" 
                  _hover={{ textDecoration: 'underline' }} 
                />
              )
            }}
          />
        </Text>
        {/* Room Plan Image */}
        <Box 
          w="full" 
          maxW="700px" 
          cursor="pointer" 
          onClick={onOpenModal}
          borderRadius="md"
          overflow="hidden"
          border="1px solid"
          borderColor="primary.soft"
          transition="all 0.3s ease"
          _hover={{ transform: "scale(1.02)", boxShadow: "lg" }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpenModal();
            }
          }}
          aria-label={t('travel.clickToEnlarge')}
        >
          <Image 
            src={venueRoomsImg} 
            alt={t('travel.viewFloorplan')}
            w="full"
            h="auto"
            objectFit="contain"
          />
        </Box>
        <Text fontSize="xs" color="neutral.muted" fontStyle="italic">
          {t('travel.clickToEnlarge')}
        </Text>
      </VStack>
    </Box>
  );
};
