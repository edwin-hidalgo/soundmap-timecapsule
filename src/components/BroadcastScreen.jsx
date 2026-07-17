import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getCurrentlyPlaying, getRecentlyPlayed } from '../utils/spotifyAPI.js'
import { getRecentTracks as getLastfmRecentTracks } from '../utils/lastfmAPI.js'
import { createBroadcast } from '../utils/supabase.js'
import RecentTrackCard from './RecentTrackCard.jsx'
import LiveFeed from './LiveFeed.jsx'
import { BROADCASTS_ENABLED } from '../config/features.js'

function lastfmImage(imageArr) {
  if (!imageArr || !Array.isArray(imageArr)) return null
  const large = imageArr.find(i => i.size === 'large') || imageArr.find(i => i.size === 'extralarge') || imageArr[0]
  const url = large?.['#text'] || null
  if (url && url.includes('2a96cbd8b46e442fc41c2b86b821562f')) return null
  return url
}

function normalizeLastfmTrack(track) {
  const artistName = track.artist?.name || track.artist?.['#text'] || 'Unknown'
  const albumArt = lastfmImage(track.image)
  const playedAt = track.date?.uts
    ? new Date(parseInt(track.date.uts, 10) * 1000).toISOString()
    : new Date().toISOString()

  return {
    track: {
      id: `${track.name}-${artistName}`.toLowerCase(),
      name: track.name,
      artists: [{ name: artistName }],
      album: {
        images: albumArt ? [{ url: albumArt }, { url: albumArt }] : [],
      },
      external_urls: { spotify: track.url },
      preview_url: null,
    },
    played_at: playedAt,
  }
}

