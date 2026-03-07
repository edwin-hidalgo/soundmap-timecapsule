/**
 * uploadWorker.js
 *
 * Web Worker that handles the full file processing pipeline off the main thread.
 * Receives raw file content strings, runs JSON.parse + normalize + dedup +
 * parseStreamingHistory, and posts back the result.
 *
 * This prevents the main thread from freezing during processing of large exports
 * (300k+ entries), keeping the upload spinner animated and the tab responsive.
 *
 * Message in:  { fileContents: string[], fileNames: string[] }
 * Message out: { success: true, countryData, entries, dataFormat }
 *           or { success: false, error: string }
 */

import { parseStreamingHistory } from '../utils/parseStreamingHistory.js'
import { isBasicEntry, normalizeBasicEntry } from '../utils/normalizeEntry.js'

self.onmessage = function (event) {
  const { fileContents, fileNames } = event.data
  const t0 = performance.now()

  try {
    // ─────────────────────────────────────────────────────────────────────────
    // Step 1: JSON.parse — the most expensive step, now off the main thread
    // ─────────────────────────────────────────────────────────────────────────
    const arrays = fileContents.map((content, i) => {
      let parsed
      try {
        parsed = JSON.parse(content)
      } catch {
        throw new Error(`"${fileNames[i]}" is not valid JSON`)
      }
      if (!Array.isArray(parsed)) {
        throw new Error(`"${fileNames[i]}" is not valid JSON`)
      }
      return parsed
    })

    // ─────────────────────────────────────────────────────────────────────────
    // Step 2: Validate — confirm this looks like Spotify streaming history
    // ─────────────────────────────────────────────────────────────────────────
    const flat = arrays.flat()
    if (flat.length === 0) {
      throw new Error('No streaming history found in these files')
    }
    const sample = flat[0]
    if (!('ms_played' in sample) && !('msPlayed' in sample)) {
      throw new Error('No Spotify streaming history found in these files')
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Step 3: Normalize — convert basic format entries to extended format schema
    // ─────────────────────────────────────────────────────────────────────────
    const normalized = flat.map((e) => (isBasicEntry(e) ? normalizeBasicEntry(e) : e))

    // ─────────────────────────────────────────────────────────────────────────
    // Step 4: Cross-format dedup — prefer extended entries over basic duplicates
    // When both formats are uploaded, the same play can appear in both.
    // Extended entry key: ts[0:16] + trackName + artistName
    // Drop any basic entry whose key matches an extended entry.
    // ─────────────────────────────────────────────────────────────────────────
    const extendedKeys = new Set()
    for (const e of normalized) {
      if (!e.spotify_track_uri?.startsWith('synthetic:')) {
        extendedKeys.add(
          `${e.ts.substring(0, 16)}||${e.master_metadata_track_name}||${e.master_metadata_album_artist_name}`
        )
      }
    }
    const deduped = normalized.filter((e) => {
      if (!e.spotify_track_uri?.startsWith('synthetic:')) return true
      const key = `${e.ts.substring(0, 16)}||${e.master_metadata_track_name}||${e.master_metadata_album_artist_name}`
      return !extendedKeys.has(key)
    })

    // ─────────────────────────────────────────────────────────────────────────
    // Step 5: Format detection — for downstream UI (geo-data banner etc.)
    // ─────────────────────────────────────────────────────────────────────────
    const hasBasic = flat.some((e) => isBasicEntry(e))
    const hasExtended = flat.some((e) => !isBasicEntry(e))
    const dataFormat = hasBasic && hasExtended ? 'mixed' : hasBasic ? 'basic' : 'extended'

    // ─────────────────────────────────────────────────────────────────────────
    // Step 6: Parse streaming history — country-level aggregations for the map
    // ─────────────────────────────────────────────────────────────────────────
    const countryData = parseStreamingHistory([deduped])
    if (Object.keys(countryData).length === 0) {
      throw new Error(
        'No valid streaming history found. Check that files contain plays of 30+ seconds.'
      )
    }

    const elapsed = (performance.now() - t0).toFixed(0)
    console.log(`[uploadWorker] processed ${deduped.length} entries in ${elapsed}ms`)
    self.postMessage({ success: true, countryData, entries: deduped, dataFormat })
  } catch (err) {
    self.postMessage({ success: false, error: err.message })
  }
}
