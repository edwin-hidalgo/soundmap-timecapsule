#!/usr/bin/env node

/**
 * buildDemoData.js
 *
 * Extracts a representative sample of Edwin's Spotify extended streaming history
 * (2019-2025) for use as demo data in the app. Outputs to public/demoEntries.json
 *
 * Run: node scripts/buildDemoData.js
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const DATA_DIR = '/Users/edwinhidalgo/Documents/music-id-app/Edwin-Spotify-Data/Spotify Extended Streaming History/'
const OUTPUT_FILE = path.join(__dirname, '../public/demoEntries.json')
const CUTOFF_START = new Date('2019-01-01T00:00:00Z')

// Source files covering 2019-2025
const SOURCE_FILES = [
  'Streaming_History_Audio_2018-2019_9.json',   // partial
  'Streaming_History_Audio_2019_10.json',
  'Streaming_History_Audio_2019-2020_11.json',
  'Streaming_History_Audio_2020_12.json',
  'Streaming_History_Audio_2020-2021_13.json',
  'Streaming_History_Audio_2021_14.json',
  'Streaming_History_Audio_2021-2022_15.json',
  'Streaming_History_Audio_2022_16.json',
  'Streaming_History_Audio_2022-2023_17.json',
  'Streaming_History_Audio_2023_18.json',
  'Streaming_History_Audio_2023-2024_19.json',
  'Streaming_History_Audio_2024_20.json',
  'Streaming_History_Audio_2024-2025_21.json',
  'Streaming_History_Audio_2025-2026_22.json',
]

console.log('🎵 Building demo data from Edwin\'s 2019-2025 history...')
console.log(`📁 Reading from: ${DATA_DIR}`)

try {
  // ─────────────────────────────────────────────────────────────────────────────
  // Step 1: Read and filter all entries
  // ─────────────────────────────────────────────────────────────────────────────
  let allValidEntries = []
  let fileCount = 0

  for (const filename of SOURCE_FILES) {
    const filepath = path.join(DATA_DIR, filename)
    if (!fs.existsSync(filepath)) {
      console.warn(`⚠️  File not found: ${filename}`)
      continue
    }

    console.log(`📖 Reading ${filename}...`)
    const data = JSON.parse(fs.readFileSync(filepath, 'utf8'))
    const entries = Array.isArray(data) ? data : []

    // Filter: valid entries only
    // - ts >= 2019-01-01
    // - ms_played >= 30000 (30 seconds minimum)
    // - Has track name and URI
    // - conn_country exists (not null/undefined)
    const validEntries = entries.filter((entry) => {
      if (!entry.ts || new Date(entry.ts) < CUTOFF_START) return false
      if (!entry.ms_played || entry.ms_played < 30000) return false
      if (!entry.master_metadata_track_name) return false
      if (!entry.spotify_track_uri) return false
      if (!entry.conn_country) return false
      return true
    })

    allValidEntries = allValidEntries.concat(validEntries)
    fileCount++
  }

  console.log(`✅ Loaded ${allValidEntries.length} valid entries from ${fileCount} files`)

  // ─────────────────────────────────────────────────────────────────────────────
  // Step 2: Build track frequency map and group by play count
  // ─────────────────────────────────────────────────────────────────────────────
  const trackFreq = new Map() // uri → count

  for (const entry of allValidEntries) {
    const uri = entry.spotify_track_uri
    trackFreq.set(uri, (trackFreq.get(uri) || 0) + 1)
  }

  // Sort by frequency
  const sortedTracks = Array.from(trackFreq.entries()).sort((a, b) => b[1] - a[1])
  console.log(`📊 Found ${sortedTracks.length} unique tracks`)
  console.log(`🏆 Top track: ${sortedTracks[0][1]} plays`)

  // ─────────────────────────────────────────────────────────────────────────────
  // Step 3: GROUP A — Life Staples (all plays of tracks with 100+ plays)
  // ─────────────────────────────────────────────────────────────────────────────
  const lifeStapleTracks = new Set(
    sortedTracks.filter(([uri, count]) => count >= 100).map(([uri]) => uri)
  )

  const groupA = allValidEntries.filter((entry) => lifeStapleTracks.has(entry.spotify_track_uri))

  console.log(`💎 GROUP A (Life Staples): ${lifeStapleTracks.size} tracks, ${groupA.length} entries`)

  // ─────────────────────────────────────────────────────────────────────────────
  // Step 4: GROUP B — Era coverage (sample 60 entries per 6-month period)
  // ─────────────────────────────────────────────────────────────────────────────
  // Build 6-month periods from 2019-2025
  const periods = []
  for (let year = 2019; year <= 2025; year++) {
    periods.push(`${year}-H1`) // Jan-Jun
    periods.push(`${year}-H2`) // Jul-Dec
  }

  // For each period, collect non-life-staple entries
  const groupB = []
  const usedEntryIndices = new Set(
    allValidEntries.map((entry, idx) => (lifeStapleTracks.has(entry.spotify_track_uri) ? idx : -1)).filter((idx) => idx >= 0)
  )

  for (const period of periods) {
    const [year, half] = period.split('-')
    const yearNum = parseInt(year)
    const isH2 = half === 'H2'
    const monthStart = isH2 ? 6 : 0 // 0 = Jan, 6 = Jul
    const monthEnd = isH2 ? 12 : 6

    // Get all non-life-staple entries in this period
    const periodEntries = allValidEntries
      .map((entry, idx) => ({ entry, idx }))
      .filter(({ entry, idx }) => {
        if (usedEntryIndices.has(idx)) return false
        if (lifeStapleTracks.has(entry.spotify_track_uri)) return false
        const date = new Date(entry.ts)
        return date.getFullYear() === yearNum && date.getMonth() >= monthStart && date.getMonth() < monthEnd
      })

    // Sample up to 60, randomized
    const sampled = periodEntries
      .sort(() => Math.random() - 0.5)
      .slice(0, 60)
      .map(({ entry, idx }) => {
        usedEntryIndices.add(idx)
        return entry
      })

    groupB.push(...sampled)
  }

  console.log(`📅 GROUP B (Era coverage): ${groupB.length} sampled entries across ${periods.length} periods`)

  // ─────────────────────────────────────────────────────────────────────────────
  // Step 5: Merge, deduplicate, and sort
  // ─────────────────────────────────────────────────────────────────────────────
  const combined = [...groupA, ...groupB]

  // Deduplicate by (ts + uri)
  const seen = new Set()
  const deduped = combined.filter((entry) => {
    const key = `${entry.ts}||${entry.spotify_track_uri}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  // Sort chronologically
  deduped.sort((a, b) => new Date(a.ts) - new Date(b.ts))

  console.log(`🧹 After dedup: ${deduped.length} entries`)

  // ─────────────────────────────────────────────────────────────────────────────
  // Step 6: Strip unused fields
  // ─────────────────────────────────────────────────────────────────────────────
  const FIELDS_TO_KEEP = [
    'ts',
    'ms_played',
    'conn_country',
    'master_metadata_track_name',
    'master_metadata_album_artist_name',
    'master_metadata_album_album_name',
    'spotify_track_uri',
  ]

  const cleaned = deduped.map((entry) => {
    const cleaned = {}
    for (const field of FIELDS_TO_KEEP) {
      if (field in entry) {
        cleaned[field] = entry[field]
      }
    }
    return cleaned
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // Step 7: Write to file
  // ─────────────────────────────────────────────────────────────────────────────
  const json = JSON.stringify(cleaned)
  const sizeKB = (json.length / 1024).toFixed(1)
  const sizeCompressed = (json.length * 0.12).toFixed(0) // rough gzip estimate

  fs.writeFileSync(OUTPUT_FILE, json)
  console.log(`✨ Wrote ${cleaned.length} entries to ${OUTPUT_FILE}`)
  console.log(`📦 Size: ${sizeKB} KB (~${sizeCompressed} KB gzipped)`)
  console.log('')
  console.log('✅ Demo data ready!')
  console.log(`   Run: npm run build && npm run deploy`)
} catch (error) {
  console.error('❌ Error building demo data:', error.message)
  process.exit(1)
}
