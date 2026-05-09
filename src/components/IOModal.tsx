import { useState, useEffect, useRef } from 'react'

interface ExportProps {
  mode: 'export'
  title: string
  content: string
  onClose: () => void
}

interface ImportProps {
  mode: 'import'
  title: string
  onImport: (text: string) => void
  onClose: () => void
}

type Props = ExportProps | ImportProps

export default function IOModal(props: Props) {
  const { mode, title, onClose } = props
  const [text, setText] = useState(mode === 'export' ? props.content : '')
  const [copied, setCopied] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
    if (mode === 'export') textareaRef.current?.select()
  }, [mode])

  function handleCopy() {
    navigator.clipboard.writeText(mode === 'export' ? props.content : text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleImport() {
    if (props.mode === 'import') props.onImport(text.trim())
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <textarea
          ref={textareaRef}
          className="modal-textarea"
          value={text}
          readOnly={mode === 'export'}
          onChange={e => setText(e.target.value)}
          rows={14}
          placeholder={mode === 'import' ? 'Pega aquí el JSON...' : undefined}
          spellCheck={false}
        />
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
          {mode === 'export' && (
            <button className="btn btn-primary" onClick={handleCopy}>
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          )}
          {mode === 'import' && (
            <button className="btn btn-primary" onClick={handleImport} disabled={!text.trim()}>
              Importar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
