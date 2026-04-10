/**
 * supabase.js
 * Initialize Supabase client for hackathon broadcasts feature
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase keys not configured. Broadcasts feature will not work.')
  console.warn('Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

/**
 * Upsert user profile to Supabase after OAuth
 * Called when spotifyUser is fetched from /v1/me
 */
export async function upsertProfile(spotifyUser) {
  if (!spotifyUser?.id) return null

  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        spotify_user_id: spotifyUser.id,
        display_name: spotifyUser.display_name || 'Unknown',
        avatar_url: spotifyUser.images?.[0]?.url || null,
      },
      { onConflict: 'spotify_user_id' }
    )
    .select()

  if (error) {
    console.error('Error upserting profile:', error)
    return null
  }
  return data?.[0] || null
}

/**
 * Create a new broadcast
 */
export async function createBroadcast(broadcastData) {
  const { data, error } = await supabase.from('broadcasts').insert([broadcastData]).select()

  if (error) {
    console.error('Error creating broadcast:', error)
    return null
  }
  return data?.[0] || null
}

/**
 * Stop a broadcast (set is_live = false)
 */
export async function stopBroadcast(broadcastId) {
  const { data, error } = await supabase
    .from('broadcasts')
    .update({ is_live: false })
    .eq('id', broadcastId)
    .select()

  if (error) {
    console.error('Error stopping broadcast:', error)
    return null
  }
  return data?.[0] || null
}

/**
 * Add a reaction to a broadcast
 */
export async function addReaction(broadcastId, reactionType, reactorSpotifyId = null) {
  const { data, error } = await supabase
    .from('reactions')
    .insert([
      {
        broadcast_id: broadcastId,
        reaction_type: reactionType,
        reactor_spotify_id: reactorSpotifyId,
      },
    ])
    .select()

  if (error) {
    console.error('Error adding reaction:', error)
    return null
  }
  return data?.[0] || null
}

/**
 * Get all active broadcasts with reaction counts
 * Realtime subscriptions should be used in components
 */
export async function getActiveBroadcasts() {
  const { data, error } = await supabase
    .from('broadcasts')
    .select(
      `
      id,
      spotify_user_id,
      display_name,
      avatar_url,
      situation_label,
      current_song_name,
      current_song_artist,
      current_song_art,
      ai_narration,
      is_live,
      created_at,
      reactions(reaction_type)
    `
    )
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching broadcasts:', error)
    return []
  }

  // Aggregate reaction counts
  return (data || []).map((b) => ({
    ...b,
    reactions_count: b.reactions?.length || 0,
    reaction_counts: aggregateReactions(b.reactions || []),
  }))
}

/**
 * Helper to aggregate reactions by type
 */
function aggregateReactions(reactions) {
  const counts = {
    unhinged: 0,
    cinematic: 0,
    core: 0,
    main_character: 0,
  }

  for (const reaction of reactions) {
    if (reaction.reaction_type in counts) {
      counts[reaction.reaction_type] += 1
    }
  }

  return counts
}

/**
 * Subscribe to broadcasts realtime
 * Returns unsubscribe function
 */
export function subscribeToBroadcasts(onUpdate) {
  const subscription = supabase
    .channel('broadcasts_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'broadcasts',
      },
      (payload) => {
        onUpdate(payload)
      }
    )
    .subscribe()

  return () => {
    subscription.unsubscribe()
  }
}

/**
 * Subscribe to reactions realtime
 */
export function subscribeToReactions(onUpdate) {
  const subscription = supabase
    .channel('reactions_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'reactions',
      },
      (payload) => {
        onUpdate(payload)
      }
    )
    .subscribe()

  return () => {
    subscription.unsubscribe()
  }
}
