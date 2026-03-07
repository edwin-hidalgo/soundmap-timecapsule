/**
 * normalizeEntry.js
 *
 * Shared helpers for detecting and normalizing Spotify's two export formats:
 *   - Basic (StreamingHistory_music_*.json) — available immediately, no country data
 *   - Extended (Streaming_History_Audio_*.json) — takes 5-30 days, full data
 *
 * Used by both UploadScreen.jsx (validation hint) and uploadWorker.js (processing).
 */

/**
 * Returns true if the entry is from Spotify's standard Account Data format.
 * Basic entries have endTime + msPlayed instead of ts + ms_played.
 */
export function isBasicEntry(entry) {
  return 'endTime' in entry && 'msPlayed' in entry && !('ts' in entry)
}

/**
 * Converts a basic-format entry to extended-format schema so both formats
 * can be processed by the same pipeline.
 */
export function normalizeBasicEntry(entry) {
  // Convert "2025-03-04 08:26" → "2025-03-04T08:26:00Z"
  const ts = entry.endTime.replace(' ', 'T') + ':00Z'
  return {
    ts,
    ms_played: entry.msPlayed,
    master_metadata_track_name: entry.trackName || null,
    master_metadata_album_artist_name: entry.artistName || null,
    master_metadata_album_album_name: null,
    conn_country: 'US', // not available in basic format — default to US
    spotify_track_uri: `synthetic:${entry.artistName}:${entry.trackName}`,
  }
}
