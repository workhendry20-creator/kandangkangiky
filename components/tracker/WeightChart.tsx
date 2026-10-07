'use client'

import React from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { formatDate } from '@/lib/utils'

export interface ChartDataPoint {
  date: string
  rawDate: string
  actualWeight: number | null
  targetWeight: number
}

interface WeightChartProps {
  initialWeight: number
  targetWeight: number
  entryDate: string
  logs: Array<{
    record_date: string
    current_weight: number
  }>
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    color: string
  }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm p-3.5 rounded-2xl border border-stone-200 shadow-lg text-xs space-y-1.5">
        <p className="font-bold text-slate-800 border-b border-stone-100 pb-1">
          Tanggal: {label}
        </p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span>{entry.name}:</span>
            </span>
            <span className="font-bold font-mono text-slate-900">
              {entry.value !== null && entry.value !== undefined
                ? `${Number(entry.value).toFixed(1)} kg`
                : '-'}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function WeightChart({
  initialWeight,
  targetWeight,
  entryDate,
  logs,
}: WeightChartProps) {
  // Build chart points from entry date + chronological logs
  const sortedLogs = [...logs].sort(
    (a, b) => new Date(a.record_date).getTime() - new Date(b.record_date).getTime()
  )

  const data: ChartDataPoint[] = []

  // Point 0: Entry Date
  data.push({
    rawDate: entryDate,
    date: formatDate(entryDate),
    actualWeight: initialWeight,
    targetWeight: targetWeight,
  })

  // Subsequent points from logs
  sortedLogs.forEach((log) => {
    data.push({
      rawDate: log.record_date,
      date: formatDate(log.record_date),
      actualWeight: Number(log.current_weight),
      targetWeight: targetWeight,
    })
  })

  // Calculate min and max for chart YAxis
  const allWeights = [
    initialWeight,
    targetWeight,
    ...sortedLogs.map((l) => Number(l.current_weight)),
  ]
  const minWeight = Math.max(0, Math.floor(Math.min(...allWeights) - 2))
  const maxWeight = Math.ceil(Math.max(...allWeights) + 3)

  return (
    <div className="w-full">
      <div className="h-72 sm:h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 15, right: 15, left: -15, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#E2E8F0' }}
            />
            <YAxis
              domain={[minWeight, maxWeight]}
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#E2E8F0' }}
              tickFormatter={(v) => `${v}kg`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
            />
            {/* Target Weight Curve (Dashed Amber) */}
            <Line
              type="monotone"
              dataKey="targetWeight"
              name="Target Bobot"
              stroke="#D97706"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ r: 4 }}
            />
            {/* Actual Weight Curve (Solid Emerald) */}
            <Line
              type="monotone"
              dataKey="actualWeight"
              name="Bobot Real (kg)"
              stroke="#065F46"
              strokeWidth={3}
              dot={{ r: 4, fill: '#065F46', stroke: '#FFFFFF', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#10B981', stroke: '#FFFFFF', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-800" />
          <span>Titik Timbang Real</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 border-t-2 border-dashed border-amber-600" />
          <span>Garis Target Iduladha</span>
        </span>
      </div>
    </div>
  )
}
