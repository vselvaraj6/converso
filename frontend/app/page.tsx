'use client'
import Link from 'next/link'
import { CheckCircle2, MessageSquare, Calendar, Zap, ShieldCheck, Brain, Phone, ArrowRight, Command, Sparkles, TrendingUp, ShieldAlert } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-brand-500/30">
      {/* Dynamic Background Mesh */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-brand-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-600/5 blur-[100px] rounded-full" />
      </div>

      {/* Navigation */}
      <nav className="border-b border-white/5 sticky top-0 bg-slate-950/50 backdrop-blur-xl z-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
          <div className="flex justify-between h-20 items-center">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-2xl bg-brand-600 flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-all group-hover:scale-110 group-hover:rotate-3">
                <Command size={22} className="text-white" />
              </div>
              <span className="font-black text-2xl tracking-tighter text-white">Converso</span>
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/login" className="text-sm font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link href="/register" className="btn-primary px-8 py-2.5 text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-brand-500/20">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden z-10">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 text-brand-400 text-[10px] font-black uppercase tracking-[0.2em] mb-10 border border-brand-500/20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <Sparkles size={14} className="animate-pulse" />
            <span>Multi-Tenant Enterprise Architecture</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-white leading-[0.95] tracking-tighter mb-10">
            Automate sales <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-indigo-400 to-blue-400">at machine speed.</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 font-medium leading-relaxed mb-12">
            The world's first multi-tenant autonomous agent hub. Manage entire teams of AI sales reps from a single, high-performance command center.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link href="/register" className="btn-primary px-12 py-5 text-base font-black uppercase tracking-[0.2em] shadow-[0_0_40px_rgba(124,58,237,0.3)] w-full sm:w-auto hover:-translate-y-1">
              Initialize Stack
            </Link>
            <Link href="#how-it-works" className="btn-secondary px-12 py-5 text-base font-black uppercase tracking-[0.2em] w-full sm:w-auto border-white/10 hover:bg-white/5">
              Protocol Demo
            </Link>
          </div>
          
          {/* Dashboard Preview */}
          <div className="mt-24 relative max-w-6xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-20 h-full w-full" />
            <div className="card rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,0.6)] border-white/5 overflow-hidden bg-slate-900/50 p-3 md:p-5 animate-in zoom-in duration-1000 relative">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
              <img 
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426" 
                alt="Command Center Preview" 
                className="rounded-[32px] shadow-2xl grayscale opacity-60 mix-blend-screen"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-32 relative z-10 border-y border-white/5 bg-slate-900/20">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">Autonomous Pipeline Logic</h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Proprietary lead journey orchestration</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-20">
            <Step 
              num="01" 
              title="Mass Ingestion" 
              desc="Deploy thousands of leads instantly via Excel/CSV or real-time API integrations."
              icon={Zap}
            />
            <Step 
              num="02" 
              title="AI Engagement" 
              desc="Context-aware agents initiate outreach using your specific industry memory and lingo."
              icon={Brain}
            />
            <Step 
              num="03" 
              title="Auto-Booking" 
              desc="Meetings are automatically negotiated and scheduled directly into your Cal.com team instance."
              icon={Calendar}
            />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-40 relative z-10">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="space-y-10">
              <div className="space-y-4">
                <h2 className="text-5xl font-black text-white leading-none tracking-tighter">
                  Architected for <br/>
                  <span className="text-brand-500">Maximum Velocity.</span>
                </h2>
                <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-md">
                  A comprehensive suite of sales intelligence tools designed to eliminate manual follow-up permanently.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-12">
                <Feature title="Neural SMS Engine" desc="GPT-4 powered conversations that pass the Turing test." icon={MessageSquare} />
                <Feature title="Team Orchestrator" desc="Manage entire sales organizations from one master link." icon={Users} />
                <Feature title="Usage Analytics" desc="Live oversight of API compute and lead conversion rates." icon={TrendingUp} />
                <Feature title="Data Isolation" desc="Military-grade multi-tenancy ensures complete security." icon={ShieldCheck} />
                <Feature title="VAPI Voice Core" desc="Seamless bridge between AI texting and automated calling." icon={Mic} />
                <Feature title="Instance Config" desc="Full support for self-hosted scheduling infrastructure." icon={Globe} />
              </div>
            </div>
            <div className="relative group">
              <div className="absolute -inset-10 bg-brand-600/20 rounded-full blur-[120px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              <div className="card rounded-[40px] border-white/10 shadow-2xl overflow-hidden relative">
                <img 
                  src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=1600" 
                  alt="Architecture Hub" 
                  className="rounded-[32px] opacity-40 grayscale"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-brand-600/20 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 relative z-10">
        <div className="max-w-5xl mx-auto rounded-[3rem] bg-slate-900 border border-white/5 p-16 md:p-24 text-center relative overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-600 blur-[150px] opacity-10 group-hover:opacity-20 transition-opacity" />
          <div className="relative z-10 space-y-10">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-none tracking-tighter">
              Ready to automate <br/> your future?
            </h2>
            <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto font-medium italic">
              Join the elite sales teams operating on Converso's autonomous infrastructure.
            </p>
            <Link href="/register" className="btn-primary px-16 py-6 text-xl font-black uppercase tracking-[0.2em] hover:scale-105 transition-transform inline-flex items-center gap-3">
              Initialize Now <ArrowRight size={24} strokeWidth={3} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500">
            <Command size={20} className="text-brand-500" />
            <span className="font-black text-xl tracking-tighter text-white">Converso</span>
          </div>
          <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.2em]">© 2026 Converso Platform. All rights reserved.</p>
          <div className="flex gap-10 text-[10px] text-slate-500 font-black uppercase tracking-widest">
            <Link href="#" className="hover:text-brand-400 transition-colors">Privacy Protocol</Link>
            <Link href="#" className="hover:text-brand-400 transition-colors">Service Terms</Link>
            <Link href="#" className="hover:text-brand-400 transition-colors">Terminal Hub</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Step({ num, title, desc, icon: Icon }: { num: string; title: string; desc: string; icon: any }) {
  return (
    <div className="flex flex-col items-center text-center relative z-10 group">
      <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-white/5 shadow-2xl flex items-center justify-center mb-8 text-brand-400 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 relative">
        <div className="absolute inset-0 bg-brand-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
        <Icon size={36} strokeWidth={2.5} className="relative z-10" />
      </div>
      <span className="text-[10px] font-black text-brand-500 uppercase tracking-[0.3em] mb-3">{num} / Step</span>
      <h3 className="text-xl font-black text-white mb-3 tracking-tight">{title}</h3>
      <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-[250px]">{desc}</p>
    </div>
  )
}

function Feature({ title, desc, icon: Icon }: { title: string; desc: string; icon: any }) {
  return (
    <div className="space-y-4 group">
      <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-brand-400 shadow-xl group-hover:bg-brand-600 group-hover:text-white transition-all duration-500">
        <Icon size={24} strokeWidth={2.5} />
      </div>
      <div className="space-y-1">
        <h3 className="font-black text-white text-xs uppercase tracking-widest">{title}</h3>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

import { Mic, Globe } from 'lucide-react'
