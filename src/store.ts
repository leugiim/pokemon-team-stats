import { Team, Match } from './types'

const TEAMS_KEY = 'pts_teams'
const MATCHES_KEY = 'pts_matches'

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
  if (idx >= 0) {
    teams[idx] = team
  } else {
    teams.push(team)
  }
  save(TEAMS_KEY, teams)
}

export function deleteTeam(id: string): void {
  save(TEAMS_KEY, getTeams().filter(t => t.id !== id))
  save(MATCHES_KEY, getMatches().filter(m => m.teamId !== id))
}

// Matches
export function getMatches(): Match[] {
  return load<Match>(MATCHES_KEY)
}

export function getMatchesByTeam(teamId: string): Match[] {
  return getMatches().filter(m => m.teamId === teamId)
}

export function getMatch(id: string): Match | undefined {
  return getMatches().find(m => m.id === id)
}

export function saveMatch(match: Match): void {
  const matches = getMatches()
  const idx = matches.findIndex(m => m.id === match.id)
  if (idx >= 0) {
    matches[idx] = match
  } else {
    matches.push(match)
  }
  save(MATCHES_KEY, matches)
}

export function deleteMatch(id: string): void {
  save(MATCHES_KEY, getMatches().filter(m => m.id !== id))
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}
