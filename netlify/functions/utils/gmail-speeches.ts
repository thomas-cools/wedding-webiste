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
  parseGmailSpeakerMap,
  parseSpeechMessage,
  type GmailSpeechSource,
} from './gmail-speech-message'
import {
  clearFailedGmailSpeechStates,
  claimGmailSpeechMessage,
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
  failures: Array<{
    speakerKey?: SpeechSpeakerKey
    errorCode?: string
    error?: string
    updatedAt: string
  }>
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
  return `{${senderTerms.join(' ')}} -label:${quoteGmailQueryValue(processedLabel)} -label:${quoteGmailQueryValue(errorLabel)}`
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

  for (const messageId of messageIds) {
    const claimed = await claimGmailSpeechMessage(messageId)
    if (!claimed) {
      result.skipped += 1
      continue
    }

    let speakerKey: SpeechSpeakerKey | undefined
    try {
      const message = await getGmailMessage(accessToken, messageId)
      const parsed = parseSpeechMessage(message, speakerMap)
      if (!parsed.ok) {
        await markGmailSpeechMessage(messageId, 'failed', {
          errorCode: parsed.code,
          error: parsed.error,
        })
        await modifyGmailMessageLabels(accessToken, messageId, [errorLabelId], [processedLabelId])
        result.failed += 1
        continue
      }

      speakerKey = parsed.speakerKey
      const source = await resolveIngestionSource(accessToken, messageId, parsed.source)
      await ingestGmailSpeech({ messageId, speakerKey, source })
      await markGmailSpeechMessage(messageId, 'processed', { speakerKey })
      await modifyGmailMessageLabels(accessToken, messageId, [processedLabelId], [errorLabelId])
      result.processed += 1
    } catch {
      await markGmailSpeechMessage(messageId, 'failed', {
        speakerKey,
        errorCode: 'processing_failed',
        error: 'Speech message could not be processed',
      })
      await modifyGmailMessageLabels(accessToken, messageId, [errorLabelId], [processedLabelId])
      result.failed += 1
    }
  }

  return result
}

export async function getGmailSpeechSyncStatus(): Promise<GmailSpeechSyncStatus> {
  const states = await listGmailSpeechStates()
  return {
    processing: states.filter((state) => state.status === 'processing').length,
    processed: states.filter((state) => state.status === 'processed').length,
    failed: states.filter((state) => state.status === 'failed').length,
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
