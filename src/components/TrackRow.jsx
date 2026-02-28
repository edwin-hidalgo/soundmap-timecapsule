import { motion } from 'framer-motion'

/**
 * TrackRow — single track in the CapsulePanel top-tracks list
 *
 * Props:
 *   track: { trackName, artistName, albumName, playCount, totalMsPlayed, spotifyTrackUri }
 *   rank: number (1-based)
 *   index: number (0-based, for stagger animation)
 */
export default function TrackRow({ track, rank, index }) {
  const trackId = track.spotifyTrackUri?.split(':')[2]
  const spotifyUrl = trackId ? `https://open.spotify.com/track/${trackId}` : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="flex items-center gap-3 py-2 border-b border-white/5 hover:bg-white/5 rounded px-1 -mx-1 transition-colors"
    >
      <span className="font-mono-stat text-text-secondary text-sm w-5 text-right shrink-0">{rank}</span>
      <div className="flex-1 min-w-0">
        {spotifyUrl ? (
          <a
            href={spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-primary text-sm truncate block hover:text-accent transition-colors"
          >
            {track.trackName}
          </a>
        ) : (
          <p className="text-text-primary text-sm truncate">{track.trackName}</p>
        )}
        <p className="text-text-secondary text-xs truncate">{track.artistName}</p>
      </div>
      <span className="font-mono-stat text-accent text-xs shrink-0">{track.playCount} plays</span>
    </motion.div>
  )
}
