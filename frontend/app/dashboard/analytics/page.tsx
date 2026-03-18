'use client';
import { useState, useEffect } from 'react';
import {
  Download, Filter, Clock, MessageSquare, Phone, Mail, Users,
  TrendingUp, Target, BarChart3
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { exportToCSV } from '@/lib/exportUtils';
import { toast } from 'sonner';
import { getAnalyticsOverview, type AnalyticsOverview } from '@/lib/api';

const COLORS = ['#8b5cf6', '#6366f1', '#a855f7', '#d946ef', '#ec4899'];

// Industry benchmark data — no per-company source, labelled accordingly
const responseTimeData = [
  { timeFrame: '0', percentage: 6.4 },
  { timeFrame: '1', percentage: 8.6 },
  { timeFrame: '3', percentage: 9.3 },
  { timeFrame: '12', percentage: 17.1 },
  { timeFrame: '24', percentage: 25.0 },
];

const customerResponseData = [
  { timeFrame: '0', percentage: 18 },
  { timeFrame: '1', percentage: 24 },
  { timeFrame: '3', percentage: 27 },
  { timeFrame: '12', percentage: 37 },
  { timeFrame: '24', percentage: 54 },
  { timeFrame: '48', percentage: 68 },
  { timeFrame: '72', percentage: 74 },
];

const optOutData = [
  { texts: '1', percentage: 49 },
  { texts: '2', percentage: 21 },
  { texts: '3', percentage: 9 },
  { texts: '4', percentage: 5 },
  { texts: '5', percentage: 3 },
  { texts: '6', percentage: 2 },
  { texts: '7+', percentage: 11 },
];

const followUpData = [
  { range: '1-5', percentage: 18.9 },
  { range: '6-10', percentage: 29.8 },
  { range: '11-14', percentage: 11.6 },
  { range: '15+', percentage: 39.8 },
];

const AnalyticsPage = () => {
  const [period, setPeriod] = useState('30days');
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalyticsOverview()
      .then(setAnalytics)
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  const tabs = ['overview', 'leads', 'conversations', 'appointments', 'traffic sources'];

  const sourceData = analytics
    ? Object.entries(analytics.channel_mix).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
    : [];

  const kpiCards = analytics ? [
    { label: 'Total Leads', value: String(analytics.kpis.total_leads), icon: MessageSquare },
    { label: 'Conversions', value: String(analytics.kpis.total_conversions), icon: TrendingUp },
    { label: 'Conversion Rate', value: `${analytics.kpis.conversion_rate_pct}%`, icon: Target },
    { label: 'SMS Sent', value: String(analytics.kpis.sms_sent), icon: MessageSquare },
    { label: 'Voice Calls', value: String(analytics.kpis.voice_calls), icon: Phone },
    { label: 'Inbound Messages', value: String(analytics.kpis.inbound_messages), icon: Users },
  ] : [];

  const commCards = analytics ? [
    { label: 'SMS Sent', value: String(analytics.kpis.sms_sent), icon: MessageSquare },
    { label: 'Voice Calls', value: String(analytics.kpis.voice_calls), icon: Phone },
    { label: 'Inbound Messages', value: String(analytics.kpis.inbound_messages), icon: Mail },
  ] : [];

  if (loading) {
    return <div className="text-slate-400 text-sm font-black uppercase tracking-[0.2em] py-20 text-center">Loading Analytics…</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 font-sans pb-20">
      {/* Header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 text-brand-400 text-xs font-black uppercase tracking-widest mb-4">
          <BarChart3 className="w-3 h-3" />
          Performance Hub
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tight leading-none mb-3">
              Analytics
            </h1>
            <p className="text-sm font-medium text-slate-500">Track your pipeline performance and conversion metrics.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={period}
                onChange={e => { setPeriod(e.target.value); toast(`Period changed to ${e.target.value}`); }}
                className="input appearance-none pr-8 py-2 text-xs font-black uppercase tracking-widest"
                style={{ minWidth: 160 }}
              >
                <option value="7days">Last 7 days</option>
                <option value="30days">Last 30 days</option>
                <option value="90days">Last 90 days</option>
                <option value="year">Last year</option>
              </select>
            </div>
            <button
              className="btn-secondary flex items-center gap-2"
              onClick={() => toast('Filters', { description: 'Advanced filtering coming soon' })}
            >
              <Filter className="w-4 h-4" />
            </button>
            <button
              className="btn-secondary flex items-center gap-2"
              onClick={() => {
                if (analytics) {
                  exportToCSV(
                    analytics.monthly_overview.map(d => ({ Month: d.name, Leads: d.leads, Appointments: d.appointments, Conversions: d.conversions })),
                    `analytics-${activeTab}-${period}`
                  );
                  toast.success('Export complete', { description: `Exported ${activeTab} data` });
                }
              }}
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Custom Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl bg-[var(--surface-subtle)] mb-6 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === tab
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-[var(--text-primary)]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {!analytics && (
            <div className="card p-6 border-dashed border-2 bg-transparent shadow-none text-center text-slate-400 text-sm font-medium">
              No analytics data available yet.
            </div>
          )}

          {/* Primary KPI cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {kpiCards.map(({ label, value, icon: Icon }) => (
              <div key={label} className="card p-6 border-none shadow-2xl">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="label-text mb-1">{label.toUpperCase()}</p>
                    <p className="text-3xl font-black text-[var(--text-primary)]">{value}</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Communication metrics */}
          <div className="grid gap-4 md:grid-cols-3">
            {commCards.map(({ label, value, icon: Icon }) => (
              <div key={label} className="card p-6 border-none shadow-2xl">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="label-text mb-1">{label.toUpperCase()}</p>
                    <p className="text-2xl font-black text-[var(--text-primary)]">{value}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-brand-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Performance Overview Chart */}
          {analytics && (
            <div className="card p-6 border-none shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-brand-500 to-indigo-600" />
                <h2 className="text-base font-black uppercase tracking-widest text-[var(--text-primary)]">Performance Overview</h2>
              </div>
              <p className="text-xs text-slate-500 font-medium mb-4">Leads, appointments and conversions over time</p>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={analytics.monthly_overview} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorAppointments" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--divider)', borderRadius: 12, fontSize: 12 }} />
                  <Legend />
                  <Area type="monotone" dataKey="leads" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorLeads)" />
                  <Area type="monotone" dataKey="appointments" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorAppointments)" />
                  <Area type="monotone" dataKey="conversions" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#colorConversions)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Channel Mix */}
          {analytics && sourceData.some(d => d.value > 0) && (
            <div className="card p-6 border-none shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-brand-500 to-indigo-600" />
                <h2 className="text-base font-black uppercase tracking-widest text-[var(--text-primary)]">Channel Mix</h2>
              </div>
              <p className="text-xs text-slate-500 font-medium mb-4">Message distribution by channel</p>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {sourceData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--divider)', borderRadius: 12, fontSize: 12 }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Leads Tab */}
      {activeTab === 'leads' && (
        <div className="card p-6 border-none shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-brand-500 to-indigo-600" />
            <h2 className="text-base font-black uppercase tracking-widest text-[var(--text-primary)]">Lead Analytics</h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mb-6">Detailed lead metrics and performance</p>
          <div className="card p-20 border-dashed border-2 bg-transparent shadow-none text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--surface-subtle)] flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-black text-[var(--text-primary)] mb-2">Lead Analytics Coming Soon</h3>
            <p className="text-sm font-medium text-slate-400">Lead analytics data will be displayed here</p>
          </div>
        </div>
      )}

      {/* Conversations Tab */}
      {activeTab === 'conversations' && (
        <div className="space-y-6">
          {/* Industry Benchmarks label */}
          <div className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-black text-amber-400 uppercase tracking-widest inline-flex items-center gap-2">
            Industry Benchmarks — not specific to your account
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="card p-6 border-none shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-brand-500 to-indigo-600" />
                <h2 className="text-base font-black uppercase tracking-widest text-[var(--text-primary)]">Response Time Analysis</h2>
              </div>
              <p className="text-xs text-slate-500 font-medium mb-4">How long it takes for customers to respond (by hour)</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={responseTimeData} layout="horizontal" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis type="number" domain={[0, 30]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="timeFrame" type="category" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value: number) => [`${value}%`, 'Percentage']} contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--divider)', borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="percentage" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-6 border-none shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-brand-500 to-indigo-600" />
                <h2 className="text-base font-black uppercase tracking-widest text-[var(--text-primary)]">Customer Response Timeline</h2>
              </div>
              <p className="text-xs text-slate-500 font-medium mb-4">Extended customer response view</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={customerResponseData} layout="horizontal" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis type="number" domain={[0, 80]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="timeFrame" type="category" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value: number) => [`${value}%`, 'Percentage']} contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--divider)', borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="percentage" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="card p-6 border-none shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-brand-500 to-indigo-600" />
                <h2 className="text-base font-black uppercase tracking-widest text-[var(--text-primary)]">Opt-out Analysis</h2>
              </div>
              <p className="text-xs text-slate-500 font-medium mb-4">Number of texts before customer opts out</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={optOutData} layout="horizontal" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis type="number" domain={[0, 50]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="texts" type="category" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value: number) => [`${value}%`, 'Percentage']} contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--divider)', borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="percentage" fill="#a855f7" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-6 border-none shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-brand-500 to-indigo-600" />
                <h2 className="text-base font-black uppercase tracking-widest text-[var(--text-primary)]">Follow-up Text Analysis</h2>
              </div>
              <p className="text-xs text-slate-500 font-medium mb-4">How many follow-up texts it takes for customers to respond</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={followUpData} layout="horizontal" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis type="number" domain={[0, 45]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="range" type="category" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value: number) => [`${value}%`, 'Percentage']} contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--divider)', borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="percentage" fill="#d946ef" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Appointments Tab */}
      {activeTab === 'appointments' && (
        <div className="card p-6 border-none shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-brand-500 to-indigo-600" />
            <h2 className="text-base font-black uppercase tracking-widest text-[var(--text-primary)]">Appointment Analytics</h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mb-6">Booking and attendance statistics</p>
          <div className="card p-20 border-dashed border-2 bg-transparent shadow-none text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--surface-subtle)] flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-black text-[var(--text-primary)] mb-2">Appointment Analytics Coming Soon</h3>
            <p className="text-sm font-medium text-slate-400">Appointment analytics data will be displayed here</p>
          </div>
        </div>
      )}

      {/* Traffic Sources Tab */}
      {activeTab === 'traffic sources' && (
        <div className="card p-6 border-none shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-brand-500 to-indigo-600" />
            <h2 className="text-base font-black uppercase tracking-widest text-[var(--text-primary)]">Traffic Sources Analytics</h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mb-6">Website traffic and lead source performance</p>
          <div className="card p-20 border-dashed border-2 bg-transparent shadow-none text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--surface-subtle)] flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-black text-[var(--text-primary)] mb-2">Traffic Sources Coming Soon</h3>
            <p className="text-sm font-medium text-slate-400">Traffic sources analytics data will be displayed here</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
