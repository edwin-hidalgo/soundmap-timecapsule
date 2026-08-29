import { motion } from 'framer-motion'
import { BROADCASTS_ENABLED } from '../config/features.js'

export default function HubScreen({
  spotifyUser,
  lastfmUser,
  onNavigateToTasteSnapshot,
  onNavigateToExploration,
  onNavigateToBroadcast,
  onNavigateToUpload,
  onLoadDemo,
  onLogoutSpotify,
  onLogoutLastfm,
}) {
  const displayName = lastfmUser?.realname || lastfmUser?.name || spotifyUser?.display_name || null
  const connectedService = lastfmUser ? 'Last.fm' : 'Spotify'

  const features = [
    {
      key: 'taste',
      title: 'Taste Snapshot',
      description: 'See what\'s rising, consistent, and fading in your listening right now vs all-time',
      action: onNavigateToTasteSnapshot,
    },
    {
      key: 'explore',
      title: 'Artist Exploration',
      description: 'Discover how much of your top artists\' catalogs you\'ve actually explored',
      action: onNavigateToExploration,
    },
    {
      key: 'live',
      title: 'Live',
      description: BROADCASTS_ENABLED
        ? 'See your recent listening activity and what the community is playing'
        : 'See your recent listening activity',
      action: onNavigateToBroadcast,
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="grain-overlay w-full h-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse 80% 60% at 10% 80%, rgba(61,120,80,0.08) 0%, transparent 60%),
          radial-gradient(ellipse 60% 50% at 90% 10%, rgba(61,120,80,0.05) 0%, transparent 55%),
          rgb(26, 24, 21)
        `,
      }}
    >
      <div className="max-w-md w-full px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <img
            src="/wordmark.png"
            alt="My Music Memory"
            className="w-44 mx-auto mb-4 select-none pointer-events-none"
          />
          <h1 className="text-3xl sm:text-4xl text-text-primary mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            Welcome{displayName ? `, ${displayName.split(' ')[0]}` : ''}
          </h1>
          <p className="text-sm text-text-secondary">
            {connectedService} connected — here's what you can explore
          </p>
        </div>

        {/* Feature cards */}
        <div className="space-y-3 mb-8">
          {features.map((feature, i) => (
            <motion.button
              key={feature.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              onClick={feature.action}
              className="w-full text-left p-4 rounded-lg bg-surface border border-border hover:border-accent/50 hover:bg-surface-hover transition-all group"
            >
              <p className="text-text-primary text-sm font-medium group-hover:text-accent-light transition-colors">
                {feature.title}
              </p>
              <p className="text-text-muted text-xs mt-1 leading-relaxed">
                {feature.description}
              </p>
            </motion.button>
          ))}
        </div>

        {/* Upload CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center space-y-3"
        >
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-text-secondary/20" />
            <span className="font-mono text-text-secondary/60 text-xs uppercase tracking-widest">
              unlock more
            </span>
            <div className="flex-1 h-px bg-text-secondary/20" />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={onLoadDemo}
              className="px-5 py-2.5 bg-accent/10 hover:bg-accent/20 text-accent-light border border-accent/40 font-mono text-xs uppercase tracking-widest transition-all"
            >
              [ TRY_DEMO ] →
            </button>
            <button
              onClick={onNavigateToUpload}
              className="px-5 py-2.5 bg-transparent hover:bg-accent/10 text-text-secondary border border-border font-mono text-xs uppercase tracking-widest transition-all"
            >
              [ UPLOAD_YOUR_DATA ] →
            </button>
          </div>
          <p className="text-[10px] text-text-muted">
            Explore the full map, timeline, and activity calendar with demo data — or upload your own Spotify streaming history
          </p>
        </motion.div>

        {/* Disconnect */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-6"
        >
          {lastfmUser && (
            <button
              onClick={onLogoutLastfm}
              className="text-text-muted hover:text-text-secondary text-xs transition-colors"
            >
              Disconnect Last.fm
            </button>
          )}
          {spotifyUser && !lastfmUser && (
            <button
              onClick={onLogoutSpotify}
              className="text-text-muted hover:text-text-secondary text-xs transition-colors"
            >
              Disconnect Spotify
            </button>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}
