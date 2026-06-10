import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const BASE_PATH = process.env.NODE_ENV === 'production' ? '/masterclass' : ''

/** Prepend the Next.js basePath to a /public asset URL so images work on VPS */
export function assetUrl(path: string): string {
  if (!path || path.startsWith('http') || path.startsWith('data:')) return path
  return `${BASE_PATH}${path}`
}
