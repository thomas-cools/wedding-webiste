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
  name: string;
  subtitle?: string;
  price: string;
  beds: string[];
  amenities: string;
  note?: string;
  capacity: number;
  bedCount: number;
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
      gap={[3, 8]}
      w="100%"
    >
      {/* Room details - flexible width */}
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
        {room.amenities && (
          <Text fontSize="xs" color="neutral.muted" fontStyle="italic" mt={1}>
            {room.amenities}
          </Text>
        )}
        {room.note && (
          <Text fontSize="xs" color="neutral.muted" fontStyle="italic">
            {room.note}
          </Text>
        )}
      </Box>

      {/* Capacity icons column - fixed width for consistent alignment */}
      <HStack 
        spacing={3} 
        color="neutral.muted" 
        minW={["auto", "70px"]}
        justify={["center", "center"]}
        flexShrink={0}
      >
        <HStack spacing={1} title={`${room.capacity} ${room.capacity === 1 ? 'person' : 'people'}`}>
          <PersonIcon boxSize="14px" />
          <Text fontSize="xs" fontWeight="500">{room.capacity}</Text>
        </HStack>
        <HStack spacing={1} title={`${room.bedCount} ${room.bedCount === 1 ? 'bed' : 'beds'}`}>
          <BedIcon boxSize="16px" />
          <Text fontSize="xs" fontWeight="500">{room.bedCount}</Text>
        </HStack>
      </HStack>

      {/* Price column - fixed width */}
      <Text 
        fontSize={["xs", "sm"]} 
        fontWeight="600" 
        color="primary.deep" 
        minW={["auto", "100px"]}
        textAlign={["center", "right"]}
        flexShrink={0}
      >
        {room.price}
      </Text>
    </HStack>
  </Box>
);

const BuildingAccordion: React.FC<{ section: BuildingSection; defaultOpen?: boolean }> = ({ section, defaultOpen = false }) => (
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
          {section.title}
        </Heading>
        <Text fontSize={["xs", "sm"]} color="whiteAlpha.800" mt={1}>
          {section.description}
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
          Room Details
        </Text>
        <Text fontSize="xs" fontWeight="600" color="neutral.muted" textTransform="uppercase" letterSpacing="wide" minW="70px" textAlign="center">
          Capacity
        </Text>
        <Text fontSize="xs" fontWeight="600" color="neutral.muted" textTransform="uppercase" letterSpacing="wide" minW="100px" textAlign="right">
          Price
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
        name: "Bedroom India",
        subtitle: "(2 persons / 1st floor)",
        price: "€150 / night",
        beds: [
          "1 double bed (180x200)",
          "OR 2 single beds (90x200)"
        ],
        amenities: "*Private bathroom, shower, sink, WC",
        capacity: 2,
        bedCount: 1
      },
      {
        name: "Pyrenees' Bedroom",
        subtitle: "(4 persons (2 in the room, 2 in the antechamber))",
        price: "€260 / night",
        beds: [
          "1 double bed (180x200)",
          "Antechamber AND 2 single beds (90x200)"
        ],
        amenities: "*Private bathroom, shower, sink, WC",
        capacity: 4,
        bedCount: 3
      },
      {
        name: "Bedroom Provence",
        subtitle: "(2 persons / 1st floor)",
        price: "€150 / night",
        beds: [
          "1 double bed (180x200)",
          "OR 2 single beds (90x200)"
        ],
        amenities: "*Private bathroom, shower, sink, WC",
        capacity: 2,
        bedCount: 1
      },
      {
        name: "Bedroom Occitanie",
        subtitle: "(2 persons / 1st floor)",
        price: "€140 / night",
        beds: [
          "1 double bed (160x200)"
        ],
        amenities: "Private bathroom, shower, sink, WC",
        capacity: 2,
        bedCount: 1
      },
      {
        name: "Lauragais' Dormitory",
        subtitle: "(8 persons / 1st floor)",
        price: "€70 / night",
        beds: [
          "4 beds (90x200) in the same bedroom",
          "(splitted by curtains)"
        ],
        amenities: "*2 Shared bathroom, shower, sink, WC (to confirm)",
        capacity: 8,
        bedCount: 4
      }
    ]
  };

  const annex: BuildingSection = {
    title: "Annex",
    description: "1 kitchen, 4 bedrooms, 4 bathrooms (14 persons)",
    rooms: [
      {
        name: "Rez de Chaussée (Room 1)",
        subtitle: "1st floor",
        price: "€275 / night",
        beds: ["2 beds (160 cm)"],
        amenities: "",
        capacity: 4,
        bedCount: 2
      },
      {
        name: "Rez de Chaussée (Room 2 - family)",
        subtitle: "1st floor",
        price: "€275 / night",
        beds: ["1 bed (160 cm) + mezzanine 1 bed (160 cm)"],
        amenities: "",
        capacity: 4,
        bedCount: 2
      },
      {
        name: "1er Etage (Room 3)",
        subtitle: "2nd floor",
        price: "€275 / night",
        beds: ["2 beds (160 cm)"],
        amenities: "",
        capacity: 4,
        bedCount: 2
      },
      {
        name: "1er Etage (Room 4)",
        subtitle: "1st floor",
        price: "€140 / night",
        beds: ["1 bed (160 cm)"],
        amenities: "",
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
      </VStack>
    </Box>
  );
};
