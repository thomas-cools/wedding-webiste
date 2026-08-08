import { getSpeechSpeakers } from '../config/speeches'

describe('speech speaker ordering', () => {
  it('places Guy & Karin last and keeps Carlos before Edith', () => {
    const speakerKeys = getSpeechSpeakers().map((speaker) => speaker.key)

    expect(speakerKeys).toEqual(['carlos', 'edith', 'ellen', 'jimena', 'gino', 'miguel', 'jackie', 'guy-karin'])
  })
})
