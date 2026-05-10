import { Match } from '../types'
import { generateId } from '../store'

type MatchData = Omit<Match, 'id' | 'teamId'>

// Claves cortas para exportación compacta
interface CompactMatch {
  d: number         // date
  r: string         // result
  tr?: string[]     // teamRoster
  s: string[]       // selection
  l: string[]       // lead
  rt: string[]      // rivalTeam
  rs: string[]      // rivalSelection
  rl: string[]      // rivalLead
  n: string         // notes
}

function encode(m: MatchData): CompactMatch {
  const c: CompactMatch = {
    d: m.date,
    r: m.result,
    s: m.selection,
    l: m.lead,
    rt: m.rivalTeam,
    rs: m.rivalSelection,
    rl: m.rivalLead,
    n: m.notes,
  }
  if (m.teamRoster?.length) c.tr = m.teamRoster
  return c
}

function decode(c: CompactMatch): MatchData {
  return {
    date: c.d,
    result: c.r as Match['result'],
    teamRoster: c.tr ?? [],
    selection: c.s,
    lead: c.l,
    rivalTeam: c.rt,
    rivalSelection: c.rs,
    rivalLead: c.rl,
    notes: c.n,
  }
}

function isCompact(obj: unknown): obj is CompactMatch {
  return typeof obj === 'object' && obj !== null && 'd' in obj && 's' in obj
}

export function matchToJson(match: Match): string {
  const { id: _id, teamId: _teamId, ...data } = match
  return JSON.stringify(encode(data))
}

export function historyToJson(matches: Match[]): string {
  return JSON.stringify(matches.map(({ id: _id, teamId: _teamId, ...rest }) => encode(rest)))
}

export function jsonToMatch(json: string, teamId: string): Match | null {
  try {
    const parsed = JSON.parse(json)
    const raw = Array.isArray(parsed) ? parsed[0] : parsed
    if (!raw) return null
    const data = isCompact(raw) ? decode(raw) : raw as MatchData
    if (!data?.result || !data?.selection || !data?.lead) return null
    return { id: generateId(), teamId, ...data }
  } catch {
    return null
  }
}

export function jsonToHistory(json: string, teamId: string): Match[] | null {
  try {
    const parsed = JSON.parse(json)
    const arr = Array.isArray(parsed) ? parsed : [parsed]
    if (!arr.length) return null
    const matches = arr.map((raw: unknown) => {
      const data = isCompact(raw) ? decode(raw as CompactMatch) : raw as MatchData
      return { id: generateId(), teamId, ...data }
    })
    if (!matches[0]?.result) return null
    return matches
  } catch {
    return null
  }
}
