export const dynamic = 'force-dynamic'

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8010'

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'content-length',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
])

async function proxy(request, { params }) {
  const subPath = (params?.path || []).join('/')
  const backendUrl = new URL(`/auth/${subPath}`, BACKEND_URL)
  backendUrl.search = new URL(request.url).search

  const headers = new Headers(request.headers)
  HOP_BY_HOP_HEADERS.forEach((header) => headers.delete(header))

  const init = {
    method: request.method,
    headers,
    redirect: 'manual',
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.arrayBuffer()
  }

  try {
    const response = await fetch(backendUrl, init)
    const responseHeaders = new Headers(response.headers)
    HOP_BY_HOP_HEADERS.forEach((header) => responseHeaders.delete(header))

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ detail: 'Backend auth service unreachable', error: err.message }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

export const GET = proxy
export const POST = proxy
export const PUT = proxy
export const PATCH = proxy
export const DELETE = proxy
export const OPTIONS = proxy
