import { useState } from 'react'
import { motion } from 'framer-motion'

export default function CountryMarker({ country, size, isSelected, onClick, topTrackImage }) {
  const [hovered, setHovered] = useState(false)
  const showImage = !!topTrackImage

  return (
    <div className="relative" style={{ width: size, height: size }}>
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
        {showImage && (
          <img src={topTrackImage} alt={country.name} className="w-full h-full object-cover" />
        )}
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
    </div>
  )
}
