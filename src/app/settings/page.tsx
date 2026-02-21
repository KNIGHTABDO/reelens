'use client'

import { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '@/lib/language-context'
import { cn } from '@/lib/utils'
import { Globe, Key, Smartphone, Check, Eye, EyeOff, Github, Cpu, RefreshCw, ChevronDown, X } from 'lucide-react'

type GhModel = { id: string; name: string; provider: string }

export default function SettingsPage() {
  const { t, dir, locale, setLocale } = useLanguage()

  const [geminiKey, setGeminiKey] = useState('')
  const [socialkitKey, setSocialkitKey] = useState('')
  const [ensembleKey, setEnsembleKey] = useState('')
  const [supadataKey, setSupadataKey] = useState('')
  const [githubToken, setGithubToken] = useState('')
  const [showGemini, setShowGemini] = useState(false)
  const [showSocialkit, setShowSocialkit] = useState(false)
  const [showGithub, setShowGithub] = useState(false)
  const [saved, setSaved] = useState(false)
  const [provider, setProvider] = useState<'gemini' | 'github'>('gemini')
  const [ghModels, setGhModels] = useState<GhModel[]>([])
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini')
  const [loadingModels, setLoadingModels] = useState(false)
  const [modelsError, setModelsError] = useState('')
  const [showModelSheet, setShowModelSheet] = useState(false)
  const [modelSearch, setModelSearch] = useState('')

  useEffect(() => {
    setGeminiKey(localStorage.getItem('reelens-gemini-key') || '')
    setSocialkitKey(localStorage.getItem('reelens-socialkit-key') || '')
    setEnsembleKey(localStorage.getItem('reelens-ensemble-key') || '')
    setSupadataKey(localStorage.getItem('reelens-supadata-key') || '')
    setGithubToken(localStorage.getItem('reelens-github-token') || '')
    setProvider((localStorage.getItem('reelens-provider') as 'gemini' | 'github') || 'gemini')
    setSelectedModel(localStorage.getItem('reelens-github-model') || 'gpt-4o-mini')
  }, [])

  const fetchModels = useCallback(async (token?: string) => {
    const tk = token || githubToken
    if (!tk) { setModelsError(dir === 'rtl' ? 'أدخل رمز GitHub أولاً' : 'Enter GitHub token first'); return }
    setLoadingModels(true)
    setModelsError('')
    try {
      const res = await fetch('/api/github-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list', token: tk }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { setModelsError(data.error || 'Failed'); return }
      setGhModels(data.models || [])
      if (data.models?.length > 0) setShowModelSheet(true)
    } catch (e) {
      setModelsError(String(e))
    } finally {
      setLoadingModels(false)
    }
  }, [githubToken, dir])

  function save() {
    localStorage.setItem('reelens-gemini-key', geminiKey)
    localStorage.setItem('reelens-socialkit-key', socialkitKey)
    localStorage.setItem('reelens-ensemble-key', ensembleKey)
    localStorage.setItem('reelens-supadata-key', supadataKey)
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

  const filteredModels = ghModels.filter(m =>
    !modelSearch || m.name.toLowerCase().includes(modelSearch.toLowerCase()) || m.provider.toLowerCase().includes(modelSearch.toLowerCase())
  )

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
              {isRtl ? '⚡ يستخدم رمز GitHub الخاص بك — مجاني مع Copilot' : '⚡ Uses your GitHub token — free with Copilot access'}
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
          <div className="space-y-1.5">
            <label className={cn('text-xs text-zinc-500', isRtl && 'block text-right')}>Gemini API Key</label>
            <PasswordInput value={geminiKey} onChange={setGeminiKey} show={showGemini} onToggle={() => setShowGemini(!showGemini)} placeholder="AIzaSy..." />
          </div>
          <div className="space-y-1.5">
            <label className={cn('text-xs text-zinc-500', isRtl && 'block text-right')}>SocialKit API Key</label>
            <PasswordInput value={socialkitKey} onChange={setSocialkitKey} show={showSocialkit} onToggle={() => setShowSocialkit(!showSocialkit)} placeholder="sk_..." />
          </div>
        </div>

        {/* EnsembleData */}
        <div className={sectionCls}>
          <SectionHeader
            icon={<Key className="w-4 h-4 text-zinc-400" />}
            label="EnsembleData"
            desc={isRtl ? 'بديل مجاني: 50 طلب/يوم — إحصائيات + تعليقات' : 'Free fallback: 50 units/day — stats + comments'}
          />
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <p className="text-xs text-emerald-400/90">
                {isRtl ? 'مجاني 50 وحدة/يوم • بدون بطاقة ائتمانية' : 'Free 50 units/day • No credit card needed'}
              </p>
              <a href="https://ensembledata.com" target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-600 hover:text-zinc-400 ms-auto underline transition-colors">
                {isRtl ? 'احصل على مفتاح' : 'Get key'}
              </a>
            </div>
            <PasswordInput value={ensembleKey} onChange={setEnsembleKey} show={showSocialkit} onToggle={() => setShowSocialkit(!showSocialkit)} placeholder="ed_..." />
          </div>
        </div>

        {/* Supadata */}
        <div className={sectionCls}>
          <SectionHeader
            icon={<Key className="w-4 h-4 text-zinc-400" />}
            label="Supadata"
            desc={isRtl ? 'بديل مجاني: 100 طلب — نصوص فيديو TikTok' : 'Free fallback: 100 requests — TikTok transcripts'}
          />
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <p className="text-xs text-blue-400/90">
                {isRtl ? 'مجاني 100 طلب • متخصص في النصوص' : 'Free 100 requests • Specialized in transcripts'}
              </p>
              <a href="https://supadata.ai" target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-600 hover:text-zinc-400 ms-auto underline transition-colors">
                {isRtl ? 'احصل على مفتاح' : 'Get key'}
              </a>
            </div>
            <PasswordInput value={supadataKey} onChange={setSupadataKey} show={showSocialkit} onToggle={() => setShowSocialkit(!showSocialkit)} placeholder="sd_..." />
          </div>
        </div>

        {/* GitHub Models */}
        <div className={sectionCls}>
          <SectionHeader
            icon={<Github className="w-4 h-4 text-zinc-400" />}
            label="GitHub Models"
            desc={isRtl ? 'GPT-4o وغيره عبر GitHub مجاناً مع Copilot' : 'GPT-4o, Llama & more — free with Copilot'}
          />

          <div className="space-y-1.5">
            <label className={cn('text-xs text-zinc-500', isRtl && 'block text-right')}>
              {isRtl ? 'رمز GitHub الشخصي (PAT)' : 'GitHub Personal Access Token (PAT)'}
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
                <button type="button" onClick={() => setShowGithub(!showGithub)}
                  className={cn('absolute top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300', isRtl ? 'left-3' : 'right-3')}>
                  {showGithub ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                onClick={() => fetchModels(githubToken)}
                disabled={loadingModels || !githubToken}
                className="px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/10 border border-white/[0.08] text-zinc-300 disabled:opacity-40 transition-all flex items-center gap-1.5"
              >
                <RefreshCw className={cn('w-3.5 h-3.5', loadingModels && 'animate-spin')} />
                <span className="text-xs">{isRtl ? 'جلب' : 'Fetch'}</span>
              </button>
            </div>
            {modelsError && <p className="text-xs text-red-400">{modelsError}</p>}
          </div>

          {/* Selected model display */}
          <div className="space-y-1.5">
            <label className={cn('text-xs text-zinc-500', isRtl && 'block text-right')}>
              {isRtl ? 'النموذج المختار' : 'Selected Model'}
            </label>
            <button
              onClick={() => { if (ghModels.length > 0) setShowModelSheet(true) }}
              className={cn(
                'w-full flex items-center justify-between px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white hover:border-white/20 transition-all',
                isRtl && 'flex-row-reverse',
                ghModels.length === 0 && 'opacity-50 cursor-default'
              )}
            >
              <span className="truncate">{ghModels.find(m => m.id === selectedModel)?.name || selectedModel}</span>
              {ghModels.length > 0 && <ChevronDown className="w-4 h-4 text-zinc-500 flex-shrink-0 ml-2" />}
            </button>
          </div>

          {/* Quick select when no models fetched */}
          {ghModels.length === 0 && (
            <div className="space-y-1.5">
              <label className={cn('text-xs text-zinc-500', isRtl && 'block text-right')}>
                {isRtl ? 'أو اختر سريعاً' : 'Quick select'}
              </label>
              <div className="flex flex-wrap gap-2">
                {['gpt-4o', 'gpt-4o-mini', 'Meta-Llama-3.1-70B-Instruct', 'Mistral-Large'].map(m => (
                  <button key={m} onClick={() => setSelectedModel(m)}
                    className={cn('px-3 py-1.5 rounded-lg text-xs border transition-all',
                      selectedModel === m ? 'bg-white text-black border-white' : 'border-white/[0.08] text-zinc-400 hover:border-white/20 hover:text-white'
                    )}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}

          <a
            href="https://github.com/settings/tokens/new?scopes=repo&description=REELENS"
            target="_blank" rel="noopener noreferrer"
            className={cn('block text-xs text-zinc-600 hover:text-zinc-400 transition-colors underline-offset-2 underline', isRtl && 'text-right')}
          >
            {isRtl ? 'إنشاء رمز GitHub ←' : '→ Create GitHub token'}
          </a>
        </div>

        {/* iOS Shortcut */}
        <div className={sectionCls}>
          <SectionHeader
            icon={<Smartphone className="w-4 h-4 text-zinc-400" />}
            label={isRtl ? 'اختصار iOS' : 'iOS Shortcut'}
            desc={isRtl ? 'حلل أي فيديو من زر المشاركة — 30 ثانية للإعداد' : 'Analyze any video from share sheet — 30s setup'}
          />
          <div className="space-y-3">
            {/* Open Shortcuts app button */}
            <a
              href="shortcuts://create-shortcut"
              className={cn(
                'flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl font-semibold text-sm transition-all',
                'bg-blue-500 hover:bg-blue-400 active:bg-blue-600 text-white shadow-lg shadow-blue-500/20'
              )}
            >
              <Smartphone className="w-4 h-4" />
              {isRtl ? 'افتح تطبيق الاختصارات' : 'Open Shortcuts App'}
            </a>

            {/* Step-by-step instructions */}
            <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3.5 space-y-2.5">
              <p className={cn('text-xs font-semibold text-zinc-400 uppercase tracking-wide', isRtl && 'text-right')}>
                {isRtl ? 'أضف اختصاراً يدوياً في دقيقة واحدة:' : 'Create the shortcut manually in 1 minute:'}
              </p>
              {[
                isRtl
                  ? ['١', 'افتح الاختصارات ← اضغط + لاختصار جديد']
                  : ['1', 'Open Shortcuts → tap + for a new shortcut'],
                isRtl
                  ? ['٢', 'ابحث عن إجراء "فتح عناوين URL" وأضفه']
                  : ['2', 'Search for "Open URLs" action and add it'],
                isRtl
                  ? ['٣', 'في حقل الرابط، اكتب:']
                  : ['3', 'In the URL field, type:'],
                isRtl
                  ? ['٤', 'اضغط على إدخال الاختصار ← اختر عنوان URL']
                  : ['4', 'Tap Shortcut Input → choose URL'],
                isRtl
                  ? ['٥', 'سمّه REELENS واضغط تم']
                  : ['5', 'Name it REELENS and tap Done'],
                isRtl
                  ? ['٦', 'شارك أي فيديو ← اختر REELENS ✓']
                  : ['6', 'Share any video → tap REELENS ✓'],
              ].map(([num, text], i) => (
                <div key={i} className={cn('flex items-start gap-2.5', isRtl && 'flex-row-reverse')}>
                  <span className="text-[10px] font-bold text-zinc-600 bg-white/[0.04] rounded-md px-1.5 py-0.5 flex-shrink-0 mt-0.5 min-w-[1.4rem] text-center">{num}</span>
                  <span className="text-xs text-zinc-400 leading-relaxed">{text}</span>
                </div>
              ))}
            </div>

            {/* URL to copy */}
            <div className="space-y-1.5">
              <p className={cn('text-xs text-zinc-600', isRtl && 'text-right')}>
                {isRtl ? 'الرابط الذي تضعه في الإجراء:' : 'URL to paste into the action:'}
              </p>
              <div
                className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 font-mono text-xs text-zinc-300 break-all cursor-pointer select-all active:bg-white/[0.07] transition-colors"
                dir="ltr"
                onClick={() => navigator.clipboard?.writeText('https://reelens.vercel.app/analyze?url=')}
              >
                https://reelens.vercel.app/analyze?url=
              </div>
              <p className={cn('text-[10px] text-zinc-700', isRtl && 'text-right')}>
                {isRtl ? 'اضغط لنسخ الرابط' : 'Tap to copy'}
              </p>
            </div>
          </div>
        </div>

        {/* Save */}
        <button
          onClick={save}
          className={cn('w-full py-3 rounded-2xl text-sm font-semibold transition-all',
            saved ? 'bg-green-500/90 text-white' : 'bg-white text-black hover:bg-zinc-100'
          )}
        >
          {saved
            ? (isRtl ? 'تم الحفظ ✓' : 'Saved ✓')
            : (t.settings.save || (isRtl ? 'حفظ الإعدادات' : 'Save Settings'))
          }
        </button>
      </div>

      {/* Full-screen model picker sheet — renders outside the card flow so it never clips */}
      {showModelSheet && (
        <div className="fixed inset-0 z-[9999] flex flex-col justify-end bg-black/60 backdrop-blur-sm" onClick={() => setShowModelSheet(false)}>
          <div
            className="bg-[#0d0d0d] border-t border-white/[0.08] rounded-t-2xl max-h-[88vh] flex flex-col shadow-2xl"
            onClick={e => e.stopPropagation()}
            dir={dir}
          >
            {/* Sheet header */}
            <div className={cn('flex items-center justify-between px-5 py-4 border-b border-white/[0.06]', isRtl && 'flex-row-reverse')}>
              <p className="text-sm font-semibold text-white">
                {isRtl ? `اختر النموذج (${ghModels.length})` : `Select Model (${ghModels.length})`}
              </p>
              <button onClick={() => setShowModelSheet(false)} className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 py-3 border-b border-white/[0.04]">
              <input
                value={modelSearch}
                onChange={e => setModelSearch(e.target.value)}
                placeholder={isRtl ? 'ابحث عن نموذج...' : 'Search models...'}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/20"
                dir={isRtl ? 'rtl' : 'ltr'}
                autoFocus
              />
            </div>

            {/* Model list — scrollable */}
            <div className="overflow-y-auto flex-1">
              {filteredModels.length === 0 ? (
                <p className="text-center text-zinc-600 text-sm py-8">{isRtl ? 'لا توجد نتائج' : 'No results'}</p>
              ) : (
                filteredModels.map(m => (
                  <button
                    key={m.id}
                    onClick={() => { setSelectedModel(m.id); setShowModelSheet(false) }}
                    className={cn(
                      'w-full px-5 py-4 flex items-center justify-between hover:bg-white/[0.06] active:bg-white/[0.08] transition-colors border-b border-white/[0.04] last:border-0',
                      isRtl && 'flex-row-reverse'
                    )}
                  >
                    <div className={isRtl ? 'text-right' : ''}>
                      <p className={cn('text-sm', selectedModel === m.id ? 'text-white font-medium' : 'text-zinc-300')}>{m.name}</p>
                      {m.provider && <p className="text-xs text-zinc-600 mt-0.5">{m.provider}</p>}
                    </div>
                    {selectedModel === m.id && <Check className="w-4 h-4 text-green-400 flex-shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
