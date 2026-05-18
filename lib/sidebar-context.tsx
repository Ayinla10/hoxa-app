'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'

interface SidebarState {
  collapsed: boolean
  mobileOpen: boolean
  toggleCollapsed: () => void
  setMobileOpen: (open: boolean) => void
}

const SidebarContext = createContext<SidebarState>({
  collapsed: false,
  mobileOpen: false,
  toggleCollapsed: () => {},
  setMobileOpen: () => {},
})

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const toggleCollapsed = useCallback(() => setCollapsed(v => !v), [])

  useEffect(() => {
    const saved = localStorage.getItem('hoxa_sidebar_collapsed')
    if (saved === 'true') setCollapsed(true)
  }, [])

  useEffect(() => {
    localStorage.setItem('hoxa_sidebar_collapsed', String(collapsed))
  }, [collapsed])

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  return (
    <SidebarContext.Provider value={{ collapsed, mobileOpen, toggleCollapsed, setMobileOpen }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  return useContext(SidebarContext)
}
