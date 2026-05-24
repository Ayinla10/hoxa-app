'use client'

import { useState } from 'react'
import { Star, CheckCircle2 } from 'lucide-react'
import { submitRating } from '@/actions/ratings'

interface Props {
  transactionId: string
  role: 'buyer' | 'seller'
  rateeName: string
  existingScore?: number | null
}

const LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Great',
  5: 'Excellent',
}

export default function RatingWidget({ transactionId, role, rateeName, existingScore }: Props) {
  const [hovered, setHovered] = useState(0)
  const [selected, setSelected] = useState(existingScore ?? 0)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(!!existingScore)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!selected) return
    setLoading(true)
    setError('')
    const result = await submitRating({ transactionId, role, score: selected, comment })
    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }
    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-2.5 py-3 px-4 bg-green-50 rounded-xl border border-green-100">
        <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-green-700">
            You rated {rateeName} {selected} star{selected !== 1 ? 's' : ''}
          </p>
          <div className="flex gap-0.5 mt-0.5">
            {[1, 2, 3, 4, 5].map(s => (
              <Star
                key={s}
                size={12}
                className={s <= selected ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const display = hovered || selected

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-gray-900 mb-0.5">Rate your exchanger</p>
        <p className="text-xs text-gray-400">How was your experience with {rateeName}?</p>
      </div>

      {/* Stars */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(s => (
          <button
            key={s}
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setSelected(s)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              size={28}
              className={`transition-colors ${
                s <= display
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-gray-200 fill-gray-200'
              }`}
            />
          </button>
        ))}
        {display > 0 && (
          <span className="ml-2 text-sm font-medium text-gray-600">{LABELS[display]}</span>
        )}
      </div>

      {/* Optional comment */}
      {selected > 0 && (
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Leave a comment (optional)"
          rows={2}
          className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:border-[#177945] focus:ring-2 focus:ring-[#177945]/10 resize-none"
        />
      )}

      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={!selected || loading}
        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#177945] to-[#1a9152] text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center gap-2"
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <Star size={14} className="fill-white" />
        )}
        Submit Rating
      </button>
    </div>
  )
}
