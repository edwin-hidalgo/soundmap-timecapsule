/**
 * timelineUtils.js — Utilities for Timeline View (Eras + Year Review)
 */

/**
 * detectEras
 * Finds distinct "eras" in listening history using 6-month binning and artist composition clustering.
 *
 * Algorithm:
 * 1. Bin plays into 6-month periods (H1: Jan-Jun, H2: Jul-Dec)
 * 2. For each period, calculate top-5 artist composition
 * 3. Detect "shift points" where Jaccard similarity < 0.4 (significant taste shift)
 * 4. Group consecutive periods into rough eras
 * 5. MERGE short eras: any era < 18 months (< 3 bins) gets merged with most-similar neighbor
 * 6. Cap max eras at 6 (or floor(years/2))
 * 7. Enrich each era with: topArtists, topTracks, characterText, transitionNarrative
 *
 * Returns: Array<{ name, dateStart, dateEnd, durationMonths, topArtists, topTracks,
 *           totalPlays, avgPlaysPerMonth, characterText, dominantArtist, dominantArtistShare,
 *           discoveryRate, transitionFrom, transitionTo }>
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

  // Step 2: Calculate artist composition for each period (top 5 only for Jaccard)
  const periodVectors = new Map()

  for (const periodKey of sortedPeriods) {
    const period = periodData.get(periodKey)

    // Get top 5 artists for Jaccard comparison
    const topArtists = Array.from(period.artistCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
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
      newArtists: new Set(), // will compute below
    })
  }

  // Compute discovery rate: new artists per period
  let previousArtists = new Set()
  for (const periodKey of sortedPeriods) {
    const vector = periodVectors.get(periodKey)
    const currentArtists = new Set(vector.artistCounts.keys())
    vector.newArtists = new Set([...currentArtists].filter((a) => !previousArtists.has(a)))
    previousArtists = currentArtists
  }

  // Step 3: Detect candidate shift points using Jaccard similarity of top 5
  const shiftPoints = new Set()
  shiftPoints.add(0)

  for (let i = 0; i < sortedPeriods.length - 1; i++) {
    const current = periodVectors.get(sortedPeriods[i])
    const next = periodVectors.get(sortedPeriods[i + 1])

    // Jaccard similarity of top 5 artists
    const currentSet = new Set(current.topArtists)
    const nextSet = new Set(next.topArtists)
    const intersection = new Set([...currentSet].filter((x) => nextSet.has(x)))
    const union = new Set([...currentSet, ...nextSet])
    const jaccardSimilarity = union.size > 0 ? intersection.size / union.size : 0

    // Detect significant shift: Jaccard < 0.4 is a strong signal
    if (jaccardSimilarity < 0.4) {
      shiftPoints.add(i + 1)
    }
  }

  // Step 4: Group periods into rough eras
  const shiftPointsArray = Array.from(shiftPoints).sort((a, b) => a - b)
  const roughEras = []

  for (let i = 0; i < shiftPointsArray.length; i++) {
    const startIdx = shiftPointsArray[i]
    const endIdx =
      i + 1 < shiftPointsArray.length ? shiftPointsArray[i + 1] - 1 : sortedPeriods.length - 1

    const periodRange = sortedPeriods.slice(startIdx, endIdx + 1)
    if (periodRange.length < 1) continue

    roughEras.push({
      periodRange,
      startIdx,
      endIdx,
    })
  }

  // Step 5: Merge short eras (< 3 bins = < 18 months) with most-similar neighbor
  const mergedEras = mergeShortEras(roughEras, periodVectors, periodData)

  // Step 6: Cap max eras at 6 or floor(years/2)
  const yearsInHistory = sortedPeriods.length / 2 // 2 periods per year
  const maxEras = Math.min(6, Math.max(2, Math.floor(yearsInHistory / 2)))

  let finalEras = mergedEras
  while (finalEras.length > maxEras) {
    // Merge the two smallest eras together
    let smallestIdx = 0
    let smallestSize = finalEras[0].periodRange.length

    for (let i = 1; i < finalEras.length; i++) {
      if (finalEras[i].periodRange.length < smallestSize) {
        smallestSize = finalEras[i].periodRange.length
        smallestIdx = i
      }
    }

    // Merge with neighbor
    const neighbor = smallestIdx > 0 ? smallestIdx - 1 : smallestIdx + 1
    finalEras[neighbor].periodRange = [
      ...finalEras[neighbor].periodRange,
      ...finalEras[smallestIdx].periodRange,
    ].sort()

    finalEras.splice(smallestIdx, 1)
  }

  // Step 7: Build enriched era objects
  const eraList = []

  for (let eraIdx = 0; eraIdx < finalEras.length; eraIdx++) {
    const eraData = finalEras[eraIdx]
    const periodRange = eraData.periodRange

    // Aggregate era data
    let totalPlayCount = 0
    let totalMsPlayed = 0
    const artistScores = new Map()
    const trackScores = new Map()
    let eraStartDate = null
    let eraEndDate = null

    for (const periodKey of periodRange) {
      const period = periodData.get(periodKey)
      totalPlayCount += period.plays.length

      for (const entry of period.plays) {
        totalMsPlayed += entry.ms_played

        const artist = entry.master_metadata_album_artist_name
        artistScores.set(artist, (artistScores.get(artist) || 0) + 1)

        const uri = entry.spotify_track_uri
        if (!trackScores.has(uri)) {
          trackScores.set(uri, {
            name: entry.master_metadata_track_name,
            artist: entry.master_metadata_album_artist_name,
            plays: 0,
          })
        }
        trackScores.get(uri).plays += 1

        // Track date range
        const date = new Date(entry.ts)
        if (!eraStartDate || date < eraStartDate) eraStartDate = date
        if (!eraEndDate || date > eraEndDate) eraEndDate = date
      }
    }

    // Top 5 artists in era
    const topArtistsInEra = Array.from(artistScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([artist, plays]) => ({ artist, plays }))

    // Top 10 tracks in era
    const topTracksInEra = Array.from(trackScores.values())
      .sort((a, b) => b.plays - a.plays)
      .slice(0, 10)

    // Dominant artist and share
    const dominantArtist = topArtistsInEra[0]?.artist || 'Unknown'
    const dominantArtistShare = topArtistsInEra[0]
      ? topArtistsInEra[0].plays / totalPlayCount
      : 0

    // Discovery rate (new artists per year)
    let discoveryCount = 0
    for (const periodKey of periodRange) {
      const vector = periodVectors.get(periodKey)
      discoveryCount += vector.newArtists.size
    }
    const safePeriodLength = Math.max(1, periodRange.length)
    const discoveryRate = Math.round(
      discoveryCount / (safePeriodLength / 2) // years in this era
    )

    // Duration
    const durationMonths = safePeriodLength * 6
    const avgPlaysPerMonth = Math.round(totalPlayCount / durationMonths)

    // Era name: "The [Artist] Years" or similar
    const eraNumber = eraIdx + 1
    const name = buildEraName(dominantArtist, eraNumber, periodRange.length)

    // Transition narratives
    let transitionFrom = null
    let transitionTo = null

    if (eraIdx > 0) {
      const prevEra = finalEras[eraIdx - 1]
      const prevArtistScore = new Map()
      for (const periodKey of prevEra.periodRange) {
        const period = periodData.get(periodKey)
        for (const [artist, count] of period.artistCounts) {
          prevArtistScore.set(artist, (prevArtistScore.get(artist) || 0) + count)
        }
      }
      const prevDominantArtist = Array.from(prevArtistScore.entries()).sort(
        (a, b) => b[1] - a[1]
      )[0]?.[0]
      if (
        prevDominantArtist &&
        prevDominantArtist !== dominantArtist &&
        !topArtistsInEra.some((a) => a.artist === prevDominantArtist)
      ) {
        transitionFrom = prevDominantArtist
      }
    }

    if (eraIdx < finalEras.length - 1) {
      const nextEra = finalEras[eraIdx + 1]
      const nextArtistScore = new Map()
      for (const periodKey of nextEra.periodRange) {
        const period = periodData.get(periodKey)
        for (const [artist, count] of period.artistCounts) {
          nextArtistScore.set(artist, (nextArtistScore.get(artist) || 0) + count)
        }
      }
      const nextDominantArtist = Array.from(nextArtistScore.entries()).sort(
        (a, b) => b[1] - a[1]
      )[0]?.[0]
      if (
        nextDominantArtist &&
        nextDominantArtist !== dominantArtist &&
        !topArtistsInEra.some((a) => a.artist === nextDominantArtist)
      ) {
        transitionTo = nextDominantArtist
      }
    }

    // Character text
    const characterText = buildEraCharacterText(
      dominantArtist,
      dominantArtistShare,
      discoveryRate,
      periodRange.length
    )

    // Format dates
    const [startYear, startHalf] = periodRange[0].split('-')
    const [endYear, endHalf] = periodRange[periodRange.length - 1].split('-')
    const startMonth = startHalf === 'H1' ? '01' : '07'
    const endMonth = endHalf === 'H1' ? '06' : '12'

    eraList.push({
      name,
      dateStart: `${startYear}-${startMonth}`,
      dateEnd: `${endYear}-${endMonth}`,
      durationMonths,
      topArtists: topArtistsInEra.map((a) => a.artist),
      topTracks: topTracksInEra,
      totalPlays: totalPlayCount,
      avgPlaysPerMonth,
      characterText,
      dominantArtist,
      dominantArtistShare: Math.round(dominantArtistShare * 100),
      discoveryRate,
      transitionFrom,
      transitionTo,
    })
  }

  return eraList
}

/**
 * mergeShortEras
 * Merges eras that are < 3 bins (18 months) with their most-similar neighbor.
 */
