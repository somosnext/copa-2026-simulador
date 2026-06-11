import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  Download,
  Eraser,
  ExternalLink,
  Flag,
  Medal,
  Share2,
  ShieldCheck,
  Trophy,
} from 'lucide-react'
import heroStadium from './assets/hero-stadium.png'
import { groupMatches, groups, laterRounds, roundOf32Slots } from './tournamentData'

const STORAGE_KEY = 'wc26-simulator-state-v1'

const emptyState = {
  groupScores: {},
  knockoutScores: {},
  seedOverrides: {},
}

function loadState() {
  try {
    return { ...emptyState, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) }
  } catch {
    return emptyState
  }
}

function parseScore(value) {
  if (value === '' || value === undefined || value === null) return null
  const number = Number(value)
  return Number.isInteger(number) && number >= 0 ? number : null
}

function scoreIsComplete(score) {
  return parseScore(score?.home) !== null && parseScore(score?.away) !== null
}

function blankRow(team, group) {
  return { team, group, played: 0, points: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, gd: 0 }
}

function compareRows(a, b) {
  return (
    b.points - a.points ||
    b.gd - a.gd ||
    b.gf - a.gf ||
    a.ga - b.ga ||
    a.team.localeCompare(b.team)
  )
}

function calculateStandings(scores) {
  return Object.fromEntries(
    Object.entries(groups).map(([group, teams]) => {
      const rows = Object.fromEntries(teams.map((team) => [team, blankRow(team, group)]))

      groupMatches
        .filter((match) => match.group === group)
        .forEach((match) => {
          const score = scores[match.id]
          if (!scoreIsComplete(score)) return

          const homeGoals = parseScore(score.home)
          const awayGoals = parseScore(score.away)
          const home = rows[match.home]
          const away = rows[match.away]

          home.played += 1
          away.played += 1
          home.gf += homeGoals
          home.ga += awayGoals
          away.gf += awayGoals
          away.ga += homeGoals

          if (homeGoals > awayGoals) {
            home.wins += 1
            away.losses += 1
            home.points += 3
          } else if (awayGoals > homeGoals) {
            away.wins += 1
            home.losses += 1
            away.points += 3
          } else {
            home.draws += 1
            away.draws += 1
            home.points += 1
            away.points += 1
          }
        })

      return [
        group,
        Object.values(rows)
          .map((row) => ({ ...row, gd: row.gf - row.ga }))
          .sort(compareRows),
      ]
    }),
  )
}

function qualifyTeams(standings) {
  const topTwo = {}
  const thirds = []

  Object.entries(standings).forEach(([group, rows]) => {
    topTwo[`${group}1`] = rows[0]
    topTwo[`${group}2`] = rows[1]
    thirds.push(rows[2])
  })

  const bestThirds = thirds.sort(compareRows).slice(0, 8)
  return { topTwo, bestThirds, allThirds: thirds.sort(compareRows) }
}

function resolveSeed(seed, topTwo, bestThirds, usedThirdGroups) {
  if (!seed) return null
  if (!seed.startsWith('3:')) return topTwo[seed]?.team || null

  const pool = seed.slice(2).split('/')
  const third =
    bestThirds.find((row) => pool.includes(row.group) && !usedThirdGroups.has(row.group)) ||
    bestThirds.find((row) => !usedThirdGroups.has(row.group))

  if (third) usedThirdGroups.add(third.group)
  return third?.team || null
}

function defaultSeeds(topTwo, bestThirds) {
  const usedThirdGroups = new Set()
  return Object.fromEntries(
    roundOf32Slots.flatMap((slot) => [
      [`${slot.id}:home`, resolveSeed(slot.home, topTwo, bestThirds, usedThirdGroups)],
      [`${slot.id}:away`, resolveSeed(slot.away, topTwo, bestThirds, usedThirdGroups)],
    ]),
  )
}

function getWinner(match, scores) {
  if (!match?.home || !match?.away) return null
  const score = scores[match.id]
  if (!scoreIsComplete(score)) return null

  const home = parseScore(score.home)
  const away = parseScore(score.away)
  if (home > away) return match.home
  if (away > home) return match.away
  return score?.winner || null
}

function getLoser(match, scores) {
  const winner = getWinner(match, scores)
  if (!winner) return null
  return winner === match.home ? match.away : match.home
}

