import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

function relativeTime(iso) {
  const mins = Math.floor((Date.now() - new Date(iso)) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function RecentTrackCard({ item, index, isPlaying, onPlay, onStop }) {
  const audioRef = useRef(null)
  const track = item.track
  const artistName = track.artists?.[0]?.name || 'Unknown'
  const albumArt = track.album?.images?.[1]?.url || track.album?.images?.[0]?.url
  const spotifyUrl = track.external_urls?.spotify
  const previewUrl = track.preview_url

  // Pause when another card starts playing
  useEffect(() => {
    if (!isPlaying && audioRef.current) {
      audioRef.current.pause()
    }
  }, [isPlaying])

  function togglePreview() {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      onStop()
    } else {
      audioRef.current.play()
      onPlay()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="flex items-center gap-3 p-3 rounded-lg bg-surface border border-border"
    >
      {/* Album art */}
      {albumArt ? (
        <img src={albumArt} alt={track.name} className="w-12 h-12 rounded flex-shrink-0" />
      ) : (
        <div className="w-12 h-12 rounded bg-border flex-shrink-0" />
      )}

      {/* Track info */}
      <div className="flex-1 min-w-0">
        <p className="text-text-primary text-sm font-medium truncate">{track.name}</p>
        <p className="text-text-muted text-xs truncate">{artistName}</p>
        <p className="text-text-muted text-[10px] mt-0.5">{relativeTime(item.played_at)}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Audio preview */}
        {previewUrl && (
          <>
            <audio ref={audioRef} src={previewUrl} onEnded={onStop} />
            <button
              onClick={togglePreview}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors ${
                isPlaying
                  ? 'bg-accent text-bg-primary'
                  : 'bg-surface-hover text-text-secondary hover:text-text-primary'
              }`}
              title={isPlaying ? 'Pause preview' : 'Play 30s preview'}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
          </>
        )}

        {/* Spotify link */}
        {spotifyUrl && (
          <a
            href={spotifyUrl}
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
    </motion.div>
  )
}
