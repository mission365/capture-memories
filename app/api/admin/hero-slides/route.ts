import { NextResponse } from 'next/server'
import { getBearerToken, serverSupabaseRequest } from '@/lib/supabase-server'

export async function GET(request: Request) {
  try {
    const token = getBearerToken(request.headers.get('authorization'))
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const params = new URLSearchParams({
      select: '*',
      order: 'sort_order.asc.nullslast,created_at.asc',
    })

    if (!includeInactive) {
      params.set('is_active', 'eq.true')
    }

    const payload = await serverSupabaseRequest(`/rest/v1/hero_slides?${params.toString()}`, {
      accessToken: token,
      json: false,
    })

    return NextResponse.json(payload)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Hero slides could not be loaded.' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const token = getBearerToken(request.headers.get('authorization'))
    const payload = await request.json()
    const result = await serverSupabaseRequest('/rest/v1/hero_slides?select=*', {
      method: 'POST',
      accessToken: token,
      prefer: 'return=representation',
      body: JSON.stringify(payload),
    })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Hero slide could not be created.' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const token = getBearerToken(request.headers.get('authorization'))
    const { id, payload } = await request.json()
    const params = new URLSearchParams({
      id: `eq.${id}`,
      select: '*',
    })

    const result = await serverSupabaseRequest(`/rest/v1/hero_slides?${params.toString()}`, {
      method: 'PATCH',
      accessToken: token,
      prefer: 'return=representation',
      body: JSON.stringify(payload),
    })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Hero slide could not be updated.' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const token = getBearerToken(request.headers.get('authorization'))
    const { id } = await request.json()
    const params = new URLSearchParams({
      id: `eq.${id}`,
      select: '*',
    })

    const result = await serverSupabaseRequest(`/rest/v1/hero_slides?${params.toString()}`, {
      method: 'DELETE',
      accessToken: token,
      prefer: 'return=representation',
      json: false,
    })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Hero slide could not be deleted.' },
      { status: 500 }
    )
  }
}
