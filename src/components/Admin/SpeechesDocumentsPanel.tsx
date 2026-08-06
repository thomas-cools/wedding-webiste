import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Divider,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  ListItem,
  List,
  ListIcon,
  Select,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Wrap,
  WrapItem,
  useToast,
  VStack,
} from '@chakra-ui/react'
import { CheckCircleIcon, InfoOutlineIcon, WarningTwoIcon } from '@chakra-ui/icons'

import { getAdminAuthHeaders } from '../../utils/adminAuth'
import { getSpeechSpeakerByKey, getSpeechSpeakers, type SpeechSpeakerKey } from '../../config/speeches'

type SpeechDocumentType = 'pdf' | 'docx' | 'google-doc'
type SpeechDocumentSourceKind = 'url' | 'upload'
type SpeechTranslationStatus = 'success' | 'failed' | 'skipped'
type EntryMode = 'url' | 'upload'

interface SpeechDocument {
  id: string
  fileName: string
  speakerKey?: SpeechSpeakerKey
  sourceUrl?: string
  sourceHost?: string
  sourceKind?: SpeechDocumentSourceKind
  storageKey?: string
  mimeType?: string
  originalFileName?: string
  fileSizeBytes: number
  docType: SpeechDocumentType
  sourceText?: string
  translatedText?: string
  translationStatus?: SpeechTranslationStatus
  translationError?: string
  detectedLanguage?: 'en' | 'es'
  translatedLanguage?: 'en' | 'es'
  translationProvider?: 'gemini'
  translatedAt?: string
  createdAt: string
  createdBy: string
}

interface Limits {
  maxFileSizeBytes: number
  maxFileNameLength: number
}

interface ListResponse {
  ok: boolean
  documents?: SpeechDocument[]
  limits?: Limits
  allowedHosts?: string[]
  error?: string
}

interface BackfillResponse {
  ok: boolean
  total?: number
  backfilled?: number
  error?: string
}

