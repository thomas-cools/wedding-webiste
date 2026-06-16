import { useState } from 'react'
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Select,
  Text,
  Textarea,
  VStack,
  Alert,
  AlertIcon,
  useToast,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Radio,
  RadioGroup,
  Stack,
} from '@chakra-ui/react'
import { getAdminAuthHeaders } from '../../utils/adminAuth'
import { type UseAdminRsvpsReturn } from './useAdminRsvps'

type ReminderType = 'rsvp_reminder' | 'event_reminder' | 'custom'

const REMINDER_TYPES = [
  {
    value: 'rsvp_reminder' as const,
    label: 'RSVP Reminder',
    description: "Follow up with guests who responded 'Maybe' or haven't confirmed yet",
  },
  {
    value: 'event_reminder' as const,
    label: 'Event Reminder',
    description: 'Remind confirmed guests about the upcoming event',
  },
  {
    value: 'custom' as const,
    label: 'Custom',
    description: 'Write a custom reminder message',
  },
]

/** Sensible recipient-filter default for each reminder type */
const DEFAULT_FILTER: Record<ReminderType, string> = {
  rsvp_reminder: 'maybe',
  event_reminder: 'all_confirmed',
  custom: 'all_confirmed',
}

interface DryRunData {
  totalCount: number
  recipients: Array<{ email: string; name: string; locale: string }>
  sampleSubject: string
  sampleHtml: string
}

