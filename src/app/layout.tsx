import type { Metadata } from \'next\'
import { Geist, Geist_Mono } from \'next/font/google\'
import { Noto_Sans_Arabic } from \'next/font/google\'
import \'./globals.css\'
import { Navbar } from \'@/components/navbar\'
import { LanguageProvider } from \'@/lib/language-context\'
import { Suspense } from \'react\'

const geistSans = Geist({ variable: \'--font-geist-sans\', subsets: [\'latin\'] })
const geistMono = Geist_Mono({ variable: \'--font-geist-mono\', subsets: [\'latin\'] })
const notoArabic = Noto_Sans_Arabic({
  variable: \'--font-noto-arabic\',
  subsets: [\'arabic\'],
  weight: [\'300\', \'400\', \'500\', \'600\', \'700\', \'800\', \'900\'],
})

export const metadata: Metadata = {
  title: \'REELENS — AI Video Explainer\',
  description: \'AI-powered TikTok & Instagram video explainer. Get transcripts, comments analysis, and streaming AI explanations in Arabic and English.\',
  keywords: [\'TikTok\', \'Instagram\', \'AI\', \'video explainer\', \'transcript\', \'Arabic\', \'English\'],
  openGraph: {
    title: \'REELENS — AI Video Explainer\',
    description: \'Understand any TikTok or Instagram video instantly with AI.\',
    type: \'website\',
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} ${notoArabic.variable} font-sans antialiased bg-[#080808] text-white`}>
        <LanguageProvider>
          <Navbar />
          <main className="pt-14 min-h-screen">
            <Suspense>
              {children}
            </Suspense>
          </main>
        </LanguageProvider>
      </body>
    </html>
  )
}
