import { useEffect, useState } from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
  VStack,
  HStack,
  Button,
  IconButton,
  Text,
  useToast,
} from '@chakra-ui/react'
import { CloseIcon } from '@chakra-ui/icons'
import type { AdminRsvp } from './useAdminRsvps'

interface AddPartyModalProps {
  isOpen: boolean
  onClose: () => void
  /** Party being edited, or null/undefined when adding a new one. */
  editingParty?: AdminRsvp | null
  onAdd: (firstName: string, email: string, guestNames: string[]) => Promise<boolean>
  onUpdate: (id: string, firstName: string, email: string, guestNames: string[]) => Promise<boolean>
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function AddPartyModal({ isOpen, onClose, editingParty, onAdd, onUpdate }: AddPartyModalProps) {
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [guestNames, setGuestNames] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const toast = useToast()

  const isEditMode = Boolean(editingParty)

  useEffect(() => {
    if (!isOpen) return
    if (editingParty) {
      setFirstName(editingParty.firstName)
      setEmail(editingParty.email)
      setGuestNames(editingParty.guests.map((g) => g.name))
    } else {
      setFirstName('')
      setEmail('')
      setGuestNames([])
    }
  }, [isOpen, editingParty])

  const handleAddGuestRow = () => {
    setGuestNames((prev) => [...prev, ''])
  }

  const handleGuestNameChange = (index: number, value: string) => {
    setGuestNames((prev) => prev.map((n, i) => (i === index ? value : n)))
  }

  const handleRemoveGuestRow = (index: number) => {
    setGuestNames((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    const trimmedFirstName = firstName.trim()
    const trimmedEmail = email.trim().toLowerCase()

    if (!trimmedFirstName) {
      toast({ title: 'Enter a first name', status: 'error', duration: 4000 })
      return
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      toast({ title: 'Enter a valid email address', status: 'error', duration: 4000 })
      return
    }

    const sanitizedGuestNames = guestNames.map((n) => n.trim()).filter(Boolean)

    setIsSaving(true)
    const success = editingParty
      ? await onUpdate(editingParty.id, trimmedFirstName, trimmedEmail, sanitizedGuestNames)
      : await onAdd(trimmedFirstName, trimmedEmail, sanitizedGuestNames)
    setIsSaving(false)

    if (success) {
      toast({ title: isEditMode ? 'Party updated' : 'Party added', status: 'success', duration: 3000 })
      onClose()
    } else {
      toast({ title: isEditMode ? 'Failed to update party' : 'Failed to add party', status: 'error', duration: 4000 })
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader fontFamily="heading" color="secondary.navy">
          {isEditMode ? 'Edit Party' : 'Add Party'}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack align="stretch" spacing={4}>
            <Text fontSize="sm" color="gray.500">
              Manually add a party who hasn&apos;t submitted the RSVP form so you can send them the Final RSVP invitation.
            </Text>

            <FormControl isRequired>
              <FormLabel fontSize="sm">First Name</FormLabel>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jane"
                focusBorderColor="primary.deep"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel fontSize="sm">Email</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                focusBorderColor="primary.deep"
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm">Additional Guests</FormLabel>
              <VStack align="stretch" spacing={2}>
                {guestNames.map((name, i) => (
                  <HStack key={i}>
                    <Input
                      size="sm"
                      value={name}
                      onChange={(e) => handleGuestNameChange(i, e.target.value)}
                      placeholder="Guest name"
                    />
                    <IconButton
                      aria-label="Remove guest"
                      icon={<CloseIcon boxSize={2.5} />}
                      size="xs"
                      variant="ghost"
                      onClick={() => handleRemoveGuestRow(i)}
                    />
                  </HStack>
                ))}
                <Button size="xs" variant="outline" alignSelf="flex-start" onClick={handleAddGuestRow}>
                  + Add Guest
                </Button>
              </VStack>
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose} isDisabled={isSaving}>
            Cancel
          </Button>
          <Button
            bg="secondary.navy"
            color="neutral.cream"
            _hover={{ bg: 'secondary.maroon' }}
            onClick={handleSave}
            isLoading={isSaving}
          >
            {isEditMode ? 'Save Changes' : 'Add Party'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
