import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { parseStreamingHistory } from '../utils/parseStreamingHistory.js'
// Note: demoData.js is superseded by demoEntries.json (fetched and parsed dynamically)

/**
 * UploadScreen — Screen 1: File upload & demo entry point
 *
 * Props:
 *   onDataReady(processedData: Object) — called after parsing is complete,
 *     triggers transition to MapView
 *
 * States:
 *   - idle: upload zone visible
 *   - processing: spinner shown, files being read/parsed
 *   - error: error message shown, user can retry
 */
export default function UploadScreen({ onDataReady }) {
  const [status, setStatus] = useState('idle')      // 'idle' | 'processing' | 'error'
  const [error, setError] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const fileInputRef = useRef(null)
  const canvasRef = useRef(null)
  const waveCanvasRef = useRef(null)

  // ─────────────────────────────────────────────────────────────────────────
  // Spotify Streaming History Format Detection & Normalization
  // ─────────────────────────────────────────────────────────────────────────
  // Supports two formats:
  // 1. Basic (StreamingHistory_music_*.json) — immediate, no country data
  // 2. Extended (Streaming_History_Audio_*.json) — 5–30 days, full data
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Detect if entry is from Spotify's standard Account Data format
   * (StreamingHistory_music_*.json, available immediately)
   */
  function isBasicEntry(entry) {
    return 'endTime' in entry && 'msPlayed' in entry && !('ts' in entry)
  }

  /**
   * Normalize basic format entry to extended format schema
   * Allows both formats to be processed by the same parser
   */
  function normalizeBasicEntry(entry) {
    // Convert "2025-03-04 08:26" to "2025-03-04T08:26:00Z"
    const ts = entry.endTime.replace(' ', 'T') + ':00Z'
    return {
      ts,
      ms_played: entry.msPlayed,
      master_metadata_track_name: entry.trackName || null,
      master_metadata_album_artist_name: entry.artistName || null,
      master_metadata_album_album_name: null,
      conn_country: 'US',  // not available in basic format — default to US
      spotify_track_uri: `synthetic:${entry.artistName}:${entry.trackName}`,
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Canvas Dithering Animation — Forest Green Wave Dots
  // ───────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: false })

    // Bayer 4x4 ordered dither matrix
    const bayer4 = [
      [0, 8, 2, 10],
      [12, 4, 14, 6],
      [3, 11, 1, 9],
      [15, 7, 13, 5],
    ]

    // Color palette — our design system
    const COLOR_BG = [26, 24, 21]       // --color-bg-primary
    const COLOR_DOT = [61, 120, 80]     // --color-accent (forest green)

    const scale = 2  // pixel block size — smaller = finer, denser dots
    let width, height, time = 0
    let animId

    function resize() {
      width = Math.ceil(canvas.clientWidth / scale)
      height = Math.ceil(canvas.clientHeight / scale)
      canvas.width = width
      canvas.height = height
    }

    function draw() {
      const imageData = ctx.createImageData(width, height)
      const data = imageData.data
      time += 0.025

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4

          // Wave signal — layered sine waves for flowing organic motion
          let signal =
            Math.sin(x * 0.08 + time * 0.8) +
            Math.sin(y * 0.06 + time * 0.5) +
            Math.sin((x + y) * 0.04 + time * 1.2) * 0.5

          // Normalize to 0–1
          let value = Math.max(0, Math.min(1, (signal + 2.5) / 5))

          // Bayer threshold dither
          const threshold = bayer4[y % 4][x % 4] / 16
          const isDot = value > threshold

          const color = isDot ? COLOR_DOT : COLOR_BG
          data[idx]     = color[0]
          data[idx + 1] = color[1]
          data[idx + 2] = color[2]
          data[idx + 3] = 255
        }
      }

      ctx.putImageData(imageData, 0, 0)
      animId = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize)
    animId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  // ───────────────────────────────────────────────────────────────────────────
  // Canvas Spectral Waveform — Music Visualizer Strip
  // ───────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = waveCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let time = 0
    let animId

    function resize() {
      canvas.width = canvas.clientWidth
      canvas.height = canvas.clientHeight
    }

    function draw() {
      const w = canvas.width
      const h = canvas.height
      time += 0.012

      // Clear
      ctx.clearRect(0, 0, w, h)

      // Spectral bars — vertical lines from center, like a music visualizer
      ctx.beginPath()
      ctx.strokeStyle = 'rgba(61, 120, 80, 0.7)'
      ctx.lineWidth = 1.5

      for (let x = 0; x < w; x += 3) {
        const noise = Math.sin(x * 0.05 + time * 8) * 12
        const barH = (Math.sin(x * 0.015 + time * 3) * 0.5 + 0.5) * (h * 0.7) + noise
        const yCenter = h / 2
        ctx.moveTo(x, yCenter - barH / 2)
        ctx.lineTo(x, yCenter + barH / 2)
      }
      ctx.stroke()

      // Faint grid lines scrolling left
      ctx.strokeStyle = 'rgba(61, 120, 80, 0.08)'
      ctx.lineWidth = 1
      for (let i = 0; i < w; i += 60) {
        const offset = i - ((time * 60) % 60)
        ctx.beginPath()
        ctx.moveTo(offset, 0)
        ctx.lineTo(offset, h)
        ctx.stroke()
      }

      animId = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize)
    animId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  // ───────────────────────────────────────────────────────────────────────────
  // File Reading & Parsing Pipeline
  // ───────────────────────────────────────────────────────────────────────────
  async function handleFiles(fileList) {
    setStatus('processing')
    setError(null)

    try {
      // Read all files in parallel using FileReader
      const arrays = await Promise.all(
        Array.from(fileList).map(
          (file) =>
            new Promise((resolve, reject) => {
              const reader = new FileReader()

              reader.onload = (e) => {
                try {
                  const parsed = JSON.parse(e.target.result)
                  resolve(parsed)
                } catch {
                  reject(new Error(`"${file.name}" is not valid JSON`))
                }
              }

              reader.onerror = () => {
                reject(new Error(`Could not read "${file.name}"`))
              }

              reader.readAsText(file)
            })
        )
      )

      // Validate: each parsed result must be an array
      if (!arrays.every(Array.isArray)) {
        throw new Error('Files must contain Spotify streaming history arrays')
      }

      // Validate: at least one entry looks like Spotify data (basic or extended format)
      const sample = arrays.flat()[0]
      if (!sample || (!('ms_played' in sample) && !('msPlayed' in sample))) {
        throw new Error('No Spotify streaming history found in these files')
      }

      // Flatten and normalize all entries to extended format
      const flat = arrays.flat()
      const normalized = flat.map(e => isBasicEntry(e) ? normalizeBasicEntry(e) : e)

      // Dedup cross-format: extended entries take priority over basic
      // If same play appears in both standard and extended exports, keep extended
      // Key: ts (minute-level), trackName, artistName
      const extendedKeys = new Set()
      for (const e of normalized) {
        if (!e.spotify_track_uri?.startsWith('synthetic:')) {
          extendedKeys.add(`${e.ts.substring(0, 16)}||${e.master_metadata_track_name}||${e.master_metadata_album_artist_name}`)
        }
      }
      const deduped = normalized.filter(e => {
        if (!e.spotify_track_uri?.startsWith('synthetic:')) return true // keep all extended
        const key = `${e.ts.substring(0, 16)}||${e.master_metadata_track_name}||${e.master_metadata_album_artist_name}`
        return !extendedKeys.has(key) // drop basic if extended version exists
      })

      const allRawEntries = deduped

      // Parse with data layer
      const result = parseStreamingHistory([deduped])

      if (Object.keys(result).length === 0) {
        throw new Error(
          'No music plays found after filtering (need >30s plays from known countries)'
        )
      }

      // Detect what format(s) were uploaded for UI/UX enhancements
      const hasBasic = flat.some(e => isBasicEntry(e))
      const hasExtended = flat.some(e => !isBasicEntry(e))
      const dataFormat = hasBasic && hasExtended ? 'mixed' : hasBasic ? 'basic' : 'extended'

      // Success: call parent callback, App.jsx will trigger screen transition
      // Pass both processed countryData, raw entries, and format type
      onDataReady(result, allRawEntries, dataFormat)
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Drag-and-Drop Handlers
  // ───────────────────────────────────────────────────────────────────────────
  function onDragOver(e) {
    e.preventDefault()
    setIsDragOver(true)
  }

  function onDragLeave(e) {
    e.preventDefault()
    setIsDragOver(false)
  }

  function onDrop(e) {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    if (files.length) {
      handleFiles(files)
    }
  }

  function onInputChange(e) {
    if (e.target.files.length) {
      handleFiles(e.target.files)
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Demo Handler
  // ───────────────────────────────────────────────────────────────────────────
  // Loads pre-computed demoCountryData.json (fast, small) in parallel with
  // demoEntries.json (shortened field names). Expands field names back to
  // full Spotify format for downstream compatibility.
  async function handleDemo() {
    setStatus('processing')
    setError(null)

    try {
      // Fetch both files in parallel for speed
      const [countryRes, entriesRes] = await Promise.all([
        fetch('/demoCountryData.json'),
        fetch('/demoEntries.json'),
      ])

      if (!countryRes.ok || !entriesRes.ok) {
        throw new Error('Demo data unavailable. Please try uploading your own data.')
      }

      const [countryData, shortEntries] = await Promise.all([
        countryRes.json(),
        entriesRes.json(),
      ])

      if (Object.keys(countryData).length === 0 || !Array.isArray(shortEntries) || shortEntries.length === 0) {
        throw new Error('No demo data found')
      }

      // Expand short field names back to Spotify format for downstream compatibility
      // Field name mapping: ts→ts, ms→ms_played, cc→conn_country, t→master_metadata_track_name, etc.
      const entries = shortEntries.map((e) => ({
        ts: e.ts,
        ms_played: e.ms,
        conn_country: e.cc,
        master_metadata_track_name: e.t,
        master_metadata_album_artist_name: e.ar,
        master_metadata_album_album_name: e.al,
        spotify_track_uri: e.uri,
      }))

      // Pass both parsed country stats, expanded raw entries, and format (demo is extended format)
      onDataReady(countryData, entries, 'extended')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <motion.div
      key="upload"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="grain-overlay w-full h-full flex items-center justify-center relative overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse 80% 60% at 10% 80%, rgba(61,120,80,0.08) 0%, transparent 60%),
          radial-gradient(ellipse 60% 50% at 90% 10%, rgba(61,120,80,0.05) 0%, transparent 55%),
          rgb(26, 24, 21)
        `,
      }}
    >
      {/* Canvas animation background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-0"
        style={{ opacity: 0.35, imageRendering: 'pixelated' }}
      />

      {/* Centered content card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="glass-panel flex flex-col items-center gap-3 sm:gap-6 max-w-sm sm:max-w-md px-4 sm:px-6 py-6 sm:py-8 relative z-10"
      >
        {/* Status indicator — terminal style */}
        <div className="w-full flex items-center justify-between">
          <span className="font-mono text-xs text-accent/70 uppercase tracking-widest">/// MY_MUSIC_MEMORY</span>
          <span className="font-mono text-xs text-text-secondary/60 uppercase tracking-widest">STATUS: READY</span>
        </div>

        {/* Title & Subtitle */}
        <div className="text-center">
          <p className="font-mono text-xs text-accent/60 uppercase tracking-widest mb-2 sm:mb-3">// ARCHIVE_v1.0</p>
          <h1 className="text-3xl sm:text-5xl text-text-primary mb-1 sm:mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            My Music Memory
          </h1>
          <p className="font-mono text-xs sm:text-sm text-text-secondary uppercase tracking-wide">
            Explore your historic music taste
          </p>
        </div>

        {/* Upload Zone or Processing Spinner */}
        {status === 'idle' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full p-4 sm:p-8 border border-dashed rounded cursor-pointer transition-all ${
              isDragOver
                ? 'border-accent bg-accent/10 scale-102'
                : 'border-text-secondary/40 hover:border-accent/50'
            }`}
          >
            <motion.div
              animate={{ scale: isDragOver ? 1.05 : 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="flex flex-col items-center gap-2 sm:gap-3"
            >
              <p className="font-mono text-xs text-accent/70 uppercase tracking-widest">[ DROP_FILES ]</p>
              <div className="text-center">
                <p className="font-mono text-xs text-text-primary uppercase tracking-widest leading-tight">
                  DRAG_SPOTIFY_STREAMING_HISTORY
                </p>
                <p className="font-mono text-xs text-text-secondary uppercase tracking-widest mt-0.5 sm:mt-1">OR_CLICK_TO_BROWSE</p>
              </div>
              <p className="font-mono text-xs text-text-secondary/60 mt-1 sm:mt-2 uppercase tracking-widest">
                ACCEPTS: StreamingHistory_music_*.json or Streaming_History_Audio_*.json
              </p>
            </motion.div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".json"
              onChange={onInputChange}
              className="hidden"
            />
          </motion.div>
        )}

        {status === 'processing' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-4 py-12"
          >
            {/* Spinner */}
            <div className="w-10 h-10 border-3 border-accent/30 border-t-accent rounded-full animate-spin" />
            <p className="text-text-secondary text-sm font-sans">
              Analyzing your listening history…
            </p>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-4 w-full"
          >
            <div className="w-full p-4 bg-error-surface border border-error rounded text-center">
              <p className="text-error text-sm">{error}</p>
            </div>
            <button
              onClick={() => setStatus('idle')}
              className="btn-accent"
            >
              Try Again
            </button>
          </motion.div>
        )}

        {/* Separator */}
        {status === 'idle' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="flex items-center gap-3 w-full"
          >
            <div className="flex-1 h-px bg-text-secondary/20" />
            <span className="font-mono text-text-secondary/60 text-xs uppercase tracking-widest">// OR //</span>
            <div className="flex-1 h-px bg-text-secondary/20" />
          </motion.div>
        )}

        {/* Try Demo Button */}
        {status === 'idle' && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDemo}
            className="px-6 py-3 bg-transparent hover:bg-accent/20 text-accent-light border border-accent/40 font-mono text-xs uppercase tracking-widest transition-all"
          >
            [ TRY_DEMO ]  →
          </motion.button>
        )}

        {/* Expandable Info */}
        {status === 'idle' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="w-full"
          >
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="flex items-center gap-2 text-text-secondary/70 hover:text-text-secondary transition-colors font-mono text-xs uppercase tracking-widest"
            >
              <span>{showInfo ? '▾' : '▸'}</span>
              HOW_TO_GET_SPOTIFY_DATA
            </button>

            {showInfo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
                className="mt-3 p-3 bg-surface/60 border border-border rounded space-y-3"
              >
                {/* Option 1 — Standard (immediate) */}
                <div>
                  <p className="text-text-primary text-xs font-semibold mb-1">Option 1 — Standard History (available now)</p>
                  <p className="text-xs text-text-secondary/80 mb-2">
                    Files named: <span className="font-mono text-accent/80">StreamingHistory_music_*.json</span>
                  </p>
                  <ol className="text-xs text-text-secondary space-y-1 list-decimal list-inside">
                    <li>Go to <strong>Spotify Account</strong> → <strong>Privacy Settings</strong></li>
                    <li>Select <strong>"Request Data"</strong> → download immediately</li>
                    <li>Extract the ZIP and upload the JSON files here</li>
                  </ol>
                  <p className="text-xs text-text-secondary/50 mt-1">Works for timeline, years, activity calendar. Map defaults to US.</p>
                </div>

                <div className="h-px bg-border/40" />

                {/* Option 2 — Extended (full features) */}
                <div>
                  <p className="text-text-primary text-xs font-semibold mb-1">Option 2 — Extended History (full map features)</p>
                  <p className="text-xs text-text-secondary/80 mb-2">
                    Files named: <span className="font-mono text-accent/80">Streaming_History_Audio_*.json</span>
                  </p>
                  <ol className="text-xs text-text-secondary space-y-1 list-decimal list-inside">
                    <li>Go to <strong>Spotify Account</strong> → <strong>Privacy Settings</strong></li>
                    <li>Select <strong>"Request Data"</strong> → check <strong>"Extended Streaming History"</strong></li>
                    <li>Wait for email (5–30 days), download the ZIP, upload all JSON files here</li>
                  </ol>
                  <p className="text-xs text-text-secondary/50 mt-1">Full geographic map with every country you've listened in.</p>
                </div>

                <div className="h-px bg-border/40" />
                <p className="text-xs text-text-secondary/60">You can also upload both formats together — duplicates are handled automatically.</p>
              </motion.div>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Spectral waveform strip — bottom decorative element */}
      <canvas
        ref={waveCanvasRef}
        className="absolute bottom-0 left-0 w-full z-0 pointer-events-none"
        style={{ height: '80px' }}
      />
    </motion.div>
  )
}
