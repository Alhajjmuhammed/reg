import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

export const dynamic = 'force-dynamic'

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'])
const ALLOWED_DOC_TYPES = new Set(['application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
])
const MAX_IMAGE_BYTES = 5 * 1024 * 1024   // 5 MB
const MAX_DOC_BYTES   = 20 * 1024 * 1024  // 20 MB

export async function POST(req: NextRequest) {
  const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), 'public', 'uploads')
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const isImage = ALLOWED_IMAGE_TYPES.has(file.type)
    const isDoc   = ALLOWED_DOC_TYPES.has(file.type)

    if (!isImage && !isDoc) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
    }
    if (isImage && file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: 'Image too large (max 5 MB)' }, { status: 400 })
    }
    if (isDoc && file.size > MAX_DOC_BYTES) {
      return NextResponse.json({ error: 'File too large (max 20 MB)' }, { status: 400 })
    }

    const ext = (file.name.split('.').pop() ?? 'bin').toLowerCase().replace(/[^a-z0-9]/g, '')
    const filename = `${uuidv4()}.${ext}`

    await mkdir(UPLOADS_DIR, { recursive: true, mode: 0o755 })
    const bytes = await file.arrayBuffer()
    await writeFile(path.join(UPLOADS_DIR, filename), Buffer.from(bytes), { mode: 0o644 })

    // Serve via /api/uploads/[filename] route (guaranteed Next.js — no nginx/static issues)
    return NextResponse.json({ url: `/api/uploads/${filename}` })
  } catch (err) {
    console.error('[api/upload]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
