import type { ReactNode } from 'react'

type Tone = 'pending' | 'info' | 'ok' | 'idle'

const tones: Record<Tone, string> = {
  pending: 'bg-tertiary-container/20 text-tertiary-container',
  info: 'bg-primary/10 text-primary',
  ok: 'bg-green-500/10 text-green-700',
  idle: 'bg-surface-container-highest text-on-surface-variant',
}

export function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <div className={`px-4 py-1.5 rounded-full inline-flex items-center justify-center ${tones[tone]}`}>
      <span className="font-label-caps text-label-caps">{children}</span>
    </div>
  )
}
