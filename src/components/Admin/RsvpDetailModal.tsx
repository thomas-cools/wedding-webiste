import { useState } from 'react'
import {
  Box,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Text,
  VStack,
  HStack,
  Badge,
  Divider,
  SimpleGrid,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Wrap,
  WrapItem,
  Tag,
  Tooltip,
  Alert,
  AlertIcon,
  Button,
  IconButton,
  Input,
  useToast,
} from '@chakra-ui/react'
import { WarningIcon, CloseIcon } from '@chakra-ui/icons'
import type { AdminRsvp, AdminDrinkPrefs, EmailOpen, EditableGuest } from './useAdminRsvps'

interface RsvpDetailModalProps {
  rsvp: AdminRsvp | null
  isOpen: boolean
  onClose: () => void
  drinkPrefs?: AdminDrinkPrefs[]
  emailOpens?: EmailOpen[]
  onGuestsUpdated?: (email: string, guests: EditableGuest[]) => Promise<boolean>
  onEmailUpdated?: (id: string, oldEmail: string, newEmail: string) => Promise<boolean>
}

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

const eventLabels: Record<string, string> = {
  welcome: 'Tuesday Welcome Dinner',
  ceremony: 'Wednesday Ceremony & Reception',
  brunch: 'Thursday Brunch',
}

const eventAnswerLabels: Record<string, string> = {
  yes: 'Yes',
  no: 'No',
  arriving_late: 'Arriving late',
  '': 'Not specified',
}

