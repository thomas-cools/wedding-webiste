import snappy from 'snappyjs'

const MAX_IWA_FILE_BYTES = 8 * 1024 * 1024
const MAX_IWA_FRAME_BYTES = 4 * 1024 * 1024
const MAX_IWA_DECOMPRESSED_BYTES = 24 * 1024 * 1024
const MAX_TEXT_RUNS = 4000
const MIN_TEXT_RUN_CHARS = 12
const MIN_RECOVERED_CHARS = 120
const MAX_RECOVERED_CHARS = 13000

const LANGUAGE_MARKERS = new Set([
  'a', 'al', 'and', 'are', 'as', 'con', 'de', 'del', 'el', 'en', 'es', 'for', 'have',
  'la', 'las', 'los', 'of', 'para', 'por', 'que', 'the', 'to', 'un', 'una', 'we', 'with',
  'y', 'you',
])

const NOISE_PATTERNS = [
  /^[A-Za-z0-9+/=_-]{40,}$/,
  /^(?:https?:\/\/|file:|com\.apple\.|TS[A-Z]|TSP\.|SF[A-Z]|KN[A-Z])/,
  /\.(?:iwa|jpg|jpeg|png|gif|pdf|pages|plist|xml)$/i,
  /^(?:Helvetica|Arial|Times|Courier|Menlo|Avenir|Georgia|Verdana)(?:[- ][A-Za-z]+)?$/i,
]

function readUint24LE(bytes: Uint8Array, offset: number): number {
  return bytes[offset]! | (bytes[offset + 1]! << 8) | (bytes[offset + 2]! << 16)
}

export function decompressIwaFrames(bytes: Uint8Array): Uint8Array {
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_IWA_FILE_BYTES) {
    throw new Error('Apple Pages IWA content is empty or exceeds the decoding limit')
  }

  const chunks: Uint8Array[] = []
  let cursor = 0
  let decompressedBytes = 0

  while (cursor < bytes.byteLength) {
    if (cursor + 4 > bytes.byteLength || bytes[cursor] !== 0x00) {
      throw new Error('Apple Pages IWA content has an invalid Snappy frame')
    }
    const compressedLength = readUint24LE(bytes, cursor + 1)
    const start = cursor + 4
    const end = start + compressedLength
    if (compressedLength <= 0 || compressedLength > MAX_IWA_FRAME_BYTES || end > bytes.byteLength) {
      throw new Error('Apple Pages IWA content has an invalid frame length')
    }

    const chunk = new Uint8Array(snappy.uncompress(bytes.subarray(start, end)))
    decompressedBytes += chunk.byteLength
    if (decompressedBytes > MAX_IWA_DECOMPRESSED_BYTES) {
      throw new Error('Apple Pages IWA content exceeds the decompression limit')
    }
    chunks.push(chunk)
    cursor = end
  }

  const output = new Uint8Array(decompressedBytes)
  let offset = 0
  for (const chunk of chunks) {
    output.set(chunk, offset)
    offset += chunk.byteLength
  }
  return output
}

function isTextByte(value: number): boolean {
  return value === 0x09 ||
    value === 0x0a ||
    value === 0x0d ||
    (value >= 0x20 && value <= 0x7e) ||
    (value >= 0x80 && value <= 0xbf) ||
    (value >= 0xc2 && value <= 0xf4)
}

function normalizeCandidate(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\r\n?/g, '\n')
    .trim()
}

function isPlausibleText(value: string): boolean {
  if (value.length < MIN_TEXT_RUN_CHARS || NOISE_PATTERNS.some((pattern) => pattern.test(value))) {
    return false
  }
  const characters = Array.from(value)
  const letters = characters.filter((character) => /\p{L}/u.test(character)).length
  const words = value.match(/[\p{L}\p{M}]+/gu) || []
  const controls = characters.filter((character) =>
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(character)
  ).length
  if (controls > 0 || words.length < 3 || letters < Math.max(8, Math.floor(characters.length * 0.5))) {
    return false
  }
  const markerCount = words.filter((word) => LANGUAGE_MARKERS.has(word.toLowerCase())).length
  return markerCount > 0 || /[.!?;:,]/.test(value) || value.length >= 80
}

interface TextCandidate {
  value: string
  position: number
  score: number
}

function scoreCandidate(value: string): number {
  const words = value.match(/[\p{L}\p{M}]+/gu) || []
  const markers = words.filter((word) => LANGUAGE_MARKERS.has(word.toLowerCase())).length
  const punctuation = (value.match(/[.!?;:]/g) || []).length
  const lines = value.split('\n').filter((line) => line.trim().length > 0).length
  return Math.min(value.length, 2000) + words.length * 4 + markers * 18 + punctuation * 20 + lines * 8
}

function selectCoherentCandidates(candidates: TextCandidate[]): string[] {
  const byLength = [...candidates].sort((left, right) => right.value.length - left.value.length)
  const unique: TextCandidate[] = []
  for (const candidate of byLength) {
    const normalized = candidate.value.toLowerCase().replace(/\s+/g, ' ')
    const isContained = unique.some((existing) => {
      const existingNormalized = existing.value.toLowerCase().replace(/\s+/g, ' ')
      return existingNormalized.includes(normalized)
    })
    if (!isContained) unique.push(candidate)
  }

  const selected: TextCandidate[] = []
  let totalChars = 0
  for (const candidate of unique.sort((left, right) => right.score - left.score)) {
    const separatorChars = selected.length > 0 ? 2 : 0
    if (totalChars + separatorChars + candidate.value.length > MAX_RECOVERED_CHARS) continue
    selected.push(candidate)
    totalChars += separatorChars + candidate.value.length
  }
  return selected.sort((left, right) => left.position - right.position).map((candidate) => candidate.value)
}

export function recoverTextFromIwaPayload(bytes: Uint8Array): string | null {
  const decoder = new TextDecoder('utf-8', { fatal: true })
  const runs: TextCandidate[] = []
  const seen = new Set<string>()
  let start = -1

  const flush = (end: number) => {
    if (start < 0 || end - start < MIN_TEXT_RUN_CHARS) {
      start = -1
      return
    }
    try {
      const candidate = normalizeCandidate(decoder.decode(bytes.subarray(start, end)))
      if (isPlausibleText(candidate) && !seen.has(candidate)) {
        seen.add(candidate)
        runs.push({ value: candidate, position: start, score: scoreCandidate(candidate) })
      }
    } catch {
      // Invalid UTF-8 runs are binary protobuf content, not speech text.
    }
    start = -1
  }

  for (let index = 0; index < bytes.byteLength && runs.length < MAX_TEXT_RUNS; index += 1) {
    if (isTextByte(bytes[index]!)) {
      if (start < 0) start = index
    } else {
      flush(index)
    }
  }
  flush(bytes.byteLength)

  const text = selectCoherentCandidates(runs).join('\n\n').replace(/\n{3,}/g, '\n\n').trim()
  const letterCount = Array.from(text).filter((character) => /\p{L}/u.test(character)).length
  return text.length >= MIN_RECOVERED_CHARS && letterCount >= 80 ? text : null
}

export function extractTextFromIwaBytes(bytes: Uint8Array): string | null {
  return recoverTextFromIwaPayload(decompressIwaFrames(bytes))
}
