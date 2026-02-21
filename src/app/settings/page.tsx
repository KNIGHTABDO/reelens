'use client'

import { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '@/lib/language-context'
import { cn } from '@/lib/utils'
import { Globe, Key, Smartphone, Check, Eye, EyeOff, Github, Cpu, RefreshCw, ChevronDown } from 'lucide-react'

type GhModel = { id: string; name: string; provider: string }

export default function SettingsPage() {
  const { t, dir, locale, setLocale } = useLanguage()

  // Keys
  const [geminiKey, setGeminiKey] = useState('')
  const [socialkitKey, setSocialkitKey] = useState('')
  const [githubToken, setGithubToken] = useState('')
  const [showGemini, setShowGemini] = useState(false)
  const [showSocialkit, setShowSocialkit] = useState(false)
  const [showGithub, setShowGithub] = useState(false)
  const [saved, setSaved] = useState(false)

  // Provider
  const [provider, setProvider] = useState<'gemini' | 'github'>('gemini')

  // GitHub Models
  const [ghModels, setGhModels] = useState<GhModel[]>([])
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini')
  const [loadingModels, setLoadingModels] = useState(false)
  const [modelsError, setModelsError] = useState('')
  const [showModelDrop, setShowModelDrop] = useState(false)

  useEffect(() => {
    setGeminiKey(localStorage.getItem('reelens-gemini-key') || '')
    setSocialkitKey(localStorage.getItem('reelens-socialkit-key') || '')
    setGithubToken(localStorage.getItem('reelens-github-token') || '')
    setProvider((localStorage.getItem('reelens-provider') as 'gemini' | 'github') || 'gemini')
    setSelectedModel(localStorage.getItem('reelens-github-model') || 'gpt-4o-mini')
  }, [])

  const fetchModels = useCallback(async (token?: string) => {
    const t = token || githubToken
    if (!t) { setModelsError(dir === 'rtl' ? 'أدخل رمز GitHub أولاً' : 'Enter GitHub token first'); return }
    setLoadingModels(true)
    setModelsError('')
    try {
      const res = await fetch('/api/github-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list', token: t }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { setModelsError(data.error || 'Failed'); return }
      setGhModels(data.models || [])
    } catch (e) {
      setModelsError(String(e))
    } finally {
      setLoadingModels(false)
    }
  }, [githubToken, dir])

  function save() {
    localStorage.setItem('reelens-gemini-key', geminiKey)
    localStorage.setItem('reelens-socialkit-key', socialkitKey)
    localStorage.setItem('reelens-github-token', githubToken)
    localStorage.setItem('reelens-provider', provider)
    localStorage.setItem('reelens-github-model', selectedModel)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const isRtl = dir === 'rtl'
  const sectionCls = 'glass rounded-2xl p-5 space-y-4'
  const labelCls = cn('text-sm font-medium text-white', isRtl && 'text-right')
  const descCls = cn('text-xs text-zinc-600', isRtl && 'text-right')
  const inputCls = 'w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/20 font-mono'

  function SectionHeader({ icon, label, desc }: { icon: React.ReactNode; label: string; desc: string }) {
    return (
      <div className={cn('flex items-center gap-3', isRtl && 'flex-row-reverse')}>
        <div className="w-8 h-8 rounded-xl bg-white/[0.05] flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div className={isRtl ? 'text-right' : ''}>
          <p className={labelCls}>{label}</p>
          <p className={descCls}>{desc}</p>
        </div>
      </div>
    )
  }

  function PasswordInput({ value, onChange, show, onToggle, placeholder }: {
    value: string; onChange: (v: string) => void;
    show: boolean; onToggle: () => void; placeholder: string
  }) {
    return (
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(inputCls, isRtl ? 'pr-3.5 pl-10 text-right' : 'pr-10')}
          dir="ltr"
        />
        <button
          type="button"
          onClick={onToggle}
          className={cn('absolute top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300', isRtl ? 'left-3' : 'right-3')}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    )
  }

  return (
    <div className={cn('min-h-screen px-4 py-10', isRtl && 'font-arabic')} dir={dir}>
      <div className="max-w-lg mx-auto space-y-5">
        {/* Header */}
        <div className={isRtl ? 'text-right' : ''}>
          <h1 className="text-2xl font-bold text-white">{t.settings.title}</h1>
          <p className={descCls + ' mt-1'}>{t.settings.subtitle}</p>
        </div>

        {/* Language */}
        <div className={sectionCls}>
          <SectionHeader
            icon={<Globe className="w-4 h-4 text-zinc-400" />}
            label={t.settings.language}
            desc={t.settings.languageDesc}
          />
          <div className="grid grid-cols-2 gap-2">
            {(['en', 'ar'] as const).map(l => (
              <button key={l} onClick={() => setLocale(l)}
                className={cn('py-2.5 rounded-xl text-sm font-medium transition-all border',
                  locale === l ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-400 border-white/[0.08] hover:border-white/20 hover:text-white'
                )}>
                {l === 'en' ? t.settings.english : t.settings.arabic}
              </button>
            ))}
          </div>
        </div>

        {/* AI Provider */}
        <div className={sectionCls}>
          <SectionHeader
            icon={<Cpu className="w-4 h-4 text-zinc-400" />}
            label={isRtl ? 'مزود الذكاء الاصطناعي' : 'AI Provider'}
            desc={isRtl ? 'اختر نموذج الذكاء الاصطناعي للتحليل' : 'Choose the AI model for explanations'}
          />
          <div className="grid grid-cols-2 gap-2">
            {(['gemini', 'github'] as const).map(p => (
              <button key={p} onClick={() => setProvider(p)}
                className={cn('py-2.5 rounded-xl text-sm font-medium transition-all border',
                  provider === p ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-400 border-white/[0.08] hover:border-white/20 hover:text-white'
                )}>
                {p === 'gemini' ? 'Gemini AI' : 'GitHub Models'}
              </button>
            ))}
          </div>
          {provider === 'github' && (
            <p className={cn('text-xs text-amber-400/80', isRtl && 'text-right')}>
              {isRtl ? '⚡ يستخدم رمز GitHub الخاص بك وصول GitHub Copilot للنماذج' : '⚡ Uses your GitHub token with Copilot/GitHub Models access'}
            </p>
          )}
        </div>

        {/* API Keys */}
        <div className={sectionCls}>
          <SectionHeader
            icon={<Key className="w-4 h-4 text-zinc-400" />}
            label={t.settings.apiKeys}
            desc={t.settings.apiKeysDesc}
          />

          {/* Gemini key (always shown) */}
          <div className="space-y-1.5">
            <label className={cn('text-xs text-zinc-500', isRtl && 'block text-right')}>Gemini API Key</label>
            <PasswordInput
              value={geminiKey} onChange={setGeminiKey}
              show={showGemini} onToggle={() => setShowGemini(!showGemini)}
              placeholder="AIzaSy..."
            />
          </div>

          {/* SocialKit key */}
          <div className="space-y-1.5">
            <label className={cn('text-xs text-zinc-500', isRtl && 'block text-right')}>SocialKit API Key</label>
            <PasswordInput
              value={socialkitKey} onChange={setSocialkitKey}
              show={showSocialkit} onToggle={() => setShowSocialkit(!showSocialkit)}
              placeholder="sk_..."
            />
          </div>
        </div>

        {/* GitHub Models */}
        <div className={sectionCls}>
          <SectionHeader
            icon={<Github className="w-4 h-4 text-zinc-400" />}
            label={'GitHub Models'}
            desc={isRtl ? 'GPT-4o وغيره عبر GitHub مجاناً مع Copilot' : 'GPT-4o, Llama & more via GitHub — free with Copilot'}
          />

          <div className="space-y-1.5">
            <label className={cn('text-xs text-zinc-500', isRtl && 'block text-right')}>
              {isRtl ? 'رمز GitHub الشخصي (PAT مع Copilot)' : 'GitHub Personal Access Token (with Copilot)'}
            </label>
            <div className={cn('flex gap-2', isRtl && 'flex-row-reverse')}>
              <div className="flex-1 relative">
                <input
                  type={showGithub ? 'text' : 'password'}
                  value={githubToken}
                  onChange={e => setGithubToken(e.target.value)}
                  placeholder="ghp_..."
                  className={cn(inputCls, isRtl ? 'pr-3.5 pl-10 text-right' : 'pr-10')}
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowGithub(!showGithub)}
                  className={cn('absolute top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300', isRtl ? 'left-3' : 'right-3')}
                >
                  {showGithub ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                onClick={() => fetchModels(githubToken)}
                disabled={loadingModels || !githubToken}
                className="px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/10 border border-white/[0.08] text-zinc-300 disabled:opacity-40 transition-all flex items-center gap-1.5"
              >
                {loadingModels
                  ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  : <RefreshCw className="w-3.5 h-3.5" />
                }
                <span className="text-xs">{isRtl ? 'جلب' : 'Fetch'}</span>
              </button>
            </div>
            {modelsError && <p className="text-xs text-red-400">{modelsError}</p>}
          </div>

          {/* Model selector */}
          {ghModels.length > 0 && (
            <div className="space-y-1.5">
              <label className={cn('text-xs text-zinc-500', isRtl && 'block text-right')}>
                {isRtl ? 'اختر النموذج' : 'Select Model'}
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowModelDrop(!showModelDrop)}
                  className={cn('w-full flex items-center justify-between px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white hover:border-white/20 transition-all', isRtl && 'flex-row-reverse')}
                >
                  <span>{ghModels.find(m => m.id === selectedModel)?.name || selectedModel}</span>
                  <ChevronDown className={cn('w-4 h-4 text-zinc-500 transition-transform', showModelDrop && 'rotate-180')} />
                </button>
                {showModelDrop && (
                  <div className="absolute top-full mt-1 w-full bg-[#111] border border-white/10 rounded-xl overflow-hidden z-20 shadow-2xl max-h-48 overflow-y-auto">
                    {ghModels.map(m => (
                      <button
                        key={m.id}
                        onClick={() => { setSelectedModel(m.id); setShowModelDrop(false) }}
                        className={cn('w-full px-3.5 py-2.5 text-left text-sm hover:bg-white/[0.06] transition-colors', isRtl && 'text-right',
                          selectedModel === m.id ? 'text-white bg-white/[0.04]' : 'text-zinc-400'
                        )}
                      >
                        <span className="block">{m.name}</span>
                        {m.provider && <span className="text-xs text-zinc-600">{m.provider}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick model buttons when no fetch done yet */}
          {ghModels.length === 0 && (
            <div className="space-y-1.5">
              <label className={cn('text-xs text-zinc-500', isRtl && 'block text-right')}>
                {isRtl ? 'أو اختر سريعاً' : 'Quick select'}
              </label>
              <div className="flex flex-wrap gap-2">
                {['gpt-4o', 'gpt-4o-mini', 'Meta-Llama-3.1-70B-Instruct', 'Mistral-Large'].map(m => (
                  <button
                    key={m}
                    onClick={() => setSelectedModel(m)}
                    className={cn('px-3 py-1.5 rounded-lg text-xs border transition-all',
                      selectedModel === m ? 'bg-white text-black border-white' : 'border-white/[0.08] text-zinc-400 hover:border-white/20 hover:text-white'
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}

          <a
            href="https://github.com/settings/tokens/new?scopes=repo&description=REELENS"
            target="_blank"
            rel="noopener noreferrer"
            className={cn('block text-xs text-zinc-600 hover:text-zinc-400 transition-colors underline-offset-2 underline', isRtl && 'text-right')}
          >
            {isRtl ? 'إنشاء رمز GitHub ←' : '→ Create GitHub token'}
          </a>
        </div>

        {/* iOS Shortcut */}
        <div className={sectionCls}>
          <SectionHeader
            icon={<Smartphone className="w-4 h-4 text-zinc-400" />}
            label={t.settings.shortcut}
            desc={t.settings.shortcutDesc}
          />
          <div className={cn('space-y-3', isRtl && 'text-right')}>
            <p className="text-xs text-zinc-500">{t.settings.shortcutSteps}</p>
            <div className="bg-white/[0.03] rounded-xl p-3 font-mono text-xs text-zinc-400 break-all" dir="ltr">
              https://reelens.vercel.app/analyze?url=[URL]
            </div>
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={save}
          className={cn(
            'w-full py-3 rounded-2xl text-sm font-semibold transition-all',
            saved ? 'bg-green-500/90 text-white' : 'bg-white text-black hover:bg-zinc-100'
          )}
        >
          {saved
            ? (isRtl ? 'تم الحفظ ✓' : 'Saved ✓')
            : (t.settings.save || (isRtl ? 'حفظ الإعدادات' : 'Save Settings'))
          }
        </button>
      </div>
    </div>
  )
}
