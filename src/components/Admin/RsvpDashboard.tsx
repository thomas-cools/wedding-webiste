import { useState } from 'react'
import {
  Box,
  Button,
  Checkbox,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  SimpleGrid,
  Skeleton,
  Stat,
  StatLabel,
  StatNumber,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Text,
  Tooltip,
  useDisclosure,
  Alert,
  AlertIcon,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  WrapItem,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react'
import { WarningIcon, DownloadIcon, ChevronDownIcon } from '@chakra-ui/icons'
import { type AdminRsvp, type UseAdminRsvpsReturn, type SortColumn } from './useAdminRsvps'
import { RsvpDetailModal } from './RsvpDetailModal'

const likelihoodColors: Record<string, string> = {
  definitely: 'green',
  highly_likely: 'teal',
  maybe: 'yellow',
  no: 'red',
}

const likelihoodLabels: Record<string, string> = {
  definitely: 'Definitely',
  highly_likely: 'Highly Likely',
  maybe: 'Maybe',
  no: 'No',
}

const FILTER_OPTIONS = [
  { value: 'definitely', label: 'Definitely' },
  { value: 'highly_likely', label: 'Highly Likely' },
  { value: 'maybe', label: 'Maybe' },
  { value: 'no', label: 'Declined' },
]

export function RsvpDashboard({ adminData }: { adminData: UseAdminRsvpsReturn }) {
  const {
    rsvps,
    stats,
    isLoading,
    error,
    refetch,
    search,
    setSearch,
    likelihoodFilters,
    toggleLikelihoodFilter,
    clearLikelihoodFilters,
    filteredRsvps,
    sortColumn,
    sortDirection,
    setSort,
    selectedIds,
    toggleSelected,
    selectAll,
    clearSelection,
    setGuestLocale,
    getEffectiveLocale,
    drinkPrefsMap,
    emailOpensMap,
    exportRsvpsCsv,
    exportRsvpsMarkdown,
    updateRsvpGuests,
    updateRsvpEmail,
  } = adminData

  const selectedRsvps = filteredRsvps.filter((r) => selectedIds.has(r.id))

  const SortIndicator = ({ column }: { column: SortColumn }) => (
    <Text as="span" ml={1} fontSize="xs" color={sortColumn === column ? 'blue.500' : 'gray.400'}>
      {sortColumn === column ? (sortDirection === 'asc' ? '▲' : '▼') : '⇅'}
    </Text>
  )

  const sortableThProps = (column: SortColumn) => ({
    cursor: 'pointer' as const,
    onClick: () => setSort(column),
    _hover: { color: 'blue.600' },
    userSelect: 'none' as const,
  })

  const [selectedRsvpId, setSelectedRsvpId] = useState<string | null>(null)
  const { isOpen, onOpen, onClose } = useDisclosure()
  // Re-derived from the live `rsvps` list (not a snapshot) so edits made in
  // the detail modal are reflected immediately after the post-save refetch.
  const selectedRsvp = rsvps.find((r) => r.id === selectedRsvpId) ?? null

  const handleRowClick = (rsvp: AdminRsvp) => {
    setSelectedRsvpId(rsvp.id)
    onOpen()
  }

  if (error) {
    return (
      <Alert status="error" rounded="xl">
        <AlertIcon />
        <Box>
          <Text fontWeight="bold">Failed to load RSVPs</Text>
          <Text fontSize="sm">{error}</Text>
        </Box>
        <Button ml="auto" size="sm" onClick={refetch}>
          Retry
        </Button>
      </Alert>
    )
  }

  return (
    <Box>
      {/* Stats Cards */}
      <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} spacing={4} mb={4}>
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} h="80px" rounded="xl" />
          ))
        ) : (
          <>
            <StatCard label="Total RSVPs" value={stats?.total ?? 0} bg="white" />
            <StatCard
              label="Definitely"
              value={stats?.definitely ?? 0}
              bg="green.50"
              color="green.700"
            />
            <StatCard
              label="Highly Likely"
              value={stats?.highlyLikely ?? 0}
              bg="teal.50"
              color="teal.700"
            />
            <StatCard
              label="Maybe"
              value={stats?.maybe ?? 0}
              bg="yellow.50"
              color="yellow.700"
            />
            <StatCard
              label="Declined"
              value={stats?.declined ?? 0}
              bg="red.50"
              color="red.700"
            />
            <StatCard
              label="Total Attendees"
              value={stats?.totalAttendees ?? 0}
              bg="blue.50"
              color="blue.700"
            />
          </>
        )}
      </SimpleGrid>

      {/* Per-event headcounts & duplicate warnings */}
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={6}>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} h="80px" rounded="xl" />
          ))
        ) : (
          <>
            <StatCard
              label="Attending Tue Welcome Dinner"
              value={stats?.attendingWelcome ?? 0}
              bg="purple.50"
              color="purple.700"
            />
            <StatCard
              label="Attending Wed Ceremony"
              value={stats?.attendingCeremony ?? 0}
              bg="blue.50"
              color="blue.700"
            />
            <StatCard
              label="Attending Thu Brunch"
              value={stats?.attendingBrunch ?? 0}
              bg="orange.50"
              color="orange.700"
            />
            <StatCard
              label="Possible Duplicates"
              value={stats?.possibleDuplicates ?? 0}
              bg={(stats?.possibleDuplicates ?? 0) > 0 ? 'red.50' : 'gray.50'}
              color={(stats?.possibleDuplicates ?? 0) > 0 ? 'red.700' : 'gray.500'}
            />
          </>
        )}
      </SimpleGrid>

      {/* Search & Filters */}
      <Flex
        bg="white"
        rounded="xl"
        p={4}
        mb={4}
        shadow="sm"
        border="1px solid"
        borderColor="gray.100"
        gap={4}
        direction={{ base: 'column', md: 'row' }}
        align={{ base: 'stretch', md: 'center' }}
      >
        <InputGroup maxW={{ md: '320px' }}>
          <InputLeftElement pointerEvents="none" color="gray.400">
            🔍
          </InputLeftElement>
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            focusBorderColor="primary.deep"
          />
        </InputGroup>

        <Wrap spacing={2} flex={1}>
          {FILTER_OPTIONS.map((opt) => (
            <WrapItem key={opt.value}>
              <Tag
                size="md"
                variant={likelihoodFilters.has(opt.value) ? 'solid' : 'outline'}
                colorScheme={likelihoodColors[opt.value]}
                cursor="pointer"
                onClick={() => toggleLikelihoodFilter(opt.value)}
              >
                <TagLabel>{opt.label}</TagLabel>
                {likelihoodFilters.has(opt.value) && (
                  <TagCloseButton
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleLikelihoodFilter(opt.value)
                    }}
                  />
                )}
              </Tag>
            </WrapItem>
          ))}
          {likelihoodFilters.size > 1 && (
            <WrapItem>
              <Tag
                size="md"
                variant="ghost"
                cursor="pointer"
                onClick={clearLikelihoodFilters}
                color="gray.500"
                _hover={{ color: 'gray.700' }}
              >
                <TagLabel>Clear all</TagLabel>
              </Tag>
            </WrapItem>
          )}
        </Wrap>

        <HStack ml="auto">
          <Text fontSize="sm" color="gray.500" whiteSpace="nowrap">
            {filteredRsvps.length} result{filteredRsvps.length !== 1 ? 's' : ''}
          </Text>
          <Menu>
            <MenuButton
              as={Button}
              size="sm"
              leftIcon={<DownloadIcon />}
              rightIcon={<ChevronDownIcon />}
              colorScheme="blue"
              isDisabled={filteredRsvps.length === 0}
            >
              Export
            </MenuButton>
            <MenuList>
              <MenuItem onClick={exportRsvpsCsv}>Export as CSV</MenuItem>
              <MenuItem onClick={exportRsvpsMarkdown}>Export as Markdown</MenuItem>
            </MenuList>
          </Menu>
          <IconButton
            aria-label="Refresh"
            icon={<Text>↻</Text>}
            size="sm"
            variant="ghost"
            onClick={refetch}
          />
        </HStack>
      </Flex>

      {/* Selection Bar */}
      {selectedIds.size > 0 && (
        <Box
          bg="secondary.navy"
          color="white"
          rounded="xl"
          p={3}
          mb={4}
        >
          <Flex align="center" justify="space-between" mb={selectedRsvps.length > 0 ? 2 : 0}>
            <Text fontSize="sm" fontWeight="medium">
              {selectedIds.size} selected
            </Text>
            <Button
              size="sm"
              variant="outline"
              color="white"
              borderColor="whiteAlpha.400"
              _hover={{ bg: 'whiteAlpha.100' }}
              onClick={clearSelection}
            >
              Clear
            </Button>
          </Flex>
          {selectedRsvps.length > 0 && (
            <Box maxH="80px" overflowY="auto" px={1}>
              <Wrap spacing={1}>
                {selectedRsvps.map((r) => (
                  <WrapItem key={r.id}>
                    <Tag size="sm" colorScheme="whiteAlpha" variant="subtle">
                      <TagLabel fontSize="xs">{r.firstName} &lt;{r.email}&gt;</TagLabel>
                    </Tag>
                  </WrapItem>
                ))}
              </Wrap>
            </Box>
          )}
        </Box>
      )}

      {/* RSVP Table */}
      <Box
        bg="white"
        rounded="xl"
        shadow="sm"
        border="1px solid"
        borderColor="gray.100"
        overflowX="auto"
      >
        {isLoading ? (
          <Box p={6}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} h="40px" mb={2} rounded="md" />
            ))}
          </Box>
        ) : filteredRsvps.length === 0 ? (
          <Box p={8} textAlign="center">
            <Text color="gray.500">
              {search || likelihoodFilters.size > 0
                ? 'No RSVPs match your filters'
                : 'No RSVPs yet'}
            </Text>
          </Box>
        ) : (
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th w="40px">
                  <Checkbox
                    isChecked={
                      filteredRsvps.length > 0 &&
                      filteredRsvps.every((r) => selectedIds.has(r.id))
                    }
                    isIndeterminate={
                      selectedIds.size > 0 &&
                      !filteredRsvps.every((r) => selectedIds.has(r.id))
                    }
                    onChange={(e) =>
                      e.target.checked ? selectAll() : clearSelection()
                    }
                  />
                </Th>
                <Th {...sortableThProps('name')}>Name<SortIndicator column="name" /></Th>
                <Th {...sortableThProps('email')}>Email<SortIndicator column="email" /></Th>
                <Th {...sortableThProps('likelihood')}>Likelihood<SortIndicator column="likelihood" /></Th>
                <Th isNumeric {...sortableThProps('partySize')}>Party Size<SortIndicator column="partySize" /></Th>
                <Th>Events</Th>
                <Th>Drinks</Th>
                <Th>Opens</Th>
                <Th>Locale</Th>
                <Th {...sortableThProps('date')}>Date<SortIndicator column="date" /></Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredRsvps.map((rsvp) => (
                <Tr
                  key={rsvp.id}
                  _hover={{ bg: 'gray.50' }}
                  cursor="pointer"
                  onClick={() => handleRowClick(rsvp)}
                >
                  <Td onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      isChecked={selectedIds.has(rsvp.id)}
                      onChange={() => toggleSelected(rsvp.id)}
                    />
                  </Td>
                  <Td fontWeight="medium">{rsvp.firstName}</Td>
                  <Td fontSize="xs" color="gray.600">
                    <HStack spacing={1}>
                      <Text fontSize="xs">{rsvp.email}</Text>
                      {rsvp.emailCorrectedAt && (
                        <Tooltip label={`Corrected ${new Date(rsvp.emailCorrectedAt).toLocaleString()}`}>
                          <Badge colorScheme="purple" fontSize="2xs">Corrected</Badge>
                        </Tooltip>
                      )}
                    </HStack>
                  </Td>
                  <Td>
                    <Badge
                      colorScheme={likelihoodColors[rsvp.likelihood] || 'gray'}
                      variant="subtle"
                      fontSize="xs"
                    >
                      {likelihoodLabels[rsvp.likelihood] || rsvp.likelihood}
                    </Badge>
                  </Td>
                  <Td isNumeric>
                    <HStack spacing={1} justify="flex-end">
                      <Text>{1 + rsvp.guests.filter((g) => !g.isDuplicate).length}</Text>
                      {rsvp.guestsManuallyEditedAt && (
                        <Tooltip label={`Manually edited ${new Date(rsvp.guestsManuallyEditedAt).toLocaleString()}`}>
                          <Badge colorScheme="purple" fontSize="2xs">Edited</Badge>
                        </Tooltip>
                      )}
                      {(rsvp.guests.some((g) => g.isDuplicate) || (rsvp.matchedAsGuestIn?.length ?? 0) > 0) && (
                        <Tooltip
                          label={
                            rsvp.guests.some((g) => g.isDuplicate)
                              ? `Possible duplicate: ${rsvp.guests
                                  .filter((g) => g.isDuplicate)
                                  .map((g) => `${g.name} (${g.duplicateOfEmail})`)
                                  .join(', ')} may have submitted their own RSVP separately`
                              : `${rsvp.firstName} may already be listed as a guest in another RSVP`
                          }
                        >
                          <WarningIcon color="red.500" boxSize={3} />
                        </Tooltip>
                      )}
                    </HStack>
                  </Td>
                  <Td>
                    <HStack spacing={1}>
                      {rsvp.events?.welcome === 'yes' && (
                        <Badge colorScheme="purple" variant="outline" fontSize="2xs">
                          Tue
                        </Badge>
                      )}
                      {rsvp.events?.ceremony === 'yes' && (
                        <Badge colorScheme="blue" variant="outline" fontSize="2xs">
                          Wed
                        </Badge>
                      )}
                      {rsvp.events?.brunch === 'yes' && (
                        <Badge colorScheme="orange" variant="outline" fontSize="2xs">
                          Thu
                        </Badge>
                      )}
                    </HStack>
                  </Td>
                  <Td>
                    {(drinkPrefsMap.get(rsvp.email.toLowerCase())?.length ?? 0) > 0 ? (
                      <Badge colorScheme="purple" variant="subtle" fontSize="2xs">
                        ✓
                      </Badge>
                    ) : (
                      <Text fontSize="xs" color="gray.400">—</Text>
                    )}
                  </Td>
                  <Td>
                    {(() => {
                      const opens = emailOpensMap.get(rsvp.email)
                      if (!opens || opens.length === 0) {
                        return <Text fontSize="xs" color="gray.400">—</Text>
                      }
                      return (
                        <Badge colorScheme="blue" variant="subtle" fontSize="2xs">
                          {opens.length}
                        </Badge>
                      )
                    })()}
                  </Td>
                  <Td onClick={(e) => e.stopPropagation()}>
                    <Select
                      size="xs"
                      w="80px"
                      value={getEffectiveLocale(rsvp)}
                      onChange={(e) => setGuestLocale(rsvp.id, e.target.value)}
                    >
                      <option value="en">EN</option>
                      <option value="es">ES</option>
                      <option value="nl">NL</option>
                    </Select>
                  </Td>
                  <Td fontSize="xs" color="gray.500">
                    {new Date(rsvp.submittedAt).toLocaleDateString()}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Box>

      <RsvpDetailModal
        rsvp={selectedRsvp}
        isOpen={isOpen}
        onClose={onClose}
        drinkPrefs={selectedRsvp ? drinkPrefsMap.get(selectedRsvp.email.toLowerCase()) : undefined}
        emailOpens={selectedRsvp ? emailOpensMap.get(selectedRsvp.email) : undefined}
        onGuestsUpdated={updateRsvpGuests}
        onEmailUpdated={updateRsvpEmail}
      />
    </Box>
  )
}

function StatCard({
  label,
  value,
  bg = 'white',
  color,
}: {
  label: string
  value: number
  bg?: string
  color?: string
}) {
  return (
    <Stat
      bg={bg}
      rounded="xl"
      p={4}
      shadow="sm"
      border="1px solid"
      borderColor="gray.100"
    >
      <StatLabel fontSize="xs" color="gray.500">
        {label}
      </StatLabel>
      <StatNumber fontSize="2xl" color={color || 'secondary.navy'}>
        {value}
      </StatNumber>
    </Stat>
  )
}
