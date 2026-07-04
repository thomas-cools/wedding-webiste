import { useState } from 'react'
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Heading,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Skeleton,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast,
  VStack,
} from '@chakra-ui/react'
import { getAdminAuthHeaders } from '../../utils/adminAuth'
import type { UseAdminRsvpsReturn } from './useAdminRsvps'

interface SendResult {
  sent: number
  failed: number
  total: number
}

export function FinalRsvpInvitationsPanel({ adminData }: { adminData: UseAdminRsvpsReturn }) {
  const { filteredRsvps, selectedIds, isLoading, getEffectiveLocale } = adminData
  const [locale, setLocale] = useState('en')
  const [dryRunResult, setDryRunResult] = useState<{
    totalCount: number
    confirmedGuests: Array<{ name: string; email: string; partySize: number; partyNames: string[]; locale?: string; previewUrl?: string }>
    sampleHtml: string
    finalRsvpUrl: string
  } | null>(null)
  const [sendResult, setSendResult] = useState<SendResult | null>(null)
  const [loading, setLoading] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()

  const confirmedGuests = selectedIds.size > 0
    ? filteredRsvps.filter((r) => selectedIds.has(r.id))
    : filteredRsvps.filter((r) => r.likelihood === 'definitely' || r.likelihood === 'highly_likely')

  const handleDryRun = async () => {
    setLoading(true)
    setDryRunResult(null)
    try {
      const res = await fetch('/api/send-final-rsvp-invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAdminAuthHeaders() },
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
        toast({ title: 'Dry run failed', description: data.error, status: 'error', duration: 5000 })
        return
      }
      setDryRunResult({ totalCount: data.totalCount, confirmedGuests: data.confirmedGuests, sampleHtml: data.sampleHtml || '', finalRsvpUrl: data.finalRsvpUrl || '' })
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
      const res = await fetch('/api/send-final-rsvp-invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAdminAuthHeaders() },
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
        toast({ title: 'Send failed', description: data.error, status: 'error', duration: 5000 })
        return
      }
      setSendResult({ sent: data.sent, failed: data.failed, total: data.total })
      toast({
        title: `Sent ${data.sent} final RSVP invitations`,
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
        Final RSVP Invitations
      </Heading>

      <VStack spacing={4} align="stretch">
        <Box bg="white" rounded="xl" p={5} shadow="sm" border="1px solid" borderColor="gray.100">
          <Text fontSize="sm" color="gray.500" mb={4}>
            Sends a personalized email to each confirmed guest (Definitely + Highly Likely) with a magic link to complete their final RSVP — including day-by-day attendance, menu choices, and accommodation details.
            {selectedIds.size > 0 && ` (${selectedIds.size} selected from dashboard)`}
          </Text>

          <HStack spacing={4} flexWrap="wrap">
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>Email Language</Text>
              <Select value={locale} onChange={(e) => setLocale(e.target.value)} size="sm" w="150px">
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="nl">Nederlands</option>
              </Select>
            </Box>
            <Box flex={1} />
            <Button variant="outline" colorScheme="blue" size="sm" onClick={handleDryRun} isLoading={loading}>
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
        </Box>

        {/* Dry run results */}
        {dryRunResult && (
          <Box bg="white" rounded="xl" p={5} shadow="sm" border="1px solid" borderColor="gray.100">
            <HStack mb={3}>
              <Text fontWeight="semibold">Dry Run Preview</Text>
              <Badge colorScheme="blue">{dryRunResult.totalCount} recipients</Badge>
            </HStack>
            {isLoading ? (
              <VStack spacing={2}>{[...Array(3)].map((_, i) => <Skeleton key={i} h="40px" />)}</VStack>
            ) : (
              <>
                <Box overflowX="auto" maxH="280px" overflowY="auto">
                  <Table size="sm">
                    <Thead position="sticky" top={0} bg="gray.50">
                      <Tr>
                        <Th>Name</Th>
                        <Th>Email</Th>
                        <Th>Party Size</Th>
                        <Th>Additional Guests</Th>
                        <Th>Locale</Th>
                        <Th>Preview</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {dryRunResult.confirmedGuests.map((g) => (
                        <Tr key={g.email}>
                          <Td>{g.name}</Td>
                          <Td fontSize="xs">{g.email}</Td>
                          <Td>{g.partySize}</Td>
                          <Td fontSize="xs" color="gray.500">{g.partyNames.join(', ') || '—'}</Td>
                          <Td>
                            <Badge fontSize="10px" colorScheme={g.locale ? 'blue' : 'gray'}>
                              {(g.locale || locale || 'en').toUpperCase()}
                            </Badge>
                          </Td>
                          <Td>
                            {g.previewUrl && (
                              <Button
                                as="a"
                                href={g.previewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                size="xs"
                                variant="outline"
                                colorScheme="blue"
                                rightIcon={<Text as="span" fontSize="xs">↗</Text>}
                              >
                                Preview form
                              </Button>
                            )}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
                {dryRunResult.sampleHtml && (
                  <Box mt={4}>
                    <HStack mb={2} justify="space-between" align="center">
                      <Text fontSize="xs" fontWeight="medium" color="gray.500" textTransform="uppercase" letterSpacing="wider">
                        Email Preview — sample for {dryRunResult.confirmedGuests[0]?.name}
                      </Text>
                    </HStack>
                    <Box
                      as="iframe"
                      srcDoc={dryRunResult.sampleHtml}
                      sandbox="allow-same-origin"
                      width="100%"
                      height="520px"
                      border="1px solid"
                      borderColor="gray.200"
                      rounded="md"
                    />
                  </Box>
                )}
              </>
            )}
          </Box>
        )}

        {/* Send results */}
        {sendResult && (
          <Alert status={sendResult.failed > 0 ? 'warning' : 'success'} borderRadius="lg">
            <AlertIcon />
            Sent {sendResult.sent} of {sendResult.total} emails
            {sendResult.failed > 0 && ` — ${sendResult.failed} failed`}
          </Alert>
        )}
      </VStack>

      {/* Confirm send modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Send Final RSVP Invitations</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              This will send final RSVP invitation emails to{' '}
              <strong>{confirmedGuests.length} confirmed guest{confirmedGuests.length !== 1 ? 's' : ''}</strong>.
              Each email contains a personalized link for them to confirm attendance, choose their menu, and provide accommodation details.
            </Text>
            <Text mt={3} fontSize="sm" color="gray.500">
              This action cannot be undone. Are you sure?
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
            <Button colorScheme="blue" onClick={handleSend} isLoading={loading}>
              Send {confirmedGuests.length} Emails
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}
