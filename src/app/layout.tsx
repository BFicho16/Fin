import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AnimatedBackground } from '@/components/ui/AnimatedBackground'

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
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full`}>
        <div className="relative h-full mobile-no-scroll">
          <AnimatedBackground />
          <div className="relative z-10 h-full">
            {children}
          </div>
        </div>
      </body>
    </html>
  )
}