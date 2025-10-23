"use client"

import { DotPattern } from '@/components/ui/dot-pattern'
import { LightRays } from '@/components/ui/light-rays'

export function AnimatedBackground() {
  return (
    <>
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
    </>
  )
}
