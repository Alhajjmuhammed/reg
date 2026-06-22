import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'

const MIME: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
  gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
  pdf: 'application/pdf', doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ filename: string }> }
) {
  const { filename } = await context.params
  const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), 'public', 'uploads')

  // Prevent path traversal
  if (!filename || filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
    return new NextResponse('Not found', { status: 404 })
  }

  const filePath = path.join(UPLOADS_DIR, filename)
  // Double-check resolved path is still inside uploads dir
  if (!filePath.startsWith(UPLOADS_DIR)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  try {
    const bytes = await readFile(filePath)
    const ext = filename.split('.').pop()?.toLowerCase() ?? 'bin'
    const contentType = MIME[ext] ?? 'application/octet-stream'
    return new NextResponse(bytes, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return new NextResponse('Not found', { status: 404 })
  }
}
