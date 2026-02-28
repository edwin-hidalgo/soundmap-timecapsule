import { useState } from 'react'
import { motion } from 'framer-motion'

/**
 * CountryMarker — rendered inside react-map-gl <Marker>
 *
 * Props:
 *   country: { code, name, lat, lng, totalMsPlayed, trackCount, ... }
 *   size: number (20–60 px, computed by MapView using markerSize())
 *   isSelected: boolean
 *   onClick(code: string): void
 */
export default function CountryMarker({ country, size, isSelected, onClick }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Pulse ring */}
      <motion.div
        animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 rounded-full bg-accent/40"
        style={{ zIndex: 0 }}
      />

      {/* Main dot */}
      <motion.div
        animate={{ scale: isSelected ? 1.25 : hovered ? 1.1 : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        onClick={() => onClick(country.code)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="absolute inset-0 rounded-full bg-accent cursor-pointer"
        style={{
          zIndex: 1,
          boxShadow: isSelected
            ? '0 0 20px rgba(245, 166, 35, 0.7)'
            : hovered
            ? '0 0 12px rgba(245, 166, 35, 0.4)'
            : '0 0 8px rgba(245, 166, 35, 0.2)',
        }}
      />

      {/* Tooltip */}
      {hovered && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap glass-panel rounded px-2 py-1 z-30 pointer-events-none text-center"
        >
          <p className="font-sans text-text-primary text-xs font-medium">{country.name}</p>
          <p className="font-mono-stat text-text-secondary text-xs">{country.trackCount.toLocaleString()} plays</p>
        </motion.div>
      )}
    </div>
  )
}
