import type { HTMLAttributes } from 'react'

export function GlassCard({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={
        'rounded-3xl border border-white/60 bg-white/55 shadow-[0_8px_32px_rgba(76,60,140,0.10)] backdrop-blur-xl ' +
        className
      }
      {...props}
    />
  )
}
