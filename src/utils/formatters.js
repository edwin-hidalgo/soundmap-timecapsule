/**
 * Formatting utilities for display values.
 */

/**
 * formatDuration
 * Converts milliseconds to human-readable string.
 * Examples:
 *   45_000_000 → "12h 30m"
 *   3_600_000  → "1h 0m"
 *   90_000     → "1m 30s"
 */
export function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1_000)
  const hours = Math.floor(totalSeconds / 3_600)
  const minutes = Math.floor((totalSeconds % 3_600) / 60)
  const seconds = totalSeconds % 60

  if (hours >= 1) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m ${seconds}s`
}

/**
 * formatDateRange
 * Converts two ISO timestamp strings to "Mon YYYY — Mon YYYY"
 * Example: ("2023-01-15T08:30:00Z", "2024-03-22T14:00:00Z") → "Jan 2023 — Mar 2024"
 * CRITICAL: timeZone: 'UTC' prevents midnight UTC timestamps from rolling to prior month
 */
export function formatDateRange(startTs, endTs) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
  return `${fmt.format(new Date(startTs))} — ${fmt.format(new Date(endTs))}`
}

/**
 * formatPlayCount
 * Formats a raw integer play count for display.
 * Example: 1234 → "1,234 plays"
 */
export function formatPlayCount(count) {
  const formatted = new Intl.NumberFormat('en-US').format(count)
  return `${formatted} plays`
}

/**
 * formatListeningHours
 * Converts milliseconds to decimal hours for the stats bar.
 * Example: 54_000_000 → "15.0 hrs"
 */
export function formatListeningHours(ms) {
  return `${(ms / 3_600_000).toFixed(1)} hrs`
}

/**
 * markerSize
 * Maps totalMsPlayed to a px size for CountryMarker (clamp 20–60).
 * Uses a square-root scale so the difference between
 * small and large listening countries isn't overwhelming.
 *
 * Example: given all countries' max totalMsPlayed as context,
 *   markerSize(countryMs, maxMs) → number between 20 and 60
 */
export function markerSize(countryMs, maxMs) {
  const MIN = 20
  const MAX = 60
  if (!maxMs || maxMs === 0) return MIN
  const ratio = Math.sqrt(countryMs / maxMs)
  return Math.round(MIN + ratio * (MAX - MIN))
}
