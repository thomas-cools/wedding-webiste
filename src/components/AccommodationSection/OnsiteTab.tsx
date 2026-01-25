import React from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { 
  Box, 
  VStack, 
  Heading, 
  Text, 
  Link, 
  Divider, 
  HStack,
  Flex,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Icon
} from '@chakra-ui/react';

// Person icon component
const PersonIcon: React.FC<{ boxSize?: string | number }> = ({ boxSize = "14px" }) => (
  <Icon viewBox="0 0 24 24" boxSize={boxSize} fill="currentColor">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
  </Icon>
);

// Bed icon component
const BedIcon: React.FC<{ boxSize?: string | number }> = ({ boxSize = "16px" }) => (
  <Icon viewBox="0 0 24 24" boxSize={boxSize} fill="currentColor">
    <path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z"/>
  </Icon>
);

interface RoomInfo {
  nameKey: string;
  subtitleKey?: string;
  price: string;
  bedsKey: string;
  amenitiesKey?: string;
  note?: string;
  capacity: number;
  bedCount: number;
}

interface BuildingSection {
  titleKey: string;
  descriptionKey: string;
  rooms: RoomInfo[];
}

const RoomCard: React.FC<{ room: RoomInfo }> = ({ room }) => {
  const { t } = useTranslation();
  const beds = t(room.bedsKey, { returnObjects: true }) as string[];
  
  return (
    <Box py={4}>
      <Flex 
        direction={["column", "row"]} 
        justify="space-between" 
        align={["stretch", "flex-start"]} 
        gap={[2, 8]}
        w="100%"
      >
        {/* Room details - flexible width */}
        <Box flex="1" textAlign="left">
          <Text fontWeight="600" fontSize={["sm", "md"]} color="neutral.dark">
            {t(room.nameKey)}
          </Text>
          {room.subtitleKey && (
            <Text fontSize="xs" color="primary.deep" fontWeight="500">
              {t(room.subtitleKey)}
            </Text>
          )}
          {Array.isArray(beds) && beds.map((bed, idx) => (
            <Text key={idx} fontSize="xs" color="neutral.muted">
              {bed}
            </Text>
          ))}
          {room.amenitiesKey && (
            <Text fontSize="xs" color="neutral.muted" fontStyle="italic" mt={1}>
              {t(room.amenitiesKey)}
            </Text>
          )}
          {room.note && (
            <Text fontSize="xs" color="neutral.muted" fontStyle="italic">
              {room.note}
            </Text>
          )}
        </Box>

        {/* Info Row (Mobile) / Columns (Desktop) */}
        <Flex 
          direction={["row", "row"]} 
          justify={["space-between", "flex-end"]}
          align={["center", "flex-start"]}
          w={["100%", "auto"]}
          gap={[4, 8]}
          mt={[3, 0]}
        >
          {/* Capacity icons */}
          <HStack 
            spacing={3} 
            color="neutral.muted" 
            minW={["auto", "70px"]}
            justify={["flex-start", "center"]}
            flexShrink={0}
          >
            <HStack spacing={1} title={`${room.capacity} ${room.capacity === 1 ? t('travel.person') : t('travel.people')}`}>
              <PersonIcon boxSize="14px" />
              <Text fontSize="xs" fontWeight="500">{room.capacity}</Text>
            </HStack>
            <HStack spacing={1} title={`${room.bedCount} ${room.bedCount === 1 ? t('travel.bed') : t('travel.beds')}`}>
              <BedIcon boxSize="16px" />
              <Text fontSize="xs" fontWeight="500">{room.bedCount}</Text>
            </HStack>
          </HStack>

          {/* Price */}
          <Text 
            fontSize={["sm", "sm"]} 
            fontWeight="600" 
            color="primary.deep" 
            minW={["auto", "100px"]}
            textAlign="right"
            flexShrink={0}
          >
            {room.price}
          </Text>
        </Flex>
      </Flex>
    </Box>
  );
};

const BuildingAccordion: React.FC<{ section: BuildingSection; defaultOpen?: boolean }> = ({ section, defaultOpen = false }) => {
  const { t } = useTranslation();
  
  return (
    <AccordionItem border="none" mb={4}>
      <AccordionButton 
        px={[4, 5, 6]} 
        py={[4, 5]}
        bg="neutral.dark"
        borderWidth="1px"
        borderColor="neutral.dark"
        borderRadius="md"
        _hover={{ bg: 'neutral.muted' }}
        _expanded={{ 
          bg: 'neutral.dark',
          borderColor: 'neutral.dark',
          borderBottomRadius: 0,
          borderBottomWidth: 0
        }}
      >
        <Box flex="1" textAlign="left">
          <Heading 
            as="h4" 
            fontFamily="heading" 
            fontSize={["lg", "xl", "2xl"]} 
            fontWeight="600" 
            color="white"
            letterSpacing="wide"
          >
            {t(section.titleKey)}
          </Heading>
          <Text fontSize={["xs", "sm"]} color="whiteAlpha.800" mt={1}>
            {t(section.descriptionKey)}
          </Text>
        </Box>
        <AccordionIcon color="white" boxSize={6} />
      </AccordionButton>
      <AccordionPanel 
        pb={4} 
        px={4}
        bg="white"
        borderWidth="1px"
        borderTopWidth={0}
        borderColor="primary.soft"
        borderBottomRadius="md"
      >
        <HStack 
          justify="space-between" 
          py={3} 
          display={["none", "flex"]}
          borderBottom="1px"
          borderColor="primary.soft"
          gap={8}
        >
          <Text fontSize="xs" fontWeight="600" color="neutral.muted" textTransform="uppercase" letterSpacing="wide" flex="1" textAlign="left">
            {t('travel.roomDetails')}
          </Text>
          <Text fontSize="xs" fontWeight="600" color="neutral.muted" textTransform="uppercase" letterSpacing="wide" minW="70px" textAlign="center">
            {t('travel.capacity')}
          </Text>
          <Text fontSize="xs" fontWeight="600" color="neutral.muted" textTransform="uppercase" letterSpacing="wide" minW="100px" textAlign="right">
            {t('travel.price')}
          </Text>
        </HStack>
        <VStack divider={<Divider borderColor="primary.soft" />} spacing={0} align="stretch">
          {section.rooms.map((room, idx) => (
            <RoomCard key={idx} room={room} />
          ))}
        </VStack>
      </AccordionPanel>
    </AccordionItem>
  );
};

