/**
 * timelineUtils.js — Utilities for Timeline View (Eras + Year Review)
 */

/**
 * detectEras
 * Finds distinct "eras" in listening history based on dominant artist patterns.
 * An era is detected when an artist has >20% share of plays across a 3-month rolling window.
 *
 * Returns: Array<{ artist, startDate, endDate, playCount, monthCount }>
 *   startDate, endDate are ISO strings (first day of month and last day of month)
 *   monthCount is the duration in months
 */
export function detectEras(allEntries) {
  if (allEntries.length === 0) return []

  // Group by artist and month
  const artistByMonth = new Map() // "artist||YYYY-MM" -> count

  for (const entry of allEntries) {
    const date = new Date(entry.ts)
    const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const artist = entry.master_metadata_album_artist_name

    const key = `${artist}||${yearMonth}`
    artistByMonth.set(key, (artistByMonth.get(key) || 0) + 1)
  }

  // Get all unique months
  const allMonths = new Set()
  for (const key of artistByMonth.keys()) {
    const [, yearMonth] = key.split('||')
    allMonths.add(yearMonth)
  }
  const sortedMonths = Array.from(allMonths).sort()

  // For each month, find dominant artist
  const dominantByMonth = new Map() // "YYYY-MM" -> { artist, playCount }

  for (const yearMonth of sortedMonths) {
    let maxCount = 0
    let dominantArtist = null

    // Get all artists in this month
    const artistCounts = new Map()
    for (const key of artistByMonth.keys()) {
      if (key.endsWith(yearMonth)) {
        const [artist, ym] = key.split('||')
        if (ym === yearMonth) {
          const count = artistByMonth.get(key)
          artistCounts.set(artist, count)
          if (count > maxCount) {
            maxCount = count
            dominantArtist = artist
          }
        }
      }
    }

    // Calculate total plays in this month
    let totalInMonth = 0
    for (const count of artistCounts.values()) {
      totalInMonth += count
    }

    // Only mark as dominant if >20% share
    if (dominantArtist && totalInMonth > 0 && maxCount / totalInMonth > 0.2) {
      dominantByMonth.set(yearMonth, { artist: dominantArtist, playCount: maxCount })
    }
  }

  // Group consecutive months with same dominant artist
  const eras = []
  let currentEra = null

  for (const yearMonth of sortedMonths) {
    const dominant = dominantByMonth.get(yearMonth)

    if (dominant && (!currentEra || currentEra.artist === dominant.artist)) {
      if (!currentEra) {
        currentEra = {
          artist: dominant.artist,
          startMonth: yearMonth,
          endMonth: yearMonth,
          playCount: dominant.playCount,
        }
      } else {
        currentEra.endMonth = yearMonth
        currentEra.playCount += dominant.playCount
      }
    } else {
      // Era change or gap
      if (currentEra) {
        eras.push(currentEra)
      }
      if (dominant) {
        currentEra = {
          artist: dominant.artist,
          startMonth: yearMonth,
          endMonth: yearMonth,
          playCount: dominant.playCount,
        }
      } else {
        currentEra = null
      }
    }
  }

  // Push final era
  if (currentEra) {
    eras.push(currentEra)
  }

  // Convert month strings to date ranges and calculate duration
  return eras.map((era) => {
    const [startYear, startMonthStr] = era.startMonth.split('-')
    const [endYear, endMonthStr] = era.endMonth.split('-')
    const startMonth = parseInt(startMonthStr) - 1
    const endMonth = parseInt(endMonthStr) - 1

    // Start: first day of start month
    const startDate = new Date(parseInt(startYear), startMonth, 1)
    // End: last day of end month
    const endDate = new Date(parseInt(endYear), endMonth + 1, 0)

    // Month count: difference between start and end
    const monthCount =
      (parseInt(endYear) - parseInt(startYear)) * 12 + (endMonth - startMonth) + 1

    return {
      artist: era.artist,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      playCount: era.playCount,
      monthCount,
      startMonth: era.startMonth,
      endMonth: era.endMonth,
    }
  })
}

/**
 * getYearStats
 * Aggregates listening statistics for a specific year.
 *
 * Returns: {
 *   year: number,
 *   topTracks: Array<{ trackName, artistName, playCount, totalMsPlayed, spotifyTrackUri }>,
 *   topArtists: Array<{ artistName, playCount }>,
 *   totalListeningMs: number,
 *   countriesVisited: Set<string>,
 *   mostActiveMonth: { month: number, playCount: number },
 * }
 */
