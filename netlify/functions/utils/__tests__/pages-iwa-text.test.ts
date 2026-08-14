/**
 * @jest-environment node
 */

import snappy from 'snappyjs'

import {
  decompressIwaFrames,
  extractTextFromIwaBytes,
  recoverTextFromIwaPayload,
} from '../pages-iwa-text'

function frame(payload: Uint8Array): Uint8Array {
  const compressed = new Uint8Array(snappy.compress(payload))
  const result = new Uint8Array(compressed.byteLength + 4)
  result[0] = 0
  result[1] = compressed.byteLength & 0xff
  result[2] = (compressed.byteLength >> 8) & 0xff
  result[3] = (compressed.byteLength >> 16) & 0xff
  result.set(compressed, 4)
  return result
}

describe('Pages IWA text recovery', () => {
  it('decompresses consecutive Apple IWA Snappy frames', () => {
    const first = frame(Buffer.from('first frame text'))
    const second = frame(Buffer.from('second frame text'))
    const bytes = new Uint8Array(first.byteLength + second.byteLength)
    bytes.set(first)
    bytes.set(second, first.byteLength)

    expect(Buffer.from(decompressIwaFrames(bytes)).toString('utf-8')).toBe(
      'first frame textsecond frame text'
    )
  })

  it('recovers plausible UTF-8 speech runs and filters binary metadata noise', () => {
    const speech = [
      'Hello everyone and thank you for celebrating with us today.',
      'Carolina and Thomas have built a life full of warmth and joy.',
      'Please raise a glass to many happy years together.',
    ].join('\n')
    const payload = Buffer.concat([
      Buffer.from([0x08, 0x01, 0x12, 0x03]),
      Buffer.from('com.apple.Pages.TSP.Metadata'),
      Buffer.from([0x00, 0xff, 0x12]),
      Buffer.from(speech),
      Buffer.from([0x00, 0x18, 0x01]),
    ])

    const recovered = extractTextFromIwaBytes(frame(payload))
    expect(recovered).toContain('Carolina and Thomas')
    expect(recovered).not.toContain('com.apple.Pages')
  })

  it('rejects malformed frames and low-confidence text', () => {
    expect(() => decompressIwaFrames(new Uint8Array([1, 2, 3, 4]))).toThrow(/invalid Snappy frame/i)
    expect(recoverTextFromIwaPayload(Buffer.from('short metadata'))).toBeNull()
  })
})