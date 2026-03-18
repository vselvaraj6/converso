'use client';
import { useState, useEffect } from 'react';
import { Search, Plus, Mail, Users2, X, Globe } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { getTeamMembers, getCompany, getStoredUser, createUserAsAdmin, type TeamMember, type Company } from '@/lib/api';

const roleBadge = (role: string) => {
  if (role === 'admin') return 'px-2.5 py-1 rounded-full text-xs font-black bg-brand-500/10 text-brand-400';
  if (role === 'write') return 'px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-400';
  return 'px-2.5 py-1 rounded-full text-xs font-black bg-slate-500/10 text-slate-400';
};

const TeamPage = () => {
  const [activeTab, setActiveTab] = useState('members');
  const [memberSearch, setMemberSearch] = useState('');
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', email: '', password: '', role: 'write' });
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  const currentUser = getStoredUser();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.is_superuser;

  useEffect(() => {
    Promise.all([getTeamMembers(), getCompany()])
      .then(([t, c]) => {
        setMembers(t.users);
        setCompany(c);
      })
      .catch(() => toast.error('Failed to load team data'))
      .finally(() => setLoading(false));
  }, []);

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.email.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const handleAddMember = async () => {
    if (!newMember.name || !newMember.email || !newMember.password) {
      toast.error('Name, email and password are required');
      return;
    }
    if (!company) return;
    try {
      await createUserAsAdmin(company.id, {
        name: newMember.name,
        email: newMember.email,
        password: newMember.password,
        role: newMember.role,
      });
      // Refresh list
      const refreshed = await getTeamMembers();
      setMembers(refreshed.users);
      setNewMember({ name: '', email: '', password: '', role: 'write' });
      setAddMemberOpen(false);
      toast.success('Member added', { description: newMember.name });
    } catch (e: any) {
      toast.error(e.message || 'Failed to add member');
    }
  };

  const tabs = ['members', 'company'];

  if (loading) {
    return <div className="text-slate-400 text-sm font-black uppercase tracking-[0.2em] py-20 text-center">Loading Team…</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 font-sans pb-20">
      {/* Header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 text-brand-400 text-xs font-black uppercase tracking-widest mb-4">
          <Users2 className="w-3 h-3" />
          Team Hub
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tight leading-none mb-3">
              Team Management
            </h1>
            <p className="text-sm font-medium text-slate-500">Manage your team members and their permissions.</p>
          </div>
          {isAdmin && (
            <button className="btn-primary flex items-center gap-2" onClick={() => setAddMemberOpen(true)}>
              <Plus className="w-4 h-4" />
              Add Member
            </button>
          )}
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

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="card p-6 border-none shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-brand-500 to-indigo-600" />
                <h2 className="text-base font-black uppercase tracking-widest text-[var(--text-primary)]">Team Members ({filteredMembers.length})</h2>
              </div>
              <p className="text-xs font-medium text-slate-500 ml-4">Your company's users and their performance</p>
            </div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input className="input pl-11" placeholder="Search members..." value={memberSearch} onChange={e => setMemberSearch(e.target.value)} style={{ minWidth: 200 }} />
            </div>
          </div>

          {/* Header row */}
          <div className="grid grid-cols-12 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 rounded-xl mb-2" style={{ backgroundColor: 'var(--surface-subtle)' }}>
            <div className="col-span-3">User</div>
            <div className="col-span-3">Email</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2 text-right">Leads</div>
            <div className="col-span-2 text-right">Meetings</div>
          </div>

          <div className="space-y-2">
            {filteredMembers.map(member => (
              <div key={member.id} className="card p-5 border-none shadow-2xl group relative overflow-hidden hover:-translate-y-0.5 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-500 to-indigo-600 opacity-0 group-hover:opacity-5 transition-opacity" />
                <div className="grid grid-cols-12 items-center relative">
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500/20 to-indigo-600/20 flex items-center justify-center font-black text-sm text-brand-400 flex-shrink-0">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-black text-sm text-[var(--text-primary)]">{member.name}</div>
                      <div className="text-[10px] font-medium text-slate-500">
                        Joined {new Date(member.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-3 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <Mail className="w-3.5 h-3.5" />
                    {member.email}
                  </div>
                  <div className="col-span-2">
                    <span className={roleBadge(member.role)}>{member.role}</span>
                  </div>
                  <div className="col-span-2 text-right text-xs font-bold text-[var(--text-primary)]">
                    {member.leads_assigned}
                  </div>
                  <div className="col-span-2 text-right text-xs font-bold text-[var(--text-primary)]">
                    {member.meetings_booked}
                  </div>
                </div>
              </div>
            ))}
            {filteredMembers.length === 0 && (
              <div className="card p-20 border-dashed border-2 bg-transparent shadow-none text-center">
                <div className="w-16 h-16 rounded-full bg-[var(--surface-subtle)] flex items-center justify-center mx-auto mb-4">
                  <Users2 className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-black text-[var(--text-primary)] mb-2">No members found</h3>
                <p className="text-sm font-medium text-slate-400">Try adjusting your search.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Company Tab */}
      {activeTab === 'company' && company && (
        <div className="card p-6 border-none shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-brand-500 to-indigo-600" />
            <h2 className="text-base font-black uppercase tracking-widest text-[var(--text-primary)]">Company Info</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { label: 'Company Name', value: company.name },
              { label: 'Industry', value: company.industry || '—' },
              { label: 'Twilio Number', value: company.twilio_phone_number || 'Not configured' },
              { label: 'Booking URL', value: company.cal_booking_url || 'Not configured' },
              { label: 'Created', value: new Date(company.created_at).toLocaleDateString() },
              { label: 'Team Size', value: String(members.length) },
            ].map(({ label, value }) => (
              <div key={label} className="p-4 rounded-2xl" style={{ backgroundColor: 'var(--surface-subtle)' }}>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</div>
                <div className="text-sm font-black text-[var(--text-primary)]">{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent className="card p-8 border-none shadow-[0_20px_80px_rgba(0,0,0,0.3)] max-w-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-[var(--text-primary)] mb-1">Add Team Member</h2>
              <p className="text-sm text-slate-500">Invite a new user to the company</p>
            </div>
            <button onClick={() => setAddMemberOpen(false)} className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-[var(--text-primary)] transition-colors" style={{ backgroundColor: 'var(--surface-subtle)' }}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="label-text">Full Name</label>
              <input className="input mt-1" placeholder="e.g., Jane Smith" value={newMember.name} onChange={e => setNewMember(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="label-text">Email</label>
              <input type="email" className="input mt-1" placeholder="jane@company.com" value={newMember.email} onChange={e => setNewMember(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <label className="label-text">Password</label>
              <input type="password" className="input mt-1" placeholder="Temporary password" value={newMember.password} onChange={e => setNewMember(p => ({ ...p, password: e.target.value }))} />
            </div>
            <div>
              <label className="label-text">Role</label>
              <Select value={newMember.role} onValueChange={v => setNewMember(p => ({ ...p, role: v }))}>
                <SelectTrigger className="input mt-1 h-auto"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="write">Write</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button className="btn-secondary flex-1" onClick={() => setAddMemberOpen(false)}>Cancel</button>
            <button className="btn-primary flex-[2]" onClick={handleAddMember}>Add Member</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamPage;
