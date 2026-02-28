import { useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Map, { Marker } from 'react-map-gl'
import CountryMarker from './CountryMarker.jsx'
import CapsulePanel from './CapsulePanel.jsx'
import StatsBar from './StatsBar.jsx'
import { markerSize } from '../utils/formatters.js'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

/**
 * MapView — Screen 2: Interactive world map with country markers
 *
 * Props:
 *   countryData: Object  — keyed by ISO code, value is aggregated country stats
 *   onReset()            — returns to upload screen
 */
export default function MapView({ countryData, onReset }) {
  const mapRef = useRef(null)
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  // Compute max listening time for marker sizing
  const maxMs = Math.max(...Object.values(countryData).map((c) => c.totalMsPlayed), 0)

  // Auto-fit bounds after map loads
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return

    const lngs = Object.values(countryData).map((c) => c.lng)
    const lats = Object.values(countryData).map((c) => c.lat)
    const bounds = [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)],
    ]
    mapRef.current.fitBounds(bounds, { padding: 80, duration: 1200 })
  }, [mapLoaded, countryData])

  function handleMarkerClick(code) {
    const country = countryData[code]
    setSelectedCountry(country)
    mapRef.current?.flyTo({ center: [country.lng, country.lat], zoom: 4, duration: 1200 })
  }

  function handleClose() {
    setSelectedCountry(null)
  }

  return (
    <motion.div
      key="map"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full h-full relative"
    >
      <Map
        ref={mapRef}
        reuseMaps
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        initialViewState={{ longitude: 0, latitude: 20, zoom: 1.5 }}
        onLoad={() => setMapLoaded(true)}
        style={{ width: '100%', height: '100%' }}
      >
        {Object.values(countryData).map((country) => (
          <Marker
            key={country.code}
            longitude={country.lng}
            latitude={country.lat}
            anchor="center"
          >
            <CountryMarker
              country={country}
              size={markerSize(country.totalMsPlayed, maxMs)}
              isSelected={selectedCountry?.code === country.code}
              onClick={handleMarkerClick}
            />
          </Marker>
        ))}
      </Map>

      <StatsBar countryData={countryData} onReset={onReset} />
      <CapsulePanel country={selectedCountry} onClose={handleClose} />
    </motion.div>
  )
}
