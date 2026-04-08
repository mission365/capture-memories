type SupabaseRequestOptions = {
  accessToken?: string
  body?: BodyInit | null
  contentType?: string
  json?: boolean
  method?: string
  prefer?: string
}

export function getServerSupabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || '',
    storageBucket: process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET?.trim() || 'site-assets',
  }
}

export function getBearerToken(authorizationHeader?: string | null) {
  if (!authorizationHeader?.startsWith('Bearer ')) {
    return ''
  }

  return authorizationHeader.slice('Bearer '.length).trim()
}

function createServerSupabaseHeaders({ accessToken, contentType, json = true, prefer }: SupabaseRequestOptions = {}) {
  const { anonKey } = getServerSupabaseConfig()
  const headers: Record<string, string> = {
    apikey: anonKey,
    Authorization: `Bearer ${accessToken || anonKey}`,
  }

  if (contentType) {
    headers['Content-Type'] = contentType
  } else if (json) {
    headers['Content-Type'] = 'application/json'
  }

  if (prefer) {
    headers.Prefer = prefer
  }

  return headers
}

export function buildServerSupabaseHeaders(options: SupabaseRequestOptions = {}) {
  return createServerSupabaseHeaders(options)
}

export async function readSupabaseServerResponse(response: Response) {
  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text().catch(() => '')

  if (!response.ok) {
    const message =
      (typeof payload === 'string' && payload) ||
      payload?.msg ||
      payload?.message ||
      payload?.error_description ||
      payload?.error ||
      'Supabase request failed.'

    throw new Error(message)
  }

  return payload
}

export async function serverSupabaseRequest(path: string, options: SupabaseRequestOptions = {}) {
  const { url } = getServerSupabaseConfig()

  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable.')
  }

  const response = await fetch(`${url}${path}`, {
    method: options.method || 'GET',
    headers: createServerSupabaseHeaders(options),
    body: options.body,
    cache: 'no-store',
  })

  return readSupabaseServerResponse(response)
}

export async function serverSupabaseFetch(path: string, options: SupabaseRequestOptions = {}) {
  const { url } = getServerSupabaseConfig()

  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable.')
  }

  return fetch(`${url}${path}`, {
    method: options.method || 'GET',
    headers: buildServerSupabaseHeaders(options),
    body: options.body,
    cache: 'no-store',
  })
}
