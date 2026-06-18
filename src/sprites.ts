// Pokemon cuyo nombre lleva guion pero el sprite no lo incluye
const NO_HYPHEN: Record<string, string> = {
  'kommo-o': 'kommoo',
  'hakamo-o': 'hakamoo',
  'jangmo-o': 'jangmoo',
  'wo-chien': 'wochien',
  'chien-pao': 'chienpao',
  'ting-lu': 'tinglu',
  'chi-yu': 'chiyu',
  'ho-oh': 'hooh',
  'porygon-z': 'porygonz',
}

// Convierte nombre a ID de Showdown: minúsculas, conserva guiones, elimina el resto
function toId(name: string): string {
  const lower = name.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/mega-/g, 'mega')
  return NO_HYPHEN[lower] ?? lower
}

// Convierte nombre a ID de item de Showdown: minúsculas, cambia espacios por guiones
function toItemId(name: string): string {
  const lower = name.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '')
  return NO_HYPHEN[lower] ?? lower
}

// GIF animado (~96px) — para las tarjetas de equipo
export function pokemonSpriteUrl(name: string): string {
  return `https://play.pokemonshowdown.com/sprites/ani/${toId(name)}.gif`
}

// Sprite estático gen5 (~40px) — para badges e iconos pequeños
export function pokemonIconUrl(name: string): string {
  return `https://play.pokemonshowdown.com/sprites/gen5/${toId(name)}.png`
}

// Icono de objeto (24px)
export function itemIconUrl(item: string): string {
  const id = toItemId(item)
  const baseId = id.replace(/-[xyz]$/, '')
  if (baseId.endsWith('ite') && baseId !== 'eviolite') return megaIconUrl()
  return `https://play.pokemonshowdown.com/sprites/itemicons/${id}.png`
}

// Icono de megapiedra (24px)
export function megaIconUrl(): string {
  return `https://play.pokemonshowdown.com/sprites/misc/mega.png`
}
