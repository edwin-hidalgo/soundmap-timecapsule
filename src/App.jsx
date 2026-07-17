import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import UploadScreen from './components/UploadScreen.jsx'
import MapView from './components/MapView.jsx'
import TimelineView from './components/TimelineView.jsx'
import ActivityCalendar from './components/ActivityCalendar.jsx'
import BroadcastScreen from './components/BroadcastScreen.jsx'
import TasteSnapshot from './components/TasteSnapshot.jsx'
import ArtistExploration from './components/ArtistExploration.jsx'
import HubScreen from './components/HubScreen.jsx'
import OAuthCallback from './components/OAuthCallback.jsx'
import LastfmCallback from './components/LastfmCallback.jsx'
import LastfmOnboarding from './components/LastfmOnboarding.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { getCurrentUser } from './utils/spotifyAPI.js'
import { getUserInfo } from './utils/lastfmAPI.js'
import { loadSession, clearSession } from './utils/lastfmAuth.js'
import { upsertProfile } from './utils/supabase.js'
import { BROADCASTS_ENABLED } from './config/features.js'

// Spotify OAuth configuration (legacy — kept for existing users)
const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || null
const SPOTIFY_REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || null

export default function App() {
  const [screen, setScreen] = useState('upload')
  const [countryData, setCountryData] = useState(null)
  const [allEntries, setAllEntries] = useState(null)
  const [dataFormat, setDataFormat] = useState(null)

  // Spotify OAuth state (legacy)
  const [spotifyToken, setSpotifyToken] = useState(null)
  const [spotifyUser, setSpotifyUser] = useState(null)
  const [isOAuthCallback, setIsOAuthCallback] = useState(false)
  const [shouldNavigateToBroadcast, setShouldNavigateToBroadcast] = useState(false)
  const [shouldNavigateToHub, setShouldNavigateToHub] = useState(false)

  // Last.fm state (primary)
  const [lastfmSession, setLastfmSession] = useState(null)
  const [lastfmUser, setLastfmUser] = useState(null)
  const [isLastfmCallback, setIsLastfmCallback] = useState(false)

  const hasAuth = !!(spotifyUser || lastfmUser)

  // Load auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const path = window.location.pathname
      const params = new URLSearchParams(window.location.search)

      // Last.fm callback takes priority
      if (path === '/lastfm-callback' && params.has('token')) {
        setIsLastfmCallback(true)
        return
      }

      // Spotify OAuth callback (legacy)
      if (params.has('code') || params.has('error')) {
        setIsOAuthCallback(true)
        return
      }

      // Load saved Last.fm session (never expires)
      const savedSession = loadSession()
      if (savedSession) {
        setLastfmSession(savedSession)
        try {
          const savedUser = localStorage.getItem('lastfm_user')
          if (savedUser) {
            setLastfmUser(JSON.parse(savedUser))
          }
          const user = await getUserInfo(savedSession.name)
          setLastfmUser(user)
          localStorage.setItem('lastfm_user', JSON.stringify(user))
          if (!countryData) setScreen('hub')
        } catch (err) {
          console.error('Failed to fetch Last.fm user:', err)
          const savedUser = localStorage.getItem('lastfm_user')
          if (savedUser) {
            setLastfmUser(JSON.parse(savedUser))
            if (!countryData) setScreen('hub')
          }
        }
        return
      }

      // Load saved Spotify token (legacy)
      const savedToken = localStorage.getItem('spotify_token')
      if (savedToken) {
        try {
          const token = JSON.parse(savedToken)
          if (token.expiresAt && token.expiresAt > Date.now()) {
            setSpotifyToken(token)
            try {
              const user = await getCurrentUser(token.accessToken)
              if (user) {
                setSpotifyUser(user)
                if (!countryData) setScreen('hub')
              }
            } catch (err) {
              console.error('Failed to fetch user from saved token:', err)
            }
          } else {
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

  // Navigate after OAuth if requested
  useEffect(() => {
    if (shouldNavigateToBroadcast && (spotifyUser || lastfmUser)) {
      setScreen('broadcast')
      setShouldNavigateToBroadcast(false)
    }
    if (shouldNavigateToHub && (spotifyUser || lastfmUser)) {
      setScreen('hub')
      setShouldNavigateToHub(false)
    }
  }, [shouldNavigateToBroadcast, shouldNavigateToHub, spotifyUser, lastfmUser])

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

  function handleNavigateToTimeline() { setScreen('timeline') }
  function handleNavigateToActivity() { setScreen('activity') }
  function handleNavigateToMap() { setScreen('map') }
  function handleNavigateToBroadcast() { setScreen('broadcast') }
  function handleNavigateToTasteSnapshot() { setScreen('taste-snapshot') }
  function handleNavigateToExploration() { setScreen('exploration') }
  function handleNavigateToHub() { setScreen('hub') }
  function handleNavigateToUpload() { setScreen('upload') }
  function handleNavigateToLastfmOnboarding() { setScreen('lastfm-onboarding') }

  async function handleLoadDemo() {
    try {
      const [countryRes, entriesRes] = await Promise.all([
        fetch('/demoCountryData.json'),
        fetch('/demoEntries.json'),
      ])
      if (!countryRes.ok || !entriesRes.ok) throw new Error('Demo data unavailable')
      const [demoCountry, shortEntries] = await Promise.all([
        countryRes.json(),
        entriesRes.json(),
      ])
      const entries = shortEntries.map((e) => ({
        ts: e.ts,
        ms_played: e.ms,
        conn_country: e.cc,
        master_metadata_track_name: e.t,
        master_metadata_album_artist_name: e.ar,
        master_metadata_album_album_name: e.al,
        spotify_track_uri: e.uri,
      }))
      setCountryData(demoCountry)
      setAllEntries(entries)
      setDataFormat('extended')
      setScreen('map')
    } catch (err) {
      console.error('Failed to load demo data:', err)
    }
  }

  function handleBackToHome() {
    if (countryData) {
      setScreen('map')
    } else if (hasAuth) {
      setScreen('hub')
    } else {
      setScreen('upload')
    }
  }

  // Last.fm auth handlers
  async function handleLastfmSessionReceived(session) {
    setLastfmSession(session)
    setIsLastfmCallback(false)
    setShouldNavigateToHub(true)

    try {
      const user = await getUserInfo(session.name)
      setLastfmUser(user)
      localStorage.setItem('lastfm_user', JSON.stringify(user))
    } catch (err) {
      console.error('Failed to fetch Last.fm user info:', err)
      setLastfmUser({ name: session.name })
    }
  }

  function handleLastfmError(error) {
    console.error('Last.fm auth error:', error)
    setIsLastfmCallback(false)
  }

  function handleLogoutLastfm() {
    clearSession()
    setLastfmSession(null)
    setLastfmUser(null)
    if (!countryData) setScreen('upload')
  }

  // Spotify auth handlers (legacy)
  async function handleSpotifyTokenReceived(token) {
    localStorage.setItem('spotify_token', JSON.stringify(token))
    setSpotifyToken(token)

    const wantsBroadcast = sessionStorage.getItem('navigate_to_broadcast')
    const wantsHub = sessionStorage.getItem('navigate_to_hub')
    if (wantsBroadcast) {
      sessionStorage.removeItem('navigate_to_broadcast')
      setShouldNavigateToBroadcast(true)
    } else if (wantsHub) {
      sessionStorage.removeItem('navigate_to_hub')
      setShouldNavigateToHub(true)
    }

    try {
      const user = await getCurrentUser(token.accessToken)
      if (user) {
        setSpotifyUser(user)
        if (BROADCASTS_ENABLED) {
          try { await upsertProfile(user) } catch {}
        }
      }
    } catch (err) {
      console.error('Failed to fetch Spotify user:', err)
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
    if (!countryData && !lastfmUser) setScreen('upload')
  }

  // Auth callback screens
  if (isLastfmCallback) {
    return (
      <LastfmCallback
        onSessionReceived={handleLastfmSessionReceived}
        onError={handleLastfmError}
      />
    )
  }

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
            onNavigateToLastfmOnboarding={handleNavigateToLastfmOnboarding}
            spotifyClientId={SPOTIFY_CLIENT_ID}
            spotifyRedirectUri={SPOTIFY_REDIRECT_URI}
            onNavigateToBroadcast={handleNavigateToBroadcast}
          />
        )}
        {screen === 'lastfm-onboarding' && (
          <LastfmOnboarding
            key="lastfm-onboarding"
            onBack={handleNavigateToUpload}
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
            lastfmUser={lastfmUser}
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
        {screen === 'hub' && (
          <HubScreen
            key="hub"
            spotifyUser={spotifyUser}
            lastfmUser={lastfmUser}
            onNavigateToTasteSnapshot={handleNavigateToTasteSnapshot}
            onNavigateToExploration={handleNavigateToExploration}
            onNavigateToBroadcast={handleNavigateToBroadcast}
            onNavigateToUpload={handleNavigateToUpload}
            onLoadDemo={handleLoadDemo}
            onLogoutSpotify={handleLogoutSpotify}
            onLogoutLastfm={handleLogoutLastfm}
          />
        )}
        {screen === 'broadcast' && (
          <BroadcastScreen
            key="broadcast"
            spotifyToken={spotifyToken}
            spotifyUser={spotifyUser}
            lastfmUser={lastfmUser}
            onBack={handleBackToHome}
            onNavigateToBroadcast={handleNavigateToBroadcast}
          />
        )}
        {screen === 'taste-snapshot' && (
          <TasteSnapshot
            key="taste-snapshot"
            spotifyToken={spotifyToken}
            lastfmUser={lastfmUser}
            allEntries={allEntries}
            onBack={handleBackToHome}
          />
        )}
        {screen === 'exploration' && (
          <ArtistExploration
            key="exploration"
            spotifyToken={spotifyToken}
            lastfmUser={lastfmUser}
            allEntries={allEntries}
            onBack={handleBackToHome}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
