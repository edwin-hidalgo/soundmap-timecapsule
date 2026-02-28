import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import TrackRow from './TrackRow.jsx'
import { formatDuration, formatDateRange } from '../utils/formatters.js'

/**
 * CapsulePanel — slide-out detail panel (right side)
 *
 * Props:
 *   country: null | CountryStats object
 *   onClose(): void
 */
export default function CapsulePanel({ country, onClose }) {
  const [trackTab, setTrackTab] = useState('top') // 'top' | 'dna'

  // Escape key listener
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <AnimatePresence>
      {country && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="absolute top-0 right-0 h-full w-[400px] max-w-full glass-panel z-20 overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition-colors text-xl"
            >
              ×
            </button>

            {/* Country header */}
            <h2 className="font-serif text-3xl text-text-primary mb-1">{country.name}</h2>
            <p className="text-text-secondary text-sm mb-4">
              {formatDateRange(country.dateStart, country.dateEnd)}
            </p>

            {/* Stats row */}
            <div className="flex gap-6 my-4 p-3 rounded bg-white/5">
              <div>
                <p className="text-text-secondary text-xs uppercase tracking-wide">Plays</p>
                <p className="font-mono-stat text-accent text-sm">{country.trackCount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-text-secondary text-xs uppercase tracking-wide">Time</p>
                <p className="font-mono-stat text-accent text-sm">{formatDuration(country.totalMsPlayed)}</p>
              </div>
            </div>

            {/* Tracks section with tab toggle */}
            <div className="mt-6">
              <div className="flex gap-2 mb-3 border-b border-text-secondary/20">
                <button
                  onClick={() => setTrackTab('top')}
                  className={`px-3 py-2 text-sm font-medium transition-colors relative ${
                    trackTab === 'top'
                      ? 'text-text-primary'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Top Plays
                  {trackTab === 'top' && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </button>
                <button
                  onClick={() => setTrackTab('dna')}
                  className={`px-3 py-2 text-sm font-medium transition-colors relative ${
                    trackTab === 'dna'
                      ? 'text-text-primary'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Trip DNA
                  {trackTab === 'dna' && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </button>
              </div>

              {trackTab === 'top' &&
                country.topTracks.map((track, i) => (
                  <TrackRow key={track.spotifyTrackUri || i} track={track} rank={i + 1} index={i} />
                ))}

              {trackTab === 'dna' &&
                country.topTracksByConcentration.map((track, i) => (
                  <TrackRow key={track.spotifyTrackUri || i} track={track} rank={i + 1} index={i} />
                ))}
            </div>

            {/* Top Artists */}
            {country.topArtists.length > 0 && (
              <div className="mt-6">
                <h3 className="font-serif text-lg text-text-primary mb-3">Top Artists</h3>
                <div className="flex flex-wrap gap-2">
                  {country.topArtists.map((artist) => (
                    <span
                      key={artist.artistName}
                      className="px-3 py-1 bg-accent/20 text-accent text-xs rounded-full border border-accent/30"
                    >
                      {artist.artistName}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
