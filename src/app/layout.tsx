import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import Image from 'next/image'
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
        {/* Facebook Pixel Code */}
        <Script
          id="facebook-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '761365083600037');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <Image
            height={1}
            width={1}
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=761365083600037&ev=PageView&noscript=1"
            alt=""
            unoptimized
          />
        </noscript>
        {/* End Facebook Pixel Code */}
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