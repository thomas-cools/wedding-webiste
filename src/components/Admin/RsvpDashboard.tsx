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
  useDisclosure,
  Alert,
  AlertIcon,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  WrapItem,
} from '@chakra-ui/react'
import { useAdminRsvps, type AdminRsvp } from './useAdminRsvps'
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

export function RsvpDashboard() {
  const {
    stats,
    isLoading,
    error,
    refetch,
    search,
    setSearch,
    likelihoodFilter,
    setLikelihoodFilter,
    filteredRsvps,
    selectedIds,
    toggleSelected,
    selectAll,
    clearSelection,
  } = useAdminRsvps()

  const [selectedRsvp, setSelectedRsvp] = useState<AdminRsvp | null>(null)
  const { isOpen, onOpen, onClose } = useDisclosure()

  const handleRowClick = (rsvp: AdminRsvp) => {
    setSelectedRsvp(rsvp)
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
      <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} spacing={4} mb={6}>
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
                variant={likelihoodFilter === opt.value ? 'solid' : 'outline'}
                colorScheme={likelihoodColors[opt.value]}
                cursor="pointer"
                onClick={() =>
                  setLikelihoodFilter(
                    likelihoodFilter === opt.value ? '' : opt.value
                  )
                }
              >
                <TagLabel>{opt.label}</TagLabel>
                {likelihoodFilter === opt.value && (
                  <TagCloseButton
                    onClick={(e) => {
                      e.stopPropagation()
                      setLikelihoodFilter('')
                    }}
                  />
                )}
              </Tag>
            </WrapItem>
          ))}
        </Wrap>

        <HStack ml="auto">
          <Text fontSize="sm" color="gray.500" whiteSpace="nowrap">
            {filteredRsvps.length} result{filteredRsvps.length !== 1 ? 's' : ''}
          </Text>
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
        <Flex
          bg="secondary.navy"
          color="white"
          rounded="xl"
          p={3}
          mb={4}
          align="center"
          justify="space-between"
        >
          <Text fontSize="sm">
            {selectedIds.size} selected
          </Text>
          <HStack>
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
          </HStack>
        </Flex>
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
              {search || likelihoodFilter
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
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Likelihood</Th>
                <Th isNumeric>Party Size</Th>
                <Th>Events</Th>
                <Th>Date</Th>
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
                    {rsvp.email}
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
                  <Td isNumeric>{1 + rsvp.guests.length}</Td>
                  <Td>
                    <HStack spacing={1}>
                      {rsvp.events?.welcome === 'yes' && (
                        <Badge colorScheme="purple" variant="outline" fontSize="2xs">
                          Fri
                        </Badge>
                      )}
                      {rsvp.events?.ceremony === 'yes' && (
                        <Badge colorScheme="blue" variant="outline" fontSize="2xs">
                          Sat
                        </Badge>
                      )}
                      {rsvp.events?.brunch === 'yes' && (
                        <Badge colorScheme="orange" variant="outline" fontSize="2xs">
                          Sun
                        </Badge>
                      )}
                    </HStack>
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

      <RsvpDetailModal rsvp={selectedRsvp} isOpen={isOpen} onClose={onClose} />
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
