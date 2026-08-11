import React from 'react'
import { render, screen } from '../test-utils'

jest.mock('../contexts/FeatureFlagsContext', () => ({
  useFeatureFlags: () => ({ features: { requirePassword: false } }),
}))

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { returnObjects?: boolean }) => {
      if (key === 'taxi.estimates') {
        return [
          'Aéroport Toulouse Blagnac - centre ville',
          'Toulouse : 38 euros',
          'ATB - château 75 euros',
          'centre ville - château 45 euros',
        ]
      }
      if (key === 'taxi.vansEstimates') {
        return ['ATB - centre ville 60 euros', 'ATB - château 100 euros', 'centre ville - château 65 euros']
      }
      if (options?.returnObjects) {
        return []
      }
      return key
    },
    i18n: {
      language: 'en',
      changeLanguage: jest.fn(),
    },
  }),
  Trans: ({ i18nKey, children }: { i18nKey: string; children?: React.ReactNode }) => i18nKey || children,
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn(),
  },
}))

import TaxiPage from '../pages/TaxiPage'

describe('TaxiPage', () => {
  it('renders the taxi estimates in a single bullet for Toulouse', () => {
    render(<TaxiPage />)

    const listItems = screen.getAllByRole('listitem')
    expect(listItems.some((item) => item.textContent?.includes('Toulouse : 38 euros'))).toBe(true)
    expect(listItems.filter((item) => item.textContent?.includes('Toulouse : 38 euros')).length).toBe(1)
  })
})
