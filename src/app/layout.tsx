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
    <html lang="en">
      <body className={inter.className}>
        <div className="relative min-h-screen">
          <AnimatedBackground />
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </body>
    </html>
  )
}