function makeKnockout(seedMap, scores) {
  const r32 = roundOf32Slots.map((slot) => ({
    ...slot,
    label: '32 avos',
    home: seedMap[`${slot.id}:home`],
    away: seedMap[`${slot.id}:away`],
  }))

  const makeRound = (key, previous, label) =>
    laterRounds[key].map(([id, date, time, stadium], index) => ({
      id,
      date,
      time,
      stadium,
      label,
      home: getWinner(previous[index * 2], scores),
      away: getWinner(previous[index * 2 + 1], scores),
    }))

  const r16 = makeRound('R16', r32, 'Oitavas')
  const qf = makeRound('QF', r16, 'Quartas')
  const sf = makeRound('SF', qf, 'Semifinal')
  const final = {
    id: 'FINAL-1',
    date: laterRounds.FINAL[0][1],
    time: laterRounds.FINAL[0][2],
    stadium: laterRounds.FINAL[0][3],
    label: 'Final',
    home: getWinner(sf[0], scores),
    away: getWinner(sf[1], scores),
  }
  const third = {
    id: 'THIRD-1',
    date: laterRounds.THIRD[0][1],
    time: laterRounds.THIRD[0][2],
    stadium: laterRounds.THIRD[0][3],
    label: '3o lugar',
    home: getLoser(sf[0], scores),
    away: getLoser(sf[1], scores),
  }

  return { R32: r32, R16: r16, QF: qf, SF: sf, THIRD: [third], FINAL: [final] }
}

function Stat({ value, label }) {
  return (
    <div className="border border-white/15 bg-white px-4 py-3 text-black">
      <strong className="block text-2xl font-black md:text-4xl">{value}</strong>
      <span className="text-xs font-bold uppercase tracking-[0.18em] text-black/55">{label}</span>
    </div>
  )
}

function ScoreInputs({ score, onChange, disabled }) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
      <input
        aria-label="Placar mandante"
        className="score-input"
        disabled={disabled}
        min="0"
        type="number"
        value={score?.home ?? ''}
        onChange={(event) => onChange({ ...score, home: event.target.value })}
      />
      <span className="text-xs font-black text-neutral-400">x</span>
      <input
        aria-label="Placar visitante"
        className="score-input"
        disabled={disabled}
        min="0"
        type="number"
        value={score?.away ?? ''}
        onChange={(event) => onChange({ ...score, away: event.target.value })}
      />
    </div>
  )
}

function MatchCard({ match, score, onScore, knockout = false }) {
  const tied = knockout && scoreIsComplete(score) && parseScore(score.home) === parseScore(score.away)
  const winner = knockout ? getWinner(match, { [match.id]: score }) : null
  const disabled = !match.home || !match.away

  return (
    <article className="match-card">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-neutral-500">
        <span>{match.date} - {match.time}</span>
        <span>{match.label || `Rodada ${match.round}`}</span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_122px_1fr] sm:items-center">
        <strong className="team-name">{match.home || 'A definir'}</strong>
        <ScoreInputs score={score} disabled={disabled} onChange={onScore} />
        <strong className="team-name sm:text-right">{match.away || 'A definir'}</strong>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-3 text-xs font-bold uppercase tracking-[0.16em] text-neutral-500">
        <span>{match.stadium}</span>
        {winner && <span className="text-black">Avanca: {winner}</span>}
      </div>
      {tied && (
        <div className="mt-3 grid gap-2 sm:grid-cols-[auto_1fr] sm:items-center">
          <span className="text-xs font-black uppercase tracking-[0.18em]">Desempate</span>
          <select
            className="select-field"
            value={score?.winner || ''}
            onChange={(event) => onScore({ ...score, winner: event.target.value })}
          >
            <option value="">Escolha o vencedor</option>
            <option value={match.home}>{match.home}</option>
            <option value={match.away}>{match.away}</option>
          </select>
        </div>
      )}
    </article>
  )
}