function mergeShortEras(roughEras, periodVectors, periodData) {
  const result = [...roughEras]
  let changed = true

  while (changed) {
    changed = false

    for (let i = 0; i < result.length; i++) {
      const era = result[i]
      if (era.periodRange.length >= 3) continue // Skip eras >= 18 months

      // Find most-similar neighbor
      let bestNeighborIdx = -1
      let bestSimilarity = -1

      // Try left neighbor
      if (i > 0) {
        const similarity = computeEraSimilarity(
          result[i - 1].periodRange,
          era.periodRange,
          periodVectors
        )
        if (similarity > bestSimilarity) {
          bestSimilarity = similarity
          bestNeighborIdx = i - 1
        }
      }

      // Try right neighbor
      if (i < result.length - 1) {
        const similarity = computeEraSimilarity(
          era.periodRange,
          result[i + 1].periodRange,
          periodVectors
        )
        if (similarity > bestSimilarity) {
          bestSimilarity = similarity
          bestNeighborIdx = i + 1
        }
      }

      if (bestNeighborIdx >= 0) {
        // Merge era into neighbor
        if (bestNeighborIdx < i) {
          result[bestNeighborIdx].periodRange = [
            ...result[bestNeighborIdx].periodRange,
            ...era.periodRange,
          ].sort()
          result.splice(i, 1)
        } else {
          result[bestNeighborIdx].periodRange = [
            ...era.periodRange,
            ...result[bestNeighborIdx].periodRange,
          ].sort()
          result.splice(i, 1)
        }
        changed = true
      }

      break // Restart scan
    }
  }

  return result
}

