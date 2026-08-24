import { create } from 'zustand'

export type LanguageCode = 'en' | 'ru' | 'uz'

const LANGUAGE_STORAGE_KEY = 'linguanest-language'

const resolveInitialLanguage = (): LanguageCode => {
  if (typeof window === 'undefined') return 'en'

  const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
  if (storedLanguage === 'en' || storedLanguage === 'ru' || storedLanguage === 'uz') {
    return storedLanguage
  }

  return 'en'
}

export const applyLanguage = (language: LanguageCode) => {
  if (typeof document === 'undefined') return

  document.documentElement.lang = language
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
}

export const initializeLanguage = () => {
  const language = resolveInitialLanguage()
  applyLanguage(language)
  return language
}

interface LanguageState {
  language: LanguageCode
  setLanguage: (language: LanguageCode) => void
}

const initialLanguage = resolveInitialLanguage()

export const useLanguageStore = create<LanguageState>((set) => ({
  language: initialLanguage,
  setLanguage: (language) => {
    applyLanguage(language)
    set({ language })
  },
}))
