import { PokemonSet } from '../types'
import { pokemonSpriteUrl, itemIconUrl } from '../sprites'

interface Props {
  pokemon: PokemonSet
}

function hideOnError(e: React.SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.style.display = 'none'
}

export default function PokemonCard({ pokemon: p }: Props) {
  return (
    <div className="pokemon-card">
      <div className="pokemon-sprite-box">
        <img
          src={pokemonSpriteUrl(p.name)}
          alt={p.name}
          className="pokemon-sprite-gif"
          onError={hideOnError}
        />
      </div>
      <div className="pokemon-card-body">
        <div className="pokemon-card-name">
          {p.nickname || p.name}
          {p.nickname && <span className="pokemon-card-species"> ({p.name})</span>}
        </div>
        {p.item && (
          <div className="pokemon-card-item">
            <img src={itemIconUrl(p.item)} alt={p.item} className="item-icon" onError={hideOnError} />
            {p.item}
          </div>
        )}
        {(p.ability || p.nature) && (
          <div className="pokemon-card-detail">
            {[p.ability, p.nature].filter(Boolean).join(' · ')}
          </div>
        )}
        {Object.keys(p.evs).length > 0 && (
          <div className="pokemon-card-detail pokemon-card-evs">
            {Object.entries(p.evs).map(([stat, val]) => `${val} ${stat}`).join(' / ')}
          </div>
        )}
        {p.moves.length > 0 && (
          <ul className="pokemon-card-moves">
            {p.moves.map(m => <li key={m}>{m}</li>)}
          </ul>
        )}
      </div>
    </div>
  )
}
