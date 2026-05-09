import { useState, useRef, useEffect } from 'react'

interface Props {
  value: string
  placeholder?: string
  allNames: string[]
  onChange: (value: string) => void
}

export default function PokemonInput({ value, placeholder, allNames, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const query = value.trim().toLowerCase()
  const filtered = query.length === 0
    ? []
    : allNames.filter(n => n.toLowerCase().includes(query))
  const visible = filtered.slice(0, 10)
  const hasMore = filtered.length > 10

  // Cierra el dropdown al hacer clic fuera
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || visible.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted(h => Math.min(h + 1, visible.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)) }
    if (e.key === 'Enter' && visible[highlighted]) { e.preventDefault(); select(visible[highlighted]) }
    if (e.key === 'Escape') setOpen(false)
  }

  function select(name: string) {
    onChange(name)
    setOpen(false)
    setHighlighted(0)
  }

  return (
    <div ref={containerRef} className="pokemon-input-wrap">
      <input
        className="form-input rival-input"
        type="text"
        placeholder={placeholder}
        value={value}
        autoComplete="off"
        onChange={e => { onChange(e.target.value); setOpen(true); setHighlighted(0) }}
        onFocus={() => { if (query.length > 0) setOpen(true) }}
        onKeyDown={handleKeyDown}
      />
      {open && visible.length > 0 && (
        <ul className="pokemon-input-dropdown">
          {visible.map((name, i) => (
            <li
              key={name}
              className={`pokemon-input-option ${i === highlighted ? 'highlighted' : ''}`}
              onMouseDown={() => select(name)}
              onMouseEnter={() => setHighlighted(i)}
            >
              {name}
            </li>
          ))}
          {hasMore && <li className="pokemon-input-more">…</li>}
        </ul>
      )}
    </div>
  )
}
