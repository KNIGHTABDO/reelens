import { NextRequest, NextResponse } from 'next/server'

const SOCIALKIT_KEY = process.env.SOCIALKIT_API_KEY || ''
const BASE = 'https://api.socialkit.dev'

async function fetchJson(url: string, key: string) {
  const sep = url.includes('?') ? '&' : '?'
  const res = await fetch(`${url}${sep}access_key=${key}`, {
    next: { revalidate: 0 },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`HTTP ${res.status} from ${url}: ${body.slice(0, 200)}`)
  }
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
      fetchJson(`${BASE}/tiktok/stats?url=${encoded}`, key),
      fetchJson(`${BASE}/tiktok/transcript?url=${encoded}`, key),
      fetchJson(`${BASE}/tiktok/comments?url=${encoded}&limit=20`, key),
      fetchJson(`${BASE}/tiktok/summarize?url=${encoded}`, key),
    ])

    const stats     = statsRes.status     === 'fulfilled' ? statsRes.value     : null
    const transcript = transcriptRes.status === 'fulfilled' ? transcriptRes.value : null
    const comments  = commentsRes.status   === 'fulfilled' ? commentsRes.value   : null
    const summary   = summaryRes.status    === 'fulfilled' ? summaryRes.value    : null

    // Log errors for debugging
    if (statsRes.status === 'rejected')      console.error('stats error:', statsRes.reason)
    if (transcriptRes.status === 'rejected') console.error('transcript error:', transcriptRes.reason)
    if (commentsRes.status === 'rejected')   console.error('comments error:', commentsRes.reason)
    if (summaryRes.status === 'rejected')    console.error('summary error:', summaryRes.reason)

    // SocialKit response field mapping (from docs):
    // stats: { title, author, likes, comment_count, share_count, view_count, description, duration, thumbnail }
    // transcript: { transcript, word_count, segment_count, subtitles, segments }
    // comments: { comments: [{ text, ... }] } or array
    // summarize: { summary }
    const statsData = stats?.data || stats || {}
    const transcriptText = transcript?.transcript || transcript?.data?.transcript || ''
    const segments = transcript?.segments || transcript?.data?.segments || []
    const rawComments = comments?.comments || comments?.data?.comments || []
    const topComments = Array.isArray(rawComments) ? rawComments.slice(0, 15) : []
    const aiSummary = summary?.summary || summary?.data?.summary || ''

    const description = statsData.description || statsData.title || ''
    const hashtags: string[] = statsData.hashtags || extractHashtags(description)
    const caption = description

    return NextResponse.json({
      success: true,
      video: {
        url,
        platform: url.includes('tiktok') ? 'tiktok' : 'instagram',
        title: statsData.title || caption.slice(0, 80) || 'Untitled Video',
        caption,
        hashtags,
        author: {
          username:    statsData.author || statsData.username || 'unknown',
          displayName: statsData.author || '',
          avatar:      statsData.avatar || statsData.author_avatar || '',
          followers:   statsData.followers || statsData.author_followers || 0,
        },
        stats: {
          views:    statsData.view_count    || statsData.views    || statsData.playCount    || 0,
          likes:    statsData.likes         || statsData.diggCount || 0,
          shares:   statsData.share_count   || statsData.shares   || statsData.shareCount   || 0,
          comments: statsData.comment_count || statsData.comments || statsData.commentCount || 0,
          duration: statsData.duration || 0,
        },
        thumbnail:   statsData.thumbnail || statsData.cover || statsData.thumbnail_url || '',
        publishedAt: statsData.publishedAt || statsData.create_time || statsData.createTime || '',
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
