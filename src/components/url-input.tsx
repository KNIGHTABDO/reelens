'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLanguage } from '@/lib/language-context'
import { isValidVideoUrl } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { ArrowRight, Link2 } from 'lucide-react'

export function UrlInput() {
  const { t, dir } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Handle iOS shortcut deep-link: ?url=...
  useEffect(() => {
    const incomingUrl = searchParams.get('url') || searchParams.get('id')
    if (incomingUrl) {
      setUrl(decodeURIComponent(incomingUrl))
      handleSubmit(decodeURIComponent(incomingUrl))
    }
  }, []) // eslint-disable-line

  function handleSubmit(submitUrl?: string) {
    const target = submitUrl || url
    if (!target.trim()) { setError(t.errors.invalidUrl); return }
    if (!isValidVideoUrl(target.trim())) { setError(t.errors.notSupported); return }
    setError('')
    setLoading(true)
    router.push(`/analyze?url=${encodeURIComponent(target.trim())}`)
  }

  return (
    <div className="w-full max-w-2xl mx-auto" dir={dir}>
      <div className={cn(
        'relative flex items-center gap-3 p-2 rounded-2xl',
        'bg-white/[0.03] border border-white/[0.08]',
        'focus-within:border-white/20 focus-within:bg-white/[0.05]',
        'transition-all duration-300',
        'shadow-[0_0_40px_rgba(0,0,0,0.4)]'
      )}>
        <div className="shrink-0 pl-2 text-zinc-500">
          <Link2 className="w-4 h-4" />
        </div>
        <input
          type="url"
          value={url}
          onChange={e => { setUrl(e.target.value); setError('') }}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder={t.hero.placeholder}
          className={cn(
            'flex-1 bg-transparent text-white placeholder:text-zinc-600',
            'text-sm focus:outline-none py-2',
            dir === 'rtl' && 'text-right'
          )}
          disabled={loading}
          dir={dir}
        />
        <button
          onClick={() => handleSubmit()}
          disabled={loading || !url.trim()}
          className={cn(
            'shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl',
            'bg-white text-black text-sm font-semibold',
            'hover:bg-zinc-200 transition-all duration-200',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            'hover:shadow-[0_4px_20px_rgba(255,255,255,0.1)]',
            loading && 'cursor-not-allowed'
          )}
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          ) : (
            <>
              <span>{t.hero.cta}</span>
              <ArrowRight className={cn('w-3.5 h-3.5', dir === 'rtl' && 'rotate-180')} />
            </>
          )}
        </button>
      </div>

      {error && (
        <p className={cn(
          'mt-2 text-xs text-red-400/80 animate-fade-in px-2',
          dir === 'rtl' && 'text-right'
        )}>
          {error}
        </p>
      )}
    </div>
  )
}
