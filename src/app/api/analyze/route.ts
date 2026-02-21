import { NextRequest, NextResponse } from 'next/server'

const SOCIALKIT_KEY = process.env.SOCIALKIT_API_KEY || ''
const BASE = 'https://api.socialkit.dev'

async function fetchJson(url: string, key: string) {
  const res = await fetch(url, {
    headers: { 'X-API-Key': key, 'Content-Type': 'application/json' },
    next: { revalidate: 0 },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`)
  return res.json()
}

export async function POST(req: NextRequest) {
  try {
    const { url, apiKey } = await req.json()
    const key = apiKey || SOCIALKIT_KEY
    if (!key) return NextResponse.json({ error: 'No API key configured' }, { status: 400 })
    if (!url) return NextResponse.json({ error: 'No URL provided' }, { status: 400 })

    const encoded = encodeURIComponent(url)

    // Parallel fetch: stats, transcript, comments, summary
    const [statsRes, transcriptRes, commentsRes, summaryRes] = await Promise.allSettled([
      fetchJson(`${BASE}/v1/video/stats?url=${encoded}`, key),
      fetchJson(`${BASE}/v1/video/transcript?url=${encoded}`, key),
      fetchJson(`${BASE}/v1/video/comments?url=${encoded}&limit=20`, key),
      fetchJson(`${BASE}/v1/video/summary?url=${encoded}`, key),
    ])

    const stats = statsRes.status === 'fulfilled' ? statsRes.value : null
    const transcript = transcriptRes.status === 'fulfilled' ? transcriptRes.value : null
    const comments = commentsRes.status === 'fulfilled' ? commentsRes.value : null
    const summary = summaryRes.status === 'fulfilled' ? summaryRes.value : null

    // Extract data
    const videoData = stats?.data || stats || {}
    const transcriptText = transcript?.data?.transcript || transcript?.transcript || ''
    const segments = transcript?.data?.segments || transcript?.segments || []
    const topComments = (comments?.data?.comments || comments?.comments || []).slice(0, 15)
    const aiSummary = summary?.data?.summary || summary?.summary || ''
    const hashtags: string[] = videoData.hashtags || extractHashtags(videoData.description || videoData.caption || '')
    const caption = videoData.description || videoData.caption || videoData.title || ''

    return NextResponse.json({
      success: true,
      video: {
        url,
        platform: url.includes('tiktok') ? 'tiktok' : 'instagram',
        title: videoData.title || caption.slice(0, 80) || 'Untitled Video',
        caption,
        hashtags,
        author: {
          username: videoData.author?.username || videoData.authorName || videoData.username || 'unknown',
          displayName: videoData.author?.displayName || videoData.authorDisplayName || videoData.displayName || '',
          avatar: videoData.author?.avatar || videoData.authorAvatar || '',
          followers: videoData.author?.followers || videoData.authorFollowers || 0,
        },
        stats: {
          views: videoData.views || videoData.playCount || 0,
          likes: videoData.likes || videoData.diggCount || 0,
          shares: videoData.shares || videoData.shareCount || 0,
          comments: videoData.comments || videoData.commentCount || 0,
          duration: videoData.duration || 0,
        },
        thumbnail: videoData.thumbnail || videoData.cover || videoData.thumbnailUrl || '',
        publishedAt: videoData.publishedAt || videoData.createTime || '',
        transcript: transcriptText,
        segments,
        topComments,
        aiSummary,
      }
    })
  } catch (err) {
    console.error('Analyze error:', err)
    return NextResponse.json({ error: 'Failed to fetch video data', details: String(err) }, { status: 500 })
  }
}

function extractHashtags(text: string): string[] {
  return (text.match(/#[\w\u0600-\u06FF]+/g) || []).map(h => h.slice(1))
}
