import type { SpeechSpeakerKey } from '../../../src/config/speeches'
import {
  getGmailAttachment,
  getGmailMessage,
  getGoogleAccessToken,
  ensureGmailLabel,
  exportGoogleDocText,
  listGmailMessageIds,
  modifyGmailMessageLabels,
} from './google-mail-api'
import {
  GMAIL_SPEECH_CUTOFF_MS,
  parseGmailSpeakerMap,
  parseSpeechMessage,
  type GmailSpeechSource,
} from './gmail-speech-message'
import {
  clearFailedGmailSpeechStates,
  claimGmailSpeechMessage,
  deleteGmailSpeechState,
  listGmailSpeechStates,
  markGmailSpeechMessage,
} from './gmail-speech-state'
import { ingestGmailSpeech, type GmailSpeechIngestionSource } from './speech-gmail-ingestion'

const DEFAULT_PROCESSED_LABEL = 'Wedding Speech/Processed'
const DEFAULT_ERROR_LABEL = 'Wedding Speech/Error'

export interface GmailSpeechSyncResult {
  found: number
  processed: number
  failed: number
  skipped: number
}

export interface GmailSpeechSyncStatus {
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

interface GmailSyncContext {
  accessToken: string
  speakerMap: ReadonlyMap<string, SpeechSpeakerKey>
  processedLabelId: string
  errorLabelId: string
}

function getMaxMessages(): number {
  const parsed = Number.parseInt(process.env.SPEECH_GMAIL_MAX_MESSAGES_PER_RUN || '', 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return 2
  return Math.min(parsed, 10)
}

function getLabelNames(): { processed: string; error: string } {
  return {
    processed: process.env.SPEECH_GMAIL_PROCESSED_LABEL?.trim() || DEFAULT_PROCESSED_LABEL,
    error: process.env.SPEECH_GMAIL_ERROR_LABEL?.trim() || DEFAULT_ERROR_LABEL,
  }
}

function quoteGmailQueryValue(value: string): string {
  return `"${value.replace(/["\\]/g, '')}"`
}

export function buildGmailSpeechQuery(
  emails: Iterable<string>,
  processedLabel: string,
  errorLabel: string
): string {
  const senderTerms = Array.from(emails, (email) => `from:${quoteGmailQueryValue(email)}`)
  const afterEpochSeconds = Math.floor(GMAIL_SPEECH_CUTOFF_MS / 1000) - 1
  return `{${senderTerms.join(' ')}} after:${afterEpochSeconds} -label:${quoteGmailQueryValue(processedLabel)} -label:${quoteGmailQueryValue(errorLabel)}`
}

async function resolveIngestionSource(
  accessToken: string,
  messageId: string,
  source: GmailSpeechSource
): Promise<GmailSpeechIngestionSource> {
  if (source.kind === 'body') {
    return { kind: 'body', text: source.text }
  }
  if (source.kind === 'google-doc') {
    return {
      kind: 'google-doc',
      text: await exportGoogleDocText(accessToken, source.documentId),
    }
  }
  return {
    kind: 'attachment',
    fileName: source.fileName,
    mimeType: source.mimeType,
    bytes: await getGmailAttachment(accessToken, messageId, source.attachmentId),
  }
}

async function processClaimedGmailMessage(
  messageId: string,
  context: GmailSyncContext
): Promise<'processed' | 'failed'> {
  let speakerKey: SpeechSpeakerKey | undefined
  try {
    const message = await getGmailMessage(context.accessToken, messageId)
    const parsed = parseSpeechMessage(message, context.speakerMap)
    if (!parsed.ok) {
      await markGmailSpeechMessage(messageId, 'failed', {
        errorCode: parsed.code,
        error: parsed.error,
      })
      await modifyGmailMessageLabels(
        context.accessToken,
        messageId,
        [context.errorLabelId],
        [context.processedLabelId]
      )
      return 'failed'
    }

    speakerKey = parsed.speakerKey
    const source = await resolveIngestionSource(context.accessToken, messageId, parsed.source)
    await ingestGmailSpeech({ messageId, speakerKey, source })
    await markGmailSpeechMessage(messageId, 'processed', { speakerKey })
    await modifyGmailMessageLabels(
      context.accessToken,
      messageId,
      [context.processedLabelId],
      [context.errorLabelId]
    )
    return 'processed'
  } catch {
    await markGmailSpeechMessage(messageId, 'failed', {
      speakerKey,
      errorCode: 'processing_failed',
      error: 'Speech message could not be processed',
    })
    await modifyGmailMessageLabels(
      context.accessToken,
      messageId,
      [context.errorLabelId],
      [context.processedLabelId]
    )
    return 'failed'
  }
}

export async function syncGmailSpeeches(): Promise<GmailSpeechSyncResult> {
  const speakerMap = parseGmailSpeakerMap(process.env.GMAIL_SPEAKER_MAP_JSON || '')
  const labels = getLabelNames()
  const accessToken = await getGoogleAccessToken()
  const [processedLabelId, errorLabelId] = await Promise.all([
    ensureGmailLabel(accessToken, labels.processed),
    ensureGmailLabel(accessToken, labels.error),
  ])
  const query = buildGmailSpeechQuery(speakerMap.keys(), labels.processed, labels.error)
  const messageIds = await listGmailMessageIds(accessToken, query, getMaxMessages())
  const result: GmailSpeechSyncResult = {
    found: messageIds.length,
    processed: 0,
    failed: 0,
    skipped: 0,
  }
  const context: GmailSyncContext = {
    accessToken,
    speakerMap,
    processedLabelId,
    errorLabelId,
  }

  for (const messageId of messageIds) {
    const claimed = await claimGmailSpeechMessage(messageId)
    if (!claimed) {
      result.skipped += 1
      continue
    }

    const outcome = await processClaimedGmailMessage(messageId, context)
    if (outcome === 'processed') {
      result.processed += 1
    } else {
      result.failed += 1
    }
  }

  return result
}

export async function getGmailSpeechSyncStatus(): Promise<GmailSpeechSyncStatus> {
  const states = await listGmailSpeechStates()
  const processedSpeakers = Array.from(new Set(
    states
      .filter((state) => state.status === 'processed' && state.speakerKey)
      .map((state) => state.speakerKey as SpeechSpeakerKey)
  ))
  return {
    processing: states.filter((state) => state.status === 'processing').length,
    processed: states.filter((state) => state.status === 'processed').length,
    failed: states.filter((state) => state.status === 'failed').length,
    processedSpeakers,
    failures: states
      .filter((state) => state.status === 'failed')
      .map((state) => ({
        speakerKey: state.speakerKey,
        errorCode: state.errorCode,
        error: state.error,
        updatedAt: state.updatedAt,
      })),
  }
}

export async function reprocessLatestGmailSpeech(
  speakerKey: SpeechSpeakerKey
): Promise<GmailSpeechSyncResult> {
  const states = await listGmailSpeechStates()
  const target = states
    .filter((state) => state.status === 'processed' && state.speakerKey === speakerKey)
    .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt))[0]

