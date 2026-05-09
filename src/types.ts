export interface PokemonSet {
  name: string
  nickname: string
  item: string
  ability: string
  nature: string
  evs: Record<string, number>
  moves: string[]
}

export interface Team {
  id: string
  name: string
  paste: string
  pokemon: PokemonSet[]
  createdAt: number
}

export interface MatchPokemon {
  name: string
}

export interface Match {
  id: string
  teamId: string
  date: number
  result: 'win' | 'loss' | 'ongoing'
  // Equipo propio
  selection: string[]   // 4 nombres del equipo propio
  lead: string[]        // 2 nombres del lead propio
  // Rival
  rivalTeam: string[]   // 6 nombres del rival
  rivalSelection: string[] // 4 seleccionados por el rival
  rivalLead: string[]   // 2 del lead rival
  // Notas
  notes: string
}