export const OnsiteTab: React.FC = () => {
  const { t } = useTranslation();

  const mainBuilding: BuildingSection = {
    titleKey: "travel.mainBuilding.title",
    descriptionKey: "travel.mainBuilding.description",
    rooms: [
      {
        nameKey: "travel.mainBuilding.rooms.india.name",
        subtitleKey: "travel.mainBuilding.rooms.india.subtitle",
        price: `€230 ${t('travel.perNight')}`,
        bedsKey: "travel.mainBuilding.rooms.india.beds",
        amenitiesKey: "travel.mainBuilding.rooms.india.amenities",
        capacity: 2,
        bedCount: 1
      },
      {
        nameKey: "travel.mainBuilding.rooms.pyrenees.name",
        subtitleKey: "travel.mainBuilding.rooms.pyrenees.subtitle",
        price: `€350 ${t('travel.perNight')}`,
        bedsKey: "travel.mainBuilding.rooms.pyrenees.beds",
        amenitiesKey: "travel.mainBuilding.rooms.pyrenees.amenities",
        capacity: 4,
        bedCount: 3
      },
      {
        nameKey: "travel.mainBuilding.rooms.provence.name",
        subtitleKey: "travel.mainBuilding.rooms.provence.subtitle",
        price: `€230 ${t('travel.perNight')}`,
        bedsKey: "travel.mainBuilding.rooms.provence.beds",
        amenitiesKey: "travel.mainBuilding.rooms.provence.amenities",
        capacity: 2,
        bedCount: 1
      },
      {
        nameKey: "travel.mainBuilding.rooms.occitanie.name",
        subtitleKey: "travel.mainBuilding.rooms.occitanie.subtitle",
        price: `€185 ${t('travel.perNight')}`,
        bedsKey: "travel.mainBuilding.rooms.occitanie.beds",
        amenitiesKey: "travel.mainBuilding.rooms.occitanie.amenities",
        capacity: 2,
        bedCount: 1
      },
      {
        nameKey: "travel.mainBuilding.rooms.lauragais.name",
        subtitleKey: "travel.mainBuilding.rooms.lauragais.subtitle",
        price: `€80 ${t('travel.perPersonPerNight')}`,
        bedsKey: "travel.mainBuilding.rooms.lauragais.beds",
        amenitiesKey: "travel.mainBuilding.rooms.lauragais.amenities",
        capacity: 8,
        bedCount: 4
      }
    ]
  };

  const annex: BuildingSection = {
    titleKey: "travel.annex.title",
    descriptionKey: "travel.annex.description",
    rooms: [
      {
        nameKey: "travel.annex.rooms.room1.name",
        subtitleKey: "travel.annex.rooms.room1.subtitle",
        price: `€365 ${t('travel.perNight')}`,
        bedsKey: "travel.annex.rooms.room1.beds",
        capacity: 4,
        bedCount: 2
      },
      {
        nameKey: "travel.annex.rooms.room2.name",
        subtitleKey: "travel.annex.rooms.room2.subtitle",
        price: `€365 ${t('travel.perNight')}`,
        bedsKey: "travel.annex.rooms.room2.beds",
        capacity: 4,
        bedCount: 2
      },
      {
        nameKey: "travel.annex.rooms.room3.name",
        subtitleKey: "travel.annex.rooms.room3.subtitle",
        price: `€365 ${t('travel.perNight')}`,
        bedsKey: "travel.annex.rooms.room3.beds",
        capacity: 4,
        bedCount: 2
      },
      {
        nameKey: "travel.annex.rooms.room4.name",
        subtitleKey: "travel.annex.rooms.room4.subtitle",
        price: `€185 ${t('travel.perNight')}`,
        bedsKey: "travel.annex.rooms.room4.beds",
        capacity: 2,
        bedCount: 1
      }
    ]
  };

  return (
    <Box bg="neutral.light" borderWidth="1px" borderColor="primary.soft" borderRadius="md" p={[5, 6, 10]}>
      <VStack spacing={[4, 5, 6]} textAlign="center">
        <Box 
          as="svg" 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          w={["40px", "44px", "48px"]}
          h={["40px", "44px", "48px"]}
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
              emailLink: (
                <Link 
                  href="mailto:carolinaandthomaswedding@gmail.com" 
                  color="primary.deep" 
                  fontWeight="500" 
                  _hover={{ textDecoration: 'underline' }} 
                />
              )
            }}
          />
        </Text>

        {/* Room Details */}
        <Box w="100%" maxW="600px" mt={4}>
          <Accordion allowMultiple defaultIndex={[]}>
            <BuildingAccordion section={mainBuilding} />
            <BuildingAccordion section={annex} />
          </Accordion>
        </Box>

        <Text fontSize="xs" color="neutral.muted" fontStyle="italic" maxW="550px" mt={4}>
          {t('travel.onsiteDisclaimer')}
        </Text>
      </VStack>
    </Box>
  );
};
