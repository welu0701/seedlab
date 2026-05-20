import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 })
  }

  try {
    const { query } = await req.json()

    if (!query?.trim()) {
      return new Response(JSON.stringify({ data: [] }), {
        headers: { "Content-Type": "application/json" },
      })
    }

    // Call Trefle API from the server (no CORS issues)
    const response = await fetch(
      `https://trefle.io/api/v1/plants/search?q=${encodeURIComponent(query)}`
    )

    const data = await response.json()

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Trefle search error:", error)
    return new Response(JSON.stringify({ error: "Search failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})
