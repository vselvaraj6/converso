'use client';
import { useState } from 'react';
import { Search, Filter, Download, TrendingUp, DollarSign, Calendar, Phone, Mail, Clock, User } from 'lucide-react';
import { exportToCSV } from '@/lib/exportUtils';
import { toast } from 'sonner';

const ConversionsPage = () => {
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');

  const conversions = [
    { id: 1, clientName: 'Sarah Johnson', company: 'TechStart Inc.', email: 'sarah@techstart.com', phone: '+1 (555) 123-4567', convertedDate: '2024-01-15', leadSource: 'Website Chat', dealValue: 15000, conversionTime: '3 days', teamMember: 'John Smith', status: 'closed-won' },
    { id: 2, clientName: 'Michael Chen', company: 'Growth Labs', email: 'm.chen@growthlabs.com', phone: '+1 (555) 987-6543', convertedDate: '2024-01-12', leadSource: 'Email Campaign', dealValue: 8500, conversionTime: '7 days', teamMember: 'Sarah Davis', status: 'closed-won' },
    { id: 3, clientName: 'Emily Rodriguez', company: 'Marketing Pro', email: 'emily@marketingpro.com', phone: '+1 (555) 456-7890', convertedDate: '2024-01-10', leadSource: 'SMS Follow-up', dealValue: 12000, conversionTime: '5 days', teamMember: 'Mike Johnson', status: 'closed-won' },
    { id: 4, clientName: 'David Thompson', company: 'Startup Solutions', email: 'david@startupsolutions.com', phone: '+1 (555) 321-0987', convertedDate: '2024-01-08', leadSource: 'Referral', dealValue: 25000, conversionTime: '2 days', teamMember: 'John Smith', status: 'closed-won' },
    { id: 5, clientName: 'Lisa Wang', company: 'Digital Ventures', email: 'lisa@digitalventures.com', phone: '+1 (555) 654-3210', convertedDate: '2024-01-05', leadSource: 'Website Chat', dealValue: 18500, conversionTime: '4 days', teamMember: 'Sarah Davis', status: 'closed-won' },
    { id: 6, clientName: 'James Parker', company: 'CloudFirst', email: 'james@cloudfirst.io', phone: '+1 (555) 111-2222', convertedDate: '2024-01-18', leadSource: 'Referral', dealValue: 32000, conversionTime: '1 day', teamMember: 'Mike Johnson', status: 'closed-won' },
    { id: 7, clientName: 'Amanda Foster', company: 'DataSync Co', email: 'amanda@datasync.co', phone: '+1 (555) 333-4444', convertedDate: '2024-01-20', leadSource: 'Email Campaign', dealValue: 9500, conversionTime: '6 days', teamMember: 'John Smith', status: 'closed-won' },
  ];

  const filtered = conversions.filter(c => {
    const matchesSearch = search === '' || c.clientName.toLowerCase().includes(search.toLowerCase()) || c.company.toLowerCase().includes(search.toLowerCase());
    const matchesSource = sourceFilter === 'all' || c.leadSource === sourceFilter;
    return matchesSearch && matchesSource;
  });

  const totalRevenue = filtered.reduce((sum, c) => sum + c.dealValue, 0);
  const averageDealSize = filtered.length ? totalRevenue / filtered.length : 0;
  const averageConversionTime = filtered.length ? Math.round(filtered.reduce((sum, c) => sum + parseInt(c.conversionTime), 0) / filtered.length) : 0;

  const handleExport = () => {
    exportToCSV(filtered.map(c => ({
      Client: c.clientName, Company: c.company, Email: c.email, Phone: c.phone,
      'Lead Source': c.leadSource, 'Deal Value': c.dealValue, 'Conversion Time': c.conversionTime,
      'Team Member': c.teamMember, Date: c.convertedDate
    })), 'conversions');
    toast.success('Export complete', { description: `Exported ${filtered.length} conversions` });
  };

  const uniqueSources = [...new Set(conversions.map(c => c.leadSource))];

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
            <p className="text-sm font-medium text-slate-500">Monitor your deal pipeline and conversion rates.</p>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
          <p className="text-xs font-medium text-slate-500">+20% from last month</p>
        </div>

        <div className="card p-6 border-none shadow-2xl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="label-text mb-1">Total Revenue</p>
              <p className="text-3xl font-black text-[var(--text-primary)]">${totalRevenue.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-xs font-medium text-slate-500">From {filtered.length} deals</p>
        </div>

        <div className="card p-6 border-none shadow-2xl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="label-text mb-1">Avg Deal Size</p>
              <p className="text-3xl font-black text-[var(--text-primary)]">${Math.round(averageDealSize).toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-xs font-medium text-slate-500">+8% from last month</p>
        </div>

        <div className="card p-6 border-none shadow-2xl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="label-text mb-1">Avg Conversion Time</p>
              <p className="text-3xl font-black text-[var(--text-primary)]">{averageConversionTime}d</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-xs font-medium text-slate-500">-12% from last month</p>
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
          <div className="col-span-2">Client</div>
          <div className="col-span-3">Contact</div>
          <div className="col-span-2">Lead Source</div>
          <div className="col-span-1">Deal Value</div>
          <div className="col-span-2">Team Member</div>
          <div className="col-span-1">Conv. Time</div>
          <div className="col-span-1">Date</div>
        </div>

        {/* Table rows */}
        <div className="space-y-2">
          {filtered.map(conversion => (
            <div
              key={conversion.id}
              className="card p-5 border-none shadow-2xl group relative overflow-hidden hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-brand-500 to-indigo-600 opacity-0 group-hover:opacity-5 transition-opacity" />
              <div className="grid grid-cols-12 items-center relative">
                <div className="col-span-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500/20 to-indigo-600/20 flex items-center justify-center font-black text-sm text-brand-400 flex-shrink-0">
                      {conversion.clientName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-black text-xs text-[var(--text-primary)]">{conversion.clientName}</div>
                      <div className="text-[10px] font-bold text-slate-400">{conversion.company}</div>
                    </div>
                  </div>
                </div>
                <div className="col-span-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{conversion.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                      <Phone className="w-3 h-3" />
                      <span>{conversion.phone}</span>
                    </div>
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-brand-500/10 text-brand-400">
                    {conversion.leadSource}
                  </span>
                </div>
                <div className="col-span-1">
                  <span className="font-black text-sm text-emerald-400">${conversion.dealValue.toLocaleString()}</span>
                </div>
                <div className="col-span-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <User className="w-3 h-3" />
                    {conversion.teamMember}
                  </div>
                </div>
                <div className="col-span-1">
                  <span className="text-xs font-bold text-[var(--text-primary)]">{conversion.conversionTime}</span>
                </div>
                <div className="col-span-1">
                  <span className="text-xs font-medium text-slate-400">{new Date(conversion.convertedDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="card p-20 border-dashed border-2 bg-transparent shadow-none text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--surface-subtle)] flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-black text-[var(--text-primary)] mb-2">No conversions found</h3>
              <p className="text-sm font-medium text-slate-400">Try adjusting your search or filter.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversionsPage;
