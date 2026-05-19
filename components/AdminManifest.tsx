'use client'

import { useEffect } from 'react'

export default function AdminManifest() {
  useEffect(() => {
    // Swap manifest link to admin-specific one
    const link = document.querySelector('link[rel="manifest"]')
    if (link) {
      link.setAttribute('href', '/admin-manifest.json')
    }
    // Also update theme color for admin
    const theme = document.querySelector('meta[name="theme-color"]')
    if (theme) {
      theme.setAttribute('content', '#0f6a3d')
    }
  }, [])

  return null
}
