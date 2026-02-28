import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { detectEras, getYearStats } from '../utils/timelineUtils.js'
import { formatDuration, formatListeningHours } from '../utils/formatters.js'

/**
 * TimelineView — Screen for browsing music eras and year-by-year stats
 *
 * Props:
 *   allEntries: Array of streaming history entries
 *   onBack(): void — return to upload/map
 */
export default function TimelineView({ allEntries, onBack }) {
  const [mode, setMode] = useState('era') // 'era' | 'year'
  const [selectedYear, setSelectedYear] = useState(null)
  const [expandedEra, setExpandedEra] = useState(null)

  // Compute eras
  const eras = useMemo(() => detectEras(allEntries), [allEntries])

  // Get available years
  const availableYears = useMemo(() => {
    const years = new Set()
    for (const entry of allEntries) {
      const date = new Date(entry.ts)
      years.add(date.getFullYear())
    }
    return Array.from(years).sort((a, b) => b - a) // descending
  }, [allEntries])

  // Default year to most recent
  if (selectedYear === null && availableYears.length > 0) {
    setSelectedYear(availableYears[0])
  }

  // Get stats for selected year
  const yearStats = useMemo(() => {
    if (selectedYear === null) return null
    return getYearStats(allEntries, selectedYear)
  }, [allEntries, selectedYear])

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]

  return (
    <motion.div
      key="timeline"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full h-full relative bg-gradient-to-br from-bg-primary to-bg-secondary overflow-auto"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-b from-bg-primary to-transparent backdrop-blur-sm border-b border-white/5 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-serif text-3xl text-text-primary">Your Timeline</h1>
          <button
            onClick={onBack}
            className="text-text-secondary hover:text-text-primary transition-colors text-sm"
          >
            ← Back
          </button>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2 border-b border-text-secondary/20">
          <button
            onClick={() => setMode('era')}
            className={`px-3 py-2 text-sm font-medium transition-colors relative ${
              mode === 'era' ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Eras
            {mode === 'era' && (
              <motion.div
                layoutId="timeline-mode-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </button>
          <button
            onClick={() => setMode('year')}
            className={`px-3 py-2 text-sm font-medium transition-colors relative ${
              mode === 'year' ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Year Review
            {mode === 'year' && (
              <motion.div
                layoutId="timeline-mode-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-w-6xl mx-auto">
        {allEntries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-text-secondary text-lg text-center max-w-md mb-4">
              Upload your Extended Spotify Listening History to unlock Timeline features.
            </p>
            <p className="text-text-secondary text-sm text-center max-w-md">
              You'll see your musical eras, year-by-year reviews, and more.
            </p>
          </div>
        )}

        {allEntries.length > 0 && mode === 'era' && (
          <div>
            {eras.length === 0 ? (
              <p className="text-text-secondary text-center py-8">No distinct musical eras detected.</p>
            ) : (
              <div className="space-y-4">
                <p className="text-text-secondary text-sm mb-6">
                  {eras.length} distinct musical era{eras.length !== 1 ? 's' : ''} detected in your
                  history
                </p>

                {/* Eras in reverse chronological order */}
                {eras.map((era, i) => {
                  const startDate = new Date(era.startDate)
                  const endDate = new Date(era.endDate)
                  const startMonthStr = `${monthNames[startDate.getMonth()]} ${startDate.getFullYear()}`
                  const endMonthStr = `${monthNames[endDate.getMonth()]} ${endDate.getFullYear()}`

                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-4 rounded-lg bg-white/5 border border-accent/20 hover:border-accent/50 transition-all cursor-pointer"
                      onClick={() =>
                        setExpandedEra(expandedEra === i ? null : i)
                      }
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-serif text-xl text-text-primary">
                            {era.artist} Era
                          </h3>
                          <p className="text-text-secondary text-sm">
                            {startMonthStr} — {endMonthStr} ({era.monthCount} month
                            {era.monthCount !== 1 ? 's' : ''})
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono-stat text-accent text-lg">{era.playCount}</p>
                          <p className="text-text-secondary text-xs uppercase">Plays</p>
                        </div>
                      </div>

                      {expandedEra === i && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          transition={{ duration: 0.2 }}
                          className="mt-4 pt-4 border-t border-accent/20 text-sm text-text-secondary"
                        >
                          <p>
                            During this era, <strong>{era.artist}</strong> accounted for a
                            significant portion of your listening. You were really into them during
                            this time!
                          </p>
                        </motion.div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {allEntries.length > 0 && mode === 'year' && (
          <div>
            {/* Year picker */}
            <div className="mb-6">
              <label className="text-text-secondary text-sm uppercase tracking-wide block mb-2">
                Select Year
              </label>
              <select
                value={selectedYear || ''}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-4 py-2 rounded bg-white/10 border border-text-secondary/30 text-text-primary hover:border-accent/50 transition-all focus:outline-none focus:border-accent"
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {yearStats && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Main stats */}
                <div className="p-6 rounded-lg bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/30">
                  <h2 className="font-serif text-3xl text-text-primary mb-2">
                    Your {yearStats.year}
                  </h2>
                  <p className="text-text-secondary text-sm mb-6">A year in your listening</p>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div>
                      <p className="text-text-secondary text-xs uppercase tracking-wide">
                        Total Plays
                      </p>
                      <p className="font-mono-stat text-accent text-lg">
                        {yearStats.topTracks.reduce((sum, t) => sum + t.playCount, 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-text-secondary text-xs uppercase tracking-wide">
                        Hours Listened
                      </p>
                      <p className="font-mono-stat text-accent text-lg">
                        {formatListeningHours(yearStats.totalListeningMs)}
                      </p>
                    </div>
                    <div>
                      <p className="text-text-secondary text-xs uppercase tracking-wide">
                        Countries
                      </p>
                      <p className="font-mono-stat text-accent text-lg">
                        {yearStats.countriesVisited.size}
                      </p>
                    </div>
                    <div>
                      <p className="text-text-secondary text-xs uppercase tracking-wide">
                        Top Artists
                      </p>
                      <p className="font-mono-stat text-accent text-lg">
                        {yearStats.topArtists.length}
                      </p>
                    </div>
                  </div>

                  {/* Most active month */}
                  {yearStats.mostActiveMonth && (
                    <div className="text-sm text-text-secondary">
                      <span className="text-accent font-medium">
                        {monthNames[yearStats.mostActiveMonth.month]}
                      </span>{' '}
                      was your most active month with{' '}
                      <span className="text-accent font-medium">
                        {yearStats.mostActiveMonth.playCount}
                      </span>{' '}
                      plays
                    </div>
                  )}
                </div>

                {/* Top Tracks */}
                <div>
                  <h3 className="font-serif text-xl text-text-primary mb-4">Top Tracks</h3>
                  <div className="space-y-2">
                    {yearStats.topTracks.map((track, i) => (
                      <motion.div
                        key={track.spotifyTrackUri || i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-start gap-3 p-3 rounded bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <span className="text-accent font-mono-stat font-bold flex-shrink-0 w-6">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-text-primary font-medium truncate">
                            {track.trackName}
                          </p>
                          <p className="text-text-secondary text-xs truncate">
                            {track.artistName}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-mono-stat text-accent text-sm">{track.playCount}</p>
                          <p className="text-text-secondary text-xs">plays</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Top Artists */}
                {yearStats.topArtists.length > 0 && (
                  <div>
                    <h3 className="font-serif text-xl text-text-primary mb-4">Top Artists</h3>
                    <div className="flex flex-wrap gap-2">
                      {yearStats.topArtists.map((artist, i) => (
                        <motion.span
                          key={artist.artistName}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className="px-4 py-2 bg-accent/20 text-accent rounded-full border border-accent/30 font-medium text-sm"
                        >
                          {artist.artistName}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
