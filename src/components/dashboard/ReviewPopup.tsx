'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  userId: string
  lastPromptAt: string | null
}

const PROMPT_INTERVAL_MS = 3.5 * 24 * 60 * 60 * 1000 // roughly twice a week

export default function ReviewPopup({ userId, lastPromptAt }: Props) {
  const [show, setShow] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const due = !lastPromptAt || (Date.now() - new Date(lastPromptAt).getTime() > PROMPT_INTERVAL_MS)
    if (due) {
      const timer = setTimeout(() => setShow(true), 1500) // small delay so it doesn't fight the page load
      return () => clearTimeout(timer)
    }
  }, [lastPromptAt])

  const markPrompted = async () => {
    await supabase.from('users').update({ last_review_prompt_at: new Date().toISOString() }).eq('id', userId)
  }

  const dismiss = async () => {
    setShow(false)
    await markPrompted()
  }

  const handleSubmit = async () => {
    if (rating === 0) return
    setSubmitting(true)
    await supabase.from('app_reviews').insert({ user_id: userId, rating, note: note.trim() || null })
    await markPrompted()
    setSubmitting(false)
    setSubmitted(true)
    setTimeout(() => setShow(false), 1400)
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="w-full max-w-sm rounded-xl shadow-2xl p-5 sm:p-6" style={{ background: '#fff' }}>
        {submitted ? (
          <p className="text-sm text-center break-words" style={{ color: 'var(--navy)' }}>Thank you for your feedback!</p>
        ) : (
          <>
            <h3 className="font-baskerville text-base mb-1 break-words" style={{ color: 'var(--navy)' }}>How's AJ Suite working for you?</h3>
            <p className="text-xs mb-4 break-words" style={{ color: 'var(--text-secondary)' }}>A quick rating helps us improve.</p>

            <div className="flex justify-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button"
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="text-3xl leading-none px-0.5"
                  style={{ color: (hoverRating || rating) >= n ? 'var(--gold)' : 'var(--border)' }}
                  aria-label={`${n} star${n > 1 ? 's' : ''}`}>
                  ★
                </button>
              ))}
            </div>

            <textarea value={note} onChange={e => setNote(e.target.value)}
              placeholder="Anything you'd like to add? (optional)"
              rows={3}
              className="w-full px-3 py-2 rounded text-sm border outline-none resize-none mb-4 break-words"
              style={{ borderColor: 'var(--border)' }} />

            <div className="flex flex-col sm:flex-row gap-2">
              <button onClick={handleSubmit} disabled={rating === 0 || submitting}
                className="flex-1 px-4 py-2 rounded text-xs font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ background: 'var(--navy)' }}>
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
              <button onClick={dismiss}
                className="px-4 py-2 rounded text-xs font-medium border"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                Not now
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
