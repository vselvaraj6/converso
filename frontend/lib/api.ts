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

export async function createLead(data: CreateLeadPayload) {
  return request<{ id: string; name: string; email: string; phone: string; status: string; created_at: string }>(
    '/leads/',
    { method: 'POST', body: JSON.stringify(data) },
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
  sentiment_score: Record<string, string> | null
  lead_score: number
  days_since_contact: number | null
  is_qualified: boolean
  updated_at: string
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
  sentiment: Record<string, string> | null
  created_at: string
  status: string | null
}

export interface MessageListResponse {
  messages: Message[]
  total: number
  has_more: boolean
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
}
