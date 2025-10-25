import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AnimatedBackground } from '@/components/ui/AnimatedBackground'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Fin - Longevity Routine Optimization',
  description: 'Fin is your personal AI longevity coach. Fin learns your routines and make recommendations to help you optimize your habits based on current research around healthspan and longevity.',
  icons: {
    icon: '/fin.png',
    shortcut: '/fin.png',
    apple: '/fin.png',
  },
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