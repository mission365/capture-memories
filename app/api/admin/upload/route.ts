import { NextResponse } from 'next/server'
import {
  getBearerToken,
  getServerSupabaseConfig,
  readSupabaseServerResponse,
  serverSupabaseFetch,
} from '@/lib/supabase-server'

const RETRYABLE_STATUS_CODES = new Set([502, 503, 504])

function sanitizeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.-]+/g, '-').replace(/^-+|-+$/g, '')
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function uploadWithRetry(path: string, accessToken: string, file: File) {
  const fileBytes = new Uint8Array(await file.arrayBuffer())
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await serverSupabaseFetch(path, {
        method: 'POST',
        accessToken,
        json: false,
        contentType: file.type || 'application/octet-stream',
        body: fileBytes,
      })

      if (RETRYABLE_STATUS_CODES.has(response.status) && attempt < 3) {
        await wait(400 * attempt)
        continue
      }

      return await readSupabaseServerResponse(response)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Image upload failed.')

      if (attempt < 3) {
        await wait(400 * attempt)
        continue
      }
    }
  }

  throw lastError || new Error('Image upload failed.')
}

export async function POST(request: Request) {
  try {
    const token = getBearerToken(request.headers.get('authorization'))
    const formData = await request.formData()
    const file = formData.get('file')
    const folder = sanitizeFileName(String(formData.get('folder') || 'hero-slides')) || 'hero-slides'

    if (!(file instanceof File)) {
      return NextResponse.json({ message: 'Please select an image file.' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ message: 'Only image files are allowed.' }, { status: 400 })
    }

    const { storageBucket, url } = getServerSupabaseConfig()
    const safeName = sanitizeFileName(file.name || 'image')
    const filePath = `${folder}/${Date.now()}-${safeName}`

    await uploadWithRetry(`/storage/v1/object/${storageBucket}/${filePath}`, token, file)

    return NextResponse.json({
      filePath,
      publicUrl: `${url}/storage/v1/object/public/${storageBucket}/${filePath}`,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Image upload failed.'
    const normalizedMessage =
      message.includes('502') || message.includes('Bad gateway')
        ? 'Supabase storage returned a temporary 502 error. Please retry once. If it keeps happening, try again shortly.'
        : message

    return NextResponse.json(
      { message: normalizedMessage },
      { status: 500 }
    )
  }
}
