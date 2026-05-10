import { Team, Match } from './types'

const TEAMS_KEY = 'pts_teams'
const LEGACY_MATCHES_KEY = 'pts_matches'
const matchesKey = (teamId: string) => `pts_matches_${teamId}`

function load<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

function save<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data))
}

// Teams
export function getTeams(): Team[] {
  return load<Team>(TEAMS_KEY)
}

export function saveTeam(team: Team): void {
  const teams = getTeams()
  const idx = teams.findIndex(t => t.id === team.id)
  if (idx >= 0) teams[idx] = team
  else teams.push(team)
  save(TEAMS_KEY, teams)
}

export function deleteTeam(id: string): void {
  save(TEAMS_KEY, getTeams().filter(t => t.id !== id))
  localStorage.removeItem(matchesKey(id))
  // Limpiar también de la clave legacy por si no se había migrado aún
  const legacy = load<Match>(LEGACY_MATCHES_KEY)
  if (legacy.some(m => m.teamId === id)) {
    save(LEGACY_MATCHES_KEY, legacy.filter(m => m.teamId !== id))
  }
}

// Matches — carga por equipo con migración automática desde clave legacy
function loadMatchesByTeam(teamId: string): Match[] {
  const perTeam = load<Match>(matchesKey(teamId))
  if (perTeam.length > 0) return perTeam

  // Fallback: migrar desde la clave global legacy al primer acceso
  const legacy = load<Match>(LEGACY_MATCHES_KEY)
  const teamMatches = legacy.filter(m => m.teamId === teamId)
  if (teamMatches.length > 0) {
    save(matchesKey(teamId), teamMatches)
    save(LEGACY_MATCHES_KEY, legacy.filter(m => m.teamId !== teamId))
  }
  return teamMatches
}

export function getMatchesByTeam(teamId: string): Match[] {
  return loadMatchesByTeam(teamId)
}

export function getMatch(id: string, teamId: string): Match | undefined {
  return loadMatchesByTeam(teamId).find(m => m.id === id)
}

export function saveMatch(match: Match): void {
  const matches = loadMatchesByTeam(match.teamId)
  const idx = matches.findIndex(m => m.id === match.id)
  if (idx >= 0) matches[idx] = match
  else matches.push(match)
  save(matchesKey(match.teamId), matches)
}

export function deleteMatch(id: string, teamId: string): void {
  save(matchesKey(teamId), loadMatchesByTeam(teamId).filter(m => m.id !== id))
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}
