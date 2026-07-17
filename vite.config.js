import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    {
      name: 'deezer-proxy',
      configureServer(server) {
        server.middlewares.use('/api/deezer', async (req, res) => {
          try {
            const params = new URLSearchParams((req.url || '').split('?')[1] || '')
            const type = params.get('type') || 'artist'
            const q = params.get('q') || ''
            const limit = params.get('limit') || '1'
            const endpoint = type === 'track' ? 'search/track' : 'search/artist'
            const deezerRes = await fetch(
              `https://api.deezer.com/${endpoint}?q=${encodeURIComponent(q)}&limit=${limit}`
            )
            const data = await deezerRes.json()
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(data))
          } catch {
            res.statusCode = 502
            res.end(JSON.stringify({ error: 'Deezer proxy error', data: [] }))
          }
        })
      },
    },
  ],
})
