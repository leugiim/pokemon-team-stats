import { useState, useEffect } from 'react'
import { Team, Match } from '../types'
import { getTeams, getMatchesByTeam, deleteMatch, saveMatch } from '../store'
import PokemonCard from '../components/PokemonCard'
import { pokemonIconUrl, itemIconUrl } from '../sprites'
import { matchToJson, historyToJson, jsonToMatch, jsonToHistory } from '../utils/matchIO'
import IOModal from '../components/IOModal'

function hideOnError(e: React.SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.style.display = 'none'
}

interface Props {
  teamId: string
  onBack: () => void
  onEdit: () => void
  onAddMatch: () => void
  onEditMatch: (matchId: string) => void
}

function winrate(matches: Match[]) {
  if (matches.length === 0) return null
  return Math.round((matches.filter(m => m.result === 'win').length / matches.length) * 100)
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

type ModalState =
  | { mode: 'export'; title: string; content: string }
  | { mode: 'import'; title: string; onImport: (text: string) => void }
  | null

export default function TeamDetail({ teamId, onBack, onEdit, onAddMatch, onEditMatch }: Props) {
  const [team, setTeam] = useState<Team | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [modal, setModal] = useState<ModalState>(null)

  function reload() {
    const t = getTeams().find(t => t.id === teamId) ?? null
    setTeam(t)
    setMatches(getMatchesByTeam(teamId).sort((a, b) => b.date - a.date))
  }

  useEffect(() => { reload() }, [teamId])

  function handleDeleteMatch(id: string) {
    if (!confirm('¿Eliminar esta partida?')) return
    deleteMatch(id)
    reload()
  }

  function openExportMatch(match: Match) {
    setModal({ mode: 'export', title: 'Exportar partida', content: matchToJson(match) })
  }

  function openExportHistory(ms: Match[]) {
    setModal({ mode: 'export', title: 'Exportar historial', content: historyToJson(ms) })
  }

  function openImportMatch() {
    setModal({
      mode: 'import',
      title: 'Importar partida',
      onImport: (text) => {
        const match = jsonToMatch(text, teamId)
        if (!match) { alert('JSON inválido o formato incorrecto.'); return }
        saveMatch(match)
        setModal(null)
        reload()
      },
    })
  }

  function openImportHistory() {
    setModal({
      mode: 'import',
      title: 'Importar historial',
      onImport: (text) => {
        const imported = jsonToHistory(text, teamId)
        if (!imported) { alert('JSON inválido o formato incorrecto.'); return }
        if (!confirm(`Se importarán ${imported.length} partidas. ¿Continuar?`)) return
        imported.forEach(m => saveMatch(m))
        setModal(null)
        reload()
      },
    })
  }

  if (!team) return <div className="view"><p>Equipo no encontrado.</p></div>

  const wr = winrate(matches)
  const total = matches.length
  const wins = matches.filter(m => m.result === 'win').length

  // Stats por pokemon en selección
  const pokeStats = team.pokemon.map(p => {
    const pokeName = p.nickname || p.name
    const inSelection = matches.filter(m => m.selection.includes(pokeName))
    const pokeWins = inSelection.filter(m => m.result === 'win').length
    return {
      pokemon: p,
      times: inSelection.length,
      wins: pokeWins,
      wr: inSelection.length > 0 ? Math.round((pokeWins / inSelection.length) * 100) : null,
    }
  }).sort((a, b) => b.times - a.times)

  // Stats por lead
  const leadMap = new Map<string, { wins: number; total: number }>()
  matches.forEach(m => {
    if (m.lead.length !== 2) return
    const key = [...m.lead].sort().join(' + ')
    const cur = leadMap.get(key) ?? { wins: 0, total: 0 }
    leadMap.set(key, {
      wins: cur.wins + (m.result === 'win' ? 1 : 0),
      total: cur.total + 1,
    })
  })
  const leadStats = [...leadMap.entries()]
    .map(([lead, s]) => ({ lead, ...s, wr: Math.round((s.wins / s.total) * 100) }))
    .sort((a, b) => b.total - a.total)

  return (
    <div className="view">
      <header className="view-header">
        <button className="btn btn-back" onClick={onBack}>← Volver</button>
        <h1>{team.name}</h1>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={onEdit}>Editar Pokepaste</button>
          <button className="btn btn-primary" onClick={onAddMatch}>+ Añadir partida</button>
        </div>
      </header>

      {/* Equipo */}
      <section className="section">
        <h2 className="section-title">Equipo</h2>
        <div className="pokemon-grid">
          {team.pokemon.map((p, i) => <PokemonCard key={i} pokemon={p} />)}
        </div>
      </section>

      {/* Estadísticas */}
      <section className="section">
        <h2 className="section-title">Estadísticas</h2>

        {total === 0 ? (
          <p className="text-muted">Aún no hay partidas registradas.</p>
        ) : (
          <>
            <div className="stats-global">
              <div className="stat-box">
                <span className="stat-box-value">{total}</span>
                <span className="stat-box-label">Partidas</span>
              </div>
              <div className="stat-box">
                <span className="stat-box-value">{wins}</span>
                <span className="stat-box-label">Victorias</span>
              </div>
              <div className="stat-box">
                <span className={`stat-box-value ${wr !== null && wr >= 50 ? 'win' : 'loss'}`}>
                  {wr}%
                </span>
                <span className="stat-box-label">Winrate</span>
              </div>
            </div>

            <h3 className="subsection-title">Selección por Pokemon</h3>
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Pokemon</th>
                  <th>Seleccionado</th>
                  <th>Victorias</th>
                  <th>Winrate</th>
                </tr>
              </thead>
              <tbody>
                {pokeStats.map(s => (
                  <tr key={s.pokemon.name}>
                    <td>
                      <span className="table-poke-cell">
                        <img
                          src={pokemonIconUrl(s.pokemon.name)}
                          alt={s.pokemon.name}
                          className="poke-icon-sm"
                          onError={hideOnError}
                        />
                        {s.pokemon.nickname || s.pokemon.name}
                        {s.pokemon.item && (
                          <img
                            src={itemIconUrl(s.pokemon.item)}
                            alt={s.pokemon.item}
                            title={s.pokemon.item}
                            className="item-icon-xs"
                            onError={hideOnError}
                          />
                        )}
                      </span>
                    </td>
                    <td>{s.times}</td>
                    <td>{s.wins}</td>
                    <td>
                      {s.wr !== null ? (
                        <span className={s.wr >= 50 ? 'win' : 'loss'}>{s.wr}%</span>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {leadStats.length > 0 && (
              <>
                <h3 className="subsection-title">Winrate por lead</h3>
                <table className="stats-table">
                  <thead>
                    <tr>
                      <th>Lead</th>
                      <th>Veces</th>
                      <th>Victorias</th>
                      <th>Winrate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leadStats.map(s => (
                      <tr key={s.lead}>
                        <td>{s.lead}</td>
                        <td>{s.total}</td>
                        <td>{s.wins}</td>
                        <td><span className={s.wr >= 50 ? 'win' : 'loss'}>{s.wr}%</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </>
        )}
      </section>

      {/* Historial */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Historial de partidas</h2>
          <div className="io-actions">
            <button className="btn btn-secondary btn-sm" onClick={openImportMatch}>Importar partida</button>
            {matches.length > 0 && <>
              <button className="btn btn-secondary btn-sm" onClick={openImportHistory}>Importar historial</button>
              <button className="btn btn-secondary btn-sm" onClick={() => openExportHistory(matches)}>Exportar historial</button>
            </>}
          </div>
        </div>

        {matches.length === 0 ? (
          <p className="text-muted">No hay partidas todavía.</p>
        ) : (
          <ul className="match-list">
            {matches.map(m => (
              <li key={m.id} className={`match-item ${m.result}`}>
                <div className="match-result-badge">{m.result === 'win' ? 'V' : 'D'}</div>
                <div className="match-info">
                  <div className="match-date">{formatDate(m.date)}</div>
                  {(() => {
                    const ownBenched = team.pokemon
                      .map(p => p.nickname || p.name)
                      .filter(n => !m.selection.includes(n))
                    return (
                      <div className="match-detail">
                        <span className="match-label">Selección:</span>{' '}
                        <span className="match-poke-row">
                          {m.selection.map(name => (
                            <span key={name} title={name} className={`match-poke-icon ${m.lead.includes(name) ? 'match-poke-icon--lead' : ''}`}>
                              <img src={pokemonIconUrl(name)} alt={name} className="poke-icon-md" onError={hideOnError} />
                            </span>
                          ))}
                          {ownBenched.length > 0 && (
                            <>
                              <span className="match-bench-sep" />
                              {ownBenched.map(name => (
                                <span key={name} title={name} className="match-poke-icon match-poke-icon--benched">
                                  <img src={pokemonIconUrl(name)} alt={name} className="poke-icon-md" onError={hideOnError} />
                                </span>
                              ))}
                            </>
                          )}
                        </span>
                      </div>
                    )
                  })()}
                  {m.rivalSelection.length > 0 && (() => {
                    const benched = m.rivalTeam.filter(n => !m.rivalSelection.includes(n))
                    return (
                      <div className="match-detail">
                        <span className="match-label">Rival:</span>{' '}
                        <span className="match-poke-row">
                          {m.rivalSelection.map(name => (
                            <span key={name} title={name} className={`match-poke-icon ${m.rivalLead.includes(name) ? 'match-poke-icon--lead' : ''}`}>
                              <img src={pokemonIconUrl(name)} alt={name} className="poke-icon-md" onError={hideOnError} />
                            </span>
                          ))}
                          {benched.length > 0 && (
                            <>
                              <span className="match-bench-sep" />
                              {benched.map(name => (
                                <span key={name} title={name} className="match-poke-icon match-poke-icon--benched">
                                  <img src={pokemonIconUrl(name)} alt={name} className="poke-icon-md" onError={hideOnError} />
                                </span>
                              ))}
                            </>
                          )}
                        </span>
                      </div>
                    )
                  })()}
                  {m.rivalTeam.length > 0 && m.rivalSelection.length === 0 && (
                    <div className="match-detail">
                      <span className="match-label">Rival:</span>{' '}
                      <span className="match-poke-row">
                        {m.rivalTeam.map(name => (
                          <span key={name} title={name} className="match-poke-icon">
                            <img src={pokemonIconUrl(name)} alt={name} className="poke-icon-md" onError={hideOnError} />
                          </span>
                        ))}
                      </span>
                    </div>
                  )}
                  {m.notes && <div className="match-notes">{m.notes}</div>}
                </div>
                <div className="match-actions">
                  <button className="btn btn-icon btn-secondary" title="Editar" onClick={() => onEditMatch(m.id)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button className="btn btn-icon btn-secondary" title="Exportar partida" onClick={() => openExportMatch(m)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                    </svg>
                  </button>
                  <button className="btn btn-icon btn-danger" title="Eliminar" onClick={() => handleDeleteMatch(m.id)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {modal && (
        modal.mode === 'export'
          ? <IOModal mode="export" title={modal.title} content={modal.content} onClose={() => setModal(null)} />
          : <IOModal mode="import" title={modal.title} onImport={modal.onImport} onClose={() => setModal(null)} />
      )}
    </div>
  )
}
