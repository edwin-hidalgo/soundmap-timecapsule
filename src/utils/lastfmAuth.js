import md5 from 'blueimp-md5'

const API_KEY = import.meta.env.VITE_LASTFM_API_KEY
const SHARED_SECRET = import.meta.env.VITE_LASTFM_SHARED_SECRET

export function signRequest(params) {
  const sorted = Object.keys(params).sort()
  let sig = ''
  for (const key of sorted) {
    sig += key + params[key]
  }
  return md5(sig + SHARED_SECRET)
}

export function generateAuthUrl() {
  const callbackUrl = `${window.location.origin}/lastfm-callback`
  const params = new URLSearchParams({
    api_key: API_KEY,
    cb: callbackUrl,
  })
  return `https://www.last.fm/api/auth/?${params.toString()}`
}

export async function getSession(token) {
  const params = {
    api_key: API_KEY,
    method: 'auth.getSession',
    token,
  }
  const apiSig = signRequest(params)

  const url = new URL('https://ws.audioscrobbler.com/2.0/')
  url.searchParams.set('method', 'auth.getSession')
  url.searchParams.set('api_key', API_KEY)
  url.searchParams.set('token', token)
  url.searchParams.set('api_sig', apiSig)
  url.searchParams.set('format', 'json')

  const response = await fetch(url)
  const data = await response.json()

  if (data.error) {
    throw new Error(data.message || `Last.fm auth error (code ${data.error})`)
  }

  return {
    key: data.session.key,
    name: data.session.name,
  }
}

export function saveSession(session) {
  localStorage.setItem('lastfm_session', JSON.stringify(session))
}

export function loadSession() {
  const saved = localStorage.getItem('lastfm_session')
  if (!saved) return null
  try {
    return JSON.parse(saved)
  } catch {
    return null
  }
}

export function clearSession() {
  localStorage.removeItem('lastfm_session')
  localStorage.removeItem('lastfm_user')
}
