'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  userId: string
  workspaceName: string
}

const STEPS = [
  {
    title: 'Dashboard',
    body: 'Your home base, see your active matters, upcoming hearings, and tasks due today at a glance.',
  },
  {
    title: 'Cases',
    body: 'Every matter you open lives here. Open one to manage its documents, assign tasks, discuss with your team, and see its full history, all in one place. Need a colleague on a specific matter? Invite them right from inside that matter, no separate setup.',
  },
  {
    title: 'Documents',
    body: 'Every file across every matter, in one searchable list.',
  },
  {
    title: 'Calendar',
    body: 'Deadlines and hearings from every matter, automatically, with reminders at 30, 14, 7, 3, and 1 day before.',
  },
  {
    title: 'Settings',
    body: 'Your profile, your firm name, and your subscription, all in one place.',
  },
]

export default function WelcomeTour({ userId, workspaceName }: Props) {
  const [step, setStep] = useState(-1) // -1 = welcome screen, 0..n = tour steps
  const [dismissed, setDismissed] = useState(false)
  const supabase = createClient()

  const finish = async () => {
    setDismissed(true)
    await supabase.from('users').update({ onboarding_completed: true }).eq('id', userId)
  }

  if (dismissed) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)' }}>
      <div className="w-full max-w-sm rounded-xl shadow-2xl p-6 sm:p-7 text-center" style={{ background: '#fff' }}>
        {step === -1 ? (
          <>
            <h2 className="font-baskerville text-lg mb-2 break-words" style={{ color: 'var(--navy)' }}>Welcome to AJ Suite, {workspaceName}</h2>
            <p className="text-sm mb-6 break-words" style={{ color: 'var(--text-secondary)' }}>
              A quick 6-step look around, less than a minute, so you know exactly where everything lives.
            </p>
            <div className="flex flex-col gap-2">
              <button onClick={() => setStep(0)} className="px-4 py-2.5 rounded text-sm font-bold text-white" style={{ background: 'var(--navy)' }}>
                Get Started
              </button>
              <button onClick={finish} className="px-4 py-2 rounded text-xs font-medium border" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                Skip
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Step {step + 1} of {STEPS.length}</p>
            <h2 className="font-baskerville text-lg mb-2 break-words" style={{ color: 'var(--navy)' }}>{STEPS[step].title}</h2>
            <p className="text-sm mb-6 break-words" style={{ color: 'var(--text-secondary)' }}>{STEPS[step].body}</p>
            <div className="flex gap-2">
              <button onClick={finish} className="px-3 py-2 rounded text-xs font-medium border flex-shrink-0" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                Skip
              </button>
              <button
                onClick={() => step + 1 < STEPS.length ? setStep(step + 1) : finish()}
                className="flex-1 px-4 py-2 rounded text-sm font-bold text-white" style={{ background: 'var(--navy)' }}>
                {step + 1 < STEPS.length ? 'Next' : "You're all set"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
