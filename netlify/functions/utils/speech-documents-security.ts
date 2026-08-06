import net from 'node:net'

import { isSpeechSpeakerKey, type SpeechSpeakerKey } from '../../../src/config/speeches'
import type { SpeechDocumentType } from './speech-documents'

const DEFAULT_ALLOWED_HOSTS = ['docs.google.com', 'drive.google.com']
const BLOCKED_SCHEMES = new Set(['javascript:', 'data:', 'file:'])

const MAX_FILE_NAME_LENGTH = 120
const MAX_FILE_SIZE_BYTES = 1024 * 1024
const DOCX_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const DOCX_FILE_SIGNATURE = [0x50, 0x4b, 0x03, 0x04]

const PRIVATE_IPV4_CIDRS = [
  { base: '10.0.0.0', maskBits: 8 },
  { base: '127.0.0.0', maskBits: 8 },
  { base: '169.254.0.0', maskBits: 16 },
  { base: '172.16.0.0', maskBits: 12 },
  { base: '192.168.0.0', maskBits: 16 },
  { base: '100.64.0.0', maskBits: 10 },
  { base: '0.0.0.0', maskBits: 8 },
]

const BLOCKED_IPV6_PREFIXES = ['::1', 'fe80:', 'fc', 'fd']

function ipToInt(ip: string): number {
  return ip.split('.').reduce((acc, part) => (acc << 8) + Number(part), 0) >>> 0
}

function isPrivateIpv4(ip: string): boolean {
  const numericIp = ipToInt(ip)

  return PRIVATE_IPV4_CIDRS.some(({ base, maskBits }) => {
    const baseInt = ipToInt(base)
    const mask = maskBits === 0 ? 0 : (0xffffffff << (32 - maskBits)) >>> 0
    return (numericIp & mask) === (baseInt & mask)
  })
}

function isBlockedIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase()
  if (normalized === '::1') return true
  return BLOCKED_IPV6_PREFIXES.some((prefix) => normalized.startsWith(prefix))
}

function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase()

  if (host === 'localhost' || host.endsWith('.localhost')) {
    return true
  }

  const ipVersion = net.isIP(host)
  if (ipVersion === 4) {
    return isPrivateIpv4(host)
  }
  if (ipVersion === 6) {
    return isBlockedIpv6(host)
  }

  return false
}

function normalizeHost(value: string): string {
  const withoutScheme = value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '')
  const hostWithOptionalPort = withoutScheme.split('/')[0] || ''
  return hostWithOptionalPort.split(':')[0] || ''
}

export function resolveAllowedSpeechDocumentHosts(): string[] {
  const configured = (process.env.SPEECH_DOC_ALLOWED_HOSTS || '')
    .split(',')
    .map(normalizeHost)
    .filter(Boolean)

  return Array.from(new Set([...DEFAULT_ALLOWED_HOSTS, ...configured]))
}

function isHostAllowed(hostname: string, allowedHosts: string[]): boolean {
  const host = hostname.toLowerCase()
  return allowedHosts.some((allowedHost) => host === allowedHost || host.endsWith(`.${allowedHost}`))
}

