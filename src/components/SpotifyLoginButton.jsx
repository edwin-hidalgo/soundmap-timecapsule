import { useState } from 'react'
import { motion } from 'framer-motion'
import { generateAuthUrl } from '../utils/spotifyAuth.js'

/**
 * SpotifyLoginButton — Initiates Spotify OAuth login flow
 *
 * Props:
 *   clientId: string — Spotify app client ID (from env or user input)
 *   redirectUri: string — OAuth redirect URI (usually https://yoursite.com/callback)
 *   onClickLogin: function — called when login button clicked (before redirect)
 */
export default function SpotifyLoginButton({ clientId, redirectUri, onClickLogin }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  if (!clientId || !redirectUri) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-lg bg-yellow-900/20 border border-yellow-700/50 text-yellow-100 text-sm"
      >
        <p className="font-medium mb-2">Spotify connection not configured</p>
        <p className="text-xs text-yellow-200">
          To unlock live listening features, create a Spotify app at{' '}
          <a
            href="https://developer.spotify.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-yellow-50"
          >
            Spotify Developer Dashboard
          </a>
        </p>
      </motion.div>
    )
  }

  async function handleLogin() {
    setError(null)
    setIsLoading(true)

    try {
      const authUrl = await generateAuthUrl(clientId, redirectUri)
      onClickLogin?.()
      // Redirect to Spotify auth
      window.location.href = authUrl
    } catch (err) {
      setError(err.message)
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-3 rounded-lg bg-red-900/20 border border-red-700/50 text-red-100 text-sm"
        >
          {error}
        </motion.div>
      )}

      <button
        onClick={handleLogin}
        disabled={isLoading}
        className="px-4 py-2 bg-accent hover:bg-accent/90 disabled:bg-accent/50 text-bg-primary font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-4 h-4 border-2 border-bg-primary border-t-transparent rounded-full"
            />
            Connecting...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.384-.645.643-1.11.75-.207.06-.432.045-.66-.013-.23-.058-.43-.196-.57-.366-.14-.17-.237-.38-.278-.591-.04-.21-.04-.42 0-.63.04-.21.137-.42.278-.591.14-.17.34-.308.57-.366.23-.058.45-.073.66-.013.465.107.87.366 1.11.75.146.235.276.528.276.846 0 .318-.13.611-.276.846zm1.324-4.817c-.452.733-1.122 1.3-1.91 1.652-.79.351-1.699.524-2.578.524-.88 0-1.79-.173-2.578-.524-.79-.352-1.46-.919-1.91-1.652-.45-.733-.708-1.618-.708-2.585 0-.966.258-1.851.708-2.585.45-.732 1.12-1.299 1.91-1.651.788-.352 1.698-.524 2.578-.524.88 0 1.79.172 2.578.524.79.352 1.46.919 1.91 1.651.45.734.708 1.619.708 2.585 0 .967-.258 1.852-.708 2.585z" />
            </svg>
            Connect with Spotify
          </>
        )}
      </button>

      <p className="text-text-secondary text-xs text-center">
        You'll be redirected to Spotify to authorize access
      </p>
    </div>
  )
}
