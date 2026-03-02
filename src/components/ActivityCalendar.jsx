import { useState, useMemo, useRef } from 'react'
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
  const [scrollPos, setScrollPos] = useState(0)
  const [scrollWidth, setScrollWidth] = useState(0)
  const [containerWidth, setContainerWidth] = useState(0)
  const scrollContainerRef = useRef(null)

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
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <button
              onClick={onBack}
              className="text-text-secondary hover:text-text-primary transition-colors text-sm"
            >
              ← Back
            </button>
            <h1 className="font-serif text-2xl sm:text-3xl text-text-primary">Your Listening Activity</h1>
          </div>
          <p className="text-text-secondary text-center py-6 sm:py-8">No activity data to display.</p>
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

  // Track scroll position for scroll indicators
  const handleScroll = (e) => {
    const container = e.currentTarget
    setScrollPos(container.scrollLeft)
    setScrollWidth(container.scrollWidth)
    setContainerWidth(container.clientWidth)
  }

  // Calculate scroll progress (0-100%)
  const maxScroll = Math.max(0, scrollWidth - containerWidth)
  const scrollProgress = maxScroll > 0 ? (scrollPos / maxScroll) * 100 : 0
  const hasLeftScroll = scrollPos > 0
  const hasRightScroll = scrollPos < maxScroll - 10

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
      className="w-full h-full bg-gradient-to-br from-bg-primary to-bg-secondary flex flex-col"
    >
      {/* Top Section: Header, Legend, Detail Card — scrollable */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <button
              onClick={onBack}
              className="text-text-secondary hover:text-text-primary transition-colors text-sm"
            >
              ← Back
            </button>
            <div className="text-right">
              <h1 className="font-serif text-2xl sm:text-3xl text-text-primary mb-1 sm:mb-2">Your Listening Activity</h1>
              <p className="text-text-secondary text-xs sm:text-sm">
                {dateRange.start.getFullYear()} — {dayData.size} days of listening
              </p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 sm:gap-4 mb-4 text-xs text-text-secondary">
            <span className="text-xs">Less</span>
            <div className="flex gap-1 sm:gap-1.5">
              <div className="w-3 h-3 sm:w-2.5 sm:h-2.5 rounded-xs bg-accent/20" />
              <div className="w-3 h-3 sm:w-2.5 sm:h-2.5 rounded-xs bg-accent/40" />
              <div className="w-3 h-3 sm:w-2.5 sm:h-2.5 rounded-xs bg-accent/60" />
              <div className="w-3 h-3 sm:w-2.5 sm:h-2.5 rounded-xs bg-accent/80" />
              <div className="w-3 h-3 sm:w-2.5 sm:h-2.5 rounded-xs bg-accent" />
            </div>
            <span className="text-xs">More</span>
          </div>

          {/* Detail Card or Onboarding Guide */}
          {hoveredDate && dayData.has(hoveredDate) ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 rounded-lg bg-white/5 border border-accent/30 backdrop-blur"
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
          ) : (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 rounded-lg bg-accent/5 border border-accent/30 backdrop-blur"
            >
              <h3 className="text-text-primary font-medium text-sm mb-3">📅 Explore Your Listening Activity</h3>
              <div className="space-y-3 text-xs text-text-secondary">
                <div className="flex items-start gap-2">
                  <span className="text-accent font-bold">1.</span>
                  <span><strong>Scroll the calendar</strong> — Drag left/right to see different months</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-accent font-bold">2.</span>
                  <span><strong>Click a square</strong> — Tap any day to see your top tracks for that day</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-accent font-bold">3.</span>
                  <span><strong>Watch the colors</strong> — Brighter green = more listening that day</span>
                </div>
                <div className="pt-2 text-text-secondary/60 text-xs italic">
                  👇 Try clicking a square with bright colors to get started
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Bottom Section: Calendar Grid — fixed at bottom for thumb access */}
      <div className="flex-shrink-0 border-t border-accent/10 bg-gradient-to-t from-bg-primary/50 to-transparent p-4 sm:p-6">
        {/* Calendar Grid */}
        <div className="relative">
          <div className="overflow-x-auto" ref={scrollContainerRef} onScroll={handleScroll}>
            <div className="inline-block">
              {/* Month header row */}
              <div className="flex mb-1">
                <div className="w-6 sm:w-8" /> {/* space for day labels */}
                {monthHeaders.map((header, i) => (
                  <div
                    key={i}
                    className="text-xs text-text-secondary font-medium"
                    style={{
                      width: `${(header.offset + 1) * 20}px`,
                      paddingLeft: `${header.offset * 20}px`,
                    }}
                  >
                    {header.month}
                  </div>
                ))}
              </div>

              {/* Day labels + grid */}
              <div className="flex gap-1 sm:gap-1">
                {/* Day name column */}
                <div className="flex flex-col gap-1 sm:gap-1">
                  {dayNames.map((day, i) => (
                    <div
                      key={day}
                      className="w-6 sm:w-8 h-4 sm:h-2.5 flex items-center justify-center text-xs text-text-secondary font-medium"
                    >
                      {day.slice(0, 1)}
                    </div>
                  ))}
                </div>

                {/* Weeks grid */}
                <div className="flex gap-1 sm:gap-1">
                  {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="flex flex-col gap-1 sm:gap-1">
                      {week.map((date, dayIndex) => {
                        const dateStr = date.toISOString().split('T')[0]
                        const day = dayData.get(dateStr)
                        const isHovered = hoveredDate === dateStr

                        return (
                          <motion.div
                            key={dateStr}
                            className={`w-4 h-4 sm:w-2.5 sm:h-2.5 rounded-xs cursor-pointer transition-all relative ${getColorClass(
                              dateStr
                            )} ${isHovered ? 'ring-2 ring-accent' : ''}`}
                            onClick={() => setHoveredDate(dateStr)}
                            onMouseEnter={() => setHoveredDate(dateStr)}
                            onMouseLeave={() => setHoveredDate(null)}
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
        </div>

        {/* Scroll Indicators — positioned above calendar grid */}
        {scrollWidth > containerWidth && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="mt-3 flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 border border-accent/20"
          >
            {/* Left arrow indicator */}
            <motion.div
              initial={false}
              animate={{ opacity: hasLeftScroll ? 1 : 0.2 }}
              transition={{ duration: 0.2 }}
              className="text-text-secondary/40 text-sm"
            >
              ←
            </motion.div>

            {/* Progress bar */}
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-accent rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: `${scrollProgress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>

            {/* Right arrow indicator */}
            <motion.div
              initial={false}
              animate={{ opacity: hasRightScroll ? 1 : 0.2 }}
              transition={{ duration: 0.2 }}
              className="text-text-secondary/40 text-sm"
            >
              →
            </motion.div>

            {/* Scroll percentage indicator */}
            <span className="text-xs text-text-secondary/60 ml-2 whitespace-nowrap">
              {Math.round(scrollProgress)}%
            </span>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
