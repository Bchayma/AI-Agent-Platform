import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getTaskApi, getLogsApi } from '../services/api'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ArrowLeft, CheckCircle, XCircle, Clock, Copy, CheckCheck } from 'lucide-react'
import { format } from 'date-fns'

const AGENT_COLORS = {
  CoordinatorAgent:    '#f472b6',
  ResearchAgent:       '#38bdf8',
  SummarizationAgent:  '#a78bfa',
  DocumentationAgent:  '#34d399',
  ReportAgent:         '#fbbf24',
}

export default function TaskDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const [task, setTask]   = useState(null)
  const [logs, setLogs]   = useState([])
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState('result')

  useEffect(() => {
    getTaskApi(id).then(r => setTask(r.data)).catch(console.error)
    getLogsApi(100, id).then(r => setLogs(r.data)).catch(console.error)
  }, [id])

  if (!task) return (
    <div style={{ padding:40, textAlign:'center', color:'var(--text-muted)', fontSize:14 }}>Loading…</div>
  )

  const status = {
    completed: { color:'#34d399', icon: CheckCircle },
    failed:    { color:'#f87171', icon: XCircle },
    running:   { color:'#fbbf24', icon: Clock },
  }[task.status] || { color:'var(--text-muted)', icon: Clock }
  const SIcon = status.icon

  function copy() {
    navigator.clipboard.writeText(task.result || '')
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ padding:'32px 28px', maxWidth:900, margin:'0 auto' }}>
      {/* Back */}
      <button onClick={() => nav(-1)} style={{
        background:'none', border:'none', color:'var(--text-muted)',
        cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', gap:6,
        marginBottom:24,
      }}>
        <ArrowLeft size={14} /> Back
      </button>

      {/* Header */}
      <div className="glass animate-fade" style={{ padding:'20px 24px', borderRadius:'var(--radius)', marginBottom:24 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
              <SIcon size={16} color={status.color} />
              <span style={{ fontWeight:700, color:status.color, textTransform:'uppercase', fontSize:12, fontFamily:'var(--font-mono)' }}>
                {task.status}
              </span>
              <span style={{
                padding:'3px 9px', borderRadius:20,
                background:'var(--surface)', color:'var(--text-muted)',
                fontSize:11, fontFamily:'var(--font-mono)',
              }}>
                {task.task_type}
              </span>
            </div>
            <p style={{ fontSize:14, color:'var(--text)', fontWeight:600, marginBottom:4 }}>{task.input_text}</p>
            <p style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>
              {task.task_id}
            </p>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:12, color:'var(--text-muted)' }}>
              {format(new Date(task.created_at), 'MMM d, yyyy HH:mm')}
            </div>
            {task.duration_ms && (
              <div style={{ fontSize:14, fontWeight:700, color:'var(--accent-3)', fontFamily:'var(--font-mono)', marginTop:4 }}>
                {Math.round(task.duration_ms)}ms
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:0, marginBottom:20, borderBottom:'1px solid var(--border)' }}>
        {['result','logs'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{
            padding:'9px 20px',
            background: activeTab === t ? 'var(--surface)' : 'transparent',
            border:'1px solid transparent',
            borderBottom: activeTab === t ? '2px solid var(--accent)' : '2px solid transparent',
            color: activeTab === t ? 'var(--accent-2)' : 'var(--text-muted)',
            cursor:'pointer', fontSize:13, fontWeight: activeTab === t ? 700 : 400,
            textTransform:'capitalize', transition:'all .15s',
          }}>
            {t} {t === 'logs' && `(${logs.length})`}
          </button>
        ))}
      </div>

      {activeTab === 'result' && (
        <div className="animate-fade">
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:12 }}>
            <button onClick={copy} style={{
              padding:'6px 14px', background:'var(--surface)', border:'1px solid var(--border)',
              borderRadius:6, color:'var(--text-muted)', cursor:'pointer',
              fontSize:12, display:'flex', alignItems:'center', gap:5,
            }}>
              {copied ? <><CheckCheck size={12} color="var(--success)" /> Copied</> : <><Copy size={12} /> Copy Result</>}
            </button>
          </div>
          <div className="glass" style={{ padding:'24px 28px', borderRadius:'var(--radius)' }}>
            {task.status === 'failed' ? (
              <div style={{ color:'var(--error)', fontSize:14 }}>{task.result}</div>
            ) : (
              <div className="markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{task.result || '…'}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="animate-fade" style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {logs.length === 0 ? (
            <div style={{ color:'var(--text-muted)', fontSize:14, padding:20 }}>No logs recorded</div>
          ) : logs.slice().reverse().map(log => {
            const ac = AGENT_COLORS[log.agent_name] || 'var(--accent)'
            return (
              <div key={log.id} className="glass" style={{
                padding:'10px 16px', borderRadius:8,
                display:'flex', alignItems:'flex-start', gap:12,
                borderLeft:`3px solid ${ac}`,
              }}>
                <span style={{
                  fontSize:10, fontFamily:'var(--font-mono)', color:ac,
                  fontWeight:700, flexShrink:0, marginTop:2, whiteSpace:'nowrap',
                }}>
                  {log.agent_name.replace('Agent','')}
                </span>
                <div style={{ flex:1 }}>
                  <span style={{ fontSize:12, fontWeight:600, color:'var(--text)', marginRight:10 }}>{log.action}</span>
                  {log.detail && <span style={{ fontSize:12, color:'var(--text-muted)' }}>{log.detail}</span>}
                </div>
                <span style={{ fontSize:10, color:'var(--text-dim)', fontFamily:'var(--font-mono)', flexShrink:0 }}>
                  {format(new Date(log.timestamp), 'HH:mm:ss')}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
