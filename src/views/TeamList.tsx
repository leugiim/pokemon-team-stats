import { useState, useEffect } from 'react'
import { Team } from '../types'
import { getTeams, getMatchesByTeam, deleteTeam } from '../store'
import { pokemonIconUrl } from '../sprites'

function hideOnError(e: React.SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.style.display = 'none'
}

interface Props {
  onCreateTeam: () => void
  onSelectTeam: (id: string) => void
}

export default function TeamList({ onCreateTeam, onSelectTeam }: Props) {
  const [teams, setTeams] = useState<Team[]>([])

  useEffect(() => {
    setTeams(getTeams())
  }, [])

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    if (!confirm('¿Eliminar este equipo y todas sus partidas?')) return
    deleteTeam(id)
    setTeams(getTeams())
  }

  return (
    <div className="view">
      <header className="view-header">
        <h1>Pokemon Team Stats</h1>
        <button className="btn btn-primary" onClick={onCreateTeam}>
          + Nuevo equipo
        </button>
      </header>

      {teams.length === 0 ? (
        <div className="empty-state">
          <p>No hay equipos todavía.</p>
          <button className="btn btn-primary" onClick={onCreateTeam}>
            Crear primer equipo
          </button>
        </div>
      ) : (
        <ul className="team-list">
          {teams.map(team => {
            const matches = getMatchesByTeam(team.id)
            const wins = matches.filter(m => m.result === 'win').length
            const total = matches.length
            const winrate = total > 0 ? Math.round((wins / total) * 100) : null

            return (
              <li
                key={team.id}
                className="team-card"
                onClick={() => onSelectTeam(team.id)}
              >
                <div className="team-card-info">
                  <h2>{team.name}</h2>
                  <div className="team-card-pokemon">
                    {team.pokemon.map(p => (
                      <span key={p.name} className="poke-badge">
                        <img
                          src={pokemonIconUrl(p.name)}
                          alt={p.name}
                          className="poke-icon-xs"
                          onError={hideOnError}
                        />
                        {p.nickname || p.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="team-card-stats">
                  <span className="stat-matches">{total} partidas</span>
                  {winrate !== null && (
                    <span className={`stat-winrate ${winrate >= 50 ? 'win' : 'loss'}`}>
                      {winrate}% WR
                    </span>
                  )}
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={e => handleDelete(e, team.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
