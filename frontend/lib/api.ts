/**
 * Converso API Client
 * 
 * Centralized API client for all backend communication.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

/**
 * Generic request wrapper with auth and error handling
 */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token')
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    let errorMsg = `API Error: ${response.status}`
    try {
      const errorData = await response.json()
      errorMsg = errorData.detail || errorMsg
    } catch (e) {}
    throw new Error(errorMsg)
  }

  // Handle empty responses
  if (response.status === 204) return {} as T

  return response.json()
}

// ── Auth ───────────────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  name: string
  role: string
  company_id: string
  is_superuser: boolean
  calendar_connected: boolean
  manual_calendar_url: string | null
  calcom_event_id: number | null
}

export async function login(email: string, password: string) {
  const data = await request<{ access_token: string; user: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  localStorage.setItem('token', data.access_token)
  localStorage.setItem('user', JSON.stringify(data.user))
  return data
}

export async function register(data: any) {
  const res = await request<{ access_token: string; user: User }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  localStorage.setItem('token', res.access_token)
  localStorage.setItem('user', JSON.stringify(res.user))
  return res
}

export function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null
  const u = localStorage.getItem('user')
  return u ? JSON.parse(u) : null
}

export async function updateMe(data: any) {
  const user = await request<User>('/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  localStorage.setItem('user', JSON.stringify(user))
  return user
}

export async function connectCalendar(provider: string) {
  const data = await request<{ status: string; username: string; event_id: number }>('/auth/calendar/connect', {
    method: 'POST',
    body: JSON.stringify({ provider }),
  })
  
  // Refresh local user state
  const user = getStoredUser()
  if (user) {
    user.calendar_connected = true
    user.calcom_event_id = data.event_id
    localStorage.setItem('user', JSON.stringify(user))
  }
  
  return data
}

// ── Company ──────────────────────────────────────────────────────────────────

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
  calcom_base_url: string | null
  cal_booking_url: string | null
  cal_event_type_id: number | null
  vapi_assistant_id: string | null
  created_at: string
}

export async function getCompany() {
  return request<Company>('/auth/company')
}

export async function updateCompany(data: any) {
  return request<Company>('/auth/company', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function getIndustryTemplates() {
  return request<Record<string, { industry_lingo: string; company_memory: string }>>('/auth/company/industry-templates')
}

// ── Platform Admin ──────────────────────────────────────────────────────────

export interface CompanyStats {
  id: string
  name: string
  industry: string | null
  user_count: number
  lead_count: number
  created_at: string
}

export async function listCompanies() {
  return request<CompanyStats[]>('/platform/companies')
}

export async function getPlatformUsage() {
  return request<any>('/platform/usage')
}

export async function getCompanyDetails(id: string) {
  return request<{ company: Company; users: any[] }>(`/platform/companies/${id}`)
}

export async function updateCompanyAsAdmin(id: string, data: any) {
  return request<Company>(`/platform/companies/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteCompany(id: string) {
  return request<{ status: string }>(`/platform/companies/${id}`, {
    method: 'DELETE',
  })
}

export async function createUserAsAdmin(companyId: string, data: any) {
  return request<User>(`/platform/companies/${companyId}/users`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function deleteUserAsAdmin(userId: string) {
  return request<{ status: string }>(`/platform/users/${userId}`, {
    method: 'DELETE',
  })
}

// ── Leads ────────────────────────────────────────────────────────────────────

export interface Lead {
  id: string
  name: string
  email: string
  phone: string
  company: string | null
  status: string
  last_contacted: string | null
  sentiment: string | null
  nudge_interval_days: number
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
  sentiment_score: Record<string, any>
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

export async function getLeads(params: { skip?: number; limit?: number; status?: string }) {
  const query = new URLSearchParams(params as any).toString()
  return request<LeadListResponse>(`/leads/?${query}`)
}

export async function getLead(id: string) {
  return request<LeadDetail>(`/leads/${id}`)
}

export async function createLead(data: any) {
  return request<Lead>(`/leads/`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateLead(id: string, data: any) {
  return request<Lead>(`/leads/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteLead(id: string) {
  return request<{ status: string }>(`/leads/${id}`, {
    method: 'DELETE',
  })
}

export async function importLeads(file: File) {
  const token = localStorage.getItem('token')
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_BASE_URL}/leads/import`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.detail || 'Import failed')
  }

  return response.json()
}

export async function exportLeads() {
  const token = localStorage.getItem('token')
  const response = await fetch(`${API_BASE_URL}/leads/export`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!response.ok) throw new Error('Export failed')

  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'leads_export.csv'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export async function initiateVoiceCall(leadId: string) {
  return request<{ success: boolean; lead_id: string }>(`/leads/${leadId}/call`, {
    method: 'POST'
  })
}

export async function sendManualSms(leadId: string, content: string) {
  return request<{ success: boolean; message_id: string }>(`/leads/${leadId}/sms`, {
    method: 'POST',
    body: JSON.stringify({ content })
  })
}

// ── Meetings ─────────────────────────────────────────────────────────────────

export interface Meeting {
  id: string
  title: string
  description: string | null
  start_time: string
  end_time: string
  location: string | null
  meeting_link: string | null
  status: string
  lead: {
    id: string
    name: string
    email: string
    phone: string
    company: string | null
  }
}

export async function getMeetings(params: { upcoming_only?: boolean; limit?: number } = {}) {
  const query = new URLSearchParams(params as any).toString()
  return request<{ meetings: Meeting[]; total: number }>(`/meetings/?${query}`)
}

// ── Messages ─────────────────────────────────────────────────────────────────

export interface Message {
  id: string
  lead_id: string
  direction: 'inbound' | 'outbound'
  channel: string
  content: string
  sentiment: Record<string, any> | null
  created_at: string
  status: string | null
  recording_url?: string | null
  duration_seconds?: string | null
  transcript?: string | null
}

export interface MessageListResponse {
  messages: Message[]
  total: number
  has_more: boolean
}

export async function getLeadMessages(leadId: string) {
  return request<MessageListResponse>(`/messages/lead/${leadId}`)
}
