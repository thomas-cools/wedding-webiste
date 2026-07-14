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
} from '@chakra-ui/react'
import { WarningIcon } from '@chakra-ui/icons'
import type { AdminRsvp, AdminDrinkPrefs, EmailOpen } from './useAdminRsvps'

interface RsvpDetailModalProps {
  rsvp: AdminRsvp | null
  isOpen: boolean
  onClose: () => void
  drinkPrefs?: AdminDrinkPrefs[]
  emailOpens?: EmailOpen[]
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

export function RsvpDetailModal({ rsvp, isOpen, onClose, drinkPrefs, emailOpens }: RsvpDetailModalProps) {
  if (!rsvp) return null

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
              <SimpleGrid columns={2} spacing={2} fontSize="sm">
                <Text color="gray.600">Email</Text>
                <Text>{rsvp.email}</Text>
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
              <Text fontWeight="bold" fontSize="sm" color="neutral.muted" mb={2}>
                Party ({1 + rsvp.guests.length} {rsvp.guests.length === 0 ? 'person' : 'people'})
              </Text>
              {rsvp.guests.length > 0 ? (
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
