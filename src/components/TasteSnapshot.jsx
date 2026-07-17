import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { getTopArtists as getLastfmTopArtists } from '../utils/lastfmAPI.js'
import { getTopArtists as getSpotifyTopArtists } from '../utils/spotifyAPI.js'
import { compareTaste } from '../utils/tasteComparison.js'
import { useArtistImages } from '../utils/artistImages.js'

const TABS = ['rising', 'consistent', 'fading']
const TAB_LABELS = {
  rising: 'Rising',
  consistent: 'Consistent',
  fading: 'Fading',
}
const TAB_DESCRIPTIONS = {
  rising: 'New in your rotation — artists you\'re into right now but weren\'t before',
  consistent: 'Enduring favorites — artists that have stood the test of time',
  fading: 'Falling off — used to be regulars, not so much lately',
}
const TAB_EMPTY = {
  rising: 'No new artists detected — your taste is remarkably stable',
  consistent: 'No overlap between short and long term — your taste shifts fast',
  fading: 'Nothing fading — you\'re staying loyal to your old favorites',
}

function lastfmImage(imageArr) {
  if (!imageArr || !Array.isArray(imageArr)) return null
  const large = imageArr.find(i => i.size === 'large') || imageArr.find(i => i.size === 'extralarge') || imageArr[0]
  const url = large?.['#text'] || null
  if (url && url.includes('2a96cbd8b46e442fc41c2b86b821562f')) return null
  return url
}

function normalizeLastfmArtist(a) {
  return {
    name: a.name,
    image: lastfmImage(a.image),
    genres: [],
  }
}

function normalizeSpotifyArtist(a) {
  return {
    name: a.name,
    image: a.images?.[0]?.url || null,
    genres: a.genres?.slice(0, 2) || [],
  }
}

export default function TasteSnapshot({ spotifyToken, lastfmUser, allEntries, onBack }) {
  const [shortTermArtists, setShortTermArtists] = useState(null)
  const [longTermArtists, setLongTermArtists] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('rising')

  useEffect(() => {
    if (lastfmUser?.name) {
      fetchLastfm()
    } else if (spotifyToken?.accessToken) {
      fetchSpotify()
    } else {
      setError('No music service connected')
      setLoading(false)
    }

    async function fetchLastfm() {
      try {
        const [shortRes, longRes] = await Promise.all([
          getLastfmTopArtists(lastfmUser.name, '7day', 50),
          getLastfmTopArtists(lastfmUser.name, 'overall', 50),
        ])
        setShortTermArtists((shortRes.artist || []).map(normalizeLastfmArtist))
        setLongTermArtists((longRes.artist || []).map(normalizeLastfmArtist))
      } catch (err) {
        console.error('Failed to fetch Last.fm top artists:', err)
        setError('Failed to load your taste data')
      } finally {
        setLoading(false)
      }
    }

    async function fetchSpotify() {
      try {
        const [shortRes, longRes] = await Promise.all([
          getSpotifyTopArtists(spotifyToken.accessToken, 'short_term', 50),
          getSpotifyTopArtists(spotifyToken.accessToken, 'long_term', 50),
        ])
        setShortTermArtists((shortRes.items || []).map(normalizeSpotifyArtist))
        setLongTermArtists((longRes.items || []).map(normalizeSpotifyArtist))
      } catch (err) {
        console.error('Failed to fetch Spotify top artists:', err)
        setError('Failed to load your taste data')
      } finally {
        setLoading(false)
      }
    }
  }, [lastfmUser, spotifyToken])

  const comparison = useMemo(() => {
    if (!shortTermArtists || !longTermArtists) return null
    return compareTaste(shortTermArtists, longTermArtists, allEntries)
  }, [shortTermArtists, longTermArtists, allEntries])

  const allArtistNames = useMemo(() => {
    if (!comparison) return []
    return [...comparison.rising, ...comparison.consistent, ...comparison.fading].map(a => a.name)
  }, [comparison])

  const artistImages = useArtistImages(allArtistNames)

  if (loading) {
    return (
      <SnapshotShell onBack={onBack}>
        <div className="flex items-center justify-center py-20">
          <p className="text-text-secondary text-sm">Loading your taste snapshot...</p>
        </div>
      </SnapshotShell>
    )
  }

  if (error) {
    return (
      <SnapshotShell onBack={onBack}>
        <div className="flex items-center justify-center py-20">
          <p className="text-error text-sm">{error}</p>
        </div>
      </SnapshotShell>
    )
  }

  if (!comparison) return null

  const currentList = comparison[activeTab]

  return (
    <SnapshotShell onBack={onBack}>
      {/* Summary stats */}
      <div className="flex gap-3 mb-6">
        {TABS.map(tab => (
          <div
            key={tab}
            className={`flex-1 p-3 rounded-lg border cursor-pointer transition-all ${
              activeTab === tab
                ? 'border-accent bg-accent/10'
                : 'border-border bg-surface hover:border-border-strong'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            <p className={`text-2xl font-mono-stat ${
              tab === 'rising' ? 'text-accent-light' :
              tab === 'consistent' ? 'text-text-primary' :
              'text-text-muted'
            }`}>
              {comparison[tab].length}
            </p>
            <p className="text-xs text-text-secondary mt-1">{TAB_LABELS[tab]}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-text-muted mb-4">{TAB_DESCRIPTIONS[activeTab]}</p>

      {currentList.length === 0 ? (
        <p className="text-sm text-text-secondary py-8 text-center">{TAB_EMPTY[activeTab]}</p>
      ) : (
        <div className="space-y-2">
          {currentList.map((artist, i) => (
            <motion.div
              key={artist.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-3 p-3 rounded-lg bg-surface border border-border"
            >
              <span className="text-text-muted text-xs font-mono w-6 text-right flex-shrink-0">
                {activeTab === 'fading' ? artist.longRank : artist.shortRank}
              </span>

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
                  <span className="text-text-muted text-xs truncate">
                    {artist.genres.join(', ')}
                  </span>
                )}
              </div>

              {activeTab === 'rising' && (
                <span className="text-accent text-xs font-medium flex-shrink-0">New</span>
              )}
              {activeTab === 'consistent' && artist.rankDelta !== 0 && (
                <span className={`text-xs font-mono flex-shrink-0 ${
                  artist.rankDelta > 0 ? 'text-accent-light' : 'text-error'
                }`}>
                  {artist.rankDelta > 0 ? `+${artist.rankDelta}` : artist.rankDelta}
                </span>
              )}
              {activeTab === 'fading' && artist.totalHistoryPlays > 0 && (
                <span className="text-text-muted text-xs font-mono flex-shrink-0">
                  {artist.totalHistoryPlays} plays
                </span>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </SnapshotShell>
  )
}

function SnapshotShell({ onBack, children }) {
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
        <h1 className="text-xl font-serif text-text-primary">Taste Snapshot</h1>
        <div className="w-12" />
      </div>
      <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full">
        {children}
      </div>
    </motion.div>
  )
}
