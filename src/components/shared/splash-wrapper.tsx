'use client'

import { useState, useCallback } from 'react'
import SplashScreen from '@/components/shared/splash-screen'

export default function SplashWrapper({ children }: { children: React.ReactNode }) {
  const [splashDone, setSplashDone] = useState(false)

  const handleSplashComplete = useCallback(() => {
    setSplashDone(true)
  }, [])

  return (
    <>
      {!splashDone && <SplashScreen onComplete={handleSplashComplete} />}
      {children}
    </>
  )
}
