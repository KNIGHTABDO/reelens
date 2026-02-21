'use client'

import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '@/lib/language-context'
import { cn } from '@/lib/utils'
import { Sparkles, RefreshCw } from 'lucide-react'

interface Props {
  videoData: Record<string, unknown>
  apiKey?: string
}

export function AiExplanation({ videoData, apiKey }: Props) {
  const { t, dir, locale } = useLanguage()
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  async function generate() {
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()
    setText('')
    setError('')
    setDone(false)
    setLoading(true)

    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoData, locale, apiKey }),
        signal: abortRef.current.signal,
      })

      if (!res.ok || !res.body) throw new Error('Stream failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done: d, value } = await reader.read()
        if (d) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') { setDone(true); continue }
          try {
            const parsed = JSON.parse(data)
            if (parsed.error) { setError(parsed.error); break }
            if (parsed.text) setText(prev => prev + parsed.text)
          } catch { /* skip */ }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(t.errors.generic)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (videoData) generate()
    return () => abortRef.current?.abort()
  }, []) // eslint-disable-line

  // Markdown-like renderer (bold, headers)
  function renderText(raw: string) {
    return raw
      .split('\n')
      .map((line, i) => {
        const h2 = line.match(/^##\s+(.+)/)
        const h3 = line.match(/^###\s+(.+)/)
        if (h2) return (
          <h2 key={i} className="text-base font-semibold text-white mt-5 mb-2 first:mt-0">
            {h2[1]}
          </h2>
        )
        if (h3) return (
          <h3 key={i} className="text-sm font-semibold text-zinc-300 mt-4 mb-1.5">
            {h3[1]}
          </h3>
        )
        if (!line.trim()) return <div key={i} className="h-2" />
        // Bold
        const parts = line.split(/(\*\*[^*]+\*\*)/)
        return (
          <p key={i} className={cn('text-sm text-zinc-400 leading-[1.85] mb-1', dir === 'rtl' && 'text-right')}>
            {parts.map((p, j) => {
              if (p.startsWith('**') && p.endsWith('**')) {
                return <strong key={j} className="text-white font-semibold">{p.slice(2, -2)}</strong>
              }
              return p
            })}
          </p>
        )
      })
  }

  return (
    <div className="glass rounded-2xl p-5" dir={dir}>
      {/* Header */}
      <div className={cn('flex items-center justify-between mb-4', dir === 'rtl' && 'flex-row-reverse')}>
        <div className={cn('flex items-center gap-2', dir === 'rtl' && 'flex-row-reverse')}>
          <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">{t.analysis.explanation}</p>
        </div>
        {(done || error) && (
          <button
            onClick={generate}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="min-h-[120px]">
        {loading && !text && (
          <div className="space-y-2.5 animate-pulse">
            {[90, 75, 85, 60, 80].map((w, i) => (
              <div key={i} className="h-3 rounded-full bg-white/[0.04]" style={{ width: `${w}%` }} />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4">
            <p className={cn('text-sm text-red-400', dir === 'rtl' && 'text-right')}>{error}</p>
          </div>
        )}

        {text && (
          <div className={cn('prose-dark', loading && !done && 'cursor-blink')}>
            {renderText(text)}
          </div>
        )}
      </div>

      {/* Streaming indicator */}
      {loading && text && (
        <div className={cn('flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.04]', dir === 'rtl' && 'flex-row-reverse')}>
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-1 h-1 rounded-full bg-white/30 animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
          <span className="text-[10px] text-zinc-600">{t.analysis.generatingExplanation}</span>
        </div>
      )}
    </div>
  )
}
