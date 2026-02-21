'use client'

import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '@/lib/language-context'
import { cn } from '@/lib/utils'
import { Sparkles, RefreshCw, ChevronDown } from 'lucide-react'

interface Props {
  videoData: {
    platform: string
    caption: string
    title: string
    author: { username: string }
    stats: { views: number; likes: number; duration: number }
    hashtags: string[]
    transcript: string
    topComments: Array<{ text?: string; comment?: string }>
    aiSummary: string
    publishedAt: string
  }
}

export function AiExplanation({ videoData }: Props) {
  const { t, dir, locale } = useLanguage()
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    generate()
    return () => abortRef.current?.abort()
  }, []) // eslint-disable-line

  async function generate() {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setText('')
    setError('')
    setDone(false)
    setLoading(true)

    const geminiKey  = typeof window !== 'undefined' ? localStorage.getItem('reelens-gemini-key')    || '' : ''
    const githubToken = typeof window !== 'undefined' ? localStorage.getItem('reelens-github-token') || '' : ''
    const githubModel = typeof window !== 'undefined' ? localStorage.getItem('reelens-github-model') || 'gpt-4o-mini' : 'gpt-4o-mini'
    const provider    = typeof window !== 'undefined' ? (localStorage.getItem('reelens-provider') as 'gemini' | 'github') || 'gemini' : 'gemini'

    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoData,
          locale,
          apiKey: geminiKey,
          provider,
          githubToken,
          githubModel,
        }),
        signal: ctrl.signal,
      })

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buf = ''

      while (true) {
        const { done: streamDone, value } = await reader.read()
        if (streamDone) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() || ''
        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || trimmed === 'data: [DONE]') continue
          if (trimmed.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(trimmed.slice(6))
              if (parsed.error) { setError(parsed.error); break }
              if (parsed.text) setText(prev => prev + parsed.text)
            } catch { /* skip */ }
          }
        }
      }
      setDone(true)
    } catch (e: unknown) {
      if ((e as Error).name !== 'AbortError') setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  // Render markdown-lite: **bold**, ## headers
  function renderMarkdown(raw: string) {
    return raw
      .replace(/^## (.+)$/gm, '<h3 class="text-sm font-semibold text-white mt-4 mb-1.5">$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      .replace(/\n/g, '<br/>')
  }

  const isRtl = dir === 'rtl'

  return (
    <div className={cn('glass rounded-2xl overflow-hidden', isRtl && 'font-arabic')} dir={dir}>
      {/* Header */}
      <div className={cn('flex items-center justify-between px-5 py-4 border-b border-white/[0.06]', isRtl && 'flex-row-reverse')}>
        <div className={cn('flex items-center gap-2.5', isRtl && 'flex-row-reverse')}>
          <Sparkles className="w-4 h-4 text-zinc-400" />
          <p className="text-sm font-medium text-white">{t.analysis.explanation}</p>
          {loading && (
            <span className={cn('text-[10px] text-zinc-600 uppercase tracking-wider', isRtl && 'text-right')}>
              {t.analysis.generatingExplanation}
            </span>
          )}
        </div>
        <div className={cn('flex items-center gap-2', isRtl && 'flex-row-reverse')}>
          {done && (
            <button
              onClick={generate}
              className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-white transition-colors"
              title={isRtl ? 'إعادة التوليد' : 'Regenerate'}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
          {text && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-white transition-colors"
            >
              <ChevronDown className={cn('w-4 h-4 transition-transform', collapsed && 'rotate-180')} />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      {!collapsed && (
        <div className="px-5 py-4">
          {loading && !text && (
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className={cn('space-y-2', isRtl && 'text-right')}>
              <p className="text-xs text-red-400/90 leading-relaxed">{error}</p>
              <button onClick={generate} className="text-xs text-zinc-500 hover:text-white underline transition-colors">
                {isRtl ? 'حاول مجدداً' : 'Try again'}
              </button>
            </div>
          )}

          {text && (
            <div
              className={cn('prose-reelens text-sm text-zinc-300 leading-relaxed', isRtl && 'text-right')}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }}
            />
          )}

          {loading && text && (
            <span className="inline-block w-0.5 h-4 bg-zinc-400 animate-pulse ml-0.5 align-middle" />
          )}
        </div>
      )}
    </div>
  )
}
