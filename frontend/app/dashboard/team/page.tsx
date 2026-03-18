'use client';
import { useState } from 'react';
import { Search, Plus, Settings, Mail, MoreVertical, Users2, X, Globe } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface Team {
  id: number;
  name: string;
  domain: string;
  plan: string;
  members: number;
  status: string;
}

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: string;
  lastActive: string;
}

const roleBadge = (role: string) => {
  if (role === 'Owner') return 'px-2.5 py-1 rounded-full text-xs font-black bg-brand-500/10 text-brand-400';
  if (role === 'Admin') return 'px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-400';
  if (role === 'Member') return 'px-2.5 py-1 rounded-full text-xs font-black bg-amber-500/10 text-amber-400';
  return 'px-2.5 py-1 rounded-full text-xs font-black bg-slate-500/10 text-slate-400';
};

const statusBadge = (status: string) => {
  if (status === 'active') return 'px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-400';
  if (status === 'trial') return 'px-2.5 py-1 rounded-full text-xs font-black bg-amber-500/10 text-amber-400';
  return 'px-2.5 py-1 rounded-full text-xs font-black bg-slate-500/10 text-slate-400';
};

const TeamPage = () => {
  const [activeTab, setActiveTab] = useState('teams');
  const [teamSearch, setTeamSearch] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [addTeamOpen, setAddTeamOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: '', domain: '', plan: 'Pro' });
  const [newMember, setNewMember] = useState({ name: '', email: '', role: 'Member' });

  const [teams, setTeams] = useState<Team[]>([
    { id: 1, name: 'Acme Corp', domain: 'acmecorp.com', plan: 'Enterprise', members: 15, status: 'active' },
    { id: 2, name: 'Globex Inc', domain: 'globex.com', plan: 'Pro', members: 8, status: 'active' },
    { id: 3, name: 'Wayne Enterprises', domain: 'wayne-enterprise.com', plan: 'Basic', members: 3, status: 'trial' },
    { id: 4, name: 'Stark Industries', domain: 'stark.com', plan: 'Enterprise', members: 24, status: 'active' },
    { id: 5, name: 'Oscorp', domain: 'oscorp.net', plan: 'Pro', members: 12, status: 'pending' },
  ]);

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { id: 1, name: 'John Doe', email: 'john@acmecorp.com', role: 'Admin', lastActive: 'Just now' },
    { id: 2, name: 'Sarah Smith', email: 'sarah@acmecorp.com', role: 'Owner', lastActive: '2 hours ago' },
    { id: 3, name: 'Michael Brown', email: 'michael@acmecorp.com', role: 'Member', lastActive: 'Yesterday' },
    { id: 4, name: 'Emma Wilson', email: 'emma@acmecorp.com', role: 'Member', lastActive: '3 days ago' },
  ]);

  const filteredTeams = teams.filter(t =>
    t.name.toLowerCase().includes(teamSearch.toLowerCase()) ||
    t.domain.toLowerCase().includes(teamSearch.toLowerCase())
  );

  const filteredMembers = teamMembers.filter(m =>
    m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.email.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const handleAddTeam = () => {
    if (!newTeam.name || !newTeam.domain) { toast.error('Missing fields'); return; }
    setTeams(prev => [...prev, { id: Date.now(), ...newTeam, members: 0, status: 'pending' }]);
    setNewTeam({ name: '', domain: '', plan: 'Pro' });
    setAddTeamOpen(false);
    toast.success('Team created', { description: `${newTeam.name} has been added.` });
  };

  const handleDeleteTeam = (id: number) => {
    setTeams(prev => prev.filter(t => t.id !== id));
    toast.success('Team deleted');
  };

  const handleAddMember = () => {
    if (!newMember.name || !newMember.email) { toast.error('Missing fields'); return; }
    setTeamMembers(prev => [...prev, { id: Date.now(), ...newMember, lastActive: 'Just now' }]);
    setNewMember({ name: '', email: '', role: 'Member' });
    setAddMemberOpen(false);
    toast.success('Member added', { description: `${newMember.name} has been added.` });
  };

  const handleRemoveMember = (id: number) => {
    setTeamMembers(prev => prev.filter(m => m.id !== id));
    toast.success('Member removed');
  };

  const handleChangeRole = (id: number, role: string) => {
    setTeamMembers(prev => prev.map(m => m.id === id ? { ...m, role } : m));
    toast.success('Role updated');
  };

  const tabs = ['teams', 'members', 'roles'];

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
          <div className="flex items-center gap-3">
            <button className="btn-secondary flex items-center gap-2" onClick={() => toast('Team settings coming soon')}>
              <Settings className="w-4 h-4" />
              Team Settings
            </button>
            <button className="btn-primary flex items-center gap-2" onClick={() => setAddTeamOpen(true)}>
              <Plus className="w-4 h-4" />
              Add New Team
            </button>
          </div>
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

      {/* Teams Tab */}
      {activeTab === 'teams' && (
        <div className="card p-6 border-none shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-brand-500 to-indigo-600" />
                <h2 className="text-base font-black uppercase tracking-widest text-[var(--text-primary)]">Teams ({filteredTeams.length})</h2>
              </div>
              <p className="text-xs font-medium text-slate-500 ml-4">Manage client organizations</p>
            </div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input className="input pl-11" placeholder="Search teams..." value={teamSearch} onChange={e => setTeamSearch(e.target.value)} style={{ minWidth: 200 }} />
            </div>
          </div>

          {/* Header row */}
          <div className="grid grid-cols-12 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 rounded-xl mb-2" style={{ backgroundColor: 'var(--surface-subtle)' }}>
            <div className="col-span-3">Name</div>
            <div className="col-span-3">Domain</div>
            <div className="col-span-2">Plan</div>
            <div className="col-span-2">Members</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          <div className="space-y-2">
            {filteredTeams.map(team => (
              <div key={team.id} className="card p-5 border-none shadow-2xl group relative overflow-hidden hover:-translate-y-0.5 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-500 to-indigo-600 opacity-0 group-hover:opacity-5 transition-opacity" />
                <div className="grid grid-cols-12 items-center relative">
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500/20 to-indigo-600/20 flex items-center justify-center font-black text-sm text-brand-400 flex-shrink-0">
                      {team.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-black text-sm text-[var(--text-primary)]">{team.name}</div>
                      <span className={statusBadge(team.status)}>
                        {team.status === 'active' ? 'Active' : team.status === 'trial' ? 'Trial' : 'Pending'}
                      </span>
                    </div>
                  </div>
                  <div className="col-span-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <Globe className="w-3.5 h-3.5" />
                      {team.domain}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-black bg-brand-500/10 text-brand-400">{team.plan}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs font-bold text-slate-500">{team.members} users</span>
                  </div>
                  <div className="col-span-2 flex justify-end gap-2">
                    <button
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-brand-400 transition-colors"
                      style={{ backgroundColor: 'var(--surface-subtle)' }}
                      onClick={() => toast('Managing team', { description: team.name })}
                    >
                      Manage
                    </button>
                    <button
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 transition-colors"
                      style={{ backgroundColor: 'var(--surface-subtle)' }}
                      onClick={() => handleDeleteTeam(team.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredTeams.length === 0 && (
              <div className="card p-20 border-dashed border-2 bg-transparent shadow-none text-center">
                <div className="w-16 h-16 rounded-full bg-[var(--surface-subtle)] flex items-center justify-center mx-auto mb-4">
                  <Users2 className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-black text-[var(--text-primary)] mb-2">No teams found</h3>
                <p className="text-sm font-medium text-slate-400">Try adjusting your search.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="card p-6 border-none shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-brand-500 to-indigo-600" />
                <h2 className="text-base font-black uppercase tracking-widest text-[var(--text-primary)]">Team Members ({filteredMembers.length})</h2>
              </div>
              <p className="text-xs font-medium text-slate-500 ml-4">Manage users for selected team</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input className="input pl-11" placeholder="Search members..." value={memberSearch} onChange={e => setMemberSearch(e.target.value)} style={{ minWidth: 200 }} />
              </div>
              <button className="btn-primary flex items-center gap-2" onClick={() => setAddMemberOpen(true)}>
                <Plus className="w-4 h-4" />
                Add User
              </button>
            </div>
          </div>

          {/* Header row */}
          <div className="grid grid-cols-12 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 rounded-xl mb-2" style={{ backgroundColor: 'var(--surface-subtle)' }}>
            <div className="col-span-3">User</div>
            <div className="col-span-4">Email</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2">Last Active</div>
            <div className="col-span-1 text-right">Actions</div>
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
                    <div className="font-black text-sm text-[var(--text-primary)]">{member.name}</div>
                  </div>
                  <div className="col-span-4 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <Mail className="w-3.5 h-3.5" />
                    {member.email}
                  </div>
                  <div className="col-span-2">
                    <span className={roleBadge(member.role)}>{member.role}</span>
                  </div>
                  <div className="col-span-2 text-xs font-medium text-slate-500">{member.lastActive}</div>
                  <div className="col-span-1 flex justify-end">
                    <button
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors"
                      style={{ backgroundColor: 'var(--surface-subtle)' }}
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      <X className="w-4 h-4" />
                    </button>
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

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6 border-none shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 rounded-full bg-gradient-to-b from-brand-500 to-indigo-600" />
              <h2 className="text-base font-black uppercase tracking-widest text-[var(--text-primary)]">Role Management</h2>
            </div>
            <p className="text-xs font-medium text-slate-500 mb-6">Configure user roles and permissions</p>
            <div className="space-y-4">
              {[
                { role: 'Owner', desc: 'Full administrative access to all features and settings.', badgeCls: 'bg-brand-500/10 text-brand-400' },
                { role: 'Admin', desc: 'Can manage most settings and all data.', badgeCls: 'bg-emerald-500/10 text-emerald-400' },
                { role: 'Member', desc: 'Can access and modify content but not settings.', badgeCls: 'bg-amber-500/10 text-amber-400' },
                { role: 'Viewer', desc: 'Read-only access to data and reports.', badgeCls: 'bg-slate-500/10 text-slate-400' },
              ].map(r => (
                <div key={r.role} className="flex items-start gap-4 p-4 rounded-2xl" style={{ backgroundColor: 'var(--surface-subtle)' }}>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-black flex-shrink-0 mt-0.5 ${r.badgeCls}`}>{r.role}</span>
                  <p className="text-xs font-medium text-slate-500 leading-relaxed">{r.desc}</p>
                </div>
              ))}
            </div>
            <button className="btn-secondary w-full mt-4" onClick={() => toast('Custom role creation coming soon')}>
              <Plus className="w-4 h-4" />
              Create Custom Role
            </button>
          </div>

          <div className="card p-6 border-none shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 rounded-full bg-gradient-to-b from-brand-500 to-indigo-600" />
              <h2 className="text-base font-black uppercase tracking-widest text-[var(--text-primary)]">Permission Sets</h2>
            </div>
            <p className="text-xs font-medium text-slate-500 mb-6">Default permissions by feature</p>
            <div className="space-y-3">
              {['Lead Management', 'Conversation Builder', 'Campaign Manager', 'Analytics', 'Settings', 'Billing'].map(feature => (
                <div key={feature} className="flex items-center justify-between p-4 rounded-2xl" style={{ backgroundColor: 'var(--surface-subtle)' }}>
                  <span className="text-sm font-black text-[var(--text-primary)]">{feature}</span>
                  <button
                    className="px-4 py-2 rounded-xl font-bold text-xs bg-brand-600 text-white hover:bg-brand-500 transition-colors"
                    onClick={() => toast(`Configuring ${feature}`)}
                  >
                    Configure
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Team Modal */}
      <Dialog open={addTeamOpen} onOpenChange={setAddTeamOpen}>
        <DialogContent className="card p-8 border-none shadow-[0_20px_80px_rgba(0,0,0,0.3)] max-w-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-[var(--text-primary)] mb-1">Add New Team</h2>
              <p className="text-sm text-slate-500">Create a new client organization</p>
            </div>
            <button onClick={() => setAddTeamOpen(false)} className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-[var(--text-primary)] transition-colors" style={{ backgroundColor: 'var(--surface-subtle)' }}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="label-text">Team Name</label>
              <input className="input mt-1" placeholder="e.g., Acme Corp" value={newTeam.name} onChange={e => setNewTeam(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="label-text">Domain</label>
              <input className="input mt-1" placeholder="e.g., acmecorp.com" value={newTeam.domain} onChange={e => setNewTeam(p => ({ ...p, domain: e.target.value }))} />
            </div>
            <div>
              <label className="label-text">Plan</label>
              <Select value={newTeam.plan} onValueChange={v => setNewTeam(p => ({ ...p, plan: v }))}>
                <SelectTrigger className="input mt-1 h-auto"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Basic">Basic</SelectItem>
                  <SelectItem value="Pro">Pro</SelectItem>
                  <SelectItem value="Enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button className="btn-secondary flex-1" onClick={() => setAddTeamOpen(false)}>Cancel</button>
            <button className="btn-primary flex-[2]" onClick={handleAddTeam}>Create Team</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Member Modal */}
      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent className="card p-8 border-none shadow-[0_20px_80px_rgba(0,0,0,0.3)] max-w-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-[var(--text-primary)] mb-1">Add Team Member</h2>
              <p className="text-sm text-slate-500">Invite a new user to the team</p>
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
              <input type="email" className="input mt-1" placeholder="e.g., jane@acmecorp.com" value={newMember.email} onChange={e => setNewMember(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <label className="label-text">Role</label>
              <Select value={newMember.role} onValueChange={v => setNewMember(p => ({ ...p, role: v }))}>
                <SelectTrigger className="input mt-1 h-auto"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Member">Member</SelectItem>
                  <SelectItem value="Viewer">Viewer</SelectItem>
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
