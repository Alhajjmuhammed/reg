'use client'

/**
 * Upload a file to /api/upload and return the server URL (/uploads/uuid.ext).
 * Throws on network error or server error (message from server is used).
 */
export async function uploadFile(file: File): Promise<string> {
  const body = new FormData()
  body.append('file', file)
  const res = await fetch('/api/upload', { method: 'POST', body })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Upload failed')
  return json.url as string
}
