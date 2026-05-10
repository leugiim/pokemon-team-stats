import { PokemonSet } from './types'

// Formato Pokepaste:
// Apodo (Nombre) @ Objeto   ← o solo "Nombre @ Objeto" si no hay apodo
// Ability: Habilidad
// Level: N                  ← opcional
// Shiny: Yes/No             ← opcional
// Tera Type: Tipo           ← opcional
// EVs: 252 HP / 4 Def / 252 SpA
// Naturaleza Nature
// IVs: ...                  ← opcional
// - Movimiento1
// - Movimiento2
// ...
// (línea en blanco separa cada Pokemon)

export function parsePokepaste(paste: string): PokemonSet[] {
  const blocks = paste
    .trim()
    .split(/\n\s*\n/)
    .map(b => b.trim())
    .filter(Boolean)

  return blocks.map(block => parseBlock(block)).filter(Boolean) as PokemonSet[]
}

function parseBlock(block: string): PokemonSet | null {
  const lines = block.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length === 0) return null

  // Primera línea: nombre/apodo y objeto
  const firstLine = lines[0]
  let nickname = ''
  let name = ''
  let item = ''

  const atSplit = firstLine.split('@')
  // Eliminar marcadores de género (F) / (M) que Showdown añade al nombre
  const namePart = atSplit[0].trim().replace(/\s*\([FM]\)\s*/g, ' ').trim()
  item = atSplit[1]?.trim() ?? ''

  // ¿Hay apodo? → "Apodo (Nombre)" o solo "Nombre"
  const parenMatch = namePart.match(/^(.+?)\s*\((.+?)\)\s*(?:\(.*\))?$/)
  if (parenMatch) {
    nickname = parenMatch[1].trim()
    // El nombre puede venir con género entre paréntesis extra, lo ignoramos
    name = parenMatch[2].trim()
  } else {
    name = namePart.replace(/\s*\(.*\)\s*$/, '').trim()
    nickname = ''
  }

  // Resto de líneas
  let ability = ''
  let nature = ''
  const evs: Record<string, number> = {}
  const moves: string[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]

    if (line.startsWith('Ability:')) {
      ability = line.replace('Ability:', '').trim()
    } else if (line.includes('Nature')) {
      nature = line.replace('Nature', '').trim()
    } else if (line.startsWith('EVs:')) {
      const evPart = line.replace('EVs:', '').trim()
      evPart.split('/').forEach(seg => {
        const m = seg.trim().match(/(\d+)\s+(.+)/)
        if (m) evs[m[2].trim()] = parseInt(m[1])
      })
    } else if (line.startsWith('- ')) {
      moves.push(line.slice(2).trim())
    }
    // Level, Shiny, Tera Type, IVs → ignorados de momento
  }

  return { name, nickname, item, ability, nature, evs, moves }
}
