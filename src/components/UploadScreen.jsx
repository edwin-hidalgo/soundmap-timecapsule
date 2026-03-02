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

      // Validate: at least one entry looks like Spotify data
      const sample = arrays.flat()[0]
      if (!sample || !('ms_played' in sample)) {
        throw new Error('No Spotify streaming history found in these files')
      }

      // Flatten arrays to get all raw entries
      const allRawEntries = arrays.flat()

      // Parse with data layer
      const result = parseStreamingHistory(arrays)

      if (Object.keys(result).length === 0) {
        throw new Error(
          'No music plays found after filtering (need >30s plays from known countries)'
        )
      }

      // Success: call parent callback, App.jsx will trigger screen transition
      // Pass both processed countryData and raw entries for timeline features
      onDataReady(result, allRawEntries)
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
  async function handleDemo() {
    setStatus('processing')
    setError(null)

    try {
      // Fetch real demo data (2019-2025 sample of Edwin's history)
      const res = await fetch('/demoEntries.json')
      if (!res.ok) {
        throw new Error('Demo data unavailable. Please try uploading your own data.')
      }

      const entries = await res.json()
      if (!Array.isArray(entries) || entries.length === 0) {
        throw new Error('No demo data found')
      }

      // Parse the demo entries through the same pipeline as uploaded files
      const countryData = parseStreamingHistory([entries])
      if (Object.keys(countryData).length === 0) {
        throw new Error('Failed to process demo data')
      }

      // Pass both parsed country stats AND raw entries to app
      onDataReady(countryData, entries)
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
        className="glass-panel flex flex-col items-center gap-6 max-w-md px-6 py-8 relative z-10"
      >
        {/* Status indicator — terminal style */}
        <div className="w-full flex items-center justify-between">
          <span className="font-mono text-xs text-accent/70 uppercase tracking-widest">/// MY_MUSIC_MEMORY</span>
          <span className="font-mono text-xs text-text-secondary/60 uppercase tracking-widest">STATUS: READY</span>
        </div>

        {/* Title & Subtitle */}
        <div className="text-center">
          <p className="font-mono text-xs text-accent/60 uppercase tracking-widest mb-3">// ARCHIVE_v1.0</p>
          <h1 className="text-5xl text-text-primary mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            My Music Memory
          </h1>
          <p className="font-mono text-sm text-text-secondary uppercase tracking-wide">
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
            className={`w-full p-8 border border-dashed cursor-pointer transition-all ${
              isDragOver
                ? 'border-accent bg-accent/10 scale-102'
                : 'border-text-secondary/40 hover:border-accent/50'
            }`}
          >
            <motion.div
              animate={{ scale: isDragOver ? 1.05 : 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="flex flex-col items-center gap-3"
            >
              <p className="font-mono text-xs text-accent/70 uppercase tracking-widest">[ DROP_FILES ]</p>
              <div className="text-center">
                <p className="font-mono text-xs text-text-primary uppercase tracking-widest">
                  DRAG_SPOTIFY_STREAMING_HISTORY
                </p>
                <p className="font-mono text-xs text-text-secondary uppercase tracking-widest mt-1">OR_CLICK_TO_BROWSE</p>
              </div>
              <p className="font-mono text-xs text-text-secondary/60 mt-2 uppercase tracking-widest">
                ACCEPTS: Streaming_History_Audio_*.json
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
                className="mt-3 p-3 bg-surface/60 border border-border rounded text-sm text-text-secondary space-y-2"
              >
                <p>
                  1. Go to <strong>Spotify Account</strong> → <strong>Privacy Settings</strong>
                </p>
                <p>
                  2. Select <strong>"Request Data"</strong> → <strong>"Extended Streaming History"</strong>
                </p>
                <p>
                  3. Download the ZIP file that arrives by email (can take 5–30 days)
                </p>
                <p className="text-xs text-text-secondary/60">
                  Extract all JSON files and upload them here
                </p>
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