/**
 * computeEraSimilarity
 * Computes Jaccard similarity between two eras' artist sets.
 */
function computeEraSimilarity(eraAKey, eraBKey, periodVectors) {
  const artistsA = new Set()
  const artistsB = new Set()

  for (const periodKey of eraAKey) {
    const vector = periodVectors.get(periodKey)
    for (const artist of vector.topArtists) {
      artistsA.add(artist)
    }
  }

  for (const periodKey of eraBKey) {
    const vector = periodVectors.get(periodKey)
    for (const artist of vector.topArtists) {
      artistsB.add(artist)
    }
  }

  const intersection = new Set([...artistsA].filter((x) => artistsB.has(x)))
  const union = new Set([...artistsA, ...artistsB])

  return union.size > 0 ? intersection.size / union.size : 0
}

/**
 * buildEraName
 * Generates a human-friendly era name.
 */
function buildEraName(dominantArtist, eraNumber, numPeriods) {
  // "The [Artist] Years/Era" for longer eras, or "The [Artist] Phase" for shorter ones
  const durationLabel = numPeriods >= 4 ? 'Years' : 'Era'
  return `The ${dominantArtist} ${durationLabel}`
}

/**
 * buildEraCharacterText
 * Generates a character description for the era based on data.
 */
function buildEraCharacterText(dominantArtist, dominantShare, discoveryRate, numPeriods) {
  const sharePercent = Math.round(dominantShare * 100)
  const durationYears = (numPeriods / 2).toFixed(1)

  if (sharePercent > 10) {
    return `Your ${dominantArtist} phase. ${sharePercent}% of all listening in this era.`
  } else if (discoveryRate > 1000) {
    return `Peak exploration: ${discoveryRate} new artists/year. Rapidly expanding taste.`
  } else if (sharePercent > 5) {
    return `${dominantArtist}-focused listening spanning ${durationYears} years.`
  } else {
    return `A diverse era with ${dominantArtist} as your anchor artist.`
  }
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

/**
 * filterEntriesByWindow
 * Filters entries to a specific time window from today.
 *
 * windowDays: number of days back (e.g., 30, 365), or Infinity for all-time
 * Returns: filtered allEntries array
 */
export function filterEntriesByWindow(allEntries, windowDays) {
  if (windowDays === Infinity) return allEntries

  const now = new Date()
  const cutoffDate = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000)

  return allEntries.filter((entry) => {
    const entryDate = new Date(entry.ts)
    return entryDate >= cutoffDate
  })
}

