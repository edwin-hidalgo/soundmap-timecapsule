import { useState, useEffect } from 'react'

const cache = new Map()
const pending = new Map()

const queue = []
let active = 0
const MAX_CONCURRENT = 6
const BATCH_DELAY = 100

function enqueue(fn) {
  return new Promise((resolve, reject) => {
    queue.push(() => fn().then(resolve, reject))
    drain()
  })
}

function drain() {
  while (active < MAX_CONCURRENT && queue.length) {
    active++
    const task = queue.shift()
    task().finally(() => {
      active--
      setTimeout(drain, BATCH_DELAY)
    })
  }
}

async function fetchDeezer(type, query) {
  const url = `/api/deezer?type=${type}&q=${encodeURIComponent(query)}&limit=1`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Deezer ${res.status}`)
  const data = await res.json()
  if (data.error) throw new Error(data.error.message || 'Deezer error')
  return data
}

export async function getArtistImage(artistName) {
  if (!artistName) return null

  const key = artistName.toLowerCase().trim()
  if (cache.has(key)) return cache.get(key)
  if (pending.has(key)) return pending.get(key)

  const promise = enqueue(() => fetchDeezer('artist', artistName))
    .then(data => {
      const url = data.data?.[0]?.picture_medium || null
      cache.set(key, url)
      pending.delete(key)
      return url
    })
    .catch(() => {
      pending.delete(key)
      return null
    })

  pending.set(key, promise)
  return promise
}

export async function getTrackImage(trackName, artistName) {
  if (!trackName) return null

  const query = `${artistName || ''} ${trackName}`.trim()
  const key = `track:${query.toLowerCase()}`
  if (cache.has(key)) return cache.get(key)
  if (pending.has(key)) return pending.get(key)

  const promise = enqueue(() => fetchDeezer('track', query))
    .then(data => {
      const url = data.data?.[0]?.album?.cover_medium || null
      cache.set(key, url)
      pending.delete(key)
      return url
    })
    .catch(() => {
      pending.delete(key)
      return null
    })

  pending.set(key, promise)
  return promise
}

export function useArtistImages(artistNames) {
  const [images, setImages] = useState({})

  useEffect(() => {
    if (!artistNames?.length) return

    const names = [...new Set(artistNames.filter(Boolean))]
    let cancelled = false

    names.forEach(name => {
      getArtistImage(name).then(url => {
        if (!cancelled) {
          setImages(prev => ({ ...prev, [name.toLowerCase()]: url }))
        }
      })
    })

    return () => { cancelled = true }
  }, [JSON.stringify(artistNames)])

  return images
}

export function useTrackImages(tracks) {
  const [images, setImages] = useState({})

  useEffect(() => {
    if (!tracks?.length) return

    let cancelled = false

    tracks.forEach(t => {
      if (!t.name) return
      const key = `${t.artist || ''}:${t.name}`.toLowerCase()
      getTrackImage(t.name, t.artist).then(url => {
        if (!cancelled) {
          setImages(prev => ({ ...prev, [key]: url }))
        }
      })
    })

    return () => { cancelled = true }
  }, [JSON.stringify(tracks)])

  return images
}