export function sanitizeFileName(input: string): string {
  const cleaned = input
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/[<>"'`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  return cleaned.slice(0, MAX_FILE_NAME_LENGTH)
}

function detectDocumentType(url: URL): SpeechDocumentType | null {
  const host = url.hostname.toLowerCase()
  const path = url.pathname.toLowerCase()

  if (host === 'docs.google.com' && path.startsWith('/document/')) {
    return 'google-doc'
  }

  if (host === 'drive.google.com' && (path.startsWith('/file/') || path === '/open')) {
    return 'google-doc'
  }

  if (path.endsWith('.pdf')) {
    return 'pdf'
  }

  if (path.endsWith('.docx')) {
    return 'docx'
  }

  return null
}

export interface SpeechDocumentInput {
  fileName: unknown
  sourceUrl: unknown
  speakerKey: unknown
}

export interface SpeechDocumentValidationSuccess {
  ok: true
  fileName: string
  speakerKey: SpeechSpeakerKey
  normalizedUrl: string
  sourceHost: string
  docType: SpeechDocumentType
}

export interface SpeechDocumentValidationFailure {
  ok: false
  error: string
}

export type SpeechDocumentValidationResult =
  | SpeechDocumentValidationSuccess
  | SpeechDocumentValidationFailure

export function validateSpeechDocumentInput(
  input: SpeechDocumentInput,
  allowedHosts: string[]
): SpeechDocumentValidationResult {
  if (typeof input.fileName !== 'string' || !input.fileName.trim()) {
    return { ok: false, error: 'fileName is required' }
  }

  const fileName = sanitizeFileName(input.fileName)
  if (!fileName) {
    return { ok: false, error: 'fileName is invalid' }
  }

  if (typeof input.sourceUrl !== 'string' || !input.sourceUrl.trim()) {
    return { ok: false, error: 'sourceUrl is required' }
  }

  const speakerKey = validateSpeakerKey(input.speakerKey)
  if (!speakerKey) {
    return { ok: false, error: 'speakerKey is required' }
  }

  let url: URL
  try {
    url = new URL(input.sourceUrl.trim())
  } catch {
    return { ok: false, error: 'sourceUrl must be a valid URL' }
  }

  if (BLOCKED_SCHEMES.has(url.protocol)) {
    return { ok: false, error: 'sourceUrl scheme is not allowed' }
  }

  if (url.protocol !== 'https:') {
    return { ok: false, error: 'sourceUrl must use HTTPS' }
  }

  if (url.username || url.password) {
    return { ok: false, error: 'sourceUrl cannot contain credentials' }
  }

  if (isBlockedHost(url.hostname)) {
    return { ok: false, error: 'sourceUrl host is blocked' }
  }

  if (!isHostAllowed(url.hostname, allowedHosts)) {
    return { ok: false, error: 'sourceUrl host is not in the allowlist' }
  }

  const docType = detectDocumentType(url)
  if (!docType) {
    return { ok: false, error: 'Only PDF, DOCX, and Google Docs URLs are supported' }
  }

  return {
    ok: true,
    fileName,
    speakerKey,
    normalizedUrl: url.toString(),
    sourceHost: url.hostname.toLowerCase(),
    docType,
  }
}

const METADATA_TIMEOUT_MS = 8000

interface ProbedMetadata {
  statusCode: number
  contentType: string
  fileSizeBytes: number | null
}

export interface SpeechDocumentProbeResult {
  ok: true
  fileSizeBytes: number
  probeUrl: string
}

export interface SpeechDocumentProbeFailure {
  ok: false
  error: string
}

export type SpeechDocumentProbeOutcome = SpeechDocumentProbeResult | SpeechDocumentProbeFailure

export interface UploadValidationInput {
  fileName: unknown
  speakerKey: unknown
  originalFileName: unknown
  mimeType: unknown
  fileSizeBytes: unknown
  fileBytes: Uint8Array
}

export interface UploadValidationSuccess {
  ok: true
  fileName: string
  speakerKey: SpeechSpeakerKey
  originalFileName: string
  mimeType: string
  fileSizeBytes: number
}

export interface UploadValidationFailure {
  ok: false
  error: string
}

export type UploadValidationResult = UploadValidationSuccess | UploadValidationFailure

function withTimeoutSignal(timeoutMs: number): {
  signal: AbortSignal
  cleanup: () => void
} {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timer),
  }
}

