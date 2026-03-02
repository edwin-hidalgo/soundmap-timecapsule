import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { groupByDay } from '../utils/timelineUtils.js'
import { formatDuration } from '../utils/formatters.js'

/**
 * ActivityCalendar — GitHub-style contribution heatmap
 *
 * Props:
 *   allEntries: Array of streaming history entries
 *   onBack(): void — return to previous view
 */
export default function ActivityCalendar({ allEntries, onBack }) {
  const [hoveredDate, setHoveredDate] = useState(null)
  const [tooltipPos, setTooltipPos] = useState(null)

  // Group entries by day
  const dayData = useMemo(() => groupByDay(allEntries), [allEntries])

  // Get date range
  const dateRange = useMemo(() => {
    if (dayData.size === 0) return { start: null, end: null }
    const dates = Array.from(dayData.keys()).sort()
    return {
      start: new Date(dates[0]),
      end: new Date(dates[dates.length - 1]),
    }
  }, [dayData])

  // Calculate color intensity for each day
  // Find max ms_played to scale colors
  const maxMsPlayed = useMemo(() => {
    let max = 0
    for (const day of dayData.values()) {
      if (day.msPlayed > max) max = day.msPlayed
    }
    return max || 1
  }, [dayData])

  // Get color based on intensity (5 tiers)
  const getColorClass = (dateStr) => {
    const day = dayData.get(dateStr)
    if (!day) return 'bg-white/5' // no data

    const intensity = day.msPlayed / maxMsPlayed
    if (intensity >= 0.8) return 'bg-accent' // 80-100% → full gold
    if (intensity >= 0.6) return 'bg-accent/80' // 60-80%
    if (intensity >= 0.4) return 'bg-accent/60' // 40-60%
    if (intensity >= 0.2) return 'bg-accent/40' // 20-40%
    return 'bg-accent/20' // 0-20%
  }

  if (dateRange.start === null) {
    return (
      <motion.div
        key="activity-calendar"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full h-full bg-gradient-to-br from-bg-primary to-bg-secondary overflow-auto"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={onBack}
              className="text-text-secondary hover:text-text-primary transition-colors text-sm"
            >
              ← Back
            </button>
            <h1 className="font-serif text-3xl text-text-primary">Your Listening Activity</h1>
          </div>
          <p className="text-text-secondary text-center py-8">No activity data to display.</p>
        </div>
      </motion.div>
    )
  }

  // Generate grid: weeks from start date to end date
  // Each week is Sunday-Saturday
  const start = new Date(dateRange.start)
  start.setDate(start.getDate() - start.getDay()) // move to start of week (Sunday)

  const weeks = []
  let currentWeekStart = new Date(start)

  while (currentWeekStart <= dateRange.end) {
    const week = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart)
      date.setDate(date.getDate() + i)
      week.push(date)
    }
    weeks.push(week)
    currentWeekStart.setDate(currentWeekStart.getDate() + 7)
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
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

  // Get month headers for the grid
  const monthHeaders = useMemo(() => {
    const headers = []
    let lastMonth = -1

    for (const week of weeks) {
      for (const date of week) {
        const month = date.getMonth()
        if (month !== lastMonth && date.getDate() <= 7) {
          // Start of a new month
          headers.push({
            month: monthNames[month],
            weekIndex: weeks.indexOf(week),
            offset: week.indexOf(date),
          })
          lastMonth = month
        }
      }
    }

    return headers
  }, [weeks])

  return (
    <motion.div
      key="activity-calendar"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full h-full bg-gradient-to-br from-bg-primary to-bg-secondary overflow-auto"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="text-text-secondary hover:text-text-primary transition-colors text-sm"
          >
            ← Back
          </button>
          <div className="text-right">
            <h1 className="font-serif text-3xl text-text-primary mb-2">Your Listening Activity</h1>
            <p className="text-text-secondary text-sm">
              {dateRange.start.getFullYear()} — {dayData.size} days of listening
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 sm:gap-4 mb-8 text-xs text-text-secondary">
          <span>Less</span>
          <div className="flex gap-0.5 sm:gap-1">
            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-xs bg-accent/20" />
            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-xs bg-accent/40" />
            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-xs bg-accent/60" />
            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-xs bg-accent/80" />
            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-xs bg-accent" />
          </div>
          <span>More</span>
        </div>

        {/* Calendar Grid */}
        <div className="relative">
          <div className="overflow-x-auto pb-4">
            <div className="inline-block">
              {/* Month header row */}
              <div className="flex mb-1">
                <div className="w-6 sm:w-8" /> {/* space for day labels */}
                {monthHeaders.map((header, i) => (
                  <div
                    key={i}
                    className="text-xs text-text-secondary font-medium"
                    style={{
                      width: `${(header.offset + 1) * 14}px`,
                      paddingLeft: `${header.offset * 14}px`,
                    }}
                  >
                    {header.month}
                  </div>
                ))}
              </div>

              {/* Day labels + grid */}
              <div className="flex gap-0.5 sm:gap-1">
                {/* Day name column */}
                <div className="flex flex-col gap-0.5 sm:gap-1">
                  {dayNames.map((day, i) => (
                    <div
                      key={day}
                      className="w-6 sm:w-8 h-2 sm:h-3 flex items-center justify-center text-xs text-text-secondary font-medium"
                    >
                      {day.slice(0, 1)}
                    </div>
                  ))}
                </div>

                {/* Weeks grid */}
                <div className="flex gap-0.5 sm:gap-1">
                  {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="flex flex-col gap-0.5 sm:gap-1">
                      {week.map((date, dayIndex) => {
                        const dateStr = date.toISOString().split('T')[0]
                        const day = dayData.get(dateStr)
                        const isHovered = hoveredDate === dateStr

                        return (
                          <motion.div
                            key={dateStr}
                            className={`w-2 h-2 sm:w-3 sm:h-3 rounded-xs cursor-pointer transition-all relative ${getColorClass(
                              dateStr
                            )} ${isHovered ? 'ring-2 ring-accent' : ''}`}
                            onMouseEnter={(e) => {
                              setHoveredDate(dateStr)
                              const rect = e.currentTarget.getBoundingClientRect()
                              setTooltipPos({
                                top: rect.top - 60,
                                left: rect.left - 50,
                              })
                            }}
                            onMouseLeave={() => {
                              setHoveredDate(null)
                              setTooltipPos(null)
                            }}
                            whileHover={{ scale: 1.3 }}
                          />
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tooltip - positioned relative to the calendar container */}
          {hoveredDate && dayData.has(hoveredDate) && tooltipPos && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed z-50 p-3 rounded-lg bg-white/10 backdrop-blur border border-accent/50 min-w-48 sm:min-w-56 pointer-events-none"
              style={{
                top: `${tooltipPos.top}px`,
                left: `${tooltipPos.left}px`,
              }}
            >
              <p className="text-text-secondary text-xs uppercase tracking-wide mb-2">
                {new Date(hoveredDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <p className="font-mono-stat text-accent text-sm mb-3">
                {formatDuration(dayData.get(hoveredDate).msPlayed)}
              </p>

              {dayData.get(hoveredDate).tracks.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-text-secondary text-xs font-medium">Top Tracks:</p>
                  {dayData.get(hoveredDate).tracks.map((track, i) => (
                    <div key={i} className="text-text-primary text-xs">
                      <p className="font-medium truncate">{track.name}</p>
                      <p className="text-text-secondary text-xs truncate">{track.artist}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-secondary text-xs">No tracks recorded</p>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
