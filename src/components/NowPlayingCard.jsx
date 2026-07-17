import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getCurrentlyPlaying } from '../utils/spotifyAPI.js'
import { getRecentTracks as getLastfmRecentTracks } from '../utils/lastfmAPI.js'

const POLL_INTERVAL = 30000

function lastfmImage(imageArr) {
  if (!imageArr || !Array.isArray(imageArr)) return null
  const large = imageArr.find(i => i.size === 'large') || imageArr.find(i => i.size === 'extralarge') || imageArr[0]
  const url = large?.['#text'] || null
  if (url && url.includes('2a96cbd8b46e442fc41c2b86b821562f')) return null
  return url
}

export default function NowPlayingCard({ spotifyToken, lastfmUser }) {
  const [song, setSong] = useState(null)
  const [progress, setProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [hasProgress, setHasProgress] = useState(false)
  const progressTimer = useRef(null)

  const useLastfm = !!lastfmUser?.name

  useEffect(() => {
    if (useLastfm) {
      fetchLastfm()
      const interval = setInterval(fetchLastfm, POLL_INTERVAL)
      return () => clearInterval(interval)
    } else if (spotifyToken?.accessToken) {
      fetchSpotify()
      const interval = setInterval(fetchSpotify, POLL_INTERVAL)
      return () => clearInterval(interval)
    }

    async function fetchLastfm() {
      try {
        const res = await getLastfmRecentTracks(lastfmUser.name, { limit: 1 })
        const tracks = res.track || []
        if (tracks.length > 0 && tracks[0]['@attr']?.nowplaying === 'true') {
          const track = tracks[0]
          setSong({
            songName: track.name,
            artist: track.artist?.name || track.artist?.['#text'] || 'Unknown',
            albumArt: lastfmImage(track.image),
            isPlaying: true,
          })
          setHasProgress(false)
        } else {
          setSong(null)
        }
      } catch (err) {
        console.error('Error fetching Last.fm now playing:', err)
      }
    }

    async function fetchSpotify() {
      const data = await getCurrentlyPlaying(spotifyToken.accessToken)
      setSong(data)
      if (data) {
        setProgress(data.progressMs / data.durationMs)
        setHasProgress(true)
      }
    }
  }, [useLastfm, lastfmUser, spotifyToken])

  // Smooth progress bar interpolation (Spotify only)
  useEffect(() => {
    if (!song?.isPlaying || !song.durationMs || !hasProgress) {
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
  }, [song?.isPlaying, song?.durationMs, song?.uri, hasProgress])

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
              {song.albumArt && (
                <img
                  src={song.albumArt}
                  alt={song.songName}
                  className="w-12 h-12 rounded-md flex-shrink-0"
                />
              )}

              <div className="flex-1 min-w-0">
                <p className="text-text-primary text-sm font-medium truncate">
                  {song.songName}
                </p>
                <p className="text-text-secondary text-xs truncate">
                  {song.artist}
                </p>
              </div>

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

              <button
                onClick={() => setIsVisible(false)}
                className="text-text-muted hover:text-text-secondary text-xs transition-colors flex-shrink-0 ml-1"
              >
                ✕
              </button>
            </div>

            {/* Progress bar — only shown for Spotify (has duration data) */}
            {hasProgress && song.durationMs && (
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
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
