import type { ReactNode } from 'react'

export function PageHeader({ title, description }: { title: string; description?: ReactNode }) {
  return (
    <div className="mb-8">
      <h1 className="font-headline-lg text-headline-lg text-on-surface">{title}</h1>
      {description && <p className="font-body-md text-body-md text-on-surface-variant mt-2">{description}</p>}
    </div>
  )
}
