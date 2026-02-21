'use client'

import Image from 'next/image'
import { useLanguage } from '@/lib/language-context'
import { cn, formatNumber } from '@/lib/utils'
import { Eye, Heart, Share2, MessageCircle, Clock, ExternalLink } from 'lucide-react'

interface VideoData {
  url: string
  platform: string
  title: string
  caption: string
  hashtags: string[]
  author: {
    username: string
    displayName: string
    avatar: string
    followers: number
  }
  stats: {
    views: number
    likes: number
    shares: number
    comments: number
    duration: number
  }
  thumbnail: string
  publishedAt: string
  transcript: string
  segments: Array<{ start: number; end: number; text: string }>
  topComments: Array<{ text?: string; comment?: string; likes?: number; username?: string }>
  aiSummary: string
}

interface Props {
  video: VideoData
  className?: string
}

export function VideoCard({ video, className }: Props) {
  const { t, dir, locale } = useLanguage()

  const stats = [
    { icon: Eye, label: t.analysis.views, value: formatNumber(video.stats.views) },
    { icon: Heart, label: t.analysis.likes, value: formatNumber(video.stats.likes) },
    { icon: Share2, label: t.analysis.shares, value: formatNumber(video.stats.shares) },
    { icon: MessageCircle, label: t.analysis.comments_count, value: formatNumber(video.stats.comments) },
  ]

  return (
    <div className={cn('space-y-4', className)} dir={dir}>
      {/* Thumbnail + Author */}
      <div className="glass rounded-2xl overflow-hidden">
        {video.thumbnail && (
          <div className="relative aspect-[9/5] w-full bg-zinc-900">
            <Image
              src={video.thumbnail}
              alt={video.title}
              fill
              className="object-cover opacity-80"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            {video.stats.duration > 0 && (
              <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/60 text-white text-xs">
                <Clock className="w-3 h-3" />
                <span>{Math.floor(video.stats.duration / 60)}:{String(video.stats.duration % 60).padStart(2, '0')}</span>
              </div>
            )}
            <div className="absolute top-3 left-3">
              <span className={cn(
                'px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider',
                video.platform === 'tiktok'
                  ? 'bg-[#ff0050]/90 text-white'
                  : 'bg-gradient-to-r from-[#833ab4]/90 to-[#fd1d1d]/90 text-white'
              )}>
                {video.platform}
              </span>
            </div>
          </div>
        )}

        <div className="p-4 space-y-3">
          {/* Author */}
          <div className="flex items-center gap-3">
            {video.author.avatar && (
              <div className="w-9 h-9 rounded-full overflow-hidden bg-zinc-800 shrink-0">
                <Image src={video.author.avatar} alt={video.author.username} width={36} height={36} className="object-cover" unoptimized />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {video.author.displayName || video.author.username}
              </p>
              {video.author.username && (
                <p className="text-xs text-zinc-500">@{video.author.username}
                  {video.author.followers > 0 && (
                    <span className="ml-1 text-zinc-600">· {formatNumber(video.author.followers)} followers</span>
                  )}
                </p>
              )}
            </div>
            <a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto shrink-0 p-1.5 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-white transition-colors"
              title={t.analysis.viewOriginal}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Caption */}
          {video.caption && (
            <p className={cn('text-xs text-zinc-400 leading-relaxed line-clamp-3', dir === 'rtl' && 'text-right')}>
              {video.caption}
            </p>
          )}

          {/* Hashtags */}
          {video.hashtags.length > 0 && (
            <div className={cn('flex flex-wrap gap-1.5', dir === 'rtl' && 'justify-end')}>
              {video.hashtags.slice(0, 8).map(tag => (
                <span key={tag} className="tag">#{tag}</span>
              ))}
              {video.hashtags.length > 8 && (
                <span className="tag">+{video.hashtags.length - 8}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="glass rounded-2xl p-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 mb-3">{t.analysis.stats}</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/[0.02]">
              <Icon className="w-4 h-4 text-zinc-500" />
              <p className="text-lg font-semibold text-white">{value}</p>
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Hashtags section */}
      {video.hashtags.length > 0 && (
        <div className="glass rounded-2xl p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 mb-3">{t.analysis.hashtags}</p>
          <div className={cn('flex flex-wrap gap-2', dir === 'rtl' && 'justify-end')}>
            {video.hashtags.map(tag => (
              <span key={tag} className="tag text-xs">#{tag}</span>
            ))}
          </div>
        </div>
      )}

      {/* Transcript */}
      {video.transcript && (
        <div className="glass rounded-2xl p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 mb-3">{t.analysis.transcript}</p>
          <div className="max-h-40 overflow-y-auto">
            {video.segments.length > 0 ? (
              <div className="space-y-1.5">
                {video.segments.map((seg, i) => (
                  <div key={i} className={cn('flex gap-3 text-xs', dir === 'rtl' && 'flex-row-reverse')}>
                    <span className="shrink-0 text-zinc-600 font-mono">
                      {Math.floor(seg.start / 60)}:{String(Math.floor(seg.start % 60)).padStart(2, '0')}
                    </span>
                    <span className="text-zinc-400">{seg.text}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className={cn('text-xs text-zinc-400 leading-relaxed', dir === 'rtl' && 'text-right')}>
                {video.transcript}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Comments */}
      {video.topComments.length > 0 && (
        <div className="glass rounded-2xl p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 mb-3">{t.analysis.comments}</p>
          <div className="space-y-2.5 max-h-52 overflow-y-auto">
            {video.topComments.slice(0, 10).map((c, i) => (
              <div key={i} className={cn('flex gap-2', dir === 'rtl' && 'flex-row-reverse')}>
                <div className="shrink-0 w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center">
                  <span className="text-[9px] text-zinc-500">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  {c.username && <p className="text-[10px] text-zinc-600 mb-0.5">@{c.username}</p>}
                  <p className={cn('text-xs text-zinc-400 leading-relaxed', dir === 'rtl' && 'text-right')}>
                    {c.text || c.comment}
                  </p>
                  {c.likes && c.likes > 0 && (
                    <p className="text-[10px] text-zinc-700 mt-0.5">♥ {formatNumber(c.likes)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
