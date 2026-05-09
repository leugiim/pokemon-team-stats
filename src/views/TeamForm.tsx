import { useState, useEffect } from 'react'
import { parsePokepaste } from '../pokepaste'
import { getTeams, saveTeam, generateId } from '../store'
import { Team } from '../types'
import PokemonCard from '../components/PokemonCard'

interface Props {
  teamId?: string
  onBack: () => void
  onSaved: (id: string) => void
}

export default function TeamForm({ teamId, onBack, onSaved }: Props) {
  const [name, setName] = useState('')
  const [paste, setPaste] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!teamId) return
    const team = getTeams().find(t => t.id === teamId)
    if (team) {
      setName(team.name)
      setPaste(team.paste)
    }
  }, [teamId])

  function handleSave() {
    setError('')
    const trimmedPaste = paste.trim()
    if (!trimmedPaste) {
      setError('Pega un Pokepaste válido.')
      return
    }

    const pokemon = parsePokepaste(trimmedPaste)
    if (pokemon.length === 0) {
      setError('No se pudo parsear el Pokepaste. Revisa el formato.')
      return
    }
    if (pokemon.length > 6) {
      setError(`Se han detectado ${pokemon.length} Pokemon. Un equipo VGC tiene máximo 6.`)
      return
    }

    const teamName = name.trim() || pokemon.map(p => p.nickname || p.name).join(' / ')

    const team: Team = {
      id: teamId ?? generateId(),
      name: teamName,
      paste: trimmedPaste,
      pokemon,
      createdAt: Date.now(),
    }

    saveTeam(team)
    onSaved(team.id)
  }

  const isEdit = !!teamId
  const preview = paste.trim() ? parsePokepaste(paste) : []

  return (
    <div className="view">
      <header className="view-header">
        <button className="btn btn-back" onClick={onBack}>← Volver</button>
        <h1>{isEdit ? 'Editar equipo' : 'Nuevo equipo'}</h1>
      </header>

      <div className="form-section">
        <label className="form-label">
          Nombre del equipo <span className="optional">(opcional)</span>
        </label>
        <input
          className="form-input"
          type="text"
          placeholder="Ej: Torkoal Rain"
          value={name}
          onChange={e => setName(e.target.value)}
        />
      </div>

      <div className="form-section">
        <label className="form-label">Pokepaste</label>
        <textarea
          className="form-textarea form-textarea--paste"
          placeholder={`Pega aquí tu Pokepaste...\n\nEj:\nFlutter Mane @ Choice Specs\nAbility: Protosynthesis\nEVs: 252 SpA / 4 SpD / 252 Spe\nTimid Nature\n- Moonblast\n- Shadow Ball\n- Psyshock\n- Dazzling Gleam`}
          value={paste}
          onChange={e => setPaste(e.target.value)}
          rows={16}
        />
      </div>

      {error && <p className="form-error">{error}</p>}

      {preview.length > 0 && (
        <div className="paste-preview">
          <h3>Vista previa ({preview.length} Pokemon detectados)</h3>
          <div className="pokemon-grid">
            {preview.map((p, i) => <PokemonCard key={i} pokemon={p} />)}
          </div>
        </div>
      )}

      <div className="form-actions">
        <button className="btn btn-secondary" onClick={onBack}>Cancelar</button>
        <button className="btn btn-primary" onClick={handleSave}>
          {isEdit ? 'Guardar cambios' : 'Crear equipo'}
        </button>
      </div>
    </div>
  )
}
