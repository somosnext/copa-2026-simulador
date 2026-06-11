const API_FOOTBALL_URL = 'https://v3.football.api-sports.io/fixtures?league=1&season=2026'

const aliases = {
  'bosnia herzegovina': 'bosnia and herzegovina',
  'bosnia & herzegovina': 'bosnia and herzegovina',
  'cote divoire': 'ivory coast',
  "cote d ivoire": 'ivory coast',
  'czech republic': 'czechia',
  'korea republic': 'south korea',
  'south korea': 'south korea',
  'turkey': 'turkiye',
  'türkiye': 'turkiye',
  'united states': 'usa',
  'united states of america': 'usa',
  'd r congo': 'dr congo',
  'congo dr': 'dr congo',
}

function normalizeTeam(value = '') {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

  return aliases[normalized] || normalized
}

function sameTeams(localMatch, officialMatch) {
  const localHome = normalizeTeam(localMatch.home)
  const localAway = normalizeTeam(localMatch.away)
  const officialHome = normalizeTeam(officialMatch.home)
  const officialAway = normalizeTeam(officialMatch.away)

  return (
    (localHome === officialHome && localAway === officialAway) ||
    (localHome === officialAway && localAway === officialHome)
  )
}

function toLocalScore(localMatch, officialMatch) {
  const localHome = normalizeTeam(localMatch.home)
  const officialHome = normalizeTeam(officialMatch.home)

  if (localHome === officialHome) {
    return { home: String(officialMatch.homeGoals), away: String(officialMatch.awayGoals), official: true }
  }

  return { home: String(officialMatch.awayGoals), away: String(officialMatch.homeGoals), official: true }
}

async function fetchFromProxy() {
  const response = await fetch('/api/worldcup-results')
  if (!response.ok) throw new Error('proxy-unavailable')
  return response.json()
}

async function fetchDirectly() {
  const key = import.meta.env.VITE_API_FOOTBALL_KEY
  if (!key) throw new Error('missing-api-key')

  const response = await fetch(API_FOOTBALL_URL, {
    headers: { 'x-apisports-key': key },
  })

  if (!response.ok) throw new Error('api-football-error')
  const data = await response.json()
  return simplifyApiFootballResponse(data)
}

export function simplifyApiFootballResponse(data) {
  return (data.response || [])
    .map((fixture) => ({
      id: fixture.fixture?.id,
      date: fixture.fixture?.date?.slice(0, 10),
      status: fixture.fixture?.status?.short,
      home: fixture.teams?.home?.name,
      away: fixture.teams?.away?.name,
      homeGoals: fixture.goals?.home,
      awayGoals: fixture.goals?.away,
    }))
    .filter((match) => Number.isInteger(match.homeGoals) && Number.isInteger(match.awayGoals))
}

export async function fetchOfficialScores() {
  try {
    return await fetchFromProxy()
  } catch (error) {
    if (error.message !== 'proxy-unavailable') throw error
    return fetchDirectly()
  }
}

export function matchOfficialScores(localMatches, officialMatches) {
  const scores = {}

  localMatches.forEach((localMatch) => {
    if (!localMatch.home || !localMatch.away) return

    const officialMatch = officialMatches.find((candidate) => sameTeams(localMatch, candidate))
    if (officialMatch) scores[localMatch.id] = toLocalScore(localMatch, officialMatch)
  })

  return scores
}
