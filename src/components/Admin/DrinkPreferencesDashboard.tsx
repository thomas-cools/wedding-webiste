import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Flex,
  Heading,
  Progress,
  SimpleGrid,
  Skeleton,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
  Wrap,
  WrapItem,
  Tag,
} from '@chakra-ui/react'
import { type UseAdminRsvpsReturn, type AdminDrinkPrefs } from './useAdminRsvps'

const WINE_LABELS: Record<string, string> = {
  white: 'White wine',
  red: 'Red wine',
  sparkling: 'Sparkling / Prosecco',
  rose: 'Rosé',
  skip: 'Skip wine',
}

const BEER_LABELS: Record<string, string> = {
  light_crisp: 'Light & Crisp',
  belgian_blonde: 'Belgian Blonde',
  no_beer: 'No Beer',
}

const COCKTAIL_LABELS: Record<string, string> = {
  agave: 'Tequila / Mezcal',
  aperitivo: 'Aperol Spritz / Hugo',
  classic_mixers: 'Gin & Tonic / Vodka Soda',
  whiskey: 'Whiskey-based',
  beer_wine_only: 'Beer & Wine only',
}

const NON_ALCOHOLIC_LABELS: Record<string, string> = {
  af_wine: 'AF Wine',
  af_beer: 'AF Beer',
  mocktails: 'Mocktails',
  sparkling_water: 'Sparkling Water',
}

function countOptions(
  allPrefs: AdminDrinkPrefs[],
  field: 'wine' | 'beer' | 'cocktail' | 'nonAlcoholic'
): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const pref of allPrefs) {
    for (const opt of pref[field]) {
      counts[opt] = (counts[opt] || 0) + 1
    }
  }
  return counts
}

function PreferenceBar({
  label,
  count,
  total,
  colorScheme,
}: {
  label: string
  count: number
  total: number
  colorScheme: string
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <Box>
      <Flex justify="space-between" mb={1} fontSize="sm">
        <Text fontWeight="medium">{label}</Text>
        <Text color="gray.500">
          {count}{' '}
          <Text as="span" color="gray.400">
            ({pct}%)
          </Text>
        </Text>
      </Flex>
      <Progress value={pct} colorScheme={colorScheme} size="sm" borderRadius="full" />
    </Box>
  )
}

function CategoryCard({
  title,
  labels,
  counts,
  total,
  colorScheme,
}: {
  title: string
  labels: Record<string, string>
  counts: Record<string, number>
  total: number
  colorScheme: string
}) {
  const sorted = Object.entries(labels).sort(
    ([a], [b]) => (counts[b] || 0) - (counts[a] || 0)
  )
  return (
    <Box
      bg="white"
      rounded="xl"
      shadow="sm"
      border="1px solid"
      borderColor="gray.100"
      p={5}
    >
      <Heading size="sm" mb={4} fontFamily="heading" color="secondary.navy">
        {title}
      </Heading>
      <VStack align="stretch" spacing={3}>
        {sorted.map(([key, lbl]) => (
          <PreferenceBar
            key={key}
            label={lbl}
            count={counts[key] || 0}
            total={total}
            colorScheme={colorScheme}
          />
        ))}
      </VStack>
    </Box>
  )
}

