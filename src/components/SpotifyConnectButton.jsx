import { motion } from 'framer-motion'
import { generateAuthUrl } from '../utils/spotifyAuth.js'
import { useState } from 'react'

/**
 * SpotifyConnectButton — Small floating button to connect/disconnect Spotify
 *
 * Props:
 *   clientId: string — Spotify app client ID
 *   redirectUri: string — OAuth redirect URI
 *   isConnected: boolean — whether Spotify is already connected
 *   onConnect: function — called when login starts
 *   onDisconnect: function — called when logout clicked
 */
export default function SpotifyConnectButton({
  clientId,
  redirectUri,
  isConnected,
  onConnect,
  onDisconnect,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  if (!clientId || !redirectUri) {
    return null // Don't show if not configured
  }

  async function handleLogin() {
    setIsLoading(true)
    try {
      const authUrl = await generateAuthUrl(clientId, redirectUri)
      onConnect?.()
      window.location.href = authUrl
    } catch (err) {
      console.error('Login error:', err)
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed top-6 right-6 z-30">
      {isOpen && !isConnected && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="absolute top-0 right-0 mt-12 p-4 rounded-lg bg-white/10 backdrop-blur border border-white/20 shadow-xl min-w-56"
        >
          <p className="text-text-primary text-sm font-medium mb-3">Connect Spotify</p>
          <p className="text-text-secondary text-xs mb-4">
            Unlock live listening features and taste snapshots
          </p>
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full px-3 py-2 bg-accent hover:bg-accent/90 disabled:bg-accent/50 text-bg-primary text-sm font-medium rounded transition-colors"
          >
            {isLoading ? 'Connecting...' : 'Connect with Spotify'}
          </button>
        </motion.div>
      )}

      {isOpen && isConnected && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="absolute top-0 right-0 mt-12 p-4 rounded-lg bg-white/10 backdrop-blur border border-white/20 shadow-xl min-w-56"
        >
          <p className="text-text-primary text-sm font-medium mb-3">Spotify Connected</p>
          <p className="text-text-secondary text-xs mb-4">Live features are now available</p>
          <button
            onClick={() => {
              onDisconnect?.()
              setIsOpen(false)
            }}
            className="w-full px-3 py-2 bg-white/10 hover:bg-white/20 text-text-primary text-sm font-medium rounded transition-colors"
          >
            Disconnect
          </button>
        </motion.div>
      )}

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={`flex items-center justify-center w-12 h-12 rounded-full transition-all ${
          isConnected ? 'bg-green-500/20 border border-green-500/50 text-green-400' : 'bg-accent/20 border border-accent/50 text-accent'
        }`}
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.384-.645.643-1.11.75-.207.06-.432.045-.66-.013-.23-.058-.43-.196-.57-.366-.14-.17-.237-.38-.278-.591-.04-.21-.04-.42 0-.63.04-.21.137-.42.278-.591.14-.17.34-.308.57-.366.23-.058.45-.073.66-.013.465.107.87.366 1.11.75.146.235.276.528.276.846 0 .318-.13.611-.276.846zm1.324-4.817c-.452.733-1.122 1.3-1.91 1.652-.79.351-1.699.524-2.578.524-.88 0-1.79-.173-2.578-.524-.79-.352-1.46-.919-1.91-1.652-.45-.733-.708-1.618-.708-2.585 0-.966.258-1.851.708-2.585.45-.732 1.12-1.299 1.91-1.651.788-.352 1.698-.524 2.578-.524.88 0 1.79.172 2.578.524.79.352 1.46.919 1.91 1.651.45.734.708 1.619.708 2.585 0 .967-.258 1.852-.708 2.585z" />
        </svg>
      </motion.button>
    </div>
  )
}
