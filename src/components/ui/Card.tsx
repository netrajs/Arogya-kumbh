import type { HTMLAttributes } from 'react'

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={
        'bg-surface-container-lowest rounded-2xl p-card-padding shadow-sm hover:shadow-md transition-all ' +
        className
      }
      {...props}
    />
  )
}
