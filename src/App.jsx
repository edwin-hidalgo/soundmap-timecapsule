import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import UploadScreen from './components/UploadScreen.jsx'
import MapView from './components/MapView.jsx'
import TimelineView from './components/TimelineView.jsx'
import ActivityCalendar from './components/ActivityCalendar.jsx'
import OAuthCallback from './components/OAuthCallback.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Spotify OAuth configuration
const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || null
const SPOTIFY_REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || null

export default function App() {
  const [screen, setScreen] = useState('upload')
  const [countryData, setCountryData] = useState(null)
  const [allEntries, setAllEntries] = useState(null)

  // OAuth state
  const [spotifyToken, setSpotifyToken] = useState(null)
  const [spotifyUser, setSpotifyUser] = useState(null)
  const [isOAuthCallback, setIsOAuthCallback] = useState(false)

  // Load OAuth state on mount
  useEffect(() => {
    // Check if this is an OAuth callback
    const params = new URLSearchParams(window.location.search)
    if (params.has('code') || params.has('error')) {
      setIsOAuthCallback(true)
      return
    }

    // Load saved token from localStorage
    const savedToken = localStorage.getItem('spotify_token')
    if (savedToken) {
      try {
        const token = JSON.parse(savedToken)
        // Check if token is expired
        if (token.expiresAt && token.expiresAt > Date.now()) {
          setSpotifyToken(token)
        } else {
          // Token expired, clear it
          localStorage.removeItem('spotify_token')
        }
      } catch (err) {
        console.error('Failed to load Spotify token:', err)
        localStorage.removeItem('spotify_token')
      }
    }
  }, [])

  function handleDataReady(processedData, rawEntries) {
    setCountryData(processedData)
    setAllEntries(rawEntries)
    setScreen('map')
  }

  function handleReset() {
    setCountryData(null)
    setAllEntries(null)
    setScreen('upload')
  }

  function handleNavigateToTimeline() {
    setScreen('timeline')
  }

  function handleNavigateToActivity() {
    setScreen('activity')
  }

  function handleNavigateToMap() {
    setScreen('map')
  }

  function handleSpotifyTokenReceived(token) {
    // Save token to localStorage
    localStorage.setItem('spotify_token', JSON.stringify(token))
    setSpotifyToken(token)
    setIsOAuthCallback(false)
  }

  function handleSpotifyError(error) {
    console.error('Spotify OAuth error:', error)
    setIsOAuthCallback(false)
  }

  function handleLogoutSpotify() {
    localStorage.removeItem('spotify_token')
    setSpotifyToken(null)
    setSpotifyUser(null)
  }

  // If this is an OAuth callback, show the callback component
  if (isOAuthCallback) {
    return (
      <OAuthCallback
        clientId={SPOTIFY_CLIENT_ID}
        redirectUri={SPOTIFY_REDIRECT_URI}
        onTokenReceived={handleSpotifyTokenReceived}
        onError={handleSpotifyError}
      />
    )
  }

  return (
    <div className="w-full h-full bg-bg-primary">
      <AnimatePresence mode="wait">
        {screen === 'upload' && (
          <UploadScreen key="upload" onDataReady={handleDataReady} />
        )}
        {screen === 'map' && (
          <MapView
            key="map"
            countryData={countryData}
            onReset={handleReset}
            onNavigateToTimeline={handleNavigateToTimeline}
            onNavigateToActivity={handleNavigateToActivity}
            spotifyToken={spotifyToken}
            spotifyClientId={SPOTIFY_CLIENT_ID}
            spotifyRedirectUri={SPOTIFY_REDIRECT_URI}
            onLogoutSpotify={handleLogoutSpotify}
          />
        )}
        {screen === 'timeline' && (
          <ErrorBoundary key="timeline">
            <TimelineView
              allEntries={allEntries}
              onBack={handleNavigateToMap}
            />
          </ErrorBoundary>
        )}
        {screen === 'activity' && (
          <ActivityCalendar
            key="activity"
            allEntries={allEntries}
            onBack={handleNavigateToMap}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
