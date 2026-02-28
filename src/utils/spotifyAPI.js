/**
 * spotifyAPI.js — Helper functions for Spotify Web API calls
 *
 * These functions assume you have a valid accessToken and handle the token
 * refresh logic via the onTokenRefresh callback if needed.
 */

/**
 * Helper to make authenticated Spotify API requests
 */
async function spotifyFetch(url, accessToken, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      `Spotify API error: ${response.status} ${response.statusText} - ${errorData.error?.message || ''}`
    )
  }

  return response.json()
}

/**
 * getCurrentUser
 * Fetch the current user's profile
 */
export async function getCurrentUser(accessToken) {
  return spotifyFetch('https://api.spotify.com/v1/me', accessToken)
}

/**
 * getRecentlyPlayed
 * Get the user's recently played tracks (last 50)
 */
export async function getRecentlyPlayed(accessToken, limit = 50) {
  const params = new URLSearchParams({ limit })
  return spotifyFetch(
    `https://api.spotify.com/v1/me/player/recently-played?${params}`,
    accessToken
  )
}

/**
 * getTopTracks
 * Get the user's top tracks for a specific time range
 *
 * timeRange: 'long_term' | 'medium_term' | 'short_term'
 *   long_term = last ~6 months
 *   medium_term = last ~4 weeks (default)
 *   short_term = last 7 days
 */
export async function getTopTracks(accessToken, timeRange = 'medium_term', limit = 50) {
  const params = new URLSearchParams({ limit, time_range: timeRange })
  return spotifyFetch(`https://api.spotify.com/v1/me/top/tracks?${params}`, accessToken)
}

/**
 * getTopArtists
 * Get the user's top artists for a specific time range
 */
export async function getTopArtists(accessToken, timeRange = 'medium_term', limit = 50) {
  const params = new URLSearchParams({ limit, time_range: timeRange })
  return spotifyFetch(`https://api.spotify.com/v1/me/top/artists?${params}`, accessToken)
}

/**
 * getArtist
 * Get details for a specific artist
 */
export async function getArtist(accessToken, artistId) {
  return spotifyFetch(`https://api.spotify.com/v1/artists/${artistId}`, accessToken)
}

/**
 * getArtistAlbums
 * Get an artist's albums
 */
export async function getArtistAlbums(accessToken, artistId, limit = 50) {
  const params = new URLSearchParams({ limit, include_groups: 'album,single' })
  return spotifyFetch(
    `https://api.spotify.com/v1/artists/${artistId}/albums?${params}`,
    accessToken
  )
}

/**
 * getArtistTopTracks
 * Get an artist's top 10 tracks
 */
export async function getArtistTopTracks(accessToken, artistId, market = 'US') {
  const params = new URLSearchParams({ market })
  return spotifyFetch(
    `https://api.spotify.com/v1/artists/${artistId}/top-tracks?${params}`,
    accessToken
  )
}

/**
 * getTrack
 * Get details for a specific track
 */
export async function getTrack(accessToken, trackId) {
  return spotifyFetch(`https://api.spotify.com/v1/tracks/${trackId}`, accessToken)
}

/**
 * getTracks
 * Get details for multiple tracks (up to 50 at once)
 */
export async function getTracks(accessToken, trackIds) {
  const ids = Array.isArray(trackIds) ? trackIds.join(',') : trackIds
  const params = new URLSearchParams({ ids })
  return spotifyFetch(`https://api.spotify.com/v1/tracks?${params}`, accessToken)
}

/**
 * getPlaylist
 * Get details for a playlist
 */
export async function getPlaylist(accessToken, playlistId) {
  return spotifyFetch(`https://api.spotify.com/v1/playlists/${playlistId}`, accessToken)
}

/**
 * search
 * Search for tracks, artists, albums, or playlists
 */
export async function search(accessToken, query, type = 'track', limit = 20) {
  const params = new URLSearchParams({ q: query, type, limit })
  return spotifyFetch(`https://api.spotify.com/v1/search?${params}`, accessToken)
}