  if (!target) {
    throw new Error('No processed Gmail message exists for this speaker')
  }

  const speakerMap = parseGmailSpeakerMap(process.env.GMAIL_SPEAKER_MAP_JSON || '')
  if (!Array.from(speakerMap.values()).includes(speakerKey)) {
    throw new Error('Speaker is not configured in the Gmail speaker map')
  }

  const labels = getLabelNames()
  const accessToken = await getGoogleAccessToken()
  const [processedLabelId, errorLabelId] = await Promise.all([
    ensureGmailLabel(accessToken, labels.processed),
    ensureGmailLabel(accessToken, labels.error),
  ])

  await modifyGmailMessageLabels(accessToken, target.messageId, [], [processedLabelId, errorLabelId])
  await deleteGmailSpeechState(target.messageId)
  const claimed = await claimGmailSpeechMessage(target.messageId)
  if (!claimed) {
    throw new Error('Gmail message could not be claimed for reprocessing')
  }

  const outcome = await processClaimedGmailMessage(target.messageId, {
    accessToken,
    speakerMap,
    processedLabelId,
    errorLabelId,
  })
  return {
    found: 1,
    processed: outcome === 'processed' ? 1 : 0,
    failed: outcome === 'failed' ? 1 : 0,
    skipped: 0,
  }
}

export async function retryFailedGmailSpeeches(): Promise<GmailSpeechSyncResult> {
  const states = await listGmailSpeechStates()
  const failedMessageIds = states
    .filter((state) => state.status === 'failed')
    .map((state) => state.messageId)

  if (failedMessageIds.length > 0) {
    const accessToken = await getGoogleAccessToken()
    const errorLabelId = await ensureGmailLabel(accessToken, getLabelNames().error)
    for (const messageId of failedMessageIds) {
      await modifyGmailMessageLabels(accessToken, messageId, [], [errorLabelId])
    }
    await clearFailedGmailSpeechStates()
  }

  return syncGmailSpeeches()
}
