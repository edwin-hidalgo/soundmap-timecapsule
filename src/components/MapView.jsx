import { useRef, useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import Map, { Marker } from 'react-map-gl'
import CountryMarker from './CountryMarker.jsx'
import CinemaStarfield from './CinemaStarfield.jsx'
import CapsulePanel from './CapsulePanel.jsx'
import StatsBar from './StatsBar.jsx'
import NowPlayingCard from './NowPlayingCard.jsx'
import { markerSize } from '../utils/formatters.js'
import { useTrackImages } from '../utils/artistImages.js'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

// Cinema mode (?cinema=1): recording-only view — ambient starfield, hidden UI
// chrome, and loop-locked animation timing for a seamless one-revolution GIF.
const CINEMA_MODE =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('cinema')

/**
 * MapView — Screen 2: Interactive world map with country markers
 *
 * Props:
 *   countryData: Object  — keyed by ISO code, value is aggregated country stats
 *   onReset()            — returns to upload screen
 *   onNavigateToTimeline() — navigate to Timeline view
 *   onNavigateToActivity() — navigate to Activity Calendar view
 *   spotifyToken: Object — OAuth token { accessToken, refreshToken, expiresAt }
 *   spotifyClientId: String — Spotify OAuth client ID
 *   spotifyRedirectUri: String — Spotify OAuth redirect URI
 *   onLogoutSpotify() — logout from Spotify
 */
export default function MapView({
  countryData,
  onReset,
  onNavigateToTimeline,
  onNavigateToActivity,
  onNavigateToBroadcast,
  onNavigateToTasteSnapshot,
  onNavigateToExploration,
  spotifyToken,
  spotifyUser,
  spotifyClientId,
  spotifyRedirectUri,
  onLogoutSpotify,
  lastfmUser,
  dataFormat,
}) {
  const mapRef = useRef(null)
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [geoBannerDismissed, setGeoBannerDismissed] = useState(false)

  // Idle auto-spin state (refs so listeners see current values without re-binding)
  const userInteractingRef = useRef(false)
  const resumeTimerRef = useRef(null)
  const panelOpenRef = useRef(false)
  panelOpenRef.current = !!selectedCountry

  // Compute max listening time for marker sizing
  const maxMs = Math.max(...Object.values(countryData).map((c) => c.totalMsPlayed), 0)

  // Fetch top-track images for globe markers (try top 3 per country for fallback)
  const countryTrackCandidates = useMemo(() => {
    const entries = []
    for (const c of Object.values(countryData)) {
      const tracks = c.topTracks || []
      for (let i = 0; i < Math.min(3, tracks.length); i++) {
        const t = tracks[i]
        if (t.trackName) {
          entries.push({ code: c.code, name: t.trackName, artist: t.artistName, rank: i })
        }
      }
    }
    return entries
  }, [countryData])

  const topTrackImages = useTrackImages(
    countryTrackCandidates.map(t => ({ name: t.name, artist: t.artist }))
  )

  // Up to 3 resolved cover URLs per country, rank order (for marker art cycling)
  const countryImageMap = useMemo(() => {
    const map = {}
    for (const t of countryTrackCandidates) {
      const key = `${t.artist || ''}:${t.name}`.toLowerCase()
      const url = topTrackImages[key]
      if (!url) continue
      if (!map[t.code]) map[t.code] = []
      map[t.code].push(url)
    }
    return map
  }, [countryTrackCandidates, topTrackImages])

  // ─── Idle auto-spin ────────────────────────────────────────────────────
  // Slow continuous rotation; pauses on interaction or open panel,
  // resumes after IDLE_RESUME_MS of inactivity.
  const SECONDS_PER_REV = 30
  const MAX_SPIN_ZOOM = 4
  const IDLE_RESUME_MS = 10_000

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return
    const map = mapRef.current.getMap()

    function spinGlobe() {
      if (userInteractingRef.current || panelOpenRef.current) return
      if (map.getZoom() >= MAX_SPIN_ZOOM) return
      const center = map.getCenter()
      center.lng += 360 / SECONDS_PER_REV // one second worth of rotation (west→east)
      map.easeTo({ center, duration: 1000, easing: (n) => n })
    }

    function scheduleResume() {
      clearTimeout(resumeTimerRef.current)
      resumeTimerRef.current = setTimeout(() => {
        userInteractingRef.current = false
        spinGlobe()
      }, IDLE_RESUME_MS)
    }

    function onInteractionStart() {
      userInteractingRef.current = true
      clearTimeout(resumeTimerRef.current)
    }

    function onInteractionEnd() {
      scheduleResume()
    }

    // wheel has no matching end event — treat each tick as start + reschedule
    function onWheel() {
      userInteractingRef.current = true
      scheduleResume()
    }

    map.on('mousedown', onInteractionStart)
    map.on('touchstart', onInteractionStart)
    map.on('wheel', onWheel)
    map.on('mouseup', onInteractionEnd)
    map.on('touchend', onInteractionEnd)
    map.on('dragend', onInteractionEnd)
    map.on('moveend', spinGlobe) // chain: each 1s ease triggers the next

    spinGlobe()

    return () => {
      clearTimeout(resumeTimerRef.current)
      map.off('mousedown', onInteractionStart)
      map.off('touchstart', onInteractionStart)
      map.off('wheel', onWheel)
      map.off('mouseup', onInteractionEnd)
      map.off('touchend', onInteractionEnd)
      map.off('dragend', onInteractionEnd)
      map.off('moveend', spinGlobe)
    }
  }, [mapLoaded])

  // When the country panel closes: after the idle delay, glide back out to
  // globe view — the moveend chain then resumes the spin on its own.
  useEffect(() => {
    if (selectedCountry || !mapLoaded || !mapRef.current) return
    const map = mapRef.current.getMap()
    clearTimeout(resumeTimerRef.current)
    resumeTimerRef.current = setTimeout(() => {
      userInteractingRef.current = false
      map.easeTo({ zoom: 1.7, duration: 2500 })
    }, IDLE_RESUME_MS)
    return () => clearTimeout(resumeTimerRef.current)
  }, [selectedCountry, mapLoaded])

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
        projection="globe"
        fog={{
          color: 'rgb(11, 11, 25)',
          'high-color': 'rgb(36, 42, 84)',
          'horizon-blend': 0.02,
          'space-color': 'rgb(5, 5, 15)',
          'star-intensity': 0.4,
        }}
        initialViewState={{ longitude: -30, latitude: 20, zoom: 1.7 }}
        onLoad={() => setMapLoaded(true)}
        style={{ width: '100%', height: '100%' }}
      >
        {Object.values(countryData)
          .filter((country) => country.code !== 'ZZ' && country.code !== 'A1')
          .map((country, index) => (
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
                images={countryImageMap[country.code] || []}
                index={index}
                cinemaMode={CINEMA_MODE}
              />
            </Marker>
          ))}
      </Map>

      {CINEMA_MODE && <CinemaStarfield />}

      {!CINEMA_MODE && (
        <StatsBar
          countryData={countryData}
          onReset={onReset}
          onNavigateToTimeline={onNavigateToTimeline}
          onNavigateToActivity={onNavigateToActivity}
          onNavigateToBroadcast={onNavigateToBroadcast}
          onNavigateToTasteSnapshot={onNavigateToTasteSnapshot}
          onNavigateToExploration={onNavigateToExploration}
          spotifyUser={spotifyUser}
          lastfmUser={lastfmUser}
        />
      )}

      {!CINEMA_MODE && dataFormat === 'basic' && !geoBannerDismissed && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 w-full max-w-lg px-4">
          <div className="flex items-start gap-3 p-3 bg-bg-primary/95 backdrop-blur border border-accent/20 rounded text-xs text-text-secondary shadow-lg">
            <span className="text-accent flex-shrink-0 mt-0.5">◈</span>
            <div className="flex-1 leading-relaxed">
              <span className="text-text-primary font-medium">Standard Spotify history — geographic data unavailable. </span>
              All plays are shown in United States. To see your real listening map,
              request <strong>Extended Streaming History</strong> from Spotify Privacy Settings (takes 5–30 days).
            </div>
            <button
              onClick={() => setGeoBannerDismissed(true)}
              className="text-text-secondary/40 hover:text-text-secondary flex-shrink-0 transition-colors text-base leading-none mt-0.5"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {!CINEMA_MODE && (spotifyToken || lastfmUser) && (
        <NowPlayingCard spotifyToken={spotifyToken} lastfmUser={lastfmUser} />
      )}

      <CapsulePanel country={selectedCountry} onClose={handleClose} />
    </motion.div>
  )
}
