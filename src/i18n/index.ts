import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import en from './locales/en.json'
import es from './locales/es.json'
import nl from './locales/nl.json'

export const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇲🇽' },
  { code: 'nl', name: 'Nederlands', flag: '🇧🇪' },
] as const

export type LanguageCode = typeof languages[number]['code']

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      nl: { translation: nl },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'es', 'nl'],
    load: 'languageOnly',
    debug: false,
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      order: ['querystring', 'localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupQuerystring: 'lang',
      lookupLocalStorage: 'wedding-language',
    },
  })

export default i18n
