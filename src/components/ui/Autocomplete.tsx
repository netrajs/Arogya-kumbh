import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Input } from './Field'

interface AutocompleteProps {
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder?: string
  className?: string
  maxSuggestions?: number
}

// Freeform text input with a suggestion dropdown filtered from `options`.
// Prescribers can still type anything — matching against the dataset is
// just an aid, not a restriction.
export function Autocomplete({ value, onChange, options, placeholder, className = '', maxSuggestions = 8 }: AutocompleteProps) {
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const query = value.trim().toLowerCase()
  const suggestions = query ? options.filter((o) => o.toLowerCase().includes(query)).slice(0, maxSuggestions) : []

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function selectOption(option: string) {
    onChange(option)
    setOpen(false)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((h) => (h + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((h) => (h - 1 + suggestions.length) % suggestions.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      selectOption(suggestions[highlighted])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <Input
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
          setHighlighted(0)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
      />
      {open && suggestions.length > 0 && (
        <ul className="glass-soft absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-2xl py-1">
          {suggestions.map((option, idx) => (
            <li key={option}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectOption(option)}
                className={`block w-full px-4 py-2 text-left font-body-md text-body-md ${
                  idx === highlighted ? 'bg-primary/10 text-primary' : 'text-on-surface hover:bg-primary/5'
                }`}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