function GroupStage({ standings, state, setGroupScore }) {
  return (
    <section id="grupos" className="page-section">
      <div className="section-kicker">Fase de grupos</div>
      <h2 className="section-title">72 jogos, 12 grupos, tudo calculado no navegador.</h2>
      <div className="mt-8 grid gap-6">
        {Object.keys(groups).map((group) => (
          <div className="group-panel" key={group}>
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-neutral-200 p-4 md:p-6">
              <div>
                <span className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500">Grupo</span>
                <h3 className="text-5xl font-black leading-none md:text-7xl">{group}</h3>
              </div>
              <div className="max-w-xl text-sm font-semibold text-neutral-600">
                {groups[group].join(' / ')}
              </div>
            </div>
            <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="grid gap-3 border-b border-neutral-200 p-4 md:p-6 lg:border-b-0 lg:border-r">
                {groupMatches
                  .filter((match) => match.group === group)
                  .map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      score={state.groupScores[match.id]}
                      onScore={(score) => setGroupScore(match.id, score)}
                    />
                  ))}
              </div>
              <div className="overflow-x-auto p-4 md:p-6">
                <table className="standings-table">
                  <thead>
                    <tr>
                      <th>Selecao</th>
                      <th>Pts</th>
                      <th>V</th>
                      <th>E</th>
                      <th>D</th>
                      <th>GP</th>
                      <th>GC</th>
                      <th>SG</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings[group].map((row, index) => (
                      <tr className={index < 2 ? 'qualified-row' : ''} key={row.team}>
                        <td>{index + 1}. {row.team}</td>
                        <td>{row.points}</td>
                        <td>{row.wins}</td>
                        <td>{row.draws}</td>
                        <td>{row.losses}</td>
                        <td>{row.gf}</td>
                        <td>{row.ga}</td>
                        <td>{row.gd}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function Knockout({ knockout, state, seedMap, seedOptions, setSeedOverride, setKnockoutScore }) {
  const rounds = [
    ['R32', '32 avos'],
    ['R16', 'Oitavas'],
    ['QF', 'Quartas'],
    ['SF', 'Semifinais'],
    ['THIRD', '3o lugar'],
    ['FINAL', 'Final'],
  ]

  return (
    <section id="mata-mata" className="page-section">
      <div className="section-kicker">Mata-mata</div>
      <h2 className="section-title">Ajuste os classificados e jogue a chave ate a final.</h2>

      <div className="mt-8 border border-black bg-white">
        <div className="border-b border-black bg-black p-4 text-white md:p-6">
          <h3 className="text-2xl font-black uppercase">Classificados para os 32 avos</h3>
          <p className="mt-1 text-sm font-semibold text-white/65">Os campos abaixo nascem da classificacao, mas voce pode trocar qualquer selecao.</p>
        </div>
        <div className="grid gap-3 p-4 md:grid-cols-2 md:p-6 xl:grid-cols-4">
          {roundOf32Slots.flatMap((slot) => ['home', 'away'].map((side) => {
            const key = `${slot.id}:${side}`
            return (
              <label className="grid gap-2" key={key}>
                <span className="text-xs font-black uppercase tracking-[0.18em] text-neutral-500">
                  {slot.id} / {side === 'home' ? slot.home : slot.away}
                </span>
                <select className="select-field" value={seedMap[key] || ''} onChange={(event) => setSeedOverride(key, event.target.value)}>
                  <option value="">A definir</option>
                  {seedOptions.map((team) => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
              </label>
            )
          }))}
        </div>
      </div>

      <div className="bracket-scroll mt-8">
        <div className="bracket-grid">
          {rounds.map(([key, label]) => (
            <div className="bracket-column" key={key}>
              <h3>{label}</h3>
              <div className="grid gap-4">
                {knockout[key].map((match) => (
                  <MatchCard
                    knockout
                    key={match.id}
                    match={match}
                    score={state.knockoutScores[match.id]}
                    onScore={(score) => setKnockoutScore(match.id, score)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FinalResult({ knockout, state, standings }) {
  const final = knockout.FINAL[0]
  const thirdMatch = knockout.THIRD[0]
  const champion = getWinner(final, state.knockoutScores)
  const runnerUp = getLoser(final, state.knockoutScores)
  const third = getWinner(thirdMatch, state.knockoutScores)
  const fourth = getLoser(thirdMatch, state.knockoutScores)
  const campaign = champion
    ? Object.values(standings).flat().find((row) => row.team === champion)
    : null

  return (
    <section id="resultado" className="page-section">
      <div className="section-kicker">Resultado final</div>
      <h2 className="section-title">O painel da sua Copa simulada.</h2>
      <div className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="bg-black p-6 text-white md:p-10">
          <Trophy className="mb-8 h-12 w-12" />
          <span className="text-xs font-black uppercase tracking-[0.22em] text-white/50">Campeao</span>
          <h3 className="mt-3 text-5xl font-black leading-none md:text-8xl">{champion || 'A definir'}</h3>
          {campaign && (
            <p className="mt-6 max-w-xl text-lg font-semibold text-white/70">
              Campanha no grupo: {campaign.points} pontos, {campaign.wins}V, {campaign.draws}E, {campaign.losses}D, saldo {campaign.gd}.
            </p>
          )}
        </div>
        <div className="grid gap-4">
          <div className="result-card"><Medal /> <span>Vice</span><strong>{runnerUp || 'A definir'}</strong></div>
          <div className="result-card"><Medal /> <span>Terceiro lugar</span><strong>{third || 'A definir'}</strong></div>
          <div className="result-card"><Flag /> <span>Quarto lugar</span><strong>{fourth || 'A definir'}</strong></div>
        </div>
      </div>
    </section>
  )
}

function About() {
  return (
    <section id="sobre" className="page-section">
      <div className="section-kicker">Sobre</div>
      <h2 className="section-title">Projeto nao oficial, manual e sem API.</h2>
      <div className="mt-8 grid gap-5 text-lg font-semibold leading-relaxed text-neutral-700 lg:grid-cols-2">
        <p>Este site nao tem ligacao com a FIFA, com organizadores, patrocinadores ou transmissoras. A identidade visual usa apenas uma direcao inspirada em contraste forte, escala tipografica e composicao editorial, sem copiar logos, imagens ou arquivos protegidos.</p>
        <p>Os jogos e horarios ficam gravados no codigo, os placares sao preenchidos por voce e tudo e salvo no localStorage do navegador. As informacoes de calendario foram conferidas em fontes publicas como FIFA e FOX Sports.</p>
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <a className="link-button" href="https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026" target="_blank" rel="noreferrer">
          Site oficial <ExternalLink size={16} />
        </a>
        <a className="link-button" href="https://www.foxsports.com/stories/soccer/2026-world-cup-schedule-all-games-dates-matchups-how-watch" target="_blank" rel="noreferrer">
          Calendario consultado <ExternalLink size={16} />
        </a>
      </div>
    </section>
  )
}

function App() {
  const [page, setPage] = useState('home')
  const [state, setState] = useState(loadState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const standings = useMemo(() => calculateStandings(state.groupScores), [state.groupScores])
  const qualification = useMemo(() => qualifyTeams(standings), [standings])
  const autoSeeds = useMemo(() => defaultSeeds(qualification.topTwo, qualification.bestThirds), [qualification])
  const seedMap = useMemo(() => ({ ...autoSeeds, ...state.seedOverrides }), [autoSeeds, state.seedOverrides])
  const knockout = useMemo(() => makeKnockout(seedMap, state.knockoutScores), [seedMap, state.knockoutScores])
  const allTeams = Object.values(groups).flat().sort((a, b) => a.localeCompare(b))
  const completedGroupMatches = groupMatches.filter((match) => scoreIsComplete(state.groupScores[match.id])).length
  const champion = getWinner(knockout.FINAL[0], state.knockoutScores)

  const setGroupScore = (id, score) =>
    setState((current) => ({ ...current, groupScores: { ...current.groupScores, [id]: score } }))

  const setKnockoutScore = (id, score) =>
    setState((current) => ({ ...current, knockoutScores: { ...current.knockoutScores, [id]: score } }))

  const setSeedOverride = (key, team) =>
    setState((current) => ({ ...current, seedOverrides: { ...current.seedOverrides, [key]: team } }))

  const reset = () => {
    if (window.confirm('Limpar toda a simulacao e comecar de novo?')) setState(emptyState)
  }

  const exportResult = async () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      champion,
      standings,
      knockoutScores: state.knockoutScores,
      groupScores: state.groupScores,
    }
    const text = JSON.stringify(payload, null, 2)
    await navigator.clipboard.writeText(text)
    if (navigator.share) {
      navigator.share({ title: 'Minha simulacao da Copa 2026', text: champion ? `Meu campeao: ${champion}` : 'Minha simulacao da Copa 2026' })
    }
  }

  const nav = [
    ['home', 'Home'],
    ['groups', 'Grupos'],
    ['knockout', 'Mata-mata'],
    ['result', 'Resultado'],
    ['about', 'Sobre'],
  ]

  return (
    <div className="min-h-screen bg-white text-black">
      <header className="sticky top-0 z-50 border-b border-black bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-8">
          <button className="flex items-center gap-3" onClick={() => setPage('home')}>
            <span className="grid h-10 w-10 place-items-center bg-black text-white"><Trophy size={21} /></span>
            <span className="text-left text-sm font-black uppercase leading-tight tracking-[0.16em]">World Cup<br />Simulator 26</span>
          </button>
          <nav className="flex flex-wrap gap-1">
            {nav.map(([id, label]) => (
              <button className={`nav-button ${page === id ? 'active' : ''}`} key={id} onClick={() => setPage(id)}>
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {page === 'home' && (
        <main>
          <section className="hero-section">
            <img className="hero-image" src={heroStadium} alt="" />
            <div className="hero-pattern" />
            <div className="relative mx-auto grid max-w-[1500px] gap-10 px-4 py-12 md:px-8 md:py-20 xl:grid-cols-[1.05fr_0.95fr]">
              <div>
                <div className="mb-6 inline-flex items-center gap-2 border border-white/25 px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-white/70">
                  <ShieldCheck size={16} /> Simulador nao oficial
                </div>
                <h1 className="max-w-5xl text-6xl font-black uppercase leading-[0.86] text-white md:text-8xl xl:text-[8.8rem]">
                  Copa do Mundo 2026
                </h1>
                <p className="mt-8 max-w-2xl text-xl font-semibold leading-relaxed text-white/70">
                  Preencha placares, acompanhe grupos, escolha classificados em caso de ajuste e jogue o mata-mata ate levantar a taca.
                </p>
                <div className="mt-10 flex flex-wrap gap-3">
                  <button className="primary-button" onClick={() => setPage('groups')}>
                    Comecar simulacao <ArrowRight size={18} />
                  </button>
                  <button className="ghost-button" onClick={() => setPage('knockout')}>Ver chave</button>
                </div>
              </div>
              <div className="grid content-end gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <Stat value="48" label="selecoes" />
                  <Stat value="12" label="grupos" />
                  <Stat value="104" label="jogos" />
                  <Stat value="32" label="mata-mata" />
                </div>
                <div className="border border-white/20 bg-white/10 p-5 text-white backdrop-blur">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-white/50">Progresso salvo</p>
                  <strong className="mt-2 block text-4xl font-black">{completedGroupMatches}/72</strong>
                  <span className="font-semibold text-white/65">jogos de grupo preenchidos neste navegador</span>
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-[1500px] px-4 py-10 md:px-8">
            <div className="grid gap-4 md:grid-cols-3">
              <button className="action-card" onClick={() => setPage('groups')}>
                <Flag /> <strong>Fase de grupos</strong><span>Inserir placares e ver classificacao.</span>
              </button>
              <button className="action-card" onClick={() => setPage('knockout')}>
                <Trophy /> <strong>Mata-mata</strong><span>Confirmar classificados e simular a chave.</span>
              </button>
              <button className="action-card" onClick={() => setPage('result')}>
                <Medal /> <strong>Resultado final</strong><span>Campeao, vice, terceiro e campanha.</span>
              </button>
            </div>
          </section>
        </main>
      )}

      {page === 'groups' && <GroupStage standings={standings} state={state} setGroupScore={setGroupScore} />}
      {page === 'knockout' && (
        <Knockout
          knockout={knockout}
          seedMap={seedMap}
          seedOptions={allTeams}
          state={state}
          setKnockoutScore={setKnockoutScore}
          setSeedOverride={setSeedOverride}
        />
      )}
      {page === 'result' && <FinalResult knockout={knockout} standings={standings} state={state} />}
      {page === 'about' && <About />}

      <div className="fixed bottom-4 right-4 z-50 flex gap-2">
        <button className="floating-button" title="Exportar resultado" onClick={exportResult}><Share2 size={18} /><Download size={16} /></button>
        <button className="floating-button" title="Limpar simulacao" onClick={reset}><Eraser size={18} /></button>
      </div>
    </div>
  )
}

export default App
