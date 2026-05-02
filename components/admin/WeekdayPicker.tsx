'use client'

import { cn } from '@/lib/utils'

const DAYS = [
  { value: 1, short: 'L', name: 'Lun' },
  { value: 2, short: 'M', name: 'Mar' },
  { value: 3, short: 'M', name: 'Mié' },
  { value: 4, short: 'J', name: 'Jue' },
  { value: 5, short: 'V', name: 'Vie' },
  { value: 6, short: 'S', name: 'Sáb' },
  { value: 0, short: 'D', name: 'Dom' },
]

interface Props {
  value: number[]
  onChange: (next: number[]) => void
  label?: string
}

export function WeekdayPicker({ value, onChange, label = 'Días disponibles' }: Props) {
  function toggle(day: number) {
    onChange(
      value.includes(day) ? value.filter((d) => d !== day) : [...value, day].sort(),
    )
  }
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-donot-verde">{label}</span>
      <div className="flex gap-1.5">
        {DAYS.map((d) => {
          const active = value.includes(d.value)
          return (
            <button
              key={d.value}
              type="button"
              onClick={() => toggle(d.value)}
              aria-pressed={active}
              title={d.name}
              className={cn(
                'w-9 h-9 rounded-full text-sm font-semibold transition',
                active
                  ? 'bg-donot-verde text-donot-crema'
                  : 'bg-white border border-donot-border text-donot-muted hover:border-donot-verde',
              )}
            >
              {d.short}
            </button>
          )
        })}
      </div>
    </div>
  )
}
