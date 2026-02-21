\'use client\'

import { useEffect, useState, Suspense } from \'react\'
import { useSearchParams, useRouter } from \'next/navigation\'
import { useLanguage } from \'@/lib/language-context\'
import { VideoCard } from \'@/components/video-card\'
import { AiExplanation } from \'@/components/ai-explanation\'
import { addToHistory } from \'@/lib/history\'
import { cn } from \'@/lib/utils\'
import { ArrowLeft, Copy, Check, RefreshCw } from \'lucide-react\'

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

const VIDEO_CACHE_PREFIX = \'reelens-video-cache-\'

function getCachedVideo(url: string): VideoData | null {
  try {
    const raw = localStorage.getItem(VIDEO_CACHE_PREFIX + btoa(url))
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function setCachedVideo(url: string, data: VideoData) {
  try {
    localStorage.setItem(VIDEO_CACHE_PREFIX + btoa(url), JSON.stringify(data))
  } catch { /* storage full */ }
}

function AnalyzeContent() {
  const { t, dir } = useLanguage()
  const searchParams = useSearchParams()
  const router = useRouter()
  const url = searchParams.get(\'url\') || \'\'

  const [video, setVideo] = useState<VideoData | null>(null)
  const [loading, setLoading] = useState(false)
  const [stage, setStage] = useState(\'\')
  const [error, setError] = useState(\'\')
  const [copied, setCopied] = useState(false)
  const [fromCache, setFromCache] = useState(false)

  useEffect(() => {
    if (!url) { router.push(\'/\'); return }
    analyze()
  }, [url]) // eslint-disable-line

  async function analyze(forceRefresh = false) {
    setLoading(true)
    setError(\'\')

    const cached = !forceRefresh ? getCachedVideo(url) : null

    if (cached) {
      // Use cached video data — skip the SocialKit fetch entirely
      setVideo(cached)
      setFromCache(true)
      setLoading(false)
      setStage(\'\')
      return
    }

    setFromCache(false)
    setStage(t.analysis.loading)

    try {
      const socialkitKey = typeof window !== \'undefined\' ? localStorage.getItem(\'reelens-socialkit-key\') || \'\' : \'\'

      setStage(t.analysis.fetchingTranscript)
      const res = await fetch(\'/api/analyze\', {
        method: \'POST\',
        headers: { \'Content-Type\': \'application/json\' },
        body: JSON.stringify({ url, apiKey: socialkitKey }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || t.errors.fetchFailed)

      setStage(t.analysis.fetchingComments)
      setVideo(data.video)
      setCachedVideo(url, data.video)

      addToHistory({
        id: data.video.url,
        url: data.video.url,
        platform: data.video.platform as \'tiktok\' | \'instagram\',
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
      setError(String(err).replace(\'Error: \', \'\'))
    } finally {
      setLoading(false)
      setStage(\'\')
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={cn(\'min-h-screen px-4 pb-20\', dir === \'rtl\' && \'font-arabic\')}
      dir={dir}
    >
      <div className="max-w-2xl mx-auto pt-8 space-y-6">
        {/* Top bar */}
        <div className={cn(\'flex items-center justify-between\', dir === \'rtl\' && \'flex-row-reverse\')}>
          <button
            onClick={() => router.push(\'/\')}
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className={cn(\'w-4 h-4\', dir === \'rtl\' && \'rotate-180\')} />
            {t.analysis.analyzeAnother}
          </button>
          <div className={cn(\'flex items-center gap-2\', dir === \'rtl\' && \'flex-row-reverse\')}>
            {fromCache && (
              <button
                onClick={() => analyze(true)}
                className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                title={t.analysis.refreshData || \'Refresh video data\'}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {t.analysis.refreshData || (dir === \'rtl\' ? \'تحديث\' : \'Refresh\')}
              </button>
            )}
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? t.analysis.copied : t.analysis.copyLink}
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <p className="text-sm text-zinc-500">{stage}</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="glass rounded-2xl p-6 text-center space-y-3">
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={() => analyze()}
              className="text-xs text-zinc-400 hover:text-white underline transition-colors"
            >
              {t.errors?.retry || (dir === \'rtl\' ? \'حاول مجدداً\' : \'Try again\')}
            </button>
          </div>
        )}

        {/* Content */}
        {!loading && video && (
          <>
            <VideoCard video={video} />
            <AiExplanation videoData={video} />
          </>
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
