'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/lib/language-context'
import { cn } from '@/lib/utils'
import { Zap } from 'lucide-react'

export function Navbar() {
  const { t, dir } = useLanguage()
  const pathname = usePathname()

  const links = [
    { href: '/', label: t.nav.home },
    { href: '/history', label: t.nav.history },
    { href: '/settings', label: t.nav.settings },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14"
      dir={dir}>
      <div className="absolute inset-0 bg-[#080808]/80 backdrop-blur-xl border-b border-white/[0.04]" />
      <nav className="relative h-full max-w-5xl mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center group-hover:scale-105 transition-transform">
            <Zap className="w-4 h-4 text-black fill-black" />
          </div>
          <span className="text-sm font-semibold tracking-wide text-white">
            {t.appName}
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'px-3 py-1.5 rounded-xl text-sm transition-all duration-200',
                pathname === link.href
                  ? 'text-white bg-white/[0.08]'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  )
}
