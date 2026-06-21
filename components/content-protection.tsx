'use client'

import { useEffect } from 'react'

export function ContentProtection() {
  useEffect(() => {
    // Block right-click context menu
    const blockContext = (e: MouseEvent) => e.preventDefault()

    // Block keyboard shortcuts: Ctrl/Cmd + U/S/A/C/P + F12 + F5 (view-source / save / select-all / copy / print)
    const blockKeys = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey

      if (
        e.key === 'F12' ||
        (ctrl && e.key === 'u') ||
        (ctrl && e.key === 'U') ||
        (ctrl && e.key === 's') ||
        (ctrl && e.key === 'S') ||
        (ctrl && e.key === 'p') ||
        (ctrl && e.key === 'P') ||
        (ctrl && e.shiftKey && (e.key === 'i' || e.key === 'I')) ||
        (ctrl && e.shiftKey && (e.key === 'j' || e.key === 'J')) ||
        (ctrl && e.shiftKey && (e.key === 'c' || e.key === 'C'))
      ) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
    }

    // Block drag-and-drop of images/text
    const blockDrag = (e: DragEvent) => e.preventDefault()

    document.addEventListener('contextmenu', blockContext)
    document.addEventListener('keydown', blockKeys)
    document.addEventListener('dragstart', blockDrag)

    return () => {
      document.removeEventListener('contextmenu', blockContext)
      document.removeEventListener('keydown', blockKeys)
      document.removeEventListener('dragstart', blockDrag)
    }
  }, [])

  return null
}
