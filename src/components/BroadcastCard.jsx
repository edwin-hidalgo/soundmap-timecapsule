import { useState, useEffect } from 'react'
import { addReaction } from '../utils/supabase.js'

const REACTION_TYPES = [
  { key: 'unhinged', emoji: '🤌', label: 'Unhinged' },
  { key: 'cinematic', emoji: '🎬', label: 'Cinematic' },
  { key: 'core', emoji: '💀', label: 'Core' },
  { key: 'main_character', emoji: '👑', label: 'Main Character' },
]

export default function BroadcastCard({ broadcast, spotifyUser }) {
  const [reactionCounts, setReactionCounts] = useState(broadcast.reaction_counts || {})
  const [hasReacted, setHasReacted] = useState({})
  const [loadingReaction, setLoadingReaction] = useState(false)

  // Load reaction history from localStorage
  useEffect(() => {
    const key = `broadcast_reactions_${broadcast.id}`
    const saved = localStorage.getItem(key)
    if (saved) {
      try {
        setHasReacted(JSON.parse(saved))
      } catch (err) {
        console.error('Failed to parse saved reactions:', err)
      }
    }
  }, [broadcast.id])

  const handleReaction = async (reactionType) => {
    if (loadingReaction || hasReacted[reactionType]) return

    setLoadingReaction(true)
    try {
      // Add reaction to Supabase
      await addReaction(broadcast.id, reactionType, spotifyUser?.id || null)

      // Update local state
      setHasReacted((prev) => ({ ...prev, [reactionType]: true }))
      setReactionCounts((prev) => ({
        ...prev,
        [reactionType]: (prev[reactionType] || 0) + 1,
      }))

      // Save to localStorage
      const key = `broadcast_reactions_${broadcast.id}`
      localStorage.setItem(key, JSON.stringify({ ...hasReacted, [reactionType]: true }))
    } catch (err) {
      console.error('Failed to add reaction:', err)
    } finally {
      setLoadingReaction(false)
    }
  }

  const handleShare = async () => {
    const shareText = broadcast.ai_narration
      ? `"${broadcast.ai_narration}"\n\n${broadcast.display_name} is ${broadcast.situation_label} while listening to "${broadcast.current_song_name}" by ${broadcast.current_song_artist} 🎬`
      : `${broadcast.display_name} is ${broadcast.situation_label} while listening to "${broadcast.current_song_name}" by ${broadcast.current_song_artist} 🎬`
    const shareUrl = `${window.location.origin}?broadcast=${broadcast.id}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Score My Moment',
          text: shareText,
          url: shareUrl,
        })
      } catch (err) {
        console.error('Share failed:', err)
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`)
        alert('Broadcast link copied to clipboard!')
      } catch (err) {
        console.error('Clipboard copy failed:', err)
      }
    }
  }

  const totalReactions = Object.values(reactionCounts).reduce((a, b) => a + b, 0)

  return (
    <div className="bg-surface-secondary rounded-lg overflow-hidden border border-border-secondary hover:border-border-primary transition">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border-secondary">
        {broadcast.avatar_url && (
          <img
            src={broadcast.avatar_url}
            alt={broadcast.display_name}
            className="w-10 h-10 rounded-full"
          />
        )}
        <div className="flex-1">
          <p className="font-semibold text-text-primary">{broadcast.display_name}</p>
          <p className="text-xs text-text-tertiary">
            {new Date(broadcast.created_at).toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={handleShare}
          className="px-3 py-1 text-xs bg-surface-tertiary hover:bg-accent/20 text-text-secondary hover:text-primary transition rounded"
        >
          Share
        </button>
      </div>

      {/* Song Info + Situation */}
      <div className="p-4 flex gap-4">
        {broadcast.current_song_art && (
          <img
            src={broadcast.current_song_art}
            alt={broadcast.current_song_name}
            className="w-16 h-16 rounded"
          />
        )}
        <div className="flex-1">
          <p className="text-sm font-semibold text-text-primary">
            {broadcast.current_song_name}
          </p>
          <p className="text-xs text-text-secondary">{broadcast.current_song_artist}</p>
          <p className="text-xs text-primary font-semibold mt-2 px-2 py-1 bg-primary/10 w-fit rounded">
            {broadcast.situation_label}
          </p>
        </div>
      </div>

      {/* AI Narration - Hollywood Moment */}
      {broadcast.ai_narration && (
        <div className="px-4 py-3 mx-3 my-2 border-l-2 border-primary/50 bg-primary/5 rounded">
          <p className="text-sm text-text-secondary italic">
            "{broadcast.ai_narration}"
          </p>
        </div>
      )}

      {/* Reactions */}
      <div className="px-4 pb-4 flex gap-2 flex-wrap">
        {REACTION_TYPES.map((reaction) => (
          <button
            key={reaction.key}
            onClick={() => handleReaction(reaction.key)}
            disabled={loadingReaction || hasReacted[reaction.key]}
            className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition ${
              hasReacted[reaction.key]
                ? 'bg-primary/20 text-primary border border-primary/50'
                : 'bg-surface-tertiary text-text-secondary hover:bg-accent/20 hover:text-accent border border-border-secondary'
            } disabled:opacity-50`}
          >
            <span className="text-base">{reaction.emoji}</span>
            <span>{reactionCounts[reaction.key] || 0}</span>
          </button>
        ))}
      </div>

      {/* Total reactions indicator */}
      {totalReactions > 0 && (
        <div className="px-4 pb-3 text-xs text-text-tertiary">
          {totalReactions} reaction{totalReactions !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
