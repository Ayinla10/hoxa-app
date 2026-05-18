'use client'

import { useState, useRef } from 'react'
import { Upload, Loader2, CheckCircle2, ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { submitPaymentProof } from '@/actions/transactions'
import { useRouter } from 'next/navigation'

export default function PaymentProofUpload({ transactionId }: { transactionId: string }) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setError('')
    setUploading(true)

    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const path = `${transactionId}/${Date.now()}.${ext}`

      const { error: uploadErr } = await supabase.storage.from('payment-proofs').upload(path, file, { upsert: true })
      if (uploadErr) throw new Error(uploadErr.message)

      const { data: { publicUrl } } = supabase.storage.from('payment-proofs').getPublicUrl(path)

      const result = await submitPaymentProof(transactionId, publicUrl, reference, notes)
      if (result.error) throw new Error(result.error)

      setDone(true)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  if (done) {
    return (
      <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl">
        <CheckCircle2 size={24} className="text-green-600" />
        <div>
          <p className="text-green-800 font-semibold text-sm">Payment proof submitted</p>
          <p className="text-green-600 text-xs">Admin will verify and notify the seller.</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* File drop zone */}
      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center cursor-pointer hover:border-[#177945]/50 hover:bg-[#F7F9F8] transition-all"
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={e => setFile(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <div className="flex items-center justify-center gap-2">
            <ImageIcon size={20} className="text-[#177945]" />
            <span className="text-gray-900 font-medium text-sm">{file.name}</span>
          </div>
        ) : (
          <>
            <Upload size={24} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm font-medium">Upload payment screenshot</p>
            <p className="text-gray-400 text-xs mt-1">PNG, JPG or PDF · Max 10MB</p>
          </>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Reference / Transaction ID</label>
        <input
          type="text"
          value={reference}
          onChange={e => setReference(e.target.value)}
          placeholder="e.g. MTN-123456789"
          required
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#177945] focus:ring-2 focus:ring-[#177945]/10 transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Any additional information..."
          rows={2}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#177945] focus:ring-2 focus:ring-[#177945]/10 transition-all resize-none"
        />
      </div>

      {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-xl">{error}</p>}

      <button
        type="submit"
        disabled={uploading || !file || !reference}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#177945] to-[#1a9152] text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {uploading ? <><Loader2 size={15} className="animate-spin" /> Uploading...</> : 'Submit Payment Proof'}
      </button>
    </form>
  )
}