export function getYearStats(allEntries, year) {
  // Filter entries for this year
  const yearEntries = allEntries.filter((e) => {
    const date = new Date(e.ts)
    return date.getFullYear() === year
  })

  if (yearEntries.length === 0) {
    return {
      year,
      topTracks: [],
      topArtists: [],
      totalListeningMs: 0,
      countriesVisited: new Set(),
      mostActiveMonth: null,
    }
  }

  // Aggregate by track
  const trackMap = new Map()
  for (const e of yearEntries) {
    if (!e.master_metadata_track_name) continue

    const uri = e.spotify_track_uri
    if (!trackMap.has(uri)) {
      trackMap.set(uri, {
        trackName: e.master_metadata_track_name,
        artistName: e.master_metadata_album_artist_name,
        albumName: e.master_metadata_album_album_name,
        spotifyTrackUri: uri,
        playCount: 0,
        totalMsPlayed: 0,
      })
    }
    const stat = trackMap.get(uri)
    stat.playCount += 1
    stat.totalMsPlayed += e.ms_played
  }

  // Top 10 tracks by play count
  const topTracks = Array.from(trackMap.values())
    .sort((a, b) => {
      if (b.playCount !== a.playCount) return b.playCount - a.playCount
      return b.totalMsPlayed - a.totalMsPlayed
    })
    .slice(0, 10)

  // Aggregate by artist
  const artistMap = new Map()
  for (const e of yearEntries) {
    const artist = e.master_metadata_album_artist_name
    if (!artistMap.has(artist)) {
      artistMap.set(artist, { artistName: artist, playCount: 0 })
    }
    artistMap.get(artist).playCount += 1
  }

  // Top 5 artists by play count
  const topArtists = Array.from(artistMap.values())
    .sort((a, b) => b.playCount - a.playCount)
    .slice(0, 5)

  // Total listening time
  let totalListeningMs = 0
  for (const e of yearEntries) {
    totalListeningMs += e.ms_played
  }

  // Countries visited
  const countriesVisited = new Set()
  for (const e of yearEntries) {
    countriesVisited.add(e.conn_country)
  }

  // Most active month
  const playsByMonth = new Map()
  for (const e of yearEntries) {
    const date = new Date(e.ts)
    const month = date.getMonth()
    playsByMonth.set(month, (playsByMonth.get(month) || 0) + 1)
  }

  let mostActiveMonth = null
  let maxPlaysInMonth = 0
  for (const [month, count] of playsByMonth) {
    if (count > maxPlaysInMonth) {
      maxPlaysInMonth = count
      mostActiveMonth = { month, playCount: count }
    }
  }

  return {
    year,
    topTracks,
    topArtists,
    totalListeningMs,
    countriesVisited,
    mostActiveMonth,
  }
}

/**
 * getCurrentEra
 * Simplified era detection from recently-played tracks (OAuth data only).
 * Returns the dominant artist from the most recent plays.
 *
 * Returns: { artist: string, playCount: number } or null
 */
export function getCurrentEra(recentTracks) {
  if (recentTracks.length === 0) return null

  const artistCounts = new Map()
  for (const track of recentTracks) {
    const artist = track.master_metadata_album_artist_name
    artistCounts.set(artist, (artistCounts.get(artist) || 0) + 1)
  }

  let dominantArtist = null
  let maxCount = 0
  for (const [artist, count] of artistCounts) {
    if (count > maxCount) {
      maxCount = count
      dominantArtist = artist
    }
  }

  return dominantArtist ? { artist: dominantArtist, playCount: maxCount } : null
}

/**
 * groupByDay
 * Groups entries by day and aggregates listening data.
 *
 * Returns: Map<YYYY-MM-DD, { msPlayed: number, tracks: Array<{name, artist, plays}> }>
 */
export function groupByDay(allEntries) {
  const dayMap = new Map() // "YYYY-MM-DD" -> { msPlayed, trackSet (for dedup), tracks }

  for (const entry of allEntries) {
    const date = new Date(entry.ts)
    const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD

    if (!dayMap.has(dateStr)) {
      dayMap.set(dateStr, {
        msPlayed: 0,
        trackMap: new Map(), // uri -> { name, artist, plays }
      })
    }

    const dayData = dayMap.get(dateStr)
    dayData.msPlayed += entry.ms_played

    // Aggregate tracks for the day
    const uri = entry.spotify_track_uri
    if (!dayData.trackMap.has(uri)) {
      dayData.trackMap.set(uri, {
        name: entry.master_metadata_track_name,
        artist: entry.master_metadata_album_artist_name,
        plays: 0,
      })
    }
    dayData.trackMap.get(uri).plays += 1
  }

  // Convert to final format: sort tracks by plays desc, keep top 3
  const result = new Map()
  for (const [dateStr, dayData] of dayMap) {
    const topTracks = Array.from(dayData.trackMap.values())
      .sort((a, b) => b.plays - a.plays)
      .slice(0, 3)

    result.set(dateStr, {
      msPlayed: dayData.msPlayed,
      tracks: topTracks,
    })
  }

  return result
}
