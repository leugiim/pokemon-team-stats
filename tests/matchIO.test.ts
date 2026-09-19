import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { historyToJson, jsonToHistory, jsonToMatch, matchToJson } from '../src/utils/matchIO'

const read = (name: string) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8')

describe('matchIO', () => {
  it('imports the full format and assigns ids and teamId', () => {
    const history = jsonToHistory(read('history.full.json'), 'team-1')!
    expect(history).toHaveLength(2)
    expect(history.every(m => m.teamId === 'team-1' && m.id)).toBe(true)
    expect(new Set(history.map(m => m.id)).size).toBe(2)
    expect(history[0].result).toBe('win')
    expect(history[0].notes).toBe('full format')
  })

  it('imports the compact format', () => {
    const history = jsonToHistory(read('history.compact.json'), 'team-1')!
    expect(history[0]).toMatchObject({
      date: 1700000000000,
      result: 'win',
      teamRoster: ['Charizard', 'Sparky', 'Froslass-Mega'],
      selection: ['Charizard', 'Sparky'],
      rivalTeam: ['Incineroar', 'Rillaboom'],
      notes: 'compact',
    })
    // Missing roster falls back to an empty list
    expect(history[1].teamRoster).toEqual([])
    expect(history[1].result).toBe('ongoing')
  })

  it('exports compactly, without id and teamId, and round-trips', () => {
    const history = jsonToHistory(read('history.full.json'), 'team-1')!
    const json = historyToJson(history)
    const raw = JSON.parse(json)
    expect(Object.keys(raw[0]).sort()).toEqual(['d', 'l', 'n', 'r', 's', 'rl', 'rs', 'rt', 'tr'].sort())
    const back = jsonToHistory(json, 'team-2')!
    expect(back.map(({ id: _i, teamId: _t, ...rest }) => rest)).toEqual(
      history.map(({ id: _i, teamId: _t, ...rest }) => rest),
    )
  })

  it('omits the roster key when the roster is empty', () => {
    const [m] = jsonToHistory(read('history.compact.json'), 't')!.slice(1)
    expect(JSON.parse(matchToJson(m))).not.toHaveProperty('tr')
  })

  it('imports a single match from an object or from an array', () => {
    const [first] = JSON.parse(read('history.compact.json'))
    expect(jsonToMatch(JSON.stringify(first), 't')?.notes).toBe('compact')
    expect(jsonToMatch(JSON.stringify([first]), 't')?.notes).toBe('compact')
  })

  it('rejects invalid input', () => {
    expect(jsonToMatch('not json', 't')).toBeNull()
    expect(jsonToMatch('{}', 't')).toBeNull()
    expect(jsonToMatch('[]', 't')).toBeNull()
    expect(jsonToHistory('nope', 't')).toBeNull()
    expect(jsonToHistory('[]', 't')).toBeNull()
  })
})
