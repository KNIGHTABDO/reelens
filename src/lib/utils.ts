import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toString()
}

export function extractVideoId(url: string): { platform: 'tiktok' | 'instagram' | null; id: string | null } {
  try {
    const u = new URL(url)
    const host = u.hostname.replace('www.', '')

    if (host === 'tiktok.com' || host === 'vm.tiktok.com' || host === 'm.tiktok.com') {
      // e.g. /video/7234567890123456789 or short link
      const match = u.pathname.match(/\/video\/(\d+)/) || u.pathname.match(/\/@[^/]+\/video\/(\d+)/)
      return { platform: 'tiktok', id: match ? match[1] : url }
    }

    if (host === 'instagram.com' || host === 'instagr.am') {
      // e.g. /reel/ABC123XYZ or /p/ABC123XYZ
      const match = u.pathname.match(/\/(reel|p)\/([A-Za-z0-9_-]+)/)
      return { platform: 'instagram', id: match ? match[2] : url }
    }

    return { platform: null, id: null }
  } catch {
    return { platform: null, id: null }
  }
}

export function isValidVideoUrl(url: string): boolean {
  const { platform } = extractVideoId(url)
  return platform !== null
}

export function timeAgo(dateStr: string, locale: 'en' | 'ar' = 'en'): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)

  if (locale === 'ar') {
    if (mins < 1) return 'الآن'
    if (mins < 60) return `منذ ${mins} دقيقة`
    if (hours < 24) return `منذ ${hours} ساعة`
    return `منذ ${days} يوم`
  }

  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}