/**
 * classifyLifeStaples
 * Identifies tracks with 200+ lifetime plays and classifies them by recency.
 *
 * Returns: { current: [], dormant: [], archived: [] }
 *   Each item: { uri, trackName, artistName, totalPlays, recentPlays, lastHeard, classification }
 */
export function classifyLifeStaples(allEntries) {
  // Adaptive threshold based on history depth
  const yearsOfData = getAllYearsInHistory(allEntries).length
  let stapleThreshold = 200
  if (yearsOfData < 2) stapleThreshold = 100
  // Use entry count as proxy for sparse users (< 500 plays = very sparse)
  if (allEntries.length < 500) stapleThreshold = 50

  // Build track stats: all-time and last-12-months
  const trackStats = new Map() // uri -> { trackName, artistName, totalPlays, recentPlays, lastHeard }

  // Compute data-relative anchor: most recent entry in allEntries
  let dataEndDate = new Date(0)
  for (const entry of allEntries) {
    const d = new Date(entry.ts)
    if (d > dataEndDate) dataEndDate = d
  }

  const last12MoCutoff = new Date(dataEndDate)
  last12MoCutoff.setFullYear(last12MoCutoff.getFullYear() - 1)

  for (const entry of allEntries) {
    const uri = entry.spotify_track_uri
    if (!uri) continue

    if (!trackStats.has(uri)) {
      trackStats.set(uri, {
        trackName: entry.master_metadata_track_name,
        artistName: entry.master_metadata_album_artist_name,
        totalPlays: 0,
        recentPlays: 0,
        lastHeard: null,
      })
    }

    const stat = trackStats.get(uri)
    stat.totalPlays += 1

    const entryDate = new Date(entry.ts)
    if (entryDate >= last12MoCutoff) {
      stat.recentPlays += 1
    }

    if (!stat.lastHeard || entryDate > stat.lastHeard) {
      stat.lastHeard = entryDate
    }
  }

  // Classify staples
  const current = []
  const dormant = []
  const archived = []

  for (const [uri, stat] of trackStats) {
    if (stat.totalPlays < stapleThreshold) continue

    // Days since last heard (relative to data end date, not today)
    const daysSinceLastHeard = Math.floor((dataEndDate - stat.lastHeard) / (1000 * 60 * 60 * 24))

    if (stat.recentPlays >= 10 && daysSinceLastHeard <= 180) {
      // Current: 10+ plays in last 12 months AND heard within 6 months
      current.push({
        uri,
        trackName: stat.trackName,
        artistName: stat.artistName,
        totalPlays: stat.totalPlays,
        recentPlays: stat.recentPlays,
        lastHeard: stat.lastHeard,
        classification: 'current',
      })
    } else if (stat.recentPlays < 5 && daysSinceLastHeard > 730) {
      // Archived: <5 plays in last 12 months AND not heard in 2+ years
      archived.push({
        uri,
        trackName: stat.trackName,
        artistName: stat.artistName,
        totalPlays: stat.totalPlays,
        recentPlays: stat.recentPlays,
        lastHeard: stat.lastHeard,
        classification: 'archived',
      })
    } else {
      // Dormant: in between (fading or seasonal)
      dormant.push({
        uri,
        trackName: stat.trackName,
        artistName: stat.artistName,
        totalPlays: stat.totalPlays,
        recentPlays: stat.recentPlays,
        lastHeard: stat.lastHeard,
        classification: 'dormant',
      })
    }
  }

  // Sort each by total plays desc
  current.sort((a, b) => b.totalPlays - a.totalPlays)
  dormant.sort((a, b) => b.totalPlays - a.totalPlays)
  archived.sort((a, b) => b.totalPlays - a.totalPlays)

  return { current, dormant, archived }
}

/**
 * computeTastePassport
 * Computes 5 dimension scores for taste profile.
 *
 * Returns: {
 *   explorerScore: number,
 *   loyalistScore: number,
 *   dayNightScore: number,
 *   depthScore: number,
 *   volatilityScore: number,
 *   archetype: string,
 *   narrative: string
 * }
 */
