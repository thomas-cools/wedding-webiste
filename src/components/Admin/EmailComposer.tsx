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
  Text,
  VStack,
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
  Textarea,
} from '@chakra-ui/react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import { getAdminAuthHeaders } from '../../utils/adminAuth'
import { useAdminRsvps, type AdminRsvp } from './useAdminRsvps'

function EditorToolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null

  const btnStyle = (isActive: boolean) => ({
    size: 'xs' as const,
    variant: isActive ? 'solid' : 'ghost' as const,
    colorScheme: isActive ? 'blue' : undefined,
  })

  return (
    <Flex
      wrap="wrap"
      gap={1}
      p={2}
      borderBottom="1px solid"
      borderColor="gray.200"
      bg="gray.50"
      roundedTop="md"
    >
      <Button
        {...btnStyle(editor.isActive('bold'))}
        onClick={() => editor.chain().focus().toggleBold().run()}
        fontWeight="bold"
      >
        B
      </Button>
      <Button
        {...btnStyle(editor.isActive('italic'))}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        fontStyle="italic"
      >
        I
      </Button>
      <Button
        {...btnStyle(editor.isActive('underline'))}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        textDecor="underline"
      >
        U
      </Button>
      <Box w="1px" bg="gray.300" mx={1} alignSelf="stretch" />
      <Button
        {...btnStyle(editor.isActive('heading', { level: 2 }))}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </Button>
      <Button
        {...btnStyle(editor.isActive('heading', { level: 3 }))}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        H3
      </Button>
      <Box w="1px" bg="gray.300" mx={1} alignSelf="stretch" />
      <Button
        {...btnStyle(editor.isActive('bulletList'))}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        • List
      </Button>
      <Button
        {...btnStyle(editor.isActive('orderedList'))}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1. List
      </Button>
      <Box w="1px" bg="gray.300" mx={1} alignSelf="stretch" />
      <Button
        {...btnStyle(editor.isActive({ textAlign: 'left' }))}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
      >
        ←
      </Button>
      <Button
        {...btnStyle(editor.isActive({ textAlign: 'center' }))}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
      >
        ↔
      </Button>
      <Button
        {...btnStyle(editor.isActive({ textAlign: 'right' }))}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
      >
        →
      </Button>
      <Box w="1px" bg="gray.300" mx={1} alignSelf="stretch" />
      <Button
        size="xs"
        variant="ghost"
        onClick={() => {
          const url = window.prompt('Enter URL:')
          if (url) {
            editor.chain().focus().setLink({ href: url }).run()
          }
        }}
      >
        🔗 Link
      </Button>
    </Flex>
  )
}

export function EmailComposer() {
  const [subject, setSubject] = useState('')
  const [textBody, setTextBody] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null)
  const { filteredRsvps, isLoading } = useAdminRsvps()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: '<p>Dear guests,</p><p></p><p>With love,<br>Carolina & Thomas</p>',
  })

  const confirmedRecipients = filteredRsvps.filter(
    (r) => r.likelihood === 'definitely' || r.likelihood === 'highly_likely'
  )

  const handleSend = async () => {
    if (!editor || !subject) return

    const htmlBody = editor.getHTML()
    const recipients = confirmedRecipients.map((r: AdminRsvp) => ({
      email: r.email,
      name: r.firstName,
    }))

    setSending(true)
    setResult(null)

    try {
      const res = await fetch('/api/admin-send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders(),
        },
        body: JSON.stringify({
          recipients,
          subject,
          htmlBody,
          textBody: textBody || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast({
          title: 'Failed to send emails',
          description: data.error,
          status: 'error',
          duration: 5000,
        })
        return
      }

      setResult({ sent: data.sent, failed: data.failed })
      toast({
        title: `Sent ${data.sent} emails`,
        description: data.failed > 0 ? `${data.failed} failed` : undefined,
        status: data.failed > 0 ? 'warning' : 'success',
        duration: 5000,
      })
    } catch {
      toast({
        title: 'Network error',
        status: 'error',
        duration: 5000,
      })
    } finally {
      setSending(false)
      onClose()
    }
  }

  return (
    <Box>
      <Heading size="md" fontFamily="heading" color="secondary.navy" mb={4}>
        Compose Email
      </Heading>

      <VStack spacing={4} align="stretch">
        <Box bg="white" rounded="xl" p={5} shadow="sm" border="1px solid" borderColor="gray.100">
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel fontSize="sm">Subject</FormLabel>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject..."
                focusBorderColor="primary.deep"
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm">Body (Rich Text)</FormLabel>
              <Box
                border="1px solid"
                borderColor="gray.200"
                rounded="md"
                overflow="hidden"
              >
                <EditorToolbar editor={editor} />
                <Box
                  p={4}
                  minH="200px"
                  sx={{
                    '.ProseMirror': {
                      outline: 'none',
                      minH: '180px',
                      '& p': { mb: 2 },
                      '& h2': { fontSize: 'xl', fontWeight: 'bold', mb: 2 },
                      '& h3': { fontSize: 'lg', fontWeight: 'bold', mb: 2 },
                      '& ul, & ol': { pl: 6, mb: 2 },
                      '& a': { color: 'blue.500', textDecor: 'underline' },
                    },
                  }}
                >
                  <EditorContent editor={editor} />
                </Box>
              </Box>
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm">Plain Text Fallback (optional)</FormLabel>
              <Textarea
                value={textBody}
                onChange={(e) => setTextBody(e.target.value)}
                placeholder="Plain text version for email clients without HTML support..."
                rows={3}
                fontSize="sm"
              />
            </FormControl>
          </VStack>
        </Box>

        {result && (
          <Alert
            status={result.failed > 0 ? 'warning' : 'success'}
            rounded="xl"
          >
            <AlertIcon />
            Sent {result.sent} emails
            {result.failed > 0 && `, ${result.failed} failed`}
          </Alert>
        )}

        <Flex justify="space-between" align="center">
          <Text fontSize="sm" color="gray.500">
            {isLoading
              ? 'Loading recipients...'
              : `${confirmedRecipients.length} confirmed recipients`}
          </Text>
          <Button
            bg="secondary.navy"
            color="neutral.cream"
            _hover={{ bg: 'secondary.maroon' }}
            isDisabled={!subject || !editor || confirmedRecipients.length === 0}
            onClick={onOpen}
          >
            Review & Send
          </Button>
        </Flex>
      </VStack>

      {/* Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader fontFamily="heading">Confirm Send</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              Send <strong>"{subject}"</strong> to{' '}
              <strong>{confirmedRecipients.length}</strong> confirmed
              guest{confirmedRecipients.length !== 1 ? 's' : ''}?
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
              Send Emails
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}
