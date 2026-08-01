import { useState } from 'react'
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Text,
  useToast,
  VStack,
} from '@chakra-ui/react'
import { getAdminAuthHeaders } from '../../utils/adminAuth'

interface LinkResponse {
  ok: boolean
  url?: string
  expiresAt?: string
  expiresIn?: number
  error?: string
}

export function SpeechesLinkPanel() {
  const [link, setLink] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin-speeches-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders(),
        },
        body: JSON.stringify({}),
      })
      const data: LinkResponse = await res.json()
      if (!res.ok || !data.ok || !data.url) {
        toast({ title: 'Failed to generate link', description: data.error, status: 'error', duration: 5000 })
        return
      }

      setLink(data.url)
      setExpiresAt(data.expiresAt || '')
      await navigator.clipboard.writeText(data.url)
      toast({ title: 'Speeches link generated', description: 'Copied to clipboard', status: 'success', duration: 4000 })
    } catch {
      toast({ title: 'Network error', status: 'error', duration: 5000 })
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      toast({ title: 'Link copied', status: 'success', duration: 3000 })
    } catch {
      toast({ title: 'Could not copy link', status: 'error', duration: 3000 })
    }
  }

  return (
    <Box>
      <Heading size="md" fontFamily="heading" color="secondary.navy" mb={4}>
        Speeches Link
      </Heading>

      <VStack spacing={4} align="stretch">
        <Box bg="white" rounded="xl" p={5} shadow="sm" border="1px solid" borderColor="gray.100">
          <Text fontSize="sm" color="gray.500" mb={4}>
            Generate a reusable 2-hour link for the speeches page. The link uses the same site password session as the rest of the protected site.
          </Text>

          <HStack align="end" spacing={4} flexWrap="wrap">
            <FormControl flex={1} minW="280px">
              <FormLabel fontSize="sm" fontWeight="medium">Copyable URL</FormLabel>
              <Input value={link} readOnly placeholder="Generate a link to see it here" fontFamily="mono" size="sm" />
            </FormControl>
            <Button onClick={handleGenerate} isLoading={loading} bg="secondary.navy" color="neutral.cream" _hover={{ bg: 'secondary.maroon' }}>
              Generate Link
            </Button>
            <Button variant="outline" onClick={handleCopy} isDisabled={!link}>
              Copy URL
            </Button>
          </HStack>

          {expiresAt && (
            <Alert status="info" rounded="md" mt={4} fontSize="sm">
              <AlertIcon />
              Expires at {new Date(expiresAt).toLocaleString()}
            </Alert>
          )}
        </Box>
      </VStack>
    </Box>
  )
}