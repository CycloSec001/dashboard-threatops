export const dynamic = 'force-dynamic'

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8010'

export async function GET(request) {
  try {
    const backendUrl = new URL('/healthz', BACKEND_URL)
    backendUrl.search = new URL(request.url).search
    const response = await fetch(backendUrl, {
      headers: request.headers,
      signal: AbortSignal.timeout(3000),
    })

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ status: 'offline', online: false, error: err.message }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}