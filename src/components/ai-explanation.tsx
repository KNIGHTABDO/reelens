\'use client\'

import { useEffect, useRef, useState } from \'react\'
import { useLanguage } from \'@/lib/language-context\'
import { cn } from \'@/lib/utils\'
import { Bot, RefreshCw, Loader2 } from \'lucide-react\'

type VideoData = Record<string, unknown>

export function AiExplanation({ videoData }: { videoData: VideoData }) {
  const { t, locale, dir } = useLanguage()
  const [text, setText] = useState(\'\')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(\'\')
  const [done, setDone] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    generate()
    return () => abortRef.current?.abort()
  }, [videoData.url]) // eslint-disable-line

  async function generate() {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setText(\'\')
    setError(\'\')
    setDone(false)
    setLoading(true)

    try {
      // Read provider settings from localStorage
      const provider = localStorage.getItem(\'reelens-provider\') || \'gemini\'
      const githubToken = localStorage.getItem(\'reelens-github-token\') || \'\'
      const githubModel = localStorage.getItem(\'reelens-github-model\') || \'gpt-4o-mini\'
      const geminiKey = localStorage.getItem(\'reelens-gemini-key\') || \'\'

      const res = await fetch(\'/api/explain\', {
        method: \'POST\',
        headers: { \'Content-Type\': \'application/json\' },
        signal: ctrl.signal,
        body: JSON.stringify({
          videoData,
          locale,
          apiKey: geminiKey,
          provider,
          githubToken,
          githubModel,
        }),
      })

      if (!res.body) throw new Error(\'No response stream\')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = \'\'

      while (true) {
        const { done: streamDone, value } = await reader.read()
        if (streamDone) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split(\'\n\')
        buffer = lines.pop() || \'\'
        for (const line of lines) {
          if (!line.startsWith(\'data: \')) continue
          const payload = line.slice(6).trim()
          if (payload === \'[DONE]\') { setDone(true); continue }
          try {
            const chunk = JSON.parse(payload)
            if (chunk.error) { setError(chunk.error); return }
            if (chunk.text) setText(prev => prev + chunk.text)
          } catch { /* skip */ }
        }
      }
    } catch (e: unknown) {
      if ((e as Error)?.name !== \'AbortError\') setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  // Render markdown-lite: bold, headers
  function renderText(raw: string) {
    return raw
      .replace(/\*\*(.+?)\*\*/g, \'<strong>$1</strong>\')
      .replace(/^## (.+)$/gm, \'<h3 class="text-base font-semibold text-white mt-4 mb-1">$1</h3>\')
      .replace(/\n/g, \'<br/>\')
  }

  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      <div className={cn(\'flex items-center justify-between\', dir === \'rtl\' && \'flex-row-reverse\')}>
        <div className={cn(\'flex items-center gap-2.5\', dir === \'rtl\' && \'flex-row-reverse\')}>
          <div className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center">
            <Bot className="w-4 h-4 text-zinc-300" />
          </div>
          <span className="text-sm font-medium text-white">{t.analysis.explanation}</span>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-200 transition-colors disabled:opacity-40"
        >
          {loading
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <RefreshCw className="w-3.5 h-3.5" />
          }
          {dir === \'rtl\' ? \'إعادة\' : \'Regenerate\'}
        </button>
      </div>

      {/* Error */}
      {error && !text && (
        <div className="text-sm text-red-400/90 bg-red-500/5 border border-red-500/10 rounded-xl p-4 text-left" dir="ltr">
          {error}
        </div>
      )}

      {/* Streaming text */}
      {(text || loading) && (
        <div
          ref={containerRef}
          className={cn(
            \'text-sm text-zinc-300 leading-relaxed space-y-1\',
            dir === \'rtl\' ? \'text-right\' : \'text-left\'
          )}
          dir={dir}
          dangerouslySetInnerHTML={{ __html: renderText(text) + (loading && !done ? \'<span class="inline-block w-0.5 h-4 bg-white/70 animate-pulse ml-0.5 align-middle" />\' : \'\') }}
        />
      )}

      {/* Placeholder */}
      {!text && !loading && !error && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 text-zinc-600 animate-spin" />
        </div>
      )}
    </div>
  )
}
