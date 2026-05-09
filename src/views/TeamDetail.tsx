import { useState, useEffect } from 'react'
import { Team, Match } from '../types'
import { getTeams, getMatchesByTeam, deleteMatch } from '../store'
import PokemonCard from '../components/PokemonCard'
import { pokemonIconUrl, itemIconUrl } from '../sprites'

function hideOnError(e: React.SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.style.display = 'none'
}

interface Props {
  teamId: string
  onBack: () => void
  onEdit: () => void
  onAddMatch: () => void
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

export default function TeamDetail({ teamId, onBack, onEdit, onAddMatch }: Props) {
  const [team, setTeam] = useState<Team | null>(null)
  const [matches, setMatches] = useState<Match[]>([])

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
        <h2 className="section-title">Historial de partidas</h2>
        {matches.length === 0 ? (
          <p className="text-muted">No hay partidas todavía.</p>
        ) : (
          <ul className="match-list">
            {matches.map(m => (
              <li key={m.id} className={`match-item ${m.result}`}>
                <div className="match-result-badge">{m.result === 'win' ? 'V' : 'D'}</div>
                <div className="match-info">
                  <div className="match-date">{formatDate(m.date)}</div>
                  <div className="match-detail">
                    <span className="match-label">Selección:</span>{' '}
                    <span className="match-poke-row">
                      {m.selection.map(name => (
                        <span key={name} className="match-poke-chip">
                          <img src={pokemonIconUrl(name)} alt={name} className="poke-icon-xs" onError={hideOnError} />
                          {name}
                        </span>
                      ))}
                    </span>
                  </div>
                  <div className="match-detail">
                    <span className="match-label">Lead:</span>{' '}
                    <span className="match-poke-row">
                      {m.lead.map(name => (
                        <span key={name} className="match-poke-chip match-poke-chip--lead">
                          <img src={pokemonIconUrl(name)} alt={name} className="poke-icon-xs" onError={hideOnError} />
                          {name}
                        </span>
                      ))}
                    </span>
                  </div>
                  {m.rivalTeam.length > 0 && (
                    <div className="match-detail">
                      <span className="match-label">Rival:</span>{' '}
                      <span className="match-poke-row">
                        {m.rivalTeam.map(name => (
                          <span key={name} className={`match-poke-chip ${m.rivalLead.includes(name) ? 'match-poke-chip--lead' : ''}`}>
                            <img src={pokemonIconUrl(name)} alt={name} className="poke-icon-xs" onError={hideOnError} />
                            {name}
                          </span>
                        ))}
                      </span>
                    </div>
                  )}
                  {m.notes && (
                    <div className="match-notes">{m.notes}</div>
                  )}
                </div>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDeleteMatch(m.id)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
