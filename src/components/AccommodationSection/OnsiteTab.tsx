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
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon
} from '@chakra-ui/react';

interface RoomInfo {
  name: string;
  subtitle?: string;
  price: string;
  beds: string[];
  amenities: string;
  note?: string;
}

interface BuildingSection {
  title: string;
  description: string;
  rooms: RoomInfo[];
}

const RoomCard: React.FC<{ room: RoomInfo }> = ({ room }) => (
  <Box py={4}>
    <HStack 
      justify="space-between" 
      align="flex-start" 
      flexDir={["column", "row"]} 
      gap={[2, 4]}
      w="100%"
    >
      <Text 
        fontSize={["xs", "sm"]} 
        fontWeight="600" 
        color="primary.deep" 
        minW={["auto", "80px"]}
        textAlign={["center", "left"]}
      >
        {room.price}
      </Text>
      <Box flex="1" textAlign={["center", "left"]}>
        <Text fontWeight="600" fontSize={["sm", "md"]} color="neutral.dark">
          {room.name}
        </Text>
        {room.subtitle && (
          <Text fontSize="xs" color="primary.deep" fontWeight="500">
            {room.subtitle}
          </Text>
        )}
        {room.beds.map((bed, idx) => (
          <Text key={idx} fontSize="xs" color="neutral.muted">
            {bed}
          </Text>
        ))}
        <Text fontSize="xs" color="neutral.muted" fontStyle="italic" mt={1}>
          {room.amenities}
        </Text>
        {room.note && (
          <Text fontSize="xs" color="neutral.muted" fontStyle="italic">
            {room.note}
          </Text>
        )}
      </Box>
    </HStack>
  </Box>
);

const BuildingAccordion: React.FC<{ section: BuildingSection; defaultOpen?: boolean }> = ({ section, defaultOpen = false }) => (
  <AccordionItem border="none" mb={4}>
    <AccordionButton 
      px={4} 
      py={4}
      bg="white"
      borderWidth="1px"
      borderColor="primary.soft"
      borderRadius="md"
      _hover={{ bg: 'primary.soft' }}
      _expanded={{ 
        bg: 'white',
        borderBottomRadius: 0,
        borderBottomWidth: 0
      }}
    >
      <Box flex="1" textAlign="left">
        <Heading 
          as="h4" 
          fontFamily="heading" 
          fontSize={["md", "lg"]} 
          fontWeight="500" 
          color="neutral.dark"
        >
          {section.title}
        </Heading>
        <Text fontSize="xs" color="neutral.muted" mt={1}>
          {section.description}
        </Text>
      </Box>
      <AccordionIcon color="primary.deep" />
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
      >
        <Text fontSize="xs" fontWeight="600" color="neutral.muted" textTransform="uppercase" letterSpacing="wide">
          Price
        </Text>
        <Text fontSize="xs" fontWeight="600" color="neutral.muted" textTransform="uppercase" letterSpacing="wide" flex="1" pl={4}>
          Room Details
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

export const OnsiteTab: React.FC = () => {
  const { t } = useTranslation();

  const mainBuilding: BuildingSection = {
    title: "Main building",
    description: "1 kitchen, 6 bedrooms, 6 bathrooms (20 persons)",
    rooms: [
      {
        name: "Bedroom India (2 persons / 1st floor)",
        price: "€90 / night",
        beds: [
          "1 double bed (180x200)",
          "OR 2 single beds (90x200)"
        ],
        amenities: "*Private bathroom, shower, sink, WC"
      },
      {
        name: "Pyrenees' Bedroom",
        subtitle: "(4 persons (2 in the room, 2 in the antechamber))",
        price: "€70 / night",
        beds: [
          "1 double bed (180x200)",
          "Antechamber AND 2 single beds (90x200)"
        ],
        amenities: "*Private bathroom, shower, sink, WC"
      },
      {
        name: "Bedroom Provence (2 persons / 1st floor)",
        price: "€70 / night",
        beds: [
          "1 double bed (180x200)",
          "OR 2 single beds (90x200)"
        ],
        amenities: "*Private bathroom, shower, sink, WC"
      },
      {
        name: "Bedroom Occitanie (2 persons / 1st floor)",
        price: "€70 / night",
        beds: [
          "1 double bed (160x200)"
        ],
        amenities: "Private bathroom, shower, sink, WC"
      },
      {
        name: "Lauragais' Dormitory (8 persons / 1st floor)",
        price: "€70 / night",
        beds: [
          "4 beds (90x200) in the same bedroom",
          "(splitted by curtains)"
        ],
        amenities: "*2 Shared bathroom, shower, sink, WC (to confirm)"
      }
    ]
  };

  const annex: BuildingSection = {
    title: "Annex",
    description: "1 kitchen, 4 bedrooms, 4 bathrooms (14 persons)",
    rooms: [
      {
        name: "Rez de Chaussée (Room 1 / 1st floor)",
        price: "€TBD / night",
        beds: ["2 beds (160 cm)"],
        amenities: ""
      },
      {
        name: "Rez de Chaussée (Room 2 - family / 1st floor)",
        price: "€TBD / night",
        beds: ["1 bed (160 cm) mezzanine 1 beds (160 cm)"],
        amenities: ""
      },
      {
        name: "1er Etage (Room 3 / 2nd floor)",
        price: "€TBD / night",
        beds: ["2 beds (160 cm)"],
        amenities: ""
      },
      {
        name: "1er Etage (Room 4 / 1st floor)",
        price: "€TBD / night",
        beds: ["1 bed (160 cm)"],
        amenities: ""
      }
    ]
  };

  return (
    <Box bg="neutral.light" borderWidth="1px" borderColor="primary.soft" p={[5, 6, 10]}>
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
                  href="mailto:rsvp@carolinaandthomas.com" 
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
          <Accordion allowMultiple defaultIndex={[0]}>
            <BuildingAccordion section={mainBuilding} />
            <BuildingAccordion section={annex} />
          </Accordion>
        </Box>
      </VStack>
    </Box>
  );
};
