const BASE = '/api'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (res.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }

  if (res.status === 204) return {} as T
  return res.json() as Promise<T>
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function login(email: string, password: string) {
  const data = await request<{ access_token: string; user: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  localStorage.setItem('token', data.access_token)
  localStorage.setItem('user', JSON.stringify(data.user))
  return data
}

export async function register(
  email: string,
  password: string,
  name: string,
  company_name: string,
) {
  const data = await request<{ access_token: string; user: User }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name, company_name }),
  })
  localStorage.setItem('token', data.access_token)
  localStorage.setItem('user', JSON.stringify(data.user))
  return data
}

export function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  window.location.href = '/login'
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem('user')
  return raw ? JSON.parse(raw) : null
}

// ── Company ──────────────────────────────────────────────────────────────────

export async function getCompany() {
  return request<Company>('/auth/company')
}

export async function getIndustryTemplates() {
  return request<Record<string, { industry_lingo: string; company_memory: string }>>('/auth/company/industry-templates')
}

export async function updateCompany(data: Partial<Company>) {
  return request<Company>('/auth/company', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

// ── Leads ─────────────────────────────────────────────────────────────────────

export async function getLeads(params?: {
  skip?: number
  limit?: number
  status?: string
}) {
  const q = new URLSearchParams()
  if (params?.skip !== undefined) q.set('skip', String(params.skip))
  if (params?.limit !== undefined) q.set('limit', String(params.limit))
  if (params?.status) q.set('status', params.status)
  return request<LeadListResponse>(`/leads/?${q}`)
}

export async function getLead(id: string) {
  return request<LeadDetail>(`/leads/${id}`)
}

export async function updateLead(id: string, data: any) {
  return request<Lead>(`/leads/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteLead(id: string) {
  return request<{ status: string; message: string }>(`/leads/${id}`, {
    method: 'DELETE',
  })
}

export async function createLead(data: CreateLeadPayload) {
  return request<{ id: string; name: string; email: string; phone: string; status: string; created_at: string }>(
    '/leads/',
    { method: 'POST', body: JSON.stringify(data) },
  )
}

export async function importLeads(file: File) {
  const token = getToken()
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${BASE}/leads/import`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Import failed')
  }

  return res.json() as Promise<{ success_count: number; error_count: number; errors: string[] }>
}

// ── Meetings ──────────────────────────────────────────────────────────────────

export async function getMeetings(upcomingOnly = true) {
  return request<{ meetings: Meeting[]; total: number }>(
    `/meetings/?upcoming_only=${upcomingOnly}`,
  )
}

// ── Messages ──────────────────────────────────────────────────────────────────

export async function getLeadMessages(leadId: string, skip = 0, limit = 50) {
  return request<MessageListResponse>(`/messages/lead/${leadId}?skip=${skip}&limit=${limit}`)
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  name: string
  role: string
  company_id: string
}

export interface Lead {
  id: string
  name: string
  email: string
  phone: string
  company: string | null
  status: string
  last_contacted: string | null
  sentiment: string | null
  created_at: string
}

export interface LeadDetail extends Lead {
  title: string | null
  industry: string | null
  source: string | null
  interest: string | null
  lead_owner: string | null
  last_contact_method: string | null
  call_attempts: number
  sentiment_score: Record<string, any> | null
  lead_score: number
  days_since_contact: number | null
  nudge_interval_days: number
  is_qualified: boolean
  updated_at: string
}

export interface Company {
  id: string
  name: string
  industry: string | null
  ai_config: {
    temperature: number
    tone: string
    prompt_template: string
    industry_lingo?: string
    company_memory?: string
  }
  twilio_phone_number: string | null
  cal_booking_url: string | null
  cal_event_type_id: number | null
  vapi_assistant_id: string | null
}

export interface LeadListResponse {
  leads: Lead[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface Message {
  id: string
  lead_id: string
  direction: 'inbound' | 'outbound'
  channel: string
  content: string
  sentiment: Record<string, any> | null
  created_at: string
  status: string | null
}

export interface MessageListResponse {
  messages: Message[]
  total: number
  has_more: boolean
}

export interface Meeting {
  id: string
  title: string
  description: string | null
  start_time: string
  end_time: string
  timezone: string
  location: string | null
  meeting_link: string | null
  status: string
  google_event_id: string | null
  lead: {
    id: string
    name: string
    email: string
    phone: string
    company: string | null
  }
}

export interface CreateLeadPayload {
  name: string
  email: string
  phone: string
  title?: string
  company?: string
  industry?: string
  source?: string
  interest?: string
  nudge_interval_days?: number
}
