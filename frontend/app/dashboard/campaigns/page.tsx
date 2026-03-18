'use client';
import { useState, useEffect } from 'react';
import { Search, Plus, Zap, Mail, MessageSquare, BarChart3, Users, Megaphone, X, Filter, Trash2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { getCampaigns, createCampaign, deleteCampaign, type Campaign, type CampaignListResponse } from '@/lib/api';

const statusBadge = (status: string) => {
  if (status === 'active') return 'px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-400';
  if (status === 'draft') return 'px-2.5 py-1 rounded-full text-xs font-black bg-slate-500/10 text-slate-400';
  if (status === 'paused') return 'px-2.5 py-1 rounded-full text-xs font-black bg-amber-500/10 text-amber-400';
  if (status === 'completed') return 'px-2.5 py-1 rounded-full text-xs font-black bg-brand-500/10 text-brand-400';
  return 'px-2.5 py-1 rounded-full text-xs font-black bg-slate-500/10 text-slate-400';
};

const CampaignsPage = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [addOpen, setAddOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: '', type: 'sms', status: 'draft', description: '' });
  const [data, setData] = useState<CampaignListResponse>({ campaigns: [], total: 0, active_count: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCampaigns()
      .then(setData)
      .catch(() => toast.error('Failed to load campaigns'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = data.campaigns.filter(c => {
    const matchesSearch = search === '' || c.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAdd = async () => {
    if (!newCampaign.name) { toast.error('Campaign name required'); return; }
    try {
      const created = await createCampaign(newCampaign);
      setData(prev => ({
        ...prev,
        campaigns: [created, ...prev.campaigns],
        total: prev.total + 1,
        active_count: created.status === 'active' ? prev.active_count + 1 : prev.active_count,
      }));
      setNewCampaign({ name: '', type: 'sms', status: 'draft', description: '' });
      setAddOpen(false);
      toast.success('Campaign created', { description: newCampaign.name });
    } catch {
      toast.error('Failed to create campaign');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteCampaign(id);
      setData(prev => ({
        ...prev,
        campaigns: prev.campaigns.filter(c => c.id !== id),
        total: prev.total - 1,
      }));
      toast.success('Campaign deleted', { description: name });
    } catch {
      toast.error('Failed to delete campaign');
    }
  };

  if (loading) {
    return <div className="text-slate-400 text-sm font-black uppercase tracking-[0.2em] py-20 text-center">Loading Campaigns…</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 font-sans pb-20">
      {/* Header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 text-brand-400 text-xs font-black uppercase tracking-widest mb-4">
          <Megaphone className="w-3 h-3" />
          Outreach Center
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tight leading-none mb-3">
              Campaign Manager
            </h1>
            <p className="text-sm font-medium text-slate-500">Build and track your automated outreach campaigns.</p>
          </div>
          <button className="btn-primary flex items-center gap-2" onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4" />
            New Campaign
          </button>
        </div>
      </div>

      {/* Performance stat cards */}
      <div className="grid grid-cols-2 gap-6">
        <div className="card p-6 border-none shadow-2xl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="label-text mb-1">Active Campaigns</p>
              <p className="text-3xl font-black text-[var(--text-primary)]">{data.active_count}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <Megaphone className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="card p-6 border-none shadow-2xl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="label-text mb-1">Total Campaigns</p>
              <p className="text-3xl font-black text-[var(--text-primary)]">{data.total}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Campaign list card */}
      <div className="card p-6 border-none shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-1 h-6 rounded-full bg-gradient-to-b from-brand-500 to-indigo-600" />
              <h2 className="text-base font-black uppercase tracking-widest text-[var(--text-primary)]">Campaigns ({filtered.length})</h2>
            </div>
            <p className="text-xs font-medium text-slate-500 ml-4">Manage your automated messaging campaigns</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input className="input pl-11" placeholder="Search campaigns..." value={search} onChange={e => setSearch(e.target.value)} style={{ minWidth: 200 }} />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="input appearance-none pr-8 py-2 text-xs font-black"
                style={{ minWidth: 130 }}
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="draft">Drafts</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Header row */}
        <div className="grid grid-cols-12 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 rounded-xl mb-2" style={{ backgroundColor: 'var(--surface-subtle)' }}>
          <div className="col-span-4">Name</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Leads</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        <div className="space-y-2">
          {filtered.map(campaign => (
            <div
              key={campaign.id}
              className="card p-5 border-none shadow-2xl group relative overflow-hidden hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-brand-500 to-indigo-600 opacity-0 group-hover:opacity-5 transition-opacity" />
              <div className="grid grid-cols-12 items-center relative">
                <div className="col-span-4 flex items-center gap-2.5 font-black text-sm text-[var(--text-primary)]">
                  {campaign.type === 'email'
                    ? <Mail className="w-4 h-4 text-brand-400 flex-shrink-0" />
                    : campaign.type === 'voice'
                    ? <Zap className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    : <MessageSquare className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  }
                  {campaign.name}
                </div>
                <div className="col-span-2 text-xs font-bold text-slate-500 capitalize">{campaign.type}</div>
                <div className="col-span-2">
                  <span className={statusBadge(campaign.status)}>
                    {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                  </span>
                </div>
                <div className="col-span-2 text-right">
                  <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {campaign.leads}
                  </div>
                </div>
                <div className="col-span-2 flex justify-end">
                  <button
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors"
                    style={{ backgroundColor: 'var(--surface-subtle)' }}
                    onClick={() => handleDelete(campaign.id, campaign.name)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="card p-20 border-dashed border-2 bg-transparent shadow-none text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--surface-subtle)] flex items-center justify-center mx-auto mb-4">
                <Megaphone className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-black text-[var(--text-primary)] mb-2">No campaigns yet</h3>
              <p className="text-sm font-medium text-slate-400">Create your first campaign to get started.</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-6 border-none shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-6 rounded-full bg-gradient-to-b from-brand-500 to-indigo-600" />
          <h2 className="text-base font-black uppercase tracking-widest text-[var(--text-primary)]">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { icon: Zap, title: 'Create SMS Campaign', desc: 'Send text messages to leads', type: 'sms' as string },
            { icon: Mail, title: 'Create Email Campaign', desc: 'Send emails to your leads', type: 'email' as string },
          ].map(action => (
            <button
              key={action.title}
              className="card p-5 border-none shadow-2xl group relative overflow-hidden hover:-translate-y-1 transition-all duration-300 text-left"
              onClick={() => {
                setNewCampaign(p => ({ ...p, type: action.type }));
                setAddOpen(true);
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-brand-500 to-indigo-600 opacity-0 group-hover:opacity-5 transition-opacity" />
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                  <action.icon className="w-5 h-5 text-brand-400" />
                </div>
                <div className="font-black text-sm text-[var(--text-primary)] mb-1">{action.title}</div>
                <div className="text-xs font-medium text-slate-500">{action.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* New Campaign Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="card p-8 border-none shadow-[0_20px_80px_rgba(0,0,0,0.3)] max-w-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-[var(--text-primary)] mb-1">Create New Campaign</h2>
              <p className="text-sm text-slate-500">Set up a new messaging campaign</p>
            </div>
            <button onClick={() => setAddOpen(false)} className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-[var(--text-primary)] transition-colors" style={{ backgroundColor: 'var(--surface-subtle)' }}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="label-text">Campaign Name</label>
              <input
                className="input mt-1"
                placeholder="e.g., Summer Promo"
                value={newCampaign.name}
                onChange={e => setNewCampaign(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="label-text">Type</label>
              <Select value={newCampaign.type} onValueChange={v => setNewCampaign(p => ({ ...p, type: v }))}>
                <SelectTrigger className="input mt-1 h-auto"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="voice">Voice</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="label-text">Description (optional)</label>
              <input
                className="input mt-1"
                placeholder="Brief description..."
                value={newCampaign.description}
                onChange={e => setNewCampaign(p => ({ ...p, description: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button className="btn-secondary flex-1" onClick={() => setAddOpen(false)}>Cancel</button>
            <button className="btn-primary flex-[2]" onClick={handleAdd}>Create Campaign</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CampaignsPage;
