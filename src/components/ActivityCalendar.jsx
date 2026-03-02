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
  const [selectedDate, setSelectedDate] = useState(null)

  // Group entries by day
  const dayData = useMemo(() => groupByDay(allEntries), [allEntries])

  // Get date range with month buffers (show full months with at least 3 weeks of space)
  const dateRange = useMemo(() => {
    if (dayData.size === 0) return { start: null, end: null }
    const dates = Array.from(dayData.keys()).sort()
    const firstDate = new Date(dates[0])
    const lastDate = new Date(dates[dates.length - 1])

    // Helper: count how many "month weeks" (1-7, 8-14, 15-21, 22-28, 29-31) contain data
    const countWeeksWithData = (month, year) => {
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      const weekRanges = [
        [1, 7], [8, 14], [15, 21], [22, 28], [29, daysInMonth]
      ]
      let count = 0
      for (const [start, end] of weekRanges) {
        for (let day = start; day <= end; day++) {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          if (dayData.has(dateStr)) {
            count++
            break // Found data in this week, count it once
          }
        }
      }
      return count
    }

    // Round start to 1st of the month
    let bufferStart = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1)

    // If start month has < 3 weeks of data, extend back within the month
    const startMonth = firstDate.getMonth()
    const startYear = firstDate.getFullYear()
    let weeksInStartMonth = countWeeksWithData(startMonth, startYear)
    while (weeksInStartMonth < 3) {
      const currentDay = bufferStart.getDate()
      if (currentDay > 1) {
        bufferStart.setDate(currentDay - 7) // Go back one week
        weeksInStartMonth = countWeeksWithData(startMonth, startYear)
      } else {
        break // Can't go back further within the month
      }
    }

    // Round end to last day of the month
    let bufferEnd = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 0)

    // If end month has < 3 weeks of data, extend forward within the month
    const endMonth = lastDate.getMonth()
    const endYear = lastDate.getFullYear()
    const daysInEndMonth = bufferEnd.getDate()
    let weeksInEndMonth = countWeeksWithData(endMonth, endYear)
    while (weeksInEndMonth < 3) {
      const currentDay = bufferEnd.getDate()
      if (currentDay < daysInEndMonth) {
        bufferEnd.setDate(currentDay + 7) // Go forward one week
        if (bufferEnd.getDate() > daysInEndMonth) {
          bufferEnd.setDate(daysInEndMonth)
        }
        weeksInEndMonth = countWeeksWithData(endMonth, endYear)
      } else {
        break // Already at end of month
      }
    }

    return {
      start: bufferStart,
      end: bufferEnd,
    }
  }, [dayData])

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
    if (!day) return 'bg-white/5'
    const intensity = day.msPlayed / maxMsPlayed
    if (intensity >= 0.8) return 'bg-accent'
    if (intensity >= 0.6) return 'bg-accent/80'
    if (intensity >= 0.4) return 'bg-accent/60'
    if (intensity >= 0.2) return 'bg-accent/40'
    return 'bg-accent/20'
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

  // Generate grid: weeks from start date to end date (Sunday–Saturday)
  // Don't round back if it would include a different month (prevents overlap with previous month)
  const start = new Date(dateRange.start)
  const dayOfWeek = start.getDay()
  const prevSunday = new Date(start)
  prevSunday.setDate(prevSunday.getDate() - dayOfWeek)

  const weeks = []

  // Check if rounding back would go into a different month
  const wouldIncludePreviousMonth =
    prevSunday.getMonth() !== start.getMonth() ||
    prevSunday.getFullYear() !== start.getFullYear()

  if (wouldIncludePreviousMonth && dayOfWeek !== 0) {
    // Create first partial week with padding, starting from the target month
    const firstWeek = []
    // Add null placeholders for days before the month starts (Sunday-Thursday before the 1st)
    for (let i = 0; i < dayOfWeek; i++) {
      firstWeek.push(null)
    }
    // Add days from the target month's 1st to end of that week
    const daysInFirstWeek = 7 - dayOfWeek
    for (let i = 0; i < daysInFirstWeek; i++) {
      const date = new Date(start)
      date.setDate(date.getDate() + i)
      firstWeek.push(date)
    }
    weeks.push(firstWeek)

    // Continue with full weeks starting from the first Sunday in the month
    let currentWeekStart = new Date(start)
    currentWeekStart.setDate(currentWeekStart.getDate() + daysInFirstWeek)
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
  } else {
    // Safe to round back to previous Sunday
    start.setDate(start.getDate() - dayOfWeek)
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
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  // Build month and year headers using weekIndex for pixel-perfect CSS Grid alignment
  const { monthHeaders, yearHeaders } = useMemo(() => {
    const months = []
    const years = []
    const seenMonths = new Set()
    const seenYears = new Set()

    // Always seed with the first month/year at week 0
    if (weeks.length > 0) {
      // Find the first non-null date (handles partial weeks with null placeholders)
      let firstDate = null
      for (const week of weeks) {
        for (const date of week) {
          if (date !== null) {
            firstDate = date
            break
          }
        }
        if (firstDate) break
      }

      if (firstDate) {
        const m = firstDate.getMonth()
        const y = firstDate.getFullYear()
        months.push({ month: monthNames[m], weekIndex: 0 })
        seenMonths.add(`${y}-${m}`)
        years.push({ year: y, weekIndex: 0 })
        seenYears.add(`${y}`)
      }
    }

    for (let weekIdx = 0; weekIdx < weeks.length; weekIdx++) {
      for (const date of weeks[weekIdx]) {
        // Skip null placeholders from partial weeks
        if (date === null) continue

        const m = date.getMonth()
        const y = date.getFullYear()
        const mk = `${y}-${m}`
        const yk = `${y}`

        // New month: first time we see a date in days 1–7 of that month
        if (!seenMonths.has(mk) && date.getDate() <= 7) {
          months.push({ month: monthNames[m], weekIndex: weekIdx })
          seenMonths.add(mk)
        }

        // New year: first time we see January 1–7 of that year
        if (!seenYears.has(yk) && m === 0 && date.getDate() <= 7) {
          years.push({ year: y, weekIndex: weekIdx })
          seenYears.add(yk)
        }
      }
    }

    return { monthHeaders: months, yearHeaders: years }
  }, [weeks, monthNames])

  // Inline calendar grid JSX for a given cell size and label width.
  // IMPORTANT: Must be inlined (not a nested component) to preserve scroll position on hover.
  const renderCalendarGrid = (cellSize, labelWidth) => {
    const gap = 4
    return (
      <div className="overflow-x-auto">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `${labelWidth}px repeat(${weeks.length}, ${cellSize}px)`,
            gridTemplateRows: `auto repeat(7, ${cellSize}px) auto`,
            gap: `${gap}px`,
          }}
        >
          {/* Row 1: Month labels */}
          <div style={{ gridColumn: 1, gridRow: 1 }} />
          {monthHeaders.map((header, i) => (
            <div
              key={i}
              className="text-xs text-text-secondary font-medium truncate px-2 py-1"
              style={{
                gridColumn: `${header.weekIndex + 2} / ${(monthHeaders[i + 1]?.weekIndex ?? weeks.length) + 2}`,
                gridRow: 1,
              }}
            >
              {header.month}
            </div>
          ))}

          {/* Rows 2–8: Day name labels (column 1) */}
          {dayNames.map((day, dayIdx) => (
            <div
              key={day}
              className="text-xs text-text-secondary font-medium flex items-center justify-center"
              style={{
                gridColumn: 1,
                gridRow: dayIdx + 2,
                width: labelWidth,
                height: cellSize,
              }}
            >
              {day.slice(0, 1)}
            </div>
          ))}

          {/* Rows 2–8: Calendar cells */}
          {weeks.map((week, weekIdx) =>
            week.map((date, dayIdx) => {
              // Skip rendering null placeholders (used for padding in partial weeks)
              if (date === null) return null

              // Skip rendering cells from the first week if it's a partial week (cleanup for demo)
              if (weekIdx === 0 && weeks[0].some(d => d === null)) return null

              const dateStr = date.toISOString().split('T')[0]
              const isHovered = hoveredDate === dateStr
              const isSelected = selectedDate === dateStr
              return (
                <motion.div
                  key={dateStr}
                  className={`rounded-xs cursor-pointer transition-all ${getColorClass(dateStr)} ${
                    isSelected ? 'ring-2 ring-accent' : isHovered ? 'ring-2 ring-accent/50' : ''
                  }`}
                  style={{
                    gridColumn: weekIdx + 2,
                    gridRow: dayIdx + 2,
                    width: cellSize,
                    height: cellSize,
                  }}
                  onClick={() => setSelectedDate(selectedDate === dateStr ? null : dateStr)}
                  onMouseEnter={() => setHoveredDate(dateStr)}
                  onMouseLeave={() => setHoveredDate(null)}
                  whileHover={{ scale: 1.3 }}
                />
              )
            })
          )}

          {/* Row 9: Year labels */}
          <div style={{ gridColumn: 1, gridRow: 9 }} />
          {yearHeaders.map((header, i) => (
            <div
              key={i}
              className="text-xs text-text-secondary/60 font-medium truncate px-2 py-1"
              style={{
                gridColumn: `${header.weekIndex + 2} / ${(yearHeaders[i + 1]?.weekIndex ?? weeks.length) + 2}`,
                gridRow: 9,
              }}
            >
              {header.year}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const activeDate = selectedDate || hoveredDate

  const detailCard = activeDate && dayData.has(activeDate) ? (
    <div className="p-4 rounded-lg bg-white/5 border border-accent/30 backdrop-blur">
      <p className="text-text-secondary text-xs uppercase tracking-wide mb-2">
        {new Date(activeDate).toLocaleDateString('en-US', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        })}
      </p>
      <p className="font-mono-stat text-accent text-sm mb-3">
        {formatDuration(dayData.get(activeDate).msPlayed)}
      </p>
      {dayData.get(activeDate).tracks.length > 0 ? (
        <div className="space-y-2">
          <p className="text-text-secondary text-xs font-medium">Top Tracks:</p>
          {dayData.get(activeDate).tracks.map((track, i) => (
            <div key={i} className="text-text-primary text-xs">
              <p className="font-medium truncate">{track.name}</p>
              <p className="text-text-secondary text-xs truncate">{track.artist}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-text-secondary text-xs">No tracks recorded</p>
      )}
    </div>
  ) : (
    <div className="p-4 rounded-lg bg-accent/5 border border-accent/30 backdrop-blur">
      <div className="flex items-center gap-2.5 mb-3">
        <svg className="w-5 h-5 text-text-primary flex-shrink-0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="1.5"/>
          <path d="M3 10h18" strokeWidth="1.5"/>
          <path d="M8 2v4M16 2v4" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <h3 className="text-text-primary font-medium text-sm">Explore Your Listening Activity</h3>
      </div>
      <div className="space-y-3 text-xs text-text-secondary">
        <div className="flex items-start gap-2">
          <span className="text-accent font-bold flex-shrink-0">1.</span>
          <span><strong>Scroll the calendar</strong> — Drag left/right to see different months</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-accent font-bold flex-shrink-0">2.</span>
          <span><strong>Click a square</strong> — Tap any day to see your top tracks for that day</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-accent font-bold flex-shrink-0">3.</span>
          <span><strong>Watch the colors</strong> — Brighter gold = more listening that day</span>
        </div>
      </div>
    </div>
  )

  const legend = (
    <div className="flex items-center gap-2 sm:gap-4 text-xs text-text-secondary">
      <span>Less</span>
      <div className="flex gap-1 sm:gap-1.5">
        <div className="w-2.5 h-2.5 rounded-xs bg-accent/20" />
        <div className="w-2.5 h-2.5 rounded-xs bg-accent/40" />
        <div className="w-2.5 h-2.5 rounded-xs bg-accent/60" />
        <div className="w-2.5 h-2.5 rounded-xs bg-accent/80" />
        <div className="w-2.5 h-2.5 rounded-xs bg-accent" />
      </div>
      <span>More</span>
    </div>
  )

  return (
    <motion.div
      key="activity-calendar"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full h-full bg-gradient-to-br from-bg-primary to-bg-secondary flex flex-col"
    >
      {/* DESKTOP: Single scrollable column — header, calendar, details */}
      <div className="hidden md:flex md:flex-col md:flex-1 md:overflow-auto">
        {/* Header */}
        <div className="p-6 border-b border-accent/10 flex-shrink-0">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="text-text-secondary hover:text-text-primary transition-colors text-sm"
            >
              ← Back
            </button>
            <div className="text-right">
              <h1 className="font-serif text-3xl text-text-primary mb-1">Your Listening Activity</h1>
              <p className="text-text-secondary text-sm">
                {dateRange.start.getFullYear()} — {dayData.size} days of listening
              </p>
            </div>
          </div>
        </div>

        {/* Calendar — cellSize=10 (w-2.5), labelWidth=32 (w-8) */}
        <div className="p-6 border-b border-accent/10 flex-shrink-0">
          <div className="mb-4">{legend}</div>
          {renderCalendarGrid(10, 32)}
        </div>

        {/* Detail / Onboarding */}
        <div className="p-6 flex-shrink-0">
          {detailCard}
        </div>
      </div>

      {/* MOBILE: Scrollable top (header + legend + detail), fixed calendar at bottom */}
      <div className="md:hidden flex flex-col flex-1">
        {/* Scrollable top */}
        <div className="flex-1 overflow-auto p-4 sm:p-6">
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
          <div className="mb-4">{legend}</div>
          {detailCard}
        </div>

        {/* Fixed calendar at bottom — cellSize=16 (w-4), labelWidth=24 (w-6) */}
        <div className="flex-shrink-0 border-t border-accent/10 bg-gradient-to-t from-bg-primary/50 to-transparent p-4 sm:p-6">
          {renderCalendarGrid(16, 24)}
        </div>
      </div>
    </motion.div>
  )
}
