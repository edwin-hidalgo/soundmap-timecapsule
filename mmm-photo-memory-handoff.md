# mymusicmemory — Photo × Listening Join: Feature Handoff

**Purpose of this doc:** Context handoff from a claude.ai ideation session (Aug 3, 2026) into the mmmemory Claude Code project. Goal: continue ideating, refine into an implementation plan, then build. Read alongside the existing codebase at `~/Documents/soundmap-timecapsule` (live at mymusicmemory.xyz).

---

## 1. Project context (current state)

- mymusicmemory.xyz ("mmm") grew out of the original WAX project (Jan 2026). It is now the **mirror layer**: users connect their Spotify listening data and get interesting stats.
- Already built and working:
  - Spotify OAuth (token handling, refresh, API calls)
  - Extended streaming history upload + parsing (the full JSON export)
  - Globe visualization mapping listening by location, derived from Spotify's IP-based `conn_country` data
- Publicly framed as "my own version of Spotify Wrapped." Launch posts ran on X in late July with the globe as the hero asset.

## 2. The new feature (the vision)

**Let users connect their photo library so images/videos get associated with the songs they were listening to at that moment — and pin both to the globe.**

Two distinct payoffs, and it's important not to collapse them:

1. **Geo precision.** Spotify's IP data resolves to country-level at best. Photo EXIF GPS is device-GPS — meters, not countries. Photos upgrade globe pins from "Portugal" to "that street in Lisbon."
2. **The memory artifact (the bigger one).** A pin with a song is a stat. A pin with the song *and the actual photo from that night* is a memory machine. This is the MEAMs thesis (music-evoked autobiographical memories — mmm's core positioning) made bidirectional: see the photo, hear the soundtrack; hear the song, see the moment.

Structural advantage: this is a **timestamp join between two datasets the user already has**. Zero user effort, no journaling, fully retroactive across years of history. The best kind of feature.

## 3. Core design principles

- **Sparse overlap is a feature, not a bug.** Most photos have no concurrent listening; most listening has no photos. The intersection — trips, nights out, parties — is exactly the high-emotion subset. Product framing: "where they overlap, magic." Never promise a song for every photo.
- **Match at session level, celebrate exact hits.** Default join: photo → the listening session around it (e.g., ±2h cluster) → "the soundtrack of that evening." Exact-moment matches (photo timestamp falls inside a track's reconstructed playback interval via `ts` + `ms_played`) are the hero moments — surface them with special treatment ("you were literally listening to X when you took this").
- **Local-first privacy, ostentatiously.** Photos + location + listening is the most intimate data stack possible. Extract EXIF client-side / on-device; only derived pins (timestamp, lat/lon, thumbnail reference) touch the server — or keep it fully client-side if feasible. This is both correct and a marketing line ("your photos never leave your device"), consistent with the broader transparency brand (ONUS).

## 4. Known technical landmines

### 4.1 The timezone join (THE bug source)
- Spotify extended history `ts` is **UTC**.
- Photo EXIF `DateTimeOriginal` is **local time**, and the `OffsetTimeOriginal` field (EXIF 2.31+) is inconsistently populated across devices.
- Without careful normalization, Tokyo photos pin to yesterday's songs. Mitigations to explore:
  - Prefer platform-level creation dates with timezone where available (e.g., photo library metadata rather than raw EXIF).
  - Infer offset from the photo's own GPS coordinates (lat/lon → timezone at that date). This is the robust path: GPS + local time → true UTC.
  - Fall back to user's home timezone with a confidence flag when no GPS.

### 4.2 Photo filtering
- Only camera originals carry GPS. Screenshots, WhatsApp/Telegram saves, downloaded images have none (and often bogus timestamps). Filter hard on EXIF presence + source heuristics.
- Videos: same join logic applies; QuickTime/MP4 metadata has creation date + GPS on iPhone captures.

### 4.3 Platform reality — the first architecture decision
mmm is currently a web app. Photo access options differ sharply by platform:

- **Web (current stack):** manual upload (drag a folder / select files — EXIF parsed client-side, e.g., exifr) or Google Photos **Picker API**.
- **Google Photos:** the Library API's read scopes were removed March 31, 2025. Third-party apps can no longer read a user's library; remaining Library API methods only work on media the app itself created. The sanctioned path is the **Picker API** — user manually selects photos/albums per session. So: no passive full-library sync via Google, ever. "Pick your trip album" is the ceiling.
- **Apple:** iCloud Photos has **no public web API**. Full-library passive access requires a native iOS app using PhotoKit (full-library permission). This is the only route to the "it just works across your whole life" experience.

**Decision to make in ideation:** Is v1 a web feature (manual upload / Picker — cheap, ships fast, fits current stack) with native iOS as the v2 unlock? Recommended default: yes — web MVP first, treat iOS-native as a separate later bet.

## 5. Suggested phasing (starting point, refine in ideation)

**Phase 1 — Web MVP: manual upload join**
- User drags in photos (e.g., a trip folder). Client-side EXIF extraction (timestamp, GPS).
- Timezone normalization pipeline (GPS-derived offset).
- Join engine: session-level matching + exact-moment detection against already-uploaded extended history.
- Globe upgrade: photo-anchored pins at city/street precision; photo + track(s) in the pin detail view.
- One shareable artifact (this is a growth feature — every output should be screenshottable, consistent with the Wrapped positioning).

**Phase 2 — Google Photos Picker**
- Reduce friction for Google users: pick albums instead of uploading files. Same join pipeline.

**Phase 3 — Additional data sources (see §6) and/or native iOS**
- Native iOS = full-library passive sync + potentially ongoing capture. Separate scoping exercise.

## 6. Data-source roadmap beyond photos (ranked from ideation)

The reframe underneath this feature: **mmm stops being a stats mirror and becomes the join engine for the user's timestamped life data, with listening history as the spine.** Each source below is another join against the same spine:

1. **Google Maps Timeline export** — the *direct* answer to the geo-precision problem, more than photos: continuous lat/lon for years, densifies the entire globe rather than just photo-adjacent moments. (Note: Timeline moved on-device in 2024–25; users export from their phone now, not Takeout. Verify current export format when building.) Photos for emotion, Timeline for coverage.
2. **Ticket/concert data** — Gmail receipt parsing (DICE, Ticketmaster, etc.) + setlist.fm API. Join attendance with listening spikes: "you streamed them 40× the week after seeing them live." Closes the live-music loop. Gmail parsing also nets flights/hotels = geo anchors → "first song in every new city" gets razor-sharp.
3. **Workouts** — Strava / Apple Health: routes + timestamps → running soundtracks, pace-vs-BPM. Extremely shareable.
4. **Historical weather** — needs zero permissions; joins on time+place already in hand. Rainy-day artists, heatwave albums. Pure Wrapped candy, cheap to build.
5. **Calendar** — context labels: pre-flight albums, what played before big meetings.

## 7. Open questions for the ideation session

1. Web MVP vs. going straight to native iOS — confirm the sequencing (§4.3).
2. Join window design: what defines a "session"? Fixed ±2h, gap-based clustering on the listening data, or place-change boundaries?
3. Storage model: fully client-side (photos never uploaded) vs. thumbnails server-side for persistence/sharing. What does the shareable artifact require?
4. What is the hero shareable output? (Photo + track card? Animated globe flythrough with photos? "This night" recap?)
5. How do photo-derived pins coexist with IP-derived country pins on the globe — visual hierarchy, confidence levels?
6. Does the join engine become a first-class abstraction now (anticipating §6 sources), or is that premature for v1?
7. Data model: `moment` as a new entity (timestamp, location, media refs, matched tracks, confidence) — schema design.

## 8. Constraints recap for Claude Code

- Reuse existing Spotify OAuth + extended-history parsing; don't rebuild.
- EXIF/GPS extraction happens client-side. No raw photo uploads to server in v1 unless the shareable-artifact decision (§7.3) demands thumbnails.
- Timezone normalization is a dedicated, tested module — not inline logic. Write tests with cross-timezone fixtures before building UI.
- Every user-facing output should be screenshot/share-ready.
