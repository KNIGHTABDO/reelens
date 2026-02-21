'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/lib/language-context'
import { cn } from '@/lib/utils'
import { Globe, Key, Smartphone, Moon, Check, Eye, EyeOff } from 'lucide-react'

export default function SettingsPage() {
  const { t, dir, locale, setLocale } = useLanguage()
  const [geminiKey, setGeminiKey] = useState('')
  const [socialkitKey, setSocialkitKey] = useState('')
  const [saved, setSaved] = useState(false)
  const [showGemini, setShowGemini] = useState(false)
  const [showSocialkit, setShowSocialkit] = useState(false)

  useEffect(() => {
    setGeminiKey(localStorage.getItem('reelens-gemini-key') || '')
    setSocialkitKey(localStorage.getItem('reelens-socialkit-key') || '')
  }, [])

  function save() {
    localStorage.setItem('reelens-gemini-key', geminiKey)
    localStorage.setItem('reelens-socialkit-key', socialkitKey)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className={cn('min-h-screen px-4 py-10', dir === 'rtl' && 'font-arabic')} dir={dir}>
      <div className="max-w-lg mx-auto space-y-5">
        {/* Header */}
        <div className={dir === 'rtl' ? 'text-right' : ''}>
          <h1 className="text-2xl font-bold text-white">{t.settings.title}</h1>
          <p className="text-sm text-zinc-600 mt-1">{t.settings.subtitle}</p>
        </div>

        {/* Language */}
        <div className="glass rounded-2xl p-5 space-y-4">
          <div className={cn('flex items-center gap-3', dir === 'rtl' && 'flex-row-reverse')}>
            <div className="w-8 h-8 rounded-xl bg-white/[0.05] flex items-center justify-center">
              <Globe className="w-4 h-4 text-zinc-400" />
            </div>
            <div className={cn(dir === 'rtl' ? 'text-right' : '')}>
              <p className="text-sm font-medium text-white">{t.settings.language}</p>
              <p className="text-xs text-zinc-600">{t.settings.languageDesc}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(['en', 'ar'] as const).map(l => (
              <button
                key={l}
                onClick={() => setLocale(l)}
                className={cn(
                  'py-2.5 rounded-xl text-sm font-medium transition-all border',
                  locale === l
                    ? 'bg-white text-black border-white'
                    : 'bg-transparent text-zinc-400 border-white/[0.08] hover:border-white/20 hover:text-white'
                )}
              >
                {l === 'en' ? t.settings.english : t.settings.arabic}
              </button>
            ))}
          </div>
        </div>

        {/* API Keys */}
        <div className="glass rounded-2xl p-5 space-y-4">
          <div className={cn('flex items-center gap-3', dir === 'rtl' && 'flex-row-reverse')}>
            <div className="w-8 h-8 rounded-xl bg-white/[0.05] flex items-center justify-center">
              <Key className="w-4 h-4 text-zinc-400" />
            </div>
            <div className={cn(dir === 'rtl' ? 'text-right' : '')}>
              <p className="text-sm font-medium text-white">{t.settings.apiKeys}</p>
              <p className="text-xs text-zinc-600">{t.settings.apiKeysDesc}</p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Gemini Key */}
            <div>
              <label className={cn('block text-xs text-zinc-600 mb-1.5', dir === 'rtl' && 'text-right')}>
                {t.settings.geminiKey}
              </label>
              <div className="relative">
                <input
                  type={showGemini ? 'text' : 'password'}
                  value={geminiKey}
                  onChange={e => setGeminiKey(e.target.value)}
                  placeholder="AIza..."
                  className={cn('input-dark w-full px-3 py-2.5 text-sm pr-10', dir === 'rtl' && 'text-right')}
                  dir="ltr"
                />
                <button
                  onClick={() => setShowGemini(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  {showGemini ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* SocialKit Key */}
            <div>
              <label className={cn('block text-xs text-zinc-600 mb-1.5', dir === 'rtl' && 'text-right')}>
                {t.settings.socialkitKey}
              </label>
              <div className="relative">
                <input
                  type={showSocialkit ? 'text' : 'password'}
                  value={socialkitKey}
                  onChange={e => setSocialkitKey(e.target.value)}
                  placeholder="sk_..."
                  className={cn('input-dark w-full px-3 py-2.5 text-sm pr-10', dir === 'rtl' && 'text-right')}
                  dir="ltr"
                />
                <button
                  onClick={() => setShowSocialkit(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  {showSocialkit ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              onClick={save}
              className={cn(
                'w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2',
                saved
                  ? 'bg-green-500/20 text-green-400 border border-green-500/20'
                  : 'btn-primary'
              )}
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4" />
                  {t.settings.saved}
                </>
              ) : t.settings.save}
            </button>
          </div>
        </div>

        {/* iOS Shortcut Guide */}
        <div className="glass rounded-2xl p-5 space-y-4">
          <div className={cn('flex items-center gap-3', dir === 'rtl' && 'flex-row-reverse')}>
            <div className="w-8 h-8 rounded-xl bg-white/[0.05] flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-zinc-400" />
            </div>
            <div className={cn(dir === 'rtl' ? 'text-right' : '')}>
              <p className="text-sm font-medium text-white">{t.settings.shortcutGuide}</p>
              <p className="text-xs text-zinc-600">{t.settings.shortcutDesc}</p>
            </div>
          </div>

          <div className="space-y-2">
            {[
              t.settings.shortcutStep1,
              t.settings.shortcutStep2,
              t.settings.shortcutStep3,
              t.settings.shortcutStep4,
            ].map((step, i) => (
              <div key={i} className={cn('flex gap-2.5', dir === 'rtl' && 'flex-row-reverse')}>
                <span className="shrink-0 w-5 h-5 rounded-full bg-white/[0.05] flex items-center justify-center text-[10px] text-zinc-600">
                  {i + 1}
                </span>
                <p className={cn('text-xs text-zinc-500', dir === 'rtl' && 'text-right')}>{step}</p>
              </div>
            ))}
            <div className={cn('ml-7 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]', dir === 'rtl' && 'mr-7 ml-0')}>
              <code className="text-xs text-zinc-400 break-all">{t.settings.shortcutUrl}</code>
            </div>
            {[t.settings.shortcutStep5, t.settings.shortcutStep6].map((step, i) => (
              <div key={i} className={cn('flex gap-2.5', dir === 'rtl' && 'flex-row-reverse')}>
                <span className="shrink-0 w-5 h-5 rounded-full bg-white/[0.05] flex items-center justify-center text-[10px] text-zinc-600">
                  {i + 5}
                </span>
                <p className={cn('text-xs text-zinc-500', dir === 'rtl' && 'text-right')}>{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div className="glass rounded-2xl p-5">
          <div className={cn('flex items-center gap-3', dir === 'rtl' && 'flex-row-reverse')}>
            <div className="w-8 h-8 rounded-xl bg-white/[0.05] flex items-center justify-center">
              <Moon className="w-4 h-4 text-zinc-400" />
            </div>
            <div className={cn('flex-1', dir === 'rtl' ? 'text-right' : '')}>
              <p className="text-sm font-medium text-white">{t.settings.theme}</p>
              <p className="text-xs text-zinc-600">{t.settings.themeDesc}</p>
            </div>
            <div className="shrink-0 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-[10px] text-zinc-600">
              Dark
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
