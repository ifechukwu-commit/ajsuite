'use client'
import { useState } from 'react'
import { useTasks } from '@/hooks/useTasks'
import EmptyState from '@/components/ui/EmptyState'

interface Props { caseId: string; workspaceId?: string | null }

const PRIORITY_STYLES: Record<string, { bg: string; color: string }> = {
  High: { bg: '#FEE2E2', color: '#9B1C1C' },
  Medium: { bg: '#FFF3CD', color: '#7B5E00' },
  Low: { bg: '#F3F4F6', color: '#4B5563' },
}

export default function TasksTab({ caseId, workspaceId }: Props) {
  const { tasks, loading, error, createTask, toggleTask, deleteTask } = useTasks(caseId, workspaceId)
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium')
  const [adding, setAdding] = useState(false)

  const handleAdd = async () => {
    if (!title.trim()) return
    setAdding(true)
    await createTask({ title: title.trim(), due_date: dueDate || null, priority })
    setTitle(''); setDueDate(''); setPriority('Medium')
    setAdding(false)
  }

  const pending = tasks.filter(t => t.status === 'Pending')
  const done = tasks.filter(t => t.status === 'Done')

  return (
    <div className="p-6 overflow-y-auto scrollbar-thin">
      {error && (
        <div className="mb-4 px-4 py-3 rounded text-sm" style={{ background: '#FEE2E2', color: '#9B1C1C' }}>{error}</div>
      )}

      <div className="rounded-lg border p-4 mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="flex flex-col sm:flex-row gap-2">
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="New task — e.g. Draft Motion"
            className="flex-1 px-3 py-2 rounded border text-sm focus-navy"
            style={{ borderColor: 'var(--border)' }} />
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
            className="px-3 py-2 rounded border text-sm focus-navy"
            style={{ borderColor: 'var(--border)' }} />
          <select value={priority} onChange={e => setPriority(e.target.value as any)}
            className="px-3 py-2 rounded border text-sm"
            style={{ borderColor: 'var(--border)' }}>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <button onClick={handleAdd} disabled={adding || !title.trim()}
            className="px-4 py-2 rounded text-xs font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ background: 'var(--navy)' }}>
            Add
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <EmptyState title="No tasks yet" description="Add the first task for this matter above." />
      ) : (
        <div className="flex flex-col gap-2">
          {pending.map(t => (
            <TaskRow key={t.id} task={t} onToggle={() => toggleTask(t)} onDelete={() => deleteTask(t.id)} />
          ))}
          {done.length > 0 && (
            <>
              <p className="text-xs font-bold uppercase tracking-widest mt-4 mb-1" style={{ color: 'var(--text-muted)' }}>Completed</p>
              {done.map(t => (
                <TaskRow key={t.id} task={t} onToggle={() => toggleTask(t)} onDelete={() => deleteTask(t.id)} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function TaskRow({ task, onToggle, onDelete }: { task: any; onToggle: () => void; onDelete: () => void }) {
  const style = PRIORITY_STYLES[task.priority]
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <button onClick={onToggle}
        className="w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center"
        style={{ borderColor: task.status === 'Done' ? 'var(--gold)' : 'var(--border)', background: task.status === 'Done' ? 'var(--gold)' : 'transparent' }}>
        {task.status === 'Done' && (
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="var(--navy)" strokeWidth="2"><path d="M2 5.5L4.5 8 9 3" /></svg>
        )}
      </button>
      <p className="flex-1 text-sm" style={{
        color: task.status === 'Done' ? 'var(--text-muted)' : 'var(--text-primary)',
        textDecoration: task.status === 'Done' ? 'line-through' : 'none',
      }}>{task.title}</p>
      {task.due_date && (
        <p className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
          {new Date(task.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </p>
      )}
      <span className="text-xs font-bold uppercase px-2 py-1 rounded flex-shrink-0" style={{ background: style.bg, color: style.color, fontSize: '9px' }}>
        {task.priority}
      </span>
      <button onClick={onDelete} className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>✕</button>
    </div>
  )
}
