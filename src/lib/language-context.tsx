'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { translations, type Locale, type TranslationKeys } from './i18n'

interface LanguageContextType {
  locale: Locale
  setLocale: (l: Locale) => void
  t: TranslationKeys
  dir: 'ltr' | 'rtl'
}

const LanguageContext = createContext<LanguageContextType>({
  locale: 'en',
  setLocale: () => {},
  t: translations.en,
  dir: 'ltr',
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')

  useEffect(() => {
    const stored = localStorage.getItem('reelens-locale') as Locale | null
    if (stored && (stored === 'en' || stored === 'ar')) {
      setLocaleState(stored)
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.setAttribute('data-locale', locale)
  }, [locale])

  const setLocale = (l: Locale) => {
    setLocaleState(l)
    localStorage.setItem('reelens-locale', l)
  }

  return (
    <LanguageContext.Provider value={{
      locale,
      setLocale,
      t: translations[locale],
      dir: locale === 'ar' ? 'rtl' : 'ltr',
    }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
