import { NextRequest, NextResponse } from 'next/server'

const SOCIALKIT_KEY = process.env.SOCIALKIT_API_KEY || ''
const ENSEMBLE_KEY  = process.env.ENSEMBLE_API_KEY  || ''
const SUPADATA_KEY  = process.env.SUPADATA_API_KEY  || ''
const SK_BASE       = 'https://api.socialkit.dev'
const ED_BASE       = 'https://api.ensembledata.com'
const SD_BASE       = 'https://api.supadata.ai/v1'

// ── helpers ────────────────────────────────────────────────────────
function extractHashtags(text: string): string[] {
  return (text.match(/#[\w\u0600-\u06FF]+/g) || []).map(h => h.slice(1))
}

async function safeJson(url: string, init?: RequestInit) {
  try {
    const r = await fetch(url, { ...init, signal: AbortSignal.timeout(12000) })
    if (!r.ok) return null
    return await r.json()
  } catch { return null }
}

// ── SocialKit provider ─────────────────────────────────────────────
async function fetchViaSocialKit(url: string, key: string) {
  const enc = encodeURIComponent(url)
  const [stats, transcript, comments, summary] = await Promise.allSettled([
    safeJson(`${SK_BASE}/tiktok/stats?url=${enc}&access_key=${key}`),
    safeJson(`${SK_BASE}/tiktok/transcript?url=${enc}&access_key=${key}`),
    safeJson(`${SK_BASE}/tiktok/comments?url=${enc}&limit=20&access_key=${key}`),
    safeJson(`${SK_BASE}/tiktok/summarize?url=${enc}&access_key=${key}`),
  ])

  const sd = stats.status     === 'fulfilled' ? (stats.value?.data     || stats.value     || {}) : {}
  const tr = transcript.status === 'fulfilled' ? (transcript.value?.data || transcript.value || {}) : {}
  const cm = comments.status   === 'fulfilled' ? (comments.value?.data   || comments.value   || {}) : {}
  const sm = summary.status    === 'fulfilled' ? (summary.value?.data    || summary.value    || {}) : {}

  // Require at least stats to consider this a success
  if (!sd.view_count && !sd.likes && !sd.title) return null

  return {
    provider: 'socialkit',
    title:       sd.title       || sd.description?.slice(0, 80) || '',
    caption:     sd.description || sd.title || '',
    hashtags:    sd.hashtags    || extractHashtags(sd.description || sd.title || ''),
    author:      { username: sd.author || sd.username || '', displayName: sd.author || '', avatar: sd.avatar || '', followers: sd.followers || 0 },
    stats:       { views: sd.view_count || 0, likes: sd.likes || 0, shares: sd.share_count || 0, comments: sd.comment_count || 0, duration: sd.duration || 0 },
    thumbnail:   sd.thumbnail || '',
    publishedAt: sd.create_time || '',
    transcript:  tr.transcript || '',
    segments:    tr.segments   || [],
    topComments: (cm.comments  || []).slice(0, 15),
    aiSummary:   sm.summary    || '',
  }
}

// ── EnsembleData provider ──────────────────────────────────────────
// 50 units/day free — user info (1u) + video posts (1u) = 2u per video
async function fetchViaEnsembleData(url: string, key: string) {
  // Extract video ID from URL
  const match = url.match(/video\/(\d+)/) || url.match(/\/(\d{15,20})/)
  const videoId = match?.[1]
  if (!videoId) return null

  // Also extract username if present
  const usernameMatch = url.match(/@([\w.]+)/)
  const username = usernameMatch?.[1] || ''

  const enc = encodeURIComponent(url)

  // EnsembleData TikTok video info endpoint
  const videoData = await safeJson(`${ED_BASE}/tiktok/v1/post/info?url=${enc}`, {
    headers: { 'x-api-key': key }
  })

  if (!videoData || videoData.error) return null
  const v = videoData.data || videoData

  const caption = v.desc || v.description || v.title || ''
  const hashtags = v.challenges?.map((c: {title?: string}) => c.title || '').filter(Boolean)
    || extractHashtags(caption)

  // Get comments
  const cmData = await safeJson(`${ED_BASE}/tiktok/v1/post/comments?aweme_id=${videoId}&count=20`, {
    headers: { 'x-api-key': key }
  })
  const rawComments = cmData?.data?.comments || cmData?.comments || []
  const topComments = rawComments.slice(0, 15).map((c: {text?: string; comment_text?: string; user?: {uid?: string}; digg_count?: number}) => ({
    text: c.text || c.comment_text || '',
    username: c.user?.uid || '',
    likes: c.digg_count || 0,
  }))

  const author = v.author || v.user || {}
  return {
    provider: 'ensembledata',
    title:       caption.slice(0, 80),
    caption,
    hashtags,
    author:      { username: author.unique_id || username, displayName: author.nickname || '', avatar: author.avatar_thumb?.url_list?.[0] || '', followers: author.follower_count || 0 },
    stats:       { views: v.statistics?.play_count || v.play_count || 0, likes: v.statistics?.digg_count || v.digg_count || 0, shares: v.statistics?.share_count || v.share_count || 0, comments: v.statistics?.comment_count || v.comment_count || 0, duration: v.video?.duration || 0 },
    thumbnail:   v.video?.cover?.url_list?.[0] || v.thumbnail || '',
    publishedAt: v.create_time ? new Date(v.create_time * 1000).toISOString() : '',
    transcript:  '',
    segments:    [],
    topComments,
    aiSummary:   '',
  }
}

// ── Supadata provider (transcripts + basic metadata) ───────────────
// 100 free requests — best for transcript when other providers fail
async function fetchViaSupadata(url: string, key: string) {
  const enc = encodeURIComponent(url)
  const data = await safeJson(`${SD_BASE}/transcript?url=${enc}&text=true`, {
    headers: { 'x-api-key': key }
  })
  if (!data || data.error) return null

  const transcript = data.content?.map((s: {text?: string}) => s.text || '').join(' ') || data.text || ''
  if (!transcript) return null

  return {
    provider: 'supadata',
    title:       '',
    caption:     '',
    hashtags:    [],
    author:      { username: '', displayName: '', avatar: '', followers: 0 },
    stats:       { views: 0, likes: 0, shares: 0, comments: 0, duration: data.duration || 0 },
    thumbnail:   '',
    publishedAt: '',
    transcript,
    segments:    data.content?.map((s: {text?: string; start?: number; duration?: number}) => ({
      text:     s.text || '',
      start:    s.start || 0,
      duration: s.duration || 0,
      timestamp: `${Math.floor((s.start||0)/60)}:${String(Math.floor((s.start||0)%60)).padStart(2,'0')}`,
    })) || [],
    topComments: [],
    aiSummary:   '',
  }
}

// ── Main POST handler ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { url, apiKey, ensembleKey, supadataKey } = await req.json()
    if (!url) return NextResponse.json({ error: 'No URL provided' }, { status: 400 })

    const platform = url.includes('tiktok') ? 'tiktok' : url.includes('instagram') ? 'instagram' : 'tiktok'

    // Check localStorage-passed keys (client-side) + env fallbacks
    const skKey = apiKey      || SOCIALKIT_KEY
    const edKey = ensembleKey || ENSEMBLE_KEY
    const sdKey = supadataKey || SUPADATA_KEY

    // Try providers in priority order
    let videoData: ReturnType<typeof fetchViaSocialKit> extends Promise<infer T> ? T : never = null as never

    // 1. SocialKit (if key present)
    if (skKey) {
      const result = await fetchViaSocialKit(url, skKey)
      if (result) { videoData = result }
    }

    // 2. EnsembleData fallback (50 units/day free)
    if (!videoData && edKey) {
      const result = await fetchViaEnsembleData(url, edKey)
      if (result) { videoData = result }
    }

    // 3. Supadata fallback (transcripts only, 100 free requests)
    if (!videoData && sdKey) {
      const result = await fetchViaSupadata(url, sdKey)
      if (result) { videoData = result }
    }

    // 4. Minimal fallback — return URL-extracted metadata only (AI still works)
    if (!videoData) {
      const usernameMatch = url.match(/@([\w.]+)/)
      videoData = {
        provider: 'none',
        title:       '',
        caption:     '',
        hashtags:    [],
        author:      { username: usernameMatch?.[1] || '', displayName: '', avatar: '', followers: 0 },
        stats:       { views: 0, likes: 0, shares: 0, comments: 0, duration: 0 },
        thumbnail:   '',
        publishedAt: '',
        transcript:  '',
        segments:    [],
        topComments: [],
        aiSummary:   '',
      }
    }

    return NextResponse.json({
      success: true,
      video: {
        url,
        platform,
        ...videoData,
        _provider: videoData.provider,
      }
    })
  } catch (err) {
    console.error('Analyze error:', err)
    return NextResponse.json({ error: 'Failed to fetch video data', details: String(err) }, { status: 500 })
  }
}