interface AddResponse {
  ok: boolean
  document?: SpeechDocument
  error?: string
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(2)} MB`
}

function docTypeLabel(type: SpeechDocumentType): string {
  if (type === 'google-doc') return 'Google Doc'
  return type.toUpperCase()
}

function speakerLabel(document: SpeechDocument): string {
  return getSpeechSpeakerByKey(document.speakerKey)?.label || 'Unassigned'
}

function translationStatusLabel(document: SpeechDocument): {
  scheme: 'green' | 'orange' | 'gray'
  label: string
} {
  if (document.translationStatus === 'success') {
    const source = document.detectedLanguage?.toUpperCase() || 'EN/ES'
    const target = document.translatedLanguage?.toUpperCase() || 'ES/EN'
    return { scheme: 'green', label: `${source} -> ${target}` }
  }

  if (document.translationStatus === 'failed') {
    return { scheme: 'orange', label: 'Failed' }
  }

  return { scheme: 'gray', label: 'Skipped' }
}

function speechLanguageLabel(document: SpeechDocument): {
  scheme: 'blue' | 'gray'
  label: string
} {
  if (document.detectedLanguage === 'en') {
    return { scheme: 'blue', label: 'English' }
  }

  if (document.detectedLanguage === 'es') {
    return { scheme: 'blue', label: 'Spanish' }
  }

  return { scheme: 'gray', label: 'Unknown' }
}

type UrlStatus = 'idle' | 'error' | 'warning' | 'success'

function detectUrlStatus(rawUrl: string, allowedHosts: string[]): {
  status: UrlStatus
  message: string
} {
  const trimmed = rawUrl.trim()
  if (!trimmed) {
    return {
      status: 'idle',
      message: 'Paste a document URL. We will verify accessibility and size before saving.',
    }
  }

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return { status: 'error', message: 'URL is not valid yet.' }
  }

  if (parsed.protocol !== 'https:') {
    return { status: 'error', message: 'Only HTTPS URLs are accepted.' }
  }

  const host = parsed.hostname.toLowerCase()
  const hostAllowed = allowedHosts.some(
    (allowedHost) => host === allowedHost || host.endsWith(`.${allowedHost}`)
  )
  if (!hostAllowed) {
    return { status: 'error', message: 'Host is not on the allowlist.' }
  }

  const path = parsed.pathname.toLowerCase()
  const isGoogleDoc =
    (host === 'docs.google.com' && path.startsWith('/document/')) ||
    (host === 'drive.google.com' && (path.startsWith('/file/') || path === '/open'))

  if (isGoogleDoc) {
    return {
      status: 'success',
      message:
        'Google Docs link format looks good. Sharing and size will be verified on save.',
    }
  }

  if (path.endsWith('.pdf') || path.endsWith('.docx')) {
    return {
      status: 'success',
      message: 'Link format looks good. Accessibility and size will be verified on save.',
    }
  }

  return {
    status: 'warning',
    message: 'Expected PDF, DOCX, or Google Docs URL format.',
  }
}

export function SpeechesDocumentsPanel() {
  const [documents, setDocuments] = useState<SpeechDocument[]>([])
  const [allowedHosts, setAllowedHosts] = useState<string[]>([])
  const [limits, setLimits] = useState<Limits>({ maxFileSizeBytes: 1024 * 1024, maxFileNameLength: 120 })
  const [entryMode, setEntryMode] = useState<EntryMode>('url')
  const [fileName, setFileName] = useState('')
  const [speakerKey, setSpeakerKey] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [loadingList, setLoadingList] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [backfilling, setBackfilling] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedTranslation, setSelectedTranslation] = useState<SpeechDocument | null>(null)

  const toast = useToast()

  const refreshDocuments = useCallback(async () => {
    setLoadingList(true)
    try {
      const res = await fetch('/api/admin-speeches-documents-list', {
        method: 'GET',
        headers: {
          ...getAdminAuthHeaders(),
        },
      })

      const data: ListResponse = await res.json()
      if (!res.ok || !data.ok) {
        toast({
          title: 'Failed to load documents',
          description: data.error,
          status: 'error',
          duration: 5000,
        })
        return
      }

      setDocuments(data.documents || [])
      if (Array.isArray(data.allowedHosts)) {
        setAllowedHosts(data.allowedHosts)
      }
      if (data.limits) {
        setLimits(data.limits)
      }
    } catch {
      toast({ title: 'Network error', description: 'Could not load documents', status: 'error', duration: 5000 })
    } finally {
      setLoadingList(false)
    }
  }, [toast])

  const handleBackfillSpeakers = async () => {
    setBackfilling(true)
    try {
      const res = await fetch('/api/admin-speeches-documents-backfill', {
        method: 'POST',
        headers: {
          ...getAdminAuthHeaders(),
        },
      })

      const data: BackfillResponse = await res.json()
      if (!res.ok || !data.ok) {
        toast({
          title: 'Backfill failed',
          description: data.error,
          status: 'error',
          duration: 5000,
        })
        return
      }

      await refreshDocuments()
      toast({
        title: 'Speaker backfill complete',
        description: `${data.backfilled || 0} of ${data.total || 0} documents updated.`,
        status: 'success',
        duration: 4000,
      })
    } catch {
      toast({ title: 'Network error', description: 'Could not backfill speakers', status: 'error', duration: 5000 })
    } finally {
      setBackfilling(false)
    }
  }

  useEffect(() => {
    void refreshDocuments()
  }, [refreshDocuments])

  const urlStatus = useMemo(
    () => detectUrlStatus(sourceUrl, allowedHosts),
    [sourceUrl, allowedHosts]
  )

  const speakerOptions = getSpeechSpeakers()

  const handleAdd = async () => {
    if (entryMode === 'upload') {
      await handleUpload()
      return
    }

    const trimmedName = fileName.trim()
    const trimmedUrl = sourceUrl.trim()

    if (!trimmedName || !trimmedUrl) {
      toast({
        title: 'Missing fields',
        description: 'Please provide name and URL.',
        status: 'warning',
        duration: 4000,
      })
      return
    }

    if (!speakerKey) {
      toast({
        title: 'Missing fields',
        description: 'Please choose a speaker.',
        status: 'warning',
        duration: 4000,
      })
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/admin-speeches-documents-add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders(),
        },
        body: JSON.stringify({
          fileName: trimmedName,
          sourceUrl: trimmedUrl,
          speakerKey,
        }),
      })

      const data: AddResponse = await res.json()
      if (!res.ok || !data.ok) {
        toast({
          title: 'Failed to add document',
          description: data.error,
          status: 'error',
          duration: 5000,
        })
        return
      }

      setFileName('')
      setSpeakerKey('')
      setSourceUrl('')
      await refreshDocuments()
      toast({
        title: 'Document added',
        description:
          data.document != null
            ? `${docTypeLabel(data.document.docType)} • ${formatBytes(data.document.fileSizeBytes)}`
            : undefined,
        status: 'success',
        duration: 3500,
      })
    } catch {
      toast({ title: 'Network error', description: 'Could not add document', status: 'error', duration: 5000 })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpload = async () => {
    const trimmedName = fileName.trim()

    if (!trimmedName || !uploadFile) {
      toast({
        title: 'Missing fields',
        description: 'Please provide name and DOCX file.',
        status: 'warning',
        duration: 4000,
      })
      return
    }

    if (!speakerKey) {
      toast({
        title: 'Missing fields',
        description: 'Please choose a speaker.',
        status: 'warning',
        duration: 4000,
      })
      return
    }

    if (!uploadFile.name.toLowerCase().endsWith('.docx')) {
      toast({
        title: 'Unsupported file type',
        description: 'Only DOCX files are supported for direct upload.',
        status: 'warning',
        duration: 4000,
      })
      return
    }

    if (uploadFile.size > limits.maxFileSizeBytes) {
      toast({
        title: 'File too large',
        description: `File exceeds ${formatBytes(limits.maxFileSizeBytes)} limit.`,
        status: 'warning',
        duration: 4000,
      })
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('fileName', trimmedName)
      formData.append('speakerKey', speakerKey)
      formData.append('file', uploadFile)

      const res = await fetch('/api/admin-speeches-documents-upload', {
        method: 'POST',
        headers: {
          ...getAdminAuthHeaders(),
        },
        body: formData,
      })

      const data: AddResponse = await res.json()
      if (!res.ok || !data.ok) {
        toast({
          title: 'Failed to upload document',
          description: data.error,
          status: 'error',
          duration: 5000,
        })
        return
      }

      setFileName('')
      setSpeakerKey('')
      setUploadFile(null)
      await refreshDocuments()
      toast({
        title: 'Document uploaded',
        description:
          data.document != null
            ? `${docTypeLabel(data.document.docType)} • ${formatBytes(data.document.fileSizeBytes)}`
            : undefined,
        status: 'success',
        duration: 3500,
      })
    } catch {
      toast({ title: 'Network error', description: 'Could not upload document', status: 'error', duration: 5000 })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this document entry?')) {
      return
    }

    setDeletingId(id)
    try {
      const res = await fetch('/api/admin-speeches-documents-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders(),
        },
        body: JSON.stringify({ id }),
      })
      const data = await res.json()

      if (!res.ok || !data.ok) {
        toast({
          title: 'Failed to delete document',
          description: data.error,
          status: 'error',
          duration: 5000,
        })
        return
      }

      setDocuments((prev) => prev.filter((doc) => doc.id !== id))
      toast({ title: 'Document deleted', status: 'success', duration: 3000 })
    } catch {
      toast({ title: 'Network error', description: 'Could not delete document', status: 'error', duration: 5000 })
    } finally {
      setDeletingId(null)
    }
  }

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      toast({ title: 'Link copied', status: 'success', duration: 2500 })
    } catch {
      toast({ title: 'Could not copy link', status: 'error', duration: 3000 })
    }
  }

  const handleViewTranslation = (document: SpeechDocument) => {
    setSelectedTranslation(document)
  }

  const handleCloseTranslation = () => {
    setSelectedTranslation(null)
  }

  const handleOpenDocument = async (document: SpeechDocument) => {
    const sourceKind = document.sourceKind || 'url'

    if (sourceKind === 'url' && document.sourceUrl) {
      window.open(document.sourceUrl, '_blank', 'noopener,noreferrer')
      return
    }

    if (sourceKind !== 'upload') {
      toast({ title: 'Unsupported document source', status: 'error', duration: 3000 })
      return
    }

    try {
      const res = await fetch(`/api/admin-speeches-documents-file?id=${encodeURIComponent(document.id)}`, {
        method: 'GET',
        headers: {
          ...getAdminAuthHeaders(),
        },
      })

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null
        toast({
          title: 'Failed to open document',
          description: payload?.error || 'Could not fetch uploaded file.',
          status: 'error',
          duration: 5000,
        })
        return
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
      setTimeout(() => window.URL.revokeObjectURL(url), 15000)
    } catch {
      toast({ title: 'Network error', description: 'Could not open document', status: 'error', duration: 5000 })
    }
  }

  return (
    <Box>
      <Heading size="md" fontFamily="heading" color="secondary.navy" mb={4}>
        Speech Documents
      </Heading>

      <VStack spacing={4} align="stretch">
        <Box bg="white" rounded="xl" p={5} shadow="sm" border="1px solid" borderColor="gray.100">
          <Text fontSize="sm" color="gray.500" mb={4}>
            Add trusted document links or upload DOCX files for speech content experiments. Assign each speech to a speaker so the public page can render it in the right place.
          </Text>

          <Alert status="info" rounded="md" mb={4} fontSize="sm">
            <AlertIcon />
            Maximum size: {formatBytes(limits.maxFileSizeBytes)}. URL sources are probed automatically. Google Docs must be shared as "Anyone with the link can view".
          </Alert>

          <HStack spacing={2} mb={4}>
            <Button
              size="sm"
              variant={entryMode === 'url' ? 'solid' : 'outline'}
              bg={entryMode === 'url' ? 'secondary.navy' : undefined}
              color={entryMode === 'url' ? 'neutral.cream' : undefined}
              _hover={{ bg: entryMode === 'url' ? 'secondary.maroon' : undefined }}
              onClick={() => setEntryMode('url')}
            >
              Add via URL
            </Button>
            <Button
              size="sm"
              variant={entryMode === 'upload' ? 'solid' : 'outline'}
              bg={entryMode === 'upload' ? 'secondary.navy' : undefined}
              color={entryMode === 'upload' ? 'neutral.cream' : undefined}
              _hover={{ bg: entryMode === 'upload' ? 'secondary.maroon' : undefined }}
              onClick={() => setEntryMode('upload')}
            >
              Upload DOCX
            </Button>
          </HStack>

          <Box
            rounded="md"
            border="1px solid"
            borderColor="gray.200"
            bg="gray.50"
            p={3}
            mb={4}
            opacity={entryMode === 'url' ? 1 : 0.55}
          >
            <Text fontSize="xs" fontWeight="semibold" color="gray.700" mb={2}>
              Allowed hosts
            </Text>
            <Wrap>
              {(allowedHosts.length > 0 ? allowedHosts : ['none configured']).map((host) => (
                <WrapItem key={host}>
                  <Badge colorScheme="gray" variant="subtle" px={2} py={1} borderRadius="md">
                    {host}
                  </Badge>
                </WrapItem>
              ))}
            </Wrap>
          </Box>

          <HStack align="start" spacing={4} flexWrap="wrap">
            <FormControl minW="220px" flex={1}>
              <FormLabel fontSize="sm" fontWeight="medium">Document Name</FormLabel>
              <Input
                value={fileName}
                onChange={(event) => setFileName(event.target.value)}
                maxLength={limits.maxFileNameLength}
                placeholder="Wedding speech notes"
                size="sm"
              />
            </FormControl>

            <FormControl minW="220px" flex={1}>
              <FormLabel fontSize="sm" fontWeight="medium">Speaker</FormLabel>
              <Select
                placeholder="Select a speaker"
                value={speakerKey}
                onChange={(event) => setSpeakerKey(event.target.value)}
                size="sm"
              >
                {speakerOptions.map((speaker) => (
                  <option key={speaker.key} value={speaker.key}>
                    {speaker.label}
                  </option>
                ))}
              </Select>
            </FormControl>

            {entryMode === 'url' ? (
              <FormControl minW="280px" flex={2}>
                <FormLabel fontSize="sm" fontWeight="medium">Source URL (HTTPS)</FormLabel>
                <Input
                  value={sourceUrl}
                  onChange={(event) => setSourceUrl(event.target.value)}
                  placeholder="https://docs.google.com/document/d/..."
                  size="sm"
                  isDisabled={submitting}
                />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  For Google Docs: open Share, set General access to "Anyone with the link", and permission to "Viewer".
                </Text>

                <Alert
                  status={
                    urlStatus.status === 'error'
                      ? 'error'
                      : urlStatus.status === 'warning'
                      ? 'warning'
                      : 'info'
                  }
                  rounded="md"
                  mt={2}
                  fontSize="xs"
                >
                  <AlertIcon />
                  {urlStatus.message}
                </Alert>
              </FormControl>
            ) : (
              <FormControl minW="280px" flex={2}>
                <FormLabel fontSize="sm" fontWeight="medium">DOCX File</FormLabel>
                <Input
                  type="file"
                  accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  size="sm"
                  isDisabled={submitting}
                  onChange={(event) => setUploadFile(event.target.files?.[0] || null)}
                />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Direct upload accepts DOCX only, up to {formatBytes(limits.maxFileSizeBytes)}.
                </Text>
                <Alert status={uploadFile ? 'success' : 'info'} rounded="md" mt={2} fontSize="xs">
                  <AlertIcon />
                  {uploadFile
                    ? `${uploadFile.name} • ${formatBytes(uploadFile.size)}`
                    : 'Choose a DOCX file to upload.'}
                </Alert>
              </FormControl>
            )}

            <Button
              onClick={handleAdd}
              isLoading={submitting}
              loadingText={entryMode === 'url' ? 'Checking & saving...' : 'Uploading...'}
              bg="secondary.navy"
              color="neutral.cream"
              _hover={{ bg: 'secondary.maroon' }}
              isDisabled={
                submitting ||
                (entryMode === 'url' ? urlStatus.status === 'error' : uploadFile == null)
              }
            >
              {entryMode === 'url' ? 'Add Document' : 'Upload Document'}
            </Button>
          </HStack>

          <List spacing={1} mt={4} fontSize="xs" color="gray.600">
            <ListItem>
              <ListIcon as={InfoOutlineIcon} color="blue.500" />
              Step 1: Choose URL mode or DOCX upload mode.
            </ListItem>
            <ListItem>
              <ListIcon as={CheckCircleIcon} color="green.500" />
              Step 2: URL mode checks accessibility and size automatically.
            </ListItem>
            <ListItem>
              <ListIcon as={WarningTwoIcon} color="orange.400" />
              Step 3: Upload mode accepts DOCX only and enforces the same size limit.
            </ListItem>
          </List>
        </Box>

        <Box bg="white" rounded="xl" p={5} shadow="sm" border="1px solid" borderColor="gray.100">
          <HStack justify="space-between" mb={3}>
            <Text fontWeight="semibold">Stored documents</Text>
            <HStack spacing={2}>
              <Button variant="outline" size="sm" onClick={() => void handleBackfillSpeakers()} isLoading={backfilling}>
                Backfill speakers
              </Button>
              <Button variant="outline" size="sm" onClick={() => void refreshDocuments()} isLoading={loadingList}>
                Refresh
              </Button>
            </HStack>
          </HStack>

          {documents.length === 0 ? (
            <Box
              rounded="lg"
              border="1px dashed"
              borderColor="gray.300"
              bg="gray.50"
              p={6}
              textAlign="center"
            >
              <Text color="gray.700" fontWeight="medium" mb={1}>No documents yet</Text>
              <Text color="gray.500" fontSize="sm">Add your first speech document above.</Text>
            </Box>
          ) : (
            <Box overflowX="auto">
              <Table size="sm" variant="simple">
                <Thead>
                  <Tr>
                    <Th>Name</Th>
                    <Th>Type</Th>
                    <Th>Size</Th>
                    <Th>Source</Th>
                    <Th>Speaker</Th>
                    <Th>Language</Th>
                    <Th>Translation</Th>
                    <Th>Added</Th>
                    <Th></Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {documents.map((doc) => (
                    <Tr key={doc.id}>
                      <Td fontWeight="medium">{doc.fileName}</Td>
                      <Td>
                        <Badge colorScheme="blue" variant="subtle">{docTypeLabel(doc.docType)}</Badge>
                      </Td>
                      <Td>{formatBytes(doc.fileSizeBytes)}</Td>
                      <Td
                        maxW="260px"
                        overflow="hidden"
                        textOverflow="ellipsis"
                        whiteSpace="nowrap"
                        title={doc.sourceUrl || doc.originalFileName || doc.storageKey || 'Uploaded DOCX'}
                      >
                        {doc.sourceKind === 'upload'
                          ? `Uploaded (${doc.originalFileName || 'DOCX'})`
                          : doc.sourceHost || 'Unknown host'}
                      </Td>
                      <Td>
                        <Badge colorScheme={doc.speakerKey ? 'blue' : 'gray'} variant="subtle">
                          {speakerLabel(doc)}
                        </Badge>
                      </Td>
                      <Td>
                        {(() => {
                          const language = speechLanguageLabel(doc)
                          return (
                            <Badge colorScheme={language.scheme} variant="subtle">
                              {language.label}
                            </Badge>
                          )
                        })()}
                      </Td>
                      <Td>
                        {(() => {
                          const status = translationStatusLabel(doc)
                          return (
                            <Badge
                              colorScheme={status.scheme}
                              variant="subtle"
                              title={doc.translationError || undefined}
                            >
                              {status.label}
                            </Badge>
                          )
                        })()}
                      </Td>
                      <Td fontSize="xs" color="gray.500">{new Date(doc.createdAt).toLocaleString()}</Td>
                      <Td>
                        <HStack justify="flex-end">
                          <Button size="xs" variant="outline" onClick={() => void handleOpenDocument(doc)}>
                            Open
                          </Button>
                          {doc.translationStatus === 'success' && doc.translatedText ? (
                            <Button size="xs" variant="outline" onClick={() => handleViewTranslation(doc)}>
                              Translation
                            </Button>
                          ) : null}
                          {doc.sourceKind !== 'upload' && doc.sourceUrl ? (
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={() => void handleCopy(doc.sourceUrl as string)}
                            >
                              Copy
                            </Button>
                          ) : null}
                          <Button
                            size="xs"
                            colorScheme="gray"
                            variant="ghost"
                            onClick={() => void handleDelete(doc.id)}
                            isLoading={deletingId === doc.id}
                          >
                            Delete
                          </Button>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}
        </Box>
      </VStack>

      <Modal isOpen={selectedTranslation != null} onClose={handleCloseTranslation} size="3xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader fontFamily="heading" color="secondary.navy">
            {selectedTranslation?.fileName || 'Translation'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedTranslation?.translationStatus === 'success' && selectedTranslation.translatedText ? (
              <VStack align="stretch" spacing={4}>
                <HStack spacing={2} flexWrap="wrap">
                  <Badge colorScheme="green" variant="subtle">
                    {selectedTranslation.detectedLanguage?.toUpperCase() || 'EN/ES'}
                    {' -> '}
                    {selectedTranslation.translatedLanguage?.toUpperCase() || 'ES/EN'}
                  </Badge>
                  {selectedTranslation.translationProvider ? (
                    <Badge colorScheme="blue" variant="subtle">
                      {selectedTranslation.translationProvider.toUpperCase()}
                    </Badge>
                  ) : null}
                  {selectedTranslation.translatedAt ? (
                    <Badge colorScheme="gray" variant="subtle">
                      {new Date(selectedTranslation.translatedAt).toLocaleString()}
                    </Badge>
                  ) : null}
                </HStack>

                <Box
                  border="1px solid"
                  borderColor="gray.200"
                  rounded="md"
                  bg="gray.50"
                  p={4}
                  maxH="70vh"
                  overflowY="auto"
                >
                  <Text whiteSpace="pre-wrap" lineHeight="tall" color="gray.800">
                    {selectedTranslation.translatedText}
                  </Text>
                </Box>

                {selectedTranslation.sourceText ? (
                  <>
                    <Divider />
                    <Box>
                      <Text fontSize="sm" fontWeight="semibold" mb={2} color="gray.700">
                        Original source text
                      </Text>
                      <Box
                        border="1px solid"
                        borderColor="gray.200"
                        rounded="md"
                        bg="white"
                        p={4}
                        maxH="35vh"
                        overflowY="auto"
                      >
                        <Text whiteSpace="pre-wrap" lineHeight="tall" color="gray.600">
                          {selectedTranslation.sourceText}
                        </Text>
                      </Box>
                    </Box>
                  </>
                ) : null}
              </VStack>
            ) : (
              <Box>
                <Text fontWeight="semibold" mb={2}>
                  Translation unavailable
                </Text>
                <Text color="gray.600" whiteSpace="pre-wrap">
                  {selectedTranslation?.translationError || 'This document does not have a translated version yet.'}
                </Text>
              </Box>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  )
}
