'use client';
import { useState, useEffect } from 'react';
import { Search, Filter, Download, TrendingUp, Calendar, Phone, Mail } from 'lucide-react';
import { exportToCSV } from '@/lib/exportUtils';
import { toast } from 'sonner';
import { getLeads, type Lead } from '@/lib/api';

const ConversionsPage = () => {
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [conversions, setConversions] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeads({ status: 'converted', limit: 100 })
      .then(r => setConversions(r.leads))
      .catch(() => toast.error('Failed to load conversions'))
      .finally(() => setLoading(false));
  }, []);

  const uniqueSources = [...new Set(conversions.map(c => c.source).filter(Boolean))] as string[];

  const filtered = conversions.filter(c => {
    const matchesSearch = search === '' ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.company || '').toLowerCase().includes(search.toLowerCase());
    const matchesSource = sourceFilter === 'all' || c.source === sourceFilter;
    return matchesSearch && matchesSource;
  });

  const handleExport = () => {
    exportToCSV(filtered.map(c => ({
      Name: c.name, Company: c.company, Email: c.email, Phone: c.phone,
      Source: c.source, Date: c.created_at,
    })), 'conversions');
    toast.success('Export complete', { description: `Exported ${filtered.length} conversions` });
  };

  if (loading) {
    return <div className="text-slate-400 text-sm font-black uppercase tracking-[0.2em] py-20 text-center">Loading Conversions…</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 font-sans pb-20">
      {/* Header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 text-brand-400 text-xs font-black uppercase tracking-widest mb-4">
          <TrendingUp className="w-3 h-3" />
          Revenue Tracking
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tight leading-none mb-3">
              Conversions
            </h1>
            <p className="text-sm font-medium text-slate-500">Monitor your converted leads.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-secondary flex items-center gap-2" onClick={handleExport}>
              <Download className="w-4 h-4" />
              Export
            </button>
            <div className="relative">
              <select
                value={sourceFilter}
                onChange={e => setSourceFilter(e.target.value)}
                className="input appearance-none pr-8 py-2 text-xs font-black"
                style={{ minWidth: 140 }}
              >
                <option value="all">All Sources</option>
                {uniqueSources.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6 border-none shadow-2xl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="label-text mb-1">Total Conversions</p>
              <p className="text-3xl font-black text-[var(--text-primary)]">{filtered.length}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="card p-6 border-none shadow-2xl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="label-text mb-1">Sources</p>
              <p className="text-3xl font-black text-[var(--text-primary)]">{uniqueSources.length || '—'}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Converted Clients Table */}
      <div className="card p-6 border-none shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-1 h-6 rounded-full bg-gradient-to-b from-brand-500 to-indigo-600" />
              <h2 className="text-base font-black uppercase tracking-widest text-[var(--text-primary)]">Converted Clients</h2>
            </div>
            <p className="text-xs font-medium text-slate-500 ml-4">{filtered.length} of {conversions.length} conversions</p>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="input pl-11"
              placeholder="Search conversions..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ minWidth: 260 }}
            />
          </div>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-12 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 rounded-xl mb-2" style={{ backgroundColor: 'var(--surface-subtle)' }}>
          <div className="col-span-3">Client</div>
          <div className="col-span-4">Contact</div>
          <div className="col-span-2">Source</div>
          <div className="col-span-3">Date</div>
        </div>

        {/* Table rows */}
        <div className="space-y-2">
          {filtered.map(c => (
            <div
              key={c.id}
              className="card p-5 border-none shadow-2xl group relative overflow-hidden hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-brand-500 to-indigo-600 opacity-0 group-hover:opacity-5 transition-opacity" />
              <div className="grid grid-cols-12 items-center relative">
                <div className="col-span-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500/20 to-indigo-600/20 flex items-center justify-center font-black text-sm text-brand-400 flex-shrink-0">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-black text-xs text-[var(--text-primary)]">{c.name}</div>
                      <div className="text-[10px] font-bold text-slate-400">{c.company || '—'}</div>
                    </div>
                  </div>
                </div>
                <div className="col-span-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{c.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                      <Phone className="w-3 h-3" />
                      <span>{c.phone}</span>
                    </div>
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-brand-500/10 text-brand-400">
                    {c.source || 'unknown'}
                  </span>
                </div>
                <div className="col-span-3">
                  <span className="text-xs font-medium text-slate-400">
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="card p-20 border-dashed border-2 bg-transparent shadow-none text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--surface-subtle)] flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-black text-[var(--text-primary)] mb-2">No conversions yet</h3>
              <p className="text-sm font-medium text-slate-400">Converted leads will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversionsPage;