function parseContentLength(headers: Headers): number | null {
  const raw = headers.get('content-length')
  if (!raw) return null
  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function parseContentRangeTotal(headers: Headers): number | null {
  const raw = headers.get('content-range')
  if (!raw) return null
  const match = raw.match(/\/(\d+)$/)
  const total = match?.[1]
  if (!total) return null
  const parsed = Number.parseInt(total, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

async function readResponseSizeWithCap(response: Response, maxBytes: number): Promise<number | null> {
  if (!response.body) {
    return null
  }

  const reader = response.body.getReader()
  let totalBytes = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }

    totalBytes += value.byteLength
    if (totalBytes > maxBytes) {
      return totalBytes
    }
  }

  return totalBytes > 0 ? totalBytes : null
}

function extractGoogleDocId(url: URL): string | null {
  const host = url.hostname.toLowerCase()
  const path = url.pathname

  if (host === 'docs.google.com') {
    const docMatch = path.match(/^\/document\/d\/([^/]+)/)
    if (docMatch?.[1]) return docMatch[1]
  }

  if (host === 'drive.google.com') {
    const fileMatch = path.match(/^\/file\/d\/([^/]+)/)
    if (fileMatch?.[1]) return fileMatch[1]
    const id = url.searchParams.get('id')
    if (id) return id
  }

  return null
}

function getProbeUrl(sourceUrl: string, docType: SpeechDocumentType): string | null {
  if (docType !== 'google-doc') {
    return sourceUrl
  }

  const parsed = new URL(sourceUrl)
  const docId = extractGoogleDocId(parsed)
  if (!docId) return null

  // Probe via PDF export to verify public accessibility and size.
  return `https://docs.google.com/document/d/${docId}/export?format=pdf`
}

async function fetchMetadata(url: string): Promise<ProbedMetadata> {
  const headTimeout = withTimeoutSignal(METADATA_TIMEOUT_MS)
  const headResponse = await (async () => {
    try {
      return await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',
        signal: headTimeout.signal,
      })
    } finally {
      headTimeout.cleanup()
    }
  })()

  const headContentType = (headResponse.headers.get('content-type') || '').toLowerCase()
  const headContentLength = parseContentLength(headResponse.headers)

  if (headContentLength != null) {
    return {
      statusCode: headResponse.status,
      contentType: headContentType,
      fileSizeBytes: headContentLength,
    }
  }

  const rangeTimeout = withTimeoutSignal(METADATA_TIMEOUT_MS)
  const rangeResponse = await (async () => {
    try {
      return await fetch(url, {
        method: 'GET',
        headers: {
          Range: 'bytes=0-0',
        },
        redirect: 'follow',
        signal: rangeTimeout.signal,
      })
    } finally {
      rangeTimeout.cleanup()
    }
  })()

  const rangeContentType = (rangeResponse.headers.get('content-type') || '').toLowerCase()
  const rangeLength =
    parseContentRangeTotal(rangeResponse.headers) ?? parseContentLength(rangeResponse.headers)

  if (rangeLength != null) {
    return {
      statusCode: rangeResponse.status,
      contentType: rangeContentType,
      fileSizeBytes: rangeLength,
    }
  }

  const streamTimeout = withTimeoutSignal(METADATA_TIMEOUT_MS)
  const streamResponse = await (async () => {
    try {
      return await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: streamTimeout.signal,
      })
    } finally {
      streamTimeout.cleanup()
    }
  })()

  const streamContentType = (streamResponse.headers.get('content-type') || '').toLowerCase()
  const streamLength = await readResponseSizeWithCap(streamResponse, MAX_FILE_SIZE_BYTES + 1)

  return {
    statusCode: streamResponse.status,
    contentType: streamContentType || rangeContentType,
    fileSizeBytes: streamLength,
  }
}

