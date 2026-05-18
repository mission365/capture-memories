import { NextResponse } from 'next/server'
import { getBearerToken, serverSupabaseRequest } from '@/lib/supabase-server'

function readText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function buildHeroSlideParams(selector: unknown) {
  const rawSelector =
    selector && typeof selector === 'object' && !Array.isArray(selector)
      ? (selector as Record<string, unknown>)
      : {}

  const params = new URLSearchParams({
    select: '*',
  })

  const id = readText(rawSelector.id)

  if (id) {
    params.set('id', `eq.${id}`)
    return params
  }

  const imageUrl = readText(rawSelector.imageUrl || rawSelector.image_url)
  const createdAt = readText(rawSelector.createdAt || rawSelector.created_at)
  const title = readText(rawSelector.title)
  const sortOrder = Number(rawSelector.sortOrder ?? rawSelector.sort_order)

  if (createdAt && imageUrl) {
    params.set('created_at', `eq.${createdAt}`)
    params.set('image_url', `eq.${imageUrl}`)
    return params
  }

  if (imageUrl) {
    params.set('image_url', `eq.${imageUrl}`)

    if (Number.isFinite(sortOrder)) {
      params.set('sort_order', `eq.${sortOrder}`)
    }

    if (title) {
      params.set('title', `eq.${title}`)
    }

    return params
  }

  throw new Error('Hero slide identifier is missing.')
}

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
    const { id, payload, selector } = await request.json()
    const params = buildHeroSlideParams(selector || { id })

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
    const { id, selector } = await request.json()
    const params = buildHeroSlideParams(selector || { id })

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
