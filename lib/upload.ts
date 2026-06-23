'use client'

/**
 * Upload a file to /api/upload and return the server URL (/api/uploads/uuid.ext).
 * Throws on network error or server error (message from server is used).
 */
export async function uploadFile(file: File): Promise<string> {
  const body = new FormData()
  body.append('file', file)
  const res = await fetch('/api/upload', { method: 'POST', body })

  // Parse body safely — nginx can return HTML (e.g. 413 Entity Too Large)
  // before the request even reaches Next.js, so content-type must be checked.
  const contentType = res.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    if (res.status === 413) {
      throw new Error('File too large — please reduce the image size and try again (max 5 MB)')
    }
    throw new Error(`Upload failed (${res.status}) — please try again`)
  }

  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Upload failed')
  return json.url as string
}
