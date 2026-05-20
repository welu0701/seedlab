import { VercelRequest, VercelResponse } from '@vercel/node'

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { query } = req.body

  if (!query?.trim()) {
    return res.json({ data: [] })
  }

  try {
    const apiKey = process.env.TREFLE_API_KEY
    if (!apiKey) {
      return res.status(500).json({ error: 'Trefle API key not configured' })
    }

    const response = await fetch(
      `https://trefle.io/api/v1/plants/search?q=${encodeURIComponent(query)}&token=${apiKey}`
    )
    const data = await response.json()
    return res.json(data)
  } catch (error) {
    console.error('Trefle search error:', error)
    return res.status(500).json({ error: 'Search failed' })
  }
}