export function RsvpDetailModal({ rsvp, isOpen, onClose, drinkPrefs, emailOpens, onGuestsUpdated, onEmailUpdated }: RsvpDetailModalProps) {
  const [isEditingGuests, setIsEditingGuests] = useState(false)
  const [editedGuests, setEditedGuests] = useState<EditableGuest[]>([])
  const [isSavingGuests, setIsSavingGuests] = useState(false)
  const [isEditingEmail, setIsEditingEmail] = useState(false)
  const [editedEmail, setEditedEmail] = useState('')
  const [isSavingEmail, setIsSavingEmail] = useState(false)
  const toast = useToast()

  if (!rsvp) return null

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  const handleStartEditEmail = () => {
    setEditedEmail(rsvp.email)
    setIsEditingEmail(true)
  }

  const handleCancelEditEmail = () => {
    setIsEditingEmail(false)
  }

  const handleSaveEmail = async () => {
    if (!onEmailUpdated) return
    const trimmed = editedEmail.trim().toLowerCase()
    if (!EMAIL_REGEX.test(trimmed)) {
      toast({ title: 'Enter a valid email address', status: 'error', duration: 4000 })
      return
    }

    setIsSavingEmail(true)
    const success = await onEmailUpdated(rsvp.id, rsvp.email, trimmed)
    setIsSavingEmail(false)

    if (success) {
      toast({ title: 'Email updated', status: 'success', duration: 3000 })
      setIsEditingEmail(false)
    } else {
      toast({ title: 'Failed to update email', status: 'error', duration: 4000 })
    }
  }

  const handleStartEdit = () => {
    setEditedGuests(rsvp.guests.map((g) => ({ name: g.name, age: g.age, dietary: g.dietary })))
    setIsEditingGuests(true)
  }

  const handleCancelEdit = () => {
    setIsEditingGuests(false)
  }

  const handleGuestFieldChange = (index: number, field: keyof EditableGuest, value: string) => {
    setEditedGuests((prev) => prev.map((g, i) => (i === index ? { ...g, [field]: value } : g)))
  }

  const handleAddGuestRow = () => {
    setEditedGuests((prev) => [...prev, { name: '' }])
  }

  const handleRemoveGuestRow = (index: number) => {
    setEditedGuests((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSaveGuests = async () => {
    if (!onGuestsUpdated) return
    const sanitized = editedGuests
      .map((g) => ({
        name: g.name.trim(),
        age: g.age?.trim() || undefined,
        dietary: g.dietary?.trim() || undefined,
      }))
      .filter((g) => g.name)

    setIsSavingGuests(true)
    const success = await onGuestsUpdated(rsvp.email, sanitized)
    setIsSavingGuests(false)

    if (success) {
      toast({ title: 'Guest list updated', status: 'success', duration: 3000 })
      setIsEditingGuests(false)
    } else {
      toast({ title: 'Failed to update guest list', status: 'error', duration: 4000 })
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader fontFamily="heading" color="secondary.navy">
          {rsvp.firstName}
          <Badge
            ml={3}
            colorScheme={likelihoodColors[rsvp.likelihood] || 'gray'}
            fontSize="xs"
          >
            {likelihoodLabels[rsvp.likelihood] || rsvp.likelihood}
          </Badge>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack align="stretch" spacing={5}>
            {(rsvp.matchedAsGuestIn?.length ?? 0) > 0 && (
              <Alert status="warning" rounded="md" fontSize="sm">
                <AlertIcon />
                {rsvp.firstName} may already be counted as a guest in another RSVP submission.
              </Alert>
            )}
            {/* Contact Info */}
            <Box>
              <Text fontWeight="bold" fontSize="sm" color="neutral.muted" mb={1}>
                Contact
              </Text>
              <SimpleGrid columns={2} spacing={2} fontSize="sm" alignItems="center">
                <Text color="gray.600">Email</Text>
                {isEditingEmail ? (
                  <HStack spacing={1}>
                    <Input
                      size="xs"
                      value={editedEmail}
                      onChange={(e) => setEditedEmail(e.target.value)}
                      autoFocus
                    />
                    <Button size="xs" colorScheme="blue" onClick={handleSaveEmail} isLoading={isSavingEmail}>
                      Save
                    </Button>
                    <Button size="xs" variant="ghost" onClick={handleCancelEditEmail} isDisabled={isSavingEmail}>
                      Cancel
                    </Button>
                  </HStack>
                ) : (
                  <HStack spacing={2}>
                    <Text>{rsvp.email}</Text>
                    {rsvp.emailCorrectedAt && (
                      <Tooltip label={`Corrected ${new Date(rsvp.emailCorrectedAt).toLocaleString()}`}>
                        <Badge colorScheme="purple" fontSize="2xs">Corrected</Badge>
                      </Tooltip>
                    )}
                    {onEmailUpdated && (
                      <Button size="xs" variant="link" onClick={handleStartEditEmail}>
                        Edit
                      </Button>
                    )}
                  </HStack>
                )}
                {rsvp.mailingAddress && (
                  <>
                    <Text color="gray.600">Address</Text>
                    <Text>{rsvp.mailingAddress}</Text>
                  </>
                )}
              </SimpleGrid>
            </Box>

            <Divider />

            {/* Events */}
            {rsvp.events && (
              <Box>
                <Text fontWeight="bold" fontSize="sm" color="neutral.muted" mb={2}>
                  Events
                </Text>
                <VStack align="stretch" spacing={1}>
                  {Object.entries(rsvp.events).map(([key, value]) => (
                    <HStack key={key} justify="space-between" fontSize="sm">
                      <Text>{eventLabels[key] || key}</Text>
                      <Badge
                        colorScheme={value === 'yes' ? 'green' : value === 'no' ? 'red' : 'gray'}
                        variant="subtle"
                      >
                        {eventAnswerLabels[value] || value || 'N/A'}
                      </Badge>
                    </HStack>
                  ))}
                </VStack>
              </Box>
            )}

            <Divider />

            {/* Party */}
            <Box>
              <HStack justify="space-between" mb={2}>
                <HStack spacing={2}>
                  <Text fontWeight="bold" fontSize="sm" color="neutral.muted">
                    Party ({1 + rsvp.guests.length} {rsvp.guests.length === 0 ? 'person' : 'people'})
                  </Text>
                  {rsvp.guestsManuallyEditedAt && (
                    <Tooltip label={`Manually edited ${new Date(rsvp.guestsManuallyEditedAt).toLocaleString()}`}>
                      <Badge colorScheme="purple" fontSize="2xs">Edited</Badge>
                    </Tooltip>
                  )}
                </HStack>
                {onGuestsUpdated && !isEditingGuests && (
                  <Button size="xs" variant="outline" onClick={handleStartEdit}>
                    Edit Guests
                  </Button>
                )}
              </HStack>

              {isEditingGuests ? (
                <VStack align="stretch" spacing={2}>
                  <Table size="sm" variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Name</Th>
                        <Th>Age</Th>
                        <Th>Dietary</Th>
                        <Th w="1"></Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      <Tr>
                        <Td fontWeight="medium">{rsvp.firstName} (primary)</Td>
                        <Td>-</Td>
                        <Td>{rsvp.dietary || '-'}</Td>
                        <Td></Td>
                      </Tr>
                      {editedGuests.map((g, i) => (
                        <Tr key={i}>
                          <Td>
                            <Input
                              size="sm"
                              value={g.name}
                              onChange={(e) => handleGuestFieldChange(i, 'name', e.target.value)}
                              placeholder="Guest name"
                            />
                          </Td>
                          <Td>
                            <Input
                              size="sm"
                              w="70px"
                              value={g.age || ''}
                              onChange={(e) => handleGuestFieldChange(i, 'age', e.target.value)}
                              placeholder="Age"
                            />
                          </Td>
                          <Td>
                            <Input
                              size="sm"
                              value={g.dietary || ''}
                              onChange={(e) => handleGuestFieldChange(i, 'dietary', e.target.value)}
                              placeholder="Dietary"
                            />
                          </Td>
                          <Td>
                            <IconButton
                              aria-label="Remove guest"
                              icon={<CloseIcon boxSize={2.5} />}
                              size="xs"
                              variant="ghost"
                              onClick={() => handleRemoveGuestRow(i)}
                            />
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                  <HStack>
                    <Button size="xs" variant="outline" onClick={handleAddGuestRow}>
                      + Add Guest
                    </Button>
                    <HStack ml="auto">
                      <Button size="xs" variant="ghost" onClick={handleCancelEdit} isDisabled={isSavingGuests}>
                        Cancel
                      </Button>
                      <Button size="xs" colorScheme="blue" onClick={handleSaveGuests} isLoading={isSavingGuests}>
                        Save
                      </Button>
                    </HStack>
                  </HStack>
                </VStack>
              ) : rsvp.guests.length > 0 ? (
                <Table size="sm" variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Name</Th>
                      <Th>Age</Th>
                      <Th>Dietary</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    <Tr>
                      <Td fontWeight="medium">{rsvp.firstName} (primary)</Td>
                      <Td>-</Td>
                      <Td>{rsvp.dietary || '-'}</Td>
                    </Tr>
                    {rsvp.guests.map((g, i) => (
                      <Tr key={i}>
                        <Td>
                          <HStack spacing={1}>
                            <Text>{g.name}</Text>
                            {g.isDuplicate && (
                              <Tooltip
                                label={`May be double-counted \u2014 also RSVP'd separately (${g.duplicateOfEmail})`}
                              >
                                <WarningIcon color="red.500" boxSize={3} />
                              </Tooltip>
                            )}
                          </HStack>
                        </Td>
                        <Td>{g.age || '-'}</Td>
                        <Td>{g.dietary || '-'}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              ) : (
                <Text fontSize="sm" color="gray.500">
                  No additional guests
                </Text>
              )}
            </Box>

            <Divider />

            {/* Details */}
            <SimpleGrid columns={2} spacing={2} fontSize="sm">
              <Text color="gray.600">Accommodation</Text>
              <Text>{rsvp.accommodation || 'Not specified'}</Text>
              <Text color="gray.600">Travel Plan</Text>
              <Text>{rsvp.travelPlan || 'Not specified'}</Text>
              <Text color="gray.600">France Tips</Text>
              <Text>{rsvp.franceTips ? 'Yes' : 'No'}</Text>
              <Text color="gray.600">Submitted</Text>
              <Text>{new Date(rsvp.submittedAt).toLocaleString()}</Text>
              <Text color="gray.600">Locale</Text>
              <Text>{(rsvp.locale || 'en').toUpperCase()}</Text>
            </SimpleGrid>

            {rsvp.additionalNotes && (
              <>
                <Divider />
                <Box>
                  <Text fontWeight="bold" fontSize="sm" color="neutral.muted" mb={1}>
                    Additional Notes
                  </Text>
                  <Text fontSize="sm" whiteSpace="pre-wrap">
                    {rsvp.additionalNotes}
                  </Text>
                </Box>
              </>
            )}

            {/* Drink Preferences */}
            {drinkPrefs && drinkPrefs.length > 0 && (
              <>
                <Divider />
                <Box>
                  <Text fontWeight="bold" fontSize="sm" color="neutral.muted" mb={2}>
                    Drink Preferences ({drinkPrefs.length} {drinkPrefs.length === 1 ? 'guest' : 'guests'})
                  </Text>
                  <VStack align="stretch" spacing={4}>
                    {drinkPrefs.map((dp) => (
                      <Box key={dp.id} pl={drinkPrefs.length > 1 ? 3 : 0} borderLeftWidth={drinkPrefs.length > 1 ? '2px' : 0} borderColor="purple.200">
                        {drinkPrefs.length > 1 && (
                          <Text fontSize="sm" fontWeight="semibold" mb={1}>
                            {dp.guestName || dp.firstName}
                          </Text>
                        )}
                        <VStack align="stretch" spacing={1}>
                          {dp.wine.length > 0 && (
                            <HStack>
                              <Text fontSize="sm" color="gray.600" minW="90px">Wine</Text>
                              <Wrap spacing={1}>
                                {dp.wine.map((w) => (
                                  <WrapItem key={w}>
                                    <Tag size="sm" colorScheme="red" variant="subtle">{w}</Tag>
                                  </WrapItem>
                                ))}
                              </Wrap>
                            </HStack>
                          )}
                          {dp.beer.length > 0 && (
                            <HStack>
                              <Text fontSize="sm" color="gray.600" minW="90px">Beer</Text>
                              <Wrap spacing={1}>
                                {dp.beer.map((b) => (
                                  <WrapItem key={b}>
                                    <Tag size="sm" colorScheme="yellow" variant="subtle">{b}</Tag>
                                  </WrapItem>
                                ))}
                              </Wrap>
                            </HStack>
                          )}
                          {dp.cocktail.length > 0 && (
                            <HStack>
                              <Text fontSize="sm" color="gray.600" minW="90px">Cocktail</Text>
                              <Wrap spacing={1}>
                                {dp.cocktail.map((c) => (
                                  <WrapItem key={c}>
                                    <Tag size="sm" colorScheme="purple" variant="subtle">{c}</Tag>
                                  </WrapItem>
                                ))}
                              </Wrap>
                            </HStack>
                          )}
                          {dp.favoriteCocktail && (
                            <HStack>
                              <Text fontSize="sm" color="gray.600" minW="90px">Favorite</Text>
                              <Text fontSize="sm">{dp.favoriteCocktail}</Text>
                            </HStack>
                          )}
                          {dp.nonAlcoholic.length > 0 && (
                            <HStack>
                              <Text fontSize="sm" color="gray.600" minW="90px">Non-Alc</Text>
                              <Wrap spacing={1}>
                                {dp.nonAlcoholic.map((n) => (
                                  <WrapItem key={n}>
                                    <Tag size="sm" colorScheme="green" variant="subtle">{n}</Tag>
                                  </WrapItem>
                                ))}
                              </Wrap>
                            </HStack>
                          )}
                          {dp.comments && (
                            <HStack align="start">
                              <Text fontSize="sm" color="gray.600" minW="90px">Comments</Text>
                              <Text fontSize="sm" whiteSpace="pre-wrap">{dp.comments}</Text>
                            </HStack>
                          )}
                          <Text fontSize="2xs" color="gray.400">
                            Submitted {new Date(dp.submittedAt).toLocaleString()}
                          </Text>
                        </VStack>
                      </Box>
                    ))}
                  </VStack>
                </Box>
              </>
            )}

            {/* Email Opens */}
            {emailOpens && emailOpens.length > 0 && (
              <>
                <Divider />
                <Box>
                  <Text fontWeight="bold" fontSize="sm" color="neutral.muted" mb={2}>
                    Email Opens ({emailOpens.length})
                  </Text>
                  <Table size="sm" variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Campaign</Th>
                        <Th>Opened At</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {emailOpens.map((eo) => (
                        <Tr key={eo.id}>
                          <Td>
                            <Badge colorScheme="blue" variant="subtle" fontSize="2xs">
                              {eo.campaign.replace(/_/g, ' ')}
                            </Badge>
                          </Td>
                          <Td fontSize="xs" color="gray.600">
                            {new Date(eo.openedAt).toLocaleString()}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              </>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
