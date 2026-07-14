import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Checkbox,
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
  Tooltip,
  Tr,
  useDisclosure,
  useToast,
  VStack,
} from '@chakra-ui/react'
import { getAdminAuthHeaders } from '../../utils/adminAuth'
import type { UseAdminRsvpsReturn } from './useAdminRsvps'

interface SendResultDetail {
  email: string
  success: boolean
  error?: string
}

interface SendResult {
  sent: number
  failed: number
  total: number
  results?: SendResultDetail[]
}

export function FinalRsvpInvitationsPanel({ adminData }: { adminData: UseAdminRsvpsReturn }) {
  const { filteredRsvps, selectedIds, isLoading, getEffectiveLocale, setGuestLocale, emailOpensMap } = adminData
  const [locale, setLocale] = useState('en')
  const [dryRunResult, setDryRunResult] = useState<{
    totalCount: number
    confirmedGuests: Array<{ name: string; email: string; partySize: number; partyNames: string[]; locale?: string; previewUrl?: string }>
    sampleHtml: string
    finalRsvpUrl: string
  } | null>(null)
  const [sendResult, setSendResult] = useState<SendResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()

  const confirmedGuests = selectedIds.size > 0
    ? filteredRsvps.filter((r) => selectedIds.has(r.id))
    : filteredRsvps.filter((r) => r.likelihood === 'definitely' || r.likelihood === 'highly_likely')

  // Reset the checked set to "all checked" whenever the candidate list itself
  // changes (dashboard selection toggled, filters changed, data refetched
  // with a different set of ids). Does not reset on every refetch if the
  // underlying ids are unchanged, so manual unchecks persist across reloads.
  const candidateIdsKey = useMemo(
    () => confirmedGuests.map((r) => r.id).sort().join(','),
    [confirmedGuests]
  )
  useEffect(() => {
    setCheckedIds(new Set(candidateIdsKey ? candidateIdsKey.split(',') : []))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidateIdsKey])

  const toggleChecked = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const checkAll = () => setCheckedIds(new Set(confirmedGuests.map((r) => r.id)))
  const checkNone = () => setCheckedIds(new Set())

  const recipients = confirmedGuests.filter((r) => checkedIds.has(r.id))

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
          guests: recipients.map((r) => ({
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
          guests: recipients.map((r) => ({
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
      setSendResult({ sent: data.sent, failed: data.failed, total: data.total, results: data.results })
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
            Sends a personalized email to each checked guest below with a magic link to complete their final RSVP — including day-by-day attendance, menu choices, and accommodation details.
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
            <Button variant="outline" colorScheme="blue" size="sm" onClick={handleDryRun} isLoading={loading} isDisabled={recipients.length === 0}>
              Preview (Dry Run)
            </Button>
            <Button
              bg="secondary.navy"
              color="neutral.cream"
              _hover={{ bg: 'secondary.maroon' }}
              size="sm"
              onClick={onOpen}
              isDisabled={recipients.length === 0}
            >
              Send Invitations ({recipients.length})
            </Button>
          </HStack>
        </Box>

        {/* Recipient selection */}
        <Box bg="white" rounded="xl" p={5} shadow="sm" border="1px solid" borderColor="gray.100">
          <HStack mb={3} justify="space-between" flexWrap="wrap">
            <HStack>
              <Text fontWeight="semibold">Recipients</Text>
              <Badge colorScheme="blue">{recipients.length} of {confirmedGuests.length} selected</Badge>
            </HStack>
            <HStack>
              <Button size="xs" variant="outline" onClick={checkAll} isDisabled={confirmedGuests.length === 0}>
                Select All
              </Button>
              <Button size="xs" variant="outline" onClick={checkNone} isDisabled={confirmedGuests.length === 0}>
                Select None
              </Button>
            </HStack>
          </HStack>

          {isLoading ? (
            <VStack spacing={2}>{[...Array(3)].map((_, i) => <Skeleton key={i} h="40px" />)}</VStack>
          ) : confirmedGuests.length === 0 ? (
            <Text color="gray.500" fontSize="sm">No confirmed guests found.</Text>
          ) : (
            <Box overflowX="auto" maxH="320px" overflowY="auto">
              <Table size="sm">
                <Thead position="sticky" top={0} bg="gray.50">
                  <Tr>
                    <Th w="40px">
                      <Checkbox
                        isChecked={confirmedGuests.length > 0 && confirmedGuests.every((r) => checkedIds.has(r.id))}
                        isIndeterminate={checkedIds.size > 0 && !confirmedGuests.every((r) => checkedIds.has(r.id))}
                        onChange={(e) => (e.target.checked ? checkAll() : checkNone())}
                      />
                    </Th>
                    <Th>Name</Th>
                    <Th>Email</Th>
                    <Th>Party Size</Th>
                    <Th>Additional Guests</Th>
                    <Th>Locale</Th>
                    <Th>Invite Opened</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {confirmedGuests.map((r) => {
                    const opens = (emailOpensMap.get(r.email.toLowerCase()) || []).filter(
                      (eo) => eo.campaign === 'final_rsvp_invitation'
                    )
                    const lastOpen = opens[opens.length - 1]
                    return (
                      <Tr key={r.id}>
                        <Td>
                          <Checkbox isChecked={checkedIds.has(r.id)} onChange={() => toggleChecked(r.id)} />
                        </Td>
                        <Td fontWeight="medium">{r.firstName}</Td>
                        <Td fontSize="xs" color="gray.600">{r.email}</Td>
                        <Td>{1 + r.guests.length}</Td>
                        <Td fontSize="xs" color="gray.500">{r.guests.map((g) => g.name).join(', ') || '—'}</Td>
                        <Td>
                          <Select
                            size="xs"
                            w="70px"
                            value={getEffectiveLocale(r)}
                            onChange={(e) => setGuestLocale(r.id, e.target.value)}
                          >
                            <option value="en">EN</option>
                            <option value="es">ES</option>
                            <option value="nl">NL</option>
                          </Select>
                        </Td>
                        <Td>
                          {opens.length > 0 ? (
                            <Tooltip label={lastOpen ? `Last opened ${new Date(lastOpen.openedAt).toLocaleString()}` : undefined}>
                              <Badge colorScheme="green" variant="subtle" fontSize="2xs">Opened</Badge>
                            </Tooltip>
                          ) : (
                            <Text fontSize="xs" color="gray.400">—</Text>
                          )}
                        </Td>
                      </Tr>
                    )
                  })}
                </Tbody>
              </Table>
            </Box>
          )}
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
          <Box>
            <Alert status={sendResult.failed > 0 ? 'warning' : 'success'} borderRadius="lg">
              <AlertIcon />
              Sent {sendResult.sent} of {sendResult.total} emails
              {sendResult.failed > 0 && ` — ${sendResult.failed} failed`}
            </Alert>
            {sendResult.failed > 0 && (sendResult.results?.filter((r) => !r.success).length ?? 0) > 0 && (
              <Box bg="red.50" border="1px solid" borderColor="red.200" rounded="lg" p={3} mt={2} maxH="200px" overflowY="auto">
                <Text fontSize="xs" fontWeight="semibold" color="red.700" mb={1}>Failed recipients:</Text>
                <VStack align="stretch" spacing={1}>
                  {sendResult.results!.filter((r) => !r.success).map((r) => (
                    <Text key={r.email} fontSize="xs" color="red.700" wordBreak="break-word">
                      <strong>{r.email}</strong>{r.error ? ` — ${r.error}` : ''}
                    </Text>
                  ))}
                </VStack>
              </Box>
            )}
          </Box>
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
              <strong>{recipients.length} checked guest{recipients.length !== 1 ? 's' : ''}</strong>.
              Each email contains a personalized link for them to confirm attendance, choose their menu, and provide accommodation details.
            </Text>
            <Text mt={3} fontSize="sm" color="gray.500">
              This action cannot be undone. Are you sure?
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
            <Button colorScheme="blue" onClick={handleSend} isLoading={loading}>
              Send {recipients.length} Emails
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}
