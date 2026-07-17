import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { getTopArtists as getLastfmTopArtists, getTopTracks as getLastfmTopTracks, getRecentTracks as getLastfmRecentTracks, getArtistTopAlbums as getLastfmArtistAlbums } from '../utils/lastfmAPI.js'
import { getTopArtists as getSpotifyTopArtists, getTopTracks as getSpotifyTopTracks, getRecentlyPlayed, getArtistAlbums } from '../utils/spotifyAPI.js'
import { useArtistImages } from '../utils/artistImages.js'

function lastfmImage(imageArr) {
  if (!imageArr || !Array.isArray(imageArr)) return null
  const large = imageArr.find(i => i.size === 'extralarge') || imageArr.find(i => i.size === 'large') || imageArr[0]
  const url = large?.['#text'] || null
  if (url && url.includes('2a96cbd8b46e442fc41c2b86b821562f')) return null
  return url
}

export default function ArtistExploration({ spotifyToken, lastfmUser, allEntries, onBack }) {
  const [artists, setArtists] = useState(null)
  const [explorationData, setExplorationData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tracksByArtist, setTracksByArtist] = useState(null)
  const [dataSource, setDataSource] = useState(null)
  const [useLastfm, setUseLastfm] = useState(false)

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

  useEffect(() => {
    if (lastfmUser?.name) {
      setUseLastfm(true)
      fetchLastfmData()
    } else if (spotifyToken?.accessToken) {
      setUseLastfm(false)
      fetchSpotifyData()
    } else {
      setError('No music service connected')
      setLoading(false)
    }

    async function fetchLastfmData() {
      try {
        const res = await getLastfmTopArtists(lastfmUser.name, 'overall', 20)
        const topArtists = (res.artist || []).map(a => ({
          name: a.name,
          image: lastfmImage(a.image),
          url: a.url,
          playcount: parseInt(a.playcount, 10) || 0,
        }))
        setArtists(topArtists)

        if (allEntries && allEntries.length > 0) {
          setTracksByArtist(historyByArtist)
          setDataSource('history')
          return
        }

        const map = new Map()
        const addTrack = (artistName, trackName) => {
          if (!artistName || !trackName) return
          const key = artistName.toLowerCase()
          if (!map.has(key)) map.set(key, new Set())
          map.get(key).add(trackName.toLowerCase())
        }

        const [shortRes, medRes, longRes, recentRes] = await Promise.all([
          getLastfmTopTracks(lastfmUser.name, '7day', 50),
          getLastfmTopTracks(lastfmUser.name, '6month', 50),
          getLastfmTopTracks(lastfmUser.name, 'overall', 50),
          getLastfmRecentTracks(lastfmUser.name, { limit: 50 }),
        ])

        for (const res of [shortRes, medRes, longRes]) {
          for (const track of (res.track || [])) {
            addTrack(track.artist?.name, track.name)
          }
        }

        for (const track of (recentRes.track || [])) {
          addTrack(track.artist?.name || track.artist?.['#text'], track.name)
        }

        setTracksByArtist(map)
        setDataSource('api')
      } catch (err) {
        console.error('Failed to fetch Last.fm data:', err)
        setError('Failed to load artists')
        setLoading(false)
      }
    }

    async function fetchSpotifyData() {
      try {
        const artistsRes = await getSpotifyTopArtists(spotifyToken.accessToken, 'long_term', 20)
        setArtists((artistsRes.items || []).map(a => ({
          name: a.name,
          id: a.id,
          image: a.images?.[0]?.url || null,
          genres: a.genres?.slice(0, 2) || [],
        })))

        if (allEntries && allEntries.length > 0) {
          setTracksByArtist(historyByArtist)
          setDataSource('history')
          return
        }

        const map = new Map()
        const addTrack = (artistName, trackName) => {
          if (!artistName || !trackName) return
          const key = artistName.toLowerCase()
          if (!map.has(key)) map.set(key, new Set())
          map.get(key).add(trackName.toLowerCase())
        }

        const [shortRes, medRes, longRes, recentRes] = await Promise.all([
          getSpotifyTopTracks(spotifyToken.accessToken, 'short_term', 50),
          getSpotifyTopTracks(spotifyToken.accessToken, 'medium_term', 50),
          getSpotifyTopTracks(spotifyToken.accessToken, 'long_term', 50),
          getRecentlyPlayed(spotifyToken.accessToken, 50),
        ])

        for (const res of [shortRes, medRes, longRes]) {
          for (const track of (res.items || [])) {
            addTrack(track.artists?.[0]?.name, track.name)
          }
        }

        for (const item of (recentRes.items || [])) {
          addTrack(item.track?.artists?.[0]?.name, item.track?.name)
        }

        setTracksByArtist(map)
        setDataSource('api')
      } catch (err) {
        console.error('Failed to fetch Spotify data:', err)
        setError('Failed to load artists')
        setLoading(false)
      }
    }
  }, [lastfmUser, spotifyToken, allEntries, historyByArtist])

  // Fetch discographies
  useEffect(() => {
    if (!artists || !tracksByArtist) return

    const fetchDiscographies = async () => {
      const topArtists = artists.slice(0, 10)
      const results = []

      for (const artist of topArtists) {
        try {
          let totalReleases = 0

          if (useLastfm) {
            const albumsRes = await getLastfmArtistAlbums(artist.name, 50)
            totalReleases = albumsRes.album?.length || 0
          } else {
            const albumsRes = await getArtistAlbums(spotifyToken.accessToken, artist.id, 50)
            totalReleases = albumsRes.items?.length || 0
          }

          const artistKey = artist.name.toLowerCase()
          const heardTracks = tracksByArtist.get(artistKey)
          const tracksHeard = heardTracks ? heardTracks.size : 0

          const denominator = dataSource === 'api'
            ? totalReleases
            : totalReleases * 3
          const explorationScore = totalReleases > 0
            ? Math.min(1, tracksHeard / denominator)
            : 0

          results.push({
            id: artist.name,
            name: artist.name,
            image: artist.image || null,
            genres: artist.genres || [],
            totalReleases,
            tracksHeard,
            explorationScore,
            explorationPct: Math.round(explorationScore * 100),
          })
        } catch (err) {
          console.warn(`Failed to fetch discography for ${artist.name}:`, err)
          results.push({
            id: artist.name,
            name: artist.name,
            image: artist.image || null,
            genres: artist.genres || [],
            totalReleases: 0,
            tracksHeard: 0,
            explorationScore: 0,
            explorationPct: 0,
            error: true,
          })
        }
      }

      results.sort((a, b) => a.explorationScore - b.explorationScore)
      setExplorationData(results)
      setLoading(false)
    }

    fetchDiscographies()
  }, [artists, tracksByArtist, useLastfm, spotifyToken, dataSource])

  const explorationArtistNames = useMemo(() => {
    if (!explorationData) return []
    return explorationData.map(a => a.name)
  }, [explorationData])

  const artistImages = useArtistImages(explorationArtistNames)

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

      {dataSource === 'api' && (
        <div className="mb-6 p-3 rounded-lg border border-accent/20 bg-accent/5">
          <p className="text-xs text-text-secondary">
            Based on your top tracks and recently played.
            Upload your Extended Streaming History for more accurate results across your full listening history.
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
              {(artist.image || artistImages[artist.name.toLowerCase()]) ? (
                <img
                  src={artist.image || artistImages[artist.name.toLowerCase()]}
                  alt={artist.name}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-border flex-shrink-0" />
              )}

              <div className="flex-1 min-w-0">
                <p className="text-text-primary text-sm font-medium truncate">{artist.name}</p>
                {artist.genres?.length > 0 && (
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
