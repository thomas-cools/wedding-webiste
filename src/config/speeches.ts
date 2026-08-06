export interface SpeechSpeaker {
  key: string
  label: string
  order: number
}

export const SPEECH_SPEAKERS = [
  { key: 'guy-karin', label: 'Guy & Karin', order: 1 },
  { key: 'carlos-edith', label: 'Carlos & Edith', order: 2 },
  { key: 'ellen', label: 'Ellen', order: 3 },
  { key: 'jimena', label: 'Jimena', order: 4 },
  { key: 'miguel', label: 'Miguel', order: 5 },
  { key: 'jackie', label: 'Jackie', order: 6 },
  { key: 'gino', label: 'Gino', order: 7 },
] as const satisfies readonly SpeechSpeaker[]

export type SpeechSpeakerKey = (typeof SPEECH_SPEAKERS)[number]['key']

export function getSpeechSpeakers(): SpeechSpeaker[] {
  return [...SPEECH_SPEAKERS]
}

export function isSpeechSpeakerKey(value: unknown): value is SpeechSpeakerKey {
  return typeof value === 'string' && SPEECH_SPEAKERS.some((speaker) => speaker.key === value)
}

export function getSpeechSpeakerByKey(key: string | null | undefined): SpeechSpeaker | undefined {
  if (!key) return undefined
  return SPEECH_SPEAKERS.find((speaker) => speaker.key === key)
}

function normalizeSpeechLabel(value: string): string {
  return value.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').trim()
}

export function inferSpeechSpeakerKeyFromLabel(label: string | null | undefined): SpeechSpeakerKey | null {
  if (!label) return null

  const normalizedLabel = normalizeSpeechLabel(label)
  if (!normalizedLabel) return null

  const exactMatch = SPEECH_SPEAKERS.find((speaker) => normalizeSpeechLabel(speaker.label) === normalizedLabel)
  if (exactMatch) return exactMatch.key

  const keyLikeMatch = SPEECH_SPEAKERS.find((speaker) => normalizeSpeechLabel(speaker.key) === normalizedLabel)
  if (keyLikeMatch) return keyLikeMatch.key

  return null
}
