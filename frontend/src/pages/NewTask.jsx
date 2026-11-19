import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { chatApi, analyzeApi, summarizeApi, reportApi } from '../services/api'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Zap,
  Search,
  Layers,
  FileText,
  Bot,
  Loader,
  Copy,
  CheckCheck,
  ChevronDown,
  Sparkles,
} from 'lucide-react'

// const TABS = [
//   { id:'analyze',   label:'Analyze',   icon: Search,    color:'#6c63ff', desc:'Deep-dive any topic using Research + Documentation agents' },
//   { id:'summarize', label:'Summarize', icon: Layers,    color:'#38bdf8', desc:'Paste content and get it condensed into clear insights' },
//   { id:'report',    label:'Report',    icon: FileText,  color:'#a78bfa', desc:'Generate a formal professional report on any topic' },
//   { id:'chat',      label:'AI Chat',   icon: Bot,       color:'#34d399', desc:'Free-form request – coordinator auto-routes to best agents' },
// ]

const TABS = [
  {
    id: 'auto',
    label: 'Auto',
    icon: Sparkles,
    color: '#f472b6',
    desc: 'Describe your task in natural language. The Coordinator Agent chooses the best workflow automatically.'
  },
  {
    id: 'analyze',
    label: 'Analyze',
    icon: Search,
    color: '#6c63ff',
    desc: 'Research a topic, summarize findings, and create structured documentation.'
  },
  {
    id: 'summarize',
    label: 'Summarize',
    icon: Layers,
    color: '#38bdf8',
    desc: 'Paste content and get it condensed into clear insights.'
  },
  {
    id: 'report',
    label: 'Report',
    icon: FileText,
    color: '#a78bfa',
    desc: 'Generate a formal professional report on any topic.'
  },
  {
    id: 'chat',
    label: 'AI Chat',
    icon: Bot,
    color: '#34d399',
    desc: 'Chat with the AI and let the coordinator route your request.'
  },
]

