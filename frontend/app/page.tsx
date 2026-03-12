'use client'
import Link from 'next/link'
import { CheckCircle2, MessageSquare, Calendar, Zap, ShieldCheck, Brain, Phone, ArrowRight } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="Converso Logo" className="w-8 h-8 rounded-lg" />
              <span className="font-black text-xl tracking-tight text-gray-900">Converso</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm font-bold text-gray-600 hover:text-gray-900 px-4 py-2 transition-colors">
                Sign In
              </Link>
              <Link href="/register" className="btn-primary px-5 py-2 text-sm font-bold shadow-lg shadow-brand-100">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <SparkleIcon />
            <span>AI-POWERED LEAD NURTURING</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-[1.05] tracking-tight mb-8">
            Scale your sales <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">without the team.</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-500 font-medium leading-relaxed mb-10">
            Converso is the "shadow agent" that follows up with every lead instantly, schedules your meetings, and nurtures prospects 24/7.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="btn-primary px-10 py-4 text-lg font-bold shadow-2xl shadow-brand-200 w-full sm:w-auto">
              Start Free Trial
            </Link>
            <Link href="#how-it-works" className="btn-secondary px-10 py-4 text-lg font-bold w-full sm:w-auto">
              How it works
            </Link>
          </div>
          
          {/* Hero Image / Mockup Placeholder */}
          <div className="mt-20 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 h-full w-full" />
            <div className="card rounded-2xl shadow-2xl border-gray-100 overflow-hidden max-w-5xl mx-auto bg-gray-50 p-2 md:p-4 animate-in zoom-in duration-1000">
              <img 
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426" 
                alt="Dashboard Mockup" 
                className="rounded-xl shadow-inner object-cover aspect-video"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">Your lead journey, automated.</h2>
            <p className="text-gray-500 font-medium max-w-xl mx-auto text-sm md:text-base leading-relaxed">From the first "Hello" to a booked meeting, Converso handles everything.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Connection lines (Desktop) */}
            <div className="hidden md:block absolute top-1/2 left-[25%] right-[25%] h-0.5 border-t-2 border-dashed border-gray-200 -z-0" />
            
            <Step 
              num="01" 
              title="Add Lead" 
              desc="Manually add or bulk upload leads from your CSV/Excel files into your dashboard."
              icon={PlusIcon}
            />
            <Step 
              num="02" 
              title="AI Outreach" 
              desc="Converso instantly texts the lead using your name and personalized industry lingo."
              icon={BotIcon}
            />
            <Step 
              num="03" 
              title="Meeting Booked" 
              desc="The AI checks your work calendar, suggests times, and sends a booking link automatically."
              icon={CalendarIcon}
            />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-4xl font-black text-gray-900 leading-tight mb-6">
                Everything you need to <br/>
                <span className="text-brand-600 underline decoration-brand-200">close more deals.</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <Feature title="Human AI Conversations" desc="Proprietary context-aware logic that sounds like a top-tier sales rep." icon={MessageSquare} />
                <Feature title="Work Calendar Sync" desc="Zero-config integration with Cal.com using shadow profiles." icon={Calendar} />
                <Feature title="Mass Lead Import" desc="Process thousands of leads instantly with our smart Excel/CSV importer." icon={Zap} />
                <Feature title="Managed Security" desc="Enterprise-grade data isolation ensures your leads are always yours." icon={ShieldCheck} />
                <Feature title="Industry Memory" desc="Train your AI on your specific business lingo and company history." icon={Brain} />
                <Feature title="Voice Call Webhooks" desc="Bridge the gap between SMS and voice with seamless VAPI integration." icon={Phone} />
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-brand-100 rounded-3xl blur-3xl opacity-30 -z-10" />
              <img 
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=1600" 
                alt="Feature Showcase" 
                className="rounded-3xl shadow-2xl border border-gray-100"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto rounded-[2rem] bg-gray-900 p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600 blur-[120px] opacity-20" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">
              Ready to automate your pipeline?
            </h2>
            <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto font-medium">
              Join the 1,000+ businesses who have stopped letting leads go cold.
            </p>
            <Link href="/register" className="btn-primary px-12 py-4 text-xl font-bold hover:scale-105 transition-transform inline-flex items-center gap-2">
              Get Started for Free <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-50 grayscale">
            <img src="/logo.svg" alt="Converso Logo" className="w-6 h-6" />
            <span className="font-bold text-gray-900 tracking-tight">Converso</span>
          </div>
          <p className="text-gray-400 text-xs font-medium">© 2026 Converso Inc. All rights reserved.</p>
          <div className="flex gap-6 text-xs text-gray-400 font-bold uppercase tracking-widest">
            <Link href="#" className="hover:text-brand-600">Privacy</Link>
            <Link href="#" className="hover:text-brand-600">Terms</Link>
            <Link href="#" className="hover:text-brand-600">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Step({ num, title, desc, icon: Icon }: { num: string; title: string; desc: string; icon: any }) {
  return (
    <div className="flex flex-col items-center text-center relative z-10 group">
      <div className="w-16 h-16 rounded-2xl bg-white shadow-xl border border-gray-100 flex items-center justify-center mb-6 text-brand-600 group-hover:scale-110 transition-transform duration-300">
        <Icon size={32} />
      </div>
      <span className="text-[10px] font-black text-brand-600 uppercase tracking-[0.2em] mb-2">{num}</span>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 font-medium leading-relaxed">{desc}</p>
    </div>
  )
}

function Feature({ title, desc, icon: Icon }: { title: string; desc: string; icon: any }) {
  return (
    <div className="space-y-3">
      <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
        <Icon size={20} />
      </div>
      <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
      <p className="text-xs text-gray-500 font-medium leading-relaxed">{desc}</p>
    </div>
  )
}

function SparkleIcon() {
  return <Sparkles size={14} />
}

function PlusIcon(props: any) { return <Zap {...props} /> }
function BotIcon(props: any) { return <Brain {...props} /> }
function CalendarIcon(props: any) { return <Calendar {...props} /> }
import { Sparkles } from 'lucide-react'
