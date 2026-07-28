import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * CountryMarker — pulsing marker on the globe
 *
 * Props:
 *   country: CountryStats
 *   size: px diameter (from markerSize)
 *   isSelected: boolean
 *   onClick(code)
 *   images: string[] — up to 3 album cover URLs (rank order); cycles when > 1
 *   index: number — stagger order for entrance pop-in
 *   cinemaMode: boolean — locks cycle interval to 5s so cover loops (5s×2=10s,
 *     5s×3=15s) divide the 30s globe revolution exactly (seamless GIF loop)
 */
export default function CountryMarker({ country, size, isSelected, onClick, images = [], index = 0, cinemaMode = false }) {
  const [hovered, setHovered] = useState(false)
  const [imgIndex, setImgIndex] = useState(0)
  const showImage = images.length > 0
  const currentImage = showImage ? images[imgIndex % images.length] : null

  // Cycle through covers on an offset timer so markers don't blink in lockstep
  useEffect(() => {
    if (images.length < 2) return
    const CYCLE_MS = cinemaMode ? 5000 : 6000
    const offset = (country.code.charCodeAt(0) * 37 + country.code.charCodeAt(1) * 13) % 3000
    let interval
    const timeout = setTimeout(() => {
      setImgIndex((i) => i + 1)
      interval = setInterval(() => setImgIndex((i) => i + 1), CYCLE_MS)
    }, CYCLE_MS + offset)
    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [images.length, country.code, cinemaMode])

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18, delay: index * 0.05 }}
      className="relative"
      style={{ width: size, height: size }}
    >
      {/* Pulse ring */}
      <motion.div
        animate={{ scale: [1, 2, 1], opacity: [0.6, 0, 0.6] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 rounded-full"
        style={{
          zIndex: 0,
          background: showImage
            ? 'radial-gradient(circle, rgba(245,166,35,0.5) 0%, rgba(245,166,35,0) 70%)'
            : undefined,
          backgroundColor: showImage ? undefined : 'rgba(245,166,35,0.4)',
        }}
      />

      {/* Main marker */}
      <motion.div
        animate={{ scale: isSelected ? 1.25 : hovered ? 1.1 : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        onClick={() => onClick(country.code)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`absolute inset-0 rounded-full cursor-pointer overflow-hidden ${
          showImage ? 'ring-2 ring-accent' : 'bg-accent'
        }`}
        style={{
          zIndex: 1,
          boxShadow: isSelected
            ? '0 0 20px rgba(245, 166, 35, 0.7)'
            : hovered
            ? '0 0 12px rgba(245, 166, 35, 0.4)'
            : '0 0 8px rgba(245, 166, 35, 0.2)',
        }}
      >
        <AnimatePresence>
          {currentImage && (
            <motion.img
              key={currentImage}
              src={currentImage}
              alt={country.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Tooltip */}
      {hovered && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap glass-panel rounded px-2 py-1.5 z-30 pointer-events-none"
        >
          <div className="flex items-center gap-2">
            <div className="text-center">
              <p className="font-sans text-text-primary text-xs font-medium">{country.name}</p>
              <p className="font-mono-stat text-text-secondary text-xs">{country.trackCount.toLocaleString()} plays</p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