export async function probeSpeechDocumentSource(
  sourceUrl: string,
  docType: SpeechDocumentType
): Promise<SpeechDocumentProbeOutcome> {
  const probeUrl = getProbeUrl(sourceUrl, docType)
  if (!probeUrl) {
    return { ok: false, error: 'Google Docs URL format is invalid' }
  }

  let metadata: ProbedMetadata
  try {
    metadata = await fetchMetadata(probeUrl)
  } catch {
    return {
      ok: false,
      error: 'Could not verify document accessibility or size. Please check the link and try again.',
    }
  }

  if (metadata.statusCode === 401 || metadata.statusCode === 403) {
    return {
      ok: false,
      error: 'Document is not accessible. For Google Docs, set sharing to "Anyone with the link can view".',
    }
  }

  if (metadata.statusCode >= 400) {
    return {
      ok: false,
      error: `Document source returned HTTP ${metadata.statusCode}`,
    }
  }

  if (docType === 'google-doc' && metadata.contentType.includes('text/html')) {
    return {
      ok: false,
      error: 'Google Doc appears private. Set sharing to "Anyone with the link can view" and try again.',
    }
  }

  if (metadata.fileSizeBytes == null || metadata.fileSizeBytes <= 0) {
    return {
      ok: false,
      error: 'Could not determine document size from the source URL.',
    }
  }

  if (metadata.fileSizeBytes > MAX_FILE_SIZE_BYTES) {
    return {
      ok: false,
      error: `Document exceeds the ${MAX_FILE_SIZE_BYTES} byte limit`,
    }
  }

  return {
    ok: true,
    fileSizeBytes: metadata.fileSizeBytes,
    probeUrl,
  }
}

export function getSpeechDocumentLimits() {
  return {
    maxFileSizeBytes: MAX_FILE_SIZE_BYTES,
    maxFileNameLength: MAX_FILE_NAME_LENGTH,
  }
}

function hasDocxSignature(bytes: Uint8Array): boolean {
  if (bytes.byteLength < DOCX_FILE_SIGNATURE.length) {
    return false
  }

  return DOCX_FILE_SIGNATURE.every((value, index) => bytes[index] === value)
}

function validateSpeakerKey(input: unknown): SpeechSpeakerKey | null {
  return isSpeechSpeakerKey(input) ? input : null
}

export function validateSpeechDocumentUpload(input: UploadValidationInput): UploadValidationResult {
  if (typeof input.fileName !== 'string' || !input.fileName.trim()) {
    return { ok: false, error: 'fileName is required' }
  }

  const fileName = sanitizeFileName(input.fileName)
  if (!fileName) {
    return { ok: false, error: 'fileName is invalid' }
  }

  if (typeof input.originalFileName !== 'string' || !input.originalFileName.trim()) {
    return { ok: false, error: 'A DOCX file is required' }
  }

  const originalFileName = input.originalFileName.trim()
  if (!originalFileName.toLowerCase().endsWith('.docx')) {
    return { ok: false, error: 'Only DOCX files are supported for direct upload' }
  }

  if (typeof input.mimeType !== 'string' || input.mimeType !== DOCX_MIME_TYPE) {
    return { ok: false, error: 'Uploaded file must be a valid DOCX document' }
  }

  const fileSizeBytes =
    typeof input.fileSizeBytes === 'number'
      ? input.fileSizeBytes
      : Number.parseInt(String(input.fileSizeBytes || ''), 10)

  if (!Number.isFinite(fileSizeBytes) || fileSizeBytes <= 0) {
    return { ok: false, error: 'Uploaded file is empty or invalid' }
  }

  if (fileSizeBytes > MAX_FILE_SIZE_BYTES) {
    return { ok: false, error: `Document exceeds the ${MAX_FILE_SIZE_BYTES} byte limit` }
  }

  if (!hasDocxSignature(input.fileBytes)) {
    return { ok: false, error: 'Uploaded file does not appear to be a DOCX file' }
  }

  const speakerKey = validateSpeakerKey(input.speakerKey)
  if (!speakerKey) {
    return { ok: false, error: 'speakerKey is required' }
  }

  return {
    ok: true,
    fileName,
    speakerKey,
    originalFileName,
    mimeType: DOCX_MIME_TYPE,
    fileSizeBytes,
  }
}
