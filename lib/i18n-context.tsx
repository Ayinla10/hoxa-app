'use client'

import { createContext, useContext, useState, useTransition } from 'react'
import { type Lang, t, type TKey } from './i18n'
import { setLanguageAction } from '@/actions/profile'

interface I18nCtx {
  lang: Lang
  t: (key: TKey) => string
  toggle: () => void
  isPending: boolean
}

const Ctx = createContext<I18nCtx>({
  lang: 'en',
  t: (key) => key,
  toggle: () => {},
  isPending: false,
})

export function I18nProvider({ lang: initial, children }: { lang: Lang; children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>(initial)
  const [isPending, startTransition] = useTransition()

  function toggle() {
    const next: Lang = lang === 'en' ? 'fr' : 'en'
    setLang(next)
    startTransition(async () => {
      await setLanguageAction(next)
    })
  }

  return (
    <Ctx.Provider value={{ lang, t: (key) => t(lang, key), toggle, isPending }}>
      {children}
    </Ctx.Provider>
  )
}

export function useI18n() {
  return useContext(Ctx)
}
