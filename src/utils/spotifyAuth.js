/**
 * spotifyAuth.js — Spotify OAuth 2.0 Authorization Code Flow with PKCE
 *
 * This implements the OAuth 2.0 Authorization Code Flow with PKCE (Proof Key for Public Clients)
 * which is the recommended flow for single-page applications.
 *
 * Reference: https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow
 */

/**
 * Generate a random string for PKCE code_challenge
 */
function generateRandomString(length) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
  let text = ''
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}

/**
 * Generate SHA256 hash of the code verifier (for PKCE)
 */
async function sha256(plain) {
  const encoder = new TextEncoder()
  const data = encoder.encode(plain)
  const hash = await crypto.subtle.digest('SHA-256', data)
  const bytes = new Uint8Array(hash)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * generateAuthUrl
 * Generates the authorization URL to redirect the user to Spotify login.
 *
 * Returns: { authUrl: string, codeVerifier: string }
 * Store codeVerifier in sessionStorage for the callback.
 */
export async function generateAuthUrl(clientId, redirectUri, scopes = []) {
  const defaultScopes = [
    'user-read-private',
    'user-read-email',
    'user-top-read',
    'user-read-recently-played',
  ]
  const allScopes = scopes.length > 0 ? scopes : defaultScopes

  const codeVerifier = generateRandomString(128)
  const codeChallenge = await sha256(codeVerifier)

  // Store code verifier for later use in callback
  sessionStorage.setItem('spotify_code_verifier', codeVerifier)

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: allScopes.join(' '),
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
  })

  return `https://accounts.spotify.com/authorize?${params.toString()}`
}

/**
 * exchangeCodeForToken
 * Exchange authorization code for access token (called from callback URL)
 *
 * Requires: clientId, redirectUri, code from URL params, codeVerifier from sessionStorage
 */
export async function exchangeCodeForToken(clientId, redirectUri, code) {
  const codeVerifier = sessionStorage.getItem('spotify_code_verifier')

  if (!codeVerifier) {
    throw new Error('Code verifier not found in session. Authorization flow was interrupted.')
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(`Token exchange failed: ${errorData.error_description || errorData.error}`)
  }

  const data = await response.json()

  // Clear code verifier from session
  sessionStorage.removeItem('spotify_code_verifier')

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    tokenType: data.token_type,
    expiresAt: Date.now() + data.expires_in * 1000,
  }
}

/**
 * refreshAccessToken
 * Refresh an expired access token using the refresh token
 */
export async function refreshAccessToken(clientId, refreshToken) {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(`Token refresh failed: ${errorData.error_description || errorData.error}`)
  }

  const data = await response.json()

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
    expiresAt: Date.now() + data.expires_in * 1000,
    refreshToken: data.refresh_token || refreshToken, // refresh_token may not be returned
  }
}

/**
 * spotifyApiFetch
 * Helper to make authenticated requests to Spotify API with automatic token refresh.
 * Requires token state to be passed in.
 */
export async function spotifyApiFetch(url, accessToken, refreshToken, clientId, onTokenRefresh) {
  let token = accessToken

  // Try the request
  let response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  // If 401 Unauthorized, refresh token and retry
  if (response.status === 401 && refreshToken) {
    const newToken = await refreshAccessToken(clientId, refreshToken)
    onTokenRefresh(newToken) // callback to update token state

    token = newToken.accessToken
    response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  }

  if (!response.ok) {
    throw new Error(`Spotify API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}
