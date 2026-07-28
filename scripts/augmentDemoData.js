#!/usr/bin/env node

/**
 * augmentDemoData.js
 *
 * Augments public/demoCountryData.json for a fuller-looking globe:
 *   1. Computes a real Hong Kong entry from the HK plays in demoEntries.json
 *      (HK was missing from COUNTRY_DATA when the demo was first built).
 *   2. Merges a curated set of synthetic countries (recognizable local artists,
 *      strong album covers) so every continent is populated in the sample view.
 *
 * Idempotent: skips any country code already present in demoCountryData.json.
 * Run AFTER scripts/buildDemoData.js:  node scripts/augmentDemoData.js
 * Verify covers resolve on Deezer:     node scripts/augmentDemoData.js --verify
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { COUNTRY_DATA } from '../src/utils/countryData.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const COUNTRY_FILE = path.join(__dirname, '../public/demoCountryData.json')
const ENTRIES_FILE = path.join(__dirname, '../public/demoEntries.json')

// ───────────────────────────────────────────────────────────────────────────
// Curated synthetic countries
// tracks: [trackName, artistName, albumName, playCount]
// ───────────────────────────────────────────────────────────────────────────
const EXTRA_COUNTRIES = [
  // Europe
  { code: 'FR', dates: ['2022-05-14', '2022-05-24'], tracks: [
    ['Get Lucky', 'Daft Punk', 'Random Access Memories', 21],
    ['1901', 'Phoenix', 'Wolfgang Amadeus Phoenix', 16],
    ['La Femme d’argent', 'Air', 'Moon Safari', 12],
    ['D.A.N.C.E.', 'Justice', '†', 9],
  ]},
  { code: 'IT', dates: ['2022-05-25', '2022-06-02'], tracks: [
    ['Beggin’', 'Måneskin', 'Chosen', 14],
    ['Experience', 'Ludovico Einaudi', 'In a Time Lapse', 11],
    ['Piece Of Your Heart', 'MEDUZA', 'Piece Of Your Heart', 8],
  ]},
  { code: 'ES', dates: ['2023-04-08', '2023-04-18'], tracks: [
    ['DESPECHÁ', 'ROSALÍA', 'MOTOMAMI +', 19],
    ['Tú Me Dejaste De Querer', 'C. Tangana', 'El Madrileño', 13],
    ['Columbia', 'Quevedo', 'DONDE QUIERO ESTAR', 10],
  ]},
  { code: 'PT', dates: ['2023-04-19', '2023-04-24'], tracks: [
    ['Amar pelos dois', 'Salvador Sobral', 'Excuse Me', 9],
    ['Hangover (BaBaBa)', 'Buraka Som Sistema', 'Komba', 7],
    ['Tequila', 'Nenny', 'Bússola', 5],
  ]},
  { code: 'SE', dates: ['2024-06-10', '2024-06-16'], tracks: [
    ['Dancing On My Own', 'Robyn', 'Body Talk Pt. 1', 15],
    ['Gimme! Gimme! Gimme! (A Man After Midnight)', 'ABBA', 'Voulez-Vous', 12],
    ['Wake Me Up', 'Avicii', 'True', 10],
  ]},
  { code: 'GR', dates: ['2024-06-17', '2024-06-25'], tracks: [
    ['ZARI', 'Marina Satti', 'P.O.P.', 11],
    ['Mantissa', 'Marina Satti', 'YENNA', 8],
    ['S’ Agapo', 'Antonis Remos', 'Kleista Ta Stomata', 5],
  ]},
  // South America
  { code: 'AR', dates: ['2023-11-02', '2023-11-12'], tracks: [
    ['Quevedo: Bzrp Music Sessions, Vol. 52', 'Bizarrap', 'Bzrp Music Sessions, Vol. 52', 18],
    ['SANA SANA', 'Nathy Peluso', 'Calambre', 12],
    ['Goteo', 'Duki', 'Súpe', 9],
  ]},
  { code: 'CO', dates: ['2023-11-13', '2023-11-20'], tracks: [
    ['Hips Don’t Lie', 'Shakira', 'Oral Fixation, Vol. 2', 16],
    ['Mi Gente', 'J Balvin', 'Mi Gente', 12],
    ['PROVENZA', 'KAROL G', 'MAÑANA SERÁ BONITO', 10],
  ]},
  { code: 'CL', dates: ['2023-11-21', '2023-11-27'], tracks: [
    ['Tu Falta De Querer', 'Mon Laferte', 'Mon Laferte, Vol. 1', 12],
    ['Ultra Solo', 'Polimá Westcoast', 'Ultra Solo', 8],
    ['Gracias a la Vida', 'Violeta Parra', 'Las Últimas Composiciones', 6],
  ]},
  { code: 'PE', dates: ['2023-11-28', '2023-12-04'], tracks: [
    ['María Landó', 'Susana Baca', 'Susana Baca', 8],
    ['Cariñito', 'Los Hijos Del Sol', 'Cariñito', 6],
    ['Sonido Amazonico', 'Los Mirlos', 'El Milagro Verde', 4],
  ]},
  // Africa
  { code: 'ZA', dates: ['2024-09-05', '2024-09-15'], tracks: [
    ['Water', 'Tyla', 'Water', 17],
    ['Jerusalema (feat. Nomcebo Zikode)', 'Master KG', 'Jerusalema', 13],
    ['Drive (feat. Delilah Montagu)', 'Black Coffee', 'Music Is King', 9],
  ]},
  { code: 'NG', dates: ['2024-09-16', '2024-09-24'], tracks: [
    ['Last Last', 'Burna Boy', 'Love, Damini', 18],
    ['Essence (feat. Tems)', 'Wizkid', 'Made In Lagos', 14],
    ['Zombie', 'Fela Kuti', 'Zombie', 10],
  ]},
  { code: 'EG', dates: ['2024-09-25', '2024-10-01'], tracks: [
    ['Tamally Maak', 'Amr Diab', 'Tamally Maak', 11],
    ['3 Daqat', 'Abu', '3 Daqat', 8],
    ['Ana Negm', 'Cairokee', 'Telk Qadeya', 5],
  ]},
  { code: 'MA', dates: ['2024-10-02', '2024-10-08'], tracks: [
    ['LM3ALLEM', 'Saad Lamjarred', 'LM3ALLEM', 10],
    ['SLAY', 'Manal', 'SLAY', 7],
    ['Blue Love', 'ElGrandeToto', '27', 5],
  ]},
  // Oceania
  { code: 'AU', dates: ['2025-02-10', '2025-02-22'], tracks: [
    ['The Less I Know The Better', 'Tame Impala', 'Currents', 22],
    ['Never Be Like You (feat. Kai)', 'Flume', 'Skin', 15],
    ['Innerbloom', 'RÜFÜS DU SOL', 'Bloom', 11],
  ]},
  { code: 'NZ', dates: ['2025-02-23', '2025-03-02'], tracks: [
    ['Royals', 'Lorde', 'Pure Heroine', 14],
    ['Supalonely', 'BENEE', 'STELLA & STEVE', 10],
    ['Don’t Forget Your Roots', 'Six60', 'Six60', 6],
  ]},
  // Northern / Central Asia
  { code: 'RU', dates: ['2021-08-04', '2021-08-14'], tracks: [
    ['All The Things She Said', 't.A.T.u.', '200 KM/H In The Wrong Lane', 14],
    ['Skibidi (Romantic Edition)', 'Little Big', 'Skibidi', 10],
    ['Gruppa krovi', 'Kino', 'Gruppa krovi', 7],
  ]},
  { code: 'KZ', dates: ['2021-08-15', '2021-08-22'], tracks: [
    ['Roses (Imanbek Remix)', 'SAINt JHN', 'Roses (Imanbek Remix)', 13],
    ['SOS d’un terrien en détresse', 'Dimash Kudaibergen', 'iD', 8],
    ['Adai', 'Imanbek', 'Adai', 5],
  ]},
  { code: 'MN', dates: ['2021-08-23', '2021-08-29'], tracks: [
    ['Wolf Totem', 'The HU', 'The Gereg', 11],
    ['Yuve Yuve Yu', 'The HU', 'The Gereg', 8],
    ['Sad But True', 'The HU', 'Rumble of Thunder', 5],
  ]},
  { code: 'UA', dates: ['2021-09-01', '2021-09-08'], tracks: [
    ['SHUM', 'Go_A', 'SHUM', 10],
    ['Obiymy', 'Okean Elzy', 'Zemlya', 7],
    ['Stefania (Kalush Orchestra)', 'KALUSH', 'Stefania (Kalush Orchestra)', 5],
  ]},
  // Africa — East & West additions
  { code: 'SN', dates: ['2024-10-09', '2024-10-15'], tracks: [
    ['7 Seconds (feat. Neneh Cherry)', 'Youssou N’Dour', 'The Guide (Wommat)', 12],
    ['Birima', 'Youssou N’Dour', 'Joko', 7],
    ['African Woman', 'Baaba Maal', 'Being', 4],
  ]},
  { code: 'KE', dates: ['2024-10-16', '2024-10-22'], tracks: [
    ['Suzanna', 'Sauti Sol', 'Midnight Train', 11],
    ['Sura Yako', 'Sauti Sol', 'Live and Die in Afrika', 8],
    ['Sipangwingwi', 'Ssaru', 'Sipangwingwi', 4],
  ]},
  { code: 'GH', dates: ['2024-10-23', '2024-10-29'], tracks: [
    ['SAD GIRLZ LUV MONEY', 'Amaarae', 'THE ANGEL YOU DON’T KNOW', 13],
    ['Adonai', 'Sarkodie', 'Sarkology', 8],
    ['Forever', 'Gyakie', 'Seed', 5],
  ]},
  { code: 'TZ', dates: ['2024-10-30', '2024-11-05'], tracks: [
    ['Jeje', 'Diamond Platnumz', 'First Of All', 12],
    ['Tetema', 'Rayvanny', 'Tetema', 8],
    ['Kwa Ngwaru', 'Harmonize', 'Kwa Ngwaru', 5],
  ]},
  // Asia / Mideast
  { code: 'IN', dates: ['2025-05-03', '2025-05-14'], tracks: [
    ['Jai Ho', 'A.R. Rahman', 'Slumdog Millionaire', 13],
    ['Tum Hi Ho', 'Arijit Singh', 'Aashiqui 2', 11],
    ['G.O.A.T.', 'Diljit Dosanjh', 'G.O.A.T.', 8],
  ]},
  { code: 'TR', dates: ['2025-05-15', '2025-05-22'], tracks: [
    ['Şımarık', 'Tarkan', 'Ölürüm Sana', 12],
    ['Goca Dünya', 'Altın Gün', 'Gece', 8],
    ['Aman Aman', 'Altın Gün', 'On', 6],
  ]},
]

const AVG_TRACK_MS = 210_000 // ~3.5 min per play

function buildCountry({ code, dates, tracks }) {
  const geo = COUNTRY_DATA[code]
  if (!geo) throw new Error(`No COUNTRY_DATA coords for ${code}`)

  const topTracks = tracks.map(([trackName, artistName, albumName, playCount]) => ({
    trackName,
    artistName,
    albumName,
    spotifyTrackUri: null,
    playCount,
    totalMsPlayed: playCount * AVG_TRACK_MS,
    concentrationScore: Math.round((0.82 + (playCount % 5) * 0.04) * 100) / 100,
  }))

  // Trip DNA: same tracks, ordered by concentration
  const topTracksByConcentration = [...topTracks].sort(
    (a, b) => b.concentrationScore - a.concentrationScore || b.playCount - a.playCount
  )

  // Aggregate artists from track list
  const artistMap = new Map()
  for (const t of topTracks) {
    artistMap.set(t.artistName, (artistMap.get(t.artistName) || 0) + t.playCount)
  }
  const topArtists = [...artistMap.entries()]
    .map(([artistName, playCount]) => ({ artistName, playCount: Math.round(playCount * 1.6) }))
    .sort((a, b) => b.playCount - a.playCount)
    .slice(0, 5)

  const topPlays = topTracks.reduce((s, t) => s + t.playCount, 0)
  const trackCount = Math.round(topPlays * 3.2) // top tracks are a subset of all plays
  const totalMsPlayed = trackCount * AVG_TRACK_MS

  return {
    code,
    name: geo.name,
    lat: geo.lat,
    lng: geo.lng,
    totalMsPlayed,
    trackCount,
    dateStart: `${dates[0]}T00:00:00Z`,
    dateEnd: `${dates[1]}T00:00:00Z`,
    topTracks,
    topTracksByConcentration,
    topArtists,
  }
}

// ───────────────────────────────────────────────────────────────────────────
// Real HK entry computed from demoEntries.json (dropped by the original build
// because COUNTRY_DATA lacked HK at the time)
// ───────────────────────────────────────────────────────────────────────────
function buildHongKong() {
  const entries = JSON.parse(fs.readFileSync(ENTRIES_FILE, 'utf8')).filter((e) => e.cc === 'HK')
  if (!entries.length) return null
  const geo = COUNTRY_DATA.HK

  const trackMap = new Map()
  const artistMap = new Map()
  let totalMsPlayed = 0
  let dateStart = entries[0].ts
  let dateEnd = entries[0].ts

  for (const e of entries) {
    totalMsPlayed += e.ms
    if (e.ts < dateStart) dateStart = e.ts
    if (e.ts > dateEnd) dateEnd = e.ts

    const key = e.uri || `${e.ar}:${e.t}`
    if (!trackMap.has(key)) {
      trackMap.set(key, {
        trackName: e.t,
        artistName: e.ar,
        albumName: e.al,
        spotifyTrackUri: e.uri,
        playCount: 0,
        totalMsPlayed: 0,
        concentrationScore: 1, // computed against HK-only entries; treat as exclusive
      })
    }
    const stat = trackMap.get(key)
    stat.playCount += 1
    stat.totalMsPlayed += e.ms

    artistMap.set(e.ar, (artistMap.get(e.ar) || 0) + 1)
  }

  const topTracks = [...trackMap.values()]
    .sort((a, b) => b.playCount - a.playCount || b.totalMsPlayed - a.totalMsPlayed)
    .slice(0, 10)

  return {
    code: 'HK',
    name: geo.name,
    lat: geo.lat,
    lng: geo.lng,
    totalMsPlayed,
    trackCount: entries.length,
    dateStart,
    dateEnd,
    topTracks,
    topTracksByConcentration: topTracks,
    topArtists: [...artistMap.entries()]
      .map(([artistName, playCount]) => ({ artistName, playCount }))
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, 5),
  }
}

// ───────────────────────────────────────────────────────────────────────────
// --verify: check every curated track resolves on Deezer
// ───────────────────────────────────────────────────────────────────────────
async function verify() {
  let misses = 0
  for (const c of EXTRA_COUNTRIES) {
    for (const [trackName, artistName] of c.tracks) {
      const q = encodeURIComponent(`${artistName} ${trackName}`)
      const res = await fetch(`https://api.deezer.com/search/track?q=${q}&limit=1`)
      const data = await res.json()
      const cover = data.data?.[0]?.album?.cover_medium
      if (!cover) {
        misses++
        console.log(`  MISS ${c.code}: "${trackName}" by ${artistName}`)
      } else {
        console.log(`  ok   ${c.code}: "${trackName}" by ${artistName}`)
      }
      await new Promise((r) => setTimeout(r, 250))
    }
  }
  console.log(misses ? `\n${misses} track(s) need swapping.` : '\nAll tracks resolve on Deezer.')
  process.exit(misses ? 1 : 0)
}

// ───────────────────────────────────────────────────────────────────────────
async function main() {
  if (process.argv.includes('--verify')) return verify()

  const countryData = JSON.parse(fs.readFileSync(COUNTRY_FILE, 'utf8'))
  let added = 0

  const hk = buildHongKong()
  if (hk && !countryData.HK) {
    countryData.HK = hk
    added++
    console.log(`Added HK (real data: ${hk.trackCount} plays)`)
  }

  for (const c of EXTRA_COUNTRIES) {
    if (countryData[c.code]) {
      console.log(`Skip ${c.code} (already present)`)
      continue
    }
    countryData[c.code] = buildCountry(c)
    added++
    console.log(`Added ${c.code} (${countryData[c.code].name})`)
  }

  fs.writeFileSync(COUNTRY_FILE, JSON.stringify(countryData))
  console.log(`\nDone: ${added} countries added, ${Object.keys(countryData).length} total.`)
}

main()
