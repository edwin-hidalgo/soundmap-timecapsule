/**
 * tasteComparison.js — Compare current vs historical listening taste
 *
 * Takes top artists from two time ranges and classifies
 * each artist into: rising, consistent, or fading.
 *
 * Works with both Spotify and Last.fm artist shapes via normalized input.
 */

/**
 * Compare short-term vs long-term top artists to find taste shifts.
 *
 * Each artist object should have at minimum: { name, image (url string|null) }
 * Optional fields: genres (array), id (string)
 *
 * @param {Array} shortTermArtists - Top artists from recent period
 * @param {Array} longTermArtists - Top artists from all-time/long period
 * @param {Array|null} historyEntries - Optional uploaded history entries for deeper context
 * @returns {{ rising: Array, consistent: Array, fading: Array }}
 */
export function compareTaste(shortTermArtists, longTermArtists, historyEntries = null) {
  const shortSet = new Map(shortTermArtists.map((a, i) => [a.name.toLowerCase(), { ...a, rank: i + 1 }]))
  const longSet = new Map(longTermArtists.map((a, i) => [a.name.toLowerCase(), { ...a, rank: i + 1 }]))

  const rising = []
  const consistent = []
  const fading = []

  for (const [key, artist] of shortSet) {
    if (longSet.has(key)) {
      const longRank = longSet.get(key).rank
      consistent.push({
        id: artist.name,
        name: artist.name,
        image: artist.image || null,
        genres: artist.genres || [],
        shortRank: artist.rank,
        longRank,
        rankDelta: longRank - artist.rank,
      })
    } else {
      rising.push({
        id: artist.name,
        name: artist.name,
        image: artist.image || null,
        genres: artist.genres || [],
        shortRank: artist.rank,
      })
    }
  }

  for (const [key, artist] of longSet) {
    if (!shortSet.has(key)) {
      fading.push({
        id: artist.name,
        name: artist.name,
        image: artist.image || null,
        genres: artist.genres || [],
        longRank: artist.rank,
      })
    }
  }

  if (historyEntries && historyEntries.length > 0) {
    const playCounts = getArtistPlayCounts(historyEntries)
    for (const list of [rising, consistent, fading]) {
      for (const artist of list) {
        artist.totalHistoryPlays = playCounts.get(artist.name.toLowerCase()) || 0
      }
    }
  }

  rising.sort((a, b) => a.shortRank - b.shortRank)
  consistent.sort((a, b) => b.rankDelta - a.rankDelta)
  fading.sort((a, b) => a.longRank - b.longRank)

  return {
    rising: rising.slice(0, 10),
    consistent: consistent.slice(0, 10),
    fading: fading.slice(0, 10),
  }
}

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
