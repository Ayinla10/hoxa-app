'use client'

import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import CreateAdminModal from './CreateAdminModal'

export default function UsersPageClient() {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#18824a] to-[#0f6a3d] text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm flex-shrink-0 mt-1"
      >
        <UserPlus size={15} />
        <span className="hidden sm:inline">Create Admin</span>
      </button>

      {showModal && <CreateAdminModal onClose={() => setShowModal(false)} />}
    </>
  )
}
