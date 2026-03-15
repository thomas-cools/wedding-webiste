import { useState } from 'react'
import {
  Box,
  Button,
  Heading,
  HStack,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  VStack,
  Badge,
  Alert,
  AlertIcon,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Skeleton,
} from '@chakra-ui/react'
import { getAdminAuthHeaders } from '../../utils/adminAuth'
import { type UseAdminRsvpsReturn } from './useAdminRsvps'

interface SendResult {
  sent: number
  failed: number
  total: number
}

export function DrinkInvitationsPanel({ adminData }: { adminData: UseAdminRsvpsReturn }) {
  const { filteredRsvps, selectedIds, isLoading, getEffectiveLocale } = adminData
  const [locale, setLocale] = useState('en')
  const [dryRunResult, setDryRunResult] = useState<{
    totalCount: number
    confirmedGuests: Array<{
      name: string
      email: string
      partySize: number
      partyNames: string[]
    }>
  } | null>(null)
  const [sendResult, setSendResult] = useState<SendResult | null>(null)
  const [loading, setLoading] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()

  const confirmedGuests = selectedIds.size > 0
    ? filteredRsvps.filter((r) => selectedIds.has(r.id))
    : filteredRsvps.filter(
        (r) => r.likelihood === 'definitely' || r.likelihood === 'highly_likely'
      )

  const handleDryRun = async () => {
    setLoading(true)
    setDryRunResult(null)
    try {
      const res = await fetch('/api/send-drink-invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders(),
        },
        body: JSON.stringify({
          dryRun: true,
          locale,
          guests: confirmedGuests.map((r) => ({
            name: r.firstName,
            email: r.email,
            locale: getEffectiveLocale(r),
            partySize: 1 + r.guests.length,
            partyNames: r.guests.map((g) => g.name),
          })),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast({
          title: 'Dry run failed',
          description: data.error,
          status: 'error',
          duration: 5000,
        })
        return
      }

      setDryRunResult({
        totalCount: data.totalCount,
        confirmedGuests: data.confirmedGuests,
      })
    } catch {
      toast({ title: 'Network error', status: 'error', duration: 5000 })
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    setLoading(true)
    setSendResult(null)
    try {
      const res = await fetch('/api/send-drink-invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders(),
        },
        body: JSON.stringify({
          dryRun: false,
          locale,
          guests: confirmedGuests.map((r) => ({
            name: r.firstName,
            email: r.email,
            locale: getEffectiveLocale(r),
            partySize: 1 + r.guests.length,
            partyNames: r.guests.map((g) => g.name),
          })),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast({
          title: 'Send failed',
          description: data.error,
          status: 'error',
          duration: 5000,
        })
        return
      }

      setSendResult({ sent: data.sent, failed: data.failed, total: data.total })
      toast({
        title: `Sent ${data.sent} drink invitations`,
        description: data.failed > 0 ? `${data.failed} failed` : undefined,
        status: data.failed > 0 ? 'warning' : 'success',
        duration: 5000,
      })
    } catch {
      toast({ title: 'Network error', status: 'error', duration: 5000 })
    } finally {
      setLoading(false)
      onClose()
    }
  }

  return (
    <Box>
      <Heading size="md" fontFamily="heading" color="secondary.navy" mb={4}>
        Drink Preference Invitations
      </Heading>

      <VStack spacing={4} align="stretch">
        {/* Controls */}
        <Box bg="white" rounded="xl" p={5} shadow="sm" border="1px solid" borderColor="gray.100">
          <HStack spacing={4} mb={4}>
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                Email Language
              </Text>
              <Select
                value={locale}
                onChange={(e) => setLocale(e.target.value)}
                size="sm"
                w="150px"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="nl">Nederlands</option>
              </Select>
            </Box>
            <Box flex={1} />
            <Button
              variant="outline"
              colorScheme="blue"
              size="sm"
              onClick={handleDryRun}
              isLoading={loading}
            >
              Preview (Dry Run)
            </Button>
            <Button
              bg="secondary.navy"
              color="neutral.cream"
              _hover={{ bg: 'secondary.maroon' }}
              size="sm"
              onClick={onOpen}
              isDisabled={confirmedGuests.length === 0}
            >
              Send Invitations
            </Button>
          </HStack>

          <Text fontSize="sm" color="gray.500">
            {isLoading
              ? 'Loading...'
              : selectedIds.size > 0
              ? `${confirmedGuests.length} selected guests will receive invitations`
              : `${confirmedGuests.length} confirmed guests will receive invitations`}
          </Text>
        </Box>

        {/* Dry Run Results */}
        {dryRunResult && (
          <Box
            bg="white"
            rounded="xl"
            p={5}
            shadow="sm"
            border="1px solid"
            borderColor="blue.200"
          >
            <Heading size="sm" mb={3} color="blue.600">
              Dry Run Preview — {dryRunResult.totalCount} recipients
            </Heading>
            <Box overflowX="auto">
              <Table size="sm" variant="simple">
                <Thead>
                  <Tr>
                    <Th>Name</Th>
                    <Th>Email</Th>
                    <Th isNumeric>Party Size</Th>
                    <Th>Party Members</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {dryRunResult.confirmedGuests.map((g, i) => (
                    <Tr key={i}>
                      <Td fontWeight="medium">{g.name}</Td>
                      <Td fontSize="xs" color="gray.600">
                        {g.email}
                      </Td>
                      <Td isNumeric>
                        <Badge
                          colorScheme={g.partySize > 1 ? 'blue' : 'gray'}
                          variant="subtle"
                        >
                          {g.partySize}
                        </Badge>
                      </Td>
                      <Td fontSize="xs">
                        {g.partyNames.length > 0
                          ? g.partyNames.join(', ')
                          : '-'}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </Box>
        )}

        {/* Send Results */}
        {sendResult && (
          <Alert
            status={sendResult.failed > 0 ? 'warning' : 'success'}
            rounded="xl"
          >
            <AlertIcon />
            Sent {sendResult.sent} of {sendResult.total} invitations
            {sendResult.failed > 0 && ` (${sendResult.failed} failed)`}
          </Alert>
        )}

        {/* Guest List */}
        <Box bg="white" rounded="xl" shadow="sm" border="1px solid" borderColor="gray.100" overflowX="auto">
          {isLoading ? (
            <Box p={6}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} h="32px" mb={2} rounded="md" />
              ))}
            </Box>
          ) : (
            <Table size="sm" variant="simple">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Likelihood</Th>
                  <Th>Locale</Th>
                  <Th isNumeric>Party Size</Th>
                </Tr>
              </Thead>
              <Tbody>
                {confirmedGuests.map((r) => (
                  <Tr key={r.id}>
                    <Td fontWeight="medium">{r.firstName}</Td>
                    <Td fontSize="xs" color="gray.600">
                      {r.email}
                    </Td>
                    <Td>
                      <Badge
                        colorScheme={
                          r.likelihood === 'definitely' ? 'green' : 'teal'
                        }
                        variant="subtle"
                        fontSize="xs"
                      >
                        {r.likelihood === 'definitely'
                          ? 'Definitely'
                          : 'Highly Likely'}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge variant="outline" fontSize="xs">
                        {getEffectiveLocale(r).toUpperCase()}
                      </Badge>
                    </Td>
                    <Td isNumeric>{1 + r.guests.length}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Box>
      </VStack>

      {/* Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader fontFamily="heading">Send Drink Invitations</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              Send drink preference invitations to{' '}
              <strong>{confirmedGuests.length}</strong>{' '}
              {selectedIds.size > 0 ? 'selected' : 'confirmed'} guest
              {confirmedGuests.length !== 1 ? 's' : ''} with per-guest language settings?
            </Text>
            <Text fontSize="sm" color="gray.500" mt={2}>
              Each guest will receive a personalized email with a link to the
              drink preferences page.
            </Text>
            <Box
              mt={3}
              maxH="200px"
              overflowY="auto"
              bg="gray.50"
              rounded="md"
              p={2}
            >
              {confirmedGuests.map((r) => (
                <Text key={r.id} fontSize="xs" color="gray.600" lineHeight="tall">
                  {r.firstName} &lt;{r.email}&gt;
                </Text>
              ))}
            </Box>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              bg="secondary.navy"
              color="neutral.cream"
              _hover={{ bg: 'secondary.maroon' }}
              isLoading={loading}
              onClick={handleSend}
            >
              Send Now
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}
