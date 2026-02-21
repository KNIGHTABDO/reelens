export interface HistoryItem {
  id: string
  url: string
  platform: 'tiktok' | 'instagram'
  title: string
  author: string
  thumbnail?: string
  analyzedAt: string
  stats?: {
    views?: number
    likes?: number
    shares?: number
    comments?: number
  }
}

const KEY = 'reelens-history'
const MAX = 50

export function getHistory(): HistoryItem[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

export function addToHistory(item: HistoryItem) {
  if (typeof window === 'undefined') return
  const history = getHistory()
  const filtered = history.filter(h => h.id !== item.id)
  const updated = [item, ...filtered].slice(0, MAX)
  localStorage.setItem(KEY, JSON.stringify(updated))
}

export function clearHistory() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(KEY)
}

export function removeFromHistory(id: string) {
  if (typeof window === 'undefined') return
  const history = getHistory().filter(h => h.id !== id)
  localStorage.setItem(KEY, JSON.stringify(history))
}
