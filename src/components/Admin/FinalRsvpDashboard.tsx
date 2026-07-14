import { useState } from 'react'
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Progress,
  SimpleGrid,
  Skeleton,
  Stat,
  StatLabel,
  StatNumber,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure,
  VStack,
  Tooltip,
} from '@chakra-ui/react'
import { DownloadIcon, ViewIcon, WarningIcon, ChevronDownIcon } from '@chakra-ui/icons'
import type { UseAdminRsvpsReturn, AdminFinalRsvp, AdminFinalRsvpGuest } from './useAdminRsvps'

const EVENT_LABELS: Record<string, string> = {
  yes: 'Attending',
  arriving_late: 'Late',
  no: 'No',
  '': '—',
}

const EVENT_COLORS: Record<string, string> = {
  yes: 'green',
  arriving_late: 'yellow',
  no: 'red',
  '': 'gray',
}

const DAY_LABELS: Record<'welcome' | 'ceremony' | 'brunch', string> = {
  welcome: 'Welcome Dinner',
  ceremony: 'Ceremony',
  brunch: 'Brunch',
}

/** Summarizes a party's per-guest attendance for one day: a single badge if everyone
 *  agrees, or a "Mixed" badge (with tooltip breakdown) if guests differ. */
function dayAttendanceSummary(guests: AdminFinalRsvpGuest[], day: keyof typeof DAY_LABELS) {
  if (guests.length === 0) {
    return { label: EVENT_LABELS[''], color: EVENT_COLORS[''], tooltip: undefined as string | undefined }
  }
  const first = guests[0]?.events?.[day] || ''
  const allSame = guests.every((g) => (g.events?.[day] || '') === first)
  if (allSame) {
    return { label: EVENT_LABELS[first] || first, color: EVENT_COLORS[first] || 'gray', tooltip: undefined as string | undefined }
  }
  const tooltip = guests.map((g) => `${g.name}: ${EVENT_LABELS[g.events?.[day] || '']}`).join(', ')
  return { label: 'Mixed', color: 'purple', tooltip }
}

const APPETIZER_LABELS: Record<string, string> = {
  ceviche: 'Ceviche de Bar',
  gaspacho: 'Gaspacho fumé (V)',
}

const MAIN_LABELS: Record<string, string> = {
  bar: 'Filet de Bar',
  tournedos: 'Tournedos de boeuf',
  vegan: 'Vegetable Tartlet',
}

const ACCOMMODATION_TYPE_LABELS: Record<string, string> = {
  chateau: 'Chateau',
  airbnb: 'Airbnb',
  hotel: 'Hotel',
  '': '—',
}

const ACCOMMODATION_TYPE_COLORS: Record<string, string> = {
  chateau: 'green',
  airbnb: 'blue',
  hotel: 'purple',
  '': 'gray',
}

const TRANSPORTATION_LABELS: Record<string, string> = {
  taxi: 'Taxi requested',
  own: 'Own arrangement',
  '': '—',
}

function accommodationDetail(rsvp: AdminFinalRsvp): string {
  if (rsvp.accommodationType === 'airbnb') return rsvp.accommodationAddress
  if (rsvp.accommodationType === 'hotel') return rsvp.hotelName
  return ''
}

function StatCard({ label, value, color = 'secondary.navy' }: { label: string; value: number | string; color?: string }) {
  return (
    <Stat
      bg="white"
      p={4}
      borderRadius="lg"
      border="1px solid"
      borderColor="gray.100"
      shadow="sm"
    >
      <StatLabel fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wide">
        {label}
      </StatLabel>
      <StatNumber fontSize="2xl" color={color}>
        {value}
      </StatNumber>
    </Stat>
  )
}

function MenuBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <Box mb={3}>
      <Flex justify="space-between" mb={1}>
        <Text fontSize="sm" color="gray.700">{label}</Text>
        <Text fontSize="sm" fontWeight="bold">{count} ({pct}%)</Text>
      </Flex>
      <Progress value={pct} size="sm" colorScheme="blue" borderRadius="full" bg="gray.100" />
    </Box>
  )
}

