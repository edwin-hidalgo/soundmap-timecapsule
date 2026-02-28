import { COUNTRY_DATA } from './countryData.js'

/**
 * parseStreamingHistory
 *
 * Takes raw Spotify Extended Streaming History JSON (array of entries,
 * or array of arrays from multiple files) and returns a processed
 * countryData object.
 *
 * Input entry shape (only relevant fields):
 * {
 *   ts: string,                            // ISO timestamp
 *   ms_played: number,
 *   master_metadata_track_name: string | null,
 *   master_metadata_album_artist_name: string,
 *   master_metadata_album_album_name: string,
 *   spotify_track_uri: string,
 *   conn_country: string,                  // ISO 3166-1 alpha-2
 * }
 *
 * Output shape:
 * {
 *   [countryCode: string]: {
 *     code: string,
 *     name: string,
 *     lat: number,
 *     lng: number,
 *     totalMsPlayed: number,
 *     trackCount: number,
 *     dateStart: string,   // earliest ts
 *     dateEnd: string,     // latest ts
 *     topTracks: TrackStat[],   // top 10, ranked by playCount desc, ms_played tiebreak
 *     topArtists: ArtistStat[], // top 5, ranked by playCount desc
 *   }
 * }
 *
 * TrackStat: { trackName, artistName, albumName, playCount, totalMsPlayed, spotifyTrackUri }
 * ArtistStat: { artistName, playCount }
 */
export function parseStreamingHistory(fileArrays) {
  // ─────────────────────────────────────────────────────────────────────────
  // Step 1: Flatten all file arrays into one flat array
  // ─────────────────────────────────────────────────────────────────────────
  const allEntries = fileArrays.flat()

  // ─────────────────────────────────────────────────────────────────────────
  // Step 2: Filter
  // Keep only entries where ms_played >= 30000 AND track name is not null.
  // Do NOT filter on `skipped` — it is frequently null, not false.
  // ─────────────────────────────────────────────────────────────────────────
  const filtered = allEntries.filter(
    (e) => e.ms_played >= 30_000 && e.master_metadata_track_name != null
  )

  // ─────────────────────────────────────────────────────────────────────────
  // Step 3: Dedup by (ts, spotify_track_uri)
  // Use Set with composite key. || separator is safe — neither field contains it.
  // ─────────────────────────────────────────────────────────────────────────
  const seen = new Set()
  const deduped = filtered.filter((e) => {
    const key = `${e.ts}||${e.spotify_track_uri}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Step 4: Group entries by conn_country
  // ─────────────────────────────────────────────────────────────────────────
  const byCountry = new Map()
  for (const entry of deduped) {
    const code = entry.conn_country
    if (!byCountry.has(code)) byCountry.set(code, [])
    byCountry.get(code).push(entry)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Step 5 + 6: Per-country aggregation, filter to known codes
  // ─────────────────────────────────────────────────────────────────────────
  const result = {}

  for (const [code, entries] of byCountry) {
    // Step 6: Filter out unknown country codes immediately
    if (!COUNTRY_DATA[code]) continue

    // ─────────────────────────────────────────────────────────────────────
    // 5a: totalMsPlayed
    // 5b: trackCount
    // ─────────────────────────────────────────────────────────────────────
    let totalMsPlayed = 0
    for (const e of entries) {
      totalMsPlayed += e.ms_played
    }
    const trackCount = entries.length

    // ─────────────────────────────────────────────────────────────────────
    // 5c: dateStart / dateEnd
    // ISO 8601 strings sort lexicographically, so < and > work correctly
    // ─────────────────────────────────────────────────────────────────────
    let dateStart = entries[0].ts
    let dateEnd = entries[0].ts
    for (const e of entries) {
      if (e.ts < dateStart) dateStart = e.ts
      if (e.ts > dateEnd) dateEnd = e.ts
    }

    // ─────────────────────────────────────────────────────────────────────
    // 5d: Aggregate by spotify_track_uri (canonical identifier)
    // ─────────────────────────────────────────────────────────────────────
    const trackMap = new Map()
    for (const e of entries) {
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

    // ─────────────────────────────────────────────────────────────────────
    // 5e + 5f: Sort and slice top 10 tracks
    // Sort by playCount desc, then totalMsPlayed desc for tiebreak
    // ─────────────────────────────────────────────────────────────────────
    const topTracks = Array.from(trackMap.values())
      .sort((a, b) => {
        if (b.playCount !== a.playCount) return b.playCount - a.playCount
        return b.totalMsPlayed - a.totalMsPlayed
      })
      .slice(0, 10)

    // ─────────────────────────────────────────────────────────────────────
    // 5f: Top 5 artists
    // Group by artist name string (no artist URI in Spotify export)
    // ─────────────────────────────────────────────────────────────────────
    const artistMap = new Map()
    for (const e of entries) {
      const artist = e.master_metadata_album_artist_name
      if (!artistMap.has(artist)) {
        artistMap.set(artist, { artistName: artist, playCount: 0 })
      }
      artistMap.get(artist).playCount += 1
    }
    const topArtists = Array.from(artistMap.values())
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, 5)

    // ─────────────────────────────────────────────────────────────────────
    // 5g: Attach coordinates from COUNTRY_DATA
    // ─────────────────────────────────────────────────────────────────────
    const { lat, lng, name } = COUNTRY_DATA[code]

    result[code] = {
      code,
      name,
      lat,
      lng,
      totalMsPlayed,
      trackCount,
      dateStart,
      dateEnd,
      topTracks,
      topArtists,
    }
  }

  return result
}
