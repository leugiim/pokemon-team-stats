import { describe, expect, it } from 'vitest'
import { itemIconUrl, megaIconUrl, pokemonIconUrl, pokemonSpriteUrl } from '../src/sprites'

const BASE = 'https://play.pokemonshowdown.com/sprites'

describe('sprites', () => {
  it('builds animated and icon urls from a Showdown id', () => {
    expect(pokemonSpriteUrl('Rotom-Wash')).toBe(`${BASE}/ani/rotom-wash.gif`)
    expect(pokemonIconUrl('Flutter Mane')).toBe(`${BASE}/gen5/fluttermane.png`)
  })

  it('collapses "-Mega-" into "mega"', () => {
    expect(pokemonIconUrl('Charizard-Mega-Y')).toBe(`${BASE}/gen5/charizard-megay.png`)
    expect(pokemonIconUrl('Froslass-Mega')).toBe(`${BASE}/gen5/froslass-mega.png`)
  })

  it('removes the hyphen for special names', () => {
    expect(pokemonIconUrl('Kommo-o')).toBe(`${BASE}/gen5/kommoo.png`)
    expect(pokemonIconUrl('Ho-Oh')).toBe(`${BASE}/gen5/hooh.png`)
    expect(pokemonIconUrl('Porygon-Z')).toBe(`${BASE}/gen5/porygonz.png`)
  })

  it('builds item icon urls and uses the mega icon for mega stones', () => {
    expect(itemIconUrl('Sitrus Berry')).toBe(`${BASE}/itemicons/sitrus-berry.png`)
    expect(itemIconUrl('Charizardite Y')).toBe(megaIconUrl())
    expect(itemIconUrl('Eviolite')).toBe(`${BASE}/itemicons/eviolite.png`)
  })
})
