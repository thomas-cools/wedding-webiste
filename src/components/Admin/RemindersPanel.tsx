import { useState } from 'react'
import {
  Box,
  Button,
  Checkbox,
  Divider,
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

interface PresetTemplate {
  id: string
  label: string
  subject: string
  htmlBody: string
  textBody: string
}

const PRESET_TEMPLATES: PresetTemplate[] = [
  {
    id: 'timeline',
    label: '📅 Event Timeline',
    subject: "What to Expect — Carolina & Thomas's Wedding Weekend",
    htmlBody: `
      <h2 style="margin: 0 0 20px; font-size: 22px; font-weight: normal; color: #0B1937;">The Wedding Weekend is Almost Here!</h2>
      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6;">We can't wait to celebrate with you. Here's a quick overview of what's planned:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
        <thead>
          <tr style="background-color: #0B1937; color: #E3DFCE;">
            <th style="padding: 10px 14px; text-align: left; font-size: 13px; font-weight: 600; letter-spacing: 0.5px;">Day</th>
            <th style="padding: 10px 14px; text-align: left; font-size: 13px; font-weight: 600; letter-spacing: 0.5px;">Event</th>
            <th style="padding: 10px 14px; text-align: left; font-size: 13px; font-weight: 600; letter-spacing: 0.5px;">Details</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 14px; font-size: 15px; color: #0B1937; white-space: nowrap;"><strong>Tue, Aug 25</strong></td>
            <td style="padding: 10px 14px; font-size: 15px; color: #300F0C;">Welcome Dinner</td>
            <td style="padding: 10px 14px; font-size: 14px; color: #555;">Evening · Semi-formal dress code</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0; background-color: #f9f7f4;">
            <td style="padding: 10px 14px; font-size: 15px; color: #0B1937; white-space: nowrap;"><strong>Wed, Aug 26</strong></td>
            <td style="padding: 10px 14px; font-size: 15px; color: #300F0C;">Ceremony &amp; Reception</td>
            <td style="padding: 10px 14px; font-size: 14px; color: #555;">Mid-afternoon · Formal dress code · <em>specific time in your invitation</em></td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; font-size: 15px; color: #0B1937; white-space: nowrap;"><strong>Thu, Aug 27</strong></td>
            <td style="padding: 10px 14px; font-size: 15px; color: #300F0C;">Pool Brunch</td>
            <td style="padding: 10px 14px; font-size: 14px; color: #555;">Late morning · Casual / resort wear</td>
          </tr>
        </tbody>
      </table>
      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6;">All events take place at <strong>Vallesvilles, France</strong> (Haute-Garonne, ~35 min from Toulouse).</p>
      <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #666; font-style: italic;">Questions? Don't hesitate to reach out — we're happy to help!</p>
      <p style="margin: 20px 0 0; font-size: 16px; line-height: 1.6;">With love,<br>Carolina &amp; Thomas</p>`,
    textBody:
      "The Wedding Weekend is Almost Here!\n\nTue Aug 25 — Welcome Dinner (evening, semi-formal)\nWed Aug 26 — Ceremony & Reception (mid-afternoon, formal)\nThu Aug 27 — Pool Brunch (late morning, casual)\n\nAll events at Vallesvilles, France (~35 min from Toulouse).\n\nWith love,\nCarolina & Thomas",
  },
  {
    id: 'dress_code',
    label: '👗 Dress Code',
    subject: "Dress Code Reminder — Carolina & Thomas's Wedding",
    htmlBody: `
      <h2 style="margin: 0 0 20px; font-size: 22px; font-weight: normal; color: #0B1937;">A Note on Dress Code</h2>
      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6;">We want you to feel comfortable and look fabulous — here's what we're envisioning for each event:</p>

      <div style="margin: 0 0 20px; padding: 16px 20px; border-left: 3px solid #94B1C8; background-color: #f9f7f4;">
        <p style="margin: 0 0 6px; font-size: 13px; color: #648EC0; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Welcome Dinner · Tue Aug 25</p>
        <p style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #0B1937;">Semi-Formal</p>
        <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #444;">Elevated evening wear — suits or tailored jackets for men; cocktail dresses or elegant midi dresses for women. Ties optional. Comfortable and polished.</p>
      </div>

      <div style="margin: 0 0 20px; padding: 16px 20px; border-left: 3px solid #300F0C; background-color: #f9f7f4;">
        <p style="margin: 0 0 6px; font-size: 13px; color: #300F0C; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Ceremony &amp; Reception · Wed Aug 26</p>
        <p style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #0B1937;">Formal — Black Tie Optional</p>
        <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #444;">Timeless and celebratory. Dark suits or tuxedos for men; long evening gowns or formal cocktail dresses for women. Think classic evening elegance.</p>
      </div>

      <div style="margin: 0 0 24px; padding: 16px 20px; border-left: 3px solid #94B1C8; background-color: #f9f7f4;">
        <p style="margin: 0 0 6px; font-size: 13px; color: #648EC0; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Pool Brunch · Thu Aug 27</p>
        <p style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #0B1937;">Smart Casual</p>
        <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #444;">Relaxed and summery — think garden party / resort wear. Comfortable shoes recommended as the venue has outdoor areas.</p>
      </div>

      <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #666; font-style: italic;">Most importantly — wear something that makes you feel confident and ready to celebrate with us! &#127881;</p>
      <p style="margin: 20px 0 0; font-size: 16px; line-height: 1.6;">With love,<br>Carolina &amp; Thomas</p>`,
    textBody:
      "A Note on Dress Code\n\nWelcome Dinner (Tue Aug 25): Semi-Formal — elevated evening wear.\nCeremony & Reception (Wed Aug 26): Formal / Black Tie Optional — classic evening elegance.\nPool Brunch (Thu Aug 27): Smart Casual — relaxed, garden party style.\n\nWith love,\nCarolina & Thomas",
  },
  {
    id: 'getting_there',
    label: '🚗 Getting There',
    subject: "Getting to the Venue — Carolina & Thomas's Wedding",
    htmlBody: `
      <h2 style="margin: 0 0 20px; font-size: 22px; font-weight: normal; color: #0B1937;">Getting to Vallesvilles</h2>
      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6;">The venue is located in <strong>Vallesvilles, Haute-Garonne, France</strong> — a beautiful countryside village about 35 minutes by car from Toulouse.</p>

      <div style="margin: 0 0 20px; padding: 16px 20px; border-left: 3px solid #300F0C; background-color: #f9f7f4;">
        <p style="margin: 0 0 8px; font-size: 15px; font-weight: 600; color: #0B1937;">&#9888;&#65039; No public transport to the venue</p>
        <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #444;">We strongly recommend staying in <strong>Toulouse</strong> (only a 35-min drive) if you're not staying at the venue, so we can help coordinate transportation for you.</p>
      </div>

      <p style="margin: 0 0 12px; font-size: 16px; line-height: 1.6;"><strong>Your options:</strong></p>
      <ul style="margin: 0 0 20px; padding-left: 20px; font-size: 15px; line-height: 1.8; color: #444;">
        <li><strong>Stay at the venue</strong> — limited rooms available at the château, book early</li>
        <li><strong>Stay in Toulouse</strong> — we'll help organize shuttle service for those who indicated interest</li>
        <li><strong>Drive yourself</strong> — parking available at the venue</li>
        <li><strong>Taxi / rideshare</strong> — available from Toulouse (~35 min, €40–60 each way)</li>
      </ul>

      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6;">If your transportation plans have changed or you'd like to be included in shuttle coordination, please reply to this email or contact us at <a href="mailto:carolinaandthomaswedding@gmail.com" style="color: #300F0C;">carolinaandthomaswedding@gmail.com</a>.</p>
      <p style="margin: 20px 0 0; font-size: 16px; line-height: 1.6;">With love,<br>Carolina &amp; Thomas</p>`,
    textBody:
      "Getting to Vallesvilles\n\nThe venue is in Vallesvilles, Haute-Garonne, France — ~35 min by car from Toulouse. There's no public transport to the venue.\n\nOptions:\n- Stay at the venue (limited rooms)\n- Stay in Toulouse + we'll help with shuttle\n- Drive yourself (parking available)\n- Taxi from Toulouse (~35 min, €40-60)\n\nQuestions? carolinaandthomaswedding@gmail.com\n\nWith love,\nCarolina & Thomas",
  },
  {
    id: 'almost_time',
    label: '🎉 Almost Time!',
    subject: "It's Almost Time — We Can't Wait to See You!",
    htmlBody: `
      <h2 style="margin: 0 0 20px; font-size: 22px; font-weight: normal; color: #0B1937;">It's Almost Time!</h2>
      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6;">We are so excited to be getting married in just a few days, and we cannot wait to celebrate with you in the beautiful south of France.</p>
      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6;">Three days, great food, great wine, and the best people we know — it's going to be unforgettable. &#10084;&#65039;</p>
      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6;">If you have any last-minute questions about logistics, transport, or anything else, don't hesitate to reach out at <a href="mailto:carolinaandthomaswedding@gmail.com" style="color: #300F0C;">carolinaandthomaswedding@gmail.com</a>. We're happy to help!</p>
      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6;">See you very soon,</p>
      <p style="margin: 0; font-size: 16px; line-height: 1.6;">With all our love,<br>Carolina &amp; Thomas</p>`,
    textBody:
      "It's Almost Time!\n\nWe are so excited to be getting married in just a few days, and we cannot wait to celebrate with you in the south of France.\n\nThree days, great food, great wine, and the best people we know.\n\nAny last-minute questions? carolinaandthomaswedding@gmail.com\n\nWith all our love,\nCarolina & Thomas",
  },
  {
    id: 'practical_details',
    label: '📋 Practical Details',
    subject: 'A Few Practical Notes Before the Big Day',
    htmlBody: `
      <h2 style="margin: 0 0 20px; font-size: 22px; font-weight: normal; color: #0B1937;">A Few Practical Notes</h2>
      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6;">As the big day approaches, we wanted to share a few practical details to help you prepare:</p>
      <ul style="margin: 0 0 24px; padding-left: 20px; font-size: 15px; line-height: 2; color: #444;">
        <li>&#127775; <strong>[Add your note here]</strong></li>
        <li>&#127775; <strong>[Add your note here]</strong></li>
        <li>&#127775; <strong>[Add your note here]</strong></li>
      </ul>
      <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6;">As always, feel free to reach out at <a href="mailto:carolinaandthomaswedding@gmail.com" style="color: #300F0C;">carolinaandthomaswedding@gmail.com</a> if you have any questions.</p>
      <p style="margin: 20px 0 0; font-size: 16px; line-height: 1.6;">With love,<br>Carolina &amp; Thomas</p>`,
    textBody:
      "A Few Practical Notes\n\n- [Add your note here]\n- [Add your note here]\n- [Add your note here]\n\nQuestions? carolinaandthomaswedding@gmail.com\n\nWith love,\nCarolina & Thomas",
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
  const [customizeMessage, setCustomizeMessage] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState('')
  const [recipientFilter, setRecipientFilter] = useState(DEFAULT_FILTER['rsvp_reminder'])
  const [sending, setSending] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [result, setResult] = useState<{
    sent: number
    failed: number
    results?: Array<{ email: string; success: boolean; error?: string }>
  } | null>(null)
  const [dryRunData, setDryRunData] = useState<DryRunData | null>(null)
  const { filteredRsvps, selectedIds, isLoading, getEffectiveLocale } = adminData
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isOpen: isPreviewOpen, onOpen: onPreviewOpen, onClose: onPreviewClose } = useDisclosure()
  const toast = useToast()

  const handleTypeChange = (newType: ReminderType) => {
    setType(newType)
    setRecipientFilter(DEFAULT_FILTER[newType])
    setCustomizeMessage(false)
    setSelectedPreset('')
    setCustomSubject('')
    setCustomBody('')
    setCustomText('')
  }

  const applyPreset = (presetId: string) => {
    const preset = PRESET_TEMPLATES.find((p) => p.id === presetId)
    if (!preset) return
    setSelectedPreset(presetId)
    setCustomSubject(preset.subject)
    setCustomBody(preset.htmlBody)
    setCustomText(preset.textBody)
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
    if (type === 'custom' || (customizeMessage && customSubject && customBody)) {
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

      setResult({ sent: data.sent, failed: data.failed, results: data.results })
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

  // custom type: both subject+body required
  // non-custom with customize toggled: both must be filled, or neither (partial = invalid)
  const isCustomValid =
    type === 'custom'
      ? !!(customSubject && customBody)
      : !customizeMessage || (customizeMessage && ((!customSubject && !customBody) || (customSubject && customBody)))

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

        {/* Customize toggle for non-custom types */}
        {type !== 'custom' && (
          <Box bg="white" rounded="xl" p={5} shadow="sm" border="1px solid" borderColor="gray.100">
            <Checkbox
              isChecked={customizeMessage}
              onChange={(e) => {
                setCustomizeMessage(e.target.checked)
                if (!e.target.checked) {
                  setCustomSubject('')
                  setCustomBody('')
                  setCustomText('')
                  setSelectedPreset('')
                }
              }}
              colorScheme="blue"
              fontWeight="medium"
              fontSize="sm"
            >
              Customize message
            </Checkbox>
            {customizeMessage && (
              <Box mt={4}>
                <Divider mb={4} />
                <ComposeFields
                  subject={customSubject}
                  body={customBody}
                  text={customText}
                  selectedPreset={selectedPreset}
                  onSubjectChange={setCustomSubject}
                  onBodyChange={setCustomBody}
                  onTextChange={setCustomText}
                  onApplyPreset={applyPreset}
                  required={false}
                />
              </Box>
            )}
          </Box>
        )}

        {/* Custom type compose fields */}
        {type === 'custom' && (
          <Box bg="white" rounded="xl" p={5} shadow="sm" border="1px solid" borderColor="gray.100">
            <ComposeFields
              subject={customSubject}
              body={customBody}
              text={customText}
              selectedPreset={selectedPreset}
              onSubjectChange={setCustomSubject}
              onBodyChange={setCustomBody}
              onTextChange={setCustomText}
              onApplyPreset={applyPreset}
              required
            />
          </Box>
        )}

        {/* Result */}
        {result && (
          <Box>
            <Alert
              status={result.failed > 0 ? 'warning' : 'success'}
              rounded="xl"
            >
              <AlertIcon />
              Sent {result.sent} reminders
              {result.failed > 0 && `, ${result.failed} failed`}
            </Alert>
            {result.failed > 0 && (result.results?.filter((r) => !r.success).length ?? 0) > 0 && (
              <Box bg="red.50" border="1px solid" borderColor="red.200" rounded="lg" p={3} mt={2} maxH="200px" overflowY="auto">
                <Text fontSize="xs" fontWeight="semibold" color="red.700" mb={1}>Failed recipients:</Text>
                <VStack align="stretch" spacing={1}>
                  {result.results!.filter((r) => !r.success).map((r) => (
                    <Text key={r.email} fontSize="xs" color="red.700" wordBreak="break-word">
                      <strong>{r.email}</strong>{r.error ? ` — ${r.error}` : ''}
                    </Text>
                  ))}
                </VStack>
              </Box>
            )}
          </Box>
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

// ── Shared compose UI ────────────────────────────────────────────────────────
interface ComposeFieldsProps {
  subject: string
  body: string
  text: string
  selectedPreset: string
  required: boolean
  onSubjectChange: (v: string) => void
  onBodyChange: (v: string) => void
  onTextChange: (v: string) => void
  onApplyPreset: (id: string) => void
}

function ComposeFields({
  subject,
  body,
  text,
  selectedPreset,
  required,
  onSubjectChange,
  onBodyChange,
  onTextChange,
  onApplyPreset,
}: ComposeFieldsProps) {
  return (
    <VStack spacing={4} align="stretch">
      {/* Quick-fill preset picker */}
      <FormControl>
        <FormLabel fontSize="sm">
          Quick-fill from a template
          <Text as="span" fontSize="xs" color="gray.400" fontWeight="normal" ml={1}>
            (optional — fully editable after selection)
          </Text>
        </FormLabel>
        <Select
          value={selectedPreset}
          onChange={(e) => onApplyPreset(e.target.value)}
          placeholder="Choose a template…"
          size="sm"
          focusBorderColor="primary.deep"
        >
          {PRESET_TEMPLATES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </Select>
      </FormControl>

      <Divider />

      <FormControl isRequired={required}>
        <FormLabel fontSize="sm">Subject</FormLabel>
        <Input
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          placeholder="Reminder subject…"
          focusBorderColor="primary.deep"
        />
      </FormControl>

      <FormControl isRequired={required}>
        <FormLabel fontSize="sm">
          HTML Body
          <Text as="span" fontSize="xs" color="gray.400" fontWeight="normal" ml={1}>
            (inner content only — the email wrapper is added automatically)
          </Text>
        </FormLabel>
        <Textarea
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          placeholder="<p>Your message…</p>"
          rows={10}
          fontFamily="mono"
          fontSize="sm"
          focusBorderColor="primary.deep"
        />
      </FormControl>

      <FormControl>
        <FormLabel fontSize="sm">Plain Text (optional)</FormLabel>
        <Textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Plain text fallback…"
          rows={4}
          fontSize="sm"
          focusBorderColor="primary.deep"
        />
      </FormControl>
    </VStack>
  )
}
