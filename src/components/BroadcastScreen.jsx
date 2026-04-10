import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getCurrentlyPlaying } from '../utils/spotifyAPI.js'
import { createBroadcast, stopBroadcast } from '../utils/supabase.js'
import { generateNarration } from '../utils/claudeAPI.js'
import LiveFeed from './LiveFeed.jsx'

export default function BroadcastScreen({
  spotifyToken,
  spotifyUser,
  onBack,
  onNavigateToBroadcast,
}) {
  const [currentSong, setCurrentSong] = useState(null)
  const [situationLabel, setSituationLabel] = useState('')
  const [loading, setLoading] = useState(false)
  const [pollingInterval, setPollingInterval] = useState(null)
  const [dropSuccess, setDropSuccess] = useState(false)

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

    // Fetch immediately
    fetchCurrentSong()

    // Then poll every 30 seconds
    const interval = setInterval(fetchCurrentSong, 30000)
    setPollingInterval(interval)

    return () => clearInterval(interval)
  }, [spotifyToken])

  const handleDrop = async () => {
    if (!spotifyToken || !spotifyUser || !currentSong || !situationLabel.trim()) {
      alert('Please connect Spotify, ensure a song is playing, and add a situation label')
      return
    }

    setLoading(true)
    try {
      const broadcastData = {
        spotify_user_id: spotifyUser.id,
        display_name: spotifyUser.display_name || 'Anonymous',
        avatar_url: spotifyUser.images?.[0]?.url || null,
        situation_label: situationLabel,
        current_song_name: currentSong.songName,
        current_song_artist: currentSong.artist,
        current_song_art: currentSong.albumArt,
        current_song_uri: currentSong.uri,
        is_live: true, // Keep as true for compatibility; not used for filtering anymore
      }

      // Generate AI narration for the main character moment
      const narration = await generateNarration(situationLabel, currentSong.songName, currentSong.artist)
      broadcastData.ai_narration = narration

      await createBroadcast(broadcastData)

      // Show success feedback
      setDropSuccess(true)
      setSituationLabel('')

      // Clear success message after 2 seconds
      setTimeout(() => setDropSuccess(false), 2000)
    } catch (err) {
      console.error('Failed to drop moment:', err)
      alert('Failed to drop your moment. Please try again.')
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
      <div className="flex items-center justify-between px-6 py-4 border-b border-border-secondary">
        <button
          onClick={onBack}
          className="text-text-secondary hover:text-text-primary transition"
        >
          ← Back
        </button>
        <h1 className="text-xl font-semibold text-text-primary">Main Character</h1>
        <div className="w-10" />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Broadcast Form */}
        <div className="p-6 max-w-2xl mx-auto">
          {!spotifyUser ? (
            <div className="bg-surface-secondary rounded-lg p-8 text-center">
              <h2 className="text-lg font-semibold text-text-primary mb-2">
                Connect Spotify to Broadcast
              </h2>
              <p className="text-text-secondary mb-4">
                You need to connect your Spotify account to share what you're listening to.
              </p>
              <p className="text-sm text-text-tertiary">
                Use the Spotify connect button on the map screen to get started.
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
                  <div className="bg-surface-secondary rounded-lg p-4 flex gap-4">
                    {currentSong.albumArt && (
                      <img
                        src={currentSong.albumArt}
                        alt={currentSong.songName}
                        className="w-20 h-20 rounded"
                      />
                    )}
                    <div className="flex-1 flex flex-col justify-center">
                      <p className="font-semibold text-text-primary">
                        {currentSong.songName}
                      </p>
                      <p className="text-sm text-text-secondary">{currentSong.artist}</p>
                      <p className="text-xs text-text-tertiary mt-2">
                        {currentSong.isPlaying ? '🎵 Playing' : 'Paused'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-surface-secondary rounded-lg p-4 text-center text-text-secondary">
                    Start playing a song on Spotify to broadcast
                  </div>
                )}
              </div>

              {/* Situation Label Input */}
              <div className="mb-6">
                <label className="text-sm font-semibold text-text-secondary block mb-2">
                  What's your situation? 🎬
                </label>
                <input
                  type="text"
                  value={situationLabel}
                  onChange={(e) => setSituationLabel(e.target.value)}
                  placeholder="e.g., at the gym, about to break up, cooking alone at 2am"
                  className="w-full px-4 py-2 rounded-lg bg-surface-secondary text-text-primary placeholder-text-tertiary border border-border-secondary focus:outline-none focus:border-primary"
                />
              </div>

              {/* Drop Button */}
              <button
                onClick={handleDrop}
                disabled={loading}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition bg-primary hover:bg-primary-hover text-white disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? '✍️ Writing your moment...' : '📍 Drop'}
              </button>

              {/* Drop Success Feedback */}
              {dropSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg"
                >
                  <p className="text-sm text-green-400">
                    ✓ Moment dropped! Check it out in the feed below.
                  </p>
                </motion.div>
              )}
            </>
          )}
        </div>

        {/* Live Feed Section */}
        {spotifyUser && (
          <div className="px-6 pb-6 max-w-2xl mx-auto w-full">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Live Feed</h2>
            <LiveFeed spotifyToken={spotifyToken} spotifyUser={spotifyUser} />
          </div>
        )}
      </div>
    </motion.div>
  )
}
