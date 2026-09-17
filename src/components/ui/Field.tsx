import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

export function Label({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1.5 block font-label-caps text-label-caps uppercase text-on-surface-variant">
      {children}
    </label>
  )
}

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`field ${className}`} {...props} />
}

export function Textarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`field resize-none ${className}`} rows={3} {...props} />
}

export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`field ${className}`} {...props} />
}
