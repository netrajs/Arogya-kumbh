import type { ReactNode } from 'react'

type Tone = 'pending' | 'waiting' | 'active' | 'done'

const TONES: Record<Tone, { tint: string; dot: string }> = {
  pending: { tint: 'bg-[#fef3c7] text-[#b45309]', dot: 'bg-[#f59e0b]' },
  waiting: { tint: 'bg-[#dbeafe] text-[#2563eb]', dot: 'bg-[#3b82f6]' },
  active: { tint: 'bg-[#d1fae5] text-[#047857]', dot: 'bg-[#10b981]' },
  done: { tint: 'bg-[#eceaf4] text-[#6e6a8a]', dot: 'bg-[#9b96b5]' },
}

export function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  const config = TONES[tone]
  return (
    <span
      className={`inline-flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap ${config.tint}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {children}
    </span>
  )
}
