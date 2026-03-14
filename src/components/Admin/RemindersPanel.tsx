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
import { useAdminRsvps } from './useAdminRsvps'

type ReminderType = 'rsvp_reminder' | 'event_reminder' | 'custom'

const REMINDER_TYPES = [
  {
    value: 'rsvp_reminder' as const,
    label: 'RSVP Reminder',
    description: 'Remind guests who haven\'t RSVPed yet',
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

export function RemindersPanel() {
  const [type, setType] = useState<ReminderType>('rsvp_reminder')
  const [locale, setLocale] = useState('en')
  const [customSubject, setCustomSubject] = useState('')
  const [customBody, setCustomBody] = useState('')
  const [customText, setCustomText] = useState('')
  const [recipientFilter, setRecipientFilter] = useState('all_confirmed')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(
    null
  )
  const { filteredRsvps, isLoading } = useAdminRsvps()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()

  const getRecipients = () => {
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

  const handleSend = async () => {
    setSending(true)
    setResult(null)

    const body: Record<string, unknown> = {
      type,
      locale,
      recipients: recipients.map((r) => ({
        email: r.email,
        name: r.firstName,
      })),
    }

    if (type === 'custom') {
      body.subject = customSubject
      body.htmlBody = customBody
      body.textBody = customText || undefined
    }

    try {
      const res = await fetch('/api/admin-send-reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders(),
        },
        body: JSON.stringify(body),
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
              onChange={(val) => setType(val as ReminderType)}
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
                    onClick={() => setType(rt.value)}
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

          <HStack spacing={4}>
            <FormControl maxW="200px">
              <FormLabel fontSize="sm">Language</FormLabel>
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

            <FormControl maxW="250px">
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
          </HStack>
        </Box>

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
          <Button
            bg="secondary.navy"
            color="neutral.cream"
            _hover={{ bg: 'secondary.maroon' }}
            isDisabled={recipients.length === 0 || !isCustomValid}
            onClick={onOpen}
          >
            Send Reminders
          </Button>
        </Flex>
      </VStack>

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
              to <strong>{recipients.length}</strong> recipient
              {recipients.length !== 1 ? 's' : ''} in{' '}
              <strong>
                {locale === 'en'
                  ? 'English'
                  : locale === 'es'
                  ? 'Spanish'
                  : 'Dutch'}
              </strong>
              ?
            </Text>
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
