import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Normalise an asset path for display. Rewrites legacy /uploads/ paths to the
 *  /api/uploads/ route handler which is guaranteed to go through Next.js. */
export function assetUrl(url: string): string {
  if (!url || url.startsWith('http') || url.startsWith('data:')) return url
  if (url.startsWith('/uploads/')) return '/api' + url
  return url
}

/**
 * Strip dangerous tags (script, style, iframe, object, embed) from an HTML string.
 * Uses DOMParser so it's only called on the client. Returns the original string on the server.
 */
export function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined' || !html) return html
  const doc = new DOMParser().parseFromString(html, 'text/html')
  doc.querySelectorAll('script, style, iframe, object, embed, form').forEach(el => el.remove())
  return doc.body.innerHTML
}
