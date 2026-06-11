import { CalendarDays, Clock, ExternalLink, Share2 } from 'lucide-react'
import { groupMatches, groups } from './tournamentData'

const teamNames = {
  Australia: 'Australia',
  Argentina: 'Argentina',
  Algeria: 'Argelia',
  Austria: 'Austria',
  Belgium: 'Belgica',
  Brazil: 'Brasil',
  Canada: 'Canada',
  'Cape Verde': 'Cabo Verde',
  Colombia: 'Colombia',
  Croatia: 'Croacia',
  Curacao: 'Curacao',
  Czechia: 'Tchequia',
  'DR Congo': 'RD Congo',
  Ecuador: 'Equador',
  Egypt: 'Egito',
  England: 'Inglaterra',
  France: 'Franca',
  Germany: 'Alemanha',
  Ghana: 'Gana',
  Haiti: 'Haiti',
  Iran: 'Ira',
  Iraq: 'Iraque',
  'Ivory Coast': 'Costa do Marfim',
  Japan: 'Japao',
  Jordan: 'Jordania',
  Mexico: 'Mexico',
  Morocco: 'Marrocos',
  Netherlands: 'Holanda',
  'New Zealand': 'Nova Zelandia',
  Norway: 'Noruega',
  Panama: 'Panama',
  Paraguay: 'Paraguai',
  Portugal: 'Portugal',
  Qatar: 'Qatar',
  'Saudi Arabia': 'Arabia Saudita',
  Scotland: 'Escocia',
  Senegal: 'Senegal',
  'South Africa': 'Africa do Sul',
  'South Korea': 'Coreia do Sul',
  Spain: 'Espanha',
  Sweden: 'Suecia',
  Switzerland: 'Suica',
  Tunisia: 'Tunisia',
  Turkiye: 'Turquia',
  Uruguay: 'Uruguai',
  USA: 'EUA',
  Uzbekistan: 'Uzbequistao',
  'Bosnia and Herzegovina': 'Bosnia e Herzegovina',
}

const stadiumNames = {
  'Atlanta Stadium': 'Atlanta Stadium',
  'BC Place Vancouver': 'BC Place Vancouver',
  'Boston Stadium': 'Boston Stadium',
  'Dallas Stadium': 'Dallas Stadium',
  'Guadalajara Stadium': 'Guadalajara Stadium',
  'Houston Stadium': 'Houston Stadium',
  'Kansas City Stadium': 'Kansas City Stadium',
  'Los Angeles Stadium': 'Los Angeles Stadium',
  'Mexico City Stadium': 'Mexico City Stadium',
  'Miami Stadium': 'Miami Stadium',
  'Monterrey Stadium': 'Monterrey Stadium',
  'New York New Jersey Stadium': 'New York/New Jersey Stadium',
  'Philadelphia Stadium': 'Philadelphia Stadium',
  'San Francisco Bay Stadium': 'San Francisco Bay Stadium',
  'Seattle Stadium': 'Seattle Stadium',
  'Toronto Stadium': 'Toronto Stadium',
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  timeZone: 'America/Sao_Paulo',
})

const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
})

function labelTeam(team) {
  return teamNames[team] || team
}

function teamInitials(team) {
  return labelTeam(team)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function etDateTime(match) {
  const [hour = '00', minute = '00'] = match.time.replace(' ET', '').split(':')
  return new Date(`${match.date}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00-04:00`)
}

function formatDate(match) {
  return dateFormatter.format(etDateTime(match)).replace('.', '')
}

function formatTime(match) {
  return timeFormatter.format(etDateTime(match))
}

function groupGames(group) {
  return groupMatches
    .filter((match) => match.group === group)
    .toSorted((a, b) => etDateTime(a) - etDateTime(b))
}

function sharePage() {
  const url = window.location.href
  if (navigator.share) {
    navigator.share({ title: 'Copa 2026', url })
    return
  }
  navigator.clipboard?.writeText(url)
}

function TeamPill({ team, index }) {
  return (
    <div className="team-pill">
      <span className="team-mark">{teamInitials(team)}</span>
      <strong>{labelTeam(team)}</strong>
      <small>{index + 1}</small>
    </div>
  )
}

function FixturePill({ match }) {
  return (
    <article className="fixture-pill">
      <div className="fixture-time">
        <span><CalendarDays size={14} /> {formatDate(match)}</span>
        <span><Clock size={14} /> {formatTime(match)} BRT</span>
      </div>
      <div className="fixture-teams">
        <strong>{labelTeam(match.home)}</strong>
        <span>x</span>
        <strong>{labelTeam(match.away)}</strong>
      </div>
      <p>{stadiumNames[match.stadium] || match.stadium}</p>
    </article>
  )
}

function GroupCard({ group, teams }) {
  const games = groupGames(group)

  return (
    <section className="group-card">
      <header>
        <strong>Grupo {group}</strong>
        <span>{games.length}/6 jogos</span>
      </header>
      <div className="team-list">
        {teams.map((team, index) => (
          <TeamPill index={index} key={team} team={team} />
        ))}
      </div>
      <div className="fixture-list">
        <h2>Jogos e horarios</h2>
        {games.map((match) => (
          <FixturePill key={match.id} match={match} />
        ))}
      </div>
    </section>
  )
}

function App() {
  return (
    <main className="site-shell">
      <header className="topbar">
        <h1>Copa 2026</h1>
      </header>

      <div className="toolbar">
        <a href="#grupos">Grupos</a>
        <a href="#jogos">Todos os jogos</a>
        <button type="button" onClick={sharePage}><Share2 size={16} /> Compartilhar</button>
      </div>

      <section className="intro">
        <p>Grupos, confrontos, datas, horarios e estadios da fase de grupos da Copa do Mundo 2026.</p>
        <div className="summary-grid">
          <div><strong>48</strong><span>selecoes</span></div>
          <div><strong>12</strong><span>grupos</span></div>
          <div><strong>72</strong><span>jogos</span></div>
          <div><strong>BRT</strong><span>horario de Brasilia</span></div>
        </div>
      </section>

      <section id="grupos" className="groups-grid">
        {Object.entries(groups).map(([group, teams]) => (
          <GroupCard group={group} key={group} teams={teams} />
        ))}
      </section>

      <section id="jogos" className="all-games">
        <div className="all-games-head">
          <span>Calendario completo</span>
          <strong>Todos os 72 jogos da fase de grupos</strong>
        </div>
        <div className="all-games-list">
          {groupMatches
            .toSorted((a, b) => etDateTime(a) - etDateTime(b))
            .map((match) => (
              <div className="calendar-row" key={match.id}>
                <span>Grupo {match.group}</span>
                <strong>{labelTeam(match.home)} x {labelTeam(match.away)}</strong>
                <small>{formatDate(match)} - {formatTime(match)} BRT - {stadiumNames[match.stadium] || match.stadium}</small>
              </div>
            ))}
        </div>
      </section>

      <footer>
        <p>Projeto nao oficial, sem ligacao com a FIFA. Visual proprio em preto e branco.</p>
        <a href="https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/match-schedule-fixtures-results-teams-stadiums" target="_blank" rel="noreferrer">
          Fonte do calendario <ExternalLink size={15} />
        </a>
      </footer>
    </main>
  )
}

export default App
