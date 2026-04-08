import { NextResponse } from 'next/server'
import { getBearerToken, serverSupabaseRequest } from '@/lib/supabase-server'

export async function GET(request: Request) {
  try {
    const token = getBearerToken(request.headers.get('authorization'))
    const params = new URLSearchParams({
      select: 'section_key,content,updated_at',
      order: 'section_key.asc',
    })

    const payload = await serverSupabaseRequest(`/rest/v1/site_sections?${params.toString()}`, {
      accessToken: token,
      json: false,
    })

    return NextResponse.json(payload)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Site sections could not be loaded.' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const token = getBearerToken(request.headers.get('authorization'))
    const { sectionKey, content } = await request.json()
    const params = new URLSearchParams({
      on_conflict: 'section_key',
      select: 'section_key,content,updated_at',
    })

    const result = await serverSupabaseRequest(`/rest/v1/site_sections?${params.toString()}`, {
      method: 'POST',
      accessToken: token,
      prefer: 'resolution=merge-duplicates,return=representation',
      body: JSON.stringify({
        section_key: sectionKey,
        content,
      }),
    })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Site section could not be saved.' },
      { status: 500 }
    )
  }
}
