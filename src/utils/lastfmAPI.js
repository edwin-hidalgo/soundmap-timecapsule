const API_BASE = 'https://ws.audioscrobbler.com/2.0/'
const API_KEY = import.meta.env.VITE_LASTFM_API_KEY

async function apiCall(params) {
  const url = new URL(API_BASE)
  url.searchParams.set('api_key', API_KEY)
  url.searchParams.set('format', 'json')
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value))
  }

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Last.fm API error: ${res.status}`)

  const data = await res.json()
  if (data.error) throw new Error(data.message || `Last.fm error (code ${data.error})`)

  return data
}

export async function getUserInfo(username) {
  const data = await apiCall({ method: 'user.getInfo', user: username })
  return data.user
}

export async function getRecentTracks(username, { limit = 50, from, to, page = 1 } = {}) {
  const params = { method: 'user.getRecentTracks', user: username, limit, page, extended: 1 }
  if (from) params.from = from
  if (to) params.to = to
  const data = await apiCall(params)
  return data.recenttracks
}

export async function getTopArtists(username, period = 'overall', limit = 50) {
  const data = await apiCall({ method: 'user.getTopArtists', user: username, period, limit })
  return data.topartists
}

export async function getTopTracks(username, period = 'overall', limit = 50) {
  const data = await apiCall({ method: 'user.getTopTracks', user: username, period, limit })
  return data.toptracks
}

export async function getTopAlbums(username, period = 'overall', limit = 50) {
  const data = await apiCall({ method: 'user.getTopAlbums', user: username, period, limit })
  return data.topalbums
}

export async function getArtistInfo(artistName, username = null) {
  const params = { method: 'artist.getInfo', artist: artistName, autocorrect: 1 }
  if (username) params.username = username
  const data = await apiCall(params)
  return data.artist
}

export async function getArtistTopAlbums(artistName, limit = 50) {
  const data = await apiCall({ method: 'artist.getTopAlbums', artist: artistName, limit, autocorrect: 1 })
  return data.topalbums
}

export async function getArtistTopTracks(artistName, limit = 50) {
  const data = await apiCall({ method: 'artist.getTopTracks', artist: artistName, limit, autocorrect: 1 })
  return data.toptracks
}

export async function getSimilarArtists(artistName, limit = 10) {
  const data = await apiCall({ method: 'artist.getSimilar', artist: artistName, limit, autocorrect: 1 })
  return data.similarartists
}

export async function searchArtists(query, limit = 10) {
  const data = await apiCall({ method: 'artist.search', artist: query, limit })
  return data.results
}

export async function searchTracks(query, limit = 10) {
  const data = await apiCall({ method: 'track.search', track: query, limit })
  return data.results
}
