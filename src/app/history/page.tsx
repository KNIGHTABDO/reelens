'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useLanguage } from '@/lib/language-context'
import { getHistory, clearHistory, removeFromHistory, type HistoryItem } from '@/lib/history'
import { cn, formatNumber, timeAgo } from '@/lib/utils'
import { Trash2, ExternalLink, Clock, Eye, Heart } from 'lucide-react'

export default function HistoryPage() {
  const { t, dir, locale } = useLanguage()
  const [items, setItems] = useState<HistoryItem[]>([])

  useEffect(() => { setItems(getHistory()) }, [])

  function handleClear() {
    clearHistory()
    setItems([])
  }

  function handleRemove(id: string) {
    removeFromHistory(id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  return (
    <div className={cn('min-h-screen px-4 py-10', dir === 'rtl' && 'font-arabic')} dir={dir}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className={cn('flex items-end justify-between mb-8', dir === 'rtl' && 'flex-row-reverse')}>
          <div>
            <h1 className="text-2xl font-bold text-white">{t.history.title}</h1>
            <p className="text-sm text-zinc-600 mt-1">{t.history.subtitle}</p>
          </div>
          {items.length > 0 && (
            <button
              onClick={handleClear}
              className="text-xs text-zinc-600 hover:text-red-400 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3 h-3" />
              {t.history.clearAll}
            </button>
          )}
        </div>

        {/* Empty */}
        {items.length === 0 && (
          <div className="text-center py-24 space-y-3">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-white font-medium">{t.history.empty}</p>
            <p className="text-sm text-zinc-600">{t.history.emptySubtitle}</p>
            <Link href="/" className="inline-block mt-4 btn-ghost px-4 py-2 text-sm">
              {t.nav.home}
            </Link>
          </div>
        )}

        {/* List */}
        {items.length > 0 && (
          <div className="space-y-3">
            {items.map(item => (
              <div
                key={item.id}
                className="glass rounded-2xl p-4 group hover:border-white/[0.1] transition-all duration-200"
              >
                <div className={cn('flex gap-3', dir === 'rtl' && 'flex-row-reverse')}>
                  {/* Thumbnail */}
                  <div className="shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-zinc-900">
                    {item.thumbnail ? (
                      <Image src={item.thumbnail} alt={item.title} width={64} height={64} className="object-cover w-full h-full" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        {item.platform === 'tiktok' ? '🎵' : '📸'}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className={cn('flex items-start justify-between gap-2', dir === 'rtl' && 'flex-row-reverse')}>
                      <div className="min-w-0">
                        <p className={cn('text-sm font-medium text-white truncate', dir === 'rtl' && 'text-right')}>
                          {item.title}
                        </p>
                        <p className="text-xs text-zinc-600 mt-0.5">@{item.author}</p>
                      </div>
                      <div className={cn('flex items-center gap-1 shrink-0', dir === 'rtl' && 'flex-row-reverse')}>
                        <Link
                          href={`/analyze?url=${encodeURIComponent(item.url)}`}
                          className="p-1.5 rounded-lg hover:bg-white/[0.05] text-zinc-600 hover:text-white transition-colors"
                          title={t.analysis.viewOriginal}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleRemove(item.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Stats */}
                    {item.stats && (
                      <div className={cn('flex items-center gap-3 mt-2', dir === 'rtl' && 'flex-row-reverse')}>
                        {item.stats.views !== undefined && (
                          <span className="flex items-center gap-1 text-[10px] text-zinc-600">
                            <Eye className="w-3 h-3" />{formatNumber(item.stats.views)}
                          </span>
                        )}
                        {item.stats.likes !== undefined && (
                          <span className="flex items-center gap-1 text-[10px] text-zinc-600">
                            <Heart className="w-3 h-3" />{formatNumber(item.stats.likes)}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-[10px] text-zinc-700 ml-auto">
                          <Clock className="w-3 h-3" />{timeAgo(item.analyzedAt, locale)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
