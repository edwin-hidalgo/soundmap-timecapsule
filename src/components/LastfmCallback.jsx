import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getSession, saveSession } from '../utils/lastfmAuth.js'

export default function LastfmCallback({ onSessionReceived, onError }) {
  const [error, setError] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')

    if (!token) {
      const msg = 'No token received from Last.fm'
      setError(msg)
      onError(msg)
      return
    }

    async function exchangeToken() {
      try {
        const session = await getSession(token)
        saveSession(session)
        window.history.replaceState({}, '', '/')
        onSessionReceived(session)
      } catch (err) {
        console.error('Last.fm auth error:', err)
        setError(err.message)
        onError(err.message)
      }
    }

    exchangeToken()
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full flex items-center justify-center bg-bg-primary"
    >
      <div className="text-center">
        {error ? (
          <>
            <p className="text-error text-sm mb-4">{error}</p>
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-accent/10 text-accent-light border border-accent/40 font-mono text-xs uppercase tracking-widest"
            >
              Back to home
            </button>
          </>
        ) : (
          <>
            <div className="w-10 h-10 border-3 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-text-secondary text-sm">Connecting your Last.fm account...</p>
          </>
        )}
      </div>
    </motion.div>
  )
}
