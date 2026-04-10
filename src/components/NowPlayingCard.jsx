import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getCurrentlyPlaying } from '../utils/spotifyAPI.js'

const POLL_INTERVAL = 30000 // 30 seconds

export default function NowPlayingCard({ spotifyToken }) {
  const [song, setSong] = useState(null)
  const [progress, setProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const progressTimer = useRef(null)

  // Poll Spotify for currently playing
  useEffect(() => {
    if (!spotifyToken?.accessToken) return

    const fetchSong = async () => {
      const data = await getCurrentlyPlaying(spotifyToken.accessToken)
      setSong(data)
      if (data) {
        setProgress(data.progressMs / data.durationMs)
      }
    }

    fetchSong()
    const interval = setInterval(fetchSong, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [spotifyToken])

  // Smooth progress bar interpolation between polls
  useEffect(() => {
    if (!song?.isPlaying || !song.durationMs) {
      if (progressTimer.current) clearInterval(progressTimer.current)
      return
    }

    progressTimer.current = setInterval(() => {
      setProgress(prev => {
        const increment = 1000 / song.durationMs
        const next = prev + increment
        return next >= 1 ? 1 : next
      })
    }, 1000)

    return () => {
      if (progressTimer.current) clearInterval(progressTimer.current)
    }
  }, [song?.isPlaying, song?.durationMs, song?.uri])

  if (!song) return null

  const formatTime = (ms) => {
    const totalSec = Math.floor(ms / 1000)
    const min = Math.floor(totalSec / 60)
    const sec = totalSec % 60
    return `${min}:${sec.toString().padStart(2, '0')}`
  }

  const currentMs = progress * (song.durationMs || 0)

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-full max-w-sm px-4"
        >
          <div className="glass-panel rounded-lg overflow-hidden">
            <div className="flex items-center gap-3 p-3">
              {/* Album Art */}
              {song.albumArt && (
                <img
                  src={song.albumArt}
                  alt={song.songName}
                  className="w-12 h-12 rounded-md flex-shrink-0"
                />
              )}

              {/* Song Info */}
              <div className="flex-1 min-w-0">
                <p className="text-text-primary text-sm font-medium truncate">
                  {song.songName}
                </p>
                <p className="text-text-secondary text-xs truncate">
                  {song.artist}
                </p>
              </div>

              {/* Status indicator */}
              <div className="flex-shrink-0 flex items-center gap-1.5">
                {song.isPlaying ? (
                  <div className="flex items-end gap-[2px] h-3">
                    <span className="w-[3px] bg-accent rounded-full animate-[barOne_0.8s_ease-in-out_infinite]" />
                    <span className="w-[3px] bg-accent rounded-full animate-[barTwo_0.8s_ease-in-out_infinite_0.2s]" />
                    <span className="w-[3px] bg-accent rounded-full animate-[barThree_0.8s_ease-in-out_infinite_0.4s]" />
                  </div>
                ) : (
                  <span className="text-text-muted text-xs">Paused</span>
                )}
              </div>

              {/* Dismiss */}
              <button
                onClick={() => setIsVisible(false)}
                className="text-text-muted hover:text-text-secondary text-xs transition-colors flex-shrink-0 ml-1"
              >
                ✕
              </button>
            </div>

            {/* Progress bar */}
            <div className="px-3 pb-2">
              <div className="h-[2px] bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-[width] duration-1000 linear"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-text-muted font-mono">
                  {formatTime(currentMs)}
                </span>
                <span className="text-[10px] text-text-muted font-mono">
                  {formatTime(song.durationMs)}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
