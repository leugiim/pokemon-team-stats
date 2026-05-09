import { useState, useEffect } from 'react'
import { Team, Match } from '../types'
import { getTeams, getMatch, saveMatch, generateId } from '../store'
import { pokemonIconUrl } from '../sprites'

function hideOnError(e: React.SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.style.display = 'none'
}

interface Props {
  teamId: string
  matchId?: string
  onBack: () => void
  onSaved: () => void
}

export default function MatchForm({ teamId, matchId, onBack, onSaved }: Props) {
  const [team, setTeam] = useState<Team | null>(null)
  const [originalMatch, setOriginalMatch] = useState<Match | null>(null)
  const [result, setResult] = useState<'win' | 'loss' | ''>('')
  const [selection, setSelection] = useState<string[]>([])
  const [lead, setLead] = useState<string[]>([])
  const [rivalTeam, setRivalTeam] = useState<string[]>(['', '', '', '', '', ''])
  const [rivalSelection, setRivalSelection] = useState<string[]>([])
  const [rivalLead, setRivalLead] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const t = getTeams().find(t => t.id === teamId) ?? null
    setTeam(t)

    if (matchId) {
      const m = getMatch(matchId)
      if (m) {
        setOriginalMatch(m)
        setResult(m.result)
        setSelection(m.selection)
        setLead(m.lead)
        const slots = [...m.rivalTeam, '', '', '', '', '', ''].slice(0, 6)
        setRivalTeam(slots)
        setRivalSelection(m.rivalSelection)
        setRivalLead(m.rivalLead)
        setNotes(m.notes)
      }
    }
  }, [teamId, matchId])

  if (!team) return null

  const pokeNames = team.pokemon.map(p => p.nickname || p.name)
  const rivalFilled = rivalTeam.filter(n => n.trim() !== '')

  function toggleSelection(name: string) {
    setLead([]) // reset lead on selection change
    setSelection(prev => {
      if (prev.includes(name)) return prev.filter(n => n !== name)
      if (prev.length >= 4) return prev
      return [...prev, name]
    })
  }

  function toggleLead(name: string) {
    setLead(prev => {
      if (prev.includes(name)) return prev.filter(n => n !== name)
      if (prev.length >= 2) return prev
      return [...prev, name]
    })
  }

  function toggleRivalSelection(name: string) {
    setRivalLead([])
    setRivalSelection(prev => {
      if (prev.includes(name)) return prev.filter(n => n !== name)
      if (prev.length >= 4) return prev
      return [...prev, name]
    })
  }

  function toggleRivalLead(name: string) {
    setRivalLead(prev => {
      if (prev.includes(name)) return prev.filter(n => n !== name)
      if (prev.length >= 2) return prev
      return [...prev, name]
    })
  }

  function updateRivalSlot(idx: number, value: string) {
    setRivalTeam(prev => {
      const next = [...prev]
      next[idx] = value
      return next
    })
    // Limpiar rival selection/lead si el nombre cambia
    setRivalSelection([])
    setRivalLead([])
  }

  function handleSave() {
    setError('')
    if (!result) { setError('Indica el resultado de la partida.'); return }
    if (selection.length !== 4) { setError('Selecciona exactamente 4 Pokemon propios.'); return }
    if (lead.length !== 2) { setError('Indica el lead propio (2 Pokemon).'); return }

    const match: Match = {
      id: originalMatch?.id ?? generateId(),
      teamId,
      date: originalMatch?.date ?? Date.now(),
      result,
      selection,
      lead,
      rivalTeam: rivalFilled,
      rivalSelection,
      rivalLead,
      notes: notes.trim(),
    }

    saveMatch(match)
    onSaved()
  }

  return (
    <div className="view">
      <header className="view-header">
        <button className="btn btn-back" onClick={onBack}>← Volver</button>
        <h1>{matchId ? 'Editar partida' : 'Nueva partida'} — {team.name}</h1>
      </header>

      {/* Resultado */}
      <section className="form-section">
        <label className="form-label">Resultado</label>
        <div className="result-buttons">
          <button
            className={`btn btn-result ${result === 'win' ? 'active-win' : ''}`}
            onClick={() => setResult('win')}
          >
            Victoria
          </button>
          <button
            className={`btn btn-result ${result === 'loss' ? 'active-loss' : ''}`}
            onClick={() => setResult('loss')}
          >
            Derrota
          </button>
        </div>
      </section>

      {/* Selección propia */}
      <section className="form-section">
        <label className="form-label">
          Selección propia{' '}
          <span className="optional">({selection.length}/4 seleccionados)</span>
        </label>
        <div className="poke-selector">
          {pokeNames.map(name => (
            <button
              key={name}
              className={`poke-btn ${selection.includes(name) ? 'selected' : ''}`}
              onClick={() => toggleSelection(name)}
            >
              <img src={pokemonIconUrl(name)} alt="" className="poke-icon-xs" onError={hideOnError} />
              {name}
            </button>
          ))}
        </div>
      </section>

      {/* Lead propio */}
      {selection.length === 4 && (
        <section className="form-section">
          <label className="form-label">
            Lead propio{' '}
            <span className="optional">({lead.length}/2 seleccionados)</span>
          </label>
          <div className="poke-selector">
            {selection.map(name => (
              <button
                key={name}
                className={`poke-btn ${lead.includes(name) ? 'selected' : ''}`}
                onClick={() => toggleLead(name)}
              >
                {name}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Equipo rival */}
      <section className="form-section">
        <label className="form-label">
          Equipo rival <span className="optional">(opcional — hasta 6 Pokemon)</span>
        </label>
        <div className="rival-inputs">
          {rivalTeam.map((val, i) => (
            <input
              key={i}
              className="form-input rival-input"
              type="text"
              placeholder={`Pokemon ${i + 1}`}
              value={val}
              onChange={e => updateRivalSlot(i, e.target.value)}
            />
          ))}
        </div>

        {rivalFilled.length >= 4 && (
          <>
            <label className="form-label" style={{ marginTop: '1rem' }}>
              Selección rival{' '}
              <span className="optional">({rivalSelection.length}/4)</span>
            </label>
            <div className="poke-selector">
              {rivalFilled.map(name => (
                <button
                  key={name}
                  className={`poke-btn ${rivalSelection.includes(name) ? 'selected' : ''}`}
                  onClick={() => toggleRivalSelection(name)}
                >
                  {name}
                </button>
              ))}
            </div>
          </>
        )}

        {rivalSelection.length === 4 && (
          <>
            <label className="form-label" style={{ marginTop: '1rem' }}>
              Lead rival{' '}
              <span className="optional">({rivalLead.length}/2)</span>
            </label>
            <div className="poke-selector">
              {rivalSelection.map(name => (
                <button
                  key={name}
                  className={`poke-btn ${rivalLead.includes(name) ? 'selected' : ''}`}
                  onClick={() => toggleRivalLead(name)}
                >
                  {name}
                </button>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Notas */}
      <section className="form-section">
        <label className="form-label">
          Notas <span className="optional">(opcional)</span>
        </label>
        <textarea
          className="form-textarea"
          placeholder="Critico importante, fallo de ataque, jugada clave..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={4}
        />
      </section>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button className="btn btn-secondary" onClick={onBack}>Cancelar</button>
        <button className="btn btn-primary" onClick={handleSave}>{matchId ? 'Guardar cambios' : 'Guardar partida'}</button>
      </div>
    </div>
  )
}
