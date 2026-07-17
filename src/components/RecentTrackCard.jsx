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

        {spotifyUrl && (
          <a
            href={spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center hover:bg-accent/30 transition-colors"
            title="Open track"
          >
            <svg className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3m-2 16H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7z"/>
            </svg>
          </a>
        )}
      </div>
    </motion.div>
  )
}
