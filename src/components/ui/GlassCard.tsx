import type { HTMLAttributes } from 'react'

export function GlassCard({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={
        'relative rounded-3xl border border-white/60 bg-white/40 shadow-[0_8px_32px_rgba(76,60,140,0.16)] ' +
        'backdrop-blur-2xl backdrop-saturate-150 ' +
        'before:pointer-events-none before:absolute before:inset-0 before:rounded-3xl ' +
        'before:bg-gradient-to-b before:from-white/40 before:to-transparent before:opacity-60 ' +
        className
      }
      {...props}
    />
  )
}
