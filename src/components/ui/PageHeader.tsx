import type { ReactNode } from 'react'

export function PageHeader({ title, description }: { title: string; description?: ReactNode }) {
  return (
    <header className="pt-1 pb-1">
      <h1 className="font-headline-lg text-headline-lg text-on-surface">{title}</h1>
      {description && <p className="text-body-md text-on-surface-variant mt-1">{description}</p>}
    </header>
  )
}