export function DrinkPreferencesDashboard({ adminData }: { adminData: UseAdminRsvpsReturn }) {
  const { drinkPrefsMap, isLoading, stats } = adminData

  const allPrefs: AdminDrinkPrefs[] = []
  for (const prefs of drinkPrefsMap.values()) {
    allPrefs.push(...prefs)
  }

  const totalRespondents = drinkPrefsMap.size
  const totalGuests = allPrefs.length
  const confirmedRsvps = (stats?.definitely ?? 0) + (stats?.highlyLikely ?? 0)

  const wineCounts = countOptions(allPrefs, 'wine')
  const beerCounts = countOptions(allPrefs, 'beer')
  const cocktailCounts = countOptions(allPrefs, 'cocktail')
  const nonAlcoholicCounts = countOptions(allPrefs, 'nonAlcoholic')

  const goToDrinks = allPrefs.map((p) => p.favoriteCocktail).filter(Boolean)
  const comments = allPrefs.filter((p) => p.comments)

  if (isLoading) {
    return (
      <VStack spacing={4} align="stretch">
        <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} height="100px" rounded="xl" />
          ))}
        </SimpleGrid>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} height="200px" rounded="xl" />
          ))}
        </SimpleGrid>
      </VStack>
    )
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Stats */}
      <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
        <Box
          bg="white"
          rounded="xl"
          shadow="sm"
          border="1px solid"
          borderColor="gray.100"
          p={5}
        >
          <Stat>
            <StatLabel color="gray.500">Respondents</StatLabel>
            <StatNumber fontSize="3xl">{totalRespondents}</StatNumber>
            <StatHelpText>Unique households</StatHelpText>
          </Stat>
        </Box>
        <Box
          bg="white"
          rounded="xl"
          shadow="sm"
          border="1px solid"
          borderColor="gray.100"
          p={5}
        >
          <Stat>
            <StatLabel color="gray.500">Total Guests</StatLabel>
            <StatNumber fontSize="3xl">{totalGuests}</StatNumber>
            <StatHelpText>Individual submissions</StatHelpText>
          </Stat>
        </Box>
        <Box
          bg="white"
          rounded="xl"
          shadow="sm"
          border="1px solid"
          borderColor="gray.100"
          p={5}
        >
          <Stat>
            <StatLabel color="gray.500">Response Rate</StatLabel>
            <StatNumber fontSize="3xl">
              {confirmedRsvps > 0
                ? `${Math.round((totalRespondents / confirmedRsvps) * 100)}%`
                : '—'}
            </StatNumber>
            <StatHelpText>vs. confirmed RSVPs</StatHelpText>
          </Stat>
        </Box>
      </SimpleGrid>

      {/* Preference breakdowns */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <CategoryCard
          title="Wine Preferences"
          labels={WINE_LABELS}
          counts={wineCounts}
          total={totalGuests}
          colorScheme="purple"
        />
        <CategoryCard
          title="Beer Preferences"
          labels={BEER_LABELS}
          counts={beerCounts}
          total={totalGuests}
          colorScheme="yellow"
        />
        <CategoryCard
          title="Cocktail Preferences"
          labels={COCKTAIL_LABELS}
          counts={cocktailCounts}
          total={totalGuests}
          colorScheme="orange"
        />
        <CategoryCard
          title="Alcohol-Free Options"
          labels={NON_ALCOHOLIC_LABELS}
          counts={nonAlcoholicCounts}
          total={totalGuests}
          colorScheme="teal"
        />
      </SimpleGrid>

      {/* Go-to drinks */}
      {goToDrinks.length > 0 && (
        <Box
          bg="white"
          rounded="xl"
          shadow="sm"
          border="1px solid"
          borderColor="gray.100"
          p={5}
        >
          <Heading size="sm" mb={3} fontFamily="heading" color="secondary.navy">
            Go-to Drinks ({goToDrinks.length})
          </Heading>
          <Wrap spacing={2}>
            {goToDrinks.map((drink, i) => (
              <WrapItem key={i}>
                <Tag size="md" colorScheme="pink" borderRadius="full">
                  {drink}
                </Tag>
              </WrapItem>
            ))}
          </Wrap>
        </Box>
      )}

      {/* Comments */}
      {comments.length > 0 && (
        <Box
          bg="white"
          rounded="xl"
          shadow="sm"
          border="1px solid"
          borderColor="gray.100"
          p={5}
        >
          <Heading size="sm" mb={3} fontFamily="heading" color="secondary.navy">
            Comments ({comments.length})
          </Heading>
          <VStack align="stretch" spacing={3}>
            {comments.map((p) => (
              <Box key={p.id} bg="gray.50" p={3} rounded="lg" fontSize="sm">
                <Text fontWeight="medium" color="secondary.navy">
                  {p.guestName || p.firstName}
                </Text>
                <Text color="gray.600" mt={1}>
                  {p.comments}
                </Text>
              </Box>
            ))}
          </VStack>
        </Box>
      )}

      {/* Per-guest table */}
      <Box
        bg="white"
        rounded="xl"
        shadow="sm"
        border="1px solid"
        borderColor="gray.100"
        overflow="hidden"
      >
        <Box p={5} borderBottom="1px solid" borderColor="gray.100">
          <Heading size="sm" fontFamily="heading" color="secondary.navy">
            All Guest Submissions ({allPrefs.length})
          </Heading>
        </Box>
        {allPrefs.length === 0 ? (
          <Alert status="info" m={4} rounded="md">
            <AlertIcon />
            No drink preference submissions yet.
          </Alert>
        ) : (
          <Box overflowX="auto">
            <Table size="sm" variant="simple">
              <Thead bg="gray.50">
                <Tr>
                  <Th>Guest</Th>
                  <Th>Email</Th>
                  <Th>Wine</Th>
                  <Th>Beer</Th>
                  <Th>Cocktail</Th>
                  <Th>Non-Alcoholic</Th>
                  <Th>Go-to Drink</Th>
                </Tr>
              </Thead>
              <Tbody>
                {allPrefs.map((p) => (
                  <Tr key={p.id} _hover={{ bg: 'gray.50' }}>
                    <Td fontWeight="medium" whiteSpace="nowrap">
                      {p.guestName || p.firstName}
                    </Td>
                    <Td color="gray.500" fontSize="xs">
                      {p.email}
                    </Td>
                    <Td>
                      <Wrap spacing={1}>
                        {p.wine.map((w) => (
                          <WrapItem key={w}>
                            <Badge colorScheme="purple" fontSize="xs">
                              {WINE_LABELS[w] ?? w}
                            </Badge>
                          </WrapItem>
                        ))}
                      </Wrap>
                    </Td>
                    <Td>
                      <Wrap spacing={1}>
                        {p.beer.map((b) => (
                          <WrapItem key={b}>
                            <Badge colorScheme="yellow" fontSize="xs">
                              {BEER_LABELS[b] ?? b}
                            </Badge>
                          </WrapItem>
                        ))}
                      </Wrap>
                    </Td>
                    <Td>
                      <Wrap spacing={1}>
                        {p.cocktail.map((c) => (
                          <WrapItem key={c}>
                            <Badge colorScheme="orange" fontSize="xs">
                              {COCKTAIL_LABELS[c] ?? c}
                            </Badge>
                          </WrapItem>
                        ))}
                      </Wrap>
                    </Td>
                    <Td>
                      <Wrap spacing={1}>
                        {p.nonAlcoholic.map((n) => (
                          <WrapItem key={n}>
                            <Badge colorScheme="teal" fontSize="xs">
                              {NON_ALCOHOLIC_LABELS[n] ?? n}
                            </Badge>
                          </WrapItem>
                        ))}
                      </Wrap>
                    </Td>
                    <Td fontSize="xs" color="gray.600">
                      {p.favoriteCocktail || '—'}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}
      </Box>
    </VStack>
  )
}
