'use client';
import { useState, useEffect } from 'react';
import { BrainCircuit, MessageSquare } from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { toast } from 'sonner';
import { getAnalyticsOverview, getRecentAiMessages, type AnalyticsOverview, type RecentAiMessage } from '@/lib/api';

const SENTIMENT_COLORS = { positive: '#34d399', neutral: '#60a5fa', negative: '#f87171' };

const AIInsightsPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [recentMessages, setRecentMessages] = useState<RecentAiMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAnalyticsOverview(), getRecentAiMessages(20)])
      .then(([a, m]) => {
        setAnalytics(a);
        setRecentMessages(m.messages);
      })
      .catch(() => toast.error('Failed to load AI insights'))
      .finally(() => setLoading(false));
  }, []);

  const tabs = ['overview', 'intents', 'sentiment'];

  const sentimentData = analytics
    ? [
        { name: 'Positive', value: analytics.sentiment_breakdown.positive, color: SENTIMENT_COLORS.positive },
        { name: 'Neutral', value: analytics.sentiment_breakdown.neutral, color: SENTIMENT_COLORS.neutral },
        { name: 'Negative', value: analytics.sentiment_breakdown.negative, color: SENTIMENT_COLORS.negative },
      ].filter(d => d.value > 0)
    : [];

  const hasAiData = analytics && (
    analytics.intent_distribution.length > 0 ||
    Object.values(analytics.sentiment_breakdown).some(v => v > 0)
  );

  if (loading) {
    return <div className="text-slate-400 text-sm font-black uppercase tracking-[0.2em] py-20 text-center">Loading AI Insights…</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 font-sans pb-20">
      {/* Header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 text-brand-400 text-xs font-black uppercase tracking-widest mb-4">
          <BrainCircuit className="w-3 h-3" />
          AI Engine
        </div>
        <div>
          <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tight leading-none mb-3">
            AI Insights
          </h1>
          <p className="text-sm font-medium text-slate-500">Real-time analysis of your AI-classified conversations.</p>
        </div>
      </div>

      {/* Custom Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl bg-[var(--surface-subtle)] mb-6">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === tab
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-[var(--text-primary)]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Empty state banner */}
      {!hasAiData && (
        <div className="card p-8 border-dashed border-2 bg-transparent shadow-none text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--surface-subtle)] flex items-center justify-center mx-auto mb-4">
            <BrainCircuit className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-black text-[var(--text-primary)] mb-2">No AI-classified messages yet</h3>
          <p className="text-sm font-medium text-slate-400">
            As your AI agent processes inbound messages, intent and sentiment data will appear here.
          </p>
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && hasAiData && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Intent distribution */}
            {analytics!.intent_distribution.length > 0 && (
              <div className="card p-6 border-none shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-6 rounded-full bg-gradient-to-b from-brand-500 to-indigo-600" />
                  <h2 className="text-base font-black uppercase tracking-widest text-[var(--text-primary)]">Intent Distribution</h2>
                </div>
                <p className="text-xs text-slate-500 font-medium mb-4">Top detected intents from inbound messages</p>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={analytics!.intent_distribution.slice(0, 7)}
                    layout="horizontal"
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="intent" type="category" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={100} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--divider)', borderRadius: 12, fontSize: 12 }} />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Sentiment pie */}
            {sentimentData.length > 0 && (
              <div className="card p-6 border-none shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-6 rounded-full bg-gradient-to-b from-brand-500 to-indigo-600" />
                  <h2 className="text-base font-black uppercase tracking-widest text-[var(--text-primary)]">Sentiment Overview</h2>
                </div>
                <p className="text-xs text-slate-500 font-medium mb-4">Sentiment of AI-classified inbound messages</p>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={sentimentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {sentimentData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--divider)', borderRadius: 12, fontSize: 12 }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Recent AI messages feed */}
          {recentMessages.length > 0 && (
            <div className="card p-6 border-none shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-brand-500 to-indigo-600" />
                <h2 className="text-base font-black uppercase tracking-widest text-[var(--text-primary)]">Recent AI-Classified Messages</h2>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {recentMessages.map(msg => (
                  <div key={msg.id} className="flex gap-4 p-4 rounded-2xl" style={{ backgroundColor: 'var(--surface-subtle)' }}>
                    <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-5 h-5 text-brand-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-black text-xs text-[var(--text-primary)]">{msg.lead_name}</span>
                        {msg.ai_metadata?.intent && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-brand-500/10 text-brand-400">
                            {msg.ai_metadata.intent}
                          </span>
                        )}
                        {msg.ai_metadata?.sentiment && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black"
                            style={{
                              backgroundColor: `${SENTIMENT_COLORS[msg.ai_metadata.sentiment as keyof typeof SENTIMENT_COLORS] || '#94a3b8'}20`,
                              color: SENTIMENT_COLORS[msg.ai_metadata.sentiment as keyof typeof SENTIMENT_COLORS] || '#94a3b8',
                            }}
                          >
                            {msg.ai_metadata.sentiment}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-medium truncate">{msg.content}</p>
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">
                        {new Date(msg.created_at).toLocaleString()} · {msg.channel}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Intents Tab */}
      {activeTab === 'intents' && (
        <div className="card p-6 border-none shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-brand-500 to-indigo-600" />
            <h2 className="text-base font-black uppercase tracking-widest text-[var(--text-primary)]">Intent Breakdown</h2>
          </div>
          {analytics && analytics.intent_distribution.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={analytics.intent_distribution}
                  layout="horizontal"
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="intent" type="category" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={120} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--divider)', borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Messages" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-6 space-y-2">
                <div className="grid grid-cols-3 gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-[var(--divider)] pb-2">
                  <div>Intent</div>
                  <div className="text-right">Count</div>
                  <div className="text-right">Share</div>
                </div>
                {(() => {
                  const total = analytics.intent_distribution.reduce((s, d) => s + d.count, 0);
                  return analytics.intent_distribution.map(d => (
                    <div key={d.intent} className="grid grid-cols-3 gap-2 text-xs py-1.5">
                      <span className="font-bold text-[var(--text-primary)]">{d.intent}</span>
                      <span className="text-right font-bold text-[var(--text-primary)]">{d.count}</span>
                      <span className="text-right text-slate-500">{total ? ((d.count / total) * 100).toFixed(1) : 0}%</span>
                    </div>
                  ));
                })()}
              </div>
            </>
          ) : (
            <div className="card p-20 border-dashed border-2 bg-transparent shadow-none text-center">
              <p className="text-sm font-medium text-slate-400">No intent data yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Sentiment Tab */}
      {activeTab === 'sentiment' && (
        <div className="card p-6 border-none shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-brand-500 to-indigo-600" />
            <h2 className="text-base font-black uppercase tracking-widest text-[var(--text-primary)]">Sentiment Analysis</h2>
          </div>
          {sentimentData.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {sentimentData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--divider)', borderRadius: 12, fontSize: 12 }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-4 self-center">
                {sentimentData.map(d => (
                  <div key={d.name} className="flex items-center justify-between p-4 rounded-2xl" style={{ backgroundColor: 'var(--surface-subtle)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="font-black text-sm text-[var(--text-primary)]">{d.name}</span>
                    </div>
                    <span className="font-black text-2xl text-[var(--text-primary)]">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card p-20 border-dashed border-2 bg-transparent shadow-none text-center">
              <p className="text-sm font-medium text-slate-400">No sentiment data yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIInsightsPage;
