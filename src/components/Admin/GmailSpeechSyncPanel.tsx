import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Heading,
  HStack,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Text,
  useToast,
  VStack,
} from '@chakra-ui/react'

import type { SpeechSpeakerKey } from '../../config/speeches'
import { getSpeechSpeakerByKey } from '../../config/speeches'
import { getAdminAuthHeaders } from '../../utils/adminAuth'

interface GmailSyncStatus {
  processing: number
  processed: number
  failed: number
  processedSpeakers: SpeechSpeakerKey[]
  failures: Array<{
    speakerKey?: SpeechSpeakerKey
    errorCode?: string
    error?: string
    updatedAt: string
  }>
}

interface GmailSyncResult {
  found: number
  processed: number
  failed: number
  skipped: number
}

interface GmailSyncResponse {
  ok: boolean
  status?: GmailSyncStatus
  sync?: GmailSyncResult
  error?: string
}

type SyncAction = 'sync' | 'retry' | 'reprocess-speaker'

export function GmailSpeechSyncPanel() {
  const [status, setStatus] = useState<GmailSyncStatus | null>(null)
  const [lastResult, setLastResult] = useState<GmailSyncResult | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [activeAction, setActiveAction] = useState<string | null>(null)
  const toast = useToast()

  const refreshStatus = useCallback(async (): Promise<boolean> => {
    setLoadingStatus(true)
    try {
      const response = await fetch('/api/admin-speeches-gmail-sync', {
        method: 'GET',
        headers: getAdminAuthHeaders(),
      })
      const data = (await response.json()) as GmailSyncResponse
      if (!response.ok || !data.ok || !data.status) {
        return false
      }
      setStatus(data.status)
      return true
    } catch {
      return false
    } finally {
      setLoadingStatus(false)
    }
  }, [])

  useEffect(() => {
    void refreshStatus()
  }, [refreshStatus])

  const handleRefreshStatus = async () => {
    const refreshed = await refreshStatus()
    if (!refreshed) {
      toast({ title: 'Could not load Gmail import status', status: 'error', duration: 5000 })
    }
  }

  const runAction = async (action: SyncAction, speakerKey?: SpeechSpeakerKey) => {
    const actionKey = speakerKey ? `${action}:${speakerKey}` : action
    setActiveAction(actionKey)
    try {
      const response = await fetch('/api/admin-speeches-gmail-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders(),
        },
        body: JSON.stringify({ action, ...(speakerKey ? { speakerKey } : {}) }),
      })
      const data = (await response.json()) as GmailSyncResponse
      if (!response.ok || !data.ok || !data.sync) {
        toast({
          title: action === 'sync'
            ? 'Gmail sync failed'
            : action === 'retry'
              ? 'Gmail retry failed'
              : 'Gmail reprocessing failed',
          description: data.error,
          status: 'error',
          duration: 5000,
        })
        return
      }

      setLastResult(data.sync)
      await refreshStatus()
      toast({
        title: action === 'sync'
          ? 'Gmail sync complete'
          : action === 'retry'
            ? 'Failed imports retried'
            : `${getSpeechSpeakerByKey(speakerKey)?.label || 'Speaker'} reprocessed`,
        description: `${data.sync.processed} processed, ${data.sync.failed} failed`,
        status: data.sync.failed > 0 ? 'warning' : 'success',
        duration: 4000,
      })
    } catch {
      toast({
        title: action === 'sync'
          ? 'Gmail sync failed'
          : action === 'retry'
            ? 'Gmail retry failed'
            : 'Gmail reprocessing failed',
        description: 'Could not reach the sync service',
        status: 'error',
        duration: 5000,
      })
    } finally {
      setActiveAction(null)
    }
  }

  return (
    <Box>
      <Heading size="md" fontFamily="heading" color="secondary.navy" mb={4}>
        Gmail Speech Sync
      </Heading>

      <VStack spacing={4} align="stretch">
        <Box bg="white" rounded="md" p={5} shadow="sm" border="1px solid" borderColor="gray.100">
          <HStack justify="space-between" align="start" gap={4} flexWrap="wrap">
            <Box maxW="720px">
              <Text fontWeight="semibold" color="secondary.navy">
                Blind mailbox ingestion
              </Text>
              <Text fontSize="sm" color="gray.600" mt={1}>
                Poll the configured Gmail mailbox now and inspect aggregate import results. Email addresses,
                subjects, message bodies, and Gmail links are never shown here.
              </Text>
            </Box>
            <HStack spacing={2} flexWrap="wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => void handleRefreshStatus()}
                isLoading={loadingStatus && !activeAction}
              >
                Refresh status
              </Button>
              <Button
                size="sm"
                bg="secondary.navy"
                color="neutral.cream"
                _hover={{ bg: 'secondary.maroon' }}
                onClick={() => void runAction('sync')}
                isLoading={activeAction === 'sync'}
                isDisabled={activeAction !== null}
              >
                Run sync now
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void runAction('retry')}
                isLoading={activeAction === 'retry'}
                isDisabled={activeAction !== null || !status || status.failed === 0}
              >
                Retry failed
              </Button>
            </HStack>
          </HStack>
        </Box>

        <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3}>
          <Stat bg="white" rounded="md" p={4} border="1px solid" borderColor="gray.100">
            <StatLabel>Processed messages</StatLabel>
            <StatNumber color="green.600">{status?.processed ?? 0}</StatNumber>
          </Stat>
          <Stat bg="white" rounded="md" p={4} border="1px solid" borderColor="gray.100">
            <StatLabel>Failed messages</StatLabel>
            <StatNumber color={status?.failed ? 'orange.600' : 'gray.700'}>{status?.failed ?? 0}</StatNumber>
          </Stat>
          <Stat bg="white" rounded="md" p={4} border="1px solid" borderColor="gray.100">
            <StatLabel>Processing now</StatLabel>
            <StatNumber color="blue.600">{status?.processing ?? 0}</StatNumber>
          </Stat>
        </SimpleGrid>

        {status?.processedSpeakers?.length ? (
          <Box bg="white" rounded="md" p={5} border="1px solid" borderColor="gray.100">
            <Text fontWeight="semibold" color="secondary.navy">
              Reprocess a speaker
            </Text>
            <Text fontSize="sm" color="gray.600" mt={1} mb={3}>
              Re-run the newest processed Gmail message for one speaker using the current extraction rules.
            </Text>
            <HStack spacing={2} flexWrap="wrap">
              {status.processedSpeakers.map((speakerKey) => {
                const actionKey = `reprocess-speaker:${speakerKey}`
                return (
                  <Button
                    key={speakerKey}
                    size="sm"
                    variant="outline"
                    onClick={() => void runAction('reprocess-speaker', speakerKey)}
                    isLoading={activeAction === actionKey}
                    isDisabled={activeAction !== null}
                  >
                    Reprocess {getSpeechSpeakerByKey(speakerKey)?.label || speakerKey}
                  </Button>
                )
              })}
            </HStack>
          </Box>
        ) : null}

        {lastResult ? (
          <Alert status={lastResult.failed > 0 ? 'warning' : 'success'} rounded="md">
            <AlertIcon />
            <Box>
              <Text fontWeight="semibold">Latest on-demand run</Text>
              <HStack spacing={2} mt={1} flexWrap="wrap">
                <Badge>{lastResult.found} found</Badge>
                <Badge colorScheme="green">{lastResult.processed} processed</Badge>
                <Badge colorScheme="orange">{lastResult.failed} failed</Badge>
                <Badge colorScheme="blue">{lastResult.skipped} skipped</Badge>
              </HStack>
            </Box>
          </Alert>
        ) : null}

        {status?.failures.length ? (
          <Box bg="white" rounded="md" p={5} border="1px solid" borderColor="gray.100">
            <Text fontWeight="semibold" color="secondary.navy" mb={3}>
              Sanitized failures
            </Text>
            <VStack align="stretch" spacing={3}>
              {status.failures.map((failure, index) => (
                <Alert
                  status="warning"
                  rounded="md"
                  fontSize="sm"
                  key={`${failure.speakerKey || 'unknown'}-${failure.updatedAt}-${index}`}
                >
                  <AlertIcon />
                  <Box>
                    <Text>
                      {getSpeechSpeakerByKey(failure.speakerKey)?.label || 'Unknown speaker'}:{' '}
                      {failure.error || 'Import failed'}
                    </Text>
                    <Text fontSize="xs" color="gray.600" mt={1}>
                      {new Date(failure.updatedAt).toLocaleString()}
                      {failure.errorCode ? ` - ${failure.errorCode}` : ''}
                    </Text>
                  </Box>
                </Alert>
              ))}
            </VStack>
          </Box>
        ) : null}
      </VStack>
    </Box>
  )
}
