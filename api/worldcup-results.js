const API_FOOTBALL_URL = 'https://v3.football.api-sports.io/fixtures?league=1&season=2026'

function simplifyApiFootballResponse(data) {
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

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.status(405).json({ error: 'Method not allowed' })
    return
  }

  const apiKey = process.env.API_FOOTBALL_KEY
  if (!apiKey) {
    response.status(500).json({ error: 'Missing API_FOOTBALL_KEY environment variable' })
    return
  }

  const apiResponse = await fetch(API_FOOTBALL_URL, {
    headers: { 'x-apisports-key': apiKey },
  })

  if (!apiResponse.ok) {
    response.status(apiResponse.status).json({ error: 'API-Football request failed' })
    return
  }

  const data = await apiResponse.json()
  response.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
  response.status(200).json(simplifyApiFootballResponse(data))
}
