import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getCurrentlyPlaying, getRecentlyPlayed } from '../utils/spotifyAPI.js'
import { createBroadcast } from '../utils/supabase.js'
import RecentTrackCard from './RecentTrackCard.jsx'
import LiveFeed from './LiveFeed.jsx'

export default function BroadcastScreen({
  spotifyToken,
  spotifyUser,
  onBack,
  onNavigateToBroadcast,
}) {
  const [currentSong, setCurrentSong] = useState(null)
  const [recentTracks, setRecentTracks] = useState([])
  const [recentLoading, setRecentLoading] = useState(true)
  const [playingPreviewId, setPlayingPreviewId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [shareSuccess, setShareSuccess] = useState(false)

  // Poll for currently playing song
  useEffect(() => {
    if (!spotifyToken) return

    const fetchCurrentSong = async () => {
      try {
        const song = await getCurrentlyPlaying(spotifyToken.accessToken)
        setCurrentSong(song)
      } catch (err) {
        console.error('Error fetching current song:', err)
      }
    }

    fetchCurrentSong()
    const interval = setInterval(fetchCurrentSong, 30000)
    return () => clearInterval(interval)
  }, [spotifyToken])

  // Fetch recently played tracks (once on mount)
  useEffect(() => {
    if (!spotifyToken?.accessToken) return

    const fetchRecent = async () => {
      try {
        const res = await getRecentlyPlayed(spotifyToken.accessToken, 50)
        const items = res.items || []

        // Filter to last 24 hours
        const cutoff = Date.now() - 86400000
        const recent = items.filter(item => new Date(item.played_at).getTime() > cutoff)

        // Deduplicate by track ID, keeping most recent play
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

    fetchRecent()
  }, [spotifyToken])

  // Share current song to community feed
  const handleShare = async () => {
    if (!spotifyToken || !spotifyUser || !currentSong) return

    setLoading(true)
    try {
      await createBroadcast({
        spotify_user_id: spotifyUser.id,
        display_name: spotifyUser.display_name || 'Anonymous',
        avatar_url: spotifyUser.images?.[0]?.url || null,
        situation_label: 'vibing',
        current_song_name: currentSong.songName,
        current_song_artist: currentSong.artist,
        current_song_art: currentSong.albumArt,
        current_song_uri: currentSong.uri,
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
          {!spotifyUser ? (
            <div className="bg-surface rounded-lg p-8 text-center border border-border">
              <h2 className="text-lg font-medium text-text-primary mb-2">
                Connect Spotify
              </h2>
              <p className="text-text-secondary text-sm">
                Connect your Spotify account to see your live listening activity.
              </p>
            </div>
          ) : (
            <>
              {/* Currently Playing */}
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-text-secondary mb-3">
                  Now Playing
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
                        {currentSong.isPlaying ? '🎵 Playing' : 'Paused'}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0 justify-center">
                      {/* Open in Spotify */}
                      {currentSong.raw?.item?.external_urls?.spotify && (
                        <a
                          href={currentSong.raw.item.external_urls.spotify}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 rounded-full bg-[#1DB954]/20 flex items-center justify-center hover:bg-[#1DB954]/30 transition-colors"
                          title="Open in Spotify"
                        >
                          <svg className="w-4 h-4 text-[#1DB954]" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-surface rounded-lg p-4 text-center text-text-secondary border border-border">
                    Play a song on Spotify to see it here
                  </div>
                )}

                {/* Share button */}
                {currentSong && (
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
              <div className="pb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-text-muted text-xs font-mono uppercase tracking-widest">Community</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <LiveFeed spotifyToken={spotifyToken} spotifyUser={spotifyUser} />
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}
