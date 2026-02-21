import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  async headers() {
    return [
      {
        source: '/reelens.shortcut',
        headers: [
          { key: 'Content-Type', value: 'application/octet-stream' },
          { key: 'Content-Disposition', value: 'attachment; filename="REELENS.shortcut"' },
        ],
      },
    ]
  },
}

export default nextConfig
