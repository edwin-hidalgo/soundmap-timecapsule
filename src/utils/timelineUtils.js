/**
 * timelineUtils.js — Utilities for Timeline View (Eras + Year Review)
 */

/**
 * detectEras
 * Finds distinct "eras" in listening history using 6-month binning and artist composition clustering.
 *
 * Algorithm:
 * 1. Bin plays into 6-month periods (H1: Jan-Jun, H2: Jul-Dec)
 * 2. For each period, calculate artist distribution
 * 3. Detect "shift points" where artist composition significantly changes (Jaccard similarity < 0.4)
 * 4. Group consecutive periods into eras
 *
 * Returns: Array<{ artist, startDate, endDate, playCount, monthCount }>
 *   Eras are realistic, multi-period spans (not monthly)
 */
export function detectEras(allEntries) {
  if (allEntries.length === 0) return []

  // Step 1: Bin plays into 6-month periods (H1/H2)
  const periodData = new Map() // "YYYY-H1/H2" -> { plays: [], artistCounts: Map }

  for (const entry of allEntries) {
    const date = new Date(entry.ts)
    const year = date.getFullYear()
    const month = date.getMonth()
    const half = month < 6 ? 'H1' : 'H2'
    const periodKey = `${year}-${half}`

    if (!periodData.has(periodKey)) {
      periodData.set(periodKey, {
        plays: [],
        artistCounts: new Map(),
      })
    }

    const period = periodData.get(periodKey)
    period.plays.push(entry)

    const artist = entry.master_metadata_album_artist_name
    period.artistCounts.set(artist, (period.artistCounts.get(artist) || 0) + 1)
  }

  const sortedPeriods = Array.from(periodData.keys()).sort()

  // Step 2: Calculate artist composition for each period
  const periodVectors = new Map() // periodKey -> { topArtists: [], composition, playCount, dominantArtist }

  for (const periodKey of sortedPeriods) {
    const period = periodData.get(periodKey)

    // Get top 10 artists
    const topArtists = Array.from(period.artistCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([artist]) => artist)

    const totalPlays = period.plays.length
    const [dominantArtist, dominantCount] = Array.from(period.artistCounts.entries()).sort(
      (a, b) => b[1] - a[1]
    )[0] || [null, 0]

    periodVectors.set(periodKey, {
      topArtists,
      playCount: totalPlays,
      dominantArtist,
      dominantPercentage: dominantCount / totalPlays,
      artistCounts: period.artistCounts,
    })
  }

  // Step 3: Detect shift points using Jaccard similarity
  const shiftPoints = new Set()
  shiftPoints.add(0) // Always start with first period

  for (let i = 0; i < sortedPeriods.length - 1; i++) {
    const current = periodVectors.get(sortedPeriods[i])
    const next = periodVectors.get(sortedPeriods[i + 1])

    // Jaccard similarity of top 10 artists
    const currentSet = new Set(current.topArtists)
    const nextSet = new Set(next.topArtists)
    const intersection = new Set([...currentSet].filter((x) => nextSet.has(x)))
    const union = new Set([...currentSet, ...nextSet])
    const jaccardSimilarity = union.size > 0 ? intersection.size / union.size : 0

    // Detect significant shift: Jaccard < 0.4 OR dominant artist changes significantly
    const dominantChanged =
      current.dominantArtist !== next.dominantArtist && next.dominantPercentage > 0.15

    if (jaccardSimilarity < 0.4 || dominantChanged) {
      shiftPoints.add(i + 1)
    }
  }

  // Step 4: Group periods into eras
  const eraList = []
  const shiftPointsArray = Array.from(shiftPoints).sort((a, b) => a - b)

  for (let i = 0; i < shiftPointsArray.length; i++) {
    const startIdx = shiftPointsArray[i]
    const endIdx =
      i + 1 < shiftPointsArray.length ? shiftPointsArray[i + 1] - 1 : sortedPeriods.length - 1

    const periodRange = sortedPeriods.slice(startIdx, endIdx + 1)

    // Skip if era is less than 1 period (6 months)
    if (periodRange.length < 1) continue

    // Aggregate era data
    let totalPlayCount = 0
    const artistScores = new Map()

    for (const periodKey of periodRange) {
      const period = periodData.get(periodKey)
      totalPlayCount += period.plays.length

      for (const [artist, count] of period.artistCounts) {
        artistScores.set(artist, (artistScores.get(artist) || 0) + count)
      }
    }

    // Find dominant artist in era
    const dominantEntry = Array.from(artistScores.entries()).sort((a, b) => b[1] - a[1])[0]
    const dominantArtist = dominantEntry?.[0]
    const dominantPlayCount = dominantEntry?.[1] || 0

    if (dominantArtist) {
      const startPeriodKey = periodRange[0]
      const endPeriodKey = periodRange[periodRange.length - 1]

      const [startYear, startHalf] = startPeriodKey.split('-')
      const [endYear, endHalf] = endPeriodKey.split('-')

      const startMonth = startHalf === 'H1' ? 0 : 6
      const endMonth = endHalf === 'H1' ? 5 : 11

      const startDate = new Date(parseInt(startYear), startMonth, 1)
      const endDate = new Date(parseInt(endYear), endMonth + 1, 0)

      const monthCount = periodRange.length * 6

      eraList.push({
        artist: dominantArtist,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        playCount: dominantPlayCount,
        monthCount,
        startMonth: `${startYear}-${startHalf}`,
        endMonth: `${endYear}-${endHalf}`,
      })
    }
  }

  return eraList
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