export function computeTastePassport(entries) {
  if (entries.length === 0) {
    return {
      explorerScore: 0.5,
      loyalistScore: 0.5,
      dayNightScore: 0.5,
      depthScore: 0.5,
      volatilityScore: 0.5,
      archetype: 'New Listener',
      narrative: 'Start listening to build your taste profile.',
    }
  }

  // Compute 5 dimension scores

  // 1. EXPLORER / REPLAYER: unique artists vs total plays
  const artistSet = new Set()
  for (const entry of entries) {
    const artist = entry.master_metadata_album_artist_name
    if (artist) artistSet.add(artist)
  }
  const uniqueArtists = artistSet.size
  const totalPlays = entries.length
  // Simpler: higher unique artist ratio = higher explorer score
  const explorerScoreFinal = totalPlays > 0 ? Math.min(1.0, (uniqueArtists / totalPlays) * 5) : 0.5

  // 2. LOYALIST / DRIFTER: concentration in top 10 artists (inverted — lower concentration = higher loyalist)
  const artistCounts = new Map()
  for (const entry of entries) {
    const artist = entry.master_metadata_album_artist_name
    if (artist) {
      artistCounts.set(artist, (artistCounts.get(artist) || 0) + 1)
    }
  }
  const topArtists = Array.from(artistCounts.values()).sort((a, b) => b - a).slice(0, 10)
  const topArtistPlays = topArtists.reduce((sum, count) => sum + count, 0)
  const topArtistConcentration = totalPlays > 0 ? topArtistPlays / totalPlays : 0 // higher = more concentrated = less loyal
  const loyalistScore = Math.min(1.0, Math.max(0, 1 - topArtistConcentration)) // invert: lower concentration = higher score

  // 3. DAY / NIGHT: plays after 8pm
  const nightPlays = entries.filter((entry) => {
    const hour = new Date(entry.ts).getHours()
    return hour >= 20 || hour < 8 // after 8pm or before 8am
  }).length
  const dayNightScore = totalPlays > 0 ? nightPlays / totalPlays : 0.5

  // 4. DEPTH / BREADTH: average plays per artist
  const avgPlaysPerArtist = uniqueArtists > 0 ? totalPlays / uniqueArtists : 0
  const normalizedDepth = avgPlaysPerArtist > 0 ? Math.min(1.0, avgPlaysPerArtist / 30) : 0 // 30 plays/artist is "deep"
  const depthScore = normalizedDepth

  // 5. TASTE VOLATILITY: number of distinct eras / years of history
  const eras = detectEras(entries)
  const yearsInHistory = Math.max(1, getAllYearsInHistory(entries).length) // prevent division by zero
  const volatilityScore = Math.min(1.0, Math.max(0, eras.length / yearsInHistory))

  // Generate archetype
  const archetype = generateArchetype(
    explorerScoreFinal,
    loyalistScore,
    dayNightScore,
    depthScore
  )

  // Generate narrative
  const narrative = generateNarrative(
    archetype,
    explorerScoreFinal,
    dayNightScore,
    Array.from(artistCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 1)
      .map((e) => e[0])[0]
  )

  return {
    explorerScore: Math.round(explorerScoreFinal * 100) / 100,
    loyalistScore: Math.round(loyalistScore * 100) / 100,
    dayNightScore: Math.round(dayNightScore * 100) / 100,
    depthScore: Math.round(depthScore * 100) / 100,
    volatilityScore: Math.round(volatilityScore * 100) / 100,
    archetype,
    narrative,
  }
}

/**
 * generateArchetype
 * Generates archetype name from dimension scores.
 */
function generateArchetype(explorer, loyalist, dayNight, depth) {
  if (explorer > 0.65 && loyalist < 0.6) return 'Explorer-Curator'
  if (explorer < 0.6 && loyalist > 0.65) return 'Focused Loyalist'
  if (explorer > 0.65 && loyalist > 0.65) return 'Loyalist-Curator'
  return 'Balanced Listener'
}

/**
 * generateNarrative
 * Generates a narrative sentence (no AI).
 */
function generateNarrative(archetype, explorer, dayNight, topArtist) {
  const timeLabel = dayNight > 0.6 ? 'nocturnal' : 'daytime'
  const exploreLabel = explorer > 0.6 ? 'explorer' : 'devoted listener'

  return `You're a ${timeLabel} ${exploreLabel}. Your relationship with ${topArtist || 'music'} defines this period.`
}

/**
 * getAllYearsInHistory
 * Returns array of all years present in listening history.
 */
function getAllYearsInHistory(entries) {
  const years = new Set()
  for (const entry of entries) {
    const year = new Date(entry.ts).getFullYear()
    years.add(year)
  }
  return Array.from(years).sort()
}
