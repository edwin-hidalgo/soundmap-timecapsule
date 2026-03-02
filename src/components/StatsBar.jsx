import { motion } from 'framer-motion'
import { formatListeningHours, formatDateRange } from '../utils/formatters.js'

/**
 * StatsBar — floating top bar over the map with global stats
 *
 * Props:
 *   countryData: Object — keyed by country code
 *   onReset: function — called by "← Back" button
 *   onNavigateToTimeline: function — navigate to Timeline view
 *   onNavigateToActivity: function — navigate to Activity Calendar view
 */
export default function StatsBar({ countryData, onReset, onNavigateToTimeline, onNavigateToActivity }) {
  const countries = Object.values(countryData)
  const totalCountries = countries.length
  const totalPlays = countries.reduce((sum, c) => sum + c.trackCount, 0)
  const totalMs = countries.reduce((sum, c) => sum + c.totalMsPlayed, 0)
  const allDates = countries.flatMap(c => [c.dateStart, c.dateEnd]).sort()
  const dateRange = allDates.length >= 2
    ? formatDateRange(allDates[0], allDates[allDates.length - 1])
    : ''

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="absolute top-4 left-1/2 -translate-x-1/2 glass-panel rounded-full px-3 sm:px-6 py-2 sm:py-3 z-10 flex items-center gap-2 sm:gap-6 text-xs sm:text-sm"
    >
      <button
        onClick={onReset}
        className="text-text-secondary hover:text-text-primary transition-colors whitespace-nowrap"
      >
        ← Back
      </button>

      <div className="hidden sm:block w-px h-4 bg-text-secondary/30" />

      <button
        onClick={onNavigateToTimeline}
        className="text-text-secondary hover:text-text-primary transition-colors whitespace-nowrap"
      >
        Timeline
      </button>

      <button
        onClick={onNavigateToActivity}
        className="text-text-secondary hover:text-text-primary transition-colors whitespace-nowrap"
      >
        Activity
      </button>

      <div className="hidden sm:block w-px h-4 bg-text-secondary/30" />

      <div className="hidden sm:flex items-center gap-2 sm:gap-6">
        <StatItem label="Countries" value={totalCountries} />
        <StatItem label="Plays" value={totalPlays.toLocaleString()} />
        <StatItem label="Hours" value={formatListeningHours(totalMs)} />
      </div>
    </motion.div>
  )
}

function StatItem({ label, value }) {
  return (
    <div className="text-center">
      <p className="font-mono-stat text-text-primary text-sm whitespace-nowrap">{value}</p>
      <p className="text-text-secondary text-xs uppercase tracking-wide whitespace-nowrap">{label}</p>
    </div>
  )
}
