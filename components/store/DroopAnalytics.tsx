'use client'

import { useEffect } from 'react'
import { analytics } from '@/lib/analytics'

interface Props {
  droopCode: string
  droopName: string
}

export function DroopAnalytics({ droopCode, droopName }: Props) {
  useEffect(() => {
    analytics.droopView(droopCode, droopName)
  }, [droopCode, droopName])
  return null
}
