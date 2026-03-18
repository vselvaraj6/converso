'use client';
import { useState } from 'react';
import {
  Upload, FileText, BrainCircuit, Search, RefreshCcw, ChevronRight,
  CheckCircle, XCircle, HelpCircle,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AITrainingPage = () => {
  const [testQuestion, setTestQuestion] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = ['overview', 'datasets', 'intents', 'testing', 'analytics'];

  const metrics = [
    { label: 'Intent Recognition', value: 93, delta: '+2.5% from last training' },
    { label: 'Entity Extraction', value: 87, delta: '+1.2% from last training' },
    { label: 'Response Accuracy', value: 91, delta: '+3.7% from last training' },
    { label: 'Lead Qualification', value: 89, delta: '+0.8% from last training' },
  ];

  const recentActivity = [
    { type: 'dataset', title: 'Uploaded new training dataset', description: 'pricing_questions.csv with 187 examples', time: '2 days ago', user: 'Sarah Smith' },
    { type: 'intent', title: 'Created new intent', description: 'appointment_reschedule with 24 training examples', time: '3 days ago', user: 'John Doe' },
    { type: 'training', title: 'Model training completed', description: 'Overall accuracy improved by 2.3%', time: '1 week ago', user: 'System' },
    { type: 'review', title: 'Reviewed misclassified intents', description: 'Fixed 18 mislabeled examples', time: '1 week ago', user: 'Emma Wilson' },
  ];

  const datasets = [
    { name: 'product_questions.csv', type: 'Questions', size: '267 KB', examples: 532, date: 'Jul 15, 2023', status: 'processed' },
    { name: 'pricing_questions.csv', type: 'Questions', size: '95 KB', examples: 187, date: 'Jul 12, 2023', status: 'processed' },
    { name: 'customer_conversations.json', type: 'Conversations', size: '1.2 MB', examples: 843, date: 'Jul 5, 2023', status: 'processed' },
    { name: 'appointment_reschedule.csv', type: 'Questions', size: '34 KB', examples: 78, date: 'Jun 29, 2023', status: 'processed' },
    { name: 'support_queries.csv', type: 'Questions', size: '450 KB', examples: 612, date: 'Jun 20, 2023', status: 'processed' },
  ];

  const intentErrors = [
    { query: 'I need to move my appointment to next week', predicted: 'cancel_appointment', should_be: 'reschedule_appointment', confidence: 0.65, type: 'incorrect' },
    { query: "What's your refund policy?", predicted: 'pricing_question', should_be: 'refund_policy', confidence: 0.72, type: 'incorrect' },
    { query: 'Do you have enterprise plans?', predicted: '', should_be: 'pricing_question', confidence: 0.48, type: 'confidence' },
    { query: 'I want to talk to someone about your product', predicted: 'contact_sales', should_be: ['contact_sales', 'product_info'], confidence: 0.69, type: 'ambiguous' },
    { query: "I'm having trouble with your website", predicted: 'technical_issue', should_be: 'support_request', confidence: 0.67, type: 'incorrect' },
  ];

  const topIntents = [
    { intent: 'pricing_question', count: 1253, percent: 92 },
    { intent: 'product_info', count: 1087, percent: 87 },
    { intent: 'book_demo', count: 845, percent: 79 },
    { intent: 'support_request', count: 732, percent: 71 },
    { intent: 'contact_sales', count: 625, percent: 64 },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-10 font-sans pb-20">
      {/* Header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 text-brand-400 text-xs font-black uppercase tracking-widest mb-4">
          <BrainCircuit className="w-3 h-3" />
          AI Engine
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tight leading-none mb-3">
              AI Training Console
            </h1>
            <p className="text-sm font-medium text-slate-500">Fine-tune your AI assistant's knowledge and behavior.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-secondary flex items-center gap-2">
              <RefreshCcw className="w-4 h-4" />
              Retrain Model
            </button>
            <button className="btn-primary flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload Data
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

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Model Performance */}
            <div className="card p-6 border-none shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-brand-500 to-indigo-600" />
                <h2 className="text-base font-black uppercase tracking-widest text-[var(--text-primary)]">Model Performance</h2>
              </div>
              <p className="text-xs text-slate-500 font-medium mb-6">Overall AI assistant performance metrics</p>
              <div className="grid grid-cols-2 gap-6">
                {metrics.map(metric => (
                  <div key={metric.label} className="space-y-2">
                    <div className="text-xs font-black uppercase tracking-widest text-slate-400">{metric.label}</div>
                    <div className="text-2xl font-black text-[var(--text-primary)]">{metric.value}%</div>
                    <div className="w-full h-2 rounded-full bg-[var(--surface-subtle)]">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-brand-500 to-indigo-600 transition-all duration-700"
                        style={{ width: `${metric.value}%` }}
                      />
                    </div>
                    <div className="text-[10px] font-medium text-slate-500">{metric.delta}</div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 rounded-2xl" style={{ backgroundColor: 'var(--surface-subtle)' }}>
                <div className="flex justify-between text-xs font-bold text-[var(--text-primary)]">
                  <span>Completed on Jul 15, 2023</span>
                  <span className="text-brand-400 cursor-pointer hover:text-brand-300 transition-colors">View log</span>
                </div>
                <div className="text-[10px] text-slate-500 font-medium mt-1">
                  12,453 training examples &bull; 35 intents &bull; 89 entities
                </div>
              </div>
            </div>

            {/* Quick Test */}
            <div className="card p-6 border-none shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-brand-500 to-indigo-600" />
                <h2 className="text-base font-black uppercase tracking-widest text-[var(--text-primary)]">Quick Test</h2>
              </div>
              <p className="text-xs text-slate-500 font-medium mb-4">Test your AI with sample questions</p>
              <div className="flex gap-2 mb-4">
                <input
                  className="input"
                  placeholder="Type a test question..."
                  value={testQuestion}
                  onChange={e => setTestQuestion(e.target.value)}
                />
                <button className="btn-primary px-5" disabled={!testQuestion.trim()}>Test</button>
              </div>
              <div className="p-4 rounded-2xl mb-4" style={{ backgroundColor: 'var(--surface-subtle)' }}>
                <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Sample Questions</div>
                <div className="space-y-2">
                  {['What are your pricing plans?', 'How do I book a demo?', 'Do you offer a free trial?'].map(q => (
                    <button
                      key={q}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium text-[var(--text-primary)] hover:bg-brand-500/5 transition-colors text-left"
                      onClick={() => setTestQuestion(q)}
                    >
                      <span>{q}</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="border-2 border-dashed rounded-2xl p-8 text-center" style={{ borderColor: 'var(--divider)' }}>
                <p className="text-xs font-medium text-slate-400">AI responses will appear here</p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card p-6 border-none shadow-2xl md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-brand-500 to-indigo-600" />
                <h2 className="text-base font-black uppercase tracking-widest text-[var(--text-primary)]">Recent Training Activity</h2>
              </div>
              <p className="text-xs text-slate-500 font-medium mb-6">Latest AI model improvements</p>
              <div className="space-y-4">
                {recentActivity.map((activity, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-2xl" style={{ backgroundColor: 'var(--surface-subtle)' }}>
                    <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                      {activity.type === 'dataset' && <Upload className="w-5 h-5 text-brand-400" />}
                      {activity.type === 'intent' && <FileText className="w-5 h-5 text-brand-400" />}
                      {activity.type === 'training' && <BrainCircuit className="w-5 h-5 text-brand-400" />}
                      {activity.type === 'review' && <Search className="w-5 h-5 text-brand-400" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-black text-sm text-[var(--text-primary)]">{activity.title}</div>
                      <div className="text-xs font-medium text-slate-500 mt-0.5">{activity.description}</div>
                      <div className="flex gap-2 mt-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span>{activity.time}</span>
                        <span>&bull;</span>
                        <span>{activity.user}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Datasets Tab */}
      {activeTab === 'datasets' && (
        <div className="card p-6 border-none shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-brand-500 to-indigo-600" />
                <h2 className="text-base font-black uppercase tracking-widest text-[var(--text-primary)]">Training Datasets</h2>
              </div>
              <p className="text-xs font-medium text-slate-500 ml-4">Manage and upload conversation datasets</p>
            </div>
            <button className="btn-primary flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload Dataset
            </button>
          </div>

          <div className="grid grid-cols-12 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 rounded-xl mb-2" style={{ backgroundColor: 'var(--surface-subtle)' }}>
            <div className="col-span-4">Dataset Name</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2">Size</div>
            <div className="col-span-2">Uploaded</div>
            <div className="col-span-2">Status</div>
          </div>

          <div className="space-y-2">
            {datasets.map((dataset, i) => (
              <div key={i} className="card p-5 border-none shadow-2xl group relative overflow-hidden hover:-translate-y-0.5 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-500 to-indigo-600 opacity-0 group-hover:opacity-5 transition-opacity" />
                <div className="grid grid-cols-12 items-center relative">
                  <div className="col-span-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-brand-400 flex-shrink-0" />
                      <div>
                        <div className="font-black text-xs text-[var(--text-primary)]">{dataset.name}</div>
                        <div className="text-[10px] font-medium text-slate-400">{dataset.examples} examples</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-black bg-brand-500/10 text-brand-400">{dataset.type}</span>
                  </div>
                  <div className="col-span-2 text-xs font-medium text-slate-500">{dataset.size}</div>
                  <div className="col-span-2 text-xs font-medium text-slate-500">{dataset.date}</div>
                  <div className="col-span-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-400">
                      {dataset.status === 'processed' ? 'Processed' : 'Processing'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Intents Tab */}
      {activeTab === 'intents' && (
        <div className="card p-6 border-none shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-brand-500 to-indigo-600" />
            <h2 className="text-base font-black uppercase tracking-widest text-[var(--text-primary)]">Misclassified Intents</h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mb-6">Review and fix AI misunderstandings</p>

          <div className="flex items-center gap-3 mb-6">
            <Select defaultValue="all">
              <SelectTrigger className="input h-auto" style={{ minWidth: 180 }}><SelectValue placeholder="Filter by type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All errors</SelectItem>
                <SelectItem value="confidence">Low confidence</SelectItem>
                <SelectItem value="incorrect">Incorrect classification</SelectItem>
                <SelectItem value="ambiguous">Ambiguous intent</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input className="input pl-11" placeholder="Search errors..." />
            </div>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {intentErrors.map((error, i) => (
              <div key={i} className="card p-5 border-none shadow-2xl">
                <div className="flex justify-between items-start">
                  <div className="flex-1 mr-4">
                    <div className="font-black text-sm text-[var(--text-primary)] mb-2">"{error.query}"</div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {error.type === 'confidence' && (
                        <>
                          <span className="text-slate-500 font-medium">Low confidence prediction</span>
                          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-500/10 text-amber-400">
                            {Math.round(error.confidence * 100)}%
                          </span>
                        </>
                      )}
                      {error.type === 'incorrect' && (
                        <>
                          <span className="text-slate-500 font-medium">Predicted:</span>
                          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-red-500/10 text-red-400">{error.predicted}</span>
                          <span className="text-slate-500 font-medium">Should be:</span>
                          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-400">{error.should_be as string}</span>
                        </>
                      )}
                      {error.type === 'ambiguous' && (
                        <>
                          <span className="text-slate-500 font-medium">Ambiguous — could be:</span>
                          {Array.isArray(error.should_be) && error.should_be.map((intent, j) => (
                            <span key={j} className="px-2.5 py-1 rounded-full text-xs font-black bg-brand-500/10 text-brand-400">{intent}</span>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button className="w-9 h-9 rounded-xl flex items-center justify-center text-emerald-400 hover:bg-emerald-500/10 transition-colors">
                      <CheckCircle className="w-5 h-5" />
                    </button>
                    <button className="w-9 h-9 rounded-xl flex items-center justify-center text-red-400 hover:bg-red-500/10 transition-colors">
                      <XCircle className="w-5 h-5" />
                    </button>
                    <button className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-500/10 transition-colors">
                      <HelpCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Testing Tab */}
      {activeTab === 'testing' && (
        <div className="card p-6 border-none shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-brand-500 to-indigo-600" />
            <h2 className="text-base font-black uppercase tracking-widest text-[var(--text-primary)]">Sandbox Testing</h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mb-6">Test your AI in sandbox mode</p>
          <div className="flex gap-3 mb-6">
            <Select defaultValue="default">
              <SelectTrigger className="input h-auto" style={{ minWidth: 180 }}><SelectValue placeholder="Select model" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Production Model</SelectItem>
                <SelectItem value="beta">Beta Model (v2.1)</SelectItem>
                <SelectItem value="experimental">Experimental Build</SelectItem>
              </SelectContent>
            </Select>
            <input
              className="input flex-1"
              placeholder="Ask a test question..."
              value={testQuestion}
              onChange={e => setTestQuestion(e.target.value)}
            />
            <button className="btn-primary px-5" disabled={!testQuestion.trim()}>Test</button>
            <button className="btn-secondary px-4">
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-2xl border min-h-[300px]" style={{ borderColor: 'var(--divider)', backgroundColor: 'var(--surface-subtle)' }}>
              <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">AI Response</div>
              <div className="rounded-xl p-4 min-h-[240px] flex items-center justify-center" style={{ backgroundColor: 'var(--surface)' }}>
                <p className="text-xs font-medium text-slate-400 italic text-center">Test responses will appear here</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl border min-h-[300px]" style={{ borderColor: 'var(--divider)', backgroundColor: 'var(--surface-subtle)' }}>
              <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Analysis</div>
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-black text-[var(--text-primary)] mb-2">Detected Intent</div>
                  <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: 'var(--surface)' }}>
                    <span className="text-xs font-medium text-slate-400">Not yet analyzed</span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-black bg-slate-500/10 text-slate-400">0%</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-black text-[var(--text-primary)] mb-2">Entities Extracted</div>
                  <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--surface)' }}>
                    <span className="text-xs font-medium text-slate-400">None detected</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-black text-[var(--text-primary)] mb-2">Response Confidence</div>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                    <span>Confidence Score</span>
                    <span>0%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--surface)]">
                    <div className="h-2 rounded-full bg-gradient-to-r from-brand-500 to-indigo-600 transition-all duration-700" style={{ width: '0%' }} />
                  </div>
                </div>
                <div>
                  <div className="text-xs font-black text-[var(--text-primary)] mb-2">Processing Time</div>
                  <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--surface)' }}>
                    <span className="text-xs font-medium text-slate-400">0 ms</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button className="btn-secondary flex items-center gap-2">Save as Training Example</button>
            <button className="btn-secondary flex items-center gap-2">Report Issue</button>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="card p-6 border-none shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-brand-500 to-indigo-600" />
                <h2 className="text-base font-black uppercase tracking-widest text-[var(--text-primary)]">Training Progress</h2>
              </div>
              <p className="text-xs text-slate-500 font-medium mb-4">Model improvement over time</p>
              <div className="card p-16 border-dashed border-2 bg-transparent shadow-none text-center">
                <div className="w-12 h-12 rounded-full bg-[var(--surface-subtle)] flex items-center justify-center mx-auto mb-3">
                  <BrainCircuit className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-400">Chart will be displayed here</p>
              </div>
            </div>
            <div className="card p-6 border-none shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-brand-500 to-indigo-600" />
                <h2 className="text-base font-black uppercase tracking-widest text-[var(--text-primary)]">Intent Distribution</h2>
              </div>
              <p className="text-xs text-slate-500 font-medium mb-4">Most common user intents</p>
              <div className="card p-16 border-dashed border-2 bg-transparent shadow-none text-center">
                <div className="w-12 h-12 rounded-full bg-[var(--surface-subtle)] flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-400">Chart will be displayed here</p>
              </div>
            </div>
          </div>

          <div className="card p-6 border-none shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 rounded-full bg-gradient-to-b from-brand-500 to-indigo-600" />
              <h2 className="text-base font-black uppercase tracking-widest text-[var(--text-primary)]">Training Data Summary</h2>
            </div>
            <p className="text-xs text-slate-500 font-medium mb-6">Overview of your AI training data</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {[
                { label: 'Total Examples', value: '12,453', delta: '+342 this month' },
                { label: 'Unique Intents', value: '35', delta: '+2 this month' },
                { label: 'Entity Types', value: '89', delta: '+5 this month' },
              ].map(stat => (
                <div key={stat.label} className="card p-6 border-none shadow-2xl">
                  <p className="label-text mb-1">{stat.label.toUpperCase()}</p>
                  <p className="text-3xl font-black text-[var(--text-primary)] mb-1">{stat.value}</p>
                  <p className="text-xs font-medium text-slate-500">{stat.delta}</p>
                </div>
              ))}
            </div>

            <div>
              <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Top 5 Intents by Training Examples</div>
              <div className="space-y-4">
                {topIntents.map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs font-bold text-[var(--text-primary)] mb-1.5">
                      <span>{item.intent}</span>
                      <span className="text-slate-500">{item.count} examples</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[var(--surface-subtle)]">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-brand-500 to-indigo-600 transition-all duration-700"
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AITrainingPage;