export function RemindersPanel({ adminData }: { adminData: UseAdminRsvpsReturn }) {
  const [type, setType] = useState<ReminderType>('rsvp_reminder')
  const [locale, setLocale] = useState('en')
  const [customSubject, setCustomSubject] = useState('')
  const [customBody, setCustomBody] = useState('')
  const [customText, setCustomText] = useState('')
  const [recipientFilter, setRecipientFilter] = useState(DEFAULT_FILTER['rsvp_reminder'])
  const [sending, setSending] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null)
  const [dryRunData, setDryRunData] = useState<DryRunData | null>(null)
  const { filteredRsvps, selectedIds, isLoading, getEffectiveLocale } = adminData
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isOpen: isPreviewOpen, onOpen: onPreviewOpen, onClose: onPreviewClose } = useDisclosure()
  const toast = useToast()

  const handleTypeChange = (newType: ReminderType) => {
    setType(newType)
    setRecipientFilter(DEFAULT_FILTER[newType])
  }

  const getRecipients = () => {
    // If dashboard selection is active, use those guests
    if (selectedIds.size > 0) {
      return filteredRsvps.filter((r) => selectedIds.has(r.id))
    }
    switch (recipientFilter) {
      case 'all_confirmed':
        return filteredRsvps.filter(
          (r) =>
            r.likelihood === 'definitely' || r.likelihood === 'highly_likely'
        )
      case 'maybe':
        return filteredRsvps.filter((r) => r.likelihood === 'maybe')
      case 'all':
        return filteredRsvps.filter((r) => r.likelihood !== 'no')
      default:
        return filteredRsvps
    }
  }

  const recipients = getRecipients()

  const buildRequestBody = (dryRun: boolean): Record<string, unknown> => {
    const body: Record<string, unknown> = {
      type,
      locale,
      dryRun,
      recipients: recipients.map((r) => ({
        email: r.email,
        name: r.firstName,
        locale: getEffectiveLocale(r),
      })),
    }
    if (type === 'custom') {
      body.subject = customSubject
      body.htmlBody = customBody
      body.textBody = customText || undefined
    }
    return body
  }

  const handlePreview = async () => {
    setPreviewing(true)
    try {
      const res = await fetch('/api/admin-send-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAdminAuthHeaders() },
        body: JSON.stringify(buildRequestBody(true)),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ title: 'Preview failed', description: data.error, status: 'error', duration: 5000 })
        return
      }
      setDryRunData(data)
      onPreviewOpen()
    } catch {
      toast({ title: 'Network error', status: 'error', duration: 5000 })
    } finally {
      setPreviewing(false)
    }
  }

  const handleSend = async () => {
    setSending(true)
    setResult(null)

    try {
      const res = await fetch('/api/admin-send-reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders(),
        },
        body: JSON.stringify(buildRequestBody(false)),
      })

      const data = await res.json()
      if (!res.ok) {
        toast({
          title: 'Failed to send reminders',
          description: data.error,
          status: 'error',
          duration: 5000,
        })
        return
      }

      setResult({ sent: data.sent, failed: data.failed })
      toast({
        title: `Sent ${data.sent} reminders`,
        description: data.failed > 0 ? `${data.failed} failed` : undefined,
        status: data.failed > 0 ? 'warning' : 'success',
        duration: 5000,
      })
    } catch {
      toast({ title: 'Network error', status: 'error', duration: 5000 })
    } finally {
      setSending(false)
      onClose()
    }
  }

  const isCustomValid =
    type !== 'custom' || (customSubject && customBody)

  return (
    <Box>
      <Heading size="md" fontFamily="heading" color="secondary.navy" mb={4}>
        Send Reminders
      </Heading>

      <VStack spacing={4} align="stretch">
        {/* Reminder Type Selection */}
        <Box bg="white" rounded="xl" p={5} shadow="sm" border="1px solid" borderColor="gray.100">
          <FormControl mb={4}>
            <FormLabel fontSize="sm" fontWeight="medium">
              Reminder Type
            </FormLabel>
            <RadioGroup
              value={type}
              onChange={(val) => handleTypeChange(val as ReminderType)}
            >
              <Stack spacing={3}>
                {REMINDER_TYPES.map((rt) => (
                  <Box
                    key={rt.value}
                    p={3}
                    rounded="md"
                    border="1px solid"
                    borderColor={type === rt.value ? 'primary.deep' : 'gray.200'}
                    bg={type === rt.value ? 'blue.50' : 'transparent'}
                    cursor="pointer"
                    onClick={() => handleTypeChange(rt.value)}
                  >
                    <Radio value={rt.value} colorScheme="blue">
                      <Text fontSize="sm" fontWeight="medium">
                        {rt.label}
                      </Text>
                    </Radio>
                    <Text fontSize="xs" color="gray.500" ml={6}>
                      {rt.description}
                    </Text>
                  </Box>
                ))}
              </Stack>
            </RadioGroup>
          </FormControl>

          <HStack spacing={4} align="flex-end">
            <FormControl maxW="200px">
              <FormLabel fontSize="sm">
                Language
                <Text as="span" fontSize="xs" color="gray.400" fontWeight="normal" ml={1}>
                  (fallback — per-guest locale used when available)
                </Text>
              </FormLabel>
              <Select
                value={locale}
                onChange={(e) => setLocale(e.target.value)}
                size="sm"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="nl">Nederlands</option>
              </Select>
            </FormControl>

            {selectedIds.size === 0 && (
              <FormControl maxW="270px">
                <FormLabel fontSize="sm">Recipients</FormLabel>
                <Select
                  value={recipientFilter}
                  onChange={(e) => setRecipientFilter(e.target.value)}
                  size="sm"
                >
                  <option value="all_confirmed">
                    Confirmed (definitely + highly likely)
                  </option>
                  <option value="maybe">Maybe</option>
                  <option value="all">All (except declined)</option>
                </Select>
              </FormControl>
            )}
          </HStack>
        </Box>

        {/* Selection override notice */}
        {selectedIds.size > 0 && (
          <Alert status="info" rounded="xl" fontSize="sm">
            <AlertIcon />
            Sending to <strong style={{ marginLeft: 4, marginRight: 4 }}>{selectedIds.size}</strong>
            guest{selectedIds.size !== 1 ? 's' : ''} selected in the RSVP dashboard.
            Deselect them there to use the recipient filter instead.
          </Alert>
        )}

        {/* Custom Fields */}
        {type === 'custom' && (
          <Box bg="white" rounded="xl" p={5} shadow="sm" border="1px solid" borderColor="gray.100">
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel fontSize="sm">Subject</FormLabel>
                <Input
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="Reminder subject..."
                  focusBorderColor="primary.deep"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel fontSize="sm">HTML Body</FormLabel>
                <Textarea
                  value={customBody}
                  onChange={(e) => setCustomBody(e.target.value)}
                  placeholder="<p>Your custom HTML content...</p>"
                  rows={6}
                  fontFamily="mono"
                  fontSize="sm"
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">Plain Text (optional)</FormLabel>
                <Textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Plain text fallback..."
                  rows={3}
                  fontSize="sm"
                />
              </FormControl>
            </VStack>
          </Box>
        )}

        {/* Result */}
        {result && (
          <Alert
            status={result.failed > 0 ? 'warning' : 'success'}
            rounded="xl"
          >
            <AlertIcon />
            Sent {result.sent} reminders
            {result.failed > 0 && `, ${result.failed} failed`}
          </Alert>
        )}

        {/* Action Bar */}
        <Flex justify="space-between" align="center">
          <HStack>
            <Text fontSize="sm" color="gray.500">
              {isLoading
                ? 'Loading...'
                : `${recipients.length} recipient${recipients.length !== 1 ? 's' : ''}`}
            </Text>
            <Badge colorScheme="blue" variant="subtle" fontSize="xs">
              {type === 'rsvp_reminder'
                ? 'RSVP Reminder'
                : type === 'event_reminder'
                ? 'Event Reminder'
                : 'Custom'}
            </Badge>
          </HStack>
          <HStack spacing={2}>
            <Button
              variant="outline"
              size="sm"
              isDisabled={recipients.length === 0 || !isCustomValid}
              isLoading={previewing}
              loadingText="Loading…"
              onClick={handlePreview}
            >
              Preview Email
            </Button>
            <Button
              bg="secondary.navy"
              color="neutral.cream"
              _hover={{ bg: 'secondary.maroon' }}
              isDisabled={recipients.length === 0 || !isCustomValid}
              onClick={onOpen}
            >
              Send Reminders
            </Button>
          </HStack>
        </Flex>
      </VStack>

      {/* Preview Modal */}
      <Modal isOpen={isPreviewOpen} onClose={onPreviewClose} size="4xl" isCentered scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent maxH="90vh">
          <ModalHeader fontFamily="heading" fontSize="md">
            Email Preview — {dryRunData?.sampleSubject}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={4}>
            <Text fontSize="sm" color="gray.500" mb={3}>
              Showing a sample for <strong>{dryRunData?.recipients[0]?.name}</strong>.
              This email will be sent to{' '}
              <strong>{dryRunData?.totalCount}</strong> recipient
              {dryRunData?.totalCount !== 1 ? 's' : ''}.
            </Text>
            {dryRunData?.sampleHtml && (
              <Box
                as="iframe"
                srcDoc={dryRunData.sampleHtml}
                sandbox="allow-same-origin"
                width="100%"
                height="480px"
                border="1px solid"
                borderColor="gray.200"
                rounded="md"
                bg="white"
                display="block"
              />
            )}
            <Box mt={4}>
              <Text fontSize="xs" fontWeight="semibold" color="gray.500" mb={2} textTransform="uppercase" letterSpacing="wide">
                Recipients ({dryRunData?.totalCount})
              </Text>
              <Box maxH="140px" overflowY="auto" bg="gray.50" rounded="md" p={2}>
                {dryRunData?.recipients.map((r) => (
                  <Text key={r.email} fontSize="xs" color="gray.600" lineHeight="tall">
                    {r.name} &lt;{r.email}&gt;{' '}
                    <Badge fontSize="2xs" colorScheme="gray">{r.locale.toUpperCase()}</Badge>
                  </Text>
                ))}
              </Box>
            </Box>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onPreviewClose}>
              Close
            </Button>
            <Button
              bg="secondary.navy"
              color="neutral.cream"
              _hover={{ bg: 'secondary.maroon' }}
              onClick={() => { onPreviewClose(); onOpen() }}
            >
              Send Now
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader fontFamily="heading">Confirm Reminders</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              Send{' '}
              <strong>
                {type === 'rsvp_reminder'
                  ? 'RSVP reminder'
                  : type === 'event_reminder'
                  ? 'event reminder'
                  : `"${customSubject}"`}
              </strong>{' '}
              to <strong>{recipients.length}</strong>{' '}
              {selectedIds.size > 0 ? 'selected' : ''} recipient
              {recipients.length !== 1 ? 's' : ''} with per-guest language settings?
            </Text>
            <Box
              mt={3}
              maxH="200px"
              overflowY="auto"
              bg="gray.50"
              rounded="md"
              p={2}
            >
              {recipients.map((r) => (
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
              isLoading={sending}
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
