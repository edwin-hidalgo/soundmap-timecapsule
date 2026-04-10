import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { getTopArtists, getArtistAlbums } from '../utils/spotifyAPI.js'

/**
 * ArtistExploration — Shows how much of each top artist's discography you've explored.
 *
 * For each of your top artists (from Spotify), fetches their full album/single catalog
 * and compares against tracks in your uploaded history to compute exploration %.
 */
export default function ArtistExploration({ spotifyToken, allEntries, onBack }) {
  const [artists, setArtists] = useState(null)
  const [explorationData, setExplorationData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Build a set of unique track names per artist from uploaded history
  const historyByArtist = useMemo(() => {
    if (!allEntries) return new Map()
    const map = new Map()
    for (const entry of allEntries) {
      const artist = entry.master_metadata_album_artist_name || entry.ar
      const track = entry.master_metadata_track_name || entry.t
      if (!artist || !track) continue
      const key = artist.toLowerCase()
      if (!map.has(key)) map.set(key, new Set())
      map.get(key).add(track.toLowerCase())
    }
    return map
  }, [allEntries])

  // Fetch top artists
  useEffect(() => {
    if (!spotifyToken?.accessToken) return

    const fetchArtists = async () => {
      try {
        const res = await getTopArtists(spotifyToken.accessToken, 'long_term', 20)
        setArtists(res.items || [])
      } catch (err) {
        console.error('Failed to fetch top artists:', err)
        setError('Failed to load artists from Spotify')
        setLoading(false)
      }
    }

    fetchArtists()
  }, [spotifyToken])

  // Fetch discographies for top artists
  useEffect(() => {
    if (!artists || !spotifyToken?.accessToken) return

    const fetchDiscographies = async () => {
      // Limit to top 10 to avoid hitting rate limits
      const topArtists = artists.slice(0, 10)
      const results = []

      for (const artist of topArtists) {
        try {
          const albumsRes = await getArtistAlbums(spotifyToken.accessToken, artist.id, 50)
          const albums = albumsRes.items || []

          // Count unique album/single releases
          const totalReleases = albums.length

          // Check how many of their tracks appear in history
          const artistKey = artist.name.toLowerCase()
          const heardTracks = historyByArtist.get(artistKey)
          const tracksHeard = heardTracks ? heardTracks.size : 0

          // Rough exploration metric: unique tracks heard / total releases
          // Not perfect (albums have multiple tracks) but gives a directional signal
          const explorationScore = totalReleases > 0
            ? Math.min(1, tracksHeard / (totalReleases * 3)) // ~3 tracks per release avg
            : 0

          results.push({
            id: artist.id,
            name: artist.name,
            image: artist.images?.[0]?.url || null,
            genres: artist.genres?.slice(0, 2) || [],
            totalReleases,
            tracksHeard,
            explorationScore,
            explorationPct: Math.round(explorationScore * 100),
          })
        } catch (err) {
          console.warn(`Failed to fetch discography for ${artist.name}:`, err)
          results.push({
            id: artist.id,
            name: artist.name,
            image: artist.images?.[0]?.url || null,
            genres: artist.genres?.slice(0, 2) || [],
            totalReleases: 0,
            tracksHeard: 0,
            explorationScore: 0,
            explorationPct: 0,
            error: true,
          })
        }
      }

      // Sort by exploration % ascending (least explored first = most opportunity)
      results.sort((a, b) => a.explorationScore - b.explorationScore)
      setExplorationData(results)
      setLoading(false)
    }

    fetchDiscographies()
  }, [artists, spotifyToken, historyByArtist])

  if (loading) {
    return (
      <Shell onBack={onBack}>
        <div className="flex items-center justify-center py-20">
          <p className="text-text-secondary text-sm">Analyzing your discography exploration...</p>
        </div>
      </Shell>
    )
  }

  if (error) {
    return (
      <Shell onBack={onBack}>
        <div className="flex items-center justify-center py-20">
          <p className="text-error text-sm">{error}</p>
        </div>
      </Shell>
    )
  }

  if (!explorationData) return null

  return (
    <Shell onBack={onBack}>
      <p className="text-xs text-text-muted mb-6">
        How much of your top artists' catalogs have you actually explored?
        Sorted by least explored — your biggest discovery opportunities.
      </p>

      {!allEntries && (
        <div className="mb-6 p-3 rounded-lg border border-accent/20 bg-accent/5">
          <p className="text-xs text-text-secondary">
            Upload your Spotify Extended History for accurate exploration tracking.
            Without it, exploration data is estimated.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {explorationData.map((artist, i) => (
          <motion.div
            key={artist.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-4 rounded-lg bg-surface border border-border"
          >
            <div className="flex items-center gap-3 mb-3">
              {artist.image ? (
                <img
                  src={artist.image}
                  alt={artist.name}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-border flex-shrink-0" />
              )}

              <div className="flex-1 min-w-0">
                <p className="text-text-primary text-sm font-medium truncate">{artist.name}</p>
                {artist.genres.length > 0 && (
                  <p className="text-text-muted text-xs truncate">{artist.genres.join(', ')}</p>
                )}
              </div>

              <div className="text-right flex-shrink-0">
                <p className={`text-lg font-mono-stat ${
                  artist.explorationPct > 60 ? 'text-accent-light' :
                  artist.explorationPct > 30 ? 'text-text-primary' :
                  'text-text-muted'
                }`}>
                  {artist.explorationPct}%
                </p>
                <p className="text-[10px] text-text-muted">explored</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-border rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${artist.explorationPct}%` }}
                transition={{ duration: 0.8, delay: i * 0.05 }}
                className={`h-full rounded-full ${
                  artist.explorationPct > 60 ? 'bg-accent' :
                  artist.explorationPct > 30 ? 'bg-accent-secondary' :
                  'bg-text-muted'
                }`}
              />
            </div>

            {/* Stats */}
            <div className="flex gap-4 mt-2">
              <span className="text-[10px] text-text-muted">
                {artist.tracksHeard} unique tracks heard
              </span>
              <span className="text-[10px] text-text-muted">
                {artist.totalReleases} releases in catalog
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </Shell>
  )
}

function Shell({ onBack, children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-full flex flex-col bg-bg-primary"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <button
          onClick={onBack}
          className="text-text-secondary hover:text-text-primary transition-colors text-sm"
        >
          ← Back
        </button>
        <h1 className="text-xl font-serif text-text-primary">Artist Exploration</h1>
        <div className="w-12" />
      </div>
      <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full">
        {children}
      </div>
    </motion.div>
  )
}
