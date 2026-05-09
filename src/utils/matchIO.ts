import { Match } from '../types'
import { generateId } from '../store'

type MatchData = Omit<Match, 'id' | 'teamId'>

export function matchToJson(match: Match): string {
  const { id: _id, teamId: _teamId, ...data } = match
  return JSON.stringify(data)
}

export function historyToJson(matches: Match[]): string {
  const data: MatchData[] = matches.map(({ id: _id, teamId: _teamId, ...rest }) => rest)
  return JSON.stringify(data)
}

export function jsonToMatch(json: string, teamId: string): Match | null {
  try {
    const data = JSON.parse(json) as MatchData
    // Puede venir como array de 1 elemento (historial con una sola partida)
    const item = Array.isArray(data) ? data[0] : data
    if (!item?.result || !item?.selection || !item?.lead) return null
    return { id: generateId(), teamId, ...item }
  } catch {
    return null
  }
}

export function jsonToHistory(json: string, teamId: string): Match[] | null {
  try {
    const data = JSON.parse(json)
    const arr: MatchData[] = Array.isArray(data) ? data : [data]
    if (!arr.length || !arr[0]?.result) return null
    return arr.map(d => ({ id: generateId(), teamId, ...d }))
  } catch {
    return null
  }
}
