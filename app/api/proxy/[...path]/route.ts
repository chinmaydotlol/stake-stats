import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'http://163.5.160.51:3000/api'

export async function GET(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const path = pathname.replace('/api/proxy/', '')
  const url = `${API_BASE_URL}/${path}`

  try {
    const response = await fetch(url, { next: { revalidate: 60 } })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Proxy error:', error)
    if (error instanceof TypeError && error.message === 'fetch failed') {
      return NextResponse.json({ error: 'Unable to connect to the API server. Please try again later.' }, { status: 503 })
    }
    return NextResponse.json({ error: 'An unexpected error occurred. Please try again later.' }, { status: 500 })
  }
}