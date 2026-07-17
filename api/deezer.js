export default async function handler(req, res) {
  const { type = 'artist', q, limit = '1' } = req.query
  if (!q) {
    res.status(400).json({ error: 'q parameter required' })
    return
  }

  const endpoint = type === 'track' ? 'search/track' : 'search/artist'
  const url = `https://api.deezer.com/${endpoint}?q=${encodeURIComponent(q)}&limit=${limit}`

  try {
    const response = await fetch(url)
    const data = await response.json()
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.json(data)
  } catch {
    res.status(502).json({ error: 'Failed to fetch from Deezer', data: [] })
  }
}
