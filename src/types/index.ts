export type CaseStatus = 'Active' | 'Urgent' | 'Pending' | 'Closed'

export type Plan = 'trial' | 'solo' | 'chamber' | 'admin'
export type Role = 'owner' | 'member'

export interface User {
  id: string
  email: string
  full_name: string
  firm_name: string | null
  title: string | null
  plan: Plan
  role: Role
  owner_id: string | null
  trial_claimed: boolean
  trial_start: string
  paid_until: string | null
  country: string | null
  state: string | null
  storage_used_bytes: number
  created_at: string
}

export interface Case {
  id: string
  user_id: string
  created_by: string | null
  title: string
  client_name: string
  client_contact: string | null
  matter_type: string
  status: CaseStatus
  deadline: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  case_id: string
  user_id: string
  created_by: string | null
  file_name: string
  file_type: 'pdf' | 'doc' | 'docx' | 'txt'
  file_url: string
  file_size: number
  created_at: string
}

export interface Task {
  id: string
  case_id: string
  user_id: string
  title: string
  due_date: string | null
  priority: 'High' | 'Medium' | 'Low'
  status: 'Pending' | 'Done'
  assigned_to: string | null
  created_by: string
  created_at: string
}

export interface CaseNote {
  id: string
  case_id: string
  user_id: string
  body: string
  created_by: string
  created_at: string
}

export interface TimelineEvent {
  id: string
  case_id: string
  user_id: string
  event_type: 'case_created' | 'status_changed' | 'document_uploaded' | 'deadline_added' | 'task_completed' | 'note_added' | 'case_exported'
  description: string
  created_at: string
}

export interface Deadline {
  id: string
  case_id: string
  user_id: string
  created_by: string | null
  label: string
  due_date: string
  is_critical: boolean
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  body: string
  type: 'renewal' | 'update' | 'paystack' | 'announcement'
  is_read: boolean
  created_at: string
}

export interface ExportOptions {
  format: 'pdf' | 'docx' | 'txt'
  file_name: string
  reviewed_by: string
}

export interface NewCaseInput {
  title: string
  client_name: string
  client_contact: string
  matter_type: string
  status: CaseStatus
  deadline: string
  notes: string
}

export interface EditCaseInput extends NewCaseInput {
  id: string
}

export interface TeamInvite {
  id: string
  owner_id: string
  email: string
  created_at: string
}
