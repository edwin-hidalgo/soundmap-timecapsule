#!/usr/bin/env node

/**
 * buildDemoData.js
 *
 * Builds full unsampled demo data from Edwin's Spotify extended streaming history (2020–2026).
 * Outputs two files:
 *   - public/demoCountryData.json: Pre-computed map aggregations (tiny, loads fast)
 *   - public/demoEntries.json: Full 127k+ entries with shortened field names
 *
 * The shortened field names reduce file size ~45% (36MB → 20MB raw, ~2.5MB gzipped).
 * Field name mapping:
 *   ts → ts, ms_played → ms, conn_country → cc,
 *   master_metadata_track_name → t, master_metadata_album_artist_name → ar,
 *   master_metadata_album_album_name → al, spotify_track_uri → uri
 *
 * Run: node scripts/buildDemoData.js
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { parseStreamingHistory } from '../src/utils/parseStreamingHistory.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const DATA_DIR = '/Users/edwinhidalgo/Documents/music-id-app/Edwin-Spotify-Data/Spotify Extended Streaming History/'
const OUTPUT_ENTRIES = path.join(__dirname, '../public/demoEntries.json')
const OUTPUT_COUNTRY = path.join(__dirname, '../public/demoCountryData.json')

// Source files covering 2020–2026 (11 files, all unsampled)
const SOURCE_FILES = [
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

console.log('🎵 Building full unsampled demo data (2020–2026)...')
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
    // - ms_played >= 30000 (30 seconds minimum)
    // - Has track name and URI
    // - conn_country exists (not null/undefined)
    const validEntries = entries.filter((entry) => {
      if (!entry.ms_played || entry.ms_played < 30000) return false
      if (!entry.master_metadata_track_name) return false
      if (!entry.spotify_track_uri) return false
      if (!entry.conn_country) return false
      return true
    })

    allValidEntries = allValidEntries.concat(validEntries)
    fileCount++
    console.log(`  ✓ ${validEntries.length} valid entries from this file`)
  }

  console.log(`\n✅ Loaded ${allValidEntries.length} valid entries from ${fileCount} files`)

  // ─────────────────────────────────────────────────────────────────────────────
  // Step 2: Deduplicate by (ts + uri)
  // ─────────────────────────────────────────────────────────────────────────────
  const seen = new Set()
  const deduped = allValidEntries.filter((entry) => {
    const key = `${entry.ts}||${entry.spotify_track_uri}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  console.log(`🧹 After dedup: ${deduped.length} entries`)

  // ─────────────────────────────────────────────────────────────────────────────
  // Step 3: Sort chronologically
  // ─────────────────────────────────────────────────────────────────────────────
  deduped.sort((a, b) => new Date(a.ts) - new Date(b.ts))

  // ─────────────────────────────────────────────────────────────────────────────
  // Step 4: Pre-compute country data using parseStreamingHistory
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('🗺️  Computing country aggregations...')
  const countryData = parseStreamingHistory([deduped])
  console.log(`✓ ${Object.keys(countryData).length} countries with listening data`)

  // ─────────────────────────────────────────────────────────────────────────────
  // Step 5: Shorten field names to reduce file size
  // ─────────────────────────────────────────────────────────────────────────────
  const shortEntries = deduped.map((e) => ({
    ts: e.ts,
    ms: e.ms_played,
    cc: e.conn_country,
    t: e.master_metadata_track_name,
    ar: e.master_metadata_album_artist_name,
    al: e.master_metadata_album_album_name,
    uri: e.spotify_track_uri,
  }))

  // ─────────────────────────────────────────────────────────────────────────────
  // Step 6: Write output files
  // ─────────────────────────────────────────────────────────────────────────────
  const entriesJson = JSON.stringify(shortEntries)
  const countryJson = JSON.stringify(countryData)

  const entriesKB = (entriesJson.length / 1024).toFixed(1)
  const entriesCompressed = (entriesJson.length * 0.12).toFixed(0) // rough gzip estimate
  const countryKB = (countryJson.length / 1024).toFixed(1)

  fs.writeFileSync(OUTPUT_ENTRIES, entriesJson)
  fs.writeFileSync(OUTPUT_COUNTRY, countryJson)

  console.log(`\n✨ Written output files:`)
  console.log(`   📝 demoEntries.json: ${entriesKB} KB (~${entriesCompressed} KB gzipped)`)
  console.log(`   🗺️  demoCountryData.json: ${countryKB} KB`)
  console.log('')
  console.log('✅ Demo data ready!')
  console.log(`   Next: npm run build && npm run deploy`)
} catch (error) {
  console.error('❌ Error building demo data:', error.message)
  process.exit(1)
}
