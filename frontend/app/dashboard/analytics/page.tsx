'use client';
import { useState } from 'react';
import {
  Download, Filter, Clock, DollarSign, MessageSquare, Phone, Mail, Users,
  TrendingUp, Target, BarChart3
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { exportToCSV } from '@/lib/exportUtils';
import { toast } from 'sonner';

const AnalyticsPage = () => {
  const [period, setPeriod] = useState('30days');
  const [activeTab, setActiveTab] = useState('overview');

  const overviewData = [
    { name: 'Jan', leads: 65, appointments: 28, conversions: 15 },
    { name: 'Feb', leads: 59, appointments: 32, conversions: 18 },
    { name: 'Mar', leads: 80, appointments: 41, conversions: 24 },
    { name: 'Apr', leads: 81, appointments: 37, conversions: 22 },
    { name: 'May', leads: 90, appointments: 45, conversions: 28 },
    { name: 'Jun', leads: 125, appointments: 52, conversions: 32 },
    { name: 'Jul', leads: 110, appointments: 49, conversions: 30 },
  ];

  const sourceData = [
    { name: 'Website', value: 45 },
    { name: 'Social', value: 25 },
    { name: 'Referral', value: 15 },
    { name: 'Email', value: 10 },
    { name: 'Other', value: 5 },
  ];

  const COLORS = ['#8b5cf6', '#6366f1', '#a855f7', '#d946ef', '#ec4899'];

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

  const businessHoursData = [
    { category: 'Business Hours', conversations: 934, responded: 53, qualified: 6.2, percentage: 52 },
    { category: 'Non-Business Hours', conversations: 857, responded: 56, qualified: 6.8, percentage: 48 },
  ];

  const conversationBreakdownData = [
    { name: 'Not Interested', value: 396, percentage: 22.1, color: '#f59e0b' },
    { name: 'Unresponsive', value: 367, percentage: 20.5, color: '#60a5fa' },
    { name: 'In Progress', value: 347, percentage: 19.4, color: '#f472b6' },
    { name: 'Stop Contact', value: 336, percentage: 18.8, color: '#ef4444' },
    { name: 'Inaccurate Contact Info', value: 176, percentage: 9.8, color: '#fbbf24' },
    { name: 'Qualified', value: 116, percentage: 6.5, color: '#34d399' },
    { name: 'Message Delivery Error', value: 35, percentage: 2.0, color: '#94a3b8' },
    { name: 'Time frame 6-12 months', value: 12, percentage: 0.7, color: '#64748b' },
    { name: 'Other', value: 6, percentage: 0.3, color: '#475569' },
  ];

  const teamMemberData = [
    { name: 'Abhinav Kumar', conversationsStarted: 1791, responseRate: 54, qualificationRate: 6.48 }
  ];

  const totalConversations = conversationBreakdownData.reduce((sum, item) => sum + item.value, 0);

  const tabs = ['overview', 'leads', 'conversations', 'appointments', 'traffic sources'];

  const kpiCards = [
    { label: 'Conversations', value: '493', icon: MessageSquare },
    { label: 'Responsive Conversations', value: '242', icon: TrendingUp },
    { label: 'Qualified', value: '45', icon: Target },
    { label: 'In Progress Conversations', value: '0', icon: Clock },
    { label: 'Traffic Sources Used', value: '1', icon: TrendingUp },
    { label: 'Unqualified', value: '880', icon: Users },
  ];

  const commCards = [
    { label: 'Incoming SMS', value: '821', icon: MessageSquare },
    { label: 'SMS Sent', value: '8,265', icon: MessageSquare },
    { label: 'Incoming Calls', value: '37', icon: Phone },
    { label: 'Phone Calls Made', value: '22', icon: Phone },
    { label: 'Incoming Emails', value: '2', icon: Mail },
    { label: 'Emails Sent', value: '666', icon: Mail },
    { label: 'Notes Taken', value: '1,840', icon: TrendingUp },
    { label: 'Wrong Numbers Identified', value: '99', icon: Phone },
    { label: 'Time Saved', value: '211 hrs', icon: Clock },
    { label: 'Money Saved', value: '$12,450', icon: DollarSign },
  ];

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
                exportToCSV(
                  overviewData.map(d => ({ Month: d.name, Leads: d.leads, Appointments: d.appointments, Conversions: d.conversions })),
                  `analytics-${activeTab}-${period}`
                );
                toast.success('Export complete', { description: `Exported ${activeTab} data` });
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
          <div className="card p-6 border-none shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 rounded-full bg-gradient-to-b from-brand-500 to-indigo-600" />
              <h2 className="text-base font-black uppercase tracking-widest text-[var(--text-primary)]">Performance Overview</h2>
            </div>
            <p className="text-xs text-slate-500 font-medium mb-4">Leads, appointments and conversions over time</p>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={overviewData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Lead Sources */}
            <div className="card p-6 border-none shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-brand-500 to-indigo-600" />
                <h2 className="text-base font-black uppercase tracking-widest text-[var(--text-primary)]">Lead Sources</h2>
              </div>
              <p className="text-xs text-slate-500 font-medium mb-4">Distribution of lead acquisition channels</p>
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
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--divider)', borderRadius: 12, fontSize: 12 }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Conversation Performance */}
            <div className="card p-6 border-none shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-brand-500 to-indigo-600" />
                <h2 className="text-base font-black uppercase tracking-widest text-[var(--text-primary)]">Conversation Performance</h2>
              </div>
              <p className="text-xs text-slate-500 font-medium mb-4">AI vs human agent effectiveness</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    { name: 'Response Time', ai: 0.2, human: 2.5 },
                    { name: 'Engagement', ai: 76, human: 82 },
                    { name: 'Lead Qualification', ai: 65, human: 68 },
                    { name: 'Conversion Rate', ai: 12, human: 15 },
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--divider)', borderRadius: 12, fontSize: 12 }} />
                  <Legend />
                  <Bar dataKey="ai" fill="#8b5cf6" name="AI Assistant" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="human" fill="#6366f1" name="Human Agent" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
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
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Conversation Breakdown */}
            <div className="card p-6 border-none shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-brand-500 to-indigo-600" />
                <h2 className="text-base font-black uppercase tracking-widest text-[var(--text-primary)]">Conversation Breakdown</h2>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={conversationBreakdownData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={1}
                        dataKey="value"
                      >
                        {conversationBreakdownData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string) => [`${value} (${((value / totalConversations) * 100).toFixed(1)}%)`, name]}
                        contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--divider)', borderRadius: 12, fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-[var(--divider)] pb-2">
                    <div>Status</div>
                    <div># Convos</div>
                    <div>%</div>
                  </div>
                  {conversationBreakdownData.map((item, index) => (
                    <div key={index} className="grid grid-cols-3 gap-2 text-xs py-1 rounded-lg px-2" style={{ backgroundColor: `${item.color}15` }}>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-[10px] font-bold text-[var(--text-primary)] truncate">{item.name}</span>
                      </div>
                      <div className="text-[var(--text-primary)] font-bold">{item.value}</div>
                      <div className="text-[var(--text-primary)] font-bold">{item.percentage}%</div>
                    </div>
                  ))}
                  <div className="grid grid-cols-3 gap-2 text-xs font-black border-t border-[var(--divider)] pt-2">
                    <div className="text-[var(--text-primary)]">Total</div>
                    <div className="text-[var(--text-primary)]">{totalConversations}</div>
                    <div className="text-[var(--text-primary)]">100%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Team Member Overview */}
            <div className="card p-6 border-none shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-brand-500 to-indigo-600" />
                <h2 className="text-base font-black uppercase tracking-widest text-[var(--text-primary)]">Team Member Overview</h2>
              </div>
              <div className="space-y-4">
                <div className="card p-6 border-none bg-gradient-to-br from-brand-500 to-indigo-600 text-center shadow-xl">
                  <p className="text-xs font-black text-white/70 uppercase tracking-widest mb-2">Team Members</p>
                  <p className="text-4xl font-black text-white">1</p>
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-4 gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-[var(--divider)] pb-2">
                    <div>Member</div>
                    <div>Convos</div>
                    <div>% Responded</div>
                    <div>% Qualified</div>
                  </div>
                  {teamMemberData.map((member, index) => (
                    <div key={index} className="grid grid-cols-4 gap-2 py-3 rounded-xl px-2" style={{ backgroundColor: 'var(--surface-subtle)' }}>
                      <div className="font-black text-xs text-[var(--text-primary)]">{member.name}</div>
                      <div className="font-bold text-xs text-[var(--text-primary)]">{member.conversationsStarted}</div>
                      <div className="font-bold text-xs text-[var(--text-primary)]">{member.responseRate}%</div>
                      <div className="font-bold text-xs text-[var(--text-primary)]">{member.qualificationRate}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Business Hours */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="card p-6 border-none shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-brand-500 to-indigo-600" />
                <h2 className="text-base font-black uppercase tracking-widest text-[var(--text-primary)]">Business Hours vs Non-Business</h2>
              </div>
              <div className="flex justify-center items-center gap-12 mb-6">
                <div className="text-center">
                  <div className="text-4xl font-black text-brand-400">52%</div>
                  <div className="text-xs font-black uppercase tracking-widest text-slate-500 mt-1">Business Hours</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-black text-indigo-400">48%</div>
                  <div className="text-xs font-black uppercase tracking-widest text-slate-500 mt-1">Non-Business Hours</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-[var(--divider)] pb-2">
                  <div>When Started</div>
                  <div># Convos</div>
                  <div>% Responded</div>
                  <div>% Qualified</div>
                </div>
                {businessHoursData.map((item, index) => (
                  <div key={index} className={`grid grid-cols-4 gap-2 text-xs py-2 rounded-xl px-2 ${index === 0 ? 'bg-brand-500/10' : 'bg-indigo-500/10'}`}>
                    <div className="font-bold text-[var(--text-primary)]">{item.category}</div>
                    <div className="font-bold text-[var(--text-primary)]">{item.conversations}</div>
                    <div className="font-bold text-[var(--text-primary)]">{item.responded}%</div>
                    <div className="font-bold text-[var(--text-primary)]">{item.qualified}%</div>
                  </div>
                ))}
              </div>
            </div>

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
          </div>

          {/* Customer Response + Opt-out */}
          <div className="grid gap-6 md:grid-cols-2">
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
          </div>

          {/* Follow-up Analysis */}
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