function GuestDetailModal({ rsvp, isOpen, onClose }: { rsvp: AdminFinalRsvp | null; isOpen: boolean; onClose: () => void }) {
  if (!rsvp) return null
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{rsvp.firstName} <Text as="span" fontSize="sm" color="gray.500" fontWeight="normal">{rsvp.email}</Text></ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack align="stretch" spacing={4}>
            {/* Attendance */}
            <Box>
              <Text fontWeight="semibold" mb={2} fontSize="sm" color="gray.500" textTransform="uppercase">Attendance</Text>
              <VStack align="stretch" spacing={2}>
                {rsvp.guests.map((g, i) => (
                  <Flex key={i} justify="space-between" align="center" py={1} borderBottom="1px solid" borderColor="gray.100">
                    <Text fontSize="sm" fontWeight="medium">{g.name}</Text>
                    <HStack spacing={1}>
                      {(['welcome', 'ceremony', 'brunch'] as const).map((day) => (
                        <Tooltip key={day} label={DAY_LABELS[day]}>
                          <Badge colorScheme={EVENT_COLORS[g.events?.[day] || '']} fontSize="10px">
                            {EVENT_LABELS[g.events?.[day] || '']}
                          </Badge>
                        </Tooltip>
                      ))}
                    </HStack>
                  </Flex>
                ))}
              </VStack>
            </Box>

            {/* Accommodation */}
            <Box>
              <Text fontWeight="semibold" mb={1} fontSize="sm" color="gray.500" textTransform="uppercase">Accommodation</Text>
              <Badge colorScheme={ACCOMMODATION_TYPE_COLORS[rsvp.accommodationType] || 'gray'}>
                {ACCOMMODATION_TYPE_LABELS[rsvp.accommodationType] || '—'}
              </Badge>
              {accommodationDetail(rsvp) && <Text fontSize="sm" color="gray.600" mt={1}>{accommodationDetail(rsvp)}</Text>}
              {rsvp.accommodationType && rsvp.accommodationType !== 'chateau' && (
                <Text fontSize="sm" color="gray.600" mt={1}>{TRANSPORTATION_LABELS[rsvp.transportationPreference] || TRANSPORTATION_LABELS['']}</Text>
              )}
            </Box>

            {/* Menu choices */}
            <Box>
              <Text fontWeight="semibold" mb={2} fontSize="sm" color="gray.500" textTransform="uppercase">Menu Choices</Text>
              <VStack align="stretch" spacing={2}>
                {rsvp.guests.map((g, i) => (
                  <Flex key={i} justify="space-between" align="flex-start" py={2} borderBottom="1px solid" borderColor="gray.100">
                    <Box>
                      <Text fontSize="sm" fontWeight="medium">{g.name}</Text>
                      {g.isChild ? (
                        <Badge colorScheme="orange" fontSize="10px">Children's Meal</Badge>
                      ) : (
                        <Text fontSize="xs" color="gray.500">
                          {APPETIZER_LABELS[g.appetizer || ''] || '—'} &nbsp;/&nbsp; {MAIN_LABELS[g.main || ''] || '—'}
                        </Text>
                      )}
                      {g.allergies && (
                        <Text fontSize="xs" color="red.600" mt={1}>⚠ {g.allergies}</Text>
                      )}
                    </Box>
                    <Badge colorScheme={g.isChild ? 'orange' : 'blue'} fontSize="10px">
                      {g.isChild ? 'Child' : 'Adult'}
                    </Badge>
                  </Flex>
                ))}
              </VStack>
            </Box>

            {/* Other details */}
            <SimpleGrid columns={2} gap={3}>
              {rsvp.songRequest && (
                <Box>
                  <Text fontSize="xs" color="gray.500" textTransform="uppercase">Song Request</Text>
                  <Text fontSize="sm">{rsvp.songRequest}</Text>
                </Box>
              )}
              <Box>
                <Text fontSize="xs" color="gray.500" textTransform="uppercase">Photography</Text>
                <Badge colorScheme={rsvp.photographyConsent === true ? 'green' : rsvp.photographyConsent === false ? 'red' : 'gray'}>
                  {rsvp.photographyConsent === true ? 'Consented' : rsvp.photographyConsent === false ? 'Declined' : '—'}
                </Badge>
              </Box>
            </SimpleGrid>

            {rsvp.additionalNotes && (
              <Box>
                <Text fontSize="xs" color="gray.500" textTransform="uppercase" mb={1}>Notes</Text>
                <Text fontSize="sm" bg="gray.50" p={2} borderRadius="md">{rsvp.additionalNotes}</Text>
              </Box>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export function FinalRsvpDashboard({ adminData }: { adminData: UseAdminRsvpsReturn }) {
  const {
    finalRsvps,
    finalRsvpStats,
    finalRsvpsLoading,
    finalRsvpsError,
    fetchFinalRsvps,
    exportFinalRsvpsCsv,
    exportFinalRsvpsMarkdown,
  } = adminData
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [selectedRsvp, setSelectedRsvp] = useState<AdminFinalRsvp | null>(null)

  const handleViewDetails = (rsvp: AdminFinalRsvp) => {
    setSelectedRsvp(rsvp)
    onOpen()
  }

  const totalAdults = finalRsvps.flatMap((r) => r.guests).filter((g) => !g.isChild).length
  const totalChildren = finalRsvps.flatMap((r) => r.guests).filter((g) => g.isChild).length

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6} wrap="wrap" gap={3}>
        <Heading size="md" color="secondary.navy">Final RSVP Responses</Heading>
        <HStack>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchFinalRsvps}
            isLoading={finalRsvpsLoading}
          >
            Refresh
          </Button>
          <Menu>
            <MenuButton
              as={Button}
              size="sm"
              leftIcon={<DownloadIcon />}
              rightIcon={<ChevronDownIcon />}
              colorScheme="blue"
              isDisabled={finalRsvps.length === 0}
            >
              Export
            </MenuButton>
            <MenuList>
              <MenuItem onClick={exportFinalRsvpsCsv}>Export as CSV</MenuItem>
              <MenuItem onClick={exportFinalRsvpsMarkdown}>Export as Markdown</MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>

      {finalRsvpsError && (
        <Alert status="error" mb={6} borderRadius="md">
          <AlertIcon />
          {finalRsvpsError}
        </Alert>
      )}

      {/* Stats */}
      {finalRsvpsLoading ? (
        <SimpleGrid columns={[2, 3, 6]} gap={4} mb={6}>
          {[...Array(6)].map((_, i) => <Skeleton key={i} h="80px" borderRadius="lg" />)}
        </SimpleGrid>
      ) : finalRsvpStats ? (
        <SimpleGrid columns={[2, 3, 6]} gap={4} mb={6}>
          <StatCard label="Total Responses" value={finalRsvpStats.total} />
          <StatCard label="Total Guests" value={totalAdults + totalChildren} color="blue.600" />
          <StatCard label="Welcome Dinner" value={finalRsvpStats.attendingWelcome} color="green.600" />
          <StatCard label="Ceremony" value={finalRsvpStats.attendingCeremony} color="green.600" />
          <StatCard label="Brunch" value={finalRsvpStats.attendingBrunch} color="green.600" />
          <StatCard label="Children's Meals" value={finalRsvpStats.childrenMeals} color="orange.500" />
          <StatCard label="Taxi Requests" value={finalRsvpStats.interestedInTaxi} color="blue.500" />
        </SimpleGrid>
      ) : null}

      {/* Menu breakdown */}
      {!finalRsvpsLoading && finalRsvpStats && totalAdults > 0 && (
        <SimpleGrid columns={[1, 2]} gap={6} mb={6}>
          <Box bg="white" p={4} borderRadius="lg" border="1px solid" borderColor="gray.100" shadow="sm">
            <Text fontWeight="semibold" mb={3} fontSize="sm" color="gray.600" textTransform="uppercase">Appetizers ({totalAdults} adults)</Text>
            <MenuBar label="Ceviche de Bar français" count={finalRsvpStats.ceviche} total={totalAdults} />
            <MenuBar label="Gaspacho fumé (V)" count={finalRsvpStats.gaspacho} total={totalAdults} />
          </Box>
          <Box bg="white" p={4} borderRadius="lg" border="1px solid" borderColor="gray.100" shadow="sm">
            <Text fontWeight="semibold" mb={3} fontSize="sm" color="gray.600" textTransform="uppercase">Main Courses ({totalAdults} adults)</Text>
            <MenuBar label="Filet de Bar grillé" count={finalRsvpStats.barFillet} total={totalAdults} />
            <MenuBar label="Tournedos de boeuf" count={finalRsvpStats.tournedos} total={totalAdults} />
            <MenuBar label="Vegetable Tartlet" count={finalRsvpStats.veganMain} total={totalAdults} />
          </Box>
        </SimpleGrid>
      )}

      {/* Photography consent stat */}
      {!finalRsvpsLoading && finalRsvpStats && finalRsvpStats.total > 0 && (
        <Box bg="white" p={4} borderRadius="lg" border="1px solid" borderColor="gray.100" shadow="sm" mb={6}>
          <Text fontWeight="semibold" mb={3} fontSize="sm" color="gray.600" textTransform="uppercase">
            Photography Consent — {finalRsvpStats.photographyConsented} / {finalRsvpStats.total}
          </Text>
          <Progress
            value={Math.round((finalRsvpStats.photographyConsented / finalRsvpStats.total) * 100)}
            colorScheme="green"
            size="sm"
            borderRadius="full"
            bg="gray.100"
          />
        </Box>
      )}

      {/* Table */}
      {finalRsvpsLoading ? (
        <VStack spacing={3}>
          {[...Array(4)].map((_, i) => <Skeleton key={i} h="48px" w="100%" borderRadius="md" />)}
        </VStack>
      ) : finalRsvps.length === 0 ? (
        <Box textAlign="center" py={12} color="gray.500">
          <Text>No final RSVP submissions yet.</Text>
          <Button mt={4} size="sm" onClick={fetchFinalRsvps}>Load responses</Button>
        </Box>
      ) : (
        <Box overflowX="auto" bg="white" borderRadius="lg" border="1px solid" borderColor="gray.100" shadow="sm">
          <Table size="sm">
            <Thead bg="gray.50">
              <Tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Dinner</Th>
                <Th>Ceremony</Th>
                <Th>Brunch</Th>
                <Th>Party</Th>
                <Th>Song</Th>
                <Th>Accommodation</Th>
                <Th>Allergies</Th>
                <Th></Th>
              </Tr>
            </Thead>
            <Tbody>
              {finalRsvps.map((r) => (
                <Tr key={r.id} _hover={{ bg: 'gray.50' }}>
                  <Td fontWeight="medium">{r.firstName}</Td>
                  <Td fontSize="xs" color="gray.600">{r.email}</Td>
                  <Td>
                    {(() => {
                      const s = dayAttendanceSummary(r.guests, 'welcome')
                      return (
                        <Tooltip label={s.tooltip} isDisabled={!s.tooltip}>
                          <Badge colorScheme={s.color} fontSize="10px">{s.label}</Badge>
                        </Tooltip>
                      )
                    })()}
                  </Td>
                  <Td>
                    {(() => {
                      const s = dayAttendanceSummary(r.guests, 'ceremony')
                      return (
                        <Tooltip label={s.tooltip} isDisabled={!s.tooltip}>
                          <Badge colorScheme={s.color} fontSize="10px">{s.label}</Badge>
                        </Tooltip>
                      )
                    })()}
                  </Td>
                  <Td>
                    {(() => {
                      const s = dayAttendanceSummary(r.guests, 'brunch')
                      return (
                        <Tooltip label={s.tooltip} isDisabled={!s.tooltip}>
                          <Badge colorScheme={s.color} fontSize="10px">{s.label}</Badge>
                        </Tooltip>
                      )
                    })()}
                  </Td>
                  <Td fontSize="xs">
                    {r.guests.length} ({r.guests.filter((g) => g.isChild).length} child)
                  </Td>
                  <Td fontSize="xs" maxW="120px">
                    <Tooltip label={r.songRequest} isDisabled={!r.songRequest}>
                      <Text noOfLines={1}>{r.songRequest || '—'}</Text>
                    </Tooltip>
                  </Td>
                  <Td fontSize="xs">
                    {r.accommodationType ? (
                      <Tooltip label={accommodationDetail(r)} isDisabled={!accommodationDetail(r)}>
                        <Badge colorScheme={ACCOMMODATION_TYPE_COLORS[r.accommodationType] || 'gray'} fontSize="10px">
                          {ACCOMMODATION_TYPE_LABELS[r.accommodationType] || r.accommodationType}
                        </Badge>
                      </Tooltip>
                    ) : '—'}
                  </Td>
                  <Td fontSize="xs">
                    {(() => {
                      const guestsWithAllergies = r.guests.filter((g) => g.allergies)
                      if (guestsWithAllergies.length === 0) return '—'
                      const tooltip = guestsWithAllergies.map((g) => `${g.name}: ${g.allergies}`).join(', ')
                      return (
                        <Tooltip label={tooltip}>
                          <Badge colorScheme="red" fontSize="10px" display="inline-flex" alignItems="center" gap={1}>
                            <WarningIcon boxSize="10px" /> {guestsWithAllergies.length}
                          </Badge>
                        </Tooltip>
                      )
                    })()}
                  </Td>
                  <Td>
                    <IconButton
                      aria-label="View details"
                      icon={<ViewIcon />}
                      size="xs"
                      variant="ghost"
                      onClick={() => handleViewDetails(r)}
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          <Box p={3} borderTop="1px solid" borderColor="gray.100">
            <Text fontSize="xs" color="gray.500">{finalRsvps.length} submission{finalRsvps.length !== 1 ? 's' : ''} · {totalAdults} adult{totalAdults !== 1 ? 's' : ''} · {totalChildren} child{totalChildren !== 1 ? 'ren' : ''}</Text>
          </Box>
        </Box>
      )}

      <GuestDetailModal rsvp={selectedRsvp} isOpen={isOpen} onClose={onClose} />
    </Box>
  )
}
