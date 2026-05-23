'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { MoreVertical, Store, User, Loader2, Trash2, Ban, ShieldCheck, ExternalLink } from 'lucide-react'
import { setUserRole, deleteUser, banUser, unbanUser } from '@/actions/admin'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function UserActionsMenu({
  userId,
  currentRole,
  userName,
  isBanned = false,
}: {
  userId: string
  currentRole: string
  userName: string
  isBanned?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const calcPosition = useCallback(() => {
    if (!btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    const menuW = 176 // w-44 = 11rem = 176px
    const menuH = 200 // estimated max height
    const vw = window.innerWidth
    const vh = window.innerHeight

    let top = rect.bottom + 4
    let left = rect.right - menuW

    // If menu would go off right edge
    if (left + menuW > vw - 8) left = vw - menuW - 8
    // If menu would go off left edge
    if (left < 8) left = 8
    // If menu would go below viewport, open upward
    if (top + menuH > vh - 8) top = rect.top - menuH - 4

    setMenuPos({ top, left })
  }, [])

  function toggle() {
    if (!open) calcPosition()
    setOpen(v => !v)
  }

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    function handleScroll() { setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    window.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [open])

  async function changeRole(role: string) {
    setOpen(false)
    setLoading(true)
    await setUserRole(userId, role)
    router.refresh()
    setLoading(false)
  }

  async function handleBanToggle() {
    setOpen(false)
    const msg = isBanned
      ? `Unban ${userName}? They can log in again.`
      : `Ban ${userName}? They will be immediately signed out.`
    if (!confirm(msg)) return
    setLoading(true)
    const res = isBanned ? await unbanUser(userId) : await banUser(userId)
    if (res?.error) alert(res.error)
    else router.refresh()
    setLoading(false)
  }

  async function handleDelete() {
    setOpen(false)
    if (!confirm(`Permanently delete ${userName}? This removes their account, profile, and all related data. This cannot be undone.`)) return
    setLoading(true)
    const result = await deleteUser(userId)
    if (result.error) {
      alert(result.error)
      setLoading(false)
      return
    }
    router.refresh()
    setLoading(false)
  }

  // Admin accounts are completely separate — no role change options for admins
  // For non-admin users, only allow switching between buyer and seller
  const actions = currentRole === 'admin' ? [] : [
    { role: 'seller', label: 'Make Seller', icon: Store, show: currentRole !== 'seller' },
    { role: 'buyer', label: 'Set as Buyer', icon: User, show: currentRole !== 'buyer' },
  ].filter(a => a.show)

  const menu = open && menuPos ? createPortal(
    <>
      {/* Invisible backdrop to catch outside clicks on mobile */}
      <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
      <div
        ref={menuRef}
        className="fixed z-[9999] bg-white rounded-xl shadow-xl border border-gray-200 py-1 w-44 text-sm animate-in fade-in zoom-in-95 duration-150"
        style={{ top: menuPos.top, left: menuPos.left }}
      >
        <p className="px-3 py-1.5 text-gray-400 text-xs font-medium truncate border-b border-gray-100 mb-1">{userName}</p>

        {/* View detail */}
        <Link
          href={`/admin/users/${userId}`}
          onClick={() => setOpen(false)}
          className="flex items-center gap-2.5 w-full px-3 py-2 hover:bg-gray-50 transition-colors text-left text-gray-700 text-sm"
        >
          <ExternalLink size={14} /> View Profile
        </Link>

        {currentRole === 'admin' && (
          <p className="px-3 py-2 text-gray-400 text-xs italic">Admin accounts cannot be modified</p>
        )}
        {actions.map(a => (
          <button
            key={a.role}
            onClick={() => changeRole(a.role)}
            className="flex items-center gap-2.5 w-full px-3 py-2 hover:bg-gray-50 transition-colors text-left text-gray-700 text-sm"
          >
            <a.icon size={14} />
            {a.label}
          </button>
        ))}
        {currentRole !== 'admin' && (
          <div className="border-t border-gray-100 mt-1 pt-1">
            <button
              onClick={handleBanToggle}
              className={`flex items-center gap-2.5 w-full px-3 py-2 transition-colors text-left text-sm ${isBanned ? 'hover:bg-green-50 text-green-700' : 'hover:bg-amber-50 text-amber-600'}`}
            >
              {isBanned ? <ShieldCheck size={14} /> : <Ban size={14} />}
              {isBanned ? 'Unban User' : 'Ban User'}
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2.5 w-full px-3 py-2 hover:bg-red-50 transition-colors text-left text-red-500 text-sm"
            >
              <Trash2 size={14} />
              Delete User
            </button>
          </div>
        )}
      </div>
    </>,
    document.body
  ) : null

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        disabled={loading}
        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 size={15} className="animate-spin" /> : <MoreVertical size={15} />}
      </button>
      {menu}
    </>
  )
}
