import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parsePokepaste } from '../src/pokepaste'

const paste = readFileSync(new URL('./fixtures/team.paste.txt', import.meta.url), 'utf8')

describe('parsePokepaste', () => {
  const team = parsePokepaste(paste)

  it('parses one set per blank-line separated block', () => {
    expect(team.map(p => p.name)).toEqual(['Charizard', 'Rotom-Wash', 'Froslass-Mega'])
  })

  it('parses a set without nickname', () => {
    expect(team[0]).toEqual({
      name: 'Charizard',
      nickname: '',
      item: 'Charizardite Y',
      ability: 'Blaze',
      nature: 'Timid',
      evs: { HP: 4, SpA: 252, Spe: 252 },
      moves: ['Heat Wave', 'Solar Beam', 'Protect', 'Air Slash'],
    })
  })

  it('parses nickname and strips the gender marker', () => {
    expect(team[1].nickname).toBe('Sparky')
    expect(team[1].name).toBe('Rotom-Wash')
    expect(team[1].item).toBe('Sitrus Berry')
    expect(team[1].evs).toEqual({ HP: 252, Def: 4, SpD: 252 })
  })

  it('ignores Level, Shiny, Tera Type and IVs', () => {
    expect(Object.keys(team[0])).not.toContain('level')
    expect(team[0].evs).not.toHaveProperty('Atk')
  })

  it('returns no sets for empty or blank input', () => {
    expect(parsePokepaste('')).toEqual([])
    expect(parsePokepaste('\n\n  \n')).toEqual([])
  })

  it('handles a set without item', () => {
    const [p] = parsePokepaste('Pikachu\nAbility: Static\n- Thunderbolt')
    expect(p.name).toBe('Pikachu')
    expect(p.item).toBe('')
    expect(p.moves).toEqual(['Thunderbolt'])
  })

  // Known quirk (characterization): any line containing "Nature" is treated as the nature line,
  // even a move such as "Nature Power".
  it('mistakes a move containing "Nature" for the nature line (known quirk)', () => {
    const [p] = parsePokepaste('Pikachu\nAbility: Static\nTimid Nature\n- Nature Power')
    expect(p.moves).toEqual([])
    expect(p.nature).toBe('-  Power')
  })
})
