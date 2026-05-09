import { useState } from 'react'
import TeamList from './views/TeamList'
import TeamForm from './views/TeamForm'
import TeamDetail from './views/TeamDetail'
import MatchForm from './views/MatchForm'

export type Route =
  | { view: 'list' }
  | { view: 'create' }
  | { view: 'edit'; teamId: string }
  | { view: 'team'; teamId: string }
  | { view: 'match'; teamId: string }

export default function App() {
  const [route, setRoute] = useState<Route>({ view: 'list' })

  return (
    <div className="app">
      {route.view === 'list' && (
        <TeamList
          onCreateTeam={() => setRoute({ view: 'create' })}
          onSelectTeam={id => setRoute({ view: 'team', teamId: id })}
        />
      )}
      {route.view === 'create' && (
        <TeamForm
          onBack={() => setRoute({ view: 'list' })}
          onSaved={id => setRoute({ view: 'team', teamId: id })}
        />
      )}
      {route.view === 'edit' && (
        <TeamForm
          teamId={route.teamId}
          onBack={() => setRoute({ view: 'team', teamId: route.teamId })}
          onSaved={id => setRoute({ view: 'team', teamId: id })}
        />
      )}
      {route.view === 'team' && (
        <TeamDetail
          teamId={route.teamId}
          onBack={() => setRoute({ view: 'list' })}
          onEdit={() => setRoute({ view: 'edit', teamId: route.teamId })}
          onAddMatch={() => setRoute({ view: 'match', teamId: route.teamId })}
        />
      )}
      {route.view === 'match' && (
        <MatchForm
          teamId={route.teamId}
          onBack={() => setRoute({ view: 'team', teamId: route.teamId })}
          onSaved={() => setRoute({ view: 'team', teamId: route.teamId })}
        />
      )}
    </div>
  )
}