export default function NewTask() {
  const [sp, setSp] = useSearchParams()
  const nav = useNavigate()
  // const [tab, setTab] = useState(sp.get('tab') || 'analyze')
  const [tab, setTab] = useState(sp.get('tab') || 'auto')
  const [input, setInput]   = useState('')
  const [format, setFormat] = useState('bullet')
  const [depth, setDepth]   = useState('standard')
  const [collection, setCollection] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)
  const [error, setError]     = useState(null)
  const [copied, setCopied]   = useState(false)
  const [taskId, setTaskId]   = useState(null)

  useEffect(() => { setSp({ tab }) }, [tab])

  const activeTab = TABS.find(t => t.id === tab)
  const Icon = activeTab.icon

  async function handleSubmit() {
    if (!input.trim()) return
    setLoading(true); setResult(null); setError(null)
    try {
      let res
      if (tab === 'auto')      res = await chatApi(input, collection || null)
      else if (tab === 'analyze')   res = await analyzeApi(input, depth, collection || null)
      else if (tab === 'summarize') res = await summarizeApi(input, format, collection || null)
      else if (tab === 'report')    res = await reportApi(input, null, collection || null)
      else if (tab === 'chat')      res = await chatApi(input, collection || null)
      setResult(res.data)
      setTaskId(res.data.task_id)
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function copyResult() {
    navigator.clipboard.writeText(result?.result || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const AGENT_COLORS = {
    CoordinatorAgent: '#f472b6',
    ResearchAgent: '#38bdf8',
    SummarizationAgent: '#a78bfa',
    DocumentationAgent: '#34d399',
    ReportAgent: '#fbbf24',
  }

  return (
    <div style={{ padding:'32px 28px', maxWidth:900, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom:28 }} className="animate-fade">
        <h1 style={{ fontSize:'1.5rem', fontWeight:800, marginBottom:6 }}>New Task</h1>
        <p style={{ color:'var(--text-muted)', fontSize:14 }}>
  Let the Coordinator Agent choose the right workflow, or select a mode manually.
</p>
      </div>

      {/* Tab Bar */}
      <div style={{
        display:'flex', gap:8, marginBottom:28,
        borderBottom:'1px solid var(--border)', paddingBottom:0,
        overflowX:'auto',
      }}>
        {TABS.map(t => {
          const TIcon = t.icon
          const active = tab === t.id
          return (
            <button key={t.id} onClick={() => { setTab(t.id); setResult(null); setError(null) }}
              style={{
                display:'flex', alignItems:'center', gap:7,
                padding:'10px 16px', borderRadius:'8px 8px 0 0',
                background: active ? 'var(--surface)' : 'transparent',
                border: active ? `1px solid var(--border)` : '1px solid transparent',
                borderBottom: active ? `2px solid ${t.color}` : '2px solid transparent',
                color: active ? t.color : 'var(--text-muted)',
                cursor:'pointer', fontSize:13, fontWeight: active ? 700 : 400,
                transition:'all .15s', whiteSpace:'nowrap',
              }}>
              <TIcon size={14} />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Description */}
      <div className="glass animate-fade" style={{
        padding:'14px 18px', borderRadius:'var(--radius)', marginBottom:22,
        borderLeft:`3px solid ${activeTab.color}`, animationDelay:'.05s',
        display:'flex', alignItems:'center', gap:12,
      }}>
        <Icon size={16} color={activeTab.color} />
        <span style={{ fontSize:13, color:'var(--text-muted)' }}>{activeTab.desc}</span>
      </div>

      {/* Input */}
      <div className="animate-fade" style={{ animationDelay:'.1s', marginBottom:16 }}>
        {tab === 'summarize' ? (
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Paste the content you want to summarize…"
            rows={8}
            style={{
              width:'100%', padding:'14px 16px',
              background:'var(--bg-2)', border:'1px solid var(--border)',
              borderRadius:'var(--radius)', color:'var(--text)',
              fontSize:14, fontFamily:'var(--font-body)',
              resize:'vertical', outline:'none',
              transition:'border-color .15s',
            }}
            onFocus={e => e.target.style.borderColor = activeTab.color}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        ) : (
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            // placeholder={
            //   tab === 'analyze'   ? 'e.g., Kubernetes deployment failures...' :
            //   tab === 'report'    ? 'e.g., Weekly infrastructure status...' :
            //                        'Ask me anything...'
            // }
            placeholder={
              tab === 'analyze'
                ? 'e.g., Kubernetes deployment failures...'
                : tab === 'report'
                ? 'e.g., Weekly infrastructure status...'
                : tab === 'summarize'
                ? 'Paste content to summarize...'
                : 'Describe what you want the AI agents to do...'
            }
            style={{
              width:'100%', padding:'14px 16px',
              background:'var(--bg-2)', border:'1px solid var(--border)',
              borderRadius:'var(--radius)', color:'var(--text)',
              fontSize:14, fontFamily:'var(--font-body)', outline:'none',
              transition:'border-color .15s',
            }}
            onFocus={e => e.target.style.borderColor = activeTab.color}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        )}
      </div>

      {/* Options Row */}
      <div className="animate-fade" style={{ display:'flex', gap:12, marginBottom:22, animationDelay:'.15s', flexWrap:'wrap' }}>
        {tab === 'summarize' && (
          <select value={format} onChange={e => setFormat(e.target.value)}
            style={{
              padding:'9px 14px', background:'var(--bg-2)', border:'1px solid var(--border)',
              borderRadius:'var(--radius-sm)', color:'var(--text)', fontSize:13, cursor:'pointer',
            }}>
            <option value="bullet">Bullet Points</option>
            <option value="paragraph">Paragraphs</option>
            <option value="executive">Executive Summary</option>
          </select>
        )}
        {tab === 'analyze' && (
          <select value={depth} onChange={e => setDepth(e.target.value)}
            style={{
              padding:'9px 14px', background:'var(--bg-2)', border:'1px solid var(--border)',
              borderRadius:'var(--radius-sm)', color:'var(--text)', fontSize:13, cursor:'pointer',
            }}>
            <option value="quick">Quick (2 agents)</option>
            <option value="standard">Standard (3 agents)</option>
            <option value="deep">Deep (4 agents)</option>
          </select>
        )}
        <input value={collection} onChange={e => setCollection(e.target.value)}
          placeholder="RAG collection (optional)"
          style={{ padding:'9px 14px', background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', color:'var(--text)', fontSize:13, minWidth:180 }} />

        <button onClick={handleSubmit} disabled={loading || !input.trim()}
          style={{
            padding:'10px 24px',
            background: loading || !input.trim() ? 'var(--surface)' : `linear-gradient(135deg, ${activeTab.color}, var(--accent-3))`,
            border:'none', borderRadius:'var(--radius-sm)',
            color: loading || !input.trim() ? 'var(--text-muted)' : '#fff',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            fontWeight:700, fontSize:14, display:'flex', alignItems:'center', gap:8,
            transition:'all .15s', fontFamily:'var(--font-body)',
          }}>
          {loading ? <><Loader size={14} className="animate-spin" /> Running…</> : <><Zap size={14} /> Run Task</>}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="animate-fade" style={{
          padding:'14px 18px', borderRadius:'var(--radius)',
          background:'rgba(248,113,113,.1)', border:'1px solid rgba(248,113,113,.3)',
          color:'#f87171', fontSize:13, marginBottom:20,
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="animate-fade" style={{ animationDelay:'0s' }}>
          {/* Meta bar */}
          <div style={{
            display:'flex', alignItems:'center', gap:12, marginBottom:14,
            flexWrap:'wrap',
          }}>
            <span style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>
              {Math.round(result.duration_ms)}ms
            </span>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {result.agents_used.map(a => (
                <span key={a} style={{
                  padding:'3px 9px', borderRadius:20,
                  background: `${AGENT_COLORS[a]}20`,
                  color: AGENT_COLORS[a] || 'var(--accent-2)',
                  fontSize:11, fontFamily:'var(--font-mono)', fontWeight:700,
                  border:`1px solid ${AGENT_COLORS[a]}40`,
                }}>
                  {a.replace('Agent','')}
                </span>
              ))}
            </div>
            <button onClick={copyResult} style={{
              marginLeft:'auto', padding:'5px 12px',
              background:'var(--surface)', border:'1px solid var(--border)',
              borderRadius:6, color:'var(--text-muted)', cursor:'pointer',
              fontSize:12, display:'flex', alignItems:'center', gap:5,
              transition:'all .15s',
            }}>
              {copied ? <><CheckCheck size={12} color="var(--success)" /> Copied</> : <><Copy size={12} /> Copy</>}
            </button>
            {taskId && (
              <button onClick={() => nav(`/task/${taskId}`)} style={{
                padding:'5px 12px', background:'none', border:'1px solid var(--border)',
                borderRadius:6, color:'var(--accent-2)', cursor:'pointer', fontSize:12,
              }}>
                View logs →
              </button>
            )}
          </div>

          {/* Output card */}
          <div className="glass" style={{
            padding:'24px 28px', borderRadius:'var(--radius)',
            borderTop:`3px solid ${activeTab.color}`,
          }}>
            <div className="markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {result.result}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
