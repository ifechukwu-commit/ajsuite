'use client'
import { useEffect, useState } from 'react'

interface Review {
  id: string
  email?: string
  full_name?: string
  rating: number
  note: string | null
  created_at: string
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/reviews').then(r => r.json()).then(data => {
      setReviews(Array.isArray(data) ? data : [])
      setLoading(false)
    })
  }, [])

  const average = reviews.length ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : null

  return (
    <div className="p-4 sm:p-8">
      <h1 className="font-baskerville text-xl mb-1 break-words" style={{ color: 'var(--navy)' }}>Reviews</h1>
      <p className="text-sm mb-6 break-words" style={{ color: 'var(--text-secondary)' }}>
        Star ratings submitted from the in-app popup, twice a week per user.
      </p>

      {!loading && reviews.length > 0 && (
        <div className="rounded-lg border p-4 mb-6 max-w-xs" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Average rating</p>
          <p className="font-baskerville text-3xl font-bold" style={{ color: 'var(--gold)' }}>{average} ★</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{reviews.length} review{reviews.length === 1 ? '' : 's'}</p>
        </div>
      )}

      {loading ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No reviews submitted yet.</p>
      ) : (
        <div className="rounded-lg border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          {reviews.map(r => (
            <div key={r.id} className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <p className="text-sm font-medium break-words" style={{ color: 'var(--text-primary)' }}>{r.full_name || r.email || 'Unknown'}</p>
                <p style={{ color: 'var(--gold)' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</p>
              </div>
              {r.note && <p className="text-sm mt-1 break-words" style={{ color: 'var(--text-secondary)' }}>{r.note}</p>}
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{new Date(r.created_at).toLocaleDateString('en-GB')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}