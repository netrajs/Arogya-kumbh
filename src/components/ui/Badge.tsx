type Tone = 'ok' | 'warn' | 'idle' | 'info' | 'amber'

const tones: Record<Tone, string> = {
  ok: 'bg-ok-bg text-ok-text',
  warn: 'bg-warn-bg text-warn-text',
  idle: 'bg-idle-bg text-idle-text',
  info: 'bg-info-bg text-info-text',
  amber: 'bg-amber-bg text-amber-text',
}

const dots: Record<Tone, string> = {
  ok: 'bg-ok-dot',
  warn: 'bg-warn-dot',
  idle: 'bg-idle-dot',
  info: 'bg-info-dot',
  amber: 'bg-amber-dot',
}

export function Badge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className={
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ' + tones[tone]
      }
    >
      <span className={'h-1.5 w-1.5 rounded-full ' + dots[tone]} />
      {children}
    </span>
  )
}
