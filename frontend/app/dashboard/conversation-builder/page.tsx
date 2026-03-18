'use client';
import { GitBranch, Plus, Save, Play, Settings, MessageSquare, HelpCircle, GitFork, Zap, Clock, FormInput } from 'lucide-react';

const ConversationBuilderPage = () => {
  const nodeTypes = [
    { icon: MessageSquare, title: 'Message', desc: 'Send a message to the lead' },
    { icon: HelpCircle, title: 'Question', desc: 'Ask a question with response options' },
    { icon: GitFork, title: 'Condition', desc: 'Branch based on conditions' },
    { icon: Zap, title: 'Action', desc: 'Perform an action or API call' },
    { icon: Clock, title: 'Delay', desc: 'Wait for a specified time' },
    { icon: FormInput, title: 'Input', desc: 'Collect data from the user' },
  ];

  return (
    <div className="max-w-full font-sans pb-6">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 text-brand-400 text-xs font-black uppercase tracking-widest mb-4">
          <GitBranch className="w-3 h-3" />
          Flow Studio
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tight leading-none mb-3">
              Conversation Builder
            </h1>
            <p className="text-sm font-medium text-slate-500">Design automated conversation flows for your AI assistant.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-secondary flex items-center gap-2">
              <Play className="w-4 h-4" />
              Test Flow
            </button>
            <button className="btn-secondary flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </button>
            <button className="btn-primary flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save Flow
            </button>
          </div>
        </div>
      </div>

      {/* 3-panel layout */}
      <div className="grid grid-cols-12 gap-4" style={{ height: 'calc(100vh - 16rem)' }}>
        {/* Left panel — Node palette */}
        <div className="col-span-3 flex flex-col">
          <div className="card p-4 border-none shadow-2xl flex flex-col h-full">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-1 h-6 rounded-full bg-gradient-to-b from-brand-500 to-indigo-600" />
              <h2 className="text-base font-black uppercase tracking-widest text-[var(--text-primary)]">Components</h2>
            </div>
            <p className="text-xs font-medium text-slate-500 mb-5">Drag and drop to build your conversation flow</p>
            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              {nodeTypes.map(node => (
                <div
                  key={node.title}
                  className="card p-4 border-none shadow-2xl group relative overflow-hidden hover:-translate-y-0.5 transition-all duration-300 cursor-grab active:cursor-grabbing"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-500 to-indigo-600 opacity-0 group-hover:opacity-5 transition-opacity" />
                  <div className="flex items-center gap-3 relative">
                    <div className="w-9 h-9 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <node.icon className="w-4 h-4 text-brand-400" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-[var(--text-primary)]">{node.title}</h3>
                      <p className="text-[10px] font-medium text-slate-400">{node.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center panel — Canvas */}
        <div className="col-span-6 flex flex-col">
          <div className="card border-none shadow-2xl flex flex-col h-full overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: 'var(--divider)' }}>
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-brand-500 to-indigo-600" />
                <h2 className="text-base font-black uppercase tracking-widest text-[var(--text-primary)]">Flow Editor</h2>
              </div>
              <button className="px-4 py-2 rounded-xl font-bold text-sm bg-brand-600 text-white hover:bg-brand-500 transition-colors flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Node
              </button>
            </div>
            <div className="flex-1 p-6 flex items-center justify-center">
              <div
                className="w-full h-full rounded-2xl border-2 border-dashed flex items-center justify-center p-12 text-center"
                style={{ borderColor: 'var(--divider)' }}
              >
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-full bg-[var(--surface-subtle)] flex items-center justify-center mx-auto">
                    <GitBranch className="w-8 h-8 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-[var(--text-primary)] mb-2">Start building your flow</h3>
                    <p className="text-sm font-medium text-slate-400">Drag components from the left panel or click the Add Node button</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel — Properties */}
        <div className="col-span-3 flex flex-col">
          <div className="card p-6 border-none shadow-2xl flex flex-col h-full">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-1 h-6 rounded-full bg-gradient-to-b from-brand-500 to-indigo-600" />
              <h2 className="text-base font-black uppercase tracking-widest text-[var(--text-primary)]">Properties</h2>
            </div>
            <p className="text-xs font-medium text-slate-500 mb-6">Configure the selected node</p>
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-[var(--surface-subtle)] flex items-center justify-center mx-auto mb-3">
                  <Settings className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-xs font-medium text-slate-400">Select a node to view and edit its properties</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationBuilderPage;
