/**
 * tasteComparison.js — Compare current vs historical listening taste
 *
 * Takes Spotify top artists/tracks from two time ranges and classifies
 * each artist into: rising, consistent, or fading.
 */

/**
 * Compare short-term vs long-term top artists to find taste shifts.
 *
 * @param {Array} shortTermArtists - Spotify top artists (short_term ~4 weeks)
 * @param {Array} longTermArtists - Spotify top artists (long_term ~several years)
 * @param {Array|null} historyEntries - Optional uploaded history entries for deeper context
 * @returns {{ rising: Array, consistent: Array, fading: Array }}
 */
export function compareTaste(shortTermArtists, longTermArtists, historyEntries = null) {
  const shortSet = new Map(shortTermArtists.map((a, i) => [a.id, { ...a, rank: i + 1 }]))
  const longSet = new Map(longTermArtists.map((a, i) => [a.id, { ...a, rank: i + 1 }]))

  const rising = []   // In short-term but NOT in long-term (new obsessions)
  const consistent = [] // In both (enduring favorites)
  const fading = []   // In long-term but NOT in short-term (falling off)

  // Find rising + consistent
  for (const [id, artist] of shortSet) {
    if (longSet.has(id)) {
      const longRank = longSet.get(id).rank
      consistent.push({
        id,
        name: artist.name,
        image: artist.images?.[0]?.url || null,
        genres: artist.genres?.slice(0, 2) || [],
        shortRank: artist.rank,
        longRank,
        rankDelta: longRank - artist.rank, // Positive = moving up
      })
    } else {
      rising.push({
        id,
        name: artist.name,
        image: artist.images?.[0]?.url || null,
        genres: artist.genres?.slice(0, 2) || [],
        shortRank: artist.rank,
      })
    }
  }

  // Find fading
  for (const [id, artist] of longSet) {
    if (!shortSet.has(id)) {
      fading.push({
        id,
        name: artist.name,
        image: artist.images?.[0]?.url || null,
        genres: artist.genres?.slice(0, 2) || [],
        longRank: artist.rank,
      })
    }
  }

  // Enrich with history data if available
  if (historyEntries && historyEntries.length > 0) {
    const playCounts = getArtistPlayCounts(historyEntries)

    for (const list of [rising, consistent, fading]) {
      for (const artist of list) {
        artist.totalHistoryPlays = playCounts.get(artist.name.toLowerCase()) || 0
      }
    }
  }

  // Sort: rising by short rank, consistent by rank delta (biggest climbers first), fading by long rank
  rising.sort((a, b) => a.shortRank - b.shortRank)
  consistent.sort((a, b) => b.rankDelta - a.rankDelta)
  fading.sort((a, b) => a.longRank - b.longRank)

  return {
    rising: rising.slice(0, 10),
    consistent: consistent.slice(0, 10),
    fading: fading.slice(0, 10),
  }
}

/**
 * Build a map of artist name (lowercase) → total play count from history entries
 */
function getArtistPlayCounts(entries) {
  const counts = new Map()
  for (const entry of entries) {
    const artist = entry.master_metadata_album_artist_name || entry.ar
    if (!artist) continue
    const key = artist.toLowerCase()
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  return counts
}
