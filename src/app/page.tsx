'use client'

import { useLanguage } from '@/lib/language-context'
import { UrlInput } from '@/components/url-input'
import { Suspense } from 'react'
import { cn } from '@/lib/utils'
import { Zap, FileText, MessageCircle, Hash, BarChart2, Clock, Sparkles } from 'lucide-react'

const ICON_MAP = [FileText, MessageCircle, Hash, Sparkles, BarChart2, Clock]

export default function HomePage() {
  const { t, dir } = useLanguage()

  return (
    <div className={cn('relative min-h-screen flex flex-col', dir === 'rtl' && 'font-arabic')} dir={dir}>
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-white/[0.02] blur-[120px]" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] rounded-full bg-white/[0.01] blur-[80px]" />
      </div>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-24 text-center">
        <div className="animate-fade-in space-y-8 max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-xs text-zinc-400">
            <Zap className="w-3 h-3 fill-white text-white" />
            {t.hero.badge}
          </div>

          {/* Headline */}
          <div className="space-y-2">
            <h1 className={cn(
              'text-5xl sm:text-6xl font-bold tracking-tight leading-[1.1]',
              dir === 'rtl' ? 'text-4xl sm:text-5xl' : ''
            )}>
              <span className="text-white">{t.hero.title}</span>
              <br />
              <span className="gradient-text">{t.hero.titleHighlight}</span>
            </h1>
          </div>

          {/* Subtitle */}
          <p className="text-zinc-500 text-base sm:text-lg leading-relaxed max-w-xl mx-auto">
            {t.hero.subtitle}
          </p>

          {/* Input */}
          <Suspense>
            <UrlInput />
          </Suspense>

          {/* Shortcut hint */}
          <p className="text-xs text-zinc-700">
            {t.hero.orTry}{' '}
            <a href="/settings" className="text-zinc-500 hover:text-zinc-300 underline underline-offset-2 transition-colors">
              {t.hero.shortcutLink}
            </a>
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 animate-slide-up">
            <h2 className="text-3xl font-bold text-white">
              {t.features.title}
              <br />
              <span className="gradient-text">{t.features.titleHighlight}</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {t.features.items.map((feature: { title: string; desc: string }, i: number) => {
              const Icon = ICON_MAP[i]
              return (
                <div
                  key={i}
                  className={cn(
                    'glass rounded-2xl p-5 group hover:border-white/[0.1] transition-all duration-300',
                    'hover:bg-white/[0.03]'
                  )}
                >
                  <div className="w-8 h-8 rounded-xl bg-white/[0.05] flex items-center justify-center mb-3 group-hover:bg-white/[0.08] transition-colors">
                    <Icon className="w-4 h-4 text-zinc-400" />
                  </div>
                  <h3 className={cn('text-sm font-semibold text-white mb-1', dir === 'rtl' && 'text-right')}>
                    {feature.title}
                  </h3>
                  <p className={cn('text-xs text-zinc-500 leading-relaxed', dir === 'rtl' && 'text-right')}>
                    {feature.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-6 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-zinc-700">
          <span className="flex items-center gap-1.5">
            <Zap className="w-3 h-3" />
            REELENS
          </span>
          <span>Powered by Gemini AI · SocialKit</span>
        </div>
      </footer>
    </div>
  )
}
