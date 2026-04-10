/**
 * claudeAPI.js — Generate dramatic Hollywood narrations for "main character moments"
 */

import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true, // OK for hackathon demo
})

/**
 * generateNarration
 * Generates an over-the-top dramatic movie trailer narration for a user's "main character moment"
 *
 * @param {string} situation - e.g., "about to break up", "cooking pasta at midnight"
 * @param {string} songName - e.g., "All Too Well"
 * @param {string} artist - e.g., "Taylor Swift"
 * @returns {Promise<string>} - The dramatic narration (2-3 sentences)
 */
export async function generateNarration(situation, songName, artist) {
  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      messages: [
        {
          role: 'user',
          content: `You are a brutally honest, sassy narrator commentating on someone's MAIN CHARACTER MOMENT. They're living their life right now with a song as their soundtrack.

Song: "${songName}" by ${artist}
Their situation: "${situation}"

Write a 2-3 sentence SASSY, JUDGMENTAL narration. Be mean but in a hilarious, affirming way. Call out the absurdity. Make emotional observations. React with raw personality—be unhinged, be chaotic, make them FEEL SEEN. Dramatic pauses. Short punchy sentences. This narration has to be MEMORABLE and SHAREABLE. Make them laugh AND feel attacked (in a good way). NO QUOTES, just the narration itself.`,
        },
      ],
    })

    const narration = message.content[0].type === 'text' ? message.content[0].text : ''
    return narration.trim()
  } catch (err) {
    console.error('Failed to generate narration:', err)
    // Fallback narration if Claude fails
    return `In a world where "${songName}" plays and the moment is "${situation}"... one person stood ready to claim their main character arc.`
  }
}
