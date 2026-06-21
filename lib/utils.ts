import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Return the asset path — basePath is now empty so this is a passthrough */
export function assetUrl(path: string): string {
  if (!path || path.startsWith('http') || path.startsWith('data:')) return path
  return path
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
