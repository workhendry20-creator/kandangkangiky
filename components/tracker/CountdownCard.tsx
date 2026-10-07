'use client'

import React from 'react'

const emptySubscribe = () => () => {}

function calculateDaysRemaining(targetDateStr: string): number {
  const target = new Date(targetDateStr).getTime()
  const diff = target - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

interface CountdownCardProps {
  targetDateStr?: string
}

export function CountdownCard({
  targetDateStr = '2026-05-27T00:00:00Z',
}: CountdownCardProps) {
  const daysRemaining = React.useSyncExternalStore(
    emptySubscribe,
    () => calculateDaysRemaining(targetDateStr),
    () => 85
  )

  return (
    <div className="p-4 rounded-2xl bg-stone-900 text-white shadow-xs space-y-1">
      <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
        Menuju Iduladha
      </span>
      <span className="text-base font-extrabold text-white font-mono block">
        {daysRemaining} Hari
      </span>
      <span className="text-[11px] text-emerald-400 font-medium">
        10 Dzulhijjah 1447H
      </span>
    </div>
  )
}
