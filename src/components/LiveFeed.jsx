import { useState, useEffect } from 'react'
import { getActiveBroadcasts, subscribeToBroadcasts, subscribeToReactions } from '../utils/supabase.js'
import BroadcastCard from './BroadcastCard.jsx'

export default function LiveFeed({ spotifyToken, spotifyUser }) {
  const [broadcasts, setBroadcasts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reactions, setReactions] = useState({}) // Track reactions per broadcast

  // Initial fetch + realtime subscriptions
  useEffect(() => {
    let unsubscribeBroadcasts = null
    let unsubscribeReactions = null

    const setup = async () => {
      try {
        // Fetch active broadcasts
        const initialBroadcasts = await getActiveBroadcasts()
        setBroadcasts(initialBroadcasts)
        setLoading(false)

        // Subscribe to broadcast changes
        unsubscribeBroadcasts = subscribeToBroadcasts((payload) => {
          // On any broadcast change, refetch to get updated list
          // This could be optimized with smarter incremental updates
          getActiveBroadcasts().then(setBroadcasts)
        })

        // Subscribe to reaction changes
        unsubscribeReactions = subscribeToReactions((payload) => {
          // Refetch broadcasts to get updated reaction counts
          getActiveBroadcasts().then(setBroadcasts)
        })
      } catch (err) {
        console.error('Failed to load broadcasts:', err)
        setError('Failed to load live broadcasts')
        setLoading(false)
      }
    }

    setup()

    return () => {
      if (unsubscribeBroadcasts) unsubscribeBroadcasts()
      if (unsubscribeReactions) unsubscribeReactions()
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-text-secondary">Loading broadcasts...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-red-400">{error}</p>
      </div>
    )
  }

  if (broadcasts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-text-secondary mb-2">No moments dropped yet</p>
        <p className="text-text-tertiary text-sm">Be the first to drop your main character moment! 📍</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {broadcasts.map((broadcast) => (
        <BroadcastCard
          key={broadcast.id}
          broadcast={broadcast}
          spotifyUser={spotifyUser}
        />
      ))}
    </div>
  )
}
