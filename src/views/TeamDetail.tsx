import { useState, useEffect } from 'react'
import { Team, Match } from '../types'
import { getTeams, getMatchesByTeam, deleteMatch, saveMatch } from '../store'
import PokemonCard from '../components/PokemonCard'
import { pokemonIconUrl, itemIconUrl } from '../sprites'
import { matchToJson, historyToJson, jsonToMatch, jsonToHistory } from '../utils/matchIO'
import IOModal from '../components/IOModal'
import PokemonInput from '../components/PokemonInput'
import { getPokemonNames } from '../utils/pokemonNames'

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
  const decided = matches.filter(m => m.result !== 'ongoing')
  if (decided.length === 0) return null
  return Math.round((decided.filter(m => m.result === 'win').length / decided.length) * 100)
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
  const [rivalFilter, setRivalFilter] = useState('')
  const [ownFilter, setOwnFilter] = useState('')
  const [resultFilter, setResultFilter] = useState<'win' | 'loss' | 'ongoing' | ''>('')
  const [page, setPage] = useState(0)
  const [pokemonNames, setPokemonNames] = useState<string[]>([])

  function reload() {
    const t = getTeams().find(t => t.id === teamId) ?? null
    setTeam(t)
    const currentRoster = (t?.pokemon ?? []).map(p => p.nickname || p.name)
    const loaded = getMatchesByTeam(teamId).sort((a, b) => b.date - a.date)
    // Migrar partidas sin teamRoster: fijar el equipo actual como roster permanente
    loaded.forEach(m => {
      if (!m.teamRoster?.length) {
        m.teamRoster = currentRoster
        saveMatch(m)
      }
    })
    setMatches(loaded)
  }

  useEffect(() => { reload() }, [teamId])
  useEffect(() => { getPokemonNames().then(setPokemonNames) }, [])

  function handleDeleteMatch(id: string) {
    if (!confirm('¿Eliminar esta partida?')) return
    deleteMatch(id, teamId)
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
  const decided = matches.filter(m => m.result !== 'ongoing')
  const total = decided.length
  const wins = decided.filter(m => m.result === 'win').length

  // Normaliza Mega: "Charizard-Mega-X" → "Charizard", "Froslass-Mega" → "Froslass"
  function megaBase(name: string) {
    return name.replace(/-Mega(-[A-Za-z])?$/i, '')
  }

  // Todos los pokemon que alguna vez estuvieron en el equipo (actuales + históricos de partidas)
  const currentPokeMap = new Map(team.pokemon.map(p => [p.nickname || p.name, p]))
  const allNamesRaw = [...new Set([
    ...team.pokemon.map(p => p.nickname || p.name),
    ...matches.flatMap(m => m.selection),
  ])]

  // Deduplicar agrupando base + mega como uno solo.
  // El nombre de display preferido es el del equipo actual; si no, el primero que aparezca.
  const baseDisplayMap = new Map<string, string>() // base → display name
  allNamesRaw.forEach(name => {
    const base = megaBase(name)
    if (!baseDisplayMap.has(base) || currentPokeMap.has(name)) {
      baseDisplayMap.set(base, name)
    }
  })
  const allPokeNames = [...baseDisplayMap.values()]

  // Stats por pokemon en selección (solo partidas decididas), agrupando Mega con base
  const pokeStats = [...baseDisplayMap.entries()].map(([base, displayName]) => {
    const pokemon = currentPokeMap.get(displayName) ?? null
    const inSelection = decided.filter(m => m.selection.some(n => megaBase(n) === base))
    const pokeWins = inSelection.filter(m => m.result === 'win').length
    return {
      name: displayName,
      pokemon,
      times: inSelection.length,
      wins: pokeWins,
      wr: inSelection.length > 0 ? Math.round((pokeWins / inSelection.length) * 100) : null,
    }
  }).sort((a, b) => b.times - a.times)

  // Stats por lead (solo partidas decididas)
  const leadMap = new Map<string, { wins: number; total: number }>()
  decided.forEach(m => {
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

            <div className="stats-tables">
              <div className="stats-table-block">
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
                      <tr key={s.name}>
                        <td>
                          <span className="table-poke-cell">
                            <img
                              src={pokemonIconUrl(s.pokemon?.name ?? s.name)}
                              alt={s.name}
                              className="poke-icon-sm"
                              onError={hideOnError}
                            />
                            {s.name}
                            {s.pokemon?.item && (
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
              </div>

              {leadStats.length > 0 && (
                <div className="stats-table-block">
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
                </div>
              )}
            </div>
          </>
        )}
      </section>

      {/* Historial */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Historial de partidas</h2>
          <div className="io-actions">
            <button className="btn btn-secondary btn-sm" onClick={openImportMatch}>Importar partida</button>
            <button className="btn btn-secondary btn-sm" onClick={openImportHistory}>Importar historial</button>
            {matches.length > 0 && <button className="btn btn-secondary btn-sm" onClick={() => openExportHistory(matches)}>Exportar historial</button>}
          </div>
        </div>

        <div className="history-filters">
          <div className="filter-row">
            <div className="filter-result-btns">
              {(['win', 'loss', 'ongoing'] as const).map(r => (
                <button
                  key={r}
                  className={`btn btn-sm btn-result-filter ${resultFilter === r ? 'active-' + r : ''}`}
                  onClick={() => { setResultFilter(prev => prev === r ? '' : r); setPage(0) }}
                >
                  {r === 'win' ? 'Victoria' : r === 'loss' ? 'Derrota' : 'En juego'}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-row">
            <div className="filter-own-btns">
              {allPokeNames.map(name => (
                <button
                  key={name}
                  className={`poke-btn poke-btn-sm ${ownFilter === name ? 'selected' : ''}`}
                  onClick={() => { setOwnFilter(prev => prev === name ? '' : name); setPage(0) }}
                >
                  <img src={pokemonIconUrl(name)} alt="" className="poke-icon-xs" onError={hideOnError} />
                  {name}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-row">
            <PokemonInput
              value={rivalFilter}
              placeholder="Filtrar por pokemon rival..."
              allNames={pokemonNames}
              onChange={v => { setRivalFilter(v); setPage(0) }}
            />
            {rivalFilter && <button className="btn btn-secondary btn-sm" onClick={() => { setRivalFilter(''); setPage(0) }}>✕</button>}
          </div>
        </div>

        {(() => {
          const rq = rivalFilter.trim().toLowerCase()
          const oq = ownFilter.trim().toLowerCase()
          const filtered = matches
            .filter(m => !resultFilter || m.result === resultFilter)
            .filter(m => !oq || m.selection.some(n => megaBase(n.toLowerCase()).includes(megaBase(oq))))
            .filter(m => !rq || m.rivalTeam.some(n => n.toLowerCase().includes(rq)))
          const PAGE_SIZE = 10
          const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
          const safePage = Math.min(page, Math.max(0, totalPages - 1))
          const paginated = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)

          if (matches.length === 0) return <p className="text-muted">No hay partidas todavía.</p>
          if (filtered.length === 0) return <p className="text-muted">No hay partidas con esos filtros.</p>
          return <>
            <ul className="match-list">
            {paginated.map(m => (
              <li key={m.id} className={`match-item match-item--${m.result}`}>
                <div className="match-result-badge">{m.result === 'win' ? 'V' : m.result === 'loss' ? 'D' : '·'}</div>
                <div className="match-info">
                  <div className="match-date">{formatDate(m.date)}</div>
                  {(() => {
                    const ownBenched = (m.teamRoster ?? []).filter(n => !m.selection.includes(n))
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
          {totalPages > 1 && (
            <div className="pagination">
              <button className="btn btn-secondary btn-sm" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>← Anterior</button>
              <span className="pagination-info">Página {safePage + 1} de {totalPages}</span>
              <button className="btn btn-secondary btn-sm" disabled={safePage >= totalPages - 1} onClick={() => setPage(safePage + 1)}>Siguiente →</button>
            </div>
          )}
        </>
        })()}
      </section>

      {modal && (
        modal.mode === 'export'
          ? <IOModal mode="export" title={modal.title} content={modal.content} onClose={() => setModal(null)} />
          : <IOModal mode="import" title={modal.title} onImport={modal.onImport} onClose={() => setModal(null)} />
      )}
    </div>
  )
}
