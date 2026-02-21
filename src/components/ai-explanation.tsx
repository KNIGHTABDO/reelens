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

  // Render markdown: all heading levels, bold, italic, bullets, numbered lists, code
  function renderMarkdown(raw: string) {
    // Process block-level first, then inline
    let html = raw
    // Decorative separator lines
    html = html.replace(/^[─═━─]{3,}$/gm, '<hr class="border-0 border-t border-white/[0.06] my-3"/>')
    // h1 → big heading
    html = html.replace(/^# (.+)$/gm, '<h2 class="text-base font-bold text-white mt-5 mb-2 leading-snug">$1</h2>')
    // h2 → medium heading  
    html = html.replace(/^## (.+)$/gm, '<h3 class="text-sm font-semibold text-white mt-4 mb-1.5 leading-snug">$1</h3>')
    // h3 → small subheading
    html = html.replace(/^### (.+)$/gm, '<h4 class="text-[13px] font-medium text-zinc-200 mt-3 mb-1 leading-snug">$1</h4>')
    // h4+ → inline label
    html = html.replace(/^#{4,} (.+)$/gm, '<span class="text-xs font-semibold text-zinc-400 uppercase tracking-wide">$1</span>')
    // Bullet points (•, -, *)
    html = html.replace(/^[\u2022\-\*] (.+)$/gm, '<div class="flex gap-2 my-0.5 items-start"><span class="text-zinc-500 flex-shrink-0 leading-relaxed">•</span><span>$1</span></div>')
    // Numbered lists
    html = html.replace(/^(\d+)\. (.+)$/gm, '<div class="flex gap-2 my-0.5 items-start"><span class="text-zinc-500 flex-shrink-0 min-w-[1.2rem] leading-relaxed text-xs">$1.</span><span>$2</span></div>')
    // Bold + Italic combined
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong class="text-white font-semibold"><em>$1</em></strong>')
    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    // Italic
    html = html.replace(/\*([^\n\*]+?)\*/g, '<em class="text-zinc-200">$1</em>')
    // Inline code
    html = html.replace(/\`(.+?)\`/g, '<code class="px-1 py-0.5 rounded bg-white/[0.06] text-xs text-zinc-300 font-mono">$1</code>')
    // Double newlines → paragraph spacing
    html = html.replace(/\n{2,}/g, '<br/><br/>')
    html = html.replace(/\n/g, '<br/>')
    return html
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