export default function BroadcastScreen({
  spotifyToken,
  spotifyUser,
  lastfmUser,
  onBack,
  onNavigateToBroadcast,
}) {
  const [currentSong, setCurrentSong] = useState(null)
  const [nowPlayingLabel, setNowPlayingLabel] = useState('Now Playing')
  const [recentTracks, setRecentTracks] = useState([])
  const [recentLoading, setRecentLoading] = useState(true)
  const [playingPreviewId, setPlayingPreviewId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [shareSuccess, setShareSuccess] = useState(false)

  const hasAuth = !!(lastfmUser || spotifyUser)
  const useLastfm = !!lastfmUser?.name

  // Poll for currently playing
  useEffect(() => {
    if (useLastfm) {
      fetchLastfmNowPlaying()
      const interval = setInterval(fetchLastfmNowPlaying, 30000)
      return () => clearInterval(interval)
    } else if (spotifyToken) {
      fetchSpotifyNowPlaying()
      const interval = setInterval(fetchSpotifyNowPlaying, 30000)
      return () => clearInterval(interval)
    }

    async function fetchLastfmNowPlaying() {
      try {
        const res = await getLastfmRecentTracks(lastfmUser.name, { limit: 1 })
        const tracks = res.track || []
        if (tracks.length > 0) {
          const track = tracks[0]
          const isNowPlaying = track['@attr']?.nowplaying === 'true'
          setNowPlayingLabel(isNowPlaying ? 'Now Playing' : 'Last Played')
          setCurrentSong({
            songName: track.name,
            artist: track.artist?.name || track.artist?.['#text'] || 'Unknown',
            albumArt: lastfmImage(track.image),
            uri: track.url,
            isPlaying: isNowPlaying,
            trackUrl: track.url,
          })
        }
      } catch (err) {
        console.error('Error fetching Last.fm now playing:', err)
      }
    }

    async function fetchSpotifyNowPlaying() {
      try {
        const song = await getCurrentlyPlaying(spotifyToken.accessToken)
        if (song) {
          setNowPlayingLabel('Now Playing')
        }
        setCurrentSong(song)
      } catch (err) {
        console.error('Error fetching current song:', err)
      }
    }
  }, [useLastfm, lastfmUser, spotifyToken])

  // Fetch recently played tracks
  useEffect(() => {
    if (useLastfm) {
      fetchLastfmRecent()
    } else if (spotifyToken?.accessToken) {
      fetchSpotifyRecent()
    }

    async function fetchLastfmRecent() {
      try {
        const fromTimestamp = Math.floor((Date.now() - 86400000) / 1000)
        const res = await getLastfmRecentTracks(lastfmUser.name, { limit: 50, from: fromTimestamp })
        const tracks = (res.track || [])
          .filter(t => !t['@attr']?.nowplaying)
          .map(normalizeLastfmTrack)

        const seen = new Set()
        const deduped = []
        for (const item of tracks) {
          if (!seen.has(item.track.id)) {
            seen.add(item.track.id)
            deduped.push(item)
          }
        }

        setRecentTracks(deduped)
      } catch (err) {
        console.error('Failed to fetch Last.fm recent tracks:', err)
      } finally {
        setRecentLoading(false)
      }
    }

    async function fetchSpotifyRecent() {
      try {
        const res = await getRecentlyPlayed(spotifyToken.accessToken, 50)
        const items = res.items || []
        const cutoff = Date.now() - 86400000
        const recent = items.filter(item => new Date(item.played_at).getTime() > cutoff)

        const seen = new Set()
        const deduped = []
        for (const item of recent) {
          if (!seen.has(item.track.id)) {
            seen.add(item.track.id)
            deduped.push(item)
          }
        }

        setRecentTracks(deduped)
      } catch (err) {
        console.error('Failed to fetch recently played:', err)
      } finally {
        setRecentLoading(false)
      }
    }
  }, [useLastfm, lastfmUser, spotifyToken])

  const handleShare = async () => {
    if (!currentSong) return
    if (!lastfmUser && !spotifyUser) return

    setLoading(true)
    try {
      await createBroadcast({
        spotify_user_id: lastfmUser?.name || spotifyUser?.id,
        display_name: lastfmUser?.realname || lastfmUser?.name || spotifyUser?.display_name || 'Anonymous',
        avatar_url: lastfmUser?.image?.[2]?.['#text'] || spotifyUser?.images?.[0]?.url || null,
        situation_label: 'vibing',
        current_song_name: currentSong.songName,
        current_song_artist: currentSong.artist,
        current_song_art: currentSong.albumArt,
        current_song_uri: currentSong.uri || currentSong.trackUrl,
        is_live: true,
      })

      setShareSuccess(true)
      setTimeout(() => setShareSuccess(false), 2000)
    } catch (err) {
      console.error('Failed to share:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-full flex flex-col bg-bg-primary overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <button
          onClick={onBack}
          className="text-text-secondary hover:text-text-primary transition-colors text-sm"
        >
          ← Back
        </button>
        <h1 className="text-xl font-serif text-text-primary">Live</h1>
        <div className="w-10" />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-2xl mx-auto">
          {!hasAuth ? (
            <div className="bg-surface rounded-lg p-8 text-center border border-border">
              <h2 className="text-lg font-medium text-text-primary mb-2">
                Connect Last.fm
              </h2>
              <p className="text-text-secondary text-sm">
                Connect your Last.fm account to see your live listening activity.
              </p>
            </div>
          ) : (
            <>
              {/* Currently Playing / Last Played */}
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-text-secondary mb-3">
                  {nowPlayingLabel}
                </h2>
                {currentSong ? (
                  <div className="bg-surface rounded-lg p-4 flex gap-4 border border-border">
                    {currentSong.albumArt && (
                      <img
                        src={currentSong.albumArt}
                        alt={currentSong.songName}
                        className="w-16 h-16 rounded flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                      <p className="font-medium text-text-primary truncate">
                        {currentSong.songName}
                      </p>
                      <p className="text-sm text-text-secondary truncate">{currentSong.artist}</p>
                      <p className="text-xs text-text-muted mt-1">
                        {currentSong.isPlaying ? '🎵 Playing' : 'Last played'}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0 justify-center">
                      {(currentSong.trackUrl || currentSong.raw?.item?.external_urls?.spotify) && (
                        <a
                          href={currentSong.trackUrl || currentSong.raw?.item?.external_urls?.spotify}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center hover:bg-accent/30 transition-colors"
                          title={useLastfm ? 'Open in Last.fm' : 'Open in Spotify'}
                        >
                          <svg className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3m-2 16H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7z"/>
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-surface rounded-lg p-4 text-center text-text-secondary border border-border">
                    Play a song to see it here
                  </div>
                )}

                {BROADCASTS_ENABLED && currentSong && (
                  <button
                    onClick={handleShare}
                    disabled={loading || shareSuccess}
                    className="mt-3 w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-all bg-accent/10 hover:bg-accent/20 text-accent-light border border-accent/30 disabled:opacity-50"
                  >
                    {shareSuccess ? '✓ Shared to community' : loading ? 'Sharing...' : 'Share what I\'m listening to'}
                  </button>
                )}
              </div>

              {/* My Recent Listens */}
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-text-secondary mb-3">
                  My Last 24 Hours
                </h2>
                {recentLoading ? (
                  <p className="text-text-muted text-sm py-4 text-center">Loading recent listens...</p>
                ) : recentTracks.length === 0 ? (
                  <p className="text-text-muted text-sm py-4 text-center">No recent listens found</p>
                ) : (
                  <div className="space-y-2">
                    {recentTracks.map((item, index) => (
                      <RecentTrackCard
                        key={item.track.id + item.played_at}
                        item={item}
                        index={index}
                        isPlaying={playingPreviewId === item.track.id}
                        onPlay={() => setPlayingPreviewId(item.track.id)}
                        onStop={() => setPlayingPreviewId(null)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Community Feed */}
              {BROADCASTS_ENABLED && (
                <div className="pb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-text-muted text-xs font-mono uppercase tracking-widest">Community</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <LiveFeed spotifyToken={spotifyToken} spotifyUser={spotifyUser} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}
