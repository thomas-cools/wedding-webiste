import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Box, 
  VStack, 
  Tabs, 
  TabList, 
  TabPanels, 
  Tab, 
  TabPanel, 
  Heading, 
  Text,
  useDisclosure
} from '@chakra-ui/react';
import { OnsiteTab } from './OnsiteTab';
import { AirbnbTab } from './AirbnbTab';
import { BookingTab } from './BookingTab';
import { HotelsTab } from './HotelsTab';
import { RoomPlanModal } from './RoomPlanModal';

interface AccommodationSectionProps {
  enabled: boolean;
}

export const AccommodationSection: React.FC<AccommodationSectionProps> = ({ enabled }) => {
  const { t } = useTranslation();
  const { isOpen, onOpen, onClose } = useDisclosure();

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
            maxW="700px"
            lineHeight="tall"
          >
            {t('travel.subtitle')}
          </Text>
          <Text 
            fontSize="sm" 
            color="primary.deep" 
            maxW="650px"
            lineHeight="tall"
            fontWeight="500"
            fontStyle="italic"
          >
            {t('travel.transportNote')}
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
              <Tab _selected={{ bg: 'neutral.dark', color: 'white' }}>
                {t('travel.tabs.onsite')}
              </Tab>
              <Tab _selected={{ bg: 'neutral.dark', color: 'white' }}>
                {t('travel.tabs.airbnb')}
              </Tab>
              <Tab _selected={{ bg: 'neutral.dark', color: 'white' }}>
                {t('travel.tabs.booking')}
              </Tab>
              <Tab _selected={{ bg: 'neutral.dark', color: 'white' }}>
                {t('travel.tabs.hotels')}
              </Tab>
            </TabList>
            <TabPanels>
              <TabPanel p={0}>
                <OnsiteTab onOpenModal={onOpen} />
              </TabPanel>
              <TabPanel p={0}>
                <AirbnbTab />
              </TabPanel>
              <TabPanel p={0}>
                <BookingTab />
              </TabPanel>
              <TabPanel p={0}>
                <HotelsTab />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </VStack>

      {/* Fullscreen Room Plan Modal */}
      <RoomPlanModal isOpen={isOpen} onClose={onClose} />
    </Box>
  );
};
