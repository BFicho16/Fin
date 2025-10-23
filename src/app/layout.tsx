import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { LightRays } from '@/components/ui/light-rays'
import { DotPattern } from '@/components/ui/dot-pattern'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Deep Research Assistant',
  description: 'AI-powered research assistant with health and wellness capabilities',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="relative min-h-screen">
          {/* Base dot pattern layer */}
          <DotPattern 
            width={20}
            height={20}
            cx={1}
            cy={1}
            cr={1}
            className="opacity-30"
          />
          {/* Light rays layer */}
          <LightRays />
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </body>
    </html>
  )
}
