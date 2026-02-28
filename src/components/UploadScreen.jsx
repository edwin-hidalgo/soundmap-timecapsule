import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { parseStreamingHistory } from '../utils/parseStreamingHistory.js'
import { demoData } from '../data/demoData.js'

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

      // Parse with data layer
      const result = parseStreamingHistory(arrays)

      if (Object.keys(result).length === 0) {
        throw new Error(
          'No music plays found after filtering (need >30s plays from known countries)'
        )
      }

      // Success: call parent callback, App.jsx will trigger screen transition
      onDataReady(result)
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
  function handleDemo() {
    onDataReady(demoData)
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
      className="grain-overlay w-full h-full flex items-center justify-center relative"
      style={{
        background: `
          radial-gradient(ellipse 80% 60% at 10% 80%, rgba(245,166,35,0.07) 0%, transparent 60%),
          radial-gradient(ellipse 60% 50% at 90% 10%, rgba(245,166,35,0.05) 0%, transparent 55%),
          #0D1117
        `,
      }}
    >
      {/* Centered content card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="flex flex-col items-center gap-6 max-w-md px-6 py-8 relative z-10"
      >
        {/* Title & Subtitle */}
        <div className="text-center">
          <h1 className="text-5xl font-serif text-text-primary mb-2">
            Time Capsule
          </h1>
          <p className="text-lg text-text-secondary font-sans">
            Rediscover what you listened to around the world.
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
            className={`w-full p-8 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
              isDragOver
                ? 'border-accent bg-accent/10 scale-102'
                : 'border-text-secondary/40 hover:border-accent/60'
            }`}
          >
            <motion.div
              animate={{ scale: isDragOver ? 1.05 : 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="flex flex-col items-center gap-3"
            >
              <p className="text-2xl">↑</p>
              <div className="text-center">
                <p className="text-text-primary font-sans">
                  Drop your Spotify JSON files
                </p>
                <p className="text-sm text-text-secondary">or click to browse</p>
              </div>
              <p className="text-xs text-text-secondary/60 mt-2">
                Accepts Streaming_History_Audio_*.json
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
            <div className="w-full p-4 bg-accent/20 border border-accent/50 rounded text-center">
              <p className="text-accent text-sm">{error}</p>
            </div>
            <button
              onClick={() => setStatus('idle')}
              className="px-4 py-2 bg-accent hover:bg-accent-secondary text-bg-primary font-sans text-sm rounded transition-colors"
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
            <span className="text-text-secondary/60 text-sm">or</span>
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
            className="px-6 py-3 bg-accent/20 hover:bg-accent/30 text-accent border border-accent/50 rounded font-sans text-sm transition-all"
          >
            Try Demo  →
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
              className="flex items-center gap-2 text-text-secondary/70 hover:text-text-secondary transition-colors text-sm"
            >
              <span className="text-xs">{showInfo ? '▾' : '▸'}</span>
              How to get your Spotify data
            </button>

            {showInfo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
                className="mt-3 p-3 bg-text-secondary/5 border border-text-secondary/10 rounded text-sm text-text-secondary/80 space-y-2"
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
    </motion.div>
  )
}
