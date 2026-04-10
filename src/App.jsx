import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import UploadScreen from './components/UploadScreen.jsx'
import MapView from './components/MapView.jsx'
import TimelineView from './components/TimelineView.jsx'
import ActivityCalendar from './components/ActivityCalendar.jsx'
import BroadcastScreen from './components/BroadcastScreen.jsx'
import TasteSnapshot from './components/TasteSnapshot.jsx'
import ArtistExploration from './components/ArtistExploration.jsx'
import OAuthCallback from './components/OAuthCallback.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { getCurrentUser } from './utils/spotifyAPI.js'
import { upsertProfile } from './utils/supabase.js'

// Spotify OAuth configuration
const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || null
const SPOTIFY_REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || null

export default function App() {
  const [screen, setScreen] = useState('upload')
  const [countryData, setCountryData] = useState(null)
  const [allEntries, setAllEntries] = useState(null)
  const [dataFormat, setDataFormat] = useState(null)

  // OAuth state
  const [spotifyToken, setSpotifyToken] = useState(null)
  const [spotifyUser, setSpotifyUser] = useState(null)
  const [isOAuthCallback, setIsOAuthCallback] = useState(false)
  const [shouldNavigateToBroadcast, setShouldNavigateToBroadcast] = useState(false)

  // Load OAuth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
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

            // Also fetch the user profile if token is valid
            try {
              const user = await getCurrentUser(token.accessToken)
              if (user) {
                setSpotifyUser(user)
              }
            } catch (err) {
              console.error('Failed to fetch user from saved token:', err)
            }
          } else {
            // Token expired, clear it
            localStorage.removeItem('spotify_token')
          }
        } catch (err) {
          console.error('Failed to load Spotify token:', err)
          localStorage.removeItem('spotify_token')
        }
      }
    }

    initializeAuth()
  }, [])

  // Navigate to broadcast screen after OAuth if requested
  useEffect(() => {
    if (shouldNavigateToBroadcast && spotifyUser) {
      setScreen('broadcast')
      setShouldNavigateToBroadcast(false)
    }
  }, [shouldNavigateToBroadcast, spotifyUser])

  function handleDataReady(processedData, rawEntries, format) {
    setCountryData(processedData)
    setAllEntries(rawEntries)
    setDataFormat(format)
    setScreen('map')
  }

  function handleReset() {
    setCountryData(null)
    setAllEntries(null)
    setDataFormat(null)
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

  function handleNavigateToBroadcast() {
    setScreen('broadcast')
  }

  function handleNavigateToTasteSnapshot() {
    setScreen('taste-snapshot')
  }

  function handleNavigateToExploration() {
    setScreen('exploration')
  }

  async function handleSpotifyTokenReceived(token) {
    // Save token to localStorage
    localStorage.setItem('spotify_token', JSON.stringify(token))
    setSpotifyToken(token)

    // Check if we should navigate to broadcast (from UploadScreen "Try Live" button)
    const wantsBroadcast = sessionStorage.getItem('navigate_to_broadcast')
    if (wantsBroadcast) {
      sessionStorage.removeItem('navigate_to_broadcast')
      setShouldNavigateToBroadcast(true)
    }

    // Fetch user profile from Spotify API
    try {
      const user = await getCurrentUser(token.accessToken)
      if (user) {
        setSpotifyUser(user)

        // Upsert user to Supabase profiles table
        try {
          await upsertProfile(user)
        } catch (supabaseErr) {
          console.error('Failed to upsert profile to Supabase:', supabaseErr)
          // Not critical — app still works with Supabase offline
        }
      }
    } catch (err) {
      console.error('Failed to fetch Spotify user:', err)
      // Still consider the OAuth successful even if user fetch fails
    }

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
          <UploadScreen
            key="upload"
            onDataReady={handleDataReady}
            spotifyClientId={SPOTIFY_CLIENT_ID}
            spotifyRedirectUri={SPOTIFY_REDIRECT_URI}
            onNavigateToBroadcast={handleNavigateToBroadcast}
          />
        )}
        {screen === 'map' && (
          <MapView
            key="map"
            countryData={countryData}
            onReset={handleReset}
            onNavigateToTimeline={handleNavigateToTimeline}
            onNavigateToActivity={handleNavigateToActivity}
            onNavigateToBroadcast={handleNavigateToBroadcast}
            onNavigateToTasteSnapshot={handleNavigateToTasteSnapshot}
            onNavigateToExploration={handleNavigateToExploration}
            spotifyToken={spotifyToken}
            spotifyUser={spotifyUser}
            spotifyClientId={SPOTIFY_CLIENT_ID}
            spotifyRedirectUri={SPOTIFY_REDIRECT_URI}
            onLogoutSpotify={handleLogoutSpotify}
            dataFormat={dataFormat}
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
        {screen === 'broadcast' && (
          <BroadcastScreen
            key="broadcast"
            spotifyToken={spotifyToken}
            spotifyUser={spotifyUser}
            onBack={handleNavigateToMap}
            onNavigateToBroadcast={handleNavigateToBroadcast}
          />
        )}
        {screen === 'taste-snapshot' && (
          <TasteSnapshot
            key="taste-snapshot"
            spotifyToken={spotifyToken}
            allEntries={allEntries}
            onBack={handleNavigateToMap}
          />
        )}
        {screen === 'exploration' && (
          <ArtistExploration
            key="exploration"
            spotifyToken={spotifyToken}
            allEntries={allEntries}
            onBack={handleNavigateToMap}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
