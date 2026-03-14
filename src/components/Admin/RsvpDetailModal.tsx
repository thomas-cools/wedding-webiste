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
} from '@chakra-ui/react'
import type { AdminRsvp } from './useAdminRsvps'

interface RsvpDetailModalProps {
  rsvp: AdminRsvp | null
  isOpen: boolean
  onClose: () => void
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
  welcome: 'Friday Welcome Dinner',
  ceremony: 'Saturday Ceremony & Reception',
  brunch: 'Sunday Brunch',
}

const eventAnswerLabels: Record<string, string> = {
  yes: 'Yes',
  no: 'No',
  arriving_late: 'Arriving late',
  '': 'Not specified',
}

export function RsvpDetailModal({ rsvp, isOpen, onClose }: RsvpDetailModalProps) {
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
                        <Td>{g.name}</Td>
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
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
