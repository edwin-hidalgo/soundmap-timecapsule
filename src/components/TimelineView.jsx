import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  detectEras,
  getYearStats,
  filterEntriesByWindow,
  classifyLifeStaples,
  computeTastePassport,
} from '../utils/timelineUtils.js'
import { formatListeningHours } from '../utils/formatters.js'

/**
 * TimelineView — Screen for browsing music eras and year-by-year stats
 *
 * Props:
 *   allEntries: Array of streaming history entries
 *   onBack(): void — return to upload/map
 */
export default function TimelineView({ allEntries, onBack }) {
  const [tab, setTab] = useState('eras') // 'eras' | 'year' | 'staples' | 'passport'
  const [selectedYear, setSelectedYear] = useState(null)
  const [expandedEra, setExpandedEra] = useState(null)
  const [timeWindow, setTimeWindow] = useState(Infinity) // days: 30, 90, 180, 365, 1095, Infinity. Default to all-time for time capsule app

  // Filter entries by time window
  const windowedEntries = useMemo(() => {
    return filterEntriesByWindow(allEntries, timeWindow)
  }, [allEntries, timeWindow])

  // Compute eras from windowed entries
  const eras = useMemo(() => detectEras(windowedEntries), [windowedEntries])

  // Get available years from ALL entries (Year Review is not windowed — it's a full-year view)
  const availableYears = useMemo(() => {
    const years = new Set()
    for (const entry of allEntries) {
      const date = new Date(entry.ts)
      years.add(date.getFullYear())
    }
    return Array.from(years).sort((a, b) => b - a) // descending
  }, [allEntries])

  // Set default year to most recent when availableYears changes
  // Also reset if selected year is no longer in available years
  useEffect(() => {
    if (availableYears.length > 0) {
      // Only update if current selected year is not in the list
      if (!availableYears.includes(selectedYear)) {
        setSelectedYear(availableYears[0])
      }
    } else {
      // No years available in this window
      setSelectedYear(null)
    }
  }, [availableYears, selectedYear])

  // Get stats for selected year — always uses allEntries (Year Review is per-year, not windowed)
  const yearStats = useMemo(() => {
    if (selectedYear === null) return null
    return getYearStats(allEntries, selectedYear)
  }, [allEntries, selectedYear])

  // Compute life staples from ALL-TIME entries (not windowed)
  const lifeStaples = useMemo(() => classifyLifeStaples(allEntries), [allEntries])

  // Compute taste passport from windowed entries
  const tastePassport = useMemo(() => computeTastePassport(windowedEntries), [windowedEntries])

  // Time window options
  const windowOptions = [
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 3 months', days: 90 },
    { label: 'Last 6 months', days: 180 },
    { label: 'Last 12 months', days: 365 },
    { label: 'Last 3 years', days: 1095 },
    { label: 'All-time', days: Infinity },
  ]

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

  // Helper to format era dates from "2019-01" to "Jan 2019"
  const formatEraDate = (dateStr) => {
    const [year, month] = dateStr.split('-')
    const monthIdx = parseInt(month) - 1
    return `${monthNames[monthIdx]} ${year}`
  }

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
      <div className="sticky top-0 z-10 bg-gradient-to-b from-bg-primary to-transparent backdrop-blur-sm border-b border-white/5 px-6 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-3xl text-text-primary">Your Timeline</h1>
          <button
            onClick={onBack}
            className="text-text-secondary hover:text-text-primary transition-colors text-sm"
          >
            ← Back
          </button>
        </div>

        {/* Time Window Selector — only show on tabs that respond to window changes */}
        {allEntries.length > 0 && (tab === 'eras' || tab === 'passport') && (
          <div className="flex gap-2 flex-wrap">
            {windowOptions.map((option) => (
              <button
                key={option.days}
                onClick={() => setTimeWindow(option.days)}
                className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                  timeWindow === option.days
                    ? 'bg-accent text-bg-primary'
                    : 'bg-white/10 text-text-secondary hover:bg-white/20'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}

        {/* Tab navigation */}
        {allEntries.length > 0 && (
          <div className="flex gap-2 border-b border-text-secondary/20">
            {['eras', 'year', 'staples', 'passport'].map((tabName) => {
              const labels = {
                eras: 'Eras',
                year: 'Year Review',
                staples: 'Life Staples',
                passport: 'Taste Passport',
              }
              return (
                <button
                  key={tabName}
                  onClick={() => setTab(tabName)}
                  className={`px-3 py-2 text-sm font-medium transition-colors relative ${
                    tab === tabName ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {labels[tabName]}
                  {tab === tabName && (
                    <motion.div
                      layoutId="timeline-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        )}
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

        {/* ERAS TAB */}
        {allEntries.length > 0 && tab === 'eras' && (
          <div>
            {eras.length === 0 ? (
              <p className="text-text-secondary text-center py-8">
                No distinct musical eras detected. Try selecting "All-time" to see your full history.
              </p>
            ) : (
              <div className="space-y-4">
                <p className="text-text-secondary text-sm mb-6">
                  {eras.length} distinct musical era{eras.length !== 1 ? 's' : ''} detected
                </p>

                {/* Eras in reverse chronological order */}
                {eras
                  .slice()
                  .reverse()
                  .map((era, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-5 rounded-lg bg-white/5 border border-accent/20 hover:border-accent/50 transition-all cursor-pointer"
                      onClick={() => setExpandedEra(expandedEra === i ? null : i)}
                    >
                      {/* Era header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-serif text-xl text-text-primary mb-1">{era.name}</h3>
                          <p className="text-text-secondary text-sm">
                            {formatEraDate(era.dateStart)} — {formatEraDate(era.dateEnd)} · {Math.round(era.durationMonths / 12)} years
                          </p>
                          <p className="text-text-secondary text-xs mt-2">{era.characterText}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-mono-stat text-accent text-lg">{era.totalPlays}</p>
                          <p className="text-text-secondary text-xs uppercase">Plays</p>
                        </div>
                      </div>

                      {/* Era expanded details */}
                      {expandedEra === i && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          transition={{ duration: 0.2 }}
                          className="mt-4 pt-4 border-t border-accent/20 space-y-4 text-sm"
                        >
                          {/* Top artists */}
                          <div>
                            <p className="text-text-secondary text-xs uppercase tracking-wide font-medium mb-2">
                              Top Artists
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {era.topArtists.slice(0, 5).map((artist, j) => (
                                <span
                                  key={j}
                                  className="px-3 py-1 bg-accent/20 text-accent text-xs rounded-full"
                                >
                                  {artist}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Key metrics */}
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <p className="text-text-secondary text-xs uppercase">Dominant</p>
                              <p className="font-mono-stat text-accent text-sm">
                                {era.dominantArtistShare}%
                              </p>
                            </div>
                            <div>
                              <p className="text-text-secondary text-xs uppercase">Discovery</p>
                              <p className="font-mono-stat text-accent text-sm">
                                {era.discoveryRate}/yr
                              </p>
                            </div>
                            <div>
                              <p className="text-text-secondary text-xs uppercase">Avg/Month</p>
                              <p className="font-mono-stat text-accent text-sm">
                                {era.avgPlaysPerMonth}
                              </p>
                            </div>
                          </div>

                          {/* Transition narrative */}
                          {(era.transitionFrom || era.transitionTo) && (
                            <div className="text-xs text-text-secondary italic">
                              {era.transitionFrom && (
                                <>Replaced <span className="text-text-primary">{era.transitionFrom}</span> · </>
                              )}
                              {era.transitionTo && (
                                <>Led to <span className="text-text-primary">{era.transitionTo}</span></>
                              )}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* YEAR REVIEW TAB */}
        {allEntries.length > 0 && tab === 'year' && (
          <div>
            {/* Year picker */}
            <div className="mb-6">
              <label className="text-text-secondary text-sm uppercase tracking-wide block mb-2">
                Select Year
              </label>
              <select
                value={selectedYear || ''}
                onChange={(e) => {
                  const y = parseInt(e.target.value)
                  if (!isNaN(y)) setSelectedYear(y)
                }}
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

        {/* LIFE STAPLES TAB */}
        {allEntries.length > 0 && tab === 'staples' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-2xl text-text-primary mb-2">Life Staples</h2>
              <p className="text-text-secondary text-sm">
                The songs you keep coming back to — tracks woven into your listening identity
              </p>
            </div>

            {/* Current Staples */}
            {lifeStaples.current.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="font-serif text-lg text-text-primary">
                    Current Staples ({lifeStaples.current.length})
                  </h3>
                  <span className="text-xs text-text-secondary/60">Still in rotation</span>
                </div>
                <div className="space-y-2">
                  {lifeStaples.current.slice(0, 10).map((track, i) => (
                    <motion.div
                      key={track.uri}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
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
                      <div className="text-right flex-shrink-0 text-xs">
                        <p className="text-accent font-mono-stat font-bold">{track.totalPlays}</p>
                        <p className="text-text-secondary">plays</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Dormant Staples */}
            {lifeStaples.dormant.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="font-serif text-lg text-text-primary">
                    Dormant ({lifeStaples.dormant.length})
                  </h3>
                  <span className="text-xs text-text-secondary/60">Faded but not forgotten</span>
                </div>
                <div className="space-y-2">
                  {lifeStaples.dormant.slice(0, 8).map((track, i) => (
                    <motion.div
                      key={track.uri}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="flex items-start gap-3 p-3 rounded bg-white/5 hover:bg-white/10 transition-colors opacity-75"
                    >
                      <span className="text-text-secondary font-mono-stat font-bold flex-shrink-0 w-6">
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
                      <div className="text-right flex-shrink-0 text-xs">
                        <p className="text-text-secondary font-mono-stat">{track.totalPlays}</p>
                        <p className="text-text-secondary">plays</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Archived Staples */}
            {lifeStaples.archived.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="font-serif text-lg text-text-primary">
                    Archived ({lifeStaples.archived.length})
                  </h3>
                  <span className="text-xs text-text-secondary/60">Haven't heard these in years</span>
                </div>
                <div className="space-y-2">
                  {lifeStaples.archived.slice(0, 8).map((track, i) => (
                    <motion.div
                      key={track.uri}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="flex items-start gap-3 p-3 rounded bg-white/5 hover:bg-white/10 transition-colors opacity-60"
                    >
                      <span className="text-text-secondary/50 font-mono-stat font-bold flex-shrink-0 w-6">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-text-secondary font-medium truncate">
                          {track.trackName}
                        </p>
                        <p className="text-text-secondary/70 text-xs truncate">
                          {track.artistName}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 text-xs">
                        <p className="text-text-secondary/70 font-mono-stat">{track.totalPlays}</p>
                        <p className="text-text-secondary/60">plays</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {lifeStaples.current.length === 0 &&
              lifeStaples.dormant.length === 0 &&
              lifeStaples.archived.length === 0 && (
                <p className="text-text-secondary text-center py-8">
                  No life staples (200+ plays) found in your history yet.
                </p>
              )}
          </div>
        )}

        {/* TASTE PASSPORT TAB */}
        {allEntries.length > 0 && tab === 'passport' && (
          <div className="space-y-6">
            <div className="p-6 rounded-lg bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/30">
              <h2 className="font-serif text-3xl text-text-primary mb-1">
                {tastePassport.archetype}
              </h2>
              <p className="text-text-secondary text-sm mb-6">{tastePassport.narrative}</p>

              {/* 5 dimension scores */}
              <div className="space-y-4">
                {[
                  { label: 'Explorer / Replayer', score: tastePassport.explorerScore },
                  { label: 'Loyalist / Drifter', score: tastePassport.loyalistScore },
                  { label: 'Night Owl / Day Listener', score: tastePassport.dayNightScore },
                  { label: 'Deep / Broad', score: tastePassport.depthScore },
                  { label: 'Taste Volatility', score: tastePassport.volatilityScore },
                ].map((dimension, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-text-secondary text-sm font-medium">{dimension.label}</p>
                      <p className="font-mono-stat text-accent text-sm">
                        {Math.round(dimension.score * 100)}%
                      </p>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${dimension.score * 100}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-accent to-accent/60 rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* All archetypes context */}
              <div className="mt-6 pt-4 border-t border-accent/20">
                <p className="text-text-secondary text-xs uppercase tracking-wide font-medium mb-3">
                  Your archetype
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Explorer-Curator',
                    'Focused Loyalist',
                    'Loyalist-Curator',
                    'Balanced Listener',
                  ].map((a) => (
                    <span
                      key={a}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                        a === tastePassport.archetype
                          ? 'bg-accent/20 text-accent border-accent/40'
                          : 'bg-white/5 text-text-secondary/40 border-white/10'
                      }`}
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
