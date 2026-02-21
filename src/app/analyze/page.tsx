'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/language-context'
import { VideoCard } from '@/components/video-card'
import { AiExplanation } from '@/components/ai-explanation'
import { addToHistory } from '@/lib/history'
import { cn } from '@/lib/utils'
import { ArrowLeft, Copy, Check } from 'lucide-react'

type VideoData = {
  url: string
  platform: string
  title: string
  caption: string
  hashtags: string[]
  author: { username: string; displayName: string; avatar: string; followers: number }
  stats: { views: number; likes: number; shares: number; comments: number; duration: number }
  thumbnail: string
  publishedAt: string
  transcript: string
  segments: Array<{ start: number; end: number; text: string }>
  topComments: Array<{ text?: string; comment?: string; likes?: number; username?: string }>
  aiSummary: string
}

function AnalyzeContent() {
  const { t, dir } = useLanguage()
  const searchParams = useSearchParams()
  const router = useRouter()
  const url = searchParams.get('url') || ''

  const [video, setVideo] = useState<VideoData | null>(null)
  const [loading, setLoading] = useState(false)
  const [stage, setStage] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!url) { router.push('/'); return }
    analyze()
  }, [url]) // eslint-disable-line

  async function analyze() {
    setLoading(true)
    setError('')
    setStage(t.analysis.loading)

    try {
      const apiKey = typeof window !== 'undefined' ? localStorage.getItem('reelens-socialkit-key') || '' : ''

      setStage(t.analysis.fetchingTranscript)
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, apiKey }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || t.errors.fetchFailed)

      setStage(t.analysis.fetchingComments)
      setVideo(data.video)

      // Save to history
      addToHistory({
        id: data.video.url,
        url: data.video.url,
        platform: data.video.platform as 'tiktok' | 'instagram',
        title: data.video.title,
        author: data.video.author.username,
        thumbnail: data.video.thumbnail,
        analyzedAt: new Date().toISOString(),
        stats: {
          views: data.video.stats.views,
          likes: data.video.stats.likes,
          shares: data.video.stats.shares,
          comments: data.video.stats.comments,
        }
      })
    } catch (err) {
      setError(String(err).replace('Error: ', ''))
    } finally {
      setLoading(false)
      setStage('')
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn('min-h-screen px-4 py-8', dir === 'rtl' && 'font-arabic')} dir={dir}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className={cn('flex items-center gap-3 mb-8', dir === 'rtl' && 'flex-row-reverse')}>
          <button
            onClick={() => router.push('/')}
            className="p-2 rounded-xl hover:bg-white/[0.05] text-zinc-500 hover:text-white transition-all"
          >
            <ArrowLeft className={cn('w-4 h-4', dir === 'rtl' && 'rotate-180')} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-zinc-600 truncate">{url}</p>
          </div>
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors px-2.5 py-1.5 rounded-lg hover:bg-white/5 border border-white/[0.06]"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? t.analysis.copied : t.analysis.copyLink}
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-2 border-white/[0.05]" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-white/60 animate-spin" />
            </div>
            <p className="text-sm text-zinc-500 animate-pulse">{stage}</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="max-w-lg mx-auto text-center py-24 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-2xl">
              ⚠️
            </div>
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="btn-ghost px-4 py-2 text-sm"
            >
              {t.analysis.analyzeAnother}
            </button>
          </div>
        )}

        {/* Content */}
        {video && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-5 animate-slide-up">
            {/* Left: Video data */}
            <div className="space-y-4">
              <VideoCard video={video} />
              <button
                onClick={() => router.push('/')}
                className="w-full btn-ghost py-2.5 text-sm"
              >
                {t.analysis.analyzeAnother}
              </button>
            </div>

            {/* Right: AI Explanation */}
            <div>
              <AiExplanation
                videoData={video as unknown as Record<string, unknown>}
                apiKey={typeof window !== 'undefined' ? localStorage.getItem('reelens-gemini-key') || '' : ''}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AnalyzePage() {
  return (
    <Suspense>
      <AnalyzeContent />
    </Suspense>
  )
}
