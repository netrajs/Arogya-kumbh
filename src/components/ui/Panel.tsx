import type { ReactNode } from 'react'
import { MIcon } from './MIcon'

/** Card shell used across pages: a title-glyph, heading, optional action, then content. */
export function Panel({
  glyph,
  glyphClass = 'title-glyph',
  title,
  action,
  children,
  className = '',
}: {
  glyph: string
  glyphClass?: string
  title: string
  action?: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <section className={`card-surface p-card-padding flex flex-col ${className}`}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={glyphClass}>
            <MIcon name={glyph} className="text-[17px]" />
          </span>
          <h2 className="font-headline-md text-headline-md text-on-surface truncate">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
