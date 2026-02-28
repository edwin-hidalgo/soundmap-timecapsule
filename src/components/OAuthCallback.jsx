import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { exchangeCodeForToken } from '../utils/spotifyAuth.js'

/**
 * OAuthCallback — Handles OAuth redirect from Spotify
 *
 * Props:
 *   clientId: string — Spotify app client ID
 *   redirectUri: string — OAuth redirect URI
 *   onTokenReceived(token): void — callback with { accessToken, refreshToken, expiresAt }
 *   onError(error): void — callback with error message
 */
export default function OAuthCallback({ clientId, redirectUri, onTokenReceived, onError }) {
  const [status, setStatus] = useState('processing') // 'processing' | 'success' | 'error'
  const [message, setMessage] = useState('Authorizing with Spotify...')

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Get authorization code from URL
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')
        const error = params.get('error')

        if (error) {
          throw new Error(`Spotify authorization denied: ${error}`)
        }

        if (!code) {
          throw new Error('No authorization code received from Spotify')
        }

        if (!clientId || !redirectUri) {
          throw new Error('OAuth configuration missing (clientId or redirectUri)')
        }

        // Exchange code for token
        setMessage('Exchanging code for access token...')
        const token = await exchangeCodeForToken(clientId, redirectUri, code)

        setMessage('Authorization successful!')
        setStatus('success')

        // Call parent callback and redirect
        onTokenReceived(token)

        // Redirect to home after a brief delay
        setTimeout(() => {
          window.location.href = '/'
        }, 1500)
      } catch (err) {
        const errorMsg = err.message || 'Unknown error during OAuth callback'
        console.error('OAuth callback error:', err)
        setMessage(errorMsg)
        setStatus('error')
        onError?.(errorMsg)
      }
    }

    processCallback()
  }, [clientId, redirectUri, onTokenReceived, onError])

  return (
    <div className="w-full h-full bg-bg-primary flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-6 p-8 rounded-lg bg-white/5 border border-white/10 max-w-md"
      >
        {status === 'processing' && (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-3 border-accent border-t-transparent rounded-full"
            />
          </>
        )}

        {status === 'success' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center"
            >
              <span className="text-2xl text-green-400">✓</span>
            </motion.div>
          </>
        )}

        {status === 'error' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center"
            >
              <span className="text-2xl text-red-400">✕</span>
            </motion.div>
          </>
        )}

        <p className="text-text-primary font-medium text-center">{message}</p>

        {status === 'error' && (
          <a
            href="/"
            className="px-4 py-2 rounded-lg bg-accent/20 text-accent hover:bg-accent/30 transition-colors text-sm"
          >
            ← Back to Home
          </a>
        )}

        {status === 'processing' && (
          <p className="text-text-secondary text-sm text-center">
            Please wait while we complete the authorization process...
          </p>
        )}

        {status === 'success' && (
          <p className="text-text-secondary text-sm text-center">
            Redirecting back to Soundmap in a moment...
          </p>
        )}
      </motion.div>
    </div>
  )
}
